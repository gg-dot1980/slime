'use strict';
// Hand-constructed public numbers only. Never read a natural-game ledger.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x));
const baseMap={player:{x:72,y:144*9/26},width:144,height:144*9/13,pixelRatio:1,
  viewWidth:958,viewHeight:557,observedAt:1000,visibleWalls:[5200,5200,3600,3600],
  growMarkers:[],threats:[],opportunities:[]};
const food=(x,y,r=10)=>({x,y,r,npc:false,clipped:false,blocked:false,labelSeen:false,
  localReliable:false,geometryAccepted:0,visualR:r,originalRadius:r,confidence:null,
  stalled:0,isRed:false,dangerRadius:r,vx:0,vy:0});
const npc=(x,y,r,isRed=false)=>({...food(x,y,r),npc:true,labelSeen:true,localReliable:true,
  geometryAccepted:1,confidence:.9,isRed});
const wallMap=(x,y)=>({...clone(baseMap),player:{x:x/10400*144,y:y/7200*baseMap.height},
  visibleWalls:[x,10400-x,y,7200-y]});
const marker=(x,y,area=4,red=false,m=baseMap)=>({x:m.player.x+x/10400*m.width,
  y:m.player.y+y/7200*m.height,area,red});
const specs=[
  {name:'food-west-clear',hud:40,speed:360,objects:[food(-360,120)]},
  {name:'food-west-hazard-90',hud:40,speed:360,objects:[food(-360,120),npc(-360,-150,90,true)]},
  {name:'food-west-hazard-110',hud:40,speed:360,objects:[food(-360,120),npc(-360,-150,110,true)]},
  {name:'food-east-mirrored-hazard',hud:40,speed:360,heading:{x:-1,y:0},objects:[food(360,-120),npc(360,150,110,true)]},
  {name:'visible-npc-south-wall',hud:70,speed:350,map:wallMap(5200,6975),
    objects:[npc(-390,210,45)],velocity:{x:-100,y:30},heading:{x:-1,y:0}},
  {name:'visible-moving-npc-and-danger',hud:80,speed:320,
    objects:[{...npc(-360,120,40),vx:-80,vy:20},npc(-320,-130,115,true)]},
  {name:'visible-close-edible-npc',objects:[npc(220,0,50)]},
  {name:'visible-neutral-npc',hud:70,objects:[npc(240,0,67)]},
  {name:'future-food-capture-full-inertia',hud:40,objects:[food(-150,0)],velocity:{x:300,y:0}},
  {name:'future-food-capture-half-inertia',hud:40,objects:[food(-150,0)],velocity:{x:150,y:0}},
  {name:'future-npc-capture-full-inertia',objects:[npc(-160,0,30)],velocity:{x:300,y:0}},
  {name:'two-food-target-switch',hud:40,objects:[food(-140,0),food(240,100)]},
  {name:'food-cluster',objects:[food(200,0),food(240,20),food(280,-20)]},
  {name:'empty-visible-map',unchanged:true},
  {name:'missing-map-empty-view',map:null,unchanged:true},
  {name:'explicit-stale-map',map:{...baseMap,stale:true},objects:[food(-200,0)],unchanged:true},
  {name:'aged-map-601ms',map:{...baseMap,observedAt:399},objects:[npc(-220,0,40)],unchanged:true},
  {name:'aged-map-exact-600ms',map:{...baseMap,observedAt:400},objects:[food(-200,0)]},
  {name:'map-only-north-350',map:{...baseMap,growMarkers:[marker(0,-350)]},unchanged:true},
  {name:'map-only-south-350',map:{...baseMap,growMarkers:[marker(0,350)]},unchanged:true},
  {name:'map-only-far-and-food',map:{...baseMap,growMarkers:[marker(0,-1200,16)]},objects:[food(-360,120)]},
  {name:'west-wall-visible-food',hud:70,map:wallMap(120,3600),objects:[food(-80,120),food(240,30)]},
  {name:'corner-food-and-npc',hud:70,map:wallMap(90,90),objects:[food(80,60),npc(250,80,40)]},
  {name:'forced-escape-overlap',hud:70,objects:[npc(60,0,160,true),food(-250,50)]},
  {name:'narrow-safe-corridor',hud:70,objects:[npc(250,-100,125,true),npc(250,100,125,true),food(-300,0)]},
  {name:'version-immune-switch',hud:190,objects:[npc(230,0,200,true),food(-250,0)]},
  {name:'visible-npc-continuity-left',hud:80,objects:[npc(-260,40,30),npc(260,-40,30)],
    heading:{x:-1,y:0,target:{x:-250,y:40,r:30,npc:true,mapOnly:false}}},
  {name:'visible-npc-continuity-right',hud:80,objects:[npc(-260,40,30),npc(260,-40,30)],
    heading:{x:1,y:0,target:{x:250,y:-40,r:30,npc:true,mapOnly:false}}},
  {name:'sideways-inertia-visible-food',hud:40,objects:[food(-360,120)],velocity:{x:0,y:-250}},
  {name:'clipped-and-blocked-npc-exclusions',objects:[{...npc(-280,80,45),clipped:true,dangerRadius:100},{...npc(250,80,40),blocked:true,stalled:1},food(0,-160)]}
];
function fixtures(){return {schemaVersion:1,kind:'fixed hand-constructed numeric fixtures; no natural snapshots',
  nativeGeometryReference:{canvas:[958,557],dpr:1},
  cases:specs.flatMap((s,i)=>['v2.13','v2.22'].map(version=>({id:String(i+1).padStart(2,'0')+'-'+version+'-'+s.name,
    name:s.name,expectCompleteUnchanged:!!s.unchanged,clock:1000,
    input:{objects:clone(s.objects||[]),hud:s.hud??95,map:clone(Object.hasOwn(s,'map')?s.map:baseMap),
      speed:s.speed??300,velocity:clone(s.velocity||{x:0,y:0}),heading:clone(s.heading||{x:1,y:0}),splitGuard:true,gameVersion:version}})))};}
if(require.main===module){const file=path.join(__dirname,'fixtures.json'),data=JSON.stringify(fixtures(),null,2)+'\n';if(process.argv.includes('--write')){if(fs.existsSync(file))assert.equal(fs.readFileSync(file,'utf8'),data);else fs.writeFileSync(file,data,{flag:'wx'});}console.log(JSON.stringify({cases:fixtures().cases.length,bytes:Buffer.byteLength(data),output:file}));}
module.exports={fixtures};
