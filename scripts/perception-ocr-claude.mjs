// Perception error report from OBSERVE batch rows (row.percep): controller NPC detections vs true in-view NPCs.
// Usage: node scripts/perception-ocr-claude.mjs a.jsonl [b.jsonl ...]   (numbers only)
import {readFile} from 'node:fs/promises';
const rows=[];for(const f of process.argv.slice(2))for(const l of (await readFile(f,'utf8')).split('\n'))if(l.trim())rows.push(JSON.parse(l));
const med=a=>{const b=[...a].sort((x,y)=>x-y);return b.length?Math.round(b[b.length>>1]*100)/100:null;},pct=(a,b)=>b?Math.round(a/b*1000)/10+'%':'n/a';
const by={};
for(const row of rows)for(const s of row.percep||[]){const k=row.version,o=by[k]??={samples:0,trueByClass:{prey:0,neutral:0,lethal:0},detectedByClass:{prey:0,neutral:0,lethal:0},rRatio:[],posErr:[],posScale:[],lethalSeenSafe:0,falsePrey:0,preyCalled:0,missedPrey:0,ghost:0,detTotal:0};o.samples++;
 const R=s.R,cls=r=>r>=R*1.08?'lethal':R>=r*1.08?'prey':'neutral',used=new Set();
 for(const t of s.tru){const c=cls(t[2]);o.trueByClass[c]++;let best=null,bd=Math.max(45,t[2]*.6);
  s.det.forEach((d,i)=>{if(used.has(i))return;const dist=Math.hypot(d[0]-t[0],d[1]-t[1]);if(dist<bd){bd=dist;best=i;}});
  if(best===null){if(c==='prey')o.missedPrey++;continue;}used.add(best);const d=s.det[best];o.detectedByClass[c]++;o.posErr.push(bd);
  if(Math.hypot(t[0],t[1])>80)o.posScale.push(Math.hypot(d[0],d[1])/Math.hypot(t[0],t[1]));
  if(!d[3])o.rRatio.push(d[2]/t[2]);
  const safeLooking=!d[3]&&!d[4]&&d[2]<R*.94;if(c==='lethal'&&safeLooking)o.lethalSeenSafe++;
  const calledPrey=!d[3]&&!d[4]&&d[2]<=R*.9;if(calledPrey){o.preyCalled++;if(c!=='prey')o.falsePrey++;}else if(c==='prey')o.missedPrey++;}
 o.detTotal+=s.det.length;o.ghost+=s.det.length-used.size;}
for(const o of Object.values(by)){o.detectionRate=Object.fromEntries(Object.keys(o.trueByClass).map(c=>[c,pct(o.detectedByClass[c],o.trueByClass[c])]));
 o.radiusRatioMedian=med(o.rRatio);o.radiusRatioP10=med(o.rRatio.filter(x=>x<=o.radiusRatioMedian));o.radiusRatioP90=med(o.rRatio.filter(x=>x>=o.radiusRatioMedian));
 o.positionErrorMedian=med(o.posErr);o.positionScaleMedian=med(o.posScale);
 o.lethalLookingSafe=`${o.lethalSeenSafe}/${o.detectedByClass.lethal}`;o.falsePreyRate=pct(o.falsePrey,o.preyCalled);o.preyMissed=`${o.missedPrey}/${o.trueByClass.prey}`;o.ghostDetections=`${o.ghost}/${o.detTotal}`;
 delete o.rRatio;delete o.posErr;delete o.posScale;}
console.log(JSON.stringify(by,null,1));
