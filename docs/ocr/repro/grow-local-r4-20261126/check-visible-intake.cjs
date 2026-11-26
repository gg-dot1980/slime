'use strict';
const assert=require('node:assert/strict');
const {parseToast,observe}=require('./visible-intake.js');
const foodZh='混入紅色 · 體型 +0.4',foodEn='Mixed red · Size +0.5';
const npcZh='吞下藍莓 · 消化耗損 32% · 體型 +7.9',npcEn='Ate Plum · Digestion loss 15% · Size +12.3';
for(const [text,kind,displayedGain] of [[foodZh,'food',.4],[foodEn,'food',.5],[npcZh,'npc',7.9],[npcEn,'npc',12.3]]){
  assert.deepEqual(parseToast(text),{kind,displayedGain});
}
for(const text of ['傾斜已校正','Ate Plum','Mixed red · Size +?', '吞下冰 · 體型 +12.0'])assert.equal(parseToast(text),null);
function fixture() {
  const events=new Map, frames=new Map;let sequence=0,watch=null, disconnected=false;
  const win={addEventListener:(k,fn)=>events.set(k,fn),removeEventListener:(k,fn)=>{assert.equal(events.get(k),fn);events.delete(k);},
    requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id),
    MutationObserver:class {constructor(fn){watch=fn;}observe(node){assert.equal(node,nodes.toast);}disconnect(){watch=null;disconnected=true;}}};
  const nodes={};
  for(const id of ['toast','eaten','time','overlay','gameEnding','pauseScreen']){
    const classes=new Set,listeners=new Map;
    nodes[id]={textContent:'',visible:true,classes,classList:{contains:k=>classes.has(k)},addEventListener:(k,fn)=>listeners.set(k,fn),
      removeEventListener:(k,fn)=>{assert.equal(listeners.get(k),fn);listeners.delete(k);},listeners};
  }
  const doc={defaultView:win,visibilityState:'visible',getElementById:k=>nodes[k]};
  nodes.overlay.classes.add('hidden');nodes.time.textContent='04:35';nodes.eaten.textContent='2';
  const monitor=observe(doc,node=>node.visible);
  function write(text){nodes.toast.textContent=text;nodes.toast.classes.add('show');watch?.();}
  function paint(){const callbacks=[...frames.values()];frames.clear();for(const f of callbacks)f();}
  return {nodes,events,frames,monitor,doc,write,paint,disconnected:()=>disconnected};
}
const f=fixture(), observations=()=>f.monitor.drain().observations;
f.write(foodZh);f.write(npcEn);f.paint(); // The first string was overwritten before one render opportunity.
f.nodes.eaten.textContent='4';f.write(foodEn);f.paint();
f.write(foodEn);f.paint();f.paint(); // Same notice, including a repeated same-text write.
const seen=observations();
assert.deepEqual(seen.map(x=>[x.kind,x.displayedGain,x.eaten,x.gameSecond,x.text]),[['npc',12.3,2,25,npcEn],['food',.5,4,25,foodEn]]);
assert.deepEqual(observations(),[]); // One-second samples can be skipped, repeated or delayed without replaying notices.
assert.deepEqual(f.monitor.drain().hud,{eaten:4,gameSecond:25});
f.nodes.toast.classes.delete('show');f.nodes.toast.visible=false;f.nodes.toast.listeners.get('transitionend')({propertyName:'opacity'});f.paint();
f.write(foodEn);f.paint();f.nodes.toast.visible=true;f.paint(); // first render was still transparent
assert.equal(observations().length,1);
f.nodes.pauseScreen.classes.add('open');f.write(npcZh);f.paint();assert.deepEqual(f.monitor.drain(),{hud:null,observations:[]});
f.nodes.pauseScreen.classes.delete('open');f.nodes.time.textContent='xx';f.nodes.eaten.visible=false;
assert.deepEqual(f.monitor.drain().hud,{eaten:null,gameSecond:null});
f.nodes.eaten.visible=true;f.nodes.time.textContent='04:34';f.write(npcZh);f.paint();f.write(foodEn); // latest write still pending at navigation
f.events.get('pagehide')();
assert.equal(f.disconnected(),true);assert.equal(f.frames.size,0);assert.equal(f.events.size,0);assert.equal(f.nodes.toast.listeners.size,0);
f.write(foodZh);f.paint();assert.deepEqual(observations().map(x=>[x.text,x.gameSecond]),[[npcZh,26]]);
f.monitor.stop();assert.deepEqual(observations(),[]);
const g=fixture();g.write(foodZh);g.monitor.stop();g.paint();assert.deepEqual(g.monitor.drain().observations,[]);assert.equal(g.events.size,0);
console.log('Passed bilingual visible intake, render coalescing, sample gaps, duplicate suppression, visibility, teardown and final drain.');
