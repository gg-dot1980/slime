// TEST-ONLY isolation experiment: run the controller's own planner (planClaude5 from the static page) on PERFECT
// perception built from the true game state, limited to what the screen and minimap show. Not an OCR controller.
// If this matches the test bot, the gap is perception; if it matches the OCR controller, the gap is the planner.
// Usage: [HYBRID_OPTS=claude-14] [HYBRID_MS=200] node scripts/ocr-claude-hybrid.mjs <url> <out.jsonl> <versions> <games> [label]
import {appendFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const req=createRequire(process.env.PLAYWRIGHT_DIR?process.env.PLAYWRIGHT_DIR+'/':import.meta.url);
const {chromium}=req('playwright');
const [url,out,versionList,perVersion,label='hybrid']=process.argv.slice(2);
const versions=versionList.split(','),n=Number(perVersion),order=[];for(let i=0;i<n;i++)for(const v of versions)order.push(v);
const OPTS={'claude-11':{clipWhite:true,clipRedClear:6,segment:true,safe:true},'claude-14':{clipWhite:true,clipRedClear:6,segment:true,safe:true,segFirst:true,memory:true,dotSize:true},'claude-15':{clipWhite:true,clipRedClear:6,segment:true,safe:true,segFirst:true,memory:true,dotSize:true,v2:true},'claude-15b':{clipWhite:true,clipRedClear:6,segment:true,safe:false,segFirst:true,memory:true,dotSize:true,v2:true},'claude-16':{clipWhite:true,clipRedClear:6,segment:true,safe:false,segFirst:true,memory:true,dotSize:true,v2:true},'claude-18':{clipWhite:true,clipRedClear:6,segment:true,safe:false,segFirst:true,memory:true,dotSize:true,v2:true,sizeMem:true,cluster:true},'claude-22':{clipWhite:true,clipRedClear:6,segment:true,safe:true,fit:true,wallOnly:true},'claude-24':{clipWhite:true,clipRedClear:6,segment:true,safe:true,fit:true,wallOnly:true,attract:3},'claude-5':{}}[process.env.HYBRID_OPTS||'claude-14'];
const hwarp=Math.max(1,Number(process.env.HYBRID_WARP)||1),period=Math.max(4,Math.round((Number(process.env.HYBRID_MS)||200)/hwarp));if(process.env.HYBRID_MAP==='real')OPTS.__realMap=true;if(process.env.HYBRID_SRC)OPTS.__src=process.env.HYBRID_SRC;
// HYBRID_NOWHITE=1: give the planner no off-view white markers (matches claude-20/22/23/24, which compute none).
if(process.env.HYBRID_EXTRA)Object.assign(OPTS,JSON.parse(process.env.HYBRID_EXTRA));// HYBRID_EXTRA: JSON merged into the planner options (test-only screening)
if(process.env.HYBRID_NOWHITE)OPTS.__noWhite=true;if(process.env.HYBRID_PROBE)OPTS.__probe=true;if(process.env.HYBRID_REC)OPTS.__rec=true;if(process.env.HYBRID_RIMFILTER)OPTS.__rim=true;if(process.env.HYBRID_MIX)OPTS.__mix=process.env.HYBRID_MIX.split(',');
const browser=await chromium.launch({channel:'chrome',headless:true});
const ctx=await browser.newContext({viewport:{width:2000,height:1163},deviceScaleFactor:1});
await ctx.route(u=>u.href.startsWith(url),async route=>{const res=await route.fetch(),body=await res.text(),anchor="(()=>{'use strict';";
 // HYBRID_WARP=N: same test-only time acceleration as the bot (N update(dt) sub-steps per frame); driver and poll
 // intervals are divided by N.
 let b2=body.split(anchor).join(anchor+"window.__dbg=()=>({player,slimes,foods,keys,elapsed,running,cam,vw,vh,W,H,setBoost:v=>{boosting=v}});").replace('let lastVision=0;','window.__p5=planClaude5;window.__see=(...a)=>readImage(...a);window.__setStrat=v=>{runStrategy=v};let lastVision=0;');
 const warp=Math.max(1,Number(process.env.HYBRID_WARP)||1);if(warp>1){if(!b2.includes('last=t;update(dt);'))throw new Error('warp anchor missing');b2=b2.split('last=t;update(dt);').join('last=t;for(let __k=0;__k<'+warp+'&&running;__k++)update(dt);');}
 await route.fulfill({response:res,body:b2});});
// Runs in the controller page (parent): planClaude5 and dirs are its globals; the game is reached through the iframe.
const driver=([opts,period])=>{const gw=document.getElementById('game').contentWindow,stats={ticks:0,eats:[],foodGain:0,npcGain:0,err:null};window.__hy=stats;let old={x:1,y:0},lastR=null,last=null;
 window.__hyTimer=setInterval(()=>{try{const g=gw.__dbg();if(!g.running)return;g.setBoost(true);const p=g.player,R=p.r;stats.ticks++;
  // growth classification (same as the batch observer)
  if(last){const cur=new Set(g.slimes),gone=[...last].filter(q=>!cur.has(q)),dr=p.r-lastR,mine=gone.filter(q=>Math.hypot(q.x-p.x,q.y-p.y)<(lastR+q.r)*.72+80&&lastR>=q.r*1.08);if(mine.length&&dr>0){stats.npcGain+=dr;for(const q of mine)stats.eats.push([Math.round(g.elapsed*10)/10,Math.round(lastR),Math.round(q.r/lastR*100)/100]);}else if(dr>0)stats.foodGain+=dr;}
  lastR=p.r;last=new Set(g.slimes);
  const inView=q=>q.x+q.r>g.cam.x&&q.x-q.r<g.cam.x+g.vw&&q.y+q.r>g.cam.y&&q.y-q.r<g.cam.y+g.vh;
  const objects=[...g.slimes.filter(inView).map(q=>({x:q.x-p.x,y:q.y-p.y,r:q.r,npc:true,clipped:false,blocked:false,isRed:false,vx:q.vx,vy:q.vy})),
   ...g.foods.filter(f=>f.x>g.cam.x&&f.x<g.cam.x+g.vw&&f.y>g.cam.y&&f.y<g.cam.y+g.vh).map(f=>({x:f.x-p.x,y:f.y-p.y,r:f.r,npc:false,clipped:false,blocked:false,vx:0,vy:0}))];
  // HYBRID_MAP=real: degrade the minimap like the real one — positions rounded to map pixels, and dots within 1.5 map
  // px of the camera rectangle stroke removed (the stroke is drawn over the dots).
  const mw=144,mh=144*g.H/g.W,real=opts.__realMap,q2=v=>real?Math.round(v-.5)+.5:v,mp=q=>({x:q2(q.x/g.W*mw),y:q2(q.y/g.H*mh)});
  const L=g.cam.x/g.W*mw,T=g.cam.y/g.H*mh,Rr=(g.cam.x+g.vw)/g.W*mw,B=(g.cam.y+g.vh)/g.H*mh,onStroke=q=>{const x=q.x/g.W*mw,y=q.y/g.H*mh;return (Math.abs(x-L)<1.5||Math.abs(x-Rr)<1.5)&&y>T-1.5&&y<B+1.5||(Math.abs(y-T)<1.5||Math.abs(y-B)<1.5)&&x>L-1.5&&x<Rr+1.5;};
  const off=g.slimes.filter(q=>!inView(q)&&!(real&&onStroke(q)));
  const map={x:0,y:0,width:mw,height:mh,player:mp(p),pixelRatio:1,viewWidth:g.vw,viewHeight:g.vh,visibleWalls:null,
   threats:off.filter(q=>q.r>R*1.12).map(mp),growMarkers:[...off.filter(q=>q.r>R*1.12).map(q=>({...mp(q),red:true})),...off.filter(q=>q.r<=R*1.12&&!opts.__noWhite).map(q=>({...mp(q),red:false,rEst:q.r>=45.6?Math.min(q.r,114):null}))]};
  const c=p.color,S=Math.max(92,260-(R-25)*.65)*(.72+(.2126*c[0]+.7152*c[1]+.0722*c[2])/255*.58)*1.38;
  // HYBRID_SRC: substitute the controller's REAL perception for one part. detmap = real minimap detection with true
  // on-screen objects; detview = real on-screen detection with the simulated (degraded) minimap.
  let useObjects=objects,useMap=map;
  if(['detmap','detview','detnpc','detfood','mix'].includes(opts.__src)){const doc=gw.document,hud=Number(doc.getElementById('size')?.textContent)||25,a=window.__see(doc.querySelector('canvas'),hud,g.elapsed*1000,{x:p.vx,y:p.vy});// game-time clock: correct under HYBRID_WARP (wall clock would inflate on-screen velocities N times)
   // HYBRID_RIMFILTER=1 (test-only screening): drop tiny unclipped "NPC" blobs on the player's own rim
   // (frame study: ~64% of spurious detections are r≈8 px at 0.95–1.13R from the centre, far from any true NPC).
   if(opts.__rim&&a.objects)a.objects=a.objects.filter(o=>!(o.npc&&!o.clipped&&!o.mapOnly&&o.r<=Math.min(16,R*.2)&&Math.abs(Math.hypot(o.x,o.y)/R-1.04)<=.16));
   stats.seen=(stats.seen||0)+1;
   // HYBRID_REC=1: per-frame record for offline tracking studies — game time, true player, the controller's own
   // player-velocity estimate, detected on-screen NPCs, and true NPCs within 1.3x the view (stable ids). Relative coords.
   if(opts.__rec){const R2=window.__rec=window.__rec||{frames:[]},ids=window.__ids=window.__ids||new WeakMap(),rd=v=>Math.round(v*10)/10;let nid=window.__nid||0;
    const id=q=>{if(!ids.has(q))ids.set(q,++nid);return ids.get(q);},mx=g.vw*.65,my=g.vh*.65,cx=g.cam.x+g.vw/2,cy=g.cam.y+g.vh/2;
    R2.frames.push({t:Math.round(g.elapsed*1000),p:[rd(p.x),rd(p.y),rd(p.r),rd(p.vx),rd(p.vy)],cam:[rd(g.cam.x),rd(g.cam.y),g.vw,g.vh],ev:a.velocity?[rd(a.velocity.x),rd(a.velocity.y)]:null,
     det:(a.objects||[]).filter(o=>o.npc&&!o.mapOnly).map(o=>[rd(o.x),rd(o.y),rd(o.r),o.clipped?1:0,rd(o.vx||0),rd(o.vy||0),o.seg&&Number.isFinite(o.seg.r)?rd(o.seg.r):null,o.fit&&Number.isFinite(o.fit.r)?rd(o.fit.r):null,o.isRed?1:0]),
     tru:g.slimes.filter(q=>Math.abs(q.x-cx)<mx+q.r&&Math.abs(q.y-cy)<my+q.r).map(q=>[id(q),rd(q.x-p.x),rd(q.y-p.y),rd(q.r),rd(q.vx),rd(q.vy),inView(q)?1:0])});window.__nid=nid;}
   // HYBRID_PROBE=1: match detected on-screen NPCs to true ones (nearest centre within max(40,0.6r)) and record
   // [trueR/R, detR/trueR, clipped, |dv| px/s, dist/R] for matches, true misses [r/R, dist/R, partly off-view], and spurious detections [r/R, dist/R].
   if(opts.__probe&&stats.seen%3===0){const P=stats.probe=stats.probe||{m:[],miss:[],spur:[]},det=(a.objects||[]).filter(o=>o.npc),tru=objects.filter(o=>o.npc),used=new Set(),rd=v=>Math.round(v*100)/100;
    for(const t of tru){let best=null,bd=Math.max(40,t.r*.6);for(const d of det){if(used.has(d))continue;const dd=Math.hypot(d.x-t.x,d.y-t.y);if(dd<bd){bd=dd;best=d;}}
     const sx=t.x+p.x,sy=t.y+p.y,part=sx-t.r<g.cam.x||sy-t.r<g.cam.y||sx+t.r>g.cam.x+g.vw||sy+t.r>g.cam.y+g.vh;
     if(best){used.add(best);if(P.m.length<4000)P.m.push([rd(t.r/R),rd(best.r/t.r),best.clipped?1:0,Math.round(Math.hypot(best.vx-t.vx,best.vy-t.vy)),rd(Math.hypot(t.x,t.y)/R),part?1:0,best.isRed?1:0]);}
     else if(P.miss.length<2000)P.miss.push([rd(t.r/R),rd(Math.hypot(t.x,t.y)/R),part?1:0]);}
    for(const d of det)if(!used.has(d)&&P.spur.length<2000)P.spur.push([rd(d.r/R),rd(Math.hypot(d.x,d.y)/R),d.clipped?1:0]);}if(opts.__src==='detmap'){if(a.map?.player)useMap=a.map;else stats.noMap=(stats.noMap||0)+1;}else if(opts.__src==='detview')useObjects=a.objects||[];
   // detnpc = detected NPCs + true foods; detfood = true NPCs + detected foods (splits the on-screen perception gap).
   else if(opts.__src==='detnpc')useObjects=[...(a.objects||[]).filter(o=>o.npc),...objects.filter(o=>!o.npc)];
   else if(opts.__src==='detfood')useObjects=[...objects.filter(o=>o.npc),...(a.objects||[]).filter(o=>!o.npc)];
   // mix = true objects with ONE detection error class switched on (HYBRID_MIX, comma list): spur (add detected NPCs
   // that match no true NPC), miss (drop true NPCs that match no detection), size (detected radius for matched),
   // pos (detected position, velocity, clipped/segment/fit fields for matched), clip (only clipped/seg/fit/dangerRadius/isRed
   // for matched), vel (only detected velocity for matched). Matching: nearest detected centre
   // within max(40,0.6r), or within r for a true NPC partly outside the view.
   else if(opts.__src==='mix'){const mix=new Set(opts.__mix||[]),det=(a.objects||[]).filter(o=>o.npc),used=new Set(),outNpc=[];
    for(const t of objects.filter(o=>o.npc)){const sx=t.x+p.x,sy=t.y+p.y,part=sx-t.r<g.cam.x||sy-t.r<g.cam.y||sx+t.r>g.cam.x+g.vw||sy+t.r>g.cam.y+g.vh;let best=null,bd=part?t.r:Math.max(40,t.r*.6);
     for(const d of det){if(used.has(d))continue;const dd=Math.hypot(d.x-t.x,d.y-t.y);if(dd<bd){bd=dd;best=d;}}
     if(!best){if(!mix.has('miss'))outNpc.push(t);continue;}used.add(best);
     let o={...t};if(mix.has('pos'))o={...best,r:t.r};if(mix.has('clip'))o={...o,clipped:best.clipped,seg:best.seg,fit:best.fit,dangerRadius:best.dangerRadius,isRed:best.isRed};if(mix.has('vel'))o={...o,vx:best.vx,vy:best.vy};if(mix.has('size'))o.r=best.r;outNpc.push(o);}
    if(mix.has('spur'))for(const d of det)if(!used.has(d))outNpc.push(d);
    useObjects=[...outNpc,...objects.filter(o=>!o.npc)];}}
  const d=window.__p5(useObjects,R,useMap,S,{x:p.vx,y:p.vy},old,opts);old={x:d.x,y:d.y};
  for(const k of ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'])g.keys.delete(k);if(d.x>.38)g.keys.add('ArrowRight');if(d.x<-.38)g.keys.add('ArrowLeft');if(d.y>.38)g.keys.add('ArrowDown');if(d.y<-.38)g.keys.add('ArrowUp');
 }catch(e){stats.err=String(e).slice(0,200);}},period);return 'installed';};
let index=0;
for(const version of order){index++;const page=await ctx.newPage(),started=Date.now(),row={label,index,version,opts:process.env.HYBRID_OPTS||'claude-14',map:process.env.HYBRID_MAP||'exact',src:process.env.HYBRID_SRC||'true',noWhite:!!process.env.HYBRID_NOWHITE,mix:process.env.HYBRID_MIX||null,extra:process.env.HYBRID_EXTRA||null,rim:!!process.env.HYBRID_RIMFILTER,periodMs:period,warp:hwarp,outcome:'unknown',samples:[]};
 try{await page.goto(url);await page.selectOption('#gameChoice','/'+version);
  await page.waitForFunction(v=>document.getElementById('gameVersion').textContent.includes(v),version,{timeout:30000});await page.waitForTimeout(1500);
  const f=await (await page.$('#game')).contentFrame();await f.click('#start');await page.waitForTimeout(500);if(process.env.HYBRID_SRC)await page.evaluate(v=>window.__setStrat(v),process.env.HYBRID_STRAT||'claude-16');row.driver=await page.evaluate(driver,[OPTS,period]);
  for(;;){await page.waitForTimeout(Math.round(1000/hwarp));const s=await f.evaluate(()=>{const g=window.__dbg();return {t:g.elapsed,r:g.player.r,running:g.running};});
   if(!row.samples.length||s.t-row.samples.at(-1)[0]>=10)row.samples.push([Math.round(s.t),Math.round(s.r)]);
   if(s.r>=200||(!s.running&&s.t>1)){row.gameSeconds=Math.round(s.t);row.size=Math.round(s.r);row.outcome=s.r>=200?(s.t<=150?'win<=150':'win>150'):'death';break;}
   if(s.t>150){row.gameSeconds=Math.round(s.t);row.size=Math.round(s.r);row.outcome='cutoff150';break;}
   if(Date.now()-started>300000){row.outcome='wall-timeout';break;}}
  row.hybrid=await page.evaluate(()=>{clearInterval(window.__hyTimer);return window.__hy;});
  if(process.env.HYBRID_REC){const rec=await page.evaluate(()=>window.__rec||null);if(rec)await appendFile(out.replace(/\.jsonl$/,'')+'-frames.jsonl',JSON.stringify({label,index,version,frames:rec.frames})+'\n');}
 }catch(e){row.outcome='infra-error';row.error=String(e).slice(0,300);}
 await appendFile(out,JSON.stringify(row)+'\n');console.log(index,version,row.outcome,row.gameSeconds,row.size,row.hybrid?.eats?.length,row.hybrid?.err||'');await page.close();}
await browser.close();
