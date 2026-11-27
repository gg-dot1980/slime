'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const parent = '../grow-38-public/ocr-grow38.html';
const donor = '../grow-evaluation-20261125/bundle/source/experiments/grow15/frozen/screen-03/planner.js';
const parentHash = 'befaf6a2c6ac1ff14596628753e509e5c15eb5bffd0e6f62f81e91b884f239ec';
const donorHash = 'e89d6a8cb0201a8caf0314c023e16f37f63396dd44615bf4dcdc823077e0fd0e';
const hash = data => createHash('sha256').update(data).digest('hex');
function readFrozen(source, expected) {
  const bytes = fs.readFileSync(path.join(__dirname, source));
  assert.equal(hash(bytes), expected, source);
  return bytes.toString('utf8');
}

function build() {
  let html = readFrozen(parent, parentHash);
  const planner = readFrozen(donor, donorHash);
  const end = "\nif (typeof module !== 'undefined' && module.exports) module.exports = {planGrow15};\n";
  assert.ok(planner.endsWith(end), 'unexpected Grow15 export');
  const reference = planner.slice(0, -end.length);
  function change(from, to, count=1) {
    assert.equal(html.split(from).length-1, count, 'parent anchor: '+from.slice(0,100));
    html = html.split(from).join(to);
  }
  change('Grow-24 · 原遊戲視野候選', 'Grow45 · 寬視野分版規劃', 2);
  change('OCR Grow 38</strong>', 'OCR Grow 45</strong>');
  change('Grow-24 · 原遊戲視野</h1>', 'Grow45 · 寬視野分版規劃</h1>');
  change('Grow-24 · 沿用 Grow-23 策略', 'Grow45 · v2.13 用 Grow38，v2.22 用 Grow15');
  change('Grow-24 候選／Grow-12 舊基線', 'Grow45 候選／Grow-12 舊基線');
  for (const [anchor, description] of [
    ['<strong>OCR Grow · Grow45 · 寬視野分版規劃</strong><p>', '使用同源原遊戲、可見畫面與鍵盤。'],
    ['<h1>Grow45 · 寬視野分版規劃</h1><p>', 'v2.13 沿用 Grow38，v2.22 以 Grow15 規劃器比較可見食物、獵物、牆界與威脅。'],
  ]) {
    const from = html.indexOf(anchor);
    assert.notEqual(from, -1);
    change(html.slice(from, html.indexOf('</p>', from)), anchor+description);
  }
  change('let lastVision=0;', reference+'\n\n'+
    'function planGrow45(objects, r, map, speed, velocity, heading, gameVersion) {\n'+
    "  const planner = gameVersion === 'v2.22' ? planGrow15 : planGrow23;\n"+
    '  return planner(objects, r, map, speed, velocity, heading, gameVersion);\n'+
    '}\n\nlet lastVision=0;');
  change("runStrategy==='grow-23'?planGrow23(objects,hud,analysis.map,speed,velocity,heading,runGameVersion)",
         "runStrategy==='grow-23'?planGrow45(objects,hud,analysis.map,speed,velocity,heading,runGameVersion)");
  return html;
}
if (require.main === module) {
  const html = build();
  const output = path.join(__dirname, 'ocr-grow45.html');
  if (process.argv.includes('--write')) fs.writeFileSync(output, html);
  else assert.equal(fs.readFileSync(output,'utf8'), html, 'frozen candidate differs');
  console.log(hash(html));
}
module.exports = {build};
