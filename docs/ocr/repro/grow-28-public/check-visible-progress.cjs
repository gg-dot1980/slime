'use strict';
// Pure planner checks only. No renderer, pixels, browser, or natural-game IO.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),util=require('node:util'),cp=require('node:child_process');
const {build,plannerText,hash}=require('./build-candidate.cjs');
const {fixtures}=require('./make-fixtures.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function once(source,a,b){assert.equal(source.split(a).length,2,'instrumentation anchor: '+a.slice(0,70));return source.replace(a,b);}
function compile(source,instrumented){
  if(instrumented){
    source=once(source,'  const paths = [];','  const paths = [], audit = [];');
    source=once(source,'    const picked = new Set();','    const picked = new Set(), trajectory = [], captures = [];');
    source=once(source,'          picked.add(i); const g =','          captures.push({meal:i,time:t,x:o.x,y:o.y,npc:!!o.npc}); picked.add(i); const g =');
    source=once(source,'      }\n    }\n    let approach = 0, target = null;',
      '      }\n      trajectory.push({t,x,y,vx,vy,growth,gain,clearance,immediateGap,endGap,risk,wallOK,wallCost,spawnWallOK,picked:[...picked]});\n    }\n    let approach = 0, target = null; const targetAudit=[];');
    source=once(source,'      const value = o.utility * progress;',
      '      const value = o.utility * progress; targetAudit.push({x:o.x,y:o.y,r:o.r,npc:!!o.npc,mapOnly:!!o.mapOnly,captured,progress,value});');
    source=once(source,'      endX: x, endY: y});','      endX: x, endY: y});\n    audit.push({first,second,trajectory,captures,targetAudit});');
    source=once(source,'  return {...chosen, target, strategy:',
      '  observe({paths,audit,targets,reachableMeals,localHazards,walls});\n  return {...chosen, target, strategy:');
  }
  let currentClock=0,diagnostic=null;
  const fn=new Function('performance','observe',source+';return planGrow23;')({now:()=>currentClock},d=>{diagnostic=d;});
  return (input,clock)=>{currentClock=clock;diagnostic=null;const p=clone(input);
    const output=clone(fn(p.objects,p.hud,p.map,p.speed,p.velocity,p.heading,p.gameVersion));
    return {output,diagnostic};};
}
function check(startIndex=0,caseCount=4){
  const started=performance.now(),{parent,candidate,manifest}=build();
  assert.equal(fs.readFileSync(path.join(__dirname,'ocr-grow28.html'),'utf8'),candidate);
  const data=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures.json'),'utf8'));
  assert.deepEqual(data,fixtures(),'fixed inputs match explicit generator');
  const before=compile(plannerText(parent),true),after=compile(plannerText(candidate),true);
  const safetyKeys=['first','second','x','y','clearance','immediateGap','endGap','wallOK','wallCost','risk','spawnWallOK','endX','endY','gain','discountedGain'];
  const pathEvidence=p=>Object.fromEntries(safetyKeys.map(k=>[k,p[k]]));
  const pools=(d,old)=>{const wall=d.paths.filter(p=>p.wallOK),safe=wall.filter(p=>p.clearance>(old.escaping===true?14:4)),spawn=safe.filter(p=>p.spawnWallOK);const ids=a=>a.map(p=>[p.first,p.second]);return {wall:ids(wall),safe:ids(safe),spawn:ids(spawn)};};
  let assertions=0,plannerCalls=0,checkedPaths=0,checkedSteps=0;
  const eq=(a,b,label)=>{assert.deepEqual(a,b,label);assertions++;};
  const ok=(x,label)=>{assert(x,label);assertions++;};
  const rows=[];
  for(const c of data.cases.slice(startIndex,startIndex+caseCount)){
    const a=before(c.input,c.clock),b=after(c.input,c.clock);plannerCalls+=2;
    let proof=null,limitation=null;
    if(a.diagnostic||b.diagnostic){
      const x=a.diagnostic,y=b.diagnostic;
      eq(x.paths.length,64,c.id+' parent paths');eq(y.paths.length,64,c.id+' candidate paths');
      eq(x.paths.map(pathEvidence),y.paths.map(pathEvidence),c.id+' per-path safety/dynamics/gain unchanged');
      eq(x.targets,y.targets,c.id+' eligible targets unchanged');eq(x.reachableMeals,y.reachableMeals,c.id+' reachable meals unchanged');
      eq(x.localHazards,y.localHazards,c.id+' hazards unchanged');eq(x.walls,y.walls,c.id+' walls unchanged');
      eq(pools(x,c.input.heading),pools(y,c.input.heading),c.id+' safety pool membership unchanged');
      const invariants=[];let capturedProgressChecks=0,mapProgressChecks=0;
      for(let i=0;i<64;i++){
        const pa=x.audit[i],pb=y.audit[i];
        eq(pa.trajectory,pb.trajectory,c.id+' all 22 trajectory points '+i);
        eq(pa.captures,pb.captures,c.id+' capture identity/time '+i);
        eq(pa.targetAudit.map(t=>({x:t.x,y:t.y,npc:t.npc,mapOnly:t.mapOnly,captured:t.captured})),
          pb.targetAudit.map(t=>({x:t.x,y:t.y,npc:t.npc,mapOnly:t.mapOnly,captured:t.captured})),c.id+' target capture flags '+i);
        for(let j=0;j<pa.targetAudit.length;j++){
          const ta=pa.targetAudit[j],tb=pb.targetAudit[j];
          if(ta.captured||ta.mapOnly){eq(ta,tb,c.id+' captured/map-only progress unchanged '+i+'/'+j);if(ta.captured)capturedProgressChecks++;else mapProgressChecks++;}
        }
        invariants.push({first:pa.first,second:pa.second,trajectorySha256:hash(JSON.stringify(pa.trajectory)),captures:pa.captures,
          invariantPath:pathEvidence(x.paths[i])});
      }
      checkedPaths+=64;checkedSteps+=64*22;
      eq(a.output.escaping,b.output.escaping,c.id+' same escape availability');
      if(!b.output.escaping)ok(b.output.wallOK,c.id+' chosen safe path respects hard wall');
      const chosen=y.audit.find(p=>p.first===b.output.first&&p.second===b.output.second);
      const t=b.output.target,ta=t&&chosen.targetAudit.find(q=>q.npc===!!t.npc&&q.mapOnly===!!t.mapOnly&&q.x===t.x&&q.y===t.y);
      const targetCapture=t&&chosen.captures.find(q=>q.npc===!!t.npc&&q.x===t.x&&q.y===t.y);
      const initialDot=t?b.output.x*t.x+b.output.y*t.y:null;
      if(ta?.captured&&targetCapture?.time>.6&&initialDot<0&&!b.output.escaping){
        limitation={kind:'future capture can retain opposite first segment',first:b.output.first,second:b.output.second,
          targetInitialDot:initialDot,captureTime:targetCapture.time,capturedProgress:ta.progress,
          firstSegment:chosen.trajectory[5],target:{x:t.x,y:t.y,r:t.r,npc:!!t.npc},gain:b.output.gain};
      }
      proof={pathCount:64,trajectoryPointsPerPath:22,capturedProgressChecks,mapProgressChecks,
        perPathInvariants:invariants,pools:pools(y,c.input.heading)};
    }else eq(a.output,b.output,c.id+' early guard output unchanged');
    if(c.expectCompleteUnchanged)eq(a.output,b.output,c.id+' full unchanged control');
    rows.push({id:c.id,input:c.input,clock:c.clock,parentOutput:a.output,candidateOutput:b.output,
      directionChanged:a.output.first!==b.output.first,outputChanged:!util.isDeepStrictEqual(a.output,b.output),
      chosenClearanceDelta:b.output.clearance-a.output.clearance,chosenGainDelta:b.output.gain-a.output.gain,
      futureCaptureLimitation:limitation,proof});
    const rss=process.memoryUsage().rss;ok(rss<=192*1024*1024,c.id+' numeric checker RSS '+rss+' below 192 MiB soft stop');
  }
  const summary={cases:rows.length,assertions,plannerCalls,checkedPaths,checkedTrajectoryPoints:checkedSteps,
    directionChanges:rows.filter(r=>r.directionChanged).map(r=>r.id),
    chosenClearanceDecreases:rows.filter(r=>r.chosenClearanceDelta<0).map(r=>({id:r.id,delta:r.chosenClearanceDelta})),
    chosenGainDecreases:rows.filter(r=>r.chosenGainDelta<0).map(r=>({id:r.id,delta:r.chosenGainDelta})),
    futureCaptureLimitationCases:rows.filter(r=>r.futureCaptureLimitation).map(r=>r.id),
    browserRuns:0,naturalStarts:0,pixelsOrImages:0};
  const result={schemaVersion:1,kind:'fixed numeric synthetic inputs and full planner outputs',
    parentSha256:manifest.parent.sha256,candidateSha256:manifest.candidateSha256,
    fixturesSha256:hash(fs.readFileSync(path.join(__dirname,'fixtures.json'))),summary,rows};
  const resources={kind:'single bounded numeric check',node:process.version,wallMilliseconds:performance.now()-started,
    maxRssKiB:process.resourceUsage().maxRSS,configuredOldSpaceMiB:64,rssSoftStopMiB:192,
    startIndex,caseCount:rows.length,nativeRendererUsed:false,browserUsed:false,plannerCalls};
  return {result,resources};
}
function runBounded(){
  const started=performance.now(),data=fixtures(),chunks=[];
  for(let start=0;start<data.cases.length;start+=4){
    const text=cp.execFileSync(process.execPath,['--max-old-space-size=64',__filename,'--worker',String(start),'4'],
      {encoding:'utf8',maxBuffer:6*1024*1024,timeout:15000});
    const chunk=JSON.parse(text);assert.equal(chunk.resources.startIndex,start);assert(chunk.resources.maxRssKiB<=192*1024,'worker final RSS budget');chunks.push(chunk);
  }
  const rows=chunks.flatMap(c=>c.result.rows),{candidate,manifest}=build();
  assert.deepEqual(rows.map(r=>r.id),data.cases.map(c=>c.id),'every fixed case retained in order');
  const plain=compile(plannerText(candidate),false);let extraAssertions=0;
  const eq=(a,b,label)=>{assert.deepEqual(a,b,label);extraAssertions++;};
  // Explicit v2.13 -> v2.22 -> v2.13 round trip, plus observer transparency.
  const v13=data.cases.find(c=>c.name==='version-immune-switch'&&c.input.gameVersion==='v2.13');
  const v22=data.cases.find(c=>c.name==='version-immune-switch'&&c.input.gameVersion==='v2.22');
  for(const c of [v13,v22,v13])eq(plain(c.input,c.clock).output,rows.find(r=>r.id===c.id).candidateOutput,'exact version switch '+c.input.gameVersion);
  const capture=data.cases.find(c=>c.name==='future-food-capture-full-inertia'&&c.input.gameVersion==='v2.13');
  eq(plain(capture.input,capture.clock).output,rows.find(r=>r.id===capture.id).candidateOutput,'capture instrumentation transparency');
  const summary={cases:rows.length,assertions:chunks.reduce((s,c)=>s+c.result.summary.assertions,extraAssertions),
    plannerCalls:chunks.reduce((s,c)=>s+c.result.summary.plannerCalls,4),
    checkedPaths:chunks.reduce((s,c)=>s+c.result.summary.checkedPaths,0),
    checkedTrajectoryPoints:chunks.reduce((s,c)=>s+c.result.summary.checkedTrajectoryPoints,0),
    directionChanges:rows.filter(r=>r.directionChanged).map(r=>r.id),
    chosenClearanceDecreases:rows.filter(r=>r.chosenClearanceDelta<0).map(r=>({id:r.id,delta:r.chosenClearanceDelta})),
    chosenGainDecreases:rows.filter(r=>r.chosenGainDelta<0).map(r=>({id:r.id,delta:r.chosenGainDelta})),
    futureCaptureLimitationCases:rows.filter(r=>r.futureCaptureLimitation).map(r=>r.id),
    browserRuns:0,naturalStarts:0,pixelsOrImages:0};
  const result={schemaVersion:1,kind:'fixed numeric synthetic inputs and full planner outputs',
    parentSha256:manifest.parent.sha256,candidateSha256:manifest.candidateSha256,
    fixturesSha256:hash(fs.readFileSync(path.join(__dirname,'fixtures.json'))),summary,rows};
  const resources={kind:'fixed numeric cases in sequential short-lived workers',node:process.version,
    workerCount:chunks.length,maxCasesPerWorker:4,workerOldSpaceMiB:64,rssSoftStopMiB:192,
    maxWorkerRssKiB:Math.max(...chunks.map(c=>c.resources.maxRssKiB)),parentMaxRssKiB:process.resourceUsage().maxRSS,
    wallMilliseconds:performance.now()-started,nativeRendererUsed:false,browserUsed:false,
    workers:chunks.map(c=>c.resources)};
  assert(resources.parentMaxRssKiB<=192*1024,'parent RSS budget');
  return {result,resources};
}
if(require.main===module){
  if(process.argv.includes('--worker')){const i=process.argv.indexOf('--worker');console.log(JSON.stringify(check(Number(process.argv[i+1]),Number(process.argv[i+2]))));process.exit(0);}
  const {result,resources}=runBounded();if(process.argv.includes('--write')){
  const outputs=[['synthetic-results.json',result],['synthetic-summary.json',result.summary],['synthetic-resources.json',resources]];
  for(const [name,value] of outputs){const file=path.join(__dirname,name),data=JSON.stringify(value,null,2)+'\n';
    if(fs.existsSync(file)){if(name!=='synthetic-resources.json')assert.equal(fs.readFileSync(file,'utf8'),data,'existing result differs; retain original before any change');}
    else fs.writeFileSync(file,data,{flag:'wx'});
  }
}console.log(JSON.stringify({summary:result.summary,resources:{...resources,workers:undefined}},null,2));}
module.exports={check,compile,runBounded};
