// Independent bounded synthetic checks. No browser, game, server or network starts.
// Functions are extracted verbatim from the current harness/server; fixtures are
// fabricated visible HUD records and transport acknowledgements, not game replay.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const harness = await fs.readFile(dir + 'harness.js', 'utf8');
const server = await fs.readFile(dir + 'server.mjs', 'utf8');
const manifest = JSON.parse(await fs.readFile(dir + 'manifest.json', 'utf8'));
const sha = s => createHash('sha256').update(s).digest('hex');
const clone = o => JSON.parse(JSON.stringify(o));
function between(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'Extraction markers must match real source');
  assert.equal(source.indexOf(start, a + 1), -1, 'Function marker must be unique');
  return source.slice(a, b).trim();
}
const extracted = {
  save: between(harness, ' async function save(data){', ' function checkVisibleStop(){'),
  checkVisibleStop: between(harness, ' function checkVisibleStop(){', ' function display(){'),
  display: between(harness, ' function display(){', ' function screenReady(rows){'),
  screenReady: between(harness, ' function screenReady(rows){', ' window.ocrLabEvent='),
  slot: between(harness, ' async function slot(batch,slot,index){', ' async function run(mode){'),
  run: between(harness, ' async function run(mode){', " $('lab-screen').onclick=")
};
const blank = () => ({ending:false, settled:false, title:'', description:'',
  hudSize:80, hudTime:'04:55', eaten:12, elapsedVisible:5});
const settlement = (kind, seconds, hud=180) => ({...blank(), settled:true,
  title:kind==='win'?'You win!':'You were eaten!',
  description:(kind==='win'?'You reached size 200 and survived!':'A bigger slime swallowed you.') +
    (seconds===null?'':`Play time ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')} · Eaten 12Best eaten: 12.`),
  hudSize:hud, elapsedVisible:seconds===null?151:seconds+1});

function harnessFixture(options={}) {
  const state={now:0, visible:blank(), afterGo:options.afterGo??settlement('win',150),
    active:true, held:['ArrowRight',' '], stops:0, starts:0, requests:[], persisted:[],
    elements:new Map(), timers:new Map(), nextTimer:1, pendingFetch:null, faultUsed:false};
  function element(id) {
    if(!state.elements.has(id)) state.elements.set(id,{id, disabled:false, value:'',
      textContent:'synthetic status', style:{}, dispatchEvent(){}, click(){}});
    return state.elements.get(id);
  }
  element('stop').click=()=>{state.stops++;state.active=false;state.held=[];};
  element('go').click=()=>{state.starts++;state.active=true;state.held=['ArrowRight',' '];state.visible=clone(state.afterGo);};
  element('gameChoice').dispatchEvent=()=>{element('go').disabled=false;state.visible=blank();};
  const timer=(fn,delay,repeat)=>{const id=state.nextTimer++;state.timers.set(id,{fn,at:state.now+delay,delay,repeat});return id;};
  state.advance=ms=>{
    state.now+=ms;
    for(const [id,t] of [...state.timers]) if(t.at<=state.now){
      if(t.repeat)t.at=state.now+t.delay;else state.timers.delete(id);
      t.fn();
    }
  };
  const fetch=async(url,opts)=>{
    assert.equal(url,'/lab/event');const row=JSON.parse(opts.body);state.requests.push(row);
    const fault=!state.faultUsed && ((options.mode==='ack-loss-final'&&row.kind==='final') ||
      (options.mode==='hang-progress'&&row.kind==='progress'));
    if(fault){
      state.faultUsed=true;state.pendingFetch=row;
      if(options.mode==='ack-loss-final')state.persisted.push(row);
      return new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('synthetic acknowledgement timeout')),{once:true}));
    }
    state.persisted.push(row);return {ok:true,status:201};
  };
  const fixtureManifest=clone(manifest);
  if(options.oneSlot)fixtureManifest.screen.order=[fixtureManifest.screen.order[0]];
  let jump=false;
  const context=vm.createContext({fixtureManifest,AbortController,Date,Math,JSON,Set,Number,Error,
    Event:class {constructor(type){this.type=type;}},fetch,
    setTimeout:(fn,ms)=>timer(fn,ms,false),clearTimeout:id=>state.timers.delete(id),
    setInterval:(fn,ms)=>timer(fn,ms,true),clearInterval:id=>state.timers.delete(id),
    performance:{now:()=>state.now},element,copyVisible:()=>clone(state.visible),
    pauseHook:async ms=>{if(options.mode==='hang-progress'&&!jump){jump=true;state.advance(6000);}else state.advance(ms);},
    game:{contentDocument:{getElementById:id=>id==='overlay'?{classList:{contains:()=>true}}:{disabled:false}}},
    document:{createElement:()=>({style:{},textContent:''}),querySelector:()=>({appendChild:e=>state.elements.set(e.id,e)})},
    window:{ocrLabStatus:()=>({active:state.active,held:[...state.held]})}});
  vm.runInContext(`let manifest=fixtureManifest,busy=false,halted=false,current=null,events=[],runFinals=[];
    const pendingRecords=[],$=id=>element(id),readVisible=()=>copyVisible(),env=()=>({synthetic:true}),pause=ms=>pauseHook(ms);
    ${Object.values(extracted).join('\n')}
    globalThis.reviewApi={save,checkVisibleStop,screenReady,run,
      setCurrent:v=>current=v,setHalted:v=>halted=v,
      get:()=>({current,events,runFinals,pendingRecords,busy,halted})};`,context);
  state.api=context.reviewApi;return state;
}
const cases=[];
async function test(name,fn){try{cases.push({name,status:'pass',detail:await fn()});}
  catch(e){cases.push({name,status:'fail',error:e.message});}}
async function until(predicate){for(let i=0;i<1000;i++){if(predicate())return;await Promise.resolve();}throw Error('Bounded synthetic microtask budget exhausted');}
function stopCase(visible,{wall=150000,halted=false,active=true}={}){
  const f=harnessFixture();f.visible=clone(visible);f.now=wall;f.active=active;
  f.api.setCurrent({start:0});f.api.setHalted(halted);f.api.checkVisibleStop();return f;
}

await test('visible150_does_not_cut_off',()=>{const f=stopCase({...blank(),elapsedVisible:150});assert.equal(f.api.get().current.observedStop,undefined);assert.equal(f.stops,0);});
await test('visible151_stops_and_snapshot_cannot_be_overwritten',()=>{
  const f=stopCase({...blank(),elapsedVisible:151,hudSize:177});const first=JSON.stringify(f.api.get().current.observedStop);
  assert.equal(f.api.get().current.observedStop.outcome,'deadline_cutoff');assert.equal(f.stops,1);assert.equal(f.held.length,0);
  f.visible=settlement('win',149,200);f.api.checkVisibleStop();assert.equal(JSON.stringify(f.api.get().current.observedStop),first);assert.equal(f.stops,1);
});
await test('settlement150_wins_despite_stale_hud_and_elapsed151',()=>{const f=stopCase(settlement('win',150,181));assert.equal(f.api.get().current.observedStop.outcome,'win_le150');assert.equal(f.api.get().current.observedStop.final.hudSize,181);});
await test('settlement151_is_late_win',()=>{assert.equal(stopCase(settlement('win',151)).api.get().current.observedStop.outcome,'win_late');});
await test('win_without_visible_result_time_is_unknown',()=>{const s=stopCase(settlement('win',null)).api.get().current.observedStop;assert.equal(s.outcome,'unknown');assert.equal(s.final.resultSeconds,null);});
await test('visible_death_is_preserved',()=>{assert.equal(stopCase(settlement('death',92,110)).api.get().current.observedStop.outcome,'death');});
await test('manual_halt_stops_during_ending',()=>{const f=stopCase({...blank(),ending:true},{halted:true});assert.equal(f.api.get().current.observedStop.outcome,'controller_abort');assert.equal(f.held.length,0);});
await test('wall_limit_stops_during_ending',()=>{assert.equal(stopCase({...blank(),ending:true},{wall:300001}).api.get().current.observedStop.outcome,'infrastructure_error');});
await test('ending_waits_for_settlement_within_wall_limit',()=>{assert.equal(stopCase({...blank(),ending:true,elapsedVisible:151}).api.get().current.observedStop,undefined);});
await test('inactive_controller_is_abort',()=>{assert.equal(stopCase(blank(),{wall:2000,active:false}).api.get().current.observedStop.outcome,'controller_abort');});

const goodRows=manifest.screen.order.map((s,i)=>({...s,batch:manifest.screen.id,runId:`screen-07-${String(i+1).padStart(2,'0')}`,outcome:i<4?'win_le150':'deadline_cutoff'}));
await test('gate_exact_four_each_and_two_wins_each',()=>{assert.equal(harnessFixture().api.screenReady(goodRows),true);});
for(const [name,mutate] of [
  ['one_version_has_one_win',r=>{r[3].outcome='death';}],
  ['infrastructure_final_present',r=>{r[6].outcome='infrastructure_error';}],
  ['unknown_final_present',r=>{r[6].outcome='unknown';}],
  ['duplicate_run_identity',r=>{r[6].runId=r[0].runId;}],
  ['wrong_strategy',r=>{r[6].strategy='grow-15';}],
  ['wrong_phase',r=>{r[6].batch=manifest.confirmation.id;}],
  ['late_win_not_success',r=>{r[3].outcome='win_late';}],
  ['partial_cohort',r=>r.pop()],
  ['extra_final',r=>r.push({...r[0],runId:'extra'})]
])await test('gate_rejects_'+name,()=>{const rows=clone(goodRows);mutate(rows);assert.equal(harnessFixture().api.screenReady(rows),false);});

await test('watchdog_runs_while_progress_write_is_pending',async()=>{
  const f=harnessFixture({oneSlot:true,mode:'hang-progress',afterGo:blank()});const running=f.api.run('screen');
  await until(()=>f.pendingFetch?.kind==='progress');
  f.visible={...blank(),elapsedVisible:151,hudSize:177};f.advance(100);
  assert.equal(f.api.get().current.observedStop.outcome,'deadline_cutoff');assert.equal(f.held.length,0);
  assert.equal(f.api.get().pendingRecords.length,0,'Watchdog must act before transport timeout');
  const snapshot=JSON.stringify(f.api.get().current.observedStop);f.advance(2500);await running;
  assert.equal(f.starts,1);assert.equal(f.persisted.filter(r=>r.kind==='final').length,1);
  const final=f.persisted.find(r=>r.kind==='final');assert.equal(final.outcome,'infrastructure_error');
  assert.equal(JSON.stringify(final.observedStop),snapshot);assert.equal(final.keysReleased,true);
  assert.equal(f.api.get().pendingRecords[0].kind,'progress');assert.ok(f.elements.get('lab-unsaved').textContent.includes('progress'));
  assert.equal([...f.timers.values()].filter(t=>t.repeat).length,0);
  return {watchdogOutcome:final.observedStop.outcome,transportClassification:final.outcome,syntheticStarts:f.starts,repeatedFinals:0};
});
await test('acknowledgement_lost_after_final_commit_never_creates_second_final',async()=>{
  const f=harnessFixture({oneSlot:true,mode:'ack-loss-final'});const running=f.api.run('screen');
  await until(()=>f.pendingFetch?.kind==='final');const original=JSON.stringify(f.pendingFetch);f.advance(2500);await running;
  const finals=f.persisted.filter(r=>r.kind==='final'),attempts=f.requests.filter(r=>r.kind==='final');
  assert.equal(finals.length,1);assert.equal(attempts.length,1);assert.equal(finals[0].outcome,'win_le150');
  assert.equal(JSON.stringify(finals[0]),original);assert.equal(JSON.stringify(f.api.get().pendingRecords[0]),original);
  const error=f.persisted.find(r=>r.kind==='batch_error');assert.equal(error.unconfirmedFinal,true);assert.equal(error.runId,finals[0].runId);
  assert.equal(f.held.length,0);assert.equal(f.starts,1);assert.equal([...f.timers.values()].filter(t=>t.repeat).length,0);
  return {finalPostAttempts:attempts.length,committedFinals:finals.length,originalOutcome:finals[0].outcome,batchErrorMarksUnconfirmedFinal:true};
});

// Execute the real request handler with fake appendFile/response objects; no socket.
const keyLine=server.split('\n').find(s=>s.startsWith('const uniqueKey='));assert.ok(keyLine);
const handlerSource=between(server,'http.createServer(',').listen(').slice('http.createServer('.length).trim();
function serverFixture(append,preload=[]){
  const context=vm.createContext({URL,JSON,Set,Error,preload,appendFile:append,
    readFile:async()=>{throw Error('Unexpected static read');}});
  vm.runInContext(`${keyLine}\nconst recorded=new Set(preload),dir='synthetic/',files={};globalThis.handler=${handlerSource};globalThis.keys=recorded;`,context);
  return {async request(row){const res={status:null,body:'',writeHead(s){this.status=s;},end(t){this.body=String(t??'');}};
    const req={url:'/lab/event',method:'POST',async *[Symbol.asyncIterator](){yield JSON.stringify(row);}};await context.handler(req,res);return res;},keys:context.keys};
}
await test('server_rejects_existing_final_without_rewrite',async()=>{let writes=0;const s=serverFixture(async()=>{writes++;},['final:test-01']);const r=await s.request({kind:'final',runId:'test-01'});assert.equal(r.status,409);assert.equal(writes,0);});
await test('server_reserves_identity_before_async_append',async()=>{
  let writes=0,release;const s=serverFixture(async()=>{writes++;await new Promise(r=>release=r);});
  const first=s.request({kind:'final',runId:'test-02'});await until(()=>release);const second=await s.request({kind:'final',runId:'test-02'});
  assert.equal(second.status,409);release();assert.equal((await first).status,201);assert.equal(writes,1);
});
await test('server_failed_append_releases_reservation',async()=>{let writes=0;const s=serverFixture(async()=>{if(++writes===1)throw Error('synthetic disk error');});
  assert.equal((await s.request({kind:'start',runId:'test-03'})).status,500);assert.equal(s.keys.has('start:test-03'),false);
  assert.equal((await s.request({kind:'start',runId:'test-03'})).status,201);});

const failures=cases.filter(t=>t.status==='fail');
const report={schemaVersion:1,recordType:'bounded_synthetic_harness_regression',createdAt:new Date().toISOString(),
  status:failures.length?'fail':'pass',protocolHash:manifest.protocolHash,
  sourceHashes:{harness:sha(harness),server:sha(server),planner:sha(await fs.readFile(dir+'planner.js')),page:sha(await fs.readFile(dir+'index.html'))},
  extractedFunctionHashes:Object.fromEntries(Object.entries(extracted).map(([k,v])=>[k,sha(v)])),
  method:'Verbatim function extraction into Node vm with synthetic visible HUD, DOM button stubs, controllable timer callbacks and fake HTTP acknowledgements. Real server request-handler extraction uses in-memory appendFile; no listening socket.',
  gameStarts:0,browserStarts:0,serverStarts:0,networkRequests:0,candidateFilesModified:false,
  limitations:['Synthetic cases establish only the asserted control/recording paths, not real browser timer scheduling, game success, pixel perception or crash durability.','An actual process/browser failure can still leave a started run without a native final; preserve denominator and reconcile raw plus pending records without replacement.'],
  caseCount:cases.length,passed:cases.length-failures.length,failed:failures.length,cases};
await fs.writeFile(dir+'harness-regression.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,caseCount:report.caseCount,passed:report.passed,failed:report.failed,protocolHash:report.protocolHash,failures},null,2));
process.exitCode=failures.length?1:0;
