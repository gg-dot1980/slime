'use strict';
// Compare the fatal 89→102 transition with every visible capture in the Grow48 win.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
const html=fs.readFileSync(path.join(__dirname,'../ocr-grow48.html'),'utf8');
assert.equal(hash(html),'c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253');
const data=fs.readFileSync(process.argv[2]);
assert.equal(hash(data),'fc3a7043bf7a964f782eddcc2e1274537aa96d0b713c06d57e54853537dab173');
const rows=data.toString().trimEnd().split('\n').map(JSON.parse);
let now,table;
const code=html.slice(html.indexOf('function chaseEvidence46('),html.indexOf('let totals46='));
const hook='const target = chosen.target && {...chosen.target};';
assert.equal(code.split(hook).length,2);
const plan=new Function('performance','capture',code.replace(hook,'capture(safe);\n'+hook)+'\nreturn planHunt47;')(
 {now:()=>now}, safe=>{table=safe;});
function measure(s,prior){
 const u=s.planInput, expected=structuredClone(s.planOutput);
 delete expected.wallTracking47.appliedCounts;delete expected.tracking46.appliedCounts;
 now=s.decisionStartedAt;
 const d=plan(u.objects,u.hud,u.map,u.speed,u.velocity,u.heading,'v2.22',expected.tracking46.observedAt,expected.tracking46.npcToast);
 assert.deepEqual(JSON.parse(JSON.stringify(d)),expected);
 const kind=t=>!t?'none':t.mapOnly?'minimap':t.npc?'body':'food';
 const describe=p=>p&&({first:p.first,second:p.second,gain:p.gain,gap:p.clearance,score:p.score,target:kind(p.target),targetX:p.target?.x,targetY:p.target?.y,targetR:p.target?.r});
 return {size:u.hud,chosen:describe(d),safeHeadings:new Set(table.map(p=>p.first)).size,
         previousHeadingOption:describe(table.find(p=>p.first===prior)),immune:d.immune};
}
const details=[];
for(const g of rows.filter(r=>r.type==='result'&&r.version==='v2.22')){
 const snapshots=new Map(rows.filter(r=>r.type==='sample'&&r.id===g.id).map(r=>[r.snapshot.recordAt,r.snapshot]));
 for(const s of g.traceTail)snapshots.set(s.recordAt,s);
 const ss=[...snapshots.values()].sort((a,b)=>a.recordAt-b.recordAt);
 for(let i=1;i<ss.length;i++){
  const a=ss[i-1],b=ss[i];
  if(a.planOutput.tracking46.npcToast||!b.planOutput.tracking46.npcToast||b.hud<=a.hud)continue;
  if(g.outcome!=='win' && !(a.hud===89 && b.hud===102 && b.recordAt-a.recordAt<150))continue;
  details.push({id:g.id,outcome:g.outcome,dt:b.recordAt-a.recordAt,before:measure(a,a.planOutput.first),after:measure(b,a.planOutput.first)});
 }
}
assert.equal(details.filter(d=>d.outcome==='death').length,1);
assert.equal(details.filter(d=>d.outcome==='win').length,4);
fs.writeFileSync(process.argv[3],JSON.stringify(details,null,2)+'\n');
