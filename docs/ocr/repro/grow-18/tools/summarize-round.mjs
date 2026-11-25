import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dir=path.resolve(process.argv[2]||'lab/experiments/grow18');
const output=process.argv[3];
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const logPath=path.join(dir,'results/events.jsonl');
const raw=fs.existsSync(logPath)?fs.readFileSync(logPath):Buffer.alloc(0);
const records=raw.toString('utf8').split('\n').filter(Boolean).map(JSON.parse);
const starts=records.filter(r=>r.kind==='start'),finals=records.filter(r=>r.kind==='final');
const native=new Set(['win_le150','win_late','death','deadline_cutoff']);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const median=a=>{if(!a.length)return null;const s=[...a].sort((a,b)=>a-b),i=s.length>>1;return s.length%2?s[i]:(s[i-1]+s[i])/2;};
const wilson=(k,n)=>{if(!n)return null;const z=1.959963984540054,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,e=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return {low:c-e,high:c+e};};
const anomalies=[];
for(const [kind,list]of [['start',starts],['final',finals]]){const keys=new Set();for(const r of list){if(keys.has(r.runId))anomalies.push({kind:'duplicate_'+kind,runId:r.runId});keys.add(r.runId);}}
for(const r of starts){
 const phase=['screen','confirmation'].find(k=>manifest[k].id===r.batch);
 const planned=phase?manifest[phase].order[r.index]:null;
 if(!phase||!manifest[phase].versions.includes(r.version)||!planned||planned.version!==r.version||planned.strategy!==r.strategy||r.runId!==r.batch+'-'+String(r.index+1).padStart(2,'0'))anomalies.push({kind:'unplanned_start_identity',runId:r.runId,batch:r.batch,version:r.version});
 if(r.protocolHash!==manifest.protocolHash||r.plannerHash!==manifest.plannerHash||r.pageHash!==manifest.pageHash||r.geometryHash!==manifest.geometryHash||r.sourceHash!==manifest.sourceHash||JSON.stringify(r.gameHashes)!==JSON.stringify(manifest.games[r.version]))anomalies.push({kind:'source_identity',runId:r.runId});
 if(!r.startedVisible)anomalies.push({kind:'start_not_confirmed',runId:r.runId});
 const e=r.environment;if(e?.devicePixelRatio!==1||e?.visibility!=='visible'||e?.canvas?.width!==2000||e?.canvas?.height!==1163||e?.iframe?.width!==2000||e?.iframe?.height!==1163)anomalies.push({kind:'environment',runId:r.runId});
}
const runs=starts.map(start=>{
 const results=finals.filter(f=>f.runId===start.runId),f=results.length===1?results[0]:null;
 if(f&&(f.batch!==start.batch||f.version!==start.version||f.strategy!==start.strategy))anomalies.push({kind:'final_start_mismatch',runId:start.runId});
 if(f&&(!f.keysReleased||f.protocolHash!==manifest.protocolHash))anomalies.push({kind:'final_identity_or_keys',runId:start.runId});
 if(f?.outcome==='win_le150'&&(!/成功過關|You win/i.test(f.final?.title||'')||!Number.isFinite(f.final?.resultSeconds)||f.final.resultSeconds>150))anomalies.push({kind:'unsupported_win',runId:start.runId});
 const compute=f?.computeMs||[],samples=f?.samples||[];
 return {runId:start.runId,batch:start.batch,version:start.version,strategy:start.strategy,startAt:start.at,finalAt:f?.at??null,outcome:results.length>1?'duplicate_final':f?.outcome??'in_progress',gameSeconds:f?.final?.resultSeconds??f?.final?.elapsedVisible??null,hudSize:f?.final?.hudSize??null,keysReleased:f?.keysReleased??null,wallMs:f?.wallMs??null,decisions:f?.decisions??null,maxComputeMs:compute.length?Math.max(...compute):null,meanComputeMs:compute.length?compute.reduce((a,b)=>a+b,0)/compute.length:null,computeCount:compute.length,controllerEvents:f?.controllerEvents??null,promotedSamples:samples.filter(s=>s.promotedLethalThreats>0).length,totalSamples:samples.length,reason:f?.reason??null};
});
for(const f of finals)if(!starts.some(s=>s.runId===f.runId))anomalies.push({kind:'orphan_final',runId:f.runId});
const groups=[];
for(const phase of ['screen','confirmation'])for(const version of manifest[phase].versions){
 const batch=manifest[phase].id,rs=runs.filter(r=>r.batch===batch&&r.version===version),counts={};for(const r of rs)counts[r.outcome]=(counts[r.outcome]||0)+1;
 const wins=rs.filter(r=>r.outcome==='win_le150'),times=wins.map(r=>r.gameSeconds),planned=manifest[phase].NPerVersion;
 const ended=records.some(r=>r.kind==='batch_end'&&r.batch===batch&&!r.halted);
 groups.push({candidate:manifest.candidate,phase,batch,version,planned,starts:rs.length,nativeFinals:rs.filter(r=>native.has(r.outcome)).length,allFinals:rs.filter(r=>!['in_progress','duplicate_final'].includes(r.outcome)).length,counts,wins:wins.length,observedRate:rs.length?wins.length/rs.length:null,wilson95:wilson(wins.length,rs.length),winTimeMedian:median(times),winTimeRange:times.length?[Math.min(...times),Math.max(...times)]:null,complete:ended&&rs.length===planned&&rs.every(r=>!['in_progress','duplicate_final'].includes(r.outcome)),runIds:rs.map(r=>r.runId)});
}
const screenGroups=groups.filter(g=>g.phase==='screen'),confirmationGroups=groups.filter(g=>g.phase==='confirmation');
const sourceFreeze=JSON.parse(fs.readFileSync(path.join(dir,'freeze.json'),'utf8'));
for(const [file,info]of Object.entries(sourceFreeze.files)){if(hash(fs.readFileSync(path.join(dir,file)))!==info.sha256)anomalies.push({kind:'frozen_file_changed',file});}
const result={schema:1,candidate:manifest.candidate,generatedAt:new Date().toISOString(),protocolHash:manifest.protocolHash,raw:{file:'results/events.jsonl',bytes:raw.length,sha256:hash(raw),records:records.length},starts:starts.length,finals:finals.length,unresolved:runs.filter(r=>r.outcome==='in_progress').map(r=>r.runId),anomalies,screenGatePassed:anomalies.length===0&&screenGroups.every(g=>g.complete&&g.nativeFinals===g.planned&&g.wins>=manifest.screen.minimumWinsPerVersion),confirmationSampleTargetMet:anomalies.length===0&&confirmationGroups.every(g=>g.complete&&g.wins>=manifest.confirmation.minimumWinsPerVersion),formalAcceptance:false,groups,runs,limitations:['Natural random trials are uncontrolled and unpaired.','Wilson intervals describe sample uncertainty; an observed >=50% is not a long-term guarantee.','Only v2.13 and current v2.22 are in this batch; no v2.20/v2.21 or formal OCR4 acceptance.','Every start remains in its version and phase denominator; no exclusions or replacements.']};
if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({candidate:result.candidate,starts:result.starts,finals:result.finals,unresolved:result.unresolved,anomalies:result.anomalies,screenGatePassed:result.screenGatePassed,confirmationSampleTargetMet:result.confirmationSampleTargetMet,groups:groups.map(({runIds,...g})=>g),latestProgress:records.filter(r=>r.kind==='progress').at(-1)?.visible??null},null,2));
