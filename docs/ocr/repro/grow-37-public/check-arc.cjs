'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas');
const cp=require('node:child_process'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'ocr-grow37.html'),'utf8');
const game=cp.execFileSync('git',['cat-file','blob','16d41cdf2997baf0b3af33567b201d2dfb835427'],{cwd:__dirname,encoding:'utf8'});
const extract=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)+a.length));
const funcs=[extract(html,'function components(','function canvasUiMasks('),
 extract(html,'function canvasUiMasks(', "'use strict'"),extract(html,'function hasSlimeLabel(','function highlightRadius('),
 extract(html,'function refineClipped34(','function observeClipped34(')].join('\n');
const {arc,fit,components}=new Function(funcs+';return {arc:arc37,fit:refineClipped34,components}')();
const w=520,h=360,ctx=createCanvas(w,h).getContext('2d');
const draw=new Function('ctx','css','cam','vw','vh','player','t',extract(game,'function blob(','function draw(){')+';return drawSlime')(ctx,(c,a=1)=>'rgba('+c.join(',')+','+a+')',{x:0,y:0},w,h,{r:145},x=>x);
const out={};
for(const scene of ['single','separate']){
 const st=out[scene]={scenes:0,clipped:0,highlight:0,acceptedArc:0,outsideBounds:0,centerOutside:0,maxCenterRatio:0,maxRRatio:0};
 for(const edge of ['N','S','W','E'])for(const r of [55,85,115])for(const cut of [-.15,.1,.35,.6,.85])for(const phase of [1,3])for(const wobble of [.81,1.13]){
   const x=edge==='W'?cut*r:edge==='E'?w-cut*r:w*.55,y=edge==='N'?cut*r:edge==='S'?h-cut*r:h*.45;
   const s={x,y,r,phase,color:[83,140,190],wobble,name:'QQ'};
   ctx.clearRect(0,0,w,h);ctx.fillStyle='#192a30';ctx.fillRect(0,0,w,h);
   const actors=[s];if(scene==='separate'){const n={...s,x:x+.76*2.48*r,y:y+.18*r,r:r*1.48,color:[130,145,173]};actors.push(n);draw(n);}draw(s);
   const frame=ctx.getImageData(0,0,w,h),ps=components(frame,w,h,2,[]).filter(p=>p.clipped);
   st.scenes++;if(ps.length)st.clipped++;
   for(const p of ps){
     if(fit(frame,w,h,p,[])){st.highlight++;continue;}
     const g=arc(frame,w,h,p,1,null,[],145);if(!g)continue;st.acceptedArc++;
     const actual=actors.reduce((a,b)=>Math.hypot(g.x-a.x,g.y-a.y)<Math.hypot(g.x-b.x,g.y-b.y)?a:b);
     const pos=Math.hypot(g.x-actual.x,g.y-actual.y)/actual.r;
     st.maxCenterRatio=Math.max(st.maxCenterRatio,pos);st.maxRRatio=Math.max(st.maxRRatio,Math.abs(g.r/actual.r-1));
     if(pos>.20)st.centerOutside++;if(actual.r<g.rLower||actual.r>g.rUpper)st.outsideBounds++;
   }
 }
}
for(const scene of ['single','separate']){
  assert.equal(out[scene].scenes,240);
  assert.equal(out[scene].outsideBounds,0);
  assert.equal(out[scene].centerOutside,0);
}
assert.ok(out.single.acceptedArc>=30);
assert.ok(out.separate.acceptedArc>=1);
console.log(JSON.stringify(out));
