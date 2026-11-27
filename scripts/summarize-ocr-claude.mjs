// Summarize batch JSONL files (numeric only) per label and game version.
// Usage: node scripts/summarize-ocr-claude.mjs a.jsonl [b.jsonl ...]
import {readFile} from 'node:fs/promises';
const rows=[];for(const f of process.argv.slice(2))for(const l of (await readFile(f,'utf8')).split('\n'))if(l.trim())rows.push(JSON.parse(l));
const at=(r,t)=>{let v=null;for(const s of r.samples)if(s[0]<=t)v=s[1];return r.outcome==='death'&&r.gameSeconds<t?null:v;};
const med=a=>{const b=a.filter(x=>x!==null).sort((x,y)=>x-y);return b.length?b[b.length>>1]:null;};
const out={};
for(const r of rows){const k=r.label;out[k]??={games:0,win150:0,winLate:0,death:0,cutoff150:0,timeout300:0,controllerStop:0,infra:0,unknown:0,byVersion:{},deathSeconds:[],size60:[],size120:[],finalCutoffSize:[],colorSpeedMedian:[]};const o=out[k];o.games++;
 const key={"win<=150":'win150',"win>150":'winLate',death:'death',cutoff150:'cutoff150',timeout300:'timeout300','controller-stop':'controllerStop','infra-error':'infra'}[r.outcome]||'unknown';o[key]++;
 o.byVersion[r.version]??={games:0,win150:0,death:0,cutoff150:0,other:0};const v=o.byVersion[r.version];v.games++;if(key in v)v[key]++;else v.other++;
 if(key==='death')o.deathSeconds.push(r.gameSeconds);if(key==='cutoff150')o.finalCutoffSize.push(r.size);o.size60.push(at(r,60));o.size120.push(at(r,120));
 if(r.obs){o.observed=(o.observed||0)+1;(o.npcEats??=[]).push(r.obs.eats.length);(o.npcGain??=[]).push(Math.round(r.obs.npcGain));(o.foodGain??=[]).push(Math.round(r.obs.foodGain));if(r.obs.killer){const k=r.obs.killer;o.killers??={n:0,atWall:0,inView:0,sprint:0,chase:0,hunt:0,ratios:[]};const K=o.killers;K.n++;if(k.wallDist<=r.size*.5)K.atWall++;if(k.inView)K.inView++;if(k.sprint)K.sprint++;if(k.chase)K.chase++;if(k.hunt)K.hunt++;K.ratios.push(k.ratio);}}
 const cs=r.samples.map(s=>s[2]).filter(x=>typeof x==='number');if(cs.length)o.colorSpeedMedian.push(med(cs));}
for(const o of Object.values(out)){o.medianSize60=med(o.size60);o.medianSize120Alive=med(o.size120);o.medianDeathSecond=med(o.deathSeconds);delete o.size60;delete o.size120;o.colorSpeedMedian=o.colorSpeedMedian.length?med(o.colorSpeedMedian):'not recorded';o.win150Rate=`${o.win150}/${o.games}`;if(o.npcEats){o.medianNpcEats=med(o.npcEats);o.medianNpcGain=med(o.npcGain);o.medianFoodGain=med(o.foodGain);}}
console.log(JSON.stringify(out,null,1));
