'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const {createCanvas} = require('@napi-rs/canvas');
const html = fs.readFileSync(path.join(__dirname, 'ocr-grow34.html'), 'utf8');
const game = cp.execFileSync('git', ['cat-file','blob','16d41cdf2997baf0b3af33567b201d2dfb835427'],{cwd:__dirname,encoding:'utf8'});
function extract(text, start, end) {
  const first = text.indexOf(start), last = text.indexOf(end,first+start.length);
  assert.ok(first>=0 && last>first);
  return text.slice(first,last);
}
const components = new Function(extract(html,'function components(','function canvasUiMasks(')+';return components;')();
const refine = new Function(extract(html,'function refineClipped34(','function observeClipped34(')+';return refineClipped34;')();
const width=520, height=360, ctx=createCanvas(width,height).getContext('2d');
const draw = new Function('ctx','css','cam','vw','vh','player','t',
  extract(game,'function blob(','function draw(){')+';return drawSlime;')(ctx,(col,a=1)=>'rgba('+col.join(',')+','+a+')',{x:0,y:0},width,height,{r:130},value=>value);
const results = {};
for (const overlap of [false,true]) {
  const group=results[overlap?'overlap':'single']={rendered:0,accepted:0,correct:0,worstRadiusError:0};
  for(const edge of ['N','S','W','E'])for(const r of [50,85,120])for(const depth of [-.2,.08,.25,.5,.75,.9])for(const phase of [0,2,5]) {
    const x=edge==='W'?depth*r:edge==='E'?width-depth*r:width*.55;
    const y=edge==='N'?depth*r:edge==='S'?height-depth*r:height*.45;
    const actor={x,y,r,phase,color:[83,140,190],wobble:.92,name:'QQ'};
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#192a30';ctx.fillRect(0,0,width,height);
    draw(actor);const actors=[actor];
    if(overlap){
      const other={...actor,x:x+(edge==='W'?-1:1)*.56*r,y:y+.26*r,r:r*1.52,color:[136,144,164],name:'QQ'};
      draw(other);actors.push(other);
    }
    group.rendered++;
    const frame=ctx.getImageData(0,0,width,height);
    for(const p of components(frame,width,height,2,[]).filter(p=>p.clipped&&p.r>=18)){
      const fit=refine(frame,width,height,p,[]);
      if(!fit)continue;
      group.accepted++;
      const nearest=actors.reduce((a,b)=>Math.hypot(fit.x-a.x,fit.y-a.y)<Math.hypot(fit.x-b.x,fit.y-b.y)?a:b);
      const error=Math.abs(fit.r/nearest.r-1);
      group.worstRadiusError=Math.max(group.worstRadiusError,error);
      if(error<=.08 && Math.hypot(fit.x-nearest.x,fit.y-nearest.y)<.12*nearest.r)group.correct++;
    }
  }
}
assert.equal(results.single.rendered,216);
assert.equal(results.single.accepted,144);
assert.equal(results.single.correct,144);
assert.equal(results.overlap.rendered,216);
assert.equal(results.overlap.accepted,0);
console.log(JSON.stringify(results));
