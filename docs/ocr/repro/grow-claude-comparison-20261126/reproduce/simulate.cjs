'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createCanvas} = require('@napi-rs/canvas');
const {hash:sha256, checked, games, arms, modes, pages, seeds} = require('./sources.cjs');
const [work, mode, arm, version, seedArg] = process.argv.slice(2);
const seed = Number(seedArg), maxSeconds = 151;
if (!modes[mode]?.includes(arm) || !games[version] || !seeds.includes(seed)) {
  throw Error('use compare.cjs to select a registered arm, version and seed');
}
const [page, strategy, period] = arms[arm];
const [frameWidth, frameHeight] = mode === 'qhd' ? [2250,1308] : [958,557];
const [analysisWidth,analysisHeight] = mode === 'standard' ? [958,557] : arm === 'Grow38' ? [2000,1163] : [1200,698];
const gameHTML=checked(fs.readFileSync(path.join(work,version+'.html'),'utf8'),games[version][1]);
const candidateHTML=checked(fs.readFileSync(path.join(work,page+'.html'),'utf8'),pages[page][1]);
const keysDown=new Set(),decisionTimes=[];
let plannerMismatch;
const scripts = html => [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
let stamp=0, timers=[], raf=null;
const time = {now:()=>stamp};
function later(fn,ms=0){timers.push({fn,due:stamp+ms});return timers.length;}
function emit(target,type,e={}){
  for(const f of target.events.get(type)||[])f.call(target,{...e,type,preventDefault(){},target:e.target||target});
  target['on'+type]?.call(target,e);
}
function eventful(obj={}){obj.events=new Map;obj.addEventListener=function(k,fn){if(!this.events.has(k))this.events.set(k,[]);this.events.get(k).push(fn);};return obj;}
const classList=()=>{const set=new Set;return {add:(...v)=>v.forEach(k=>set.add(k)),remove:(...v)=>v.forEach(k=>set.delete(k)),contains:k=>set.has(k),toggle(k,b){if(b??!set.has(k))set.add(k);else set.delete(k);return set.has(k);}};};
function el(id){
 let txt='';
 return eventful({id,classList:classList(),style:{},value:'',disabled:false,open:false,
   get textContent(){return txt;},set textContent(v){txt=String(v);},set innerHTML(v){txt=String(v).replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'');},
   setAttribute(){},getClientRects(){return [{}];},click(){if(!this.disabled)emit(this,'click');},replaceChildren(){},append(){},add(){}});
}
const gameNodes=new Map, candidateNodes=new Map;
function node(nodes,id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id);}
const g=id=>node(gameNodes,id), c=id=>node(candidateNodes,id);
// The original draw() always starts with setTransform followed by opaque
// full-frame fills. Release Skia's accumulated draw recording at regular
// full-frame boundaries. Every frame is still drawn by the complete game script.
function gameSurface(){
 let width=frameWidth,height=frameHeight,surface,context,frames=0;
 function reset(){surface=createCanvas(width,height);context=surface.getContext('2d');}
 reset();
 const handler={get(_,k){
  if(k==='setTransform')return (...args)=>{if(++frames%30===0)reset();return context.setTransform(...args);};
  const v=context[k];return typeof v==='function'?((...args)=>context[k](...args)):v;
 },set(_,k,v){context[k]=v;return true;}};
 const ctx=new Proxy({},handler);
 return {get originalSkiaCanvas(){return surface;},get width(){return width;},set width(v){width=v;reset();},get height(){return height;},set height(v){height=v;reset();},getContext:()=>ctx};
}
const world=gameSurface();
world.clientWidth=frameWidth;world.clientHeight=frameHeight;
world.getBoundingClientRect=()=>({width:frameWidth,height:frameHeight,left:0,top:mode==='qhd'?0:128.515625});
gameNodes.set('world',world);
g('pauseButton').textContent='暫停';g('pauseButton').disabled=true;
g('resumeButton').textContent='繼續遊戲';
const eyebrow=gameHTML.match(/class="eyebrow">([^<]*v[0-9.]+[^<]*)</);
if(!eyebrow||!eyebrow[1].includes(version))throw Error('original version mismatch');
g('eyebrow').textContent=mode==='qhd'?eyebrow[1]:'Slime Arena '+version;
const gameDoc=eventful({documentElement:{},getElementById:g,hidden:false,querySelector(sel){
 if(sel==='meta[name="ocr-grow-version"]')return frame.srcdoc?.includes('<meta name="ocr-grow-version" content="'+version+'">')?{content:version}:null;
 if(sel==='.eyebrow')return g('eyebrow');if(sel==='canvas')return world;
 const m=/^#(\w+)\.(\w+)$/.exec(sel); if(m)return g(m[1]).classList.contains(m[2])?g(m[1]):null;
 throw Error('unknown game selector '+sel);
}, querySelectorAll(sel){if(sel!=='button')throw Error('unknown buttons '+sel);
 return [!g('overlay').classList.contains('hidden')&&g('start'),!g('pauseButton').disabled&&g('pauseButton'),g('pauseScreen').classList.contains('open')&&g('resumeButton')].filter(Boolean);
}});
let seq=seed>>>0;const gameMath=Object.create(Math);
gameMath.random=()=>{seq=(seq+0x6D2B79F5)>>>0;let m=Math.imul(seq^(seq>>>15),1|seq);m^=m+Math.imul(m^(m>>>7),61|m);return ((m^(m>>>14))>>>0)/4294967296;};
const storage=new Map;
const win=eventful({focus(){},KeyboardEvent:class{constructor(type,detail){Object.assign(this,detail,{type});}},dispatchEvent(evt){if(evt.type==='keydown')keysDown.add(evt.key);if(evt.type==='keyup')keysDown.delete(evt.key);emit(this,evt.type,evt);}});
function evaluate(source,globals){new Function(...Object.keys(globals),source)(...Object.values(globals));}
const base={performance:time,Math:gameMath,setTimeout:later,location:{protocol:'file:'},
 navigator:{languages:['zh-TW'],language:'zh-TW',userAgent:'OCR Grow offline development'},
 matchMedia:()=>({matches:false}),devicePixelRatio:1,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,String(v))},HTMLInputElement:class{},fetch:()=>Promise.reject(Error('offline')),requestAnimationFrame:fn=>{raf=fn;},screen:{}, window:win,document:gameDoc,addEventListener:win.addEventListener.bind(win)};
evaluate(scripts(gameHTML)[0],base);
const cwin=eventful({ocrTestRecord:s=>{
  decisionTimes.push(stamp);
  const expected=strategy==='grow-6' && s.hud<90?'grow-1':strategy;
  if(s.planOutput?.strategy!==expected)plannerMismatch='observed planner mismatch for '+arm+': '+s.planOutput?.strategy;
}});
const frame=c('game'); frame.contentDocument=gameDoc;frame.contentWindow=win;
c('strategy').value=strategy;c('viewScale').value='1';
frame.parentElement={clientWidth:frameWidth};
const controllerStatus=()=>cwin.ocrLabStatus?.()||{held:[...keysDown],version,strategy,active:!String(c('status').textContent).includes('已停止')&&!String(c('status').textContent).includes('逾時')};

c('go').disabled=true;
// Standard capture is an opaque 1:1 bitmap copy. QHD uses the actual Skia source
// canvas and the requested drawImage dimensions before reading back the bitmap.
function captureSurface() {
 let ctx, pixels;
 const surface = {width:1,height:1,getContext(){
  return ctx ??= {
   drawImage(src,x,y,w,h){
    if(x!==0||y!==0||src.width!==frameWidth||src.height!==frameHeight)throw Error('unexpected capture source');
    if(w!==analysisWidth||h!==analysisHeight)throw Error('unexpected analysis size '+[w,h]);
    if(mode==='standard') {
      pixels=src.getContext('2d').getImageData(0,0,w,h);
    } else {
      const target=createCanvas(w,h).getContext('2d');
      target.drawImage(src.originalSkiaCanvas,x,y,w,h);
      pixels=target.getImageData(0,0,w,h);
    }
   },
   getImageData(x,y,w,h){if(x!==0||y!==0||pixels.width!==w||pixels.height!==h)throw Error('partial bitmap read');return pixels;}
  };
 }};
 return surface;
}
const outer=eventful({documentElement:{style:{setProperty(){}}},getElementById:c,createElement(t){return t==='canvas'?captureSurface():el(t);}});
const ctl={...base,Math,window:cwin,document:outer,
 fetch:async()=>({ok:true,json:async()=>({versions:[{version:'v2.13',path:'/v2.13'},{version:'v2.22',path:'/v2.22'}],currentVersion:'v2.22',currentPath:'/v2.22'})}),Option:class {constructor(name,value){this.textContent=name;this.value=value;}}};
const cc=scripts(candidateHTML);evaluate(cc[0],ctl);evaluate(cc[1],{...ctl,OCRTiming:cwin.OCRTiming});
(async()=>{
 await new Promise(r=>setImmediate(r)); c('gameChoice').value='/'+version;c('gameChoice').onchange();frame.onload();if(c('go').disabled)throw Error(c('status').textContent);
 c('go').click();
 const startHud={size:Number(g('size').textContent),clock:g('time').textContent,eaten:Number(g('eaten').textContent),held:[...keysDown]};
 if(startHud.size!==25||startHud.clock!=='05:00'||startHud.eaten!==0||startHud.held.length||world.width!==frameWidth||world.height!==frameHeight)throw Error('bad initial HUD or geometry: '+JSON.stringify(startHud));
 const loadedCaption=c('gameVersion').textContent;
 if(!loadedCaption.includes(version)||!g('eyebrow').textContent.includes(version))throw Error('visible version not verified');
 if(c('status').textContent.includes('逾時'))throw Error(c('status').textContent);
 if(!g('overlay').classList.contains('hidden'))throw Error('original game did not start');
 let result='development cutoff';let initialPixelsSha256;
 for(let step=1;step<=Math.ceil((maxSeconds+4)*60);step++){
  stamp=step*1000/60;
  const f=raf;raf=null;f(stamp);if(step===1)initialPixelsSha256=sha256(world.getContext('2d').getImageData(0,0,frameWidth,frameHeight).data);
  for(const t of timers.filter(t=>t.due<=stamp+.00001)){timers=timers.filter(x=>x!==t);t.fn();}
  if(plannerMismatch)throw Error(plannerMismatch);
  if(step%60===0){if(global.gc)global.gc();await new Promise(resolve=>setImmediate(resolve));}
  if(g('gameEnding').classList.contains('visible')){result=g('title').textContent;break;}
  if(!controllerStatus().active)throw Error('controller stopped: '+c('status').textContent);
  if(stamp>=maxSeconds*1000)break;
 }
 if(decisionTimes.length<2||stamp-decisionTimes.at(-1)>period+20)throw Error('decision stream stopped early');
 c('stop').click();
 if(keysDown.size||controllerStatus().active||controllerStatus().held.length||!String(c('status').textContent).includes('已停止'))throw Error('stop or release failed');
 if(c('strategy').value!==strategy)throw Error('unexpected selection at stop');
 if(controllerStatus().strategy!==strategy)throw Error('selected strategy mismatch');
 const interval=(decisionTimes.at(-1)-decisionTimes[0])/(decisionTimes.length-1);
 if(decisionTimes[0]!==300||Math.abs(interval-period)>=1)throw Error('decision timing mismatch');
 const description=g('description').textContent;
 const elapsed=/遊玩時間 (\d+):(\d+)/.exec(description);
 const displaySeconds=elapsed?Number(elapsed[1])*60+Number(elapsed[2]):null;
 let outcome;
 if(result==='成功過關！'&&displaySeconds!==null&&displaySeconds<=150)outcome='wins';
 else if(result.includes('吞掉')&&displaySeconds!==null)outcome='deaths';
 else if(result==='development cutoff'&&stamp===151000)outcome='deadlines';
 else throw Error('unclassified ending '+JSON.stringify({result,displaySeconds,stamp}));
 process.stdout.write(JSON.stringify({mode,arm,version,seed,initialPixelsSha256,outcome,displaySeconds,size:Number(g('size').textContent)}));
})();
