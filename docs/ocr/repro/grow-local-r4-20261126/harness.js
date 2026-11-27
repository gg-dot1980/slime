'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let frame = $('candidate'), preparedIdentity = null, preparation = null;
  const controls = ['candidateChoice','preflight','diagnostic','explore','confirm'];
  const navigation=window.GrowNavigation;let loadSequence=0,preflightLoads=[];
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
  async function loadProof(load) {
    const response=await fetch('/lab/load-proof?load='+load,{cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!response.ok)throw Error('Navigation diagnostic HTTP '+response.status);
    return response.json();
  }
  async function prepare(candidate, version) {
    for (let i=localStorage.length-1;i>=0;i--) {const key=localStorage.key(i);if(/^slime/i.test(key))localStorage.removeItem(key);}
    preparedIdentity=null;
    const old=frame,priorStatus=old.contentWindow?.ocrLabStatus?.();
    if(priorStatus&&(priorStatus.active||priorStatus.held?.length))throw Error('Prior candidate has not released control');
    const load=String(Date.now())+String(++loadSequence).padStart(4,'0');
    const expected=new URL('/candidate/'+candidate+'?load='+load,location.href).href;
    const identity={instanceId:manifest.instanceId,sha256:manifest.candidates[candidate].sha256,candidate,load};
    preparation={candidate,expectedVersion:version,expectedCandidateUrl:expected,load,stage:'http-source-preflight',events:[]};
    try {
      preparation.sourceProbe=await navigation.probe(expected,identity);
      if(requestedStop)throw Error('Stopped during source preflight; no navigation or native start');
      const stopped=old.contentWindow?.ocrLabStatus?.();
      if(stopped&&(stopped.active||stopped.held?.length))throw Error('Prior candidate became active during preflight');
      preparation.stage='navigation-commit';
      const readyDeadline=performance.now()+15000;preparation.navigationReadyBudgetMs=15000;
      navigation.attach({document,old,expected,setFrame:fresh=>{frame=fresh;},record:preparation});
      await until(()=>navigation.committed(frame,expected,preparation.events),Math.max(0,readyDeadline-performance.now()),'Candidate navigation did not commit; one load retained, no retry');
      preparation.stage='initial-controller-ready';
      await until(()=>{const d=candidateDocument(),c=d?.getElementById('gameChoice');return d?.URL===expected&&c&&!c.disabled&&typeof c.onchange==='function'&&typeof frame.contentWindow.ocrLabStatus==='function'&&d.getElementById('go')?.disabled===false&&Array.from(c.options).some(o=>o.value==='/'+version);},Math.max(0,readyDeadline-performance.now()),'Fresh candidate controller/target option did not become ready');
      const doc=candidateDocument(),choice=doc.getElementById('gameChoice'),expectedGameUrl=new URL('/'+version,location.href).href;
      preparation.stage='target-game-ready';
      if(choice.value!=='/'+version){choice.value='/'+version;choice.dispatchEvent(new Event('change',{bubbles:true}));}
      await until(()=>!doc.getElementById('go').disabled&&gameDocument()?.URL===expectedGameUrl&&gameDocument()?.querySelector('.eyebrow')?.textContent.match(/v\d+\.\d+/)?.[0]===version,15000,'Original game or visible version did not match');
      const controller=frame.contentWindow.ocrLabStatus();
      if(controller.active||controller.held?.length)throw Error('New candidate became active before authorized start');
      preparation.stage='navigation-http-proof';
      const proof=await loadProof(load);preparation.http={...proof,events:proof.events.filter(e=>e.path==='/candidate/'+candidate)};
      preparation.verifiedNavigation=navigation.verifyNavigation(proof,identity);
      doc.querySelector('.layout').scrollIntoView({block:'start'});
      const dimensions=geometry();preparation.minimapGeometry=navigation.verifyGeometry(candidate,dimensions,manifest.candidates[candidate].geometry);
      preparedIdentity={candidateUrl:expected,gameUrl:expectedGameUrl,visibleVersion:version};
      preparation.stage='ready';
      return dimensions;
    } catch(error) {
      preparation.failureCode=error.code||null;
      if(!preparation.http)try{const proof=await loadProof(load);preparation.http={...proof,events:proof.events.filter(e=>e.path==='/candidate/'+candidate)};}catch(diagnosticError){preparation.httpDiagnosticError=bounded(diagnosticError.message,300);}
      throw error;
    }
  }
  function preparationObservation() {
    try {
      const doc=candidateDocument(),choice=doc?.getElementById('gameChoice'),game=gameDocument();
      return {...preparation,candidateUrl:doc?.URL||null,readyState:doc?.readyState||null,
        choiceValue:choice?.value||null,choiceDisabled:choice?.disabled??null,
        options:Array.from(choice?.options||[]).map(o=>o.value).slice(0,12),
        changeHandlerReady:typeof choice?.onchange==='function',controllerReady:typeof frame.contentWindow?.ocrLabStatus==='function',
        goDisabled:doc?.getElementById('go')?.disabled??null,gameUrl:game?.URL||null,
        visibleVersion:game?.querySelector('.eyebrow')?.textContent.match(/v\d+\.\d+/)?.[0]||null};
    } catch(error) {return {...preparation,inspectionError:bounded(error.message,400)};}
  }
  async function browserInfo() {
    let full = null;
    try { full = await navigator.userAgentData?.getHighEntropyValues(['fullVersionList']); } catch {}
    const entry=full?.fullVersionList?.find(x=>/Chromium|Chrome/.test(x.brand));
    return {name:entry?.brand || 'Chromium',version:entry?.version || /(?:Chrome|Chromium)\/([\d.]+)/.exec(navigator.userAgent)?.[1] || 'unknown',userAgent:navigator.userAgent};
  }
  async function makeContract(candidate, dimensions) {
    return {schemaVersion:1,origin:location.origin,protocolId:manifest.protocol.id,runnerSha256:manifest.runnerSha256,serverInstanceId:manifest.instanceId,candidate,
      candidateGeometry:manifest.candidates[candidate].geometry,candidateSha256:manifest.candidates[candidate].sha256,versions:manifest.versions,
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
        if (now-current.lastSample>=1000) {current.lastSample=now;append({type:'sample',...context,snapshot:snap,visibleIntake:current.intake?.drain()??null}).catch(()=>{});}
        } catch(error) {requestedStop=true;status('診斷記錄失敗：'+error.message);}
      };
      await append({type:'event',...context,event:{type:'preparation-ready',preparation:preparationObservation(),dimensions}});
      if (requestedStop || ioError) throw Error('Stopped before native start');
      current.intake=window.GrowVisibleIntake.observe(gameDocument(),visible);
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
    } catch (e) {error={name:e.name,message:bounded(e.message,400),preparation:preparationObservation()};result={outcome:nativeStarted?'runner-abort':'setup-abort',seconds:null};lastEvidence=nativeStarted&&identity?evidence():emptyEvidence();}
    finally {
      current.intake?.stop();
      try {candidateDocument()?.getElementById('stop')?.click();const stopped=frame.contentWindow.ocrLabStatus?.();stopVerified=!!stopped&&!stopped.active&&Array.isArray(stopped.held)&&stopped.held.length===0;}catch{}
      const row={type:'result',...context,...result,visibleIntake:current.intake?.drain()??null,nativeStarted,stopVerified,evidence:lastEvidence,expectedDocumentIdentity:identity,error,
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
    active=true;requestedStop=false;ioError=null;results=[];sequence=0;queue=Promise.resolve();preflightLoads=[];enabled(false);
    const candidate=$('candidateChoice').value;
    batchId=candidate+'-'+phase+'-'+new Date().toISOString().replace(/[^0-9]/g,'');
    let headerSaved=false;
    try {
      let setupLoadCount=0;
      for(let i=0;i<manifest.protocol.preflightPreparationLoads;i++){status(`載入預檢 ${i+1}/${manifest.protocol.preflightPreparationLoads}（不開局）`);await prepare(candidate,manifest.versions[i%manifest.versions.length].version);setupLoadCount++;preflightLoads.push({load:preparation.load,version:preparation.expectedVersion,navigation:preparation.verifiedNavigation,geometry:preparation.minimapGeometry});}
      const dims=await prepare(candidate,'v2.13'),contract=await makeContract(candidate,dims);
      const preflightRecord={batchId:batchId+'-preflight',phase,candidate,serverInstanceId:manifest.instanceId,runnerSha256:manifest.runnerSha256,type:'preflight-complete',starts:0,nativeStarts:0,at:new Date().toISOString(),setupLoadCount,loads:preflightLoads,contract};
      const preflightResponse=await fetch('/lab/preflight',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(preflightRecord),signal:AbortSignal.timeout(6000)});
      if(!preflightResponse.ok)throw Error('Successful preflight evidence could not be saved');
      if(phase==='preflight'){status('12次交錯＋1次契約載入完成；沒有建立batch/start，沒有自然開局。');$('report').textContent=JSON.stringify(preflightRecord,null,2);return;}
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
      const preparationFailure=preparationObservation();
      if(!headerSaved && manifest)try{const response=await fetch('/lab/preflight',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({batchId,phase,candidate,serverInstanceId:manifest.instanceId,runnerSha256:manifest.runnerSha256,type:'preflight-abort',starts:0,nativeStarts:0,at:new Date().toISOString(),error:{name:error.name,message:bounded(error.message,400)},preparation:preparationFailure}),signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error('Preflight save rejected');}catch(saveError){ioError=saveError;}
      try{candidateDocument()?.getElementById('stop')?.click();}catch{}
      if(headerSaved&&!ioError)try{await append({type:'batch-end',reason:'interrupted',error:{name:error.name,message:bounded(error.message,400)}});}catch{}
      status('批次停止：'+error.message+(headerSaved?'；原開局保留，不補局。':'；準備檢查失敗，尚未開局。')+(ioError?' 異常紀錄保存失敗：'+ioError.message:''));
      $('report').textContent=JSON.stringify({batchId,headerSaved,preparation:preparationFailure,error:error.message},null,2);
    } finally {active=false;enabled(true);}
  }
  $('candidateChoice').addEventListener('change',()=>{if(active)return;requestedStop=false;enabled(true);status('候選已選；請先執行不開局載入預檢。');});
  $('preflight').onclick=()=>run('preflight');
  $('diagnostic').onclick=()=>run('diagnostic');$('explore').onclick=()=>run('explore');$('confirm').onclick=()=>run('confirm');
  $('halt').onclick=()=>{requestedStop=true;current?.intake?.stop();candidateDocument()?.getElementById('stop')?.click();};
  $('details').onclick=()=>{$('report').style.display=$('report').style.display==='block'?'none':'block';};
  addEventListener('pagehide',()=>{requestedStop=true;current?.intake?.stop();candidateDocument()?.getElementById('stop')?.click();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){requestedStop=true;current?.intake?.stop();candidateDocument()?.getElementById('stop')?.click();}});
  window.growLocalStatus=()=>({active,batchId,current:current&&{id:current.id,version:current.version},results,heartbeat,ioError:ioError?.message||null,latest});
  (async()=>{
    try{
      const response=await fetch('/lab/manifest',{cache:'no-store',signal:AbortSignal.timeout(6000)});
      if(!response.ok)throw Error('Runner manifest HTTP '+response.status);
      manifest=await response.json();
      if(!navigation||!window.GrowVisibleIntake||manifest.protocol?.id!=='grow-native-local-20261126-v4'||response.headers.get('x-ocr-instance')!==manifest.instanceId)
        throw Error('Runner manifest identity mismatch');
      const ids=Object.keys(manifest.candidates).sort((a,b)=>Number(a.slice(4))-Number(b.slice(4)));
      if(!ids.length||ids.some(id=>!/^grow[1-9][0-9]*$/.test(id)||!/^[0-9a-f]{64}$/.test(manifest.candidates[id].sha256)))throw Error('Invalid candidate registry');
      const choices=$('candidateChoice');
      for(const id of ids){
        const {label,geometry}=manifest.candidates[id];
        const title=['Grow'+id.slice(4),label,geometry].filter(Boolean).join(' · ');
        choices.add(new Option(title,id));
      }
      choices.value=ids.at(-1);
      status('來源已載入，請先執行不開局預檢。');enabled(true);
    }catch(error){status('啟動失敗：'+error.message);}
  })();
})();
