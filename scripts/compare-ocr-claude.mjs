// Paired comparison report for interleaved batches (numbers only).
// Per strategy × version: games, clears <=150 s, deaths, size at end (death size counts; cutoff size at 150 s),
// median with a bootstrap 95% CI, and the bootstrap CI of the median difference between two strategies.
// Usage: node scripts/compare-ocr-claude.mjs a.jsonl [b.jsonl ...]
import {readFile} from 'node:fs/promises';
const rows=[];for(const f of process.argv.slice(2))for(const l of (await readFile(f,'utf8')).split('\n'))if(l.trim())rows.push(JSON.parse(l));
let seed=12345;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648; // fixed seed: reproducible report
const med=a=>{const b=[...a].sort((x,y)=>x-y),n=b.length;return n?(n%2?b[n>>1]:(b[n/2-1]+b[n/2])/2):null;};
const boot=(a,f,k=4000)=>{const out=[];for(let i=0;i<k;i++){const s=a.map(()=>a[Math.floor(rnd()*a.length)]);out.push(f(s));}out.sort((x,y)=>x-y);return [out[Math.floor(k*.025)],out[Math.floor(k*.975)]];};
const valid=r=>['win<=150','win>150','death','cutoff150'].includes(r.outcome);
const groups={};for(const r of rows){const k=r.version+'|'+r.strategy;(groups[k]??=[]).push(r);}
const report={};
for(const [k,g] of Object.entries(groups)){const ok=g.filter(valid),sizes=ok.map(r=>r.outcome.startsWith('win')?200:r.size);
 report[k]={games:g.length,valid:ok.length,excluded:g.length-ok.length,excludedOutcomes:g.filter(r=>!valid(r)).map(r=>r.outcome),win150:ok.filter(r=>r.outcome==='win<=150').length,deaths:ok.filter(r=>r.outcome==='death').length,
  sizeMedian:med(sizes),sizeMedianCI95:sizes.length?boot(sizes,med).map(Math.round):null,
  npcEatsMedian:med(ok.map(r=>(r.obs?.eats||[]).length))};}
const versions=[...new Set(rows.map(r=>r.version))],strats=[...new Set(rows.map(r=>r.strategy))];
const diffs={};
for(const v of versions)for(let i=0;i<strats.length;i++)for(let j=i+1;j<strats.length;j++){const a=groups[v+'|'+strats[i]],b=groups[v+'|'+strats[j]];if(!a||!b)continue;
 const sa=a.filter(valid).map(r=>r.outcome.startsWith('win')?200:r.size),sb=b.filter(valid).map(r=>r.outcome.startsWith('win')?200:r.size);
 const d=[];for(let k=0;k<4000;k++){const x=sa.map(()=>sa[Math.floor(rnd()*sa.length)]),y=sb.map(()=>sb[Math.floor(rnd()*sb.length)]);d.push(med(x)-med(y));}d.sort((x,y)=>x-y);
 diffs[`${v}: ${strats[i]} - ${strats[j]}`]={medianDiff:med(sa)-med(sb),ci95:[Math.round(d[100]),Math.round(d[3900])],clearsA:sa.filter(x=>x>=200).length+'/'+sa.length,clearsB:sb.filter(x=>x>=200).length+'/'+sb.length};}
console.log(JSON.stringify({groups:report,differences:diffs},null,1));
