'use strict';
// Fixed small development set, declared before the first planner comparison.
// These are synthetic visible controller observations, not game-state reads.
const body=(x,y=0,r=56)=>({x,y,r,visualR:r,originalRadius:r,npc:true,localReliable:true,
  labelSeen:true,geometryAccepted:1,blocked:false,clipped:false,vx:0,vy:0});
const food=(x,y=0)=>({x,y,r:10,npc:false,blocked:false,clipped:false});
function mapAt(x=5200,y=3600) {
  return {width:144,height:100,player:{x:x*144/10400,y:y*100/7200},growMarkers:[],
    threats:[],opportunities:[],visibleWalls:[x,10400-x,y,7200-y],viewWidth:2250,viewHeight:1308,pixelRatio:1};
}
const cases=[
  {id:'open-visible-prey',objects:[body(310)],map:mapAt(),expect:'open'},
  {id:'east-wall-competing-targets',objects:[body(322,-78),food(106,-113)],map:mapAt(9883,5715),velocity:{x:74,y:-47}},
  {id:'already-near-wall-inertia',objects:[],map:mapAt(10220,3600),velocity:{x:220,y:0}},
  {id:'wall-ahead-prey',objects:[body(400)],map:mapAt(9550,3600)},
  {id:'near-wall-small-food',objects:[food(180)],map:mapAt(10000,3600)},
  // Added after the first 14-case run to isolate the same opportunity cost for
  // an edible NPC. No controller parameter or earlier case was changed.
  {id:'near-wall-small-npc',objects:[body(180,0,20)],map:mapAt(10000,3600)},
  {id:'corner-edible-prey',objects:[body(210,40)],map:mapAt(10000,6800)},
  {id:'near-wall-contact-prey',objects:[body(95,0,80)],map:mapAt(9900,3600)},
  {id:'hard-predator-near-wall',objects:[{...body(-230,0,160),isRed:true}],map:mapAt(10000,3600)},
  {id:'overlapping-hard-threats',objects:[body(130,0,180),body(-130,0,180),body(0,130,180),body(0,-130,180)],map:mapAt(10000,3600),expect:'escape'},
  {id:'missing-map',objects:[body(310)],map:null,expect:'inactive'},
  {id:'stale-map',objects:[body(310)],map:{...mapAt(10000,3600),stale:true},expect:'lost'},
  {id:'conflicting-visible-wall-estimate',objects:[body(310)],map:{...mapAt(),visibleWalls:[10000,400,3600,3600]},expect:'map-world-source'},
  {id:'cap200-immunity',r:186,objects:[body(180,0,150)],map:mapAt(9873,3600)},
  {id:'both-stall-and-wall',objects:[body(322,-78),food(106,-113)],map:mapAt(9883,5715),velocity:{x:74,y:-47},parentWarmup:12,expect:'two-stages'},
];
module.exports={cases,body,food,mapAt};
