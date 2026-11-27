'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {createCanvas}=require('@napi-rs/canvas');
const place=path.resolve(__dirname,'../../../..');
const html=cp.execFileSync('git',['cat-file','blob','16d41cdf2997baf0b3af33567b201d2dfb835427'],{cwd:place,encoding:'utf8'});
const start=html.indexOf('const miniPad=10,'),end=html.indexOf('\n}',start);
if(start<0||end<0)throw Error('Cannot locate original map renderer');
const draw=new Function('ctx','vw','vh','W','H','cam','player','slimes','isTraditional',html.slice(start,end));
const detect=new Function(fs.readFileSync(path.join(__dirname,'edge.js'),'utf8')+'\nreturn edgeMarkers36;')();
const w=958,h=557,W=10400,H=7200,mw=144,mh=mw*H/W,map={width:mw,height:mh,x:w-mw-15,y:70,player:{x:72,y:50}};
const tests=[];
for(const r of [18,45,80,110,150]){
 for(const side of ['left','right','top','bottom','top-left','bottom-right']){
   const x=side.includes('left')?r:side.includes('right')?W-r:W*.42;
   const y=side.includes('top')?r:side.includes('bottom')?H-r:H*.38;
   const can=createCanvas(w,h),ctx=can.getContext('2d');ctx.fillStyle='#192a30';ctx.fillRect(0,0,w,h);
   draw(ctx,w,h,W,H,{x:W/2-w/2,y:H/2-h/2},{x:W/2,y:H/2,r:180},[{x,y,r}],true);
   const result=detect(ctx.getImageData(0,0,w,h),w,h,map);
   const ideal=[x/W*mw,y/H*mh];
   const err=result.length?Math.min(...result.map(m=>Math.hypot(m.x-ideal[0],m.y-ideal[1]))):null;
   tests.push({side,r,count:result.length,error:err,pass:result.length===1&&err<1});
 }
}
for(const [name,npcs] of [['empty',[]],['red edge',[{x:100,y:2200,r:120}]]]){
 const can=createCanvas(w,h),ctx=can.getContext('2d');ctx.fillStyle='#192a30';ctx.fillRect(0,0,w,h);
 draw(ctx,w,h,W,H,{x:W/2-w/2,y:H/2-h/2},{x:W/2,y:H/2,r:25},npcs,true);
 const result=detect(ctx.getImageData(0,0,w,h),w,h,map);
 tests.push({name,count:result.length,pass:!result.length});
}
console.log(JSON.stringify({total:tests.length,passed:tests.filter(t=>t.pass).length,tests},null,2));
