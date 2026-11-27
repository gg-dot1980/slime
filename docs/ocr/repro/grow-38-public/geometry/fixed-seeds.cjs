'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const mode = process.argv[2];
const profiles = {standard:[958,557], intermediate:[1740,1012], fhd:[1631,948], qhd:[2250,1308]};
if (!Object.hasOwn(profiles,mode)) throw Error('Choose standard, intermediate, fhd or qhd');
const [frameWidth,frameHeight] = profiles[mode];
const root = cp.execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
const candidate = path.join(root,'docs/ocr/repro/grow-38-public/ocr-grow38.html');
const version = process.argv[3];
const seed = Number(process.argv[4]);
const maxSeconds = 150;
if (!version) {
  const groups = {};
  for (const v of ['v2.13','v2.22']) {
    groups[v] = {runs:0,wins:0,deaths:0,deadlines:0};
    for (const n of [11591,64721]) {
      const raw=cp.execFileSync(process.execPath,['--expose-gc',__filename,mode,v,String(n)],{encoding:'utf8'});
      const result=JSON.parse(raw);
      groups[v].runs++;
      groups[v][result.outcome]++;
    }
  }
  console.log(JSON.stringify({mode,canvas:[frameWidth,frameHeight],seedCount:2,clock:'virtual',groups},null,2));
  process.exit(0);
}
const {createCanvas} = require('@napi-rs/canvas');
const blobs = {'v2.13':'16d41cdf2997baf0b3af33567b201d2dfb835427','v2.22':'30af12f7608da91514711ecdbc01b57654ab2eab'};
if (!blobs[version] || !Number.isInteger(seed) || !(maxSeconds>0)) throw Error('expected candidate version seed seconds');
const gameFile = version === 'v2.13' ? 'game-v2.13.html' : 'game.html';
const gameBytes = fs.readFileSync(path.join(root,'src',gameFile));
const gitBlob = crypto.createHash('sha1').update('blob '+gameBytes.length+'\0').update(gameBytes).digest('hex');
if (gitBlob !== blobs[version]) throw Error('Original game source changed for '+version);
const gameHTML = gameBytes.toString('utf8');
const candidateHTML = fs.readFileSync(candidate,'utf8');
if (crypto.createHash('sha256').update(candidateHTML).digest('hex') !== 'befaf6a2c6ac1ff14596628753e509e5c15eb5bffd0e6f62f81e91b884f239ec') throw Error('Unexpected Grow38 source');
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
   setAttribute(){},getClientRects(){return [{}];},click(){if(!this.disabled)emit(this,'click');},replaceChildren(){},append(){}});
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
world.getBoundingClientRect=()=>({width:frameWidth,height:frameHeight,left:0,top:0});
gameNodes.set('world',world);
g('pauseButton').textContent='暫停';g('pauseButton').disabled=true;
g('resumeButton').textContent='繼續遊戲';
g('eyebrow').textContent='Slime Arena '+version;
const gameDoc=eventful({documentElement:{},getElementById:g,hidden:false,querySelector(sel){
 if(sel==='.eyebrow')return g('eyebrow');if(sel==='canvas')return world;
 const m=/^#(\w+)\.(\w+)$/.exec(sel); if(m)return g(m[1]).classList.contains(m[2])?g(m[1]):null;
 throw Error('unknown game selector '+sel);
}, querySelectorAll(sel){if(sel!=='button')throw Error('unknown buttons '+sel);
 return [!g('overlay').classList.contains('hidden')&&g('start'),!g('pauseButton').disabled&&g('pauseButton'),g('pauseScreen').classList.contains('open')&&g('resumeButton')].filter(Boolean);
}});
let seq=seed>>>0;const gameMath=Object.create(Math);
gameMath.random=()=>{seq=(seq+0x6D2B79F5)>>>0;let m=Math.imul(seq^(seq>>>15),1|seq);m^=m+Math.imul(m^(m>>>7),61|m);return ((m^(m>>>14))>>>0)/4294967296;};
const storage=new Map;
const win=eventful({focus(){},KeyboardEvent:class{constructor(type,detail){Object.assign(this,detail,{type});}},dispatchEvent(evt){emit(this,evt.type,evt);}});
function evaluate(source,globals){new Function(...Object.keys(globals),source)(...Object.values(globals));}
const base={performance:time,Math:gameMath,setTimeout:later,location:{protocol:'file:'},
 navigator:{languages:['zh-TW'],language:'zh-TW',userAgent:'OCR Grow offline development'},
 matchMedia:()=>({matches:false}),devicePixelRatio:1,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,String(v))},HTMLInputElement:class{},fetch:()=>Promise.reject(Error('offline')),requestAnimationFrame:fn=>{raf=fn;},screen:{}, window:win,document:gameDoc,addEventListener:win.addEventListener.bind(win)};
evaluate(scripts(gameHTML)[0],base);
let decisions=0;
const cwin=eventful({ocrTestRecord(){decisions++;}});
const frame=c('game'); frame.contentDocument=gameDoc;frame.contentWindow=win;
c('strategy').value=(candidateHTML.match(/<option value="([^"]+)" selected>/)||[])[1]||'grow-23';
c('go').disabled=true;
// At the frozen 1:1 raster size the controller copies the opaque source canvas,
// then reads that full bitmap. Copy its actual pixel buffer without retaining a
// native Skia drawImage snapshot for every preceding decision.
function captureSurface() {
 let ctx, pixels;
 const surface = {width:1,height:1,getContext(){
  return ctx ??= {
   drawImage(src,x,y,w,h) {
    if (x !== 0 || y !== 0) throw Error('unexpected capture origin');
    if (w === src.width && h === src.height) {
      pixels = src.getContext('2d').getImageData(0,0,w,h);
      return;
    }
    const target = createCanvas(w,h).getContext('2d');
    target.drawImage(src.originalSkiaCanvas,x,y,w,h);
    pixels = target.getImageData(0,0,w,h);
   },
   getImageData(x,y,w,h){if(x!==0||y!==0||pixels.width!==w||pixels.height!==h)throw Error('partial bitmap read');return pixels;}
  };
 }};
 return surface;
}
const outer=eventful({getElementById:c,createElement(t){return t==='canvas'?captureSurface():el(t);}});
const ctl={...base,Math,window:cwin,document:outer,
 fetch:async()=>({ok:true,json:async()=>({versions:[{version:'v2.13',path:'/v2.13'},{version:'v2.22',path:'/v2.22'}],currentVersion:'v2.22',currentPath:'/v2.22'})}),Option:class {constructor(name,value){this.textContent=name;this.value=value;}}};
const cc=scripts(candidateHTML);evaluate(cc[0],ctl);evaluate(cc[1],{...ctl,OCRTiming:cwin.OCRTiming});
(async()=>{
 await new Promise(r=>setImmediate(r)); c('gameChoice').value='/'+version;c('gameChoice').onchange();frame.onload();if(c('go').disabled)throw Error(c('status').textContent);
 c('go').click();
 if(!g('overlay').classList.contains('hidden'))throw Error('original game did not start');
 let result='development cutoff';
 for(let step=1;step<=Math.ceil((maxSeconds+4)*60);step++){
  stamp=step*1000/60;
  const f=raf;raf=null;f(stamp);
  for(const t of timers.filter(t=>t.due<=stamp+.00001)){timers=timers.filter(x=>x!==t);t.fn();}
  if(step%60===0){if(global.gc)global.gc();await new Promise(resolve=>setImmediate(resolve));}
  if(g('gameEnding').classList.contains('visible')){result=g('title').textContent;break;}
  if(!cwin.ocrLabStatus().active)throw Error('controller stopped: '+c('status').textContent);
  if(stamp>=maxSeconds*1000)break;
 }
 if(decisions===0)throw Error('no visible-input decisions issued');
 c('stop').click();
 const control = cwin.ocrLabStatus();
 if(control.active || control.held.length) throw Error('Controller did not release its keys');
 const text = g('description').textContent;
 const duration = /(?:遊玩時間|Play time)\s*(\d+):([0-5]\d)/.exec(text);
 const seconds = duration ? Number(duration[1])*60+Number(duration[2]) : null;
 let outcome;
 if (result === '成功過關！' && seconds !== null && seconds <= 150) outcome = 'wins';
 else if (result === '被大史萊姆吞掉了' && seconds !== null) outcome = 'deaths';
 else if (result === 'development cutoff') outcome = 'deadlines';
 else throw Error('Unrecognized result or game clock');
 console.log(JSON.stringify({outcome}));
})();
