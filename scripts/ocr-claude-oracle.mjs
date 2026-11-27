// Feasibility bound for the 150 s goal: a TEST-ONLY "full-information" bot that reads the real game state
// (positions, radii, velocities of every NPC and food) through a hook injected into the served page, and
// drives the game's own key set. It is NOT an OCR controller and must never ship; its only purpose is to
// show whether "size 200 within 150 s" is reachable at all with good play. Repo game files are unchanged.
// Usage: [ORACLE_VIEW=1] [ORACLE_MS=50] [ORACLE_RULE=v0|v1|v2|v3] [ORACLE_WARP=3] [ORACLE_PARAMS='{"prey":8,"food":0.8,"attract":6,"crowd":6,"horizon":25,"edible":1.1}'] node scripts/ocr-claude-oracle.mjs <url> <out.jsonl> <versions,comma> <gamesPerVersion> [label]
import {appendFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const req=createRequire(process.env.PLAYWRIGHT_DIR?process.env.PLAYWRIGHT_DIR+'/':import.meta.url);
const {chromium}=req('playwright');
const [url,out,versionList,perVersion,label='oracle']=process.argv.slice(2);
const versions=versionList.split(','),n=Number(perVersion),order=[];for(let i=0;i<n;i++)for(const v of versions)order.push(v);
const browser=await chromium.launch({channel:'chrome',headless:true});
const ctx=await browser.newContext({viewport:{width:2000,height:1163},deviceScaleFactor:1});
await ctx.route(u=>u.href.startsWith(url),async route=>{const res=await route.fetch(),body=await res.text(),anchor="(()=>{'use strict';";
 // ORACLE_WARP=N (test-only time acceleration): N update(dt) sub-steps per animation frame with the game's own dt,
 // so collision granularity is unchanged; bot and observer intervals are divided by N to keep decisions per game second.
 const warp=Math.max(1,Number(process.env.ORACLE_WARP)||1);let b2=body.split(anchor).join(anchor+"window.__dbg=()=>({player,slimes,foods,keys,elapsed,running,W,H,cam,vw,vh,setBoost:v=>{boosting=v}});");
 if(warp>1){const n=b2.split('last=t;update(dt);').length-1;if(n<1)throw new Error('warp anchor missing');b2=b2.split('last=t;update(dt);').join('last=t;for(let __k=0;__k<'+warp+'&&running;__k++)update(dt);');}
 await route.fulfill({response:res,body:b2});});
const bot=([viewOnly,period,rule,PP])=>{const P={prey:8,food:.8,attract:6,crowd:6,horizon:25,edible:1.1,...(PP||{})};const K=['v1','v2','v3'].includes(rule)?P.horizon:15;const DIRS=[...Array(16)].map((_,i)=>({x:Math.cos(i*Math.PI/8),y:Math.sin(i*Math.PI/8)}));
 const keyFor=d=>[d.x>.38?'ArrowRight':d.x<-.38?'ArrowLeft':null,d.y>.38?'ArrowDown':d.y<-.38?'ArrowUp':null].filter(Boolean);
 const stats={eats:0,ticks:0,eatList:[],foodGain:0,npcGain:0};window.__oracle=stats;let prevR=null;
 // Growth classification identical to the batch observer: NPC eat if a smaller slime vanished at contact, else food.
 {let lastR=window.__dbg().player.r,last=new Set(window.__dbg().slimes);window.__oracleObs=setInterval(()=>{const g=window.__dbg(),p=g.player,cur=new Set(g.slimes),gone=[...last].filter(q=>!cur.has(q)),dr=p.r-lastR;
  const mine=gone.filter(q=>Math.hypot(q.x-p.x,q.y-p.y)<(lastR+q.r)*.72+80&&lastR>=q.r*1.08);
  if(mine.length&&dr>0){stats.npcGain+=dr;for(const q of mine)stats.eatList.push([Math.round(g.elapsed*10)/10,Math.round(lastR),Math.round(q.r/lastR*100)/100,Math.round(dr*10)/10]);}else if(dr>0)stats.foodGain+=dr;lastR=p.r;last=cur;},Math.max(4,period/1));}
 window.__oracleTimer=setInterval(()=>{const g=window.__dbg();if(!g.running)return;const {player:p,slimes,foods,keys,W,H}=g,R=p.r;g.setBoost(true);stats.ticks++;
  const c=p.color,bright=(.2126*c[0]+.7152*c[1]+.0722*c[2])/255,S=Math.max(92,260-(R-25)*.65)*(.72+bright*.58)*1.38;stats.spd=stats.spd||[];if(stats.ticks%4===0&&stats.spd.length<3000)stats.spd.push(Math.round(Math.hypot(p.vx,p.vy)/(S/1.38)*100)/100);
  // ORACLE_VIEW=1: only what the screen shows — exact data inside the camera view; outside it, minimap-like
  // position + red(>1.12R)/white class only (no radius, no velocity). Off-view whites attract but never count as eaten.
  const inView=s=>s.x+s.r>g.cam.x&&s.x-s.r<g.cam.x+g.vw&&s.y+s.r>g.cam.y&&s.y-s.r<g.cam.y+g.vh;
  // PARAMS offR:1|'red'|'white' / offV:1 (decomposition; 'red'/'white' = true radius only for that minimap class): off-view slimes keep their TRUE radius / TRUE velocity (positions are exact
  // in view-only mode already). Classification for the planner then follows the true radius.
  // PARAMS offMem:T (seconds): off-view whites keep the radius measured when last seen IN VIEW within T s (a tracker that
  // follows a body from the screen onto its minimap dot); others use the minimap reading. Counts go to stats.mem.
  if(P.offMem){window.__seenAt=window.__seenAt||new WeakMap();for(const s of slimes)if(inView(s))window.__seenAt.set(s,{t:g.elapsed,r:s.r});}
  const memR=s=>{if(!P.offMem)return null;const m=window.__seenAt.get(s);stats.mem=stats.mem||{hit:0,miss:0};if(m&&g.elapsed-m.t<=P.offMem){stats.mem.hit++;return m.r;}stats.mem.miss++;return null;};
  const offTrue=s=>{const mr=s.r<=R*1.12?memR(s):null,tr=P.offR===1||P.offR==='red'&&s.r>R*1.12||P.offR==='white'&&s.r<=R*1.12||mr!==null;return {x:s.x,y:s.y,r:mr!==null?mr:tr?s.r:(s.r>R*1.12?R*1.5:(rule==='v3'&&s.r>=45.6)?Math.min(s.r,114):(rule==='v3'?Math.min(R*.6,45):R*.6)),vx:P.offV?s.vx:0,vy:P.offV?s.vy:0,mapWhite:!tr&&s.r<=R*1.12,mapRed:!tr&&s.r>R*1.12};};
  const seen=viewOnly&&(P.offR||P.offV||P.offMem)?slimes.map(s=>inView(s)?s:offTrue(s)):viewOnly?slimes.map(s=>inView(s)?s:s.r>R*1.12?{x:s.x,y:s.y,r:R*1.5,vx:0,vy:0,mapRed:true}:{x:s.x,y:s.y,r:(rule==='v3'&&s.r>=45.6)?Math.min(s.r,114):(rule==='v3'?Math.min(R*.6,45):R*.6),vx:0,vy:0,mapWhite:true,sized:rule==='v3'&&s.r>=45.6,cap:rule==='v3'&&s.r>114}):slimes;
  // PARAMS unk (strategy study; off-view whites whose minimap dot carries no size): 'skip' drops 1.2 px dots (r<45.6)
  // and saturated 3 px dots (r>114); 'skipSmall' drops only 1.2 px dots; 'skipCap' only 3 px dots; a number f sets
  // the 1.2 px dot estimate to min(f*R,45). Uses only what the minimap shows.
  // PARAMS mapQ:1 — off-view positions rounded to minimap pixel centres (144 px wide map, ≈72 world px), as the
  // real minimap reads them; the player's own map position is rounded the same way.
  const qz=(v,W2)=>{const k=W2/144;return (Math.floor(v/k)+.5)*k;},pq=P.mapQ?{x:p.x-qz(p.x,W)+0,y:p.y-qz(p.y,W)}:null;
  if(P.mapQ)for(let i=0;i<seen.length;i++){const o=seen[i];if(o.mapWhite||o.mapRed)seen[i]={...o,x:qz(o.x,W)+pq.x,y:qz(o.y,W)+pq.y};}
  const unkSeen=P.unk===undefined?seen:seen.flatMap(o=>{if(!o.mapWhite)return [o];const small=!o.sized,cap=!!o.cap;
   if(P.unk==='skip'&&(small||cap)||P.unk==='skipSmall'&&small||P.unk==='skipCap'&&cap)return [];if(typeof P.unk==='number'&&small)return [{...o,r:Math.min(R*P.unk,45)}];return [o];});
  // rule v3: minimap dot radius = clamp(r/38,1.2,3) carries size for 45.6<=r<=114; whites read as >=1.06R are not prey.
  // PARAMS offWhite:0 — drop off-view white minimap dots entirely (matches claude-22, which computes no white markers).
  const near=(P.offWhite===0?unkSeen.filter(s=>!s.mapWhite):unkSeen).map(s=>({s,d:Math.hypot(s.x-p.x,s.y-p.y)})).filter(o=>o.d<2600),food=foods.filter(f=>Math.abs(f.x-p.x)<700&&Math.abs(f.y-p.y)<700);
  let prey=null;for(const o of near)if(R>=o.s.r*P.edible){const gain=Math.sqrt(R*R+.55*o.s.r*o.s.r)-R,v=gain/(o.d/S+1);if(!prey||v>prey.v)prey={...o,v};}
  let best=null;for(const d of DIRS){let score=0,minGap=1e9,ateNpc=new Set(),ateFood=0;
   for(let k=1;k<=K;k++){const t=k*.1,x=p.x+d.x*S*t,y=p.y+d.y*S*t;if(x<R||y<R||x>W-R||y>H-R){score-=(rule==='v2'||rule==='v3')?400:40;break;}if(rule==='v2'||rule==='v3'){const wd=Math.min(x,y,W-x,H-y)-R;if(wd<150)score-=(150-wd)*.6/(t+.3);}
    for(const o of near){const s=o.s,sx=s.x+s.vx*t,sy=s.y+s.vy*t,gap=Math.hypot(sx-x,sy-y)-(R+s.r)*.72;
     if(s.r>=R*1.06)minGap=Math.min(minGap,gap);else if(R>=s.r*1.1&&gap<0&&!ateNpc.has(s)){ateNpc.add(s);score+=(Math.sqrt(R*R+.55*s.r*s.r)-R)*P.prey/(t+.3);}}
    for(const f of food)if(!f.__o&&Math.hypot(f.x-x,f.y-y)<R+f.r*.55){f.__o=1;ateFood++;score+=P.food/(t+.3);}}
   for(const f of food)delete f.__o;
   if(minGap<40)score-=400+(40-minGap)*5;else if(minGap<160)score-=(160-minGap)*.4;
   if(prey){const px=prey.s.x-p.x,py=prey.s.y-p.y;score+=(d.x*px+d.y*py)/prey.d*prey.v*P.attract;}
   const wall=Math.min(p.x+d.x*400,p.y+d.y*400,W-p.x-d.x*400,H-p.y-d.y*400)-R;if(wall<0)score+=wall*.05;
   // rule v1: prefer room to escape — crowd of lethal bodies around the 1.5 s end point, and distance to walls.
   if(['v1','v2','v3'].includes(rule)){const ex=p.x+d.x*S*1.5,ey=p.y+d.y*S*1.5;let crowd=0;for(const o of near){const s=o.s;if(s.r>=R*1.06){const dd=Math.max(120,Math.hypot(s.x-ex,s.y-ey)-s.r);crowd+=(s.r/R)*(250/dd)**2;}}score-=crowd*P.crowd;
    const wd=Math.min(ex,ey,W-ex,H-ey)-R;if(wd<600)score-=(600-wd)*.04;}
   if(!best||score>best.score)best={d,score};}
  for(const k of ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'])keys.delete(k);for(const k of keyFor(best.d))keys.add(k);
  if(prevR!==null&&R-prevR>1.5)stats.eats++;prevR=R;},period);return 'installed';};
let index=0;
for(const version of order){index++;const page=await ctx.newPage(),started=Date.now(),row={label,index,version,outcome:'unknown',samples:[]};
 try{await page.goto(url);await page.selectOption('#gameChoice','/'+version);
  await page.waitForFunction(v=>document.getElementById('gameVersion').textContent.includes(v),version,{timeout:30000});await page.waitForTimeout(1500);
  // ORACLE_VIEWSCALE=wide: the controller page's existing 視野「固定 2000」 option (game canvas 2000 CSS px wide).
  if(process.env.ORACLE_VIEWSCALE){await page.selectOption('#viewScale',process.env.ORACLE_VIEWSCALE);await page.waitForTimeout(800);}
  const f=await (await page.$('#game')).contentFrame();await f.click('#start');await page.waitForTimeout(500);const warp=Math.max(1,Number(process.env.ORACLE_WARP)||1),period=Math.max(4,Math.round((Number(process.env.ORACLE_MS)||50)/warp));const PP=process.env.ORACLE_PARAMS?JSON.parse(process.env.ORACLE_PARAMS):null;row.params=PP;row.bot=await f.evaluate(bot,[!!process.env.ORACLE_VIEW,period,process.env.ORACLE_RULE||'v0',PP]);row.rule=process.env.ORACLE_RULE||'v0';row.viewScale=process.env.ORACLE_VIEWSCALE||'1';row.viewOnly=!!process.env.ORACLE_VIEW;row.periodMs=period;row.warp=warp;row.warp=warp;
  for(;;){await page.waitForTimeout(Math.round(1000/warp));const s=await f.evaluate(()=>{const g=window.__dbg();return {t:g.elapsed,r:g.player.r,running:g.running,title:document.getElementById('title')?.textContent||''};});
   if(!row.samples.length||s.t-row.samples.at(-1)[0]>=10)row.samples.push([Math.round(s.t),Math.round(s.r)]);
   if(s.r>=200||(!s.running&&s.t>1)){row.gameSeconds=Math.round(s.t);row.size=Math.round(s.r);row.outcome=s.r>=200?(s.t<=150?'win<=150':'win>150'):'death';break;}
   if(s.t>150){row.gameSeconds=Math.round(s.t);row.size=Math.round(s.r);row.outcome='cutoff150';break;}
   if(Date.now()-started>300000/Math.min(warp,2)){row.outcome='wall-timeout';break;}}
  row.oracle=await f.evaluate(()=>{clearInterval(window.__oracleTimer);clearInterval(window.__oracleObs);return window.__oracle;});
  if(row.outcome==='death')row.killer=await f.evaluate(()=>{const g=window.__dbg(),p=g.player,R=p.r;let best=null;for(const s of g.slimes){if(s.r<R*1.08)continue;const d=Math.hypot(s.x-p.x,s.y-p.y),q=d/((R+s.r)*.72);if(!best||q<best.q)best={q:Math.round(q*100)/100,ratio:Math.round(s.r/R*100)/100,sprint:s.boostRemaining>0,chase:!!s.target?.chase,hunt:!!s.target?.hunt,speed:Math.round(Math.hypot(s.vx,s.vy)),wallDist:Math.round(Math.min(p.x,p.y,g.W-p.x,g.H-p.y)-R),inView:s.x+s.r>g.cam.x&&s.x-s.r<g.cam.x+g.vw&&s.y+s.r>g.cam.y&&s.y-s.r<g.cam.y+g.vh};}return best;});
 }catch(e){row.outcome='infra-error';row.error=String(e).slice(0,300);}
 await appendFile(out,JSON.stringify(row)+'\n');console.log(index,version,row.outcome,row.gameSeconds,row.size,row.oracle?.eats);await page.close();}
await browser.close();
