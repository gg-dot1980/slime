'use strict';
// Local-only foreground browser runner. Run from a full Git checkout.
// npm install --no-save playwright ; npx playwright install chromium
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const argv=process.argv.slice(2);
const opt=(k,d)=>{const i=argv.indexOf(k);return i<0?d:argv[i+1];};
const versions=[
 {version:'v2.13',path:'/v2.13',blob:'16d41cdf2997baf0b3af33567b201d2dfb835427'},
 {version:'v2.22',path:'/v2.22',blob:'30af12f7608da91514711ecdbc01b57654ab2eab'}
];
function clock(s){const m=/^(\d+):([0-5]\d)$/.exec(String(s).trim());return m?Number(m[1])*60+Number(m[2]):null;}
function nativeResult(s){
 if(!s.resultVisible)return null;
 const m=/(?:遊玩時間|Play time)\s*(\d+):([0-5]\d)/i.exec(s.description||'');
 const seconds=m?Number(m[1])*60+Number(m[2]):null;
 if(seconds===null)return {outcome:'unknown-native',seconds};
 if(/成功過關|You win/i.test(s.title))return {outcome:seconds<=150?'win':'late-win',seconds};
 if(/被大史萊姆吞掉了|You were eaten/i.test(s.title))return {outcome:'death',seconds};
 if(/時間到|Time's up/i.test(s.title))return {outcome:'game-timeout',seconds};
 return {outcome:'unknown-native',seconds};
}
function classify(s,elapsed){
 const result=nativeResult(s);if(result)return result;
 if(clock(s.remaining)!==null&&clock(s.remaining)<150)return {outcome:'deadline',seconds:null};
 if(elapsed>210000)return {outcome:'wall-time-abort',seconds:null};
 if(s.controller&&s.controller.active===false)return {outcome:'controller-abort',seconds:null};
 return null;
}
function selfTest(){
 assert.equal(clock('02:30'),150);assert.equal(clock('bad'),null);
 assert.equal(classify({resultVisible:true,title:'You win!',description:'Play time 2:30',remaining:'02:29'},1).outcome,'win');
 assert.equal(classify({resultVisible:true,title:'成功過關！',description:'遊玩時間 2:31'},1).outcome,'late-win');
 assert.equal(classify({resultVisible:true,title:'被大史萊姆吞掉了',description:'遊玩時間 1:20'},1).outcome,'death');
 assert.equal(classify({remaining:'02:30',controller:{active:true}},1),null);
 assert.equal(classify({remaining:'02:29',controller:{active:true}},1).outcome,'deadline');
 assert.equal(classify({remaining:'03:00',controller:{active:false}},1).outcome,'controller-abort');
 assert.equal(classify({resultVisible:true,title:'You win!',description:''},1).outcome,'unknown-native');
 assert.equal(classify({},210001).outcome,'wall-time-abort');
 console.log('10 classification assertions passed; not live games.');
}
function loadBlob(sha){
 const b=cp.execFileSync('git',['cat-file','blob',sha],{maxBuffer:2*1024*1024});
 const hash=crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
 assert.equal(hash,sha,'original game blob mismatch');return b;
}
function sha256(b){return crypto.createHash('sha256').update(b).digest('hex');}
async function main(){
 if(argv.includes('--self-test')){selfTest();return;}
 const phase=opt('--phase','explore');assert(['explore','confirm','diagnostic'].includes(phase));
 const count=phase==='explore'?4:phase==='confirm'?12:1;
 const output=opt('--output',null);assert(output,'specify new --output /tmp/name.jsonl');
 const viewport={width:Number(opt('--width','1440')),height:Number(opt('--height','900'))};
 assert(Number.isInteger(viewport.width)&&viewport.width>=851&&viewport.width<=3840&&Number.isInteger(viewport.height)&&viewport.height>=500&&viewport.height<=2160);
 const source=fs.readFileSync(path.join(__dirname,'ocr-grow25.html'));
 const hash=sha256(source);
 const games=new Map(versions.map(v=>[v.path,loadBlob(v.blob)]));
 const contract={sourceSha256:hash,viewport,deviceScaleFactor:1,versions:versions.map(v=>({version:v.version,blob:v.blob,sha256:sha256(games.get(v.path))}))};
 if(phase==='confirm'){
  const prior=opt('--explore',null);assert(prior,'confirmation requires --explore completed ledger');
  const rows=fs.readFileSync(prior,'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows[0].contract,contract);assert.equal(rows[0].phase,'explore');
  for(const v of versions){
   const starts=rows.filter(r=>r.type==='start'&&r.version===v.version);
   const ends=rows.filter(r=>r.type==='result'&&r.version===v.version);
   assert.equal(starts.length,4);assert.equal(ends.length,4);
   assert.deepEqual(starts.map(r=>r.id).sort(),ends.map(r=>r.id).sort());
   assert(ends.every(r=>r.stopVerified&&r.nativeStarted));
   assert(ends.filter(r=>r.outcome==='win').length>=2,'exploration threshold not met');
  }
 }
 const fd=fs.openSync(output,'wx'),write=r=>{fs.writeSync(fd,JSON.stringify(r)+'\n');fs.fsyncSync(fd);console.log(JSON.stringify(r));};
 let deniedPosts=0;const server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://127.0.0.1').pathname;
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){deniedPosts++;res.writeHead(503,{'Content-Type':'application/json'}).end('{"error":"isolated test: writes disabled"}');return;}
  if(p==='/api/versions'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({versions:versions.map(v=>({version:v.version,path:v.path,current:v.version==='v2.22'})),currentVersion:'v2.22',currentPath:'/v2.22'}));return;}
  const b=p==='/ocr-grow'?source:games.get(p==='/'?'/v2.22':p);
  if(b){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(b);return;}
  res.writeHead(503,{'Content-Type':'application/json'}).end('{"error":"isolated test: unavailable"}');
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  const {chromium}=require('playwright');
  browser=await chromium.launch({headless:false,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  write({type:'batch',phase,contract,browser:browser.version(),platform:process.platform,node:process.version,headless:false,seed:'uncontrolled'});
  for(let i=1;i<=count;i++)for(const v of versions){
   const id=v.version+'-'+i;
   let context,page,result={outcome:'setup-abort',seconds:null},stopVerified=false,nativeStarted=false,maxSize=0,errors=0,viewportActual=null;
   write({type:'start',version:v.version,id,at:new Date().toISOString()});
   try{
    context=await browser.newContext({viewport,deviceScaleFactor:1,locale:'zh-TW',isMobile:false,hasTouch:false,serviceWorkers:'block'});
    await context.route('**/*',route=>{try{return new URL(route.request().url()).origin===origin?route.continue():route.abort();}catch{return route.abort();}});
    page=await context.newPage();page.on('pageerror',()=>errors++);
    await page.goto(origin+'/ocr-grow',{waitUntil:'load'});await page.bringToFront();
    await page.locator('#gameChoice').waitFor();await page.waitForFunction(()=>!document.getElementById('gameChoice').disabled);
    await page.selectOption('#gameChoice',v.path);
    await page.waitForFunction(expected=>{const d=document.getElementById('game').contentDocument;return !document.getElementById('go').disabled&&d?.querySelector('.eyebrow')?.textContent.includes(expected);},v.version,{timeout:15000});
    viewportActual=await page.evaluate(()=>{const f=document.getElementById('game'),c=f.contentDocument.querySelector('canvas'),r=f.getBoundingClientRect();return {outer:[innerWidth,innerHeight],iframe:[r.width,r.height],canvas:[c.width,c.height],canvasCss:[c.clientWidth,c.clientHeight],dpr:f.contentWindow.devicePixelRatio,visible:document.visibilityState,transform:getComputedStyle(f).transform};});
    assert.equal(viewportActual.visible,'visible');assert.equal(viewportActual.transform,'none');
    await page.locator('#go').click();
    await page.waitForFunction(()=>document.getElementById('game').contentDocument.querySelector('#overlay.hidden')&&window.ocrLabStatus?.().active===true,null,{timeout:10000});
    nativeStarted=true;const started=Date.now();
    while(true){
     const s=await page.evaluate(()=>{const d=document.getElementById('game').contentDocument,txt=id=>d.getElementById(id)?.textContent?.trim()||'';return {resultVisible:!!d.querySelector('#gameEnding.visible')||(!d.querySelector('#overlay.hidden')&&/^(再玩一次|play again)$/i.test(txt('start'))),title:txt('title'),description:txt('description'),remaining:txt('time'),size:Number(txt('size')),controller:window.ocrLabStatus?.(),visible:document.visibilityState};});
     if(s.visible!=='visible'){result={outcome:'background-abort',seconds:null};break;}
     if(Number.isFinite(s.size))maxSize=Math.max(maxSize,s.size);
     const status=classify(s,Date.now()-started);if(status){result=status;break;}
     await page.waitForTimeout(100);
    }
   }catch(e){result={outcome:nativeStarted?'runner-abort':'setup-abort',seconds:null};}
   finally{
    if(page&&!page.isClosed()){
     try{await page.locator('#stop').click({timeout:3000});stopVerified=await page.evaluate(()=>{const s=window.ocrLabStatus?.();return !!s&&!s.active&&s.held.length===0;});}catch{}
    }
    write({type:'result',id,version:v.version,...result,nativeStarted,stopVerified,maxSize,viewportActual,pageErrors:errors});
    if(context)await context.close();
   }
   if(!stopVerified||!nativeStarted)throw Error('batch interrupted; do not replace unresolved/aborted attempts');
  }
  write({type:'batch-end',deniedPosts});
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.closeSync(fd);}
}
main().catch(e=>{console.error(String(e));process.exitCode=1;});
