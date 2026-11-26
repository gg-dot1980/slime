'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const parent=path.join(__dirname,'../grow-38-public/ocr-grow38.html');
const output=path.join(__dirname,'ocr-grow44.html');
let html=fs.readFileSync(parent,'utf8');
assert.equal(hash(html),'befaf6a2c6ac1ff14596628753e509e5c15eb5bffd0e6f62f81e91b884f239ec');
function replace(before,after,count=1){
  assert.equal(html.split(before).length-1,count,'Frozen parent anchor: '+before.slice(0,70));
  html=html.split(before).join(after);
}
replace('Grow-24 · 原遊戲視野候選','Grow44 · 可接觸獵物優先',2);
replace('OCR Grow 38</strong>','OCR Grow 44</strong>');
replace('Grow-24 · 原遊戲視野</h1>','Grow44 · 可接觸獵物優先</h1>');
replace('Grow-24 · 沿用 Grow-23 策略','Grow44 · 分版本追獵');
replace('Grow-24 候選／Grow-12 舊基線','Grow44 候選／Grow-12 舊基線');
for(const [start,body] of [['<strong>OCR Grow · Grow44 · 可接觸獵物優先</strong><p>','桌機研究候選，以可見遊戲畫面預測能否接觸獵物。'],['<h1>Grow44 · 可接觸獵物優先</h1><p>','v2.13 沿用 Grow38。v2.22 在原有安全路徑中，提高目前方向兩秒內可接觸之獵物的評分。']]){
  const at=html.indexOf(start);assert(at>=0);
  replace(html.slice(at,html.indexOf('</p>',at)),start+body);
}
replace('    const picked = new Set();\n    for (let k = 1; k <= steps; k++) {',
        '    const picked = new Set();\n    let npcContactUtility44 = 0;\n    for (let k = 1; k <= steps; k++) {');
replace('          growth += g; gain += g / (t + .65);',
        '          growth += g; gain += g / (t + .65);\n'+
        '          // Claude planClaude forecasts a fixed heading for 2 seconds.\n'+
        '          // Only credit contacts achievable before a turn in this two-leg planner.\n'+
        '          if (cappedGame && !o.food && t <= 2 && (k <= turnAt || first === second))\n'+
        '            npcContactUtility44 += g / (t + .35);');
replace('      endX: x, endY: y});\n  }','      endX: x, endY: y});\n'+
        '    if (npcContactUtility44 > 0) paths[paths.length - 1].npcContactBonus44 = 12 * npcContactUtility44;\n  }');
replace('    const pool = spawnSafe.length ? spawnSafe : safe;\n    pool.sort(',
        '    const pool = spawnSafe.length ? spawnSafe : safe;\n'+
        '    if (cappedGame) for (const p of pool) p.score += p.npcContactBonus44 || 0;\n    pool.sort(');
if(process.argv.includes('--write'))fs.writeFileSync(output,html);
else assert.equal(fs.readFileSync(output,'utf8'),html,'Regeneration differs from registered source');
console.log(hash(html));
