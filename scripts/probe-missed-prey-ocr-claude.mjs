// Test-side diagnostic (numbers only): why a visible edible NPC was not chased. Each controller decision, the most
// valuable fully or partly visible TRUE edible NPC (r<=R/1.08, r>=0.4R; value = gain/(dist/speed+1) as in the planner)
// is compared with the planner's target and the controller's detections. Reasons: chased, undetected, clipped,
// size-over (read >0.95R), escape, chose-white, chose-other, food. Not controller input; diagnostics only.
// Usage: OCR_GEOMETRY=qhd node scripts/probe-missed-prey-ocr-claude.mjs <url> <version> <strategy> <seconds> <out.json>
import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire((process.env.PLAYWRIGHT_DIR||'/opt/npm-tools')+'/')('playwright');
const [url,version,strategy,sec,out]=process.argv.slice(2);const QHD=process.env.OCR_GEOMETRY==='qhd';
const b=await chromium.launch({channel:'chrome',headless:true});const ctx=await b.newContext({viewport:QHD?{width:2560,height:1440}:{width:2000,height:1163},deviceScaleFactor:1});
await ctx.route(u=>u.href.startsWith(url),async route=>{const res=await route.fetch(),body=await res.text(),a="(()=>{'use strict';";await route.fulfill({response:res,body:body.split(a).join(a+"window.__dbg=()=>({player,slimes,cam,vw,vh,elapsed:typeof elapsed!=='undefined'?elapsed:0});")});});
await ctx.addInitScript(()=>{window.__rows=[];window.ocrTestRecord=r=>{const g=document.getElementById('game')?.contentWindow?.__dbg?.();if(!g)return;const P=g.player,R=P.r,S=Math.max(1,r.speed||300),p=r.planOutput||{};
 const vis=s=>s.x+s.r>g.cam.x&&s.x-s.r<g.cam.x+g.vw&&s.y+s.r>g.cam.y&&s.y-s.r<g.cam.y+g.vh,full=s=>s.x-s.r>=g.cam.x&&s.x+s.r<=g.cam.x+g.vw&&s.y-s.r>=g.cam.y&&s.y+s.r<=g.cam.y+g.vh;
 let T=null;for(const s of g.slimes){if(!vis(s)||s.r>R/1.08||s.r<R*.4)continue;const dx=s.x-P.x,dy=s.y-P.y,d=Math.hypot(dx,dy),gain=Math.sqrt(R*R+.55*s.r*s.r)-R,val=gain/(d/S+1);if(!T||val>T.val)T={s,dx,dy,d,gain,val,full:full(s)};}
 if(!T)return;let reason;const tg=p.target,near=(x,y,k)=>Math.hypot(x-T.dx,y-T.dy)<=k;
 if(tg&&near(tg.x,tg.y,Math.max(60,T.s.r*.8)))reason='chased';else{const det=(r.objects||[]).filter(o=>o.npc&&!o.mapOnly);let best=null,bd=T.full?Math.max(40,T.s.r*.6):T.s.r*1.1;for(const o of det){const dd=Math.hypot(o.x-T.dx,o.y-T.dy);if(dd<bd){bd=dd;best=o;}}
  if(!best)reason='undetected';else if(best.clipped)reason='clipped';else if(best.r>R*.95)reason='size-over';else if(p.reason==='escape')reason='escape';else if(p.reason==='hunt-map')reason='chose-white';else if(tg)reason='chose-other';else reason='food';}
 if(window.__rows.length<30000)window.__rows.push([reason,Math.round(T.s.r/R*100)/100,T.full?1:0,Math.round(T.d),Math.round(R),Math.round(T.gain*10)/10,tg?Math.round((Math.sqrt(R*R+.55*(tg.r||0)**2)-R)*10)/10:0,p.reason||'']);};});
const p=await ctx.newPage();await p.goto(url);await p.selectOption('#gameChoice','/'+version);await p.waitForTimeout(3000);await p.selectOption('#strategy',strategy);
if(QHD){await p.evaluate(()=>{const g=document.getElementById('game');document.documentElement.style.setProperty('--view-scale',2250/g.parentElement.clientWidth);});await p.waitForTimeout(700);}
await p.click('#go');await p.waitForTimeout(Number(sec)*1000);
const rows=await p.evaluate(()=>window.__rows);await writeFile(out,JSON.stringify({version,strategy,geometry:QHD?'qhd':'standard',rows}));console.log(version,rows.length);await b.close();
