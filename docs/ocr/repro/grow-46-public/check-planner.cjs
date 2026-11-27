'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const {build}=require('./build-candidate.cjs');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const p=read('../grow-45-public/ocr-grow45.html'),c=read('ocr-grow46.html');
assert.equal(build(),c);
function part(s,start,end){const at=s.indexOf(start),until=s.indexOf(end,at);assert(at>=0&&until>at);return s.slice(at,until);}
const p38=part(p,'function planGrow23(','if (typeof module');
assert.equal(part(c,'function planGrow23(','if (typeof module'),p38);
const old=new Function(p38+part(p,'function planGrow15(','let lastVision=0;')+'\nreturn planGrow45')();
const next=new Function(p38+part(c,'function chaseEvidence46(','let totals46=')+'\nreturn planGrow46')();
for(const script of c.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(script[1]);
const m={width:144,height:100,player:{x:72,y:50},growMarkers:[],threats:[],opportunities:[],
  visibleWalls:[4100,6300,3300,3900],viewWidth:2250,viewHeight:1308};
const body=(x,y=0,r=56)=>({x,y,r,visualR:r,originalRadius:r,npc:true,localReliable:true,labelSeen:true,
  geometryAccepted:1,blocked:false,clipped:false,vx:0,vy:0});
const initial={x:1,y:0};
function args(objects,heading,version,map=m,velocity={x:0,y:0}){return [objects,96,map,300,velocity,heading,version];}
function decision(objects,heading,now,toast=false,map=m){return next(...args(objects,heading,'v2.22',map),now,toast);}
function withoutDiagnostics(o){const {tracking46,chase46,penalty46,...rest}=o;return {...rest,strategy:'grow-15'};}
const stationary=[body(310)];
let phase=initial;
for(const now of [0,100,200,300,400,500,600,700,800,900,1000,1100]){
  const d=decision(stationary,phase,now);
  assert.equal(d.tracking46.discountedPaths,0);
  assert.deepEqual(withoutDiagnostics(d),old(...args(stationary,phase,'v2.22')));
  phase=d;
}
const stalled=decision(stationary,phase,1200);
assert.equal(stalled.tracking46.stagnant,2);
assert(stalled.tracking46.discountedPaths>0,'a genuinely stalled pursuit discounts safe second-leg-only contacts');
assert.equal(stalled.tracking46.chosenPenalty,0,'a first-leg approach retains full predicted gain');
for(const [name,objects,map,now,toast] of [
  ['fresh progress',[body(282)],m,1300,false],['changed body radius',[body(310,0,47)],m,1300,false],
  ['ambiguous identities',[body(310),body(320,70)],m,1300,false],['unconfirmed body',[{...body(310),geometryAccepted:0}],m,1300,false],
  ['unreliable body',[{...body(310),localReliable:false}],m,1300,false],['blocked body',[{...body(310),blocked:true}],m,1300,false],
  ['clipped body',[{...body(310),clipped:true}],m,1300,false],['red body',[{...body(310),isRed:true}],m,1300,false],
  ['already in contact',[body(72)],m,1300,false],['visible NPC toast',stationary,m,1300,true],
  ['missing map',stationary,null,1300,false],['expired observation',stationary,m,2801,false],
  ['food only',[{x:95,y:0,r:9,npc:false,blocked:false,clipped:false}],m,1300,false],
  ['white minimap marker only',[],{...m,growMarkers:[{x:90,y:50,red:false,area:7}]},1300,false],
]){
  const d=decision(objects,stalled,now,toast,map);
  assert.equal(d.tracking46.discountedPaths,0,name);
  assert.deepEqual(withoutDiagnostics(d),old(...args(objects,stalled,'v2.22',map)),name);
}
// A repeatable scoring witness. Positions and velocity estimates are fixed controller inputs.
const competing=[body(322,-78),{x:106,y:-113,r:10,npc:false,blocked:false,clipped:false}];
const wallMap={...m,player:{x:9883*144/10400,y:5715*100/7200},visibleWalls:[9883,517,5715,1485]};
let changed=initial;
for(let time=0;time<=1200;time+=100){
  const a=args(competing,changed,'v2.22',wallMap,{x:74,y:-47});
  const baseline=old(...a);
  changed=next(...a,time,false);
  assert.equal(changed.tracking46.baselineFirst,baseline.first);
  assert.equal(changed.tracking46.baselineSecond,baseline.second);
  if(time<1200)assert.equal(changed.tracking46.firstChanged,false);
}
assert.deepEqual([changed.tracking46.baselineFirst,changed.tracking46.baselineSecond],[2,7]);
assert.deepEqual([changed.first,changed.second],[5,0]);
assert.equal(changed.tracking46.firstChanged,true);
const restart=decision(stationary,initial,1300);assert.equal(restart.tracking46.stagnant,0);
for(const now of [1200,1200,1200])assert.equal(decision(stationary,restart,now).tracking46.stagnant,0);
for(const version of ['v2.13','v2.20','v2.21'])for(const objects of [stationary,[],[body(120,30,140)]]){
  const a=args(objects,stalled,version);assert.deepEqual(next(...a,1300,false),old(...a),'other game version');
}
assert(c.includes('function release(){if(heading?.chase46)delete heading.chase46;'));
assert(c.indexOf('if(d.mapStatus===\'lost\')release();else move(d);')<c.indexOf('totals46.applied++'));
console.log(JSON.stringify({starts:0,stallAfterMs:1200,discountedSafePaths:stalled.tracking46.discountedPaths,
  ordinaryApproachPenalty:stalled.tracking46.chosenPenalty,syntheticTurn:[changed.tracking46.baselineFirst,changed.first],guardCases:14,otherVersionDecisions:9}));
