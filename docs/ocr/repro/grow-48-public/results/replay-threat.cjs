'use strict';
// Usage: node replay-threat.cjs Grow47-ledger Grow48-ledger [private-output.json]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
function frozen(file, hash) {
  const bytes = fs.readFileSync(file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash);
  return bytes.toString();
}
const sources = ['a333fd5ba52c2cbb4c6eb17fde85f5e53c9a98924a61440fe606ccb8fca27fee','c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253'];
const ledgers = ['ec83b24dfaf96441ef74e1eca86db4d5a38388c98f76940fd472eab12895fe4e','fc3a7043bf7a964f782eddcc2e1274537aa96d0b713c06d57e54853537dab173'];
let now;
const planners = sources.map((hash,i) => {
  const n = 47+i;
  const html = frozen(path.join(__dirname,'../../grow-'+n+'-public/ocr-grow'+n+'.html'),hash);
  const planner = html.slice(html.indexOf('function chaseEvidence46('),html.indexOf('let totals46='));
  return new Function('performance', planner+'\nreturn planHunt47;')({now:()=>now});
});
function fields(d) {
  const data = JSON.parse(JSON.stringify(d));
  delete data.tracking46.appliedCounts;
  delete data.wallTracking47.appliedCounts;
  return data;
}
const details = [];
const groups = [];
for (const [i,hash] of ledgers.entries()) {
  const rows = frozen(process.argv[2+i],hash).trimEnd().split('\n').map(JSON.parse);
  const games = rows.filter(r=>r.type==='result' && r.version==='v2.22' && r.outcome===(i?'death':'deadline'));
  assert.equal(games.length,3);
  for (const game of games) {
    const samples = [...new Map(rows.filter(r=>r.id===game.id && r.type==='sample').map(r=>[r.snapshot.recordAt,r.snapshot])).values()];
    const end = samples.at(-1).recordAt;
    const g = {group:game.outcome,samples:samples.length,approaching:0,wallward:0,trigger:0,changes:0,earlySafer:0,earlyWorse:0,productive:0,retained:0};
    for (const s of samples) {
      const u=s.planInput, log=s.planOutput, m=u.map;
      now=s.decisionStartedAt;
      assert(!s.diagnosticTruncated);
      const args=[u.objects,u.hud,m,u.speed,u.velocity,u.heading,'v2.22',log.tracking46.observedAt,log.tracking46.npcToast];
      const [far,near]=planners.map(plan=>plan(...args));
      assert.deepEqual(fields(i?near:far),fields(log));
      // Nonzero fitted NPC velocity proves that the visible detector matched a previous frame.
      const closing=!near.immune && u.objects.some(o=>o.npc && (o.isRed || o.r>(u.hud+.5)*1.08) &&
        (o.vx!==0 || o.vy!==0) && o.x*(o.vx-u.velocity.x)+o.y*(o.vy-u.velocity.y)<0);
      const startWall=Math.min(m.player.x/m.width*10400,(1-m.player.x/m.width)*10400,
        m.player.y/m.height*7200,(1-m.player.y/m.height)*7200)-u.hud;
      const endWall=near.wall47?.end;
      const wallward=Number.isFinite(endWall) && endWall<600 && endWall<startWall;
      const trigger=closing && wallward && !near.escaping;
      const alternate=trigger?far:near;
      const changed=alternate.first!==near.first;
      const age=(end-s.recordAt)/1000;
      const early=age>=1 && age<=5 && changed && !alternate.escaping;
      const safer=early && alternate.wall47.min>near.wall47.min && alternate.clearance>=near.clearance;
      const worse=early && alternate.clearance<near.clearance;
      const productive=!near.escaping && near.gain>0;
      g.approaching+=+closing;g.wallward+=+wallward;g.trigger+=+trigger;g.changes+=+changed;
      g.earlySafer+=+safer;g.earlyWorse+=+worse;g.productive+=+productive;
      g.retained+=+(productive && near.first===alternate.first && alternate.gain>=near.gain);
      details.push({id:game.id,at:s.recordAt,age,closing,wallward,trigger,changed,safer,worse,productive,
        first:[near.first,alternate.first],gain:[near.gain,alternate.gain],clearance:[near.clearance,alternate.clearance],escaping:near.escaping});
    }
    groups.push(g);
  }
}
if(process.argv[4]) fs.writeFileSync(process.argv[4],JSON.stringify(details));
console.log(JSON.stringify(groups,null,2));
