import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeGrowBundle} from './game-isolation.mjs';
const dir='experiments/grow18/';
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
page=replaceOnce(page,'<option value="grow-12">B · grow-12 成長優先</option value="baseline">A · 原規劃 test-026</option>','<option value="grow-12">A · grow-12 現行基線</option><option value="grow-18">B · grow-18 致命尺寸避碰</option>');
page=replaceOnce(page,'let lastVision=0;',geometry+'\n'+planner+'\nlet lastVision=0;');
page=replaceOnce(page,"Math.min(1,1200/source.width)","Math.min(1,(runStrategy==='grow-18'?2000:1200)/source.width)");
page=replaceOnce(page,"if(map&&runStrategy==='grow-12')map.growMarkers=growMarkers(image,w,h,map);","if(map&&(runStrategy==='grow-12'||runStrategy==='grow-18'))map.growMarkers=growMarkers(image,w,h,map);");
page=replaceOnce(page,
  'const x=(p.x-w/2)/ratio,y=(p.y-h/2)/ratio,visualR=p.r/ratio,labelSeen=hasSlimeLabel(image,w,h,p),npc=labelSeen||visualR>20,r=npc?highlightRadius(image,w,h,p)/ratio:visualR;let match=null,error=100;',
  "const visualR=p.r/ratio,labelSeen=hasSlimeLabel(image,w,h,p),npc=labelSeen||visualR>20,originalRadius=npc?highlightRadius(image,w,h,p)/ratio:visualR,geometry=runStrategy==='grow-18'&&npc?refineSlimeGeometry(image,w,h,p):null,x=((geometry?geometry.x:p.x)-w/2)/ratio,y=((geometry?geometry.y:p.y)-h/2)/ratio,r=geometry?geometry.r/ratio:originalRadius;let match=null,error=100;");
page=replaceOnce(page,'return {x,y,r,npc,labelSeen,localReliable:', 'return {x,y,r,visualR,geometryAccepted:geometry?1:0,confidence:geometry?geometry.confidence:null,originalRadius,npc,labelSeen,localReliable:');
page=replaceOnce(page,"const d=(runStrategy==='grow-12'?planGrow:planBaseline)(objects,hud,analysis.map,speed,velocity,heading,splitGuard);","const d=runStrategy==='grow-18'?planGrow18(objects,hud,analysis.map,speed,velocity,heading,runGameVersion):planGrow(objects,hud,analysis.map,speed,velocity,heading,splitGuard);");
page=replaceOnce(page,"if(performance.now()-begin>200){stop();", "if(performance.now()-begin>200){window.ocrLabEvent?.({type:'compute_overrun',elapsedCompute:performance.now()-begin});stop();");
page=replaceOnce(page,'Math.max(0,200-(performance.now()-begin))','Math.max(0,(runStrategy===\'grow-18\'?100:200)-(performance.now()-begin))');
const viewport="function setViewport(){const scale=Math.min(1,game.parentElement.clientWidth/2000);game.style.width='2000px';game.style.height='1163px';game.style.transform='scale('+scale+')';game.parentElement.style.height=(1163*scale)+'px';}";
const start=page.indexOf('function setViewport()'),end=page.indexOf("$('viewScale').onchange",start);
if(start<0||end<0)throw Error('Viewport source missing');
page=page.slice(0,start)+viewport+page.slice(end);
page=replaceOnce(page,'gameChoice.onchange=loadGrowGame;setViewport();loadGrowGame();',"gameChoice.onchange=loadGrowGame;window.ocrLabStatus=()=>({active,held:[...held],version:runGameVersion,strategy:runStrategy});window.addEventListener('resize',setViewport);setViewport();loadGrowGame();");
page=replaceOnce(page,'__GROW_GAMES__',JSON.stringify(bundle).replaceAll('<','\\u003c'));
page=page.replace(/<aside class="card side"><h1>[\s\S]*?<\/p>/,'<aside class="card side"><h1>grow-18：估計致命尺寸列入避碰約束</h1><p>沿用凍結 grow-15 的辨識、追蹤與成長規劃。唯一策略改動：已辨識 NPC 的名義尺寸達吞噬門檻時，將它納入硬性避碰檢查。尚未完成實戰驗證。</p>');
page=page.replace(/<header class="test-banner">[\s\S]*?<\/header>/,'<header class="test-banner"><strong>OCR Grow · 獨立實測</strong><p>原目標：150秒內體型200 · v2.13與v2.22分開統計</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="lab-screen">開始 grow-18 探索（8局）</button><button id="lab-confirm">開始獨立確認（24局）</button><button id="lab-halt">停止批次</button></div><p id="lab-state">正在核對實驗來源</p><p id="lab-progress">尚未開局</p><details><summary>逐局結果</summary><pre id="lab-results" style="white-space:pre-wrap"></pre></details></header>');
page=page.replace('</style>',' .stage{overflow:hidden!important;min-height:0!important;display:block!important}.stage iframe{transform-origin:top left!important;max-width:none!important}.test-banner button{padding:8px}#viewScale{display:none}.experiment{display:none} </style>');
page=page.replace('</html>','<script src="/lab/harness.js"></script></html>');
await mkdir(dir+'results',{recursive:true});
await writeFile(dir+'index.html',page);
const parentManifest=JSON.parse(await readFile(dir+'parent-manifest.json','utf8'));
const deployedVerification=JSON.parse(await readFile(dir+'deployed-game-verification.json','utf8'));
if(deployedVerification.api.currentVersion!=='v2.22'||!deployedVerification.requests.filter(r=>r.name.endsWith('.html')).every(r=>r.ok&&r.matchesFrozenGame))throw Error('Current game verification failed');
const versions=['v2.13','v2.22'];
const order=n=>Array.from({length:n},()=>versions.map(version=>({version,strategy:'grow-18'}))).flat();
const nativeOutcomes=['win_le150','win_late','death','deadline_cutoff'];
const manifest={
 schema:1,candidate:'grow-18',createdAt:new Date().toISOString(),
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
 viewport:{gameWidth:2000,gameHeight:1163,devicePixelRatio:1},
 environment:'managed Linux desktop browser; exact user agent and outer viewport recorded on every start',
 seed:'natural Math.random; unknown and uncontrolled; no selection or injection; not paired random trials',
 controller:'rendered canvas pixels + visible HUD only',input:'Arrow keys + Space boost',
 maxComputeMs:200,controlIntervalMs:100,concurrency:1,
 policyChange:{
  versions,exactDiff:'hard hazard OR includes nominal observed radius at the existing lethal threshold; diagnostics and naming do not change decisions',
  rationale:'the old interval fraction can classify an already nominally lethal body as soft, particularly near the v2.22 size cap',
  unchanged:'geometry, fallback radii, red marker bounds, target value, scouts, immunity, motion prediction, path horizon, weights and tracking',
  hypothesis:'hard avoidance may reduce early deaths; additional avoidance may reduce growth and increase cutoffs; no causal efficacy claim before the new batch'
 },
 instrumentationChange:'additional numeric selected-target coordinates/motion/stall/blocked fields and local hard/soft/promoted counts; startup page/harness/planner SHA-256 verification; independent 100ms visible-stop watchdog; save abort after2500ms with unconfirmed records displayed for reconciliation; win without visible result time is unknown; no pixels or hidden state',
 perception:{...parentManifest.perception,plannerLogic:'Grow15 with nominal-lethal hard hazard condition; all other strategy choices unchanged'},
 screen:{id:'screen-06',versions,NPerVersion:4,minimumWinsPerVersion:2,nativeOutcomes,requireUniqueRunIds:true,order:order(4)},
 confirmation:{id:'confirm-06',versions,NPerVersion:12,minimumWinsPerVersion:6,order:order(12),
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
