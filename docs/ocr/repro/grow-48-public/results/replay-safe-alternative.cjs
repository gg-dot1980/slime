'use strict';
// Is there a safer first move with the same predicted food gain and wall margin?
// Retain only alternatives that do not sacrifice any of those quantities.
const fs=require('node:fs'), assert=require('node:assert/strict'), path=require('node:path');
const hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
let now, alternate;
const html=fs.readFileSync(path.join(__dirname,'../ocr-grow48.html'),'utf8');
assert.equal(hash(html),'c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253');
const code=html.slice(html.indexOf('function chaseEvidence46('),html.indexOf('let totals46='));
const hook='const target = chosen.target && {...chosen.target};';
assert.equal(code.split(hook).length,2);
const plan=new Function('performance','examine',code.replace(hook,'examine(safe, chosen, wallDistances47, r);\n'+hook)+'\nreturn planHunt47;')(
 {now:()=>now},(safe,chosen,walls,r)=>{
   alternate=chosen;
   if(!safe.length || !walls || Math.min(...walls)-r>=600) return;
   const better=safe.filter(p=>p.first!==chosen.first && p.clearance>chosen.clearance &&
     p.gain>=chosen.gain && p.discountedGain>=chosen.discountedGain && p.immediateGap>=chosen.immediateGap &&
     Number.isFinite(p.wall47?.min) && p.wall47.min>=chosen.wall47.min);
   // Preserve the frozen controller's ranking among admissible alternatives.
   if(better.length) alternate=better[0];
 });
const review=[];
for(const [i,file] of process.argv.slice(2,4).entries()){
 const data=fs.readFileSync(file);
 assert.equal(hash(data),['ec83b24dfaf96441ef74e1eca86db4d5a38388c98f76940fd472eab12895fe4e','fc3a7043bf7a964f782eddcc2e1274537aa96d0b713c06d57e54853537dab173'][i]);
 const rows=data.toString().trimEnd().split('\n').map(JSON.parse);
 for(const g of rows.filter(r=>r.version==='v2.22' && r.outcome===(i?'death':'deadline'))){
  const samples=[...new Map(rows.filter(r=>r.type==='sample' && r.id===g.id).map(r=>[r.snapshot.recordAt,r.snapshot])).values()];
  for(const s of samples){
   const u=s.planInput;now=s.decisionStartedAt;alternate=null;
   const d=plan(u.objects,u.hud,u.map,u.speed,u.velocity,u.heading,'v2.22',s.planOutput.tracking46.observedAt,s.planOutput.tracking46.npcToast);
   assert(alternate);
   if(i) assert.deepEqual([d.first,d.second,d.clearance],[s.planOutput.first,s.planOutput.second,s.planOutput.clearance]);
   review.push({id:g.id,age:(samples.at(-1).recordAt-s.recordAt)/1000,changed:d.first!==alternate.first,
    productive:d.gain>0&&!d.escaping,gainDelta:alternate.gain-d.gain,gapDelta:alternate.clearance-d.clearance});
  }
 }
}
fs.writeFileSync(process.argv[4],JSON.stringify(review));
for(const id of new Set(review.map(r=>r.id))){
 const g=review.filter(r=>r.id===id), productive=g.filter(r=>r.productive);
 console.log([g.length,productive.length,productive.filter(r=>!r.changed).length,g.filter(r=>r.changed).length,
 g.filter(r=>r.changed && r.age>=1 && r.age<=5).map(r=>Math.round(r.gapDelta))]);
}
