'use strict';
// node replay-routes.cjs <private Grow48 exploration ledger> <private output>
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
function read(file, hash) {
  const bytes = fs.readFileSync(file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash);
  return bytes.toString();
}
const html = read(path.join(__dirname,'../ocr-grow48.html'),'c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253');
const rows = read(process.argv[2],'fc3a7043bf7a964f782eddcc2e1274537aa96d0b713c06d57e54853537dab173').trimEnd().split('\n').map(JSON.parse);
const code = html.slice(html.indexOf('function chaseEvidence46('),html.indexOf('let totals46='));
// Record the visible object responsible for each minimum without changing scores.
const traced = code.replace('const picked = new Set();','const picked = new Set(); let limiting=null;')
  .replace('if (t <= 1.6) clearance = Math.min(clearance, gap);',
    'if(t<=1.6 && gap<clearance) limiting=h; if (t <= 1.6) clearance = Math.min(clearance, gap);')
  .replace('endX: x, endY: y, penalty46, wall47','endX: x, endY: y, penalty46, wall47, limiting');
const hook = 'const target = chosen.target && {...chosen.target};';
assert.equal(code.split(hook).length,2);
let table, clock;
const plan = new Function('performance','capture',traced.replace(hook,
  'capture(paths, safe, chosen, startHazardGap, localHazards, r, map);\n'+hook)+'\nreturn planHunt47;')(
  {now:()=>clock}, (paths,safe,chosen,current,hazards,r,map)=>{
    assert.equal(paths.length,64);
    const options = Array.from({length:8},(_,first)=>{
      const all = paths.filter(p=>p.first===first);
      assert.equal(new Set(all.map(p=>p.second)).size,8);
      const legal = all.filter(p=>p.wallOK);
      const feasible = all.filter(p=>safe.includes(p));
      const straight = all.find(p=>p.first===p.second);
      return {first,bounded:legal.length,safe:feasible.length,straightSafe:safe.includes(straight),
        straightGap:straight.clearance,straightWallOK:straight.wallOK,
        bestGap:legal.length?Math.max(...legal.map(p=>p.clearance)):null,
        safeBestGain:feasible.length?Math.max(...feasible.map(p=>p.gain)):null};
    });
    const alternatives=safe.filter(p=>p.first!==chosen.first && p.gain>=chosen.gain && p.clearance>chosen.clearance);
    const hard=hazards.filter(h=>h.hard);
    const nowLim=hard.find(h=>Math.abs(Math.hypot(h.x,h.y)-.72*(r+h.upper)-h.buffer-current)<1e-6);
    const describe=h=>h?{x:h.x,y:h.y,r:h.r,upper:h.upper,mapOnly:h.mapOnly,clipped:h.clipped,vx:h.vx,vy:h.vy}:null;
    table={player:[map.player.x/map.width*10400,map.player.y/map.height*7200],objects:hard.map(describe),limiting:describe(chosen.limiting),nowLim:describe(nowLim),current,options,saferWithEqualOrGreaterGain:alternatives.length};
  });
const games=rows.filter(r=>r.version==='v2.22' && r.outcome==='death');
assert.equal(games.length,3);
const details=[];
for(const game of games){
  const samples=[...new Map(rows.filter(r=>r.type==='sample' && r.id===game.id).map(r=>[r.snapshot.recordAt,r.snapshot])).values()];
  for(const s of samples.filter(s=>samples.at(-1).recordAt-s.recordAt<=5000)){
    const u=s.planInput,expected=structuredClone(s.planOutput);
    delete expected.tracking46.appliedCounts;
    delete expected.wallTracking47.appliedCounts;
    clock=s.decisionStartedAt; table=null;
    assert(!s.diagnosticTruncated);
    const actual=plan(u.objects,u.hud,u.map,u.speed,u.velocity,u.heading,'v2.22',expected.tracking46.observedAt,expected.tracking46.npcToast);
    delete actual.limiting; assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected);
    assert(table);
    const own=table.options[actual.first],other=table.options.filter(o=>o.first!==actual.first);
    details.push({game:game.id,age:(samples.at(-1).recordAt-s.recordAt)/1000,remaining:s.hudTime,
      chosen:[actual.first,actual.second],speed:u.speed,velocity:u.velocity,gap:actual.clearance,gain:actual.gain,reason:actual.reason,
      safeHeadings:table.options.filter(o=>o.safe).length,straightSafe:own.straightSafe,
      otherStraightSafe:other.filter(o=>o.straightSafe).length,...table});
  }
}
fs.writeFileSync(process.argv[3],JSON.stringify(details,null,2)+'\n');
for(const game of games){
  const part=details.filter(d=>d.game===game.id);
  console.log(JSON.stringify(part.map(d=>[+d.age.toFixed(1),d.safeHeadings,Math.round(d.gap),Math.round(d.current),
    d.reason,d.straightSafe,d.otherStraightSafe,d.saferWithEqualOrGreaterGain])));
}
const mismatches=[];
for(let i=1;i<details.length;i++){
  const a=details[i-1], b=details[i];
  if(a.game!==b.game || b.current>=a.gap) continue;
  const dt=a.age-b.age, q=b.nowLim;
  const delta=b.player.map((pos,k)=>pos-a.player[k]);
  const distances=a.objects.map(h=>({h,error:Math.hypot(h.x+h.vx*dt-delta[0]-q.x,h.y+h.vy*dt-delta[1]-q.y)}))
    .sort((left,right)=>left.error-right.error);
  assert(distances.length>=2);
  const projected=[0,0], velocity=[a.velocity.x,a.velocity.y];
  for(let step=0;step*.1<dt;step++){
    const direction=a.chosen[step<6?0:1]*Math.PI/4;
    const target=[Math.cos(direction),Math.sin(direction)];
    for(let k=0;k<2;k++){
      velocity[k]+=(target[k]*a.speed-velocity[k])*(1-Math.exp(-.42));
      projected[k]+=velocity[k]*Math.min(.1,dt-step*.1);
    }
  }
  mismatches.push({game:a.game,drop:a.gap-b.current,delta,projected,
    translationError:Math.hypot(projected[0]-delta[0],projected[1]-delta[1]),
    priorLimiter:a.limiting,currentLimiter:q,closest:distances.slice(0,2)});
}
assert.equal(mismatches.length,3);
if(process.argv[4]) fs.writeFileSync(process.argv[4],JSON.stringify(mismatches,null,2)+'\n');
