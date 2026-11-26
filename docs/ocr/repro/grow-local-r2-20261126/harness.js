'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let frame = $('candidate'), preparedIdentity = null;
  const controls = ['candidateChoice','diagnostic','explore','confirm'];
  let manifest, active = false, requestedStop = false, current = null, latest = null;
  let batchId = null, sequence = 0, queue = Promise.resolve(), ioError = null;
  let lastExploration = null, results = [], heartbeat = 0;
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const text = (doc,id) => (doc.getElementById(id)?.textContent || '').trim();
  const number = n => Number.isFinite(n) ? n : null;
  const bounded = (s,n=800) => String(s || '').slice(0,n);
  function status(s) { $('status').textContent = s; }
  function enabled(ready) {
    for (const id of controls) $(id).disabled = !ready;
    $('confirm').disabled = !ready || !lastExploration || lastExploration.candidate !== $('candidateChoice').value;
    $('halt').disabled = !active;
  }
  async function until(test, limit, message) {
    const end = performance.now() + limit;
    while (performance.now() < end) { const value = test(); if (value) return value; await pause(50); }
    throw Error(message);
  }
  function visible(el) {
    if (!el || !el.getClientRects().length) return false;
    const css = el.ownerDocument.defaultView.getComputedStyle(el);
    return css.display !== 'none' && css.visibility !== 'hidden' && css.opacity !== '0';
  }
  function candidateDocument() { return frame.contentDocument; }
  function gameDocument() { return candidateDocument()?.getElementById('game')?.contentDocument; }
  function geometry() {
    const doc = candidateDocument(), win = frame.contentWindow, game = doc.getElementById('game'), canvas = game.contentDocument.querySelector('canvas');
    const rect = game.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
    return {outer: [innerWidth,innerHeight], candidate: [win.innerWidth,win.innerHeight],
      iframe: [rect.width,rect.height], canvas: [canvas.width,canvas.height], canvasCss: [canvas.clientWidth,canvas.clientHeight],
      deviceScaleFactor: devicePixelRatio, gameDpr: game.contentWindow.devicePixelRatio,
      gameTransform: win.getComputedStyle(game).transform, canvasTransform: game.contentWindow.getComputedStyle(canvas).transform,
      canvasPositionInGame: [cr.x,cr.y,cr.width,cr.height], candidateScroll: [win.scrollX,win.scrollY]};
  }
  function evidence() {
    const doc = gameDocument();
    if (!doc) return {resultVisible:false,endingVisible:false,title:'',description:'',remaining:'',size:null};
    const overlay = doc.getElementById('overlay'), start = text(doc,'start');
    const resultVisible = visible(overlay) && /^(再玩一次|play again)$/i.test(start);
    return {resultVisible, endingVisible: !!doc.querySelector('#gameEnding.visible'),
      title: resultVisible ? bounded(text(doc,'title')) : '', description: resultVisible ? bounded(text(doc,'description')) : '',
      remaining: text(doc,'time'), size: text(doc,'size')!=='' && Number.isFinite(Number(text(doc,'size'))) ? Number(text(doc,'size')) : null,
      overlayVisible: visible(overlay), pauseVisible: !!doc.querySelector('#pauseScreen.open'),
      visibility: document.visibilityState, candidateVisibility: candidateDocument().visibilityState,
      controllerStatusText: bounded(text(candidateDocument(),'status'),300),
      documentIdentity:{candidateUrl:candidateDocument()?.URL,gameUrl:doc.URL,visibleVersion:doc.querySelector('.eyebrow')?.textContent.match(/v\d+\.\d+/)?.[0] || null}};
  }
  function classify(e) {
    if (e.resultVisible) {
      const match = /(?:遊玩時間|Play time)\s*(\d+):([0-5]\d)/i.exec(e.description);
      const seconds = match ? Number(match[1])*60 + Number(match[2]) : null;
      if (seconds === null) return {outcome:'unknown-native',seconds};
      if (/成功過關|You win/i.test(e.title)) return {outcome:seconds<=150?'win':'late-win',seconds};
      if (/被大史萊姆吞掉了|You were eaten/i.test(e.title)) return {outcome:'death',seconds};
      if (/時間到|Time's up/i.test(e.title)) return {outcome:'game-timeout',seconds};
      return {outcome:'unknown-native',seconds};
    }
    if (e.endingVisible) return null;
    const clock = /^(\d+):([0-5]\d)$/.exec(e.remaining);
    const seconds = clock ? 300 - Number(clock[1])*60 - Number(clock[2]) : null;
    return seconds !== null && seconds > 150 ? {outcome:'deadline',seconds} : null;
  }
  function append(row) {
    const payload = {batchId,seq:sequence++,row:{...row,batchId,at:new Date().toISOString()}};
    queue = queue.then(async () => {
      let last;
      for (let attempt=0;attempt<2;attempt++) {
        try {
          const response = await fetch('/lab/append', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(6000)});
          const data = await response.json();
          if (!response.ok || !data.accepted) throw Error(data.error || 'Ledger append rejected');
          return data;
        } catch (error) { last=error; }
      }
      ioError=last; requestedStop=true;
      candidateDocument()?.getElementById('stop')?.click();
      throw last;
    });
    queue.catch(() => {});
    return queue;
  }
  function plainObject(source, keys) {
    const result = {};
    for (const key of keys) if (typeof source?.[key] === 'number' && Number.isFinite(source[key]) || typeof source?.[key] === 'boolean' || typeof source?.[key] === 'string') result[key]=source[key];
    return result;
  }
  // Inputs are already numeric visible-image estimates made by the candidate.
  // Preserve planner fields instead of a lossy whitelist; never copy pixels.
  function copyDiagnostic(value, state, depth=0) {
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') { if(value.length>400)state.truncated=true; return value.slice(0,400); }
    if (typeof value !== 'object') return undefined;
    if (depth > 8) { state.truncated=true; return null; }
    if (Array.isArray(value)) {
      if(value.length>120)state.truncated=true;
      return value.slice(0,120).map(v=>copyDiagnostic(v,state,depth+1));
    }
    const out={}, entries=Object.entries(value);
    if(entries.length>100)state.truncated=true;
    for(const [key,child] of entries.slice(0,100)) {
      if(/^(pixels|rgba|imageData|image|screenshot|dataUrl|png|jpeg|token|cookie|authorization)$/i.test(key)) throw Error('Prohibited diagnostic field');
      const safe=copyDiagnostic(child,state,depth+1);if(safe!==undefined)out[key]=safe;
    }
    return out;
  }
  function controllerSnapshot(r) {
    const pi=r.planInput || {}, state={truncated:false};
    const planInput=copyDiagnostic({hud:pi.hud,speed:pi.speed,velocity:pi.velocity,heading:pi.heading,objects:pi.objects,map:pi.map,splitGuard:pi.splitGuard},state);
    const planOutput=copyDiagnostic(r.planOutput || {},state);
    return {recordAt:number(r.recordAt),decisionStartedAt:number(r.ms),hud:r.hud,hudTime:r.hudTime,
      decisionAgeMs:number(r.decisionAgeMs),tickTotalMs:number(r.tickTotalMs),
      phaseMs:plainObject(r.phaseMs,['setup','readImage','planner','recordRender']),
      diagnosticTruncated:state.truncated,planInput,planOutput};
  }
  async function prepare(candidate, version) {
    // Only the test origin's known game storage is reset; the source game is unchanged.
    for (let i=localStorage.length-1;i>=0;i--) { const key=localStorage.key(i); if (/^slime/i.test(key)) localStorage.removeItem(key); }
    preparedIdentity=null;
    // A fresh element cannot expose the previous attempt's paused document.
    const old=frame, fresh=document.createElement('iframe');
    fresh.id=old.id;fresh.title=old.title;
    const priorStatus=old.contentWindow?.ocrLabStatus?.();
    if(priorStatus && (priorStatus.active || priorStatus.held?.length)) throw Error('Prior candidate has not released control');
    old.replaceWith(fresh);frame=fresh;
    const expected=new URL('/candidate/'+candidate+'?load='+Date.now(),location.href).href;
    frame.src=expected;
    await until(()=>candidateDocument()?.URL===expected && candidateDocument()?.getElementById('gameChoice') && !candidateDocument().getElementById('gameChoice').disabled,15000,'Fresh candidate document did not become ready');
    const doc=candidateDocument(), choice=doc.getElementById('gameChoice');
    const expectedGameUrl=new URL('/'+version,location.href).href;
    if (choice.value !== '/'+version) { choice.value='/'+version; choice.dispatchEvent(new Event('change',{bubbles:true})); }
    await until(()=>!doc.getElementById('go').disabled && gameDocument()?.URL===expectedGameUrl && gameDocument()?.querySelector('.eyebrow')?.textContent.match(/v\d+\.\d+/)?.[0]===version,15000,'Original game or visible version did not match');
    doc.querySelector('.layout').scrollIntoView({block:'start'});
    preparedIdentity={candidateUrl:expected,gameUrl:expectedGameUrl,visibleVersion:version};
    return geometry();
  }
  async function browserInfo() {
    let full = null;
    try { full = await navigator.userAgentData?.getHighEntropyValues(['fullVersionList']); } catch {}
    const entry=full?.fullVersionList?.find(x=>/Chromium|Chrome/.test(x.brand));
    return {name:entry?.brand || 'Chromium',version:entry?.version || /(?:Chrome|Chromium)\/([\d.]+)/.exec(navigator.userAgent)?.[1] || 'unknown',userAgent:navigator.userAgent};
  }
  async function makeContract(candidate, dimensions) {
    return {schemaVersion:1,origin:location.origin,protocolId:manifest.protocol.id,runnerSha256:manifest.runnerSha256,candidate,
      candidateSha256:manifest.candidates[candidate].sha256,versions:manifest.versions,
      browser:await browserInfo(),viewport:{width:innerWidth,height:innerHeight},deviceScaleFactor:devicePixelRatio,
      dimensions,node:manifest.node,platform:manifest.platform,seed:'uncontrolled',nativeResponsive:true};
  }
  function same(a,b) { return JSON.stringify(a)===JSON.stringify(b); }
  function displayResults() {
    $('report').textContent=JSON.stringify({batchId,current:current&&{id:current.id,version:current.version},results,lastExploration},null,2);
  }
  async function one(item,phase,contract) {
    current={...item,startedAt:null,lastSample:0,tail:[],tailBytes:0,tailTrimmed:0,events:[],decisionCount:0,maxDecisionAge:0,maxTickTotal:0,overruns:0};
    let nativeStarted=false, stopVerified=false, result={outcome:'setup-abort',seconds:null}, error=null, identity=null;
    const emptyEvidence=()=>({resultVisible:false,endingVisible:false,title:'',description:'',remaining:'',size:null,documentIdentity:null});
    let lastEvidence=emptyEvidence();
    const context={id:item.id,version:item.version};
    // The attempt is retained even if setup subsequently fails.
    await append({type:'start',...context});
    try {
      const dimensions=await prepare(contract.candidate,item.version);
      identity={...preparedIdentity};
      if (requestedStop || ioError) throw Error('Stopped during preparation; no native game started');
      if (!same(dimensions,contract.dimensions)) throw Error('Viewport/DPR/canvas dimensions changed from frozen contract');
      if (document.visibilityState!=='visible' || candidateDocument().visibilityState!=='visible') throw Error('Test page is not visible');
      const win=frame.contentWindow, doc=candidateDocument();
      win.ocrLabEvent = event => { try {if(!current)return;const safe={...plainObject(event,['type','elapsedCompute','decisionAgeMs','tickTotalMs','streak','action','discarded','keysReleased','retryDelayMs','priorStreak','freshDecisionApplied']),phaseMs:plainObject(event.phaseMs,['setup','readImage','planner','recordRender'])};current.events.push(safe);if(event.type==='compute_overrun'){current.overruns++;current.maxDecisionAge=Math.max(current.maxDecisionAge,Number(event.decisionAgeMs)||0);}append({type:'event',...context,event:safe}).catch(()=>{});}catch(error){requestedStop=true;status('診斷記錄失敗：'+error.message);} };
      win.ocrTestRecord = record => {
        try {
        if (!current) return;
        const snap=controllerSnapshot(record);latest=snap;
        current.decisionCount++;current.maxDecisionAge=Math.max(current.maxDecisionAge,snap.decisionAgeMs||0);current.maxTickTotal=Math.max(current.maxTickTotal,snap.tickTotalMs||0);
        const snapshotBytes=new TextEncoder().encode(JSON.stringify(snap)).byteLength;
        current.tail.push({snapshot:snap,bytes:snapshotBytes});current.tailBytes+=snapshotBytes;
        while(current.tail.length>31 || current.tailBytes>400000){const removed=current.tail.shift();current.tailBytes-=removed.bytes;current.tailTrimmed++;}
        const now=performance.now();
        if (now-current.lastSample>=1000) {current.lastSample=now;append({type:'sample',...context,snapshot:snap}).catch(()=>{});}
        } catch(error) {requestedStop=true;status('診斷記錄失敗：'+error.message);}
      };
      if (requestedStop || ioError) throw Error('Stopped before native start');
      doc.getElementById('go').click();
      await until(()=>gameDocument().querySelector('#overlay.hidden') && win.ocrLabStatus?.().active===true,5000,'Native game did not begin');
      nativeStarted=true;current.startedAt=performance.now();
      await append({type:'event',...context,event:{type:'native-started',evidence:evidence(),dimensions}});
      let endingSince=null;
      while(true) {
        lastEvidence=evidence();
        if(!same(lastEvidence.documentIdentity,identity))throw Error('Result document identity differs from this attempt');
        const outcome=classify(lastEvidence);
        if(outcome){result=outcome;break;}
        if(lastEvidence.endingVisible){endingSince??=performance.now();if(performance.now()-endingSince>5000){result={outcome:'unknown-evidence',seconds:null};break;}}
        const elapsed=performance.now()-current.startedAt;
        if(requestedStop||ioError){result={outcome:ioError?'runner-abort':'manual-abort',seconds:null};break;}
        if(document.visibilityState!=='visible'){result={outcome:'background-abort',seconds:null};break;}
        if(innerWidth!==contract.viewport.width||innerHeight!==contract.viewport.height||devicePixelRatio!==contract.deviceScaleFactor){result={outcome:'environment-abort',seconds:null};break;}
        if(elapsed>manifest.protocol.wallTimeLimitSeconds*1000){result={outcome:'wall-time-abort',seconds:null};break;}
        if(phase==='diagnostic'&&elapsed>=manifest.protocol.diagnosticStopWallSeconds*1000&&!lastEvidence.endingVisible){result={outcome:'manual-abort',seconds:null};break;}
        if(!win.ocrLabStatus?.().active&&!lastEvidence.endingVisible){result={outcome:'controller-abort',seconds:null};break;}
        status(`${contract.candidate} · ${item.version} · ${item.id.split('/').at(-1)} · ${lastEvidence.remaining} · 體型 ${lastEvidence.size} · 已完成 ${results.length} 局`);
        heartbeat=Date.now();
        await pause(100);
      }
    } catch (e) {error={name:e.name,message:bounded(e.message,400)};result={outcome:nativeStarted?'runner-abort':'setup-abort',seconds:null};lastEvidence=nativeStarted&&identity?evidence():emptyEvidence();}
    finally {
      try {candidateDocument()?.getElementById('stop')?.click();const stopped=frame.contentWindow.ocrLabStatus?.();stopVerified=!!stopped&&!stopped.active&&Array.isArray(stopped.held)&&stopped.held.length===0;}catch{}
      const row={type:'result',...context,...result,nativeStarted,stopVerified,evidence:lastEvidence,expectedDocumentIdentity:identity,error,
        wallMs:current.startedAt===null?null:Math.round(performance.now()-current.startedAt),
        diagnosticStop:phase==='diagnostic'&&result.outcome==='manual-abort',
        controller:{decisions:current.decisionCount,maxDecisionAgeMs:current.maxDecisionAge,maxTickTotalMs:current.maxTickTotal,overruns:current.overruns,events:current.events},traceTail:current.tail.map(entry=>entry.snapshot),traceTailTrimmed:current.tailTrimmed};
      await append(row);results.push({...context,...result,nativeStarted,stopVerified,size:lastEvidence.size,maxDecisionAgeMs:current.maxDecisionAge});
      current=null;displayResults();
      if(!stopVerified||!nativeStarted)throw Error('Batch interrupted; original attempt retained; no replacement');
    }
  }
  async function run(phase) {
    if(active)return;
    active=true;requestedStop=false;ioError=null;results=[];sequence=0;queue=Promise.resolve();enabled(false);
    const candidate=$('candidateChoice').value;
    batchId=candidate+'-'+phase+'-'+new Date().toISOString().replace(/[^0-9]/g,'');
    let headerSaved=false;
    try {
      let setupLoadCount=0;
      if(phase==='diagnostic')for(let i=0;i<manifest.protocol.diagnosticPreparationLoads;i++){status(`載入切換檢查 ${i+1}/${manifest.protocol.diagnosticPreparationLoads}（不開局）`);await prepare(candidate,manifest.versions[i%manifest.versions.length].version);setupLoadCount++;}
      const dims=await prepare(candidate,'v2.13'),contract=await makeContract(candidate,dims);
      if(phase==='confirm'){
        if(!lastExploration||lastExploration.candidate!==candidate)throw Error('No eligible exploration');
        const prior=await(await fetch('/lab/ledger?batchId='+encodeURIComponent(lastExploration.batchId))).json();
        if(!same(prior[0].contract,contract))throw Error('Confirmation contract differs from exploration');
        const report=await(await fetch('/lab/status?batchId='+encodeURIComponent(lastExploration.batchId))).json();
        if(!report.eligibleForConfirm)throw Error('Exploration is not eligible');
      }
      const n=phase==='confirm'?12:phase==='explore'?4:1;
      const planned=[];for(let i=1;i<=n;i++)for(const v of manifest.versions)planned.push({id:batchId+'/'+v.version+'/'+i,version:v.version});
      await append({type:'batch',phase,contract,planned,setupLoadCount,priorExploration:phase==='confirm'?lastExploration.batchId:null});headerSaved=true;
      for(const item of planned){if(requestedStop)break;await one(item,phase,contract);}
      const saved=await append({type:'batch-end',reason:requestedStop?'manual-interruption':'planned-complete'});
      if(phase==='explore'&&saved.report?.eligibleForConfirm)lastExploration={batchId,candidate};
      status(`${candidate} ${phase} 已結束 · ${results.length}/${planned.length} 次嘗試 · ${saved.report?.meetsGoal?'本批兩版確認達到目標':saved.report?.eligibleForConfirm?'探索完整，可開始獨立確認':'結果已保留；尚未達到雙版確認目標'}`);
      $('report').textContent=JSON.stringify(saved.report,null,2);
    } catch(error){
      requestedStop=true;
      try{candidateDocument()?.getElementById('stop')?.click();}catch{}
      if(headerSaved&&!ioError)try{await append({type:'batch-end',reason:'interrupted',error:{name:error.name,message:bounded(error.message,400)}});}catch{}
      status('批次停止：'+error.message+'；原開局保留，不補局。');
    } finally {active=false;enabled(true);}
  }
  $('candidateChoice').addEventListener('change',async()=>{if(active)return;enabled(false);await prepare($('candidateChoice').value,'v2.13');status('原遊戲與候選已載入；尚未開局。');enabled(true);});
  $('diagnostic').onclick=()=>run('diagnostic');$('explore').onclick=()=>run('explore');$('confirm').onclick=()=>run('confirm');
  $('halt').onclick=()=>{requestedStop=true;candidateDocument()?.getElementById('stop')?.click();};
  $('details').onclick=()=>{$('report').style.display=$('report').style.display==='block'?'none':'block';};
  addEventListener('pagehide',()=>{requestedStop=true;candidateDocument()?.getElementById('stop')?.click();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){requestedStop=true;candidateDocument()?.getElementById('stop')?.click();}});
  window.growLocalStatus=()=>({active,batchId,current:current&&{id:current.id,version:current.version},results,heartbeat,ioError:ioError?.message||null,latest});
  (async()=>{try{manifest=await(await fetch('/lab/manifest')).json();await prepare($('candidateChoice').value,'v2.13');status('原遊戲同源載入完成；準備控制檢查。');enabled(true);}catch(error){status('啟動失敗：'+error.message);}})();
})();
