'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const html = fs.readFileSync(path.join(__dirname, 'ocr-grow42.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.equal(scripts.length, 2);
assert.equal((html.match(/<iframe\b/g)||[]).length, 1);
const nodes = new Map();
const doc = {
  hidden:false,addEventListener(){},
  getElementById(id){
    if(!nodes.has(id))nodes.set(id,{value:'',disabled:false,open:false,textContent:'',replaceChildren(...children){this.children=children;}});
    return nodes.get(id);
  },
  createElement(){return {width:0,getContext(){return {};}};}
};
const frame=doc.getElementById('game'), selector=doc.getElementById('gameChoice'), go=doc.getElementById('go');
let label='v2.13',hasCanvas=true;
frame.contentDocument={
  querySelector(selector){if(selector==='.eyebrow')return {textContent:'Slime Arena '+label};if(selector==='canvas')return hasCanvas?{}:null;throw Error(selector);},
  querySelectorAll(){return [];}
};
frame.contentWindow={focus(){}};
const context={console,document:doc,window:{addEventListener(){}},performance:{now:()=>0},setTimeout(){},AbortSignal,
  Option:class {constructor(text,value){this.text=text;this.value=value;}},
  fetch:async()=>({ok:true,json:async()=>({versions:['v2.13','v2.22','v2.44'].map(version=>({version,path:'/'+version})),currentVersion:'v2.22',currentPath:'/'})})};
vm.createContext(context);
vm.runInContext(scripts[0],context);context.OCRTiming=context.window.OCRTiming;
// The extra accessor exists only inside this test. Production never exposes a pipeline.
const ending='loadVersions();\n})();';
assert(scripts[1].endsWith(ending));
const source=scripts[1].slice(0,-ending.length)+
  "window.probe42=()=>({readImage,planGrow23,planGrow,hudSpeed});\n" + ending;
vm.runInContext(source,context);
const probe=context.window.probe42;
const shape=()=>Object.fromEntries(Object.entries(probe()).map(([key,fn])=>[key,sha(fn.toString())]));
async function check(){
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(Array.from(selector.children,x=>x.value),['/v2.13','/v2.22','/']);
  assert.equal(frame.src,'/v2.13');assert(go.disabled);
  frame.onload();assert.equal(go.disabled,false);const classicShape=shape(),first=probe();
  selector.value='/v2.22';selector.onchange();assert(go.disabled);
  const latestCallback=frame.onload;
  latestCallback();assert(go.disabled,'Expected actual/selected mismatch to block start');
  label='v2.22';latestCallback();assert.equal(go.disabled,false);const latestShape=shape();
  assert.notEqual(latestShape.readImage,classicShape.readImage);
  assert.notEqual(latestShape.planGrow23,classicShape.planGrow23);
  selector.value='/v2.13';selector.onchange();assert(go.disabled);
  latestCallback();assert(go.disabled,'Outdated iframe onload must not enable start');
  label='v2.13';hasCanvas=false;frame.onload();assert(go.disabled);
  hasCanvas=true;frame.onload();assert.equal(go.disabled,false);
  assert.deepEqual(shape(),classicShape);assert.notEqual(probe().readImage,first.readImage,'The new game gets fresh private analysis state');
  selector.value='/';selector.onchange();label='v2.22';frame.onload();assert.equal(go.disabled,false);
  assert.deepEqual(shape(),latestShape);
  selector.value='/v2.44';selector.onchange();assert(go.disabled);
  assert.equal(frame.src,'/','An unknown version must not replace the known game');
  assert(!context.window.ocrLabStatus().active);assert.equal(context.window.ocrLabStatus().held.length,0);
  console.log(JSON.stringify({classicShape,latestShape,cases:['single game iframe','supported choices and same-origin latest alias',
   'verified v2.13 route','mismatch blocks start','verified v2.22 route','different vision and planner implementations',
   'outdated iframe callback ignored','missing canvas blocks start','switch back creates fresh private state',
   'latest alias uses observed v2.22','unsupported path blocked','inactive with all native keys released']},null,2));
}
check().catch(e=>{console.error(e);process.exitCode=1;});
