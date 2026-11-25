// Test-side probe: compare whiteDots rEst with true NPC radius (numbers only). Usage: node scripts/probe-dotsize-ocr-claude.mjs v2.13 130000 (needs local server on :8090 serving site/ocr-claude14)
import {createRequire} from 'node:module';const {chromium}=createRequire('/opt/npm-tools/')('playwright');
const b=await chromium.launch({channel:'chrome',headless:true});const ctx=await b.newContext({viewport:{width:2000,height:1163}});
const url='http://localhost:8090/ocr-claude14/';
await ctx.route(u=>u.href.startsWith(url),async route=>{const res=await route.fetch(),body=await res.text(),a="(()=>{'use strict';";await route.fulfill({response:res,body:body.split(a).join(a+"window.__dbg=()=>({player,slimes});")});});
await ctx.addInitScript(()=>{window.__d=[];window.ocrTestRecord=r=>{const g=document.getElementById('game')?.contentWindow?.__dbg?.(),m=r.analysis?.map||r.map;if(!g||!m?.player||!m.growMarkers)return;
 for(const w of m.growMarkers.filter(x=>x.red===false)){const x=(w.x-m.player.x)/m.width*10400,y=(w.y-m.player.y)/m.height*7200;let best=null,bd=160;for(const s of g.slimes){const d=Math.hypot(s.x-g.player.x-x,s.y-g.player.y-y);if(d<bd){bd=d;best=s;}}if(best)window.__d.push([w.rEst===null?-1:Math.round(w.rEst),Math.round(best.r),Math.round(g.player.r)]);}};});
const p=await ctx.newPage();await p.goto(url);await p.selectOption('#gameChoice','/'+process.argv[2]);await p.waitForTimeout(3000);await p.selectOption('#strategy','claude-14');await p.click('#go');await p.waitForTimeout(Number(process.argv[3]||70000));
const d=await p.evaluate(()=>window.__d);const sized=d.filter(v=>v[0]>0&&v[0]<114&&v[1]>=46&&v[1]<=112);const ratio=sized.map(v=>v[0]/v[1]).sort((a,b)=>a-b);
const nullSmall=d.filter(v=>v[0]===-1),nullBig=nullSmall.filter(v=>v[1]>=50).length;
console.log(process.argv[2],'samples',d.length,'sized(46-112 true)',sized.length,'rEst/true median',ratio[ratio.length>>1]?.toFixed(2),'p10',ratio[ratio.length/10|0]?.toFixed(2),'p90',ratio[ratio.length*.9|0]?.toFixed(2),'| null reported',nullSmall.length,'of which true>=50:',nullBig,'| est>=46 but true<40:',d.filter(v=>v[0]>=46&&v[1]<40).length);await b.close();
