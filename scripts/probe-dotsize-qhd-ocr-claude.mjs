// Test-side probe (numbers only): real minimap white-dot size estimates (rEst) of a Claude strategy vs the true NPC
// radius, at a chosen geometry. Each white marker the controller produced is matched to the nearest true NPC
// (within 160 world px of its minimap position). Records [rEst|-1, trueR, playerR, remembered?1:0, distToTrue].
// Also counts true off-view NPCs with 45.6<=r<=114 and r<=1.12R that got no marker within 160 px (missed sized whites).
// Usage: OCR_GEOMETRY=qhd node scripts/probe-dotsize-qhd-ocr-claude.mjs <url> <version> <strategy> <ms> <out.json>
import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire((process.env.PLAYWRIGHT_DIR||'/opt/npm-tools')+'/')('playwright');
const [url,version,strategy,ms,out]=process.argv.slice(2);const QHD=process.env.OCR_GEOMETRY==='qhd';
const b=await chromium.launch({channel:'chrome',headless:true});const ctx=await b.newContext({viewport:QHD?{width:2560,height:1440}:{width:2000,height:1163},deviceScaleFactor:1});
await ctx.route(u=>u.href.startsWith(url),async route=>{const res=await route.fetch(),body=await res.text(),a="(()=>{'use strict';";await route.fulfill({response:res,body:body.split(a).join(a+"window.__dbg=()=>({player,slimes,cam,vw,vh});")});});
await ctx.addInitScript(()=>{window.__d=[];window.__miss=[0,0];window.ocrTestRecord=r=>{const g=document.getElementById('game')?.contentWindow?.__dbg?.(),m=r.map||r.analysis?.map;if(!g||!m?.player||!m.growMarkers)return;
 const R=g.player.r,whites=m.growMarkers.filter(x=>x.red===false),pos=w=>({x:(w.x-m.player.x)/m.width*10400,y:(w.y-m.player.y)/m.height*7200});
 for(const w of whites){const q=pos(w);let best=null,bd=160;for(const s of g.slimes){const d=Math.hypot(s.x-g.player.x-q.x,s.y-g.player.y-q.y);if(d<bd){bd=d;best=s;}}if(best&&window.__d.length<20000)window.__d.push([Number.isFinite(w.rEst)?Math.round(w.rEst):-1,Math.round(best.r),Math.round(R),w.remembered?1:0,Math.round(bd)]);}
 const inView=s=>s.x+s.r>g.cam.x&&s.x-s.r<g.cam.x+g.vw&&s.y+s.r>g.cam.y&&s.y-s.r<g.cam.y+g.vh;
 for(const s of g.slimes){if(inView(s)||s.r>R*1.12||s.r<45.6||s.r>114)continue;window.__miss[0]++;const near=whites.some(w=>{const q=pos(w);return Math.hypot(s.x-g.player.x-q.x,s.y-g.player.y-q.y)<160;});if(!near)window.__miss[1]++;}};});
const p=await ctx.newPage();await p.goto(url);await p.selectOption('#gameChoice','/'+version);await p.waitForTimeout(3000);await p.selectOption('#strategy',strategy);
if(QHD){await p.evaluate(()=>{const g=document.getElementById('game');document.documentElement.style.setProperty('--view-scale',2250/g.parentElement.clientWidth);});await p.waitForTimeout(700);}
await p.click('#go');await p.waitForTimeout(Number(ms));
const d=await p.evaluate(()=>window.__d),miss=await p.evaluate(()=>window.__miss);await writeFile(out,JSON.stringify({version,strategy,geometry:QHD?'qhd':'standard',d,miss}));console.log(version,'markers',d.length,'missed sized',miss);await b.close();
