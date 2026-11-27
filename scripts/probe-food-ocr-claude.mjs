// Test-side probe: food detection recall vs true in-view foods (numbers only). Usage: node scripts/probe-food-ocr-claude.mjs v2.13 (local server :8090 serving site/ocr-claude16)
import {createRequire} from 'node:module';const {chromium}=createRequire('/opt/npm-tools/')('playwright');
const b=await chromium.launch({channel:'chrome',headless:true});const ctx=await b.newContext({viewport:{width:2000,height:1163}});
const url='http://localhost:8090/ocr-claude16/';
await ctx.route(u=>u.href.startsWith(url),async route=>{const res=await route.fetch(),body=await res.text(),a="(()=>{'use strict';";await route.fulfill({response:res,body:body.split(a).join(a+"window.__dbg=()=>({player,foods,cam,vw,vh});")});});
await ctx.addInitScript(()=>{window.__f=[];window.ocrTestRecord=r=>{const g=document.getElementById('game')?.contentWindow?.__dbg?.();if(!g)return;const p=g.player;
 const tf=g.foods.filter(f=>f.x>g.cam.x&&f.x<g.cam.x+g.vw&&f.y>g.cam.y&&f.y<g.cam.y+g.vh).map(f=>[f.x-p.x,f.y-p.y,f.r]);const df=(r.objects||[]).filter(o=>!o.npc);
 let hit=0;const missR=[],missD=[];for(const t of tf){const m=df.some(d=>Math.hypot(d.x-t[0],d.y-t[1])<Math.max(14,t[2]));if(m)hit++;else{missR.push(Math.round(t[2]));missD.push(Math.round(Math.hypot(t[0],t[1])));}}
 window.__f.push([tf.length,df.length,hit,missR,missD,Math.round(p.r)]);};});
const p=await ctx.newPage();await p.goto(url);await p.selectOption('#gameChoice','/'+process.argv[2]);await p.waitForTimeout(3000);await p.selectOption('#strategy','claude-16');await p.click('#go');await p.waitForTimeout(40000);
const f=await p.evaluate(()=>window.__f);const sum=i=>f.reduce((a,r)=>a+r[i],0);const mr={},md=[];for(const r of f){for(const x of r[3])mr[x]=(mr[x]||0)+1;md.push(...r[4]);}md.sort((a,b)=>a-b);
console.log(process.argv[2],'frames',f.length,'true foods',sum(0),'detected non-npc',sum(1),'true matched',sum(2),'recall %.0f%%'%(100*sum(2)/sum(0)),'missed radius histogram',JSON.stringify(mr),'missed dist from player median',md[md.length>>1],'p10',md[md.length/10|0]);await b.close();
