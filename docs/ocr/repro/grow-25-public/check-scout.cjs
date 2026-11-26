'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
function extract(html,name){const start=html.indexOf('function '+name+'('),end=html.indexOf('\nif (typeof module',start);assert(start>=0&&end>start);return new Function(html.slice(start,end)+'\nreturn '+name+';')();}
function check(parent,candidate){
 const before=extract(parent,'planGrow23'),after=extract(candidate,'planGrow25');
 const base={player:{x:72,y:49.846153846},width:144,height:144*9/13,pixelRatio:1,viewWidth:660,viewHeight:384,threats:[],growMarkers:[],visibleWalls:[4000,4000,3000,3000]};
 const mark=(x,y,red=false,area=8)=>({x:base.player.x+x/10400*base.width,y:base.player.y+y/7200*base.height,red,area});
 const cases=[
  {name:'north near',map:{...base,growMarkers:[mark(0,-275)]},near:-1},
  {name:'south near',map:{...base,growMarkers:[mark(0,275)]},near:1},
  {name:'wide',map:{...base,viewWidth:2000,viewHeight:1163,growMarkers:[mark(0,-275)]},same:true},
  {name:'uncertain edge',map:{...base,growMarkers:[mark(0,-220)]},same:true},
  {name:'inside',map:{...base,growMarkers:[mark(0,-160)]},same:true},
  {name:'red',map:{...base,growMarkers:[mark(0,-275,true)]},same:true},
  {name:'known body',map:{...base,growMarkers:[mark(0,-275)]},objects:[{x:0,y:-275,r:80,npc:true,localReliable:true,geometryAccepted:1}],same:true},
  {name:'far',map:{...base,growMarkers:[mark(0,-900)]},same:true},
  {name:'white and red',map:{...base,growMarkers:[mark(0,-275),mark(0,-300,true)]},sameDirection:true},
  {name:'wall',map:{...base,visibleWalls:[4000,4000,270,3000],growMarkers:[mark(0,-275)]},wall:true},
  {name:'empty',map:base,same:true},
  {name:'stale',map:{...base,stale:true,growMarkers:[mark(0,-275)]},same:true},
  {name:'unknown dimensions',map:{...base,viewHeight:undefined,viewWidth:undefined,growMarkers:[mark(0,-275)]},same:true}
 ];
 const norm=o=>({...o,strategy:'same'});
 let n=0,rows=[];
 function ok(v,label){assert(v,label);n++;}
 for(const version of ['v2.13','v2.22'])for(const t of cases){
  const args=[t.objects||[],95,t.map,250,{x:0,y:0},{x:1,y:0},version];
  const a=before(...args),b=after(...args),label=version+' '+t.name;
  if(t.near){ok(a.scoutTargets===0,label+' old blind spot');ok(b.scoutTargets===1,label+' candidate visible dot');ok(b.x===0&&b.y===t.near,label+' initial direction');ok(b.target?.mapOnly&&b.target?.nearScout,label+' scout only');ok(b.gain===0,label+' no fictional growth');}
  if(t.same)ok(JSON.stringify(norm(a))===JSON.stringify(norm(b)),label+' unchanged');
  if(t.sameDirection){ok(a.x===b.x&&a.y===b.y,label+' red priority');ok(b.clearance===a.clearance,label+' clearance');ok(!b.target?.nearScout,label+' not targeting red corridor');}
  if(t.wall){ok(b.wallOK===true,label+' hard wall');ok(b.endY>=95+14-270-2,label+' end wall floor');if(version==='v2.22')ok(b.spawnWallOK===true,label+' spawn reserve');}
  rows.push({version,case:t.name,before:[a.x,a.y,a.scoutTargets??null],after:[b.x,b.y,b.scoutTargets??null],gain:b.gain,clearance:b.clearance});
 }
 return {cases:rows.length,assertions:n,rows};
}
if(require.main===module){const parent=fs.readFileSync(path.join(__dirname,'../grow-24-public/ocr-grow24.html'),'utf8'),candidate=fs.readFileSync(path.join(__dirname,'ocr-grow25.html'),'utf8');console.log(JSON.stringify(check(parent,candidate),null,2));}
module.exports={check};
