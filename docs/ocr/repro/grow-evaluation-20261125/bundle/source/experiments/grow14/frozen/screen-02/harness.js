/* Test orchestration reads rendered HUD/settlement, controls visible buttons,
   and records controller diagnostics. It never reads game player/slimes state. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),game=$('game');
 let manifest=null,busy=false,halted=false,current=null,events=[],runFinals=[];
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const clock=s=>{const m=String(s||'').match(/(\d+):(\d+)/);return m?+m[1]*60 + +m[2]:null;};
 const q=(doc,id)=>doc.getElementById(id)?.textContent?.trim()||'';
 function readVisible(){const doc=game.contentDocument;const ending=!!doc.querySelector('#gameEnding.visible');const overlay=doc.getElementById('overlay');const settled=overlay&&!overlay.classList.contains('hidden')&&/再玩一次|play again/i.test(q(doc,'start'));const hudTime=q(doc,'time');return {ending,settled,title:ending?q(doc,'endingTitle'):settled?q(doc,'title'):'',description:settled?q(doc,'description'):'',hudSize:Number(q(doc,'size'))||null,hudTime,eaten:Number(q(doc,'eaten')),elapsedVisible:clock(hudTime)===null?null:300-clock(hudTime)};}
 function env(){const c=game.contentDocument.querySelector('canvas');return {userAgent:navigator.userAgent,language:navigator.language,platform:navigator.platform,hardwareConcurrency:navigator.hardwareConcurrency,devicePixelRatio,viewport:{width:innerWidth,height:innerHeight},iframe:{width:game.clientWidth,height:game.clientHeight,transform:getComputedStyle(game).transform},canvas:{width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight},visibility:document.visibilityState,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone};}
 async function save(data){const row={schema:1,at:new Date().toISOString(),...data};const response=await fetch('/lab/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(row)});if(!response.ok)throw Error('記錄儲存失敗 '+response.status);events.push(row);return row;}
 function display(){ $('lab-results').textContent=runFinals.map(r=>r.runId+' | '+r.version+' | '+r.strategy+' | '+r.outcome+' | size '+r.final.hudSize+' | '+r.final.hudTime).join('\n');}
 window.ocrLabEvent=e=>{if(current)current.controllerEvents.push({...e,wallMs:performance.now()-current.start});};
 window.ocrTestRecord=rec=>{if(!current)return;current.computeMs.push(rec.elapsedCompute);current.decisions++;const elapsed=300-clock(rec.hudTime);if(current.lastSample===null||elapsed>=current.lastSample+1){current.lastSample=elapsed;current.samples.push({elapsedVisible:elapsed,hudTime:rec.hudTime,hudSize:rec.hud,wallMs:Math.round(performance.now()-current.start),computeMs:rec.elapsedCompute,objects:rec.objects.length,npcs:rec.objects.filter(o=>o.npc).length,foods:rec.objects.filter(o=>!o.npc).length,map:!!rec.map?.player,target:rec.target?{npc:!!rec.target.npc,mapOnly:!!rec.target.mapOnly,r:rec.target.r,visualR:rec.target.visualR,lower:rec.target.lower,upper:rec.target.upper,labelSeen:rec.target.labelSeen,localReliable:rec.target.localReliable,eta:rec.target.eta,utility:rec.target.utility,distance:Math.hypot(rec.target.x,rec.target.y)}:null,heading:rec.direction,clearance:Number.isFinite(rec.clearance)?rec.clearance:null,gain:rec.gain,mode:rec.planOutput?.mode||null,reason:rec.planOutput?.reason||null,eligibleNpc:rec.planOutput?.eligibleNpc??null,neutralNpc:rec.planOutput?.neutralNpc??null,uncertainNpc:rec.planOutput?.uncertainNpc??null,threats:rec.planOutput?.threats??null,first:rec.planOutput?.first??null,second:rec.planOutput?.second??null,smallNpcCount:rec.objects.filter(o=>o.npc&&o.visualR<=20).length,unlabelledSmallCount:rec.objects.filter(o=>!o.npc&&o.visualR<=20).length});}};
 async function slot(batch,slot,index){
  const runId=batch+'-'+String(index+1).padStart(2,'0');
  await save({kind:'slot',runId,batch,index,...slot,protocolHash:manifest.protocolHash});
  $('gameChoice').value='/'+slot.version;$('gameChoice').dispatchEvent(new Event('change'));$('strategy').value=slot.strategy;
  const loading=performance.now();while($('go').disabled){if(performance.now()-loading>30000)throw Error('30秒內未能就緒');await pause(100);}
  if(halted)return;
  current={...slot,runId,batch,start:performance.now(),decisions:0,computeMs:[],samples:[],controllerEvents:[],lastSample:null};
  const initial=readVisible(),environment=env();$('go').click();current.start=performance.now();
  const startedVisible=game.contentDocument.getElementById('overlay').classList.contains('hidden')&&!game.contentDocument.getElementById('pauseButton').disabled;
  await save({kind:'start',runId,batch,index,...slot,protocolHash:manifest.protocolHash,pageHash:manifest.pageHash,plannerHash:manifest.plannerHash,gameHashes:manifest.games[slot.version],environment,initial,startedVisible});
  let outcome=startedVisible?null:'infrastructure_error',final=readVisible(),lastProgress=0,reason=startedVisible?null:'game start not visibly confirmed';
  while(!outcome){
   await pause(100);final=readVisible();const wall=performance.now()-current.start;
   $('lab-progress').textContent=runId+' · '+slot.version+' · '+slot.strategy+' · 體型 '+final.hudSize+' · 經過約 '+final.elapsedVisible+' 秒';
   if(final.settled){const m=final.description.match(/(?:遊玩時間|Play time)\s*(\d+):(\d+)/);final.resultSeconds=m?+m[1]*60 + +m[2]:null;outcome=/成功過關|You win/i.test(final.title)?(final.resultSeconds!==null&&final.resultSeconds<=150?'win_le150':'win_late'):/被大史萊姆|You were eaten|swallowed/i.test(final.title)?'death':'unknown';}
   else if(halted){outcome='controller_abort';reason='manual batch halt';}
   else if(wall>300000){outcome='infrastructure_error';reason='wall clock limit 300s';}
   else if(final.ending){/* Wait for the visible settlement, still honor halt/deadline and record progress. */}
   else if(final.elapsedVisible>150){outcome='deadline_cutoff';reason='visible HUD elapsed >150';}
   else if(wall>1500&&!window.ocrLabStatus().active){outcome='controller_abort';reason=$('status').textContent;}
   if(wall-lastProgress>=5000){lastProgress=wall;await save({kind:'progress',runId,batch,...slot,visible:final,wallMs:Math.round(wall),decisions:current.decisions,latest:current.samples.at(-1)||null});}
  }
  $('stop').click();const released=window.ocrLabStatus().held.length===0;
  const row=await save({kind:'final',runId,batch,index,...slot,protocolHash:manifest.protocolHash,outcome,reason,final,wallMs:Math.round(performance.now()-current.start),keysReleased:released,decisions:current.decisions,computeMs:current.computeMs,samples:current.samples,controllerEvents:current.controllerEvents});
  runFinals.push(row);current=null;display();if(!released)throw Error('停止後仍有按鍵');await pause(400);
 }
 async function run(mode){
  if(busy||!manifest)return;busy=true;halted=false;$('lab-screen').disabled=true;$('lab-confirm').disabled=true;
  const batch=mode==='screen'?manifest.screen.id:manifest.confirmation.id;
  const slots=mode==='screen'?manifest.screen.order:Array.from({length:12},()=>['v2.13','v2.22'].map(version=>({version,strategy:'grow-14'}))).flat();
  if(mode==='confirm'&&!['v2.13','v2.22'].every(version=>runFinals.filter(r=>r.batch===manifest.screen.id&&r.version===version&&r.strategy==='grow-14'&&r.outcome==='win_le150').length>=2)){ $('lab-state').textContent='探索批次尚未達到兩版各2/4，不啟動確認。';busy=false;$('lab-screen').disabled=false;$('lab-confirm').disabled=false;return;}
  try{await save({kind:'batch_start',batch,protocol:manifest,planned:slots});for(let i=0;i<slots.length&&!halted;i++){ $('lab-state').textContent=batch+'：'+(i+1)+' / '+slots.length;await slot(batch,slots[i],i);}await save({kind:'batch_end',batch,halted,completed:runFinals.filter(r=>r.batch===batch).length,planned:slots.length});$('lab-state').textContent=halted?'批次已停止，所有開局記錄保留':'批次完成；逐版統計待獨立核對';}
  catch(e){halted=true;$('stop').click();$('lab-state').textContent='批次中止：'+e.message;try{if(current){const c=current;const row=await save({kind:'final',runId:c.runId,batch,version:c.version,strategy:c.strategy,protocolHash:manifest.protocolHash,outcome:'infrastructure_error',reason:e.message,final:readVisible(),wallMs:Math.round(performance.now()-c.start),keysReleased:window.ocrLabStatus().held.length===0,decisions:c.decisions,computeMs:c.computeMs,samples:c.samples,controllerEvents:c.controllerEvents});runFinals.push(row);current=null;display();}await save({kind:'batch_error',batch,message:e.message,runId:current?.runId||null});}catch{}}
  finally{busy=false;$('lab-confirm').disabled=false;}
 }
 $('lab-screen').onclick=()=>run('screen');$('lab-confirm').onclick=()=>run('confirm');$('lab-halt').onclick=()=>{halted=true;$('stop').click();};
 $('lab-screen').disabled=true;$('lab-confirm').disabled=true;
 fetch('/lab/manifest.json').then(r=>r.json()).then(m=>{manifest=m;$('lab-state').textContent='來源已固定：'+m.plannerHash.slice(0,12)+' · 單局前景 · 遊戲視野2000×1163';$('lab-screen').disabled=false;$('lab-confirm').disabled=false;}).catch(e=>{$('lab-state').textContent=e.message;});
})();
