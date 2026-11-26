'use strict';
// Test actual harness helpers against numeric/DOM-shaped fixtures only.
// No browser, HTTP listener, game, or network request is started by this file.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
const protocol = JSON.parse(fs.readFileSync(path.join(__dirname, 'protocol.json'), 'utf8'));

function functionSource(name, sourceText=source) {
  const single = new RegExp('^  (?:async )?function ' + name + '\\([^\\n]*\\) \\{[^\\n]*\\}$', 'm').exec(sourceText);
  if (single) return single[0];
  const match = new RegExp('^  (?:async )?function ' + name + '\\([^\\n]*\\) \\{\\n[\\s\\S]*?^  \\}', 'm').exec(sourceText);
  assert(match, 'actual helper missing: ' + name);
  return match[0];
}

function constantSource(name) {
  const match = new RegExp('^  const ' + name + ' = [^\\n]+;$', 'm').exec(source);
  assert(match, 'actual constant helper missing: ' + name);
  return match[0];
}

function fixture(options = {}) {
  const state = {created: 0, replacements: 0, nativeClicks: 0, stopClicks: 0,
    scrolls: 0, appended: [], attempts: [], expectedVersion: 'v2.13',
    hud: options.hud ?? '199', overlayVisible: true, ending: false,
    title: '成功過關！', description: '遊玩時間 2:30', start: '再玩一次',
    active: !!options.priorActive, held: options.priorHeld || [], currentFrame: null,
    onAppend: options.onAppend || (() => {})};
  const origin = 'http://localhost:4173';
  const elements = {candidateChoice: {value: 'grow26'}, report: {textContent: ''}};
  const makeFrame = () => {
    const game = {
      URL: options.wrongGameUrl || origin + '/v2.13',
      defaultView: {getComputedStyle: () => ({display: 'block', visibility: 'visible', opacity: '1'})},
      getElementById(id) {
        if (id === 'overlay') return {ownerDocument: game, getClientRects: () => state.overlayVisible ? [{}] : []};
        const values = {size: state.hud, time: '02:30', start: state.start,
          title: state.title, description: state.description};
        return id in values ? {textContent: values[id]} : null;
      },
      querySelector(selector) {
        if (selector === '.eyebrow') return {textContent: 'SLIME ARENA · ' + (options.wrongVersion || state.expectedVersion)};
        if (selector === '#overlay.hidden') return !state.overlayVisible ? {} : null;
        if (selector === '#gameEnding.visible') return state.ending ? {} : null;
        if (selector === '#pauseScreen.open') return null;
        return null;
      }
    };
    const choice = {disabled: false, value: '/v2.13', options:[{value:'/v2.13'},{value:'/v2.22'}], onchange() {
      state.expectedVersion = this.value.slice(1);
      game.URL = options.wrongGameUrl || origin + this.value;
    }, dispatchEvent() {this.onchange();}};
    const go = {disabled: false, click() {state.nativeClicks++; state.active = true;if(options.nativeStart)state.overlayVisible=false;}};
    const stop = {click() {state.stopClicks++; state.active = false; state.held = [];}};
    const doc = {URL: options.wrongCandidateUrl || 'about:blank', visibilityState: 'visible', readyState:'complete',
      getElementById(id) {
        return {gameChoice: choice, go, stop, game: {contentDocument: game},
          status: {textContent: 'fixture only'}}[id] || null;
      },
      querySelector(selector) {return selector === '.layout' ? {scrollIntoView() {state.scrolls++;}} : null;}
    };
    const result = {id: 'candidate', title: 'fixture', contentDocument: doc,
      contentWindow: {ocrLabStatus: () => ({active: state.active, held: state.held})},
      replaceWith(fresh) {state.replacements++; state.currentFrame = fresh;},
      set src(value) {
        doc.URL = options.wrongCandidateUrl || value;
        state.expectedVersion = 'v2.13';
        game.URL = options.wrongGameUrl || origin + '/v2.13';
      }};
    return result;
  };
  state.currentFrame = makeFrame();
  const document = {visibilityState: 'visible',
    getElementById: id => elements[id] || null,
    createElement(tag) {assert.equal(tag, 'iframe'); state.created++; return makeFrame();}
  };
  const frame = state.currentFrame;
  const helperNames = ['visible','candidateDocument','gameDocument','evidence','classify',
    'plainObject','copyDiagnostic','controllerSnapshot','prepare','preparationObservation','same'];
  const definitions = [...['text','number','bounded'].map(constantSource),
    ...helperNames.map(name=>functionSource(name)), functionSource('one'), functionSource('run')].join('\n');
  const build = new Function('document','initialFrame','localStorage','location','until','geometry',
    'Event','manifest','fixtureState', `
      let frame=initialFrame, preparedIdentity=null, preparation=null;
      let active=false,requestedStop=false,ioError=null,current=null,latest=null;
      let batchId='fixture-batch',sequence=0,queue=Promise.resolve(),lastExploration=null,results=[],heartbeat=0;
      const $=id=>document.getElementById(id);
      const status=message=>{fixtureState.status=message;};
      const enabled=()=>{};
      const displayResults=()=>{};
      const append=async row=>{fixtureState.appended.push(JSON.parse(JSON.stringify(row)));fixtureState.onAppend(row,fixtureState);return {report:{}};};
      const makeContract=async(candidate,dimensions)=>({candidate,dimensions});
      ${definitions}
      const realOne=one;
      const runPreparationOnly=async()=>{
        one=async item=>{fixtureState.attempts.push({item,createdBeforeAttempt:fixtureState.created});};
        try{return await run('diagnostic');}finally{one=realOne;}
      };
      return {evidence,classify,controllerSnapshot,copyDiagnostic,prepare,realOne,runPreparationOnly,
        getIdentity:()=>preparedIdentity,getFrame:()=>frame};
    `);
  const localStorage = {length: 0, key: () => null, removeItem: () => {}};
  const until = async (test, limit, message) => {const value = test(); if (!value) throw Error(message); return value;};
  const api = build(document, frame, localStorage, {href: origin + '/', origin}, until,
    () => ({canvas:[958,557],dpr:1}), class Event {constructor(type) {this.type=type;}},
    {protocol, versions:[{version:'v2.13'},{version:'v2.22'}]}, state);
  return {state, api};
}

// The select exists before the bottom script runs. Execute the actual Grow26
// loadVersions/loadGrowGame/init code after prepare's first readiness check.
// Fetch and iframe loading are deterministic fixture promises, not real IO.
async function initializationRace(prepareSource) {
  const html=fs.readFileSync(path.join(__dirname,'../grow-26-public/ocr-grow26.html'),'utf8');
  assert(html.includes('<select id="gameChoice"></select>'),'candidate initial select is enabled and empty');
  const initSource=html.slice(html.indexOf("const gameChoice=$('gameChoice');"),html.lastIndexOf('})();</script>'))
    .replace(/loadVersions\(\);\s*$/,'return loadVersions();');
  const trace=[],origin='http://localhost:4173';
  let selected='',frame,readyState='loading',initialized=false;
  const choice={disabled:false,options:[],onchange:null,
    get value(){return selected;},
    set value(value){selected=this.options.some(o=>o.value===value)?value:'';trace.push({event:'select-set',requested:value,actual:selected,options:this.options.length});},
    replaceChildren(...options){this.options=options;selected=options[0]?.value||'';},
    dispatchEvent(){trace.push({event:'change',handlerReady:typeof this.onchange==='function',value:this.value});this.onchange?.();}};
  const ui={gameChoice:choice,go:{disabled:true},vision:{width:0}};
  const get=id=>ui[id]??=({textContent:''});
  const gameDoc={URL:'about:blank',querySelector(selector){
    if(selector==='.eyebrow')return {textContent:'SLIME ARENA · '+this.URL.split('/').at(-1)};
    if(selector==='canvas')return {};
    return null;
  }};
  const game={contentDocument:gameDoc,onload:null,set src(value){gameDoc.URL=origin+value;trace.push({event:'game-load',url:gameDoc.URL});this.onload?.();}};
  ui.game=game;
  const doc={URL:'about:blank',get readyState(){return readyState;},getElementById:get,
    querySelector:s=>s==='.layout'?{scrollIntoView(){}}:null};
  const makeFrame=()=>({id:'candidate',title:'candidate',contentDocument:doc,contentWindow:{},
    replaceWith(fresh){frame=fresh;},set src(value){doc.URL=value;}});
  frame=makeFrame();
  const document={createElement:()=>makeFrame()};
  const init=new Function('$','stop','game','window','Option','fetch','AbortSignal',
    'let loadGeneration=0,loadedVersion=null,previous=[],lastMap=null,imageState=null,velocity={},heading={},last=0,attempt=0,runCount=0;let active=false,held=new Set(),runGameVersion=null,runStrategy=null;'+initSource);
  const initialize=async()=>{
    if(initialized)return;
    initialized=true;trace.push({event:'bottom-script-begins'});
    await init(get,()=>{},game,frame.contentWindow,class Option{constructor(text,value){this.text=text;this.value=value;}},
      async()=>({ok:true,json:async()=>({currentVersion:'v2.22',currentPath:'/v2.22',versions:[
        {version:'v2.13',path:'/v2.13'},{version:'v2.22',path:'/v2.22'}]})}),AbortSignal);
    readyState='complete';trace.push({event:'init-complete',selected:choice.value,goDisabled:ui.go.disabled});
  };
  const until=async(test,limit,message)=>{
    const initialPass=!!test();trace.push({event:'wait',message,initialPass});
    if(initialPass)return true;
    await initialize();
    if(test())return true;
    throw Error(message);
  };
  const build=new Function('document','initialFrame','localStorage','location','until','geometry','Event',
    'let frame=initialFrame,preparedIdentity=null,preparation=null;function candidateDocument(){return frame.contentDocument;}function gameDocument(){return candidateDocument().getElementById("game").contentDocument;}'+
    prepareSource+';return {prepare,getIdentity:()=>preparedIdentity};');
  const api=build(document,frame,{length:0},{href:origin+'/'},until,()=>({canvas:[958,557]}),Event);
  let error=null;try{await api.prepare('grow26','v2.22');}catch(e){error=e.message;}
  return {error,gameUrl:gameDoc.URL,goDisabled:ui.go.disabled,identity:api.getIdentity(),trace};
}

async function main() {
  let assertions = 0;
  const equal = (a,b,message) => {assert.deepEqual(a,b,message);assertions++;};
  const ok = (a,message) => {assert(a,message);assertions++;};
  const reject = async (fn,pattern,message) => {await assert.rejects(fn,pattern,message);assertions++;};
  const valid = fixture();
  const oldFrame = valid.api.getFrame();
  await valid.api.prepare('grow26','v2.22');
  ok(valid.api.getFrame() !== oldFrame, 'prepare creates a fresh iframe object');
  equal(valid.state.replacements, 1, 'old iframe replaced exactly once');
  equal(valid.state.nativeClicks, 0, 'prepare never clicks native start');
  equal(valid.api.getIdentity().gameUrl, 'http://localhost:4173/v2.22', 'expected original game URL');
  equal(valid.api.getIdentity().visibleVersion, 'v2.22', 'exact displayed version');
  ok(valid.api.getIdentity().candidateUrl.startsWith('http://localhost:4173/candidate/grow26?load='), 'expected candidate URL');

  const wrongGame = fixture({wrongGameUrl:'http://localhost:4173/other-game'});
  await reject(() => wrongGame.api.prepare('grow26','v2.22'), /Original game or visible version/, 'reject correct version label at wrong URL');
  equal(wrongGame.api.getIdentity(), null, 'failed preparation never publishes identity');
  const wrongCandidate = fixture({wrongCandidateUrl:'http://localhost:4173/candidate/grow24'});
  await reject(() => wrongCandidate.api.prepare('grow26','v2.22'), /Fresh candidate controller/, 'reject stale candidate URL');
  const wrongVersion = fixture({wrongVersion:'v2.13'});
  await reject(() => wrongVersion.api.prepare('grow26','v2.22'), /Original game or visible version/, 'reject wrong version at expected URL');
  const held = fixture({priorHeld:['ArrowRight']});
  await reject(() => held.api.prepare('grow26','v2.13'), /not released control/, 'held keys block replacement');
  equal(held.state.replacements, 0, 'prior frame remains available for release');
  const running = fixture({priorActive:true});
  await reject(() => running.api.prepare('grow26','v2.13'), /not released control/, 'active prior controller blocks replacement');

  const stress = fixture();
  await stress.api.runPreparationOnly();
  equal(protocol.diagnosticPreparationLoads, 12, 'fixed stress load count');
  equal(stress.state.created, 13, 'actual run performs twelve stress loads plus contract preparation');
  equal(stress.state.nativeClicks, 0, 'all preparation loads avoid native start');
  equal(stress.state.attempts.map(x=>x.createdBeforeAttempt), [13,13], 'stress finishes before either diagnostic attempt');
  equal(stress.state.appended[0].setupLoadCount, 12, 'completed stress count stored in batch header');
  equal(stress.state.appended[0].planned.map(x=>x.version), ['v2.13','v2.22'], 'fixed diagnostic order');

  const setupFailure = fixture({wrongGameUrl:'http://localhost:4173/old-game',hud:'199'});
  await reject(() => setupFailure.api.realOne({id:'attempt-1',version:'v2.22'},'explore',
    {candidate:'grow26',dimensions:{canvas:[958,557],dpr:1}}), /Batch interrupted/, 'setup failure interrupts actual one()');
  const failed = setupFailure.state.appended.find(r=>r.type==='result');
  equal(failed.outcome, 'setup-abort', 'setup failure remains distinct');
  equal(failed.nativeStarted, false, 'no confirmed native start');
  equal(failed.evidence, {resultVisible:false,endingVisible:false,title:'',description:'',remaining:'',size:null,documentIdentity:null}, 'old HUD 199 and old result are not copied');
  equal(failed.expectedDocumentIdentity, null, 'failed preparation cannot masquerade as valid identity');
  equal(setupFailure.state.nativeClicks, 0, 'failed setup did not click start');

  const emptyHud = fixture({hud:''});
  equal(emptyHud.api.evidence().size, null, 'missing HUD is null instead of numeric zero');
  const whitespaceHud = fixture({hud:'  '});
  equal(whitespaceHud.api.evidence().size, null, 'blank HUD is null');
  const visibleResult = fixture({hud:'200'});
  equal(visibleResult.api.classify(visibleResult.api.evidence()), {outcome:'win',seconds:150}, 'visible 150-second win');
  visibleResult.state.overlayVisible=false;visibleResult.state.ending=true;
  equal(visibleResult.api.evidence().description, '', 'hidden ending description not recorded as visible');
  equal(visibleResult.api.classify(visibleResult.api.evidence()), null, 'ending animation alone is not a win');

  const fullInput = {hud:95,speed:300,velocity:{x:120,y:-20},heading:{x:1,y:0,escaping:true,
    target:{x:220,y:100,r:52,mapOnly:false,npc:true,upper:57}},
    objects:[{x:220,y:100,r:52,visualR:60,originalRadius:57,rUpper:65,rLower:49,
      labelSeen:true,geometryAccepted:1,localReliable:true,confidence:.91,npc:true,
      clipped:false,blocked:false,stalled:.1,dangerRadius:65,isRed:false,vx:12,vy:2}],
    map:{player:{x:72,y:49},width:144,height:99.69,observedAt:1234,viewWidth:958,viewHeight:557,
      visibleWalls:[null,null,430,null],growMarkers:[{x:90,y:50,area:7,red:false}],
      threats:[{x:40,y:20,area:12,weight:1.3}],opportunities:[{x:90,y:50,area:7}]},splitGuard:true};
  const fullOutput = {x:1,y:0,score:1.2,target:{...fullInput.objects[0],upper:65,lower:49,
    pairGrowthUpper:76,mapRed:false,edible:true,growth:5.2,food:false,eta:.8,utility:3.1,mapOnly:false},
    clearance:45,gain:5.2,first:0,second:1,spawnWallOK:true,spawnWallReserve:464};
  const snapshot = valid.api.controllerSnapshot({recordAt:1240,ms:1234,hud:95,hudTime:'03:00',
    decisionAgeMs:6,tickTotalMs:7,phaseMs:{setup:.1,readImage:4,planner:1,recordRender:.2},
    planInput:fullInput,planOutput:fullOutput});
  equal(snapshot.planInput, fullInput, 'all planner input fields preserved');
  equal(snapshot.planOutput, fullOutput, 'all planner output fields preserved');
  equal(snapshot.diagnosticTruncated, false, 'ordinary complete diagnostic not falsely marked truncated');
  equal(snapshot.decisionStartedAt, 1234, 'child decision timestamp retained for replay time base');
  const many = {...fullInput,objects:Array.from({length:121},()=>fullInput.objects[0])};
  const cut = valid.api.controllerSnapshot({planInput:many,planOutput:{}});
  equal(cut.planInput.objects.length, 120, 'bounded array length');
  equal(cut.diagnosticTruncated, true, 'dropped object explicitly flags truncation');
  const stringCut = valid.api.controllerSnapshot({planInput:fullInput,planOutput:{reason:'x'.repeat(401)}});
  equal([stringCut.planOutput.reason.length,stringCut.diagnosticTruncated], [400,true], 'string truncation flagged');
  let deep = {v:1};for(let i=0;i<12;i++)deep={child:deep};
  const deepCut=valid.api.controllerSnapshot({planInput:fullInput,planOutput:deep});
  equal(deepCut.diagnosticTruncated, true, 'depth truncation flagged');
  const wideCut=valid.api.controllerSnapshot({planInput:fullInput,planOutput:Object.fromEntries(Array.from({length:101},(_,i)=>['k'+i,i]))});
  equal([Object.keys(wideCut.planOutput).length,wideCut.diagnosticTruncated], [100,true], 'object key truncation flagged');
  assert.throws(()=>valid.api.controllerSnapshot({planInput:fullInput,planOutput:{target:{pixels:[1,2,3]}}}), /Prohibited diagnostic field/);assertions++;

  // Exercise the real one() recorder callback, including the byte-bound tail.
  const largeInput={...fullInput,objects:Array.from({length:120},()=>({...fullInput.objects[0],note:'界'.repeat(400)}))};
  const tailFixture=fixture({nativeStart:true,hud:'200',onAppend(row,state){
    if(row.type!=='event'||row.event.type!=='native-started')return;
    for(let i=0;i<9;i++)state.currentFrame.contentWindow.ocrTestRecord({recordAt:i,ms:i,
      hud:200,hudTime:'02:30',planInput:largeInput,planOutput:fullOutput});
    state.overlayVisible=true;
  }});
  await tailFixture.api.realOne({id:'tail-attempt',version:'v2.13'},'diagnostic',
    {candidate:'grow26',dimensions:{canvas:[958,557],dpr:1}});
  const tailResult=tailFixture.state.appended.find(r=>r.type==='result');
  const tailBytes=tailResult.traceTail.reduce((sum,s)=>sum+Buffer.byteLength(JSON.stringify(s),'utf8'),0);
  const tailSnapshotBytes=Buffer.byteLength(JSON.stringify(tailResult.traceTail.at(-1)),'utf8');
  equal(tailResult.nativeStarted,true,'synthetic native-start boundary reached before recorder fixture');
  ok(tailResult.traceTail.length>0&&tailResult.traceTail.length<9,'byte limit trims real callback tail');
  ok(tailBytes<=400000&&tailBytes+tailSnapshotBytes>400000,'maximal retained tail respects UTF8 byte limit');
  equal(tailResult.traceTailTrimmed,9-tailResult.traceTail.length,'all omitted tail snapshots explicitly counted');
  equal(tailResult.traceTail.at(-1).recordAt,8,'newest tail snapshot retained');
  ok(tailResult.traceTail.every(s=>s.diagnosticTruncated===false),'tail eviction does not falsely claim per-snapshot truncation');
  ok(Buffer.byteLength(JSON.stringify(tailResult),'utf8')<700000,'fixture result fits server body limit');

  const drift=fixture({nativeStart:true,hud:'200',onAppend(row,state){
    if(row.type!=='event'||row.event.type!=='native-started')return;
    state.currentFrame.contentDocument.getElementById('game').contentDocument.URL='http://localhost:4173/other-game';
    state.overlayVisible=true;
  }});
  await drift.api.realOne({id:'drift-attempt',version:'v2.13'},'explore',
    {candidate:'grow26',dimensions:{canvas:[958,557],dpr:1}});
  const driftResult=drift.state.appended.find(r=>r.type==='result');
  equal(driftResult.outcome,'runner-abort','visible success from a changed game URL cannot become a win');
  equal(driftResult.expectedDocumentIdentity.gameUrl,'http://localhost:4173/v2.13','prepared original identity preserved after drift');
  equal(driftResult.evidence.documentIdentity.gameUrl,'http://localhost:4173/other-game','mismatching diagnostic identity remains explicit');
  ok(/Result document identity differs/.test(driftResult.error.message),'identity drift is diagnosed before visible result classification');

  const priorSource=fs.readFileSync(path.join(__dirname,'../grow-local-r2-20261126/harness.js'),'utf8');
  const oldRace=await initializationRace(functionSource('prepare',priorSource));
  equal(oldRace.trace[0].initialPass,true,'r2 mistakenly accepts the enabled empty parser-stage select');
  equal(oldRace.trace.find(e=>e.event==='select-set'&&e.requested==='/v2.22').actual,'','selecting an absent option leaves HTMLSelectElement value empty');
  equal(oldRace.trace.find(e=>e.event==='change').handlerReady,false,'r2 selection occurs before change handler installation');
  equal(oldRace.error,'Original game or visible version did not match','delayed actual initialization reproduces r2 observed failure');
  equal(oldRace.gameUrl,'http://localhost:4173/v2.13','actual loadVersions resets the original default version');
  equal(oldRace.goDisabled,false,'default game is ready despite failed target selection');
  equal(oldRace.identity,null,'r2 failure still cannot publish valid identity');
  const fixedRace=await initializationRace(functionSource('prepare'));
  equal(fixedRace.trace[0].initialPass,false,'r3 waits for actual initialization signals');
  equal(fixedRace.error,null,'r3 survives the identical delayed script schedule');
  equal(fixedRace.gameUrl,'http://localhost:4173/v2.22','r3 selects target after default load completes');
  equal(fixedRace.identity.visibleVersion,'v2.22','r3 publishes the correct prepared version');
  equal(fixedRace.trace.find(e=>e.event==='change').handlerReady,true,'target change uses the installed handler');
  ok(fixedRace.trace.findIndex(e=>e.event==='select-set'&&e.requested==='/v2.22')>
    fixedRace.trace.findIndex(e=>e.event==='init-complete'),'target selection follows completed asynchronous initialization');

  console.log(JSON.stringify({kind:'synthetic harness helpers with DOM-shaped fixtures',assertions,
    browserRuns:0,naturalStarts:0,harnessSha256:crypto.createHash('sha256').update(source).digest('hex'),
    verified:['fresh iframe','exact candidate and game URL/version','prior release guard',
      '12 preparation loads before diagnostic attempts','setup-abort empty evidence',
      'visible result boundary','full numeric fields','explicit truncation and pixel rejection',
      'real recorder callback UTF8 tail bound','native-start identity drift rejects visible win',
      'actual async candidate initialization race: r2 fails, r3 waits and selects v2.22']},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
