'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const html = fs.readFileSync(process.argv[2] || path.join(__dirname, 'ocr-grow51.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length >= 2);
for (const [i, script] of scripts.entries()) new vm.Script(script[1], {filename: `candidate-script-${i}`});
assert.equal(html.match(/strategy: 'grow-51'/g).length, 2);
assert.ok(html.includes('Grow51 候選／Grow-12 舊基線'));
assert.ok(html.includes('const switchedRoute51 ='));
assert.ok(html.includes('if (gapRoute51.endGap > 0) { chosen = gapRoute51; routeSwitchGap51 = true; }'));
assert.ok(html.includes("if (gameVersion === 'v2.22') return planHunt47("));
const start = html.indexOf('function planGrow23(');
const end = html.indexOf('let totals46=', start);
const plan = vm.runInNewContext(html.slice(start, end) + '\nplanGrow47');
for (const [version, expected] of [['v2.13', 'grow-23'], ['v2.22', 'grow-51']]) {
  for (const objects of [null, []]) {
    const result = plan(objects, 90, null, 150, {x: 0, y: 0}, {x: 1, y: 0}, version, 0, null);
    assert.equal(result.strategy, expected);
  }
}
console.log('Grow51 scripts compile; v2.13 remains grow-23 and v2.22 exposes the route-switch gap gate.');
