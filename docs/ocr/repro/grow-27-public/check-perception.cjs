'use strict';
// Independent renderer, finite synthetic fixtures; no browser or natural game.
// Only numerical observations are serialized. Raster buffers remain in memory.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const args=process.argv.slice(2),prototypeMode=args.includes('--prototype'),resourceSmoke=args.includes('--resource-smoke');
const workerArgument=args.find(arg=>arg.startsWith('--worker-indices='));
assert(args.every(arg=>['--write','--summary','--prototype','--resource-smoke'].includes(arg)||arg===workerArgument),'Unsupported argument');
assert(!(resourceSmoke&&args.includes('--write')),'Resource smoke cannot write a complete observation.');
const helperName=prototypeMode?'prototype-locate-player.cjs':'locate-player.cjs';
const {locateMinimapPlayer27}=require('./'+helperName);
const root=path.resolve(__dirname,'../../../..');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const fixedSources=[
  ['src/game-v2.13.html','94944ef137412e93817754791c64cf7803a94f25222a8922fe8aa6936ea46d97'],
  ['src/game.html','d0349b70c0be4666142f0ed880adb1b1636bcd6d7bf32a13d0d90246899c6d14'],
  ['docs/ocr/repro/grow-24-public/ocr-grow24.html','f276dd1b6dd340c142f00027adf2ddeefc394c74db772edf814cd6f9445f6347']
];
const loaded=new Map(fixedSources.map(([file,expected])=>{
  const bytes=fs.readFileSync(path.join(root,file));assert.equal(hash(bytes),expected,'Fixed source mismatch: '+file);
  return [file,bytes.toString('utf8')];
}));
function loadRenderer(){
  const entry=require.resolve('@napi-rs/canvas');
  const version=JSON.parse(fs.readFileSync(path.join(path.dirname(entry),'package.json'),'utf8')).version;
  assert.equal(version,'0.1.100','Different renderer: record a separate observation.');
  return {createCanvas:require(entry).createCanvas,version};
}
function extract(text,startMark,endMark){
  const start=text.indexOf(startMark),end=text.indexOf(endMark,start);
  assert(start>=0&&end>start,'Cannot extract '+startMark);
  return text.slice(start,end);
}
function replaceOne(text,old,value){
  assert.equal(text.split(old).length,2,'Expected one exact replacement: '+old.slice(0,60));
  return text.replace(old,value);
}
const parent=loaded.get(fixedSources[2][0]);
const originalDetector=extract(parent,'function detectMinimap(','function hasSlimeLabel(');
const oldBlock=extract(originalDetector,' // A filled green disk',' const opportunities');
const candidateDetector=replaceOne(originalDetector,oldBlock,
  prototypeMode?' const player=locateMinimapPlayer27(green,W,H,pixelRatio,width,height,w/pixelRatio,h/pixelRatio);\n':
    ' const player=locateMinimapPlayer27(green,W,H,pixelRatio,width,height,w/pixelRatio,h/pixelRatio,x-Math.floor(x),y-Math.floor(y));\n');
const before=new Function(originalDetector+'\nreturn detectMinimap;')();
const after=new Function('locateMinimapPlayer27',candidateDetector+'\nreturn detectMinimap;')(locateMinimapPlayer27);
const drawSource=extract(loaded.get('src/game.html'),'// minimap\n','\n}\nfunction loop').slice('// minimap\n'.length);
assert.equal(drawSource,extract(loaded.get('src/game-v2.13.html'),'// minimap\n','\n}\nfunction loop').slice('// minimap\n'.length));
const diskSource="ctx.beginPath();ctx.arc(mx+player.x/W*miniW,my+player.y/H*miniH,3,0,Math.PI*2);ctx.fillStyle='#a3f3d1';ctx.fill();";
const frameSource="ctx.fillStyle='#a3f3d116';ctx.fillRect(vx,vy,vwMini,vhMini);ctx.strokeStyle='#a3f3d1';ctx.lineWidth=2;ctx.strokeRect(vx,vy,vwMini,vhMini);";
const drawVariants={
  normal:drawSource,
  noDisk:replaceOne(drawSource,diskSource,''),
  noFrame:replaceOne(drawSource,frameSource,''),
  blank:replaceOne(replaceOne(drawSource,diskSource,''),frameSource,''),
  noBackground:replaceOne(drawSource,"ctx.fillStyle='#203238'","ctx.fillStyle='#101820'"),
  wrongFrameWidth:replaceOne(drawSource,'cam.x+vw','cam.x+vw*1.6'),
  wrongFrameHeight:replaceOne(drawSource,'cam.y+vh','cam.y+vh*1.6')
};
const renderers=Object.fromEntries(Object.entries(drawVariants).map(([name,code])=>[name,
  new Function('ctx','vw','vh','W','H','slimes','cam','player','isTraditional',code)]));
const {createCanvas,version:rendererVersion}=loadRenderer();
// Surface reuse alone did not bound native ImageData memory in the first run.
// Only short-lived worker processes rasterize; at most eight cases per process.
// Their buffers are released when the process exits, independent of V8 GC.
let sourceCanvas=null,analysisCanvas=null;
const views=[[958,557],[710,413],[634,734],[2000,1163]];
const dprs=[.8,1,1.25],phases=[0,.25,.5,.75];
const positionNames=['interior','top88','top150','top200','top240','top260','top280','top325','top397','top500','top1000',
  'left88','right88','bottom88','topLeft88','topRight88','bottomLeft88','bottomRight88'];
function position(name,vw,vh,phase){
  const mw=Math.min(144,vw*.26),mh=mw*7200/10400;
  let x=6600,y=3600;
  if(name.startsWith('top')&&/^top\d+$/.test(name))y=Number(name.slice(3));
  else if(name==='left88')x=88;
  else if(name==='right88')x=10400-88;
  else if(name==='bottom88')y=7200-88;
  else if(name==='topLeft88'){x=88;y=88;}
  else if(name==='topRight88'){x=10400-88;y=88;}
  else if(name==='bottomLeft88'){x=88;y=7200-88;}
  else if(name==='bottomRight88'){x=10400-88;y=7200-88;}
  return {x:x+phase/mw*10400,y:y+phase/mh*7200,r:88};
}
function render(fixture){
  const [vw,vh]=fixture.view,dpr=fixture.dpr,p=position(fixture.position,vw,vh,fixture.phase);
  if(!sourceCanvas){sourceCanvas=createCanvas(1,1);analysisCanvas=createCanvas(1,1);}
  const source=sourceCanvas;
  if(source.width!==Math.round(vw*dpr))source.width=Math.round(vw*dpr);
  if(source.height!==Math.round(vh*dpr))source.height=Math.round(vh*dpr);
  const ctx=source.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#101820';ctx.fillRect(0,0,vw,vh);
  const slimes=fixture.npcs?[
    {x:p.x+500,y:p.y+500,r:25},{x:p.x-500,y:p.y+500,r:180},
    {x:p.x+250,y:p.y,r:25},{x:p.x,y:p.y+275,r:180}
  ].filter(s=>s.x>=0&&s.x<=10400&&s.y>=0&&s.y<=7200):[];
  (renderers[fixture.variant]||renderers.normal)(ctx,vw,vh,10400,7200,slimes,{x:p.x-vw/2,y:p.y-vh/2},p,true);
  const mw=Math.min(144,vw*.26),mh=mw*7200/10400,mx=vw-mw-15,my=70;
  const px=mx+p.x/10400*mw,py=my+p.y/7200*mh;
  const l=mx+Math.max(0,p.x-vw/2)/10400*mw,r=mx+Math.min(10400,p.x+vw/2)/10400*mw;
  const t=my+Math.max(0,p.y-vh/2)/7200*mh,b=my+Math.min(7200,p.y+vh/2)/7200*mh;
  if(fixture.variant==='brokenTop'){
    ctx.fillStyle='#203238';ctx.fillRect(l+(r-l)*.22,t-1.75,Math.max(4,(r-l)*.34),3.5);
  }
  if(fixture.variant==='brokenRight'){
    ctx.fillStyle='#203238';ctx.fillRect(r-1.75,t+(b-t)*.22,3.5,Math.max(4,(b-t)*.34));
  }
  if(fixture.variant==='strayGreen'){
    ctx.fillStyle='#a3f3d1';ctx.fillRect(mx+25,my+35,4,4);
  }
  if(fixture.variant==='extraDisk'){
    ctx.beginPath();ctx.arc(px+22,py+18,3,0,Math.PI*2);ctx.fillStyle='#a3f3d1';ctx.fill();
  }
  if(fixture.variant==='solidGreen'){
    ctx.fillStyle='#a3f3d1';ctx.fillRect(l,t,r-l,b-t);
  }
  // Same width cap and ratio definition as Grow24 readImage; source and analysis
  // integer rounding are retained. The fixture dimensions are explicit inputs.
  const scale=Math.min(1,2000/source.width),w=Math.round(source.width*scale),h=Math.round(source.height*scale);
  const analysis=analysisCanvas;
  if(analysis.width!==w)analysis.width=w;
  if(analysis.height!==h)analysis.height=h;
  const a=analysis.getContext('2d');a.drawImage(source,0,0,w,h);
  if(fixture.variant==='cropTop'){
    a.fillStyle='#101820';a.fillRect(0,0,w,Math.round((my+3)*dpr*scale));
  }
  if(fixture.variant==='cropFrame'){
    a.fillStyle='#101820';a.fillRect(0,0,w,Math.round(py*dpr*scale));
  }
  return {image:a.getImageData(0,0,w,h),w,h,ratio:w/vw,player:p};
}
const round=x=>Number(x.toFixed(6));
function observation(map,player){
  if(!map?.player)return null;
  const x=map.player.x/map.width*10400,y=map.player.y/map.height*7200;
  return {x:round(x),y:round(y),errorWorld:round(Math.hypot(x-player.x,y-player.y)),
    ...(map.player.method?{fitError:round(map.player.fitError),ambiguityPixels:round(map.player.ambiguityPixels),
      diskEvidence:map.player.diskEvidence,minEdgeCoverage:round(map.player.edgeCoverage),
      ...(Number.isFinite(map.player.hollowEvidence)?{hollowEvidence:map.player.hollowEvidence}:{})}:{})};
}
const fixtures=[];
// All original 80 near-wall localization counterexamples remain a subset.
for(const view of views)for(const dpr of dprs)for(const phase of phases)for(const position of positionNames){
  fixtures.push({id:'positive-'+fixtures.length,kind:'positive',view,dpr,phase,position,variant:'normal',npcs:false});
}
// NPC dots are drawn before the frame, exactly as in the game. Both red and white
// and close/distant dots are included; localization must not silently alter them.
for(const view of views)for(const dpr of dprs)for(const phase of phases){
  fixtures.push({id:'npc-'+fixtures.length,kind:'positive-npc',view,dpr,phase,position:'interior',variant:'normal',npcs:true});
}
const negatives=['blank','noDisk','noFrame','noBackground','wrongFrameWidth','wrongFrameHeight',
  'brokenTop','brokenRight','strayGreen','extraDisk','solidGreen','cropTop'];
if(!prototypeMode)negatives.push('cropFrame');
for(const variant of negatives)for(const view of views)for(const dpr of dprs)for(const phase of [0,.5]){
  for(const position of (variant==='noDisk'?['interior','top88','topLeft88']:['interior'])){
    // cropTop at an interior position removes only empty map background. The
    // original prototype mistakenly demanded rejection despite intact signal.
    // Retain the cases, but do not count them as false acceptances in revision 2.
    fixtures.push({id:'negative-'+fixtures.length,kind:!prototypeMode&&variant==='cropTop'?'background-crop':'negative',view,dpr,phase,position,variant,npcs:false});
  }
}
// Explicit unsupported small frame: an intentional reject, not a success case.
for(const dpr of dprs)fixtures.push({id:'unsupported-'+fixtures.length,kind:'unsupported',view:[450,650],dpr,phase:0,position:'interior',variant:'normal',npcs:false});
function evaluate(fixture){
  const {image,w,h,ratio,player}=render(fixture),oldMap=before(image,w,h,ratio),newMap=after(image,w,h,ratio);
  const old=observation(oldMap,player),current=observation(newMap,player);
  return {...fixture,analysis:[w,h],analysisRatio:round(ratio),truth:{x:round(player.x),y:round(player.y)},
    parent:old,candidate:current,comparison:old&&current?(current.errorWorld<old.errorWorld-1e-6?'improved':current.errorWorld>old.errorWorld+1e-6?'worse':'same'):
      current?'newly-found':old?'newly-rejected':'both-rejected'};
}
if(workerArgument){
  const indices=workerArgument.slice('--worker-indices='.length).split(',').map(Number);
  assert(indices.length>=1&&indices.length<=8&&indices.every(i=>Number.isInteger(i)&&i>=0&&i<fixtures.length),'Worker must contain 1–8 fixture indices.');
  const rows=[];
  for(const index of indices){
    rows.push(evaluate(fixtures[index]));
    const rss=process.memoryUsage().rss;
    assert(rss<=384*1024*1024,'Worker RSS exceeds 384 MiB; stop this run and review resources.');
  }
  process.stdout.write(JSON.stringify({rows,maxRssKiB:process.resourceUsage().maxRSS,elapsedSeconds:process.uptime()}));
  process.exit(0);
}
const selectedIndices=resourceSmoke?
  fixtures.map((fixture,index)=>({fixture,index})).filter(({fixture})=>fixture.view[0]===2000&&fixture.dpr===1.25).slice(0,16).map(({index})=>index):
  fixtures.map((fixture,index)=>index);
const rows=[],resources=[];
for(let start=0;start<selectedIndices.length;start+=8){
  const indices=selectedIndices.slice(start,start+8);
  const workerArgs=[__filename,'--worker-indices='+indices.join(','),...(prototypeMode?['--prototype']:[])];
  const result=spawnSync(process.execPath,workerArgs,{encoding:'utf8',maxBuffer:1024*1024,timeout:30000});
  assert(result.status===0,'Worker failed; stop without claiming complete fixtures: '+(result.error?.message||result.stderr||'exit '+result.status));
  const output=JSON.parse(result.stdout);
  assert.equal(output.rows.length,indices.length,'Worker count mismatch');
  assert(output.maxRssKiB<=384*1024,'Worker exceeded RSS limit');
  rows.push(...output.rows);resources.push({indices,maxRssKiB:output.maxRssKiB,elapsedSeconds:output.elapsedSeconds});
}
function summary(selected){
  const old=selected.filter(r=>r.parent),accepted=selected.filter(r=>r.candidate),both=accepted.filter(r=>r.parent);
  return {cases:selected.length,parentAccepted:old.length,candidateAccepted:accepted.length,candidateRejected:selected.length-accepted.length,
    parentMeanError:old.length?round(old.reduce((s,r)=>s+r.parent.errorWorld,0)/old.length):null,
    candidateMeanError:accepted.length?round(accepted.reduce((s,r)=>s+r.candidate.errorWorld,0)/accepted.length):null,
    candidateMaxError:accepted.length?Math.max(...accepted.map(r=>r.candidate.errorWorld)):null,
    commonCases:both.length,commonParentMeanError:both.length?round(both.reduce((s,r)=>s+r.parent.errorWorld,0)/both.length):null,
    commonCandidateMeanError:both.length?round(both.reduce((s,r)=>s+r.candidate.errorWorld,0)/both.length):null,
    improved:both.filter(r=>r.comparison==='improved').length,worse:both.filter(r=>r.comparison==='worse').length,
    same:both.filter(r=>r.comparison==='same').length};
}
const positive=rows.filter(r=>r.kind==='positive'||r.kind==='positive-npc'),negative=rows.filter(r=>r.kind==='negative');
const negativeAccepted=negative.filter(r=>r.candidate),unsupported=rows.filter(r=>r.kind==='unsupported');
const report={schemaVersion:1,kind:'offline-synthetic-raster',status:negativeAccepted.length?'negative-fixture-failure':'finite-negatives-rejected',
  naturalStarts:0,environment:{node:process.version,platform:process.platform,arch:process.arch,renderer:'@napi-rs/canvas',rendererVersion,browser:null},
  parentCommit:'518833396d155a1f388d11c11f5d977739e76b5d',
  sources:fixedSources.map(([file,sha256])=>({path:file,bytes:Buffer.byteLength(loaded.get(file)),sha256})),
  extractedHashes:{minimap:hash(drawSource),parentDetector:hash(originalDetector),candidateDetector:hash(candidateDetector),helper:hash(fs.readFileSync(path.join(__dirname,helperName)))},
  fixtureDefinition:{views,dprs,phases,positionNames,negativeVariants:negatives,world:[10400,7200],playerRadius:88,
    sourceRounding:'round(cssSize * dpr)',analysisRounding:'round(sourceSize * min(1, 2000/sourceWidth))',analysisRatio:'analysisWidth/cssWidth',
    partition:'All fixtures are development fixtures, not an independent holdout; no random seeds or natural games.'},
  positiveSummary:summary(positive),perView:views.map(view=>({view,...summary(positive.filter(r=>r.view[0]===view[0]&&r.view[1]===view[1]))})),
  original80:views.filter(view=>[958,2000].includes(view[0])).map(view=>({view,...summary(rows.filter(r=>r.kind==='positive'&&r.dpr===1&&r.view[0]===view[0]&&/^top\d+$/.test(r.position)))})),
  negativeSummary:{cases:negative.length,parentAccepted:negative.filter(r=>r.parent).length,candidateAccepted:negativeAccepted.length,
    perVariant:negatives.map(variant=>({variant,cases:negative.filter(r=>r.variant===variant).length,
      candidateAccepted:negative.filter(r=>r.variant===variant&&r.candidate).length})),acceptedIds:negativeAccepted.map(r=>r.id)},
  unsupportedSummary:{cases:unsupported.length,candidateAccepted:unsupported.filter(r=>r.candidate).length},
  limitations:[
    'Independent native rasterizer, not Chrome or a browser integration test. Natural starts remain zero.',
    'Explicit finite Canvas dimensions and DPRs; responsive CSS is not executed, and outer viewport-to-Canvas relationships are not established here.',
    'Known synthetic fixture coordinates are comparison labels only. The candidate receives raster classifications and visible dimensions, never fixture truth or hidden live game state.',
    'All rejects, accepted negative cases, worse cases and unchanged cases are retained below. Rejecting valid frames can stop movement and reduce growth; recall is not assured.',
    'The model assumes the unchanged original green camera rectangle and radius-3 player disk. It does not recover occluded NPC dots or establish danger geometry or killer identity.',
    'Finite negative rejection is not a universal confidence guarantee. Near-edge shape overlap and other renderers, colors, sizes, clipping and input pollution remain risks.',
    'No images, pixel arrays, image encodings, natural-game logs, browser starts or network calls are saved by this script.'
  ],rows};
if(resourceSmoke){report.status='resource-smoke-only';report.selectedIds=rows.map(row=>row.id);}
if(!prototypeMode){
  report.fixtureCorrection={variant:'cropTop',explanation:'The prototype demanded rejection although the player disk and camera frame were intact. The same 24 cases remain, now as background-crop; new cropFrame cases erase the upper half of the actual signal.'};
  report.backgroundCropSummary=summary(rows.filter(r=>r.kind==='background-crop'));
}
const serialized=JSON.stringify(report,null,2)+'\n';
if(args.includes('--write')){
  const destination=path.join(__dirname,prototypeMode?'prototype-perception-results.json':'perception-results.json');
  if(fs.existsSync(destination))assert.equal(fs.readFileSync(destination,'utf8'),serialized,'Existing observation differs; do not overwrite.');
  else fs.writeFileSync(destination,serialized,{flag:'wx'});
}
if(args.includes('--summary')){
  const {rows,...small}=report;process.stdout.write(JSON.stringify({...small,negativeAccepted:negativeAccepted.slice(0,6)},null,2)+'\n');
}else process.stdout.write(serialized);
process.stderr.write(JSON.stringify({workerCount:resources.length,cases:rows.length,workers:resources,maxWorkerRssKiB:Math.max(...resources.map(r=>r.maxRssKiB)),parentMaxRssKiB:process.resourceUsage().maxRSS,elapsedSeconds:process.uptime()})+'\n');
if(!resourceSmoke&&(negativeAccepted.length||unsupported.some(r=>r.candidate)))process.exitCode=1;
