#!/usr/bin/env node
'use strict';
// Source/integration checks only; never launches a browser or game.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const dir=__dirname,read=n=>fs.readFileSync(path.join(dir,n),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const page=read('index.html'),manifest=JSON.parse(read('manifest.json'));
const parent=fs.readFileSync(path.join(dir,'../grow14/planner.js'),'utf8');
assert.equal(read('planner.js').replaceAll('grow-15','grow-14').replaceAll('Grow15','Grow14'),parent,
  'Planner logic and safety thresholds must remain identical to grow-14');
for(const [field,file] of [['sourceHash','source-base.html'],['geometryHash','geometry.js'],
  ['plannerHash','planner.js'],['harnessHash','harness.js'],['buildHash','build-lab.mjs'],
  ['pageHash','index.html'],['isolationHash','game-isolation.mjs']])
  assert.equal(manifest[field],sha(read(file)),field+' must identify the exact frozen source');
const unhashed={...manifest};delete unhashed.protocolHash;
assert.equal(manifest.protocolHash,sha(JSON.stringify(unhashed)),'Protocol content hash');
assert.equal(manifest.screen.id,'screen-03');
assert.equal(manifest.confirmation.id,'confirm-03');
assert.equal(manifest.confirmation.NPerVersion,12);
assert.equal(manifest.maxComputeMs,200);
assert.deepEqual(manifest.viewport,{gameWidth:2000,gameHeight:1163});
assert.deepEqual(manifest.screen.order,Array.from({length:4},()=>['v2.13','v2.22'].map(version=>({strategy:'grow-15',version}))).flat());
assert.equal(read('harness.js').includes("r.outcome==='win_le150').length>=2"),true,'Keep 2/4 gate for each version');
assert(!page.includes('__GROW_GAMES__'),'Embedded games are resolved');
let scriptCount=0;
for(const match of page.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
  if(!match[1].trim())continue;new vm.Script(match[1],{filename:'grow15-inline-'+scriptCount+'.js'});scriptCount++;
}
new vm.Script(read('harness.js'),{filename:'grow15-harness.js'});
assert.equal(scriptCount,2,'Timing and controller inline scripts parse');
assert(page.includes("if(map&&(runStrategy==='grow-12'||runStrategy==='grow-15'))map.growMarkers="),
  'Candidate receives strict minimap markers');
// Grow-14 keeps a legacy fallback in its pure planner. The unchanged candidate
// pipeline always supplies an array, including [] when strict detection fails.
const markerStart=page.indexOf('function growMarkers(');
const markerEnd=page.indexOf('\nfunction growMapInputs(',markerStart);
assert(markerStart>=0&&markerEnd>markerStart,'Locate actual strict marker detector');
const strictMarkers=new Function(page.slice(markerStart,markerEnd)+'\nreturn growMarkers;')();
assert.deepEqual(strictMarkers(null,2,2,null),[],'Missing marker data yields an array');
assert.deepEqual(strictMarkers({data:new Uint8ClampedArray(16)},2,2,
  {player:{x:1,y:1},width:2,height:2,x:0,y:0}),[],'Empty marker frame yields an array');
const dotsExpression=read('planner.js').match(/const dots = ([^;]+);/)[1];
const chooseDots=new Function('map','return '+dotsExpression+';');
assert.deepEqual(chooseDots({growMarkers:[],get opportunities(){throw Error('Legacy fallback used');}}),[],
  'Strict empty arrays never fall back to permissive opportunities');

// Execute the actual object-construction block with numeric stubs. This tests
// pixel-centre AND radius conversion, abstention, and unchanged food handling.
const start=page.indexOf('const used=new Set(),objects=parts.map(p=>{');
const end=page.indexOf('\n const analysis={objects,map,velocity}',start);
assert(start>=0&&end>start,'Locate actual readImage object mapping');
const makeObjects=new Function('parts','image','w','h','ratio','radius','previous','camera',
  'measuredCamera','dt','prior','hasSlimeLabel','highlightRadius','refineSlimeGeometry',
  'hasDangerLabel','runStrategy',page.slice(start,end)+'\nreturn objects;');
let calls=0;
function run({accepted=true,strategy='grow-15',food=false}={}){
  const p={x:120,y:80,r:food?8:28,bw:56,bh:56,area:2500,clipped:false};
  const refine=()=>{calls++;return accepted?{x:130,y:90,r:30,confidence:.93}:null;};
  return makeObjects([p],{data:null},200,160,.5,50,[],{x:0,y:0},null,.1,null,
    ()=>!food,()=>27,refine,()=>false,strategy)[0];
}
const yes=run();
assert.equal(yes.x,60);assert.equal(yes.y,20);assert.equal(yes.r,60);
assert.equal(yes.originalRadius,54);assert.equal(yes.visualR,56);
assert.equal(yes.geometryAccepted,1);assert.equal(yes.confidence,.93);
const no=run({accepted:false});
assert.equal(no.x,40);assert.equal(no.y,0);assert.equal(no.r,54);
assert.equal(no.geometryAccepted,0);assert.equal(no.confidence,null);
const before=calls,food=run({food:true}),baseline=run({strategy:'grow-12'});
assert.equal(calls,before,'Food and baseline do not call the geometry refiner');
assert.equal(food.npc,false);assert.equal(food.r,16);assert.equal(food.x,40);
assert.equal(baseline.r,54);assert.equal(baseline.x,40);
assert(read('harness.js').includes('geometryAcceptedCount:'),'Per-second accepted count is recorded');
assert(read('harness.js').includes('originalRadius:rec.target.originalRadius'),'Target original radius is recorded');
console.log(JSON.stringify({result:'PASS',inlineScripts:scriptCount,
  planner:'grow-14 logic unchanged after naming normalization',
  integrationCases:['accepted-centre-and-radius-ratio','null-keeps-original','food-unchanged','baseline-unchanged'],
  protocolHash:manifest.protocolHash,geometryHash:manifest.geometryHash,
  scope:'source and numeric integration checks only; no gameplay'},null,2));
