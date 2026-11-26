'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'ocr-grow39.html'),'utf8');const lo=code.indexOf('function measureDots39('),hi=code.indexOf('function planGrow23(',lo);
const src=hi<0?code.slice(lo):code.slice(lo,hi);const {measure,track,route}=new Function(src+';return {measure:measureDots39,track:trackGrow39,route:routeGrow39}')();
const make=(time, px=50, points=[], red=[])=>({player:{x:px,y:50},width:144,height:144*7200/10400,viewWidth:958,viewHeight:557,observedAt:time,
  growMarkers:points.map(([x,y])=>({x,y,red:false})),threats:red.map(([x,y])=>({x,y})),opportunities:[]});
const q=10400/144,body=(x,y,r)=>({x,y,r,vx:0,vy:0,geometryAccepted:1,localReliable:true,clipped:false});
let m=make(5000,50,[[55,50],[59,50]]), s=track(m,[body(5*q,0,64)],100,null);
assert.equal(s.tracks.find(t=>t.source==='body').low,64*.94-1);
let first=s.tracks[0].id;
for(let n=1;n<=5;n++){m=make(5000+n*100,50-n*.7,[[55+n*.07,50],[59,50]]);s=track(m,[],100,s)}
let t=s.tracks.find(t=>t.id===first);assert.equal(t.source,'body');assert.ok(t.vx>=0&&t.vx<=200);assert.ok(route(s,m,100,340)?.id===first);
let onlyBody=track(make(5000),[body(100,20,63)],95,null);assert.equal(onlyBody.tracks.length,1);
const absent=track(make(5100),[],95,onlyBody);assert.equal(absent.tracks.length,1);
let forgotten=track(make(7200),[],95,absent);assert.equal(forgotten.tracks.length,0);
let previous=track(make(5000,50,[],[[60,50]]),[],100,null);
let change=track(make(5100,50,[[60,50]]),[],115,previous);
assert.equal(change.tracks[0].source,'color-change');assert.ok(change.tracks[0].low>=110 && change.tracks[0].high<130);
let ambiguous=track(make(5200,50,[[59.5,50],[60.55,50]]),[],115,change);assert.equal(ambiguous.tracks.filter(x=>x.measured>0).length,0);
let p=make(10200,50);p.dots39=[{x:58,y:50,scaleLow:65,scaleHigh:74},{x:64,y:50,scaleLow:58,scaleHigh:69},{x:70,y:50,scaleLow:60,scaleHigh:69}];
let ss=null;for(let n=0;n<3;n++){p.observedAt+=100;ss=track(p,[],110,ss);}
let trip=route(ss,p,110,340);assert.ok(trip&&trip.route.length>=2);assert.equal(new Set(trip.route).size,trip.route.length);
const red=route({...ss,tracks:ss.tracks.map(t=>({...t,red:true}))},p,110,340);assert.equal(red,null);
// Use a fractional center and increasing opacity at the original colors.
function circle(radius,red=false) {
  const width=144,height=100,cx=80.37,cy=41.61;
  const data=new Uint8ClampedArray(width*height*4);
  const floor=[32,50,56],ink=red?[255,138,126]:[211,238,225];
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    let hits=0;
    if(Math.abs(x-cx)<5&&Math.abs(y-cy)<5) {
      for(let j=0;j<12;j++) for(let k=0;k<12;k++)
        if(Math.hypot(x+(k+.5)/12-cx,y+(j+.5)/12-cy)<=radius)hits++;
    }
    const off=(y*width+x)*4;
    for(let c=0;c<3;c++)data[off+c]=floor[c]+(ink[c]-floor[c])*hits/144;
    data[off+3]=255;
  }
  const m={...make(1000),x:0,y:0,pixelRatio:1,growMarkers:[{x:cx,y:cy,red}]};
  return measure({data},width,height,m)[0];
}
for(const radius of [1.2,1.8,2.25,2.6])for(const red of [false,true]) {
  const fitted=circle(radius,red);
  assert.ok(fitted&&fitted.scaleLow<=radius*38&&fitted.scaleHigh>=radius*38);
}
assert.equal(circle(3).scaleHigh,0,'saturated dots have no finite upper estimate');
console.log('pixel radius, identity, ambiguity, expiry and route checks passed');
