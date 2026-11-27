'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {performance} = require('node:perf_hooks');
const {build} = require('./build-candidate.cjs');

const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');
const parent = read('../grow-38-public/ocr-grow38.html');
const donor = read('../grow-evaluation-20261125/bundle/source/experiments/grow15/frozen/screen-03/planner.js');
const candidate = read('ocr-grow45.html');
assert.equal(build(),candidate,'full reconstruction');
const bodyOf = (text, first, last) => {
  const start = text.indexOf(first), end = text.indexOf(last,start);
  assert(start >= 0 && end > start, first);
  return text.slice(start,end);
};
const parentCode = bodyOf(parent, 'function planGrow23(', 'if (typeof module');
const donorCode = bodyOf(donor, 'function planGrow15(', 'if (typeof module');
const route = bodyOf(candidate, 'function planGrow45(', 'let lastVision=0;');
assert.equal(bodyOf(candidate,'function planGrow23(', 'if (typeof module'),parentCode);
assert(candidate.includes(donorCode.trimEnd()),'historical planner body');
const grow38 = new Function(parentCode+'\nreturn planGrow23')();
const grow15 = new Function(donorCode+'\nreturn planGrow15')();
const grow45 = new Function(parentCode+donorCode+route+'\nreturn planGrow45')();
const originalTick = bodyOf(parent, 'function tick(', 'let lastMap=null;');
const routedTick = bodyOf(candidate, 'function tick(', 'let lastMap=null;');
assert.equal(routedTick.replace('?planGrow45(', '?planGrow23('),originalTick,'live decision/actuation path');
assert.equal(bodyOf(parent,'function readImage(', 'function planBaseline('),
  bodyOf(candidate,'function readImage(', 'function planBaseline('),'capture and visible detection');
for(const match of candidate.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(match[1]);

const body=(x,y,r,extra={})=>({x,y,r,visualR:r,originalRadius:r,npc:true,localReliable:true,labelSeen:true,
  geometryAccepted:1,blocked:false,clipped:false,vx:0,vy:0,...extra});
const food=(x,y)=>({x,y,r:10,npc:false,vx:0,vy:0,blocked:false,clipped:false});
const scene={width:144,height:100,player:{x:72,y:50},visibleWalls:[5200,5200,3600,3600],growMarkers:[],
  opportunities:[],threats:[],viewWidth:2250,viewHeight:1308};
const cases=[
  ['food only',70,[food(-170,10),food(-220,25)]],
  ['visible edible NPC',90,[body(200,10,48),food(-140,-20)]],
  ['geometry fallback',80,[body(164,12,65,{geometryAccepted:0,visualR:60}),food(-120,0)]],
  ['two moving NPCs',95,[body(145,0,96,{vx:10}),body(245,10,75,{vx:-70})]],
  ['wall and nearby food',71,[food(-100,0),food(-200,40)],{...scene,visibleWalls:[98,10302,3600,3600]}],
  ['distant white and nearby red markers',95,[food(80,100)],{...scene,growMarkers:[
    {x:92,y:50,red:false,area:8},{x:75,y:50,red:true,area:12}]}],
  ['strong red',62,[body(-45,-30,130,{isRed:true}),body(125,15,98)]],
  ['rounded HUD 184 and near non-red body',184,[body(289,8,198)]],
  ['before cap immunity',185,[body(245,12,196,{isRed:true}),food(-150,0)]],
  ['at cap immunity',186,[body(245,12,196,{isRed:true}),food(-150,0)]],
  ['clipped body',87,[body(-64,-29,55,{clipped:true,dangerRadius:109})]],
  ['map unavailable',140,[food(64,70)],null],
  ['stale reading',90,[body(180,5,65)],{...scene,stale:true}],
];
const fixed = cases.map(([name,r,objects,map=scene])=>({name,args:[objects,r,map,260,{x:0,y:0},{x:0,y:1}]}));
for(const {name,args} of fixed){
  for(const [version,reference] of [['v2.13',grow38],['v2.22',grow15]]){
    const input=[...args,version];
    const expected=reference(...input), actual=grow45(...input);
    assert.deepEqual(actual,expected,name+' '+version);
    assert.equal(actual.strategy,version==='v2.13'?'grow-23':'grow-15');
  }
}
const fallback=fixed.find(test=>test.name==='geometry fallback').args;
assert.equal(grow38(...fallback,'v2.22').eligibleNpc,0);
assert.equal(grow45(...fallback,'v2.22').eligibleNpc,1);
console.log(JSON.stringify({fixtures:fixed.length,matchedFullDecisions:{'v2.13':fixed.length,'v2.22':fixed.length},
  fallbackEligibleNpc:{Grow38:0,Grow45:1},gameStarts:0}));
if(process.argv.includes('--bench')){
  for(const version of ['v2.13','v2.22']){
    const durations=[];
    for(let round=0;round<11;round++)for(const {args} of fixed){
      const start=performance.now();grow45(...args,version);
      if(round>0)durations.push(performance.now()-start);
    }
    durations.sort((a,b)=>a-b);
    const quantile=p=>Number(durations[Math.ceil(p*durations.length)-1].toFixed(3));
    console.log(JSON.stringify({version,syntheticCalls:durations.length,plannerOnlyMs:{p50:quantile(.5),p95:quantile(.95),max:quantile(1)}}));
  }
}
