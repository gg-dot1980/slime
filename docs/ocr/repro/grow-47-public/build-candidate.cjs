'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const PARENT_SHA='2d1e128ecd0efd976a3578158f62ea2d1875105bd4f77d247dcf4c90ca5b87aa';
const parentPath=path.join(__dirname,'../grow-46-public/ocr-grow46.html');
function once(text,from,to) {
  assert.equal(text.split(from).length,2,'unique frozen anchor: '+from.slice(0,90));
  return text.replace(from,()=>to);
}
function build() {
  let html=fs.readFileSync(parentPath,'utf8');
  assert.equal(hash(html),PARENT_SHA,'Grow46 frozen parent');
  const start=html.indexOf('function planHunt46('),end=html.indexOf('function planGrow46(',start);
  assert(start>=0&&end>start);
  let planner=html.slice(start,end);
  const edit=(from,to)=>{planner=once(planner,from,to);};
  edit('function planHunt46(', 'function planHunt47(');
  edit("name: '等待可靠畫面', strategy: 'grow-46',", "name: '等待可靠畫面', strategy: 'grow-47',");
  edit("strategy: 'grow-46', mapStatus:","strategy: 'grow-47', mapStatus:");
  edit('  const paths = [];',
    '  // Match Claude22: estimate world walls from the visible minimap player.\n'+
    '  // Grow46 retains its separate visibleWalls-first hard safety checks.\n'+
    '  const wallDistances47=mapOK?[map.player.x/map.width*10400,\n'+
    '    (1-map.player.x/map.width)*10400,map.player.y/map.height*7200,\n'+
    '    (1-map.player.y/map.height)*7200]:null;\n'+
    '  const paths = [];');
  edit('    const picked = new Set();','    const picked = new Set();\n    const wall47=wallEvidence47(wallDistances47,r,mapOK);');
  edit('      const change = [x, -x, y, -y];',
    '      const change = [x, -x, y, -y];\n      observeWall47(wall47,wallDistances47,r,x,y,k);');
  edit('      endX: x, endY: y, penalty46});','      endX: x, endY: y, penalty46, wall47});');
  edit('  let chosen, escaping = false, baseline46=null;',
    '  let chosen, escaping = false, baseline46=null, beforeWall47=null;');
  edit('    safe.sort((a, b) => b.score - a.score || b.clearance - a.clearance);',
    '    // Freeze the complete Grow46 choice before applying the wall preference.\n'+
    '    beforeWall47=safe.reduce((best,p)=>p.score>best.score ||\n'+
    '      (p.score===best.score && p.clearance>best.clearance) ? p : best);\n'+
    '    // Only already feasible paths receive this penalty. Emergency scores,\n'+
    '    // including their score tiebreak, remain byte-for-byte Grow46.\n'+
    '    for (const p of safe) p.score-=p.wall47?.penalty||0;\n'+
    '    safe.sort((a, b) => b.score - a.score || b.clearance - a.clearance);');
  edit('  return {...chosen, target, chase46:',
    '  return {...chosen, target,\n'+
    '    wallTracking47:{enabled:!!chosen.wall47,applied:!escaping&&!!chosen.wall47,\n'+
    '      scoredPaths:escaping?0:safe.filter(p=>p.wall47?.penalty>0).length,\n'+
    '      chosenPenalty:escaping?0:chosen.wall47?.penalty||0,\n'+
    '      baselineFirst:beforeWall47?.first??chosen.first,baselineSecond:beforeWall47?.second??chosen.second,\n'+
    '      baselinePenalty:beforeWall47?.wall47?.penalty||0,\n'+
    '      baselineEnd:beforeWall47?.wall47?.end??null,chosenEnd:chosen.wall47?.end??null,\n'+
    '      firstChanged:!!beforeWall47&&beforeWall47.first!==chosen.first,\n'+
    '      routeChanged:!!beforeWall47&&(beforeWall47.first!==chosen.first||beforeWall47.second!==chosen.second)},\n'+
    '    chase46:');
  edit('baseline46?.first??chosen.first,','baseline46?.first??(beforeWall47||chosen).first,');
  edit('baseline46?.second??chosen.second,firstChanged:!!baseline46&&baseline46.first!==chosen.first,',
    'baseline46?.second??(beforeWall47||chosen).second,\n'+
    '      preWallFirst:(beforeWall47||chosen).first,preWallSecond:(beforeWall47||chosen).second,\n'+
    '      firstChanged:!!baseline46&&baseline46.first!==(beforeWall47||chosen).first,');
  edit('routeChanged:!!baseline46&&(baseline46.first!==chosen.first||baseline46.second!==chosen.second)',
    'routeChanged:!!baseline46&&(baseline46.first!==(beforeWall47||chosen).first||baseline46.second!==(beforeWall47||chosen).second)');
  html=html.slice(0,start)+fs.readFileSync(path.join(__dirname,'wall-score.js'),'utf8')+'\n'+planner+html.slice(end);
  const change=(from,to)=>{html=once(html,from,to);};
  change('function planGrow46(', 'function planGrow47(');
  change('return planHunt46(objects,r,map,speed,velocity,heading,gameVersion,now,npcToast);',
    'return planHunt47(objects,r,map,speed,velocity,heading,gameVersion,now,npcToast);');
  change('planGrow46(objects,hud,analysis.map,speed,velocity,heading,runGameVersion,imageState?.timestamp,npcToast46)',
    'planGrow47(objects,hud,analysis.map,speed,velocity,heading,runGameVersion,imageState?.timestamp,npcToast46)');
  change('let totals46=null;', 'let totals46=null;\nlet totals47=null;');
  change('stop(false);totals46=null;runGameVersion=loadedVersion;',
    'stop(false);totals46=null;totals47=null;runGameVersion=loadedVersion;');
  change('  const renderBegin=performance.now();',
    "  if (d.wallTracking47 && d.mapStatus!=='lost') {\n"+
    '    totals47 ??= {applied:0,scored:0,firstChanged:0,routeChanged:0};\n'+
    '    totals47.applied++;totals47.scored+=Number(d.wallTracking47.scoredPaths>0);\n'+
    '    totals47.firstChanged+=Number(d.wallTracking47.firstChanged);totals47.routeChanged+=Number(d.wallTracking47.routeChanged);\n'+
    '    planOutput.wallTracking47.appliedCounts={...totals47};\n'+
    '  }\n  const renderBegin=performance.now();');
  html=html.replaceAll('Grow46 · 連續追獵距離核對','Grow47 · 預測牆距評分');
  change('OCR Grow 46</strong>','OCR Grow 47</strong>');
  change('Grow46 · 分版追獵距離核對','Grow47 · v2.22 預測牆距');
  change('Grow46 候選／Grow-12 舊基線','Grow47 候選／Grow-12 舊基線');
  change('v2.13 沿用 Grow38。v2.22 持續追逐同一個可食 NPC 而距離未縮短時，降低僅在第二段轉向後預測接觸的收益。',
    'v2.13 沿用 Grow38。v2.22 保留 Grow46 捕食與逃生條件，在已通過安全檢查的路徑中加入未來 1.5 秒的牆距扣分。');
  return html;
}
if(require.main===module){
  const html=build(),file=path.join(__dirname,'ocr-grow47.html');
  if(process.argv.includes('--write'))fs.writeFileSync(file,html);else assert.equal(fs.readFileSync(file,'utf8'),html);
  console.log(hash(html));
}
module.exports={build,hash,PARENT_SHA};
