'use strict';
// No HTTP listener, browser, original game execution, network or pixels.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),http=require('node:http'),{EventEmitter}=require('node:events');
const nav=require('./navigation.js'),{createJournal}=require('./load-journal.cjs');
const source=fs.readFileSync(path.join(__dirname,'harness.js'),'utf8');
const serverSource=fs.readFileSync(path.join(__dirname,'server.cjs'),'utf8');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
let checks=0;function ok(v,m){assert(v,m);checks++;}function eq(a,b,m){assert.deepEqual(a,b,m);checks++;}
async function rejects(fn,pattern){await assert.rejects(fn,pattern);checks++;}
function throws(fn,pattern){assert.throws(fn,pattern);checks++;}
function fn(name){const match=new RegExp('^  (?:async )?function '+name+'\\([^\\n]*\\) \\{\\n[\\s\\S]*?^  \\}','m').exec(source);assert(match,name);return match[0];}
function dom(mode='ready'){
  const order=[],record={},expected='http://localhost/candidate/grow27?load=12345678901234567';let frame;
  const document={createElement(){const listeners={};let src='';const fresh={id:'',title:'',isConnected:false,contentDocument:{URL:'about:blank',readyState:'complete'},
    addEventListener(type,callback){order.push('listen-'+type);listeners[type]=callback;},
    set src(value){order.push('src');src=value;},get src(){return src;},fire:type=>listeners[type]?.()};return fresh;}};
  const old={id:'candidate',title:'candidate',replaceWith(fresh){order.push('insert');fresh.isConnected=true;fresh.fire('load');if(mode==='ready'){fresh.contentDocument.URL=expected;fresh.fire('load');}if(mode==='error')fresh.fire('error');}};
  frame=nav.attach({document,old,expected,setFrame:f=>{frame=f;},record,now:()=>10});
  return {frame,expected,record,order};
}
async function main(){
  const scene=dom();eq(scene.order,['listen-load','listen-error','src','insert'],'listeners and src precede insertion');
  eq(scene.record.events.filter(e=>e.type==='load').map(e=>e.url),['about:blank',scene.expected]);
  ok(nav.committed(scene.frame,scene.expected,scene.record.events),'actual target load required');
  const blank=dom('blank');eq(nav.committed(blank.frame,blank.expected,blank.record.events),false,'initial about:blank load cannot pass');
  const errored=dom('error');throws(()=>nav.committed(errored.frame,errored.expected,errored.record.events),/error event/);
  scene.frame.contentDocument.URL='http://localhost/other';throws(()=>nav.committed(scene.frame,scene.expected,scene.record.events),/unexpected document/);
  const bytes=Buffer.from('<html>source fixture</html>'),expected={instanceId:'fixture-instance',sha256:hash(bytes)};let fetchCalls=0;
  const response=(body=bytes,headers={})=>new Response(body,{status:200,headers:{'Content-Type':'text/html','X-OCR-Instance':expected.instanceId,'X-OCR-SHA256':expected.sha256,...headers}});
  const probe=await nav.probe('http://localhost/candidate/grow27?load=12345678901234567',expected,async(url,opts)=>{fetchCalls++;ok(url.endsWith('&probe=1'));eq(opts.redirect,'error');return response();});
  eq(probe.sha256,expected.sha256);eq(fetchCalls,1,'exactly one source fetch');
  await rejects(()=>nav.probe('http://localhost/?load=12345678901234567',expected,async()=>response(bytes,{'X-OCR-Instance':'other'})),/different server instance/);
  await rejects(()=>nav.probe('http://localhost/?load=12345678901234567',expected,async()=>response(bytes,{'X-OCR-SHA256':'0'.repeat(64)})),/hash header/);
  await rejects(()=>nav.probe('http://localhost/?load=12345678901234567',expected,async()=>response('changed bytes')),/response bytes/);
  await rejects(()=>nav.probe('http://localhost/?load=12345678901234567',expected,async()=>new Response('failure',{status:503})),/HTTP 503/);
  let failedFetch=0;await rejects(()=>nav.probe('http://localhost/?load=12345678901234567',expected,async()=>{failedFetch++;throw Error('transport failed');}),/transport failed/);eq(failedFetch,1,'no source retry');

  // Actual Node ServerResponse catches writeHead-only/getHeader mismatch.
  const answerCode=/function answer\([^]*?\n\}/.exec(serverSource)[0];
  const answer=new Function('Buffer','hash','instanceId',answerCode+';return answer;')(Buffer,hash,expected.instanceId);
  const req={method:'GET',url:'/candidate/grow27?load=12345678901234567',headers:{'sec-fetch-dest':'iframe'}};
  const res=new http.ServerResponse(req),saved=[],journal=createJournal({instanceId:expected.instanceId,write:r=>saved.push(r),clock:()=> 'fixture-time'});
  const probeReq={method:'GET',url:req.url+'&probe=1',headers:{'sec-fetch-dest':'empty'}},probeRes=new http.ServerResponse(probeReq);
  journal.observe(probeReq,probeRes);answer(probeRes,200,bytes,'text/html');probeRes.emit('finish');
  journal.observe(req,res);answer(res,200,bytes,'text/html');
  eq(res.getHeader('x-ocr-sha256'),expected.sha256,'real ServerResponse retains provenance header');
  res.emit('finish');const proof=journal.snapshot('12345678901234567');
  const identity={...expected,candidate:'grow27',load:'12345678901234567'};
  eq(nav.verifyNavigation(proof,identity).status,200,'journal finish binds actual candidate source');
  const probeOnly={...proof,events:proof.events.map(e=>({...e,destination:'empty',probe:true}))};throws(()=>nav.verifyNavigation(probeOnly,identity),/lacks one matching/);
  throws(()=>nav.verifyNavigation({...proof,instanceId:'other'},identity),/different server instance/);
  throws(()=>nav.verifyNavigation({...proof,events:[...proof.events,...proof.events.filter(e=>e.type==='finish')]},identity),/lacks one matching/);
  throws(()=>nav.verifyNavigation({...proof,events:[...proof.events,{type:'close',path:'/candidate/grow27',load:identity.load,instanceId:identity.instanceId,destination:'iframe',probe:false,finished:false}]},identity),/closed before completion/);
  const bounded=createJournal({instanceId:'i',limit:2});for(let i=0;i<5;i++)bounded.lifecycle('fixture',{load:'1234567890123',i});eq(bounded.snapshot('1234567890123').events.map(e=>e.i),[3,4]);
  const geometry={canvas:[958,557],canvasCss:[958,557],deviceScaleFactor:1,gameDpr:1,gameTransform:'none',canvasTransform:'none'};
  eq(nav.verifyGeometry('grow27',geometry),{analysisRatio:1,origin:[799,70],fractionalOrigin:[0,0]});
  for(const changed of [{canvas:[1198,696],deviceScaleFactor:1.25,gameDpr:1.25},{canvasCss:[959,557]},{gameTransform:'matrix(1,0,0,1,0,0)'},{canvas:[958,558]}])throws(()=>nav.verifyGeometry('grow27',{...geometry,...changed}),/requires actual/);

  // Execute actual run()/one() control flow with synthetic preparation errors.
  function flow(failAt=Infinity){const state={prepares:0,appended:[],posts:[],clicks:0,status:''};
    const build=new Function('state','failAt',`let active=false,requestedStop=false,ioError=null,results=[],sequence=0,queue=Promise.resolve(),preflightLoads=[],batchId=null,current=null,latest=null,preparedIdentity=null,preparation=null,lastExploration=null;
      const manifest={instanceId:'fixture-instance',runnerSha256:'a'.repeat(64),protocol:{preflightPreparationLoads:12},versions:[{version:'v2.13'},{version:'v2.22'}]};
      const elements={candidateChoice:{value:'grow27'},report:{}};const $=id=>elements[id];const status=s=>{state.status=s;};const enabled=()=>{};const displayResults=()=>{};const bounded=(s,n=800)=>String(s||'').slice(0,n);
      const frame={contentWindow:{ocrLabStatus:()=>({active:false,held:[]})}};const candidateDocument=()=>({getElementById:()=>({click(){state.clicks++;}})});
      const prepare=async(candidate,version)=>{state.prepares++;preparation={load:String(state.prepares),expectedVersion:version,stage:'fixture',verifiedNavigation:{status:200},minimapGeometry:{origin:[799,70]}};if(state.prepares===failAt)throw Error('fixture about:blank did not commit');preparedIdentity={candidateUrl:'fixture',gameUrl:'fixture',visibleVersion:version};return {canvas:[958,557]};};
      const preparationObservation=()=>preparation;const makeContract=async(candidate,dimensions)=>({candidate,dimensions});
      const append=async row=>{state.appended.push(row);return {report:{}};};const fetch=async(url,opts)=>{state.posts.push({url,body:JSON.parse(opts.body),signal:opts.signal});return {ok:true};};
      ${fn('one')}
      ${fn('run')}
      return run;`);return {state,run:build(state,failAt)};}
  const complete=flow();await complete.run('preflight');eq(complete.state.prepares,13,'12 alternating preflight loads plus contract load');eq(complete.state.appended,[],'standalone preflight creates no batch/start/result');eq(complete.state.clicks,0,'preflight does not click native Start');eq(complete.state.posts[0].body.type,'preflight-complete');
  const preflightFail=flow(5);await preflightFail.run('preflight');eq(preflightFail.state.prepares,5,'preflight failure does not retry missing navigation');eq(preflightFail.state.appended,[]);eq(preflightFail.state.posts.at(-1).body.type,'preflight-abort');
  ok(preflightFail.state.posts.at(-1).signal instanceof AbortSignal,'failure-evidence save also has an abort deadline');
  const attemptFail=flow(14);await attemptFail.run('explore');eq(attemptFail.state.prepares,14,'no replacement after actual attempt setup fails');
  eq(attemptFail.state.appended.map(r=>r.type),['batch','start','result','batch-end']);eq(attemptFail.state.appended.find(r=>r.type==='result').outcome,'setup-abort');eq(attemptFail.state.appended.find(r=>r.type==='result').nativeStarted,false);
  eq(attemptFail.state.appended.find(r=>r.type==='result').evidence.size,null,'no previous HUD contamination');
  // Protocol-v4 preparation provenance is checked separately by check-ledger.
  console.log(JSON.stringify({kind:'focused nonbrowser transport/lifecycle/control-flow fixtures',assertions:checks,browserRuns:0,httpListeners:0,naturalStarts:0,
    harnessSha256:hash(source),navigationSha256:hash(fs.readFileSync(path.join(__dirname,'navigation.js'))),
    limitations:['The synthetic lifecycle schedule does not establish the historical browser root cause.','Source fetch and actual iframe navigation are deliberately separate and both required.','No live HTTP or browser verification has occurred.']},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
