'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function planner(file) {
  const html=fs.readFileSync(file,'utf8');
  const start=html.indexOf('function planGrow23('),end=html.indexOf('if (typeof module',start);
  assert(start>=0 && end>start);
  return new Function(html.slice(start,end)+';return planGrow23;')();
}
const parent=planner(path.join(__dirname,'../grow-38-public/ocr-grow38.html'));
const candidate=planner(path.join(__dirname,'ocr-grow44.html'));
const map={width:144,height:100,player:{x:72,y:50},visibleWalls:[5200,5200,3600,3600],growMarkers:[],opportunities:[],threats:[],
  viewWidth:2250,viewHeight:1308,observedAt:60000};
const body=(x,y,r)=>({x,y,r,visualR:r,originalRadius:r,localReliable:true,labelSeen:true,geometryAccepted:1,confidence:.98,
  npc:true,blocked:false,clipped:false,vx:0,vy:0});
const food=(x,y)=>({x,y,r:10,npc:false,vx:0,vy:0,clipped:false,blocked:false});
const prey=body(180,0,22),foods=[food(-120,40),food(-132,52),food(-144,64)];
const objects=[prey,...foods];
const input=(objects,version,scene=map)=>[objects,88,scene,260,{x:0,y:0},{x:0,y:1},version];
const fixtures=[
  ['edible body and food',objects,map],
  ['food only',foods,map],
  ['red body',[{...prey,isRed:true},...foods],map],
  ['clipped body',[{...prey,clipped:true},...foods],map],
  ['blocked body',[{...prey,blocked:true},...foods],map],
  ['white marker without a body',foods,{...map,growMarkers:[{x:90,y:50,red:false,area:9}]}],
  ['larger body in the approach corridor',[...objects,body(200,0,140)],map],
  ['wall between player and prey',objects,{...map,visibleWalls:[5200,115,3600,3600]}],
  ['prey beyond two seconds',[body(900,0,22),...foods],map]
];
for(const [name,items,scene] of fixtures){
  const baseline=input(items,'v2.13',scene);assert.deepEqual(candidate(...baseline),parent(...baseline),name+': v2.13 parity');
  const latest=input(items,'v2.22',scene),after=candidate(...latest),before=parent(...latest);
  if(name===fixtures[0][0]){
    assert.equal(before.first,4);assert.equal(after.first,0);
    const expected=12*.75*(Math.sqrt(88*88+.55*22*22)-88)/(.6+.35);
    assert(Math.abs(after.npcContactBonus44-expected)<1e-9,'first-leg contact uses the donor discount');
    assert(after.clearance>4 && after.wallOK && after.spawnWallOK);
  }else{
    assert.equal(after.npcContactBonus44,undefined,name+': no bonus');
    assert.deepEqual(after,before,name+': parent action and diagnostics');
  }
}
console.log('Passed 9 visible-input fixtures for each game version.');
