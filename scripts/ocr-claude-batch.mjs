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
await ctx.addInitScript(()=>{const ring=[];window.ocrClaudeRing=ring;window.ocrTestRecord=r=>{const o=r.planOutput||{},npcs=(r.objects||[]).filter(x=>x.npc);const near=npcs.map(x=>({d:Math.round(Math.hypot(x.x,x.y)),r:Math.round(x.r),red:!!x.isRed,clip:!!x.clipped})).sort((a,b)=>a.d-b.d).slice(0,3);ring.push({t:r.hudTime,hud:r.hud,dir:o.name,clr:Math.round(o.clearance),thr:o.threats,esc:!!o.escaping,rsn:o.reason||null,ms:Math.round(r.elapsedCompute),near});if(ring.length>15)ring.shift();};});
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
  for(;;){
   await page.waitForTimeout(1000);
   const s=await page.evaluate(()=>{const d=document.getElementById('game').contentDocument,t=(d.getElementById('time')?.textContent||'').match(/(\d+):(\d+)/);
    const rgb=(/RGB\s*(\d+)\s*·\s*(\d+)\s*·\s*(\d+)/.exec(d.getElementById('mix')?.textContent||'')||[]).slice(1).map(Number),cs=rgb.length===3?.72+(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2])/255*.58:null;
    return {cs,left:t?Number(t[1])*60+Number(t[2]):null,size:Number(d.getElementById('size')?.textContent)||null,runs:[...document.querySelectorAll('#runs li')].map(l=>l.textContent),status:document.getElementById('status').textContent,action:document.getElementById('action').textContent,title:d.getElementById('title')?.textContent||'',desc:d.getElementById('description')?.textContent||''};});
   const elapsed=s.left===null?null:300-s.left;
   if(elapsed!==null&&(!row.samples.length||elapsed-row.samples.at(-1)[0]>=10))row.samples.push([elapsed,s.size,s.cs===null?null:Math.round(s.cs*1000)/1000]);
   row.lastAction=s.action;
   if(s.runs.length){const text=s.runs.at(-1);row.resultText=text;const m=s.desc.match(/(?:遊玩時間|Play time)\s*(\d+):(\d+)/);row.gameSeconds=m?Number(m[1])*60+Number(m[2]):null;
    row.outcome=/成功過關|You win/.test(s.title)?(row.gameSeconds!==null&&row.gameSeconds<=150?'win<=150':'win>150'):/吞掉|eaten/i.test(s.title)?'death':/時間到|Time/.test(s.title)?'timeout300':'unknown';
    const sz=s.desc.match(/最終體型\s*(\d+)/);row.size=sz?Number(sz[1]):s.size;row.lastDecisions=await page.evaluate(()=>window.ocrClaudeRing||[]);break;}
   if(elapsed!==null&&elapsed>150){row.outcome='cutoff150';row.gameSeconds=elapsed;row.size=s.size;await page.click('#stop');break;}
   if(/逾時|停止/.test(s.status)&&!s.runs.length&&Date.now()-started>5000){row.outcome='controller-stop';row.status=s.status;row.gameSeconds=elapsed;row.size=s.size;break;}
   if(Date.now()-started>420000){row.outcome='wall-timeout';break;}
  }
 }catch(e){row.outcome='infra-error';row.error=String(e).slice(0,300);}
 row.wallSeconds=Math.round((Date.now()-started)/1000);
 await appendFile(out,JSON.stringify(row)+'\n');console.log(index,version,row.outcome,row.gameSeconds,row.size);
 await page.close();
}
await browser.close();
