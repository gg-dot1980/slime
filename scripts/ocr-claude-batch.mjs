// Live batch runner for the static ocr-claude page (Playwright + Chrome).
// Reads only the visible controller/game DOM text (HUD + result screen). No images saved.
// Usage: [STRATEGY=grow-6|claude-1|claude-2] node scripts/ocr-claude-batch.mjs <url> <out.jsonl> <versions,comma> <gamesPerVersion> [label]
import {appendFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
// Resolve Playwright from the project, or from PLAYWRIGHT_DIR (a directory containing node_modules/playwright).
const req=createRequire(process.env.PLAYWRIGHT_DIR?process.env.PLAYWRIGHT_DIR+'/':import.meta.url);
const {chromium}=req('playwright');
const [url,out,versionList,perVersion,label='run']=process.argv.slice(2);
const versions=versionList.split(','),n=Number(perVersion);
const order=[];for(let i=0;i<n;i++)for(const v of versions)order.push(v); // interleaved, fixed before start
const browser=await chromium.launch({channel:'chrome',headless:true});
const ctx=await browser.newContext({viewport:{width:2000,height:1163},deviceScaleFactor:1});
// Numeric-only decision ring via the controller's existing ocrTestRecord hook (no pixels kept).
await ctx.addInitScript(()=>{const ring=[];window.ocrClaudeRing=ring;window.ocrTestRecord=r=>{const o=r.planOutput||{},npcs=(r.objects||[]).filter(x=>x.npc);const near=npcs.map(x=>({d:Math.round(Math.hypot(x.x,x.y)),r:Math.round(x.r),red:!!x.isRed,clip:!!x.clipped})).sort((a,b)=>a.d-b.d).slice(0,3);ring.push({t:r.hudTime,hud:r.hud,dir:o.name,clr:Math.round(o.clearance),thr:o.threats,esc:!!o.escaping,rsn:o.reason||null,ms:Math.round(r.elapsedCompute),near});if(ring.length>15)ring.shift();
 // Perception sampling (OBSERVE only): every 10th decision keep the controller's NPC detections next to the true
 // in-view NPCs (relative to the player). Numbers only. The controller never sees this.
 const dbg=document.getElementById('game')?.contentWindow?.__dbg;
 // Decision agreement (OBSERVE only): score the 8 controller directions with the view-restricted test-bot evaluator on
 // the TRUE state, and record how much the controller's choice loses against the evaluator's best (regret).
 if(typeof dbg==='function'&&o.name){const g=dbg(),p=g.player,R=p.r,c=p.color,S=Math.max(92,260-(R-25)*.65)*(.72+(.2126*c[0]+.7152*c[1]+.0722*c[2])/255*.58)*1.38,names=['東','東南','南','西南','西','西北','北','東北'];
  const inView=q=>q.x+q.r>g.cam.x&&q.x-q.r<g.cam.x+g.vw&&q.y+q.r>g.cam.y&&q.y-q.r<g.cam.y+g.vh;
  const seen=g.slimes.map(q=>inView(q)?q:q.r>R*1.12?{x:q.x,y:q.y,r:R*1.5,vx:0,vy:0}:{x:q.x,y:q.y,r:R*.6,vx:0,vy:0,mw:1}).filter(q=>Math.hypot(q.x-p.x,q.y-p.y)<2600),food=g.foods.filter(f=>Math.abs(f.x-p.x)<700&&Math.abs(f.y-p.y)<700);
  let prey=null;for(const q of seen)if(R>=q.r*1.1){const d=Math.hypot(q.x-p.x,q.y-p.y),v=(Math.sqrt(R*R+.55*q.r*q.r)-R)/(d/S+1);if(!prey||v>prey.v)prey={q,d,v};}
  const ev=names.map((n,i)=>{const dx=Math.cos(i*Math.PI/4),dy=Math.sin(i*Math.PI/4);let sc=0,gap=1e9,pg=0;const ate=new Set(),fed=new Set();
   for(let k=1;k<=15;k++){const t=k*.1,x=p.x+dx*S*t,y=p.y+dy*S*t;if(x<R||y<R||x>g.W-R||y>g.H-R){sc-=40;break;}
    for(const q of seen){const gp=Math.hypot(q.x+q.vx*t-x,q.y+q.vy*t-y)-(R+q.r)*.72;if(q.r>=R*1.06)gap=Math.min(gap,gp);else if(!q.mw&&R>=q.r*1.1&&gp<0&&!ate.has(q)){ate.add(q);const v=(Math.sqrt(R*R+.55*q.r*q.r)-R)*8/(t+.3);sc+=v;pg+=v;}}
    for(const f of food)if(!fed.has(f)&&Math.hypot(f.x-x,f.y-y)<R+f.r*.55){fed.add(f);sc+=.8/(t+.3);}}
   if(gap<40)sc-=400+(40-gap)*5;else if(gap<160)sc-=(160-gap)*.4;if(prey)sc+=(dx*(prey.q.x-p.x)+dy*(prey.q.y-p.y))/prey.d*prey.v*6;return {n,sc,gap,pg};});
  const best=ev.reduce((a,b)=>b.sc>a.sc?b:a),mine=ev.find(e=>e.n===o.name);
  const A=(window.ocrClaudeAgree??={n:0,agree:0,regret:[],cases:[]});A.n++;if(best.n===mine.n)A.agree++;const rg=best.sc-mine.sc;A.regret.push(Math.round(rg));
  if(rg>30&&A.cases.length<120)A.cases.push({t:Math.round(g.elapsed),R:Math.round(R),ctl:o.name,ctlReason:o.reason||null,ctlPrey:o.prey??null,ctlThreats:o.threats,ctlClr:Math.round(o.clearance),best:best.n,bestSc:Math.round(best.sc),mineSc:Math.round(mine.sc),bestGap:Math.round(best.gap),mineGap:Math.round(mine.gap),bestPreyGain:Math.round(best.pg),truePreyInView:g.slimes.filter(q=>inView(q)&&R>=q.r*1.1).length,trueLethalInView:g.slimes.filter(q=>inView(q)&&q.r>=R*1.08).length,huntTrue:prey?Math.round(prey.d):null});}
 if(typeof dbg==='function'){const P=(window.ocrClaudePercep??=[]);window.__pc=(window.__pc||0)+1;if(window.__pc%10===0&&P.length<160){const g=dbg(),pl=g.player,inView=q=>q.x+q.r>g.cam.x&&q.x-q.r<g.cam.x+g.vw&&q.y+q.r>g.cam.y&&q.y-q.r<g.cam.y+g.vh;
  P.push({t:Math.round(g.elapsed*10)/10,R:Math.round(pl.r*10)/10,hud:r.hud,vw:Math.round(g.vw),vh:Math.round(g.vh),det:npcs.map(x=>[Math.round(x.x),Math.round(x.y),Math.round(x.r),x.clipped?1:0,x.isRed?1:0]),tru:g.slimes.filter(inView).map(q=>[Math.round(q.x-pl.x),Math.round(q.y-pl.y),Math.round(q.r)])});}}};});

// OBSERVE=1: test-side observer inside the game frame (diagnosis only; the controller never reads it).
// Classifies each growth step as NPC eat or food, samples prey availability, and records the killer at death.
const observer=()=>{if(window.__obs)return 'already';if(typeof window.__dbg!=='function')return 'no-hook';const G=()=>window.__dbg();let {player,slimes}=G();const O=window.__obs={eats:[],foodGain:0,npcGain:0,avail:[],killer:null,err:null};let lastR=player.r,last=new Set(slimes),tick=0;
 window.__obsTimer=setInterval(()=>{try{const g=G(),{cam,vw,vh,elapsed}=g;player=g.player;slimes=g.slimes;const cur=new Set(slimes),gone=[...last].filter(s=>!cur.has(s)),dr=player.r-lastR;
  const mine=gone.filter(s=>Math.hypot(s.x-player.x,s.y-player.y)<(lastR+s.r)*.72+80&&lastR>=s.r*1.08);
  if(mine.length&&dr>0){O.npcGain+=dr;for(const s of mine)O.eats.push([Math.round(elapsed*10)/10,Math.round(lastR),Math.round(s.r/lastR*100)/100,Math.round(dr*10)/10]);}else if(dr>0)O.foodGain+=dr;
  if(++tick%20===0){const R=player.r,inView=s=>s.x+s.r>cam.x&&s.x-s.r<cam.x+vw&&s.y+s.r>cam.y&&s.y-s.r<cam.y+vh;let ev=0,ef=0,lv=0,ln=0;for(const s of slimes){const d=Math.hypot(s.x-player.x,s.y-player.y);if(R>=s.r*1.08){if(inView(s))ev++;else if(d<2600)ef++;}else if(s.r>=R*1.08){if(inView(s))lv++;if(d<600)ln++;}}O.avail.push([Math.round(elapsed),Math.round(R),ev,ef,lv,ln,slimes.length]);}
  lastR=player.r;last=cur;}catch(e){O.err=String(e).slice(0,200)}},50);return 'installed';};
const killerOf=()=>{const {player,slimes,cam,vw,vh,W,H}=window.__dbg(),R=player.r;let best=null;for(const s of slimes){if(s.r<R*1.08)continue;const d=Math.hypot(s.x-player.x,s.y-player.y),q=d/((R+s.r)*.72);if(!best||q<best.q)best={q:Math.round(q*100)/100,ratio:Math.round(s.r/R*100)/100,sprint:s.boostRemaining>0,chase:!!s.target?.chase,hunt:!!s.target?.hunt,inView:s.x+s.r>cam.x&&s.x-s.r<cam.x+vw&&s.y+s.r>cam.y&&s.y-s.r<cam.y+vh,vx:Math.round(s.vx),vy:Math.round(s.vy),wallDist:Math.round(Math.min(player.x,player.y,W-player.x,H-player.y)-R)};}return best;};
const gameFrame=async page=>(await page.$('#game'))?.contentFrame();
// OBSERVE only: inject a read-only state getter into each bundled game's IIFE, in the served response (repo files unchanged).
if(process.env.OBSERVE)await ctx.route(u=>u.href.startsWith(url),async route=>{const res=await route.fetch(),body=await res.text();
 const anchor="(()=>{'use strict';",hooked=body.split(anchor).join(anchor+"window.__dbg=()=>({player,slimes,foods,elapsed,cam,vw,vh,W,H});");
 await route.fulfill({response:res,body:hooked});});
let index=0;
for(const version of order){
 index++;const page=await ctx.newPage();const started=Date.now();
 const row={label,index,version,startedAt:new Date().toISOString(),outcome:'unknown',gameSeconds:null,size:null,samples:[]};
 try{
  await page.goto(url);
  await page.selectOption('#gameChoice','/'+version);
  await page.waitForFunction(v=>document.getElementById('gameVersion').textContent.includes(v)&&!document.getElementById('go').disabled,version,{timeout:30000});
  if(process.env.STRATEGY)await page.selectOption('#strategy',process.env.STRATEGY);
  row.strategy=await page.$eval('#strategy',s=>s.value);
  await page.click('#go');
  let observed=false;
  for(;;){
   await page.waitForTimeout(1000);
   if(process.env.OBSERVE&&!observed){try{const f=await gameFrame(page);if(f&&await f.evaluate(()=>typeof window.__dbg==='function'&&window.__dbg().elapsed>0)){row.observer=await f.evaluate(observer);observed=true;}}catch(e){row.observerError=String(e).slice(0,200);}}
   const s=await page.evaluate(()=>{const d=document.getElementById('game').contentDocument,t=(d.getElementById('time')?.textContent||'').match(/(\d+):(\d+)/);
    const rgb=(/RGB\s*(\d+)\s*·\s*(\d+)\s*·\s*(\d+)/.exec(d.getElementById('mix')?.textContent||'')||[]).slice(1).map(Number),cs=rgb.length===3?.72+(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2])/255*.58:null;
    return {cs,left:t?Number(t[1])*60+Number(t[2]):null,size:Number(d.getElementById('size')?.textContent)||null,runs:[...document.querySelectorAll('#runs li')].map(l=>l.textContent),status:document.getElementById('status').textContent,action:document.getElementById('action').textContent,title:d.getElementById('title')?.textContent||'',desc:d.getElementById('description')?.textContent||''};});
   const elapsed=s.left===null?null:300-s.left;
   if(elapsed!==null&&(!row.samples.length||elapsed-row.samples.at(-1)[0]>=10))row.samples.push([elapsed,s.size,s.cs===null?null:Math.round(s.cs*1000)/1000]);
   row.lastAction=s.action;
   if(s.runs.length){const text=s.runs.at(-1);row.resultText=text;const m=s.desc.match(/(?:遊玩時間|Play time)\s*(\d+):(\d+)/);row.gameSeconds=m?Number(m[1])*60+Number(m[2]):null;
    row.outcome=/成功過關|You win/.test(s.title)?(row.gameSeconds!==null&&row.gameSeconds<=150?'win<=150':'win>150'):/吞掉|eaten/i.test(s.title)?'death':/時間到|Time/.test(s.title)?'timeout300':'unknown';
    const sz=s.desc.match(/最終體型\s*(\d+)/);row.size=sz?Number(sz[1]):s.size;row.lastDecisions=await page.evaluate(()=>window.ocrClaudeRing||[]);row.percep=await page.evaluate(()=>window.ocrClaudePercep||[]);row.agree=await page.evaluate(()=>window.ocrClaudeAgree||null);if(observed){const f=await gameFrame(page);row.obs=await f.evaluate(()=>{clearInterval(window.__obsTimer);return window.__obs;});if(row.outcome==='death')row.obs.killer=await f.evaluate(killerOf);}break;}
   if(elapsed!==null&&elapsed>150){row.outcome='cutoff150';row.gameSeconds=elapsed;row.size=s.size;row.percep=await page.evaluate(()=>window.ocrClaudePercep||[]);row.agree=await page.evaluate(()=>window.ocrClaudeAgree||null);if(observed){const f=await gameFrame(page);row.obs=await f.evaluate(()=>{clearInterval(window.__obsTimer);return window.__obs;});}await page.click('#stop');break;}
   if(/逾時|停止/.test(s.status)&&!s.runs.length&&Date.now()-started>5000){row.outcome='controller-stop';row.status=s.status;row.gameSeconds=elapsed;row.size=s.size;break;}
   if(Date.now()-started>420000){row.outcome='wall-timeout';break;}
  }
 }catch(e){row.outcome='infra-error';row.error=String(e).slice(0,300);}
 row.wallSeconds=Math.round((Date.now()-started)/1000);
 await appendFile(out,JSON.stringify(row)+'\n');console.log(index,version,row.outcome,row.gameSeconds,row.size);
 await page.close();
}
await browser.close();
