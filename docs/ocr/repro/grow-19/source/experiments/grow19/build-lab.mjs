import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeGrowBundle} from './game-isolation.mjs';
const dir='experiments/grow19/';
const sha=s=>createHash('sha256').update(s).digest('hex');
const source=await readFile(dir+'source-base.html','utf8');
const planner=await readFile(dir+'planner.js','utf8');
const geometry=await readFile(dir+'geometry.js','utf8');
const harness=await readFile(dir+'harness.js','utf8');
const games={'v2.13':await readFile(dir+'game-v2.13.html','utf8'),'v2.22':await readFile(dir+'game-v2.22.html','utf8')};
const bundle=makeGrowBundle(games,'v2.22');
function replaceOnce(s,a,b){if(s.split(a).length!==2)throw Error('Source mismatch: '+a.slice(0,100));return s.replace(a,b);}
let page=source;
page=replaceOnce(page,'<title>OCR Grow · grow-12 小地圖導引／主畫面避障</title>','<title>OCR Grow 策略實測</title>');
page=replaceOnce(page,'<option value="grow-12">B · grow-12 成長優先</option value="baseline">A · 原規劃 test-026</option>','<option value="grow-12">A · grow-12 現行基線</option><option value="grow-19">B · grow-19 外徑不確定度</option>');
page=replaceOnce(page,'let lastVision=0;',geometry+'\n'+planner+'\nlet lastVision=0;');
page=replaceOnce(page,"Math.min(1,1200/source.width)","Math.min(1,(runStrategy==='grow-19'?2000:1200)/source.width)");
page=replaceOnce(page,"if(map&&runStrategy==='grow-12')map.growMarkers=growMarkers(image,w,h,map);","if(map&&(runStrategy==='grow-12'||runStrategy==='grow-19'))map.growMarkers=growMarkers(image,w,h,map);");
page=replaceOnce(page,
  'const x=(p.x-w/2)/ratio,y=(p.y-h/2)/ratio,visualR=p.r/ratio,labelSeen=hasSlimeLabel(image,w,h,p),npc=labelSeen||visualR>20,r=npc?highlightRadius(image,w,h,p)/ratio:visualR;let match=null,error=100;',
  "const visualR=p.r/ratio,labelSeen=hasSlimeLabel(image,w,h,p),npc=labelSeen||visualR>20,originalRadius=npc?highlightRadius(image,w,h,p)/ratio:visualR,geometry=runStrategy==='grow-19'&&npc?refineSlimeGeometry(image,w,h,p):null,x=((geometry?geometry.x:p.x)-w/2)/ratio,y=((geometry?geometry.y:p.y)-h/2)/ratio,r=geometry?geometry.r/ratio:originalRadius;let match=null,error=100;");
page=replaceOnce(page,'return {x,y,r,npc,labelSeen,localReliable:', 'return {x,y,r,visualR,geometryAccepted:geometry?1:0,confidence:geometry?geometry.confidence:null,originalRadius,npc,labelSeen,localReliable:');
page=replaceOnce(page,"const d=(runStrategy==='grow-12'?planGrow:planBaseline)(objects,hud,analysis.map,speed,velocity,heading,splitGuard);","const d=runStrategy==='grow-19'?planGrow19(objects,hud,analysis.map,speed,velocity,heading,runGameVersion):planGrow(objects,hud,analysis.map,speed,velocity,heading,splitGuard);");
page=replaceOnce(page,"if(performance.now()-begin>200){stop();", "if(performance.now()-begin>200){window.ocrLabEvent?.({type:'compute_overrun',elapsedCompute:performance.now()-begin});stop();");
page=replaceOnce(page,'Math.max(0,200-(performance.now()-begin))','Math.max(0,(runStrategy===\'grow-19\'?100:200)-(performance.now()-begin))');
const viewport="function setViewport(){const scale=Math.min(1,game.parentElement.clientWidth/2000);game.style.width='2000px';game.style.height='1163px';game.style.transform='scale('+scale+')';game.parentElement.style.height=(1163*scale)+'px';}";
const start=page.indexOf('function setViewport()'),end=page.indexOf("$('viewScale').onchange",start);
if(start<0||end<0)throw Error('Viewport source missing');
page=page.slice(0,start)+viewport+page.slice(end);
page=replaceOnce(page,'gameChoice.onchange=loadGrowGame;setViewport();loadGrowGame();',"gameChoice.onchange=loadGrowGame;window.ocrLabStatus=()=>({active,held:[...held],version:runGameVersion,strategy:runStrategy});window.addEventListener('resize',setViewport);setViewport();loadGrowGame();");
page=replaceOnce(page,'__GROW_GAMES__',JSON.stringify(bundle).replaceAll('<','\\u003c'));
page=page.replace(/<aside class="card side"><h1>[\s\S]*?<\/p>/,'<aside class="card side"><h1>grow-19：幾何拒判增加尺寸餘裕</h1><p>沿用凍結 grow-15 的辨識、追蹤與成長規劃。v2.22 的 NPC 幾何拒判時採較寬的大小估計，可能減少低估，也可能漏追有效獵物。備用候選，尚未完成實戰驗證。</p>');
page=page.replace(/<header class="test-banner">[\s\S]*?<\/header>/,'<header class="test-banner"><strong>OCR Grow · 獨立實測</strong><p>原目標：150秒內體型200 · v2.13與v2.22分開統計。須先完整結束 grow-18 固定批次且未達事前門檻，經重新核對最新版本及凍結後才啟動本候選。</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="lab-screen">開始 grow-19 探索（8局）</button><button id="lab-confirm">開始獨立確認（24局）</button><button id="lab-halt">停止批次</button></div><p id="lab-state">正在核對實驗來源</p><p id="lab-progress">尚未開局</p><details><summary>逐局結果</summary><pre id="lab-results" style="white-space:pre-wrap"></pre></details></header>');
page=page.replace('</style>',' .stage{overflow:hidden!important;min-height:0!important;display:block!important}.stage iframe{transform-origin:top left!important;max-width:none!important}.test-banner button{padding:8px}#viewScale{display:none}.experiment{display:none} </style>');
page=page.replace('</html>','<script src="/lab/harness.js"></script></html>');
await mkdir(dir+'results',{recursive:true});
await writeFile(dir+'index.html',page);
const parentManifest=JSON.parse(await readFile(dir+'parent-manifest.json','utf8'));
const deployedVerification=JSON.parse(await readFile(dir+'deployed-game-verification.json','utf8'));
if(deployedVerification.api.currentVersion!=='v2.22'||!deployedVerification.requests.filter(r=>r.name.endsWith('.html')).every(r=>r.ok&&r.matchesFrozenGame))throw Error('Current game verification failed');
const versions=['v2.13','v2.22'];
const order=n=>Array.from({length:n},()=>versions.map(version=>({version,strategy:'grow-19'}))).flat();
const nativeOutcomes=['win_le150','win_late','death','deadline_cutoff'];
const manifest={
 schema:1,candidate:'grow-19',createdAt:new Date().toISOString(),
 repository:'gg-dot1980/slime',authorityBranch:'test/ocr-test',authorityBaseCommit:'46b8aa3f8207ed03bc89c84c6ed896a23bcd5601',
 publicationParentCommit:'0f450e7682c2ac97181e1dae9fd35f67c1454e1d',
 baseSiteCommit:parentManifest.baseSiteCommit,parentCandidate:'grow-15',
 parentProtocolHash:parentManifest.protocolHash,parentPlannerHash:parentManifest.plannerHash,
 parentManifestHash:sha(await readFile(dir+'parent-manifest.json')),
 sourceHash:sha(source),geometryHash:sha(geometry),plannerHash:sha(planner),harnessHash:sha(harness),serverHash:sha(await readFile(dir+'server.mjs')),
 buildHash:sha(await readFile(dir+'build-lab.mjs')),pageHash:sha(page),isolationHash:sha(await readFile(dir+'game-isolation.mjs')),
 deployedGameVerificationHash:sha(await readFile(dir+'deployed-game-verification.json')),
 games:Object.fromEntries(Object.entries(games).map(([v,g])=>[v,{sourceHash:sha(g),isolatedHash:sha(bundle.entries['/'+v].html)}])),
 latestVersionVerified:deployedVerification.api.currentVersion,latestVersionCheckedAt:deployedVerification.checkedAt,
 latestVersionVerification:{status:'fresh root pre-activation verification supplied; batch freeze pending',
  source:'deployed-game-verification.json copied byte-for-byte from root Grow19 pre-activation verification',
  checkedAt:deployedVerification.checkedAt,rootPreActivationRecheckCompletedAt:deployedVerification.checkedAt,rootMustRecheckBeforeFirstStart:true,
  requirement:'root must verify the current supported latest version and source hashes before writing freeze.json; this fresh root check fulfils that pre-activation source check; a changed game requires a new fixed candidate/protocol'},
 activationPrerequisite:{status:'pending; not assessed by this standby build',candidate:'grow-18',
  screenId:'screen-06',confirmationId:'confirm-06',rootMustVerifyBeforeFirstStart:true,
  condition:'Only after Grow18 has completed its fixed screen and fails its prespecified screen gate, or completed all24 fixed confirmation native finals and either version has fewer than6/12 wins. Partial/interrupted cohorts do not authorize activation.',
  screenFailure:'exactly4 unique native screen finals per version and at least one version has fewer than2/4 wins',
  confirmationFailure:'exactly12 unique native confirmation finals per version and at least one version has fewer than6/12 wins',
  beforeActivation:['root verifies the completed prerequisite results','root rechecks the latest supported game version and source hashes','root records activation evidence and writes the source batch freeze before the first start'],
  notAutomatic:true},
 viewport:{gameWidth:2000,gameHeight:1163,devicePixelRatio:1},
 environment:'managed Linux desktop browser; exact user agent and outer viewport recorded on every start',
 seed:'natural Math.random; unknown and uncontrolled; no selection or injection; not paired random trials',
 controller:'rendered canvas pixels + visible HUD only',input:'Arrow keys + Space boost',
 maxComputeMs:200,controlIntervalMs:100,concurrency:1,
 policyChange:{
  versions:['v2.22'],evaluationVersions:versions,exactDiff:'if (cappedGame && o.geometryAccepted === 0 && finite(o.visualR) && o.visualR > 0) upper = Math.max(upper, (o.visualR + 6) / .808); before original clipped expansion and200 cap; diagnostics and naming do not change decisions',
  rationale:'rejected geometric radius refinement can leave a narrow outline-based size interval and create false meals or miss threatening bodies',
  unchanged:'v2.13 policy, accepted geometry, ordinary food, centre/radius estimates, tracking, red marker rules, original hard/soft rule, target value, scouts, immunity, motion prediction, path horizon and weights; no Grow18 nominal-lethal hard condition',
  hypothesis:'a larger fallback upper may reduce radius-underestimation errors, but can discard genuinely edible prey, increase avoidance and reduce growth; fixed synthetic negative cases are retained and no live improvement is claimed',
  bounds:'V>=.808R is a relation for a complete unoccluded continuous outline. Current components do not certify that condition; the6-unit step3/ratio1 allowance is a policy constant, not an occlusion or sampling guarantee',
  diagnostic:'boundAdjustedCount counts deduplicated NPC bodies whose upper is increased after original clipped expansion and200 cap, before map-red association/red expansion and local-hazard filtering; it is not a count of deaths avoided or final local threats'
 },
 instrumentationChange:'additional numeric selected-target coordinates/motion/stall/blocked fields and boundAdjustedCount; the reviewed Grow18 saving/stopping template is retained: startup page/harness/planner SHA-256 verification, independent100ms visible-stop watchdog, save abort after2500ms with unconfirmed records displayed for reconciliation, win without visible result time is unknown; no pixels or hidden state',
 perception:{...parentManifest.perception,plannerLogic:'Grow15 with one v2.22 geometry-rejected upper-floor addition; original hard/soft rule and all other strategy choices unchanged',numericDiagnostics:[...parentManifest.perception.numericDiagnostics,'boundAdjustedCount']},
 screen:{id:'screen-07',versions,NPerVersion:4,minimumWinsPerVersion:2,nativeOutcomes,requireUniqueRunIds:true,order:order(4)},
 confirmation:{id:'confirm-07',versions,NPerVersion:12,minimumWinsPerVersion:6,order:order(12),
  condition:'both versions have exactly four native screen finals and >=2 wins each; frozen same candidate; 12 new starts per version; no data pooling'},
 success:{sizeGoal:200,gameSecondsMaximum:150,evidence:'this run visible You win settlement and visible result Play time <=02:30; HUD may stop updating during ending animation'},
 stop:{gameDeadline:'visible HUD elapsed >150 (integer display, normally151); settlement checked first',wallMs:300000,computeMs:200,manual:'stop batch records controller_abort and releases all held keys',watchdogMs:100,persistenceTimeoutMs:2500,persistenceFailure:'stop and retain infrastructure_error or unconfirmed visible records; reconcile by runId before sidecar, no replacements; unconfirmed final never triggers a second final; server rejects duplicate start/final identities'},
 denominatorPolicy:'every start stays in its version and phase denominator; death, cutoff, late win, infrastructure error, abort and unknown are separately reported; no replacements, exclusions or restarting an interrupted batch',
 acceptance:'research only: both confirmation versions require >=6/12 observed wins for this sample target; report Wilson 95% intervals; no formal OCR4 release, all-version acceptance or long-term guarantee',
 unsupportedClaims:['synthetic fixtures are not game outcomes','historical uncontrolled batches do not establish causal improvement','v2.20/v2.21 not tested in this user-requested two-version batch'],
 freezePolicy:'no controller, game, harness or protocol edits after first start; new code requires a new candidate and batch identity'
};
manifest.protocolHash=sha(JSON.stringify(manifest));
const text=JSON.stringify(manifest,null,2)+'\n';
await writeFile(dir+'manifest.json',text);
await writeFile(dir+'protocol.json',text);
console.log(JSON.stringify({pageHash:manifest.pageHash,plannerHash:manifest.plannerHash,protocolHash:manifest.protocolHash}));
