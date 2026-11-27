'use strict';
// Arguments: Grow48 ledger, private replay-threat samples, private detail output.
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
const selected=JSON.parse(fs.readFileSync(process.argv[3])).filter(d=>d.id.startsWith('grow48-') && d.changed);
assert.equal(selected.length,24);
const raw=fs.readFileSync(process.argv[2]);
assert.equal(hash(raw),'fc3a7043bf7a964f782eddcc2e1274537aa96d0b713c06d57e54853537dab173');
const rows=raw.toString().trimEnd().split('\n').map(JSON.parse);
let now;
function tracedPlan(version,sha) {
  const html=fs.readFileSync(path.join(__dirname,'../../grow-'+version+'-public/ocr-grow'+version+'.html'),'utf8');
  assert.equal(hash(html),sha);
  let code=html.slice(html.indexOf('function chaseEvidence46('),html.indexOf('let totals46='));
  function edit(old,add) {
    assert.equal(code.split(old).length,2);
    code=code.replace(old,()=>add);
  }
  edit('const picked = new Set();','const picked = new Set(); let limiting=null;');
  edit('if (t <= 1.6) clearance = Math.min(clearance, gap);',
       'if(t<=1.6 && gap<clearance) limiting=h; if (t <= 1.6) clearance = Math.min(clearance, gap);');
  edit('endX: x, endY: y, penalty46, wall47','endX: x, endY: y, penalty46, wall47, limiting');
  return new Function('performance',code+'\nreturn planHunt47;')({now:()=>now});
}
const plans=[tracedPlan(48,'c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253'),tracedPlan(47,'a333fd5ba52c2cbb4c6eb17fde85f5e53c9a98924a61440fe606ccb8fca27fee')];
const details=[];
for(const d of selected) {
  const s=rows.find(r=>r.type==='sample' && r.id===d.id && r.snapshot.recordAt===d.at).snapshot;
  const u=s.planInput;
  now=s.decisionStartedAt;
  const trigger=u.objects.filter(o=>o.npc && (o.isRed||o.r>(u.hud+.5)*1.08) && (o.vx!==0||o.vy!==0) &&
    o.x*(o.vx-u.velocity.x)+o.y*(o.vy-u.velocity.y)<0);
  assert(trigger.length);
  const routes=plans.map((p,i)=>{
    const v=p(u.objects,u.hud,u.map,u.speed,u.velocity,u.heading,'v2.22',s.planOutput.tracking46.observedAt,s.planOutput.tracking46.npcToast);
    assert.equal(v.first,d.first[i]);assert.equal(v.clearance,d.clearance[i]);
    const h=v.limiting;
    const match=o=>h && !h.mapOnly && o.x===h.x && o.y===h.y && o.r===h.r;
    return {gap:v.clearance,kind:!h?'none':h.mapOnly?'map':'body',matching:trigger.some(match),firstTriggerMatches:!!match(trigger[0]),limiter:h && [h.x,h.y,h.r],triggerCount:trigger.length};
  });
  details.push({id:d.id,age:d.age,routes});
}
fs.writeFileSync(process.argv[4],JSON.stringify(details));
for(const set of [details,details.filter(d=>d.age<=5)]) {
 console.log(JSON.stringify({n:set.length,nearMatch:set.filter(d=>d.routes[0].matching).length,farMatch:set.filter(d=>d.routes[1].matching).length,
 nearMap:set.filter(d=>d.routes[0].kind==='map').length,farMap:set.filter(d=>d.routes[1].kind==='map').length,
 examples:set.filter(d=>d.age<=5).map(d=>({age:d.age,routes:d.routes.map(r=>[r.kind,r.matching,r.triggerCount,Math.round(r.gap)])}))}));
}
