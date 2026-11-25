import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeGrowBundle} from './game-isolation.mjs';
const dir='experiments/grow17/';
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
page=replaceOnce(page,'<option value="grow-12">B · grow-12 成長優先</option value="baseline">A · 原規劃 test-026</option>','<option value="grow-12">A · grow-12 現行基線</option><option value="grow-17">B · grow-17 截獲收益</option>');
page=replaceOnce(page,'let lastVision=0;',geometry+'\n'+planner+'\nlet lastVision=0;');
page=replaceOnce(page,"Math.min(1,1200/source.width)","Math.min(1,(runStrategy==='grow-17'?2000:1200)/source.width)");
page=replaceOnce(page,"if(map&&runStrategy==='grow-12')map.growMarkers=growMarkers(image,w,h,map);","if(map&&(runStrategy==='grow-12'||runStrategy==='grow-17'))map.growMarkers=growMarkers(image,w,h,map);");
page=replaceOnce(page,
  'const x=(p.x-w/2)/ratio,y=(p.y-h/2)/ratio,visualR=p.r/ratio,labelSeen=hasSlimeLabel(image,w,h,p),npc=labelSeen||visualR>20,r=npc?highlightRadius(image,w,h,p)/ratio:visualR;let match=null,error=100;',
  "const visualR=p.r/ratio,labelSeen=hasSlimeLabel(image,w,h,p),npc=labelSeen||visualR>20,originalRadius=npc?highlightRadius(image,w,h,p)/ratio:visualR,geometry=runStrategy==='grow-17'&&npc?refineSlimeGeometry(image,w,h,p):null,x=((geometry?geometry.x:p.x)-w/2)/ratio,y=((geometry?geometry.y:p.y)-h/2)/ratio,r=geometry?geometry.r/ratio:originalRadius;let match=null,error=100;");
page=replaceOnce(page,'return {x,y,r,npc,labelSeen,localReliable:', 'return {x,y,r,visualR,geometryAccepted:geometry?1:0,confidence:geometry?geometry.confidence:null,originalRadius,npc,labelSeen,localReliable:');
page=replaceOnce(page,"const d=(runStrategy==='grow-12'?planGrow:planBaseline)(objects,hud,analysis.map,speed,velocity,heading,splitGuard);","const d=runStrategy==='grow-17'?planGrow15(objects,hud,analysis.map,speed,velocity,heading,runGameVersion):planGrow(objects,hud,analysis.map,speed,velocity,heading,splitGuard);");
page=replaceOnce(page,"if(performance.now()-begin>200){stop();", "if(performance.now()-begin>200){window.ocrLabEvent?.({type:'compute_overrun',elapsedCompute:performance.now()-begin});stop();");
page=replaceOnce(page,'Math.max(0,200-(performance.now()-begin))','Math.max(0,(runStrategy===\'grow-17\'?100:200)-(performance.now()-begin))');
const viewport="function setViewport(){const scale=Math.min(1,game.parentElement.clientWidth/2000);game.style.width='2000px';game.style.height='1163px';game.style.transform='scale('+scale+')';game.parentElement.style.height=(1163*scale)+'px';}";
const start=page.indexOf('function setViewport()'),end=page.indexOf("$('viewScale').onchange",start);
if(start<0||end<0)throw Error('Viewport source missing');
page=page.slice(0,start)+viewport+page.slice(end);
page=replaceOnce(page,'gameChoice.onchange=loadGrowGame;setViewport();loadGrowGame();',"gameChoice.onchange=loadGrowGame;window.ocrLabStatus=()=>({active,held:[...held],version:runGameVersion,strategy:runStrategy});window.addEventListener('resize',setViewport);setViewport();loadGrowGame();");
page=replaceOnce(page,'__GROW_GAMES__',JSON.stringify(bundle).replaceAll('<','\\u003c'));
page=page.replace(/<aside class="card side"><h1>[\s\S]*?<\/p>/,'<aside class="card side"><h1>grow-17：v2.22 免疫階段停止白點探索</h1><p>以凍結 grow-15 為基礎。僅在 v2.22 體型達186後停止產生小地圖白點探索目標，保留可見食物、本體目標與原探索方向。v2.13 及免疫前政策不變；未採用 grow-16 的紅色尺寸上界改動。新假說，尚未驗證勝率。</p>');
page=page.replace(/<header class="test-banner">[\s\S]*?<\/header>/,'<header class="test-banner"><strong>OCR Grow · 獨立實測</strong><p>原目標：150秒內體型200 · 僅 v2.22 新樣本 · v2.13 復用不變 grow-15 政策</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="lab-screen">開始 grow-17 探索（4局 v2.22）</button><button id="lab-confirm">開始獨立確認（12局 v2.22）</button><button id="lab-halt">停止批次</button></div><p id="lab-state">正在核對實驗來源</p><p id="lab-progress">尚未開局</p><details><summary>逐局結果</summary><pre id="lab-results" style="white-space:pre-wrap"></pre></details></header>');
page=page.replace('</style>',' .stage{overflow:hidden!important;min-height:0!important;display:block!important}.stage iframe{transform-origin:top left!important;max-width:none!important}.test-banner button{padding:8px}#viewScale{display:none}.experiment{display:none} </style>');
page=page.replace("gameChoice.value='/v2.13';","gameChoice.value='/v2.22';");
page=page.replace('</html>','<script src="/lab/harness.js"></script></html>');
await mkdir(dir+'results',{recursive:true});
await writeFile(dir+'index.html',page);
const parentManifest=JSON.parse(await readFile(dir+'parent-manifest.json','utf8'));
const nativeOutcomes=['win_le150','win_late','death','deadline_cutoff'];
const manifest={
 schema:1,candidate:'grow-17',createdAt:new Date().toISOString(),
 baseSiteCommit:parentManifest.baseSiteCommit,parentCandidate:'grow-15',
 parentProtocolHash:parentManifest.protocolHash,parentPlannerHash:parentManifest.plannerHash,
 parentManifestHash:sha(await readFile(dir+'parent-manifest.json')),
 sourceHash:sha(source),geometryHash:sha(geometry),plannerHash:sha(planner),
 harnessHash:sha(harness),buildHash:sha(await readFile(dir+'build-lab.mjs')),
 pageHash:sha(page),isolationHash:sha(await readFile(dir+'game-isolation.mjs')),
 games:Object.fromEntries(Object.entries(games).map(([v,g])=>[v,{sourceHash:sha(g),isolatedHash:sha(bundle.entries['/'+v].html)}])),
 viewport:{gameWidth:2000,gameHeight:1163},seed:'natural Math.random; unknown',
 controller:'rendered canvas pixels + visible HUD only',input:'Arrow keys + Space boost',
 maxComputeMs:200,concurrency:1,
 policyChange:{version:'v2.22',condition:'existing immune branch: HUD >=186',
  exactDiff:'scout generation guard if (mapOK) becomes if (mapOK && !immune)',
  effect:'omit mapOnly scout goals with growth:0 and pursuitOnly:true; retain real meals and original fallback exploration',
  unchanged:'all other Grow15 planner bytes, original red bounds, perception, geometry, NPC classification, velocity forecast, growth score, immunity threshold',
  plannerFunction:'planGrow15 and diagnostic strategy retained deliberately for exact output comparison',
  hypothesis:'removing zero-growth scout approach utility may improve late completion; may reduce discovery of distant resources; no causal claim'},
 reusedVersionPolicy:{version:'v2.13',candidate:'grow-15',protocolHash:parentManifest.protocolHash,
  plannerHash:parentManifest.plannerHash,evidenceBatch:'confirm-03',wins:11,nativeFinals:12,
  condition:'unchanged v2.13 outputs and byte-identical shared inputs; no grow17 v2.13 samples'},
 activationPrerequisite:{candidate:'grow-16',batch:'confirm-04',version:'v2.22',
  protocolHash:'62ab303656b41620f370a5141fd3ba7783cbd37db2011f7b33b5eee98c8f5d37',
  completedNativeFinals:12,nativeOutcomes,winsStrictlyLessThan:6,
  enforcement:'operator must verify the complete fixed Grow16 batch before activation; partial results never authorize activation'},
 perception:{...parentManifest.perception,plannerLogic:'only v2.22 immune mapOnly scout guard differs from frozen Grow15'},
 screen:{id:'screen-05',versions:['v2.22'],NPerVersion:4,nativeOutcomes,requireUniqueRunIds:true,
  order:Array.from({length:4},()=>({version:'v2.22',strategy:'grow-17'}))},
 confirmation:{id:'confirm-05',versions:['v2.22'],NPerVersion:12,
  order:Array.from({length:12},()=>({version:'v2.22',strategy:'grow-17'})),
  condition:'screen-05 has exactly four unique native finals and >=2 wins; frozen same candidate; 12 new v2.22 starts'},
 denominatorPolicy:'retain every start and outcome including interruptions; interruption does not count as a native final or permit gate passage; no automatic replacements or pooling'
};
manifest.protocolHash=sha(JSON.stringify(manifest));
await writeFile(dir+'manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({pageHash:manifest.pageHash,plannerHash:manifest.plannerHash,protocolHash:manifest.protocolHash}));
