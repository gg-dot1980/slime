'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname,'ocr-grow29.html'),'utf8');
function extract(name, end) {
  const start = html.indexOf('function '+name+'(');
  assert.ok(start >= 0);
  const stop = html.indexOf(end,start);
  assert.ok(stop > start);
  return html.slice(start,stop);
}
const ctx = vm.createContext({});
vm.runInContext(extract('scoutDots29','function growMapInputs('),ctx);
vm.runInContext(extract('planGrow23','if (typeof module'),ctx);
vm.runInContext(extract('growMarkers','// Recover subpixel NPC dots'),ctx);
const scout = ctx.scoutDots29, plan = ctx.planGrow23;
const width=144, height=100, floor=[32,50,56], pale=[211,238,225];
const makeMap = () => ({width,height,x:0,y:0,pixelRatio:1,viewWidth:958,viewHeight:557,
  player:{x:60,y:55},threats:[],opportunities:[],growMarkers:[]});
function drawEllipse(cx,cy,rx,ry,color){
  const data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<data.length;i+=4)data.set([...floor,255],i);
  for(let y=Math.floor(cy-ry)-1;y<cy+ry+1;y++)for(let x=Math.floor(cx-rx)-1;x<cx+rx+1;x++){
    let inside=0;
    for(let k=0;k<16;k++)for(let j=0;j<16;j++){
      const dx=(x+(j+.5)/16-cx)/rx,dy=(y+(k+.5)/16-cy)/ry;
      if(dx*dx+dy*dy<=1)inside++;
    }
    for(let c=0;c<3;c++)data[(y*width+x)*4+c]=floor[c]+inside/256*(color[c]-floor[c]);
  }
  return {data};
}
function testDot(cx,cy,rx,ry,color,changes={}) {
  const map={...makeMap(),...changes};
  map.opportunities=[{x:cx,y:cy,area:4}];
  return scout(drawEllipse(cx,cy,rx,ry,color),width,map);
}
let subpixels=0, recoveredStrictMisses=0;
for(const fx of [.05,.25,.50,.75,.95])for(const fy of [.05,.25,.50,.75,.95]){
  const found=testDot(82+fx,57+fy,1.2,1.2,pale);
  assert.equal(found.length,1,'minimum radius dot '+fx+','+fy);
  assert.ok(Math.hypot(found[0].x-82-fx,found[0].y-57-fy)<.15);
  assert.equal(found[0].scoutOnly,true);
  const strict=ctx.growMarkers(drawEllipse(82+fx,57+fy,1.2,1.2,pale),width,height,makeMap());
  if (!strict.some(m=>!m.red)) recoveredStrictMisses++;
  subpixels++;
}
assert.ok(recoveredStrictMisses>=10,'fixture contains missed small markers');
for(const color of [[255,138,126],[163,243,209],[255,255,255],[150,165,220]]){
  assert.equal(testDot(82.5,57.5,1.2,1.2,color).length,0,'foreign color '+color);
}
assert.equal(testDot(82.5,57.5,2.8,.65,pale).length,0,'thin stroke');
assert.equal(testDot(60.5,55.5,1.2,1.2,pale).length,0,'player/camera');
assert.equal(testDot(82.5,57.5,1.2,1.2,pale,{threats:[{x:85,y:57}]}).length,0,'possible red alias');
assert.equal(testDot(82.5,57.5,1.2,1.2,pale,{growMarkers:[{x:84,y:57,red:false}]}).length,0,'strict duplicate');
assert.equal(testDot(2.5,57.5,1.2,1.2,pale).length,0,'minimap border');
const weakDot={x:72,y:55,area:4,red:false,scoutOnly:true};
const guideMap={...makeMap(),growMarkers:[weakDot]};
const steer=(m,objects=[])=>plan(objects,40,m,320,{x:0,y:0},{x:-1,y:0},'v2.13');
const guided=steer(guideMap);
assert.equal(guided.reason,'scout-visible-dot');
assert.equal(guided.target.scoutOnly,true);
assert.equal(guided.gain,0);
assert.equal(guided.x,1,'one eastern dot should cause an eastern first command');
assert.equal(guided.y,0);
assert.equal(steer({...guideMap,stale:true}).mapStatus,'lost');
const enemy={x:155,y:0,r:70,visualR:70,vx:0,vy:0,npc:true,labelSeen:true,localReliable:true,isRed:true};
const escape=steer(guideMap,[enemy]);
assert.notEqual(escape.first,guided.first,'no direct approach through an enemy');
assert.ok(escape.clearance>4,'detour meets the ordinary clearance threshold');
console.log(JSON.stringify({passed:true,subpixelOffsets:subpixels,recoveredStrictMisses,foreignColors:4,shapeAndExclusionCases:5,steeringChecks:3}));
