'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const hash = bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const parentPath=path.join(__dirname,'../grow-45-public/ocr-grow45.html');
function replaceOnce(s,anchor,value) {
  assert.equal(s.split(anchor).length,2,'frozen anchor: '+anchor.slice(0,70));
  return s.replace(anchor,()=>value);
}
function build(){
  let html=fs.readFileSync(parentPath,'utf8');
  assert.equal(hash(html),'7f2712f72d46b4bd8ec2a401c66a58f82db661eab5de33d26b355cd7edf8bdcc');
  const start=html.indexOf('function planGrow15('),end=html.indexOf('function planGrow45(',start);
  assert(start>=0&&end>start);
  let planner=html.slice(start,end);
  function edit(anchor,value){planner=replaceOnce(planner,anchor,value);}
  edit('function planGrow15(objects, r, map, speed, v, old, gameVersion)',
    'function planHunt46(objects, r, map, speed, v, old, gameVersion, now, npcToast)');
  edit("name: '等待可靠畫面', strategy: 'grow-15',", "name: '等待可靠畫面', strategy: 'grow-46',");
  edit("strategy: 'grow-15', mapStatus:","strategy: 'grow-46', mapStatus:");
  edit('  const oldTarget = old.target;', '  const progress = chaseEvidence46(old.chase46, bodies, meals, r, map, now, npcToast);\n'+
    '  const stalled = progress?.stalled;\n  const oldTarget = old.target;');
  edit('    const picked = new Set();', '    const picked = new Set();\n    let stagnantFirstLeg = false, penalty46 = 0;');
  edit('      endGap = 1e6;', '      if (stalled && first !== second && k === turnAt) {\n'+
    '        const after = hypot(stalled.x+stalled.vx*t-x, stalled.y+stalled.vy*t-y);\n'+
    '        stagnantFirstLeg = hypot(stalled.x,stalled.y)-after <= 6;\n      }\n      endGap = 1e6;');
  edit('          growth += g; gain += g / (t + .65);','          growth += g; gain += g / (t + .65);\n'+
    '          if (o === stalled && stagnantFirstLeg && k > turnAt) penalty46 += .75*g/(t+.65);');
  edit('      endX: x, endY: y});','      endX: x, endY: y, penalty46});');
  edit('  let chosen, escaping = false;', '  let chosen, escaping = false, baseline46=null;');
  edit('    safe.sort((a, b)', '    if (stalled && safe.some(p=>p.penalty46>0)) {\n'+
    '      baseline46=safe.reduce((best,p)=>p.score>best.score || (p.score===best.score && p.clearance>best.clearance) ? p : best);\n    }\n'+
    '    for (const p of safe) {\n'+
    '      p.discountedGain -= p.penalty46;\n      p.score -= 2*p.penalty46;\n    }\n    safe.sort((a, b)');
  edit('  return {...chosen, target,', '  return {...chosen, target, chase46:progress?.remember(target,escaping) ?? null,\n'+
    '    tracking46:{observedAt:now,npcToast:!!npcToast,stagnant:progress?.stagnant||0,discountedPaths:safe.filter(p=>p.penalty46>0).length,\n'+
    '      chosenPenalty:escaping?0:chosen.penalty46,baselineFirst:baseline46?.first??chosen.first,\n'+
    '      baselineSecond:baseline46?.second??chosen.second,firstChanged:!!baseline46&&baseline46.first!==chosen.first,\n'+
    '      routeChanged:!!baseline46&&(baseline46.first!==chosen.first||baseline46.second!==chosen.second)},');
  html=html.slice(0,start)+fs.readFileSync(path.join(__dirname,'tracking.js'),'utf8')+'\n'+planner+html.slice(end);
  function change(anchor,value){html=replaceOnce(html,anchor,value);}
  change("function planGrow45(objects, r, map, speed, velocity, heading, gameVersion) {\n  const planner = gameVersion === 'v2.22' ? planGrow15 : planGrow23;\n  return planner(objects, r, map, speed, velocity, heading, gameVersion);\n}",
    "function planGrow46(objects, r, map, speed, velocity, heading, gameVersion, now, npcToast) {\n"+
    "  if (gameVersion === 'v2.22') return planHunt46(objects,r,map,speed,velocity,heading,gameVersion,now,npcToast);\n"+
    '  return planGrow23(objects,r,map,speed,velocity,heading,gameVersion);\n}');
  change('  const d=runStrategy', "  const toast46=runStrategy==='grow-23'&&runGameVersion==='v2.22'?doc.getElementById('toast'):null;\n"+
    "  const npcToast46=!!(toast46?.classList.contains('show')&&/^(?:吞下|Ate\\s)/i.test(toast46.textContent));\n  const d=runStrategy");
  change('planGrow45(objects,hud,analysis.map,speed,velocity,heading,runGameVersion)',
    'planGrow46(objects,hud,analysis.map,speed,velocity,heading,runGameVersion,imageState?.timestamp,npcToast46)');
  change('function release(){for(', 'function release(){if(heading?.chase46)delete heading.chase46;for(');
  change('let lastVision=0;', 'let totals46=null;\nlet lastVision=0;');
  change('stop(false);runGameVersion=loadedVersion;', 'stop(false);totals46=null;runGameVersion=loadedVersion;');
  change('  const renderBegin=performance.now();', '  if (d.tracking46 && d.mapStatus!==\'lost\') {\n'+
    '    totals46 ??= {applied:0,stagnant:0,discounted:0,firstChanged:0,routeChanged:0};\n'+
    '    totals46.applied++;totals46.stagnant+=Number(d.tracking46.stagnant===2);\n'+
    '    totals46.discounted+=Number(d.tracking46.discountedPaths>0);\n'+
    '    totals46.firstChanged+=Number(d.tracking46.firstChanged);totals46.routeChanged+=Number(d.tracking46.routeChanged);\n'+
    '    planOutput.tracking46.appliedCounts={...totals46};\n  }\n  const renderBegin=performance.now();');
  html=html.replaceAll('Grow45 · 寬視野分版規劃','Grow46 · 連續追獵距離核對');
  change('OCR Grow 45</strong>','OCR Grow 46</strong>');
  change('Grow45 · v2.13 用 Grow38，v2.22 用 Grow15','Grow46 · 分版追獵距離核對');
  change('Grow45 候選／Grow-12 舊基線','Grow46 候選／Grow-12 舊基線');
  change('v2.13 沿用 Grow38，v2.22 以 Grow15 規劃器比較可見食物、獵物、牆界與威脅。',
    'v2.13 沿用 Grow38。v2.22 持續追逐同一個可食 NPC 而距離未縮短時，降低僅在第二段轉向後預測接觸的收益。');
  return html;
}
if(require.main===module){
  const result=build(),file=path.join(__dirname,'ocr-grow46.html');
  if(process.argv.includes('--write'))fs.writeFileSync(file,result);else assert.equal(fs.readFileSync(file,'utf8'),result);
  console.log(hash(result));
}
module.exports={build};
