'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'ocr-grow49.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length >= 2);
for (const [i, s] of scripts.entries()) new vm.Script(s[1], {filename:'candidate-script-' + i});
assert.equal(html.match(/strategy: 'grow-49'/g).length, 2);
assert.ok(html.includes("Grow49 候選／Grow-12 舊基線"));
assert.ok(html.includes("runStrategy==='grow-23'&&runGameVersion==='v2.22'?r:0"));
assert.ok(html.includes("if (gameVersion === 'v2.22') return planHunt47("));
const start = html.indexOf('function planGrow23(');
const end = html.indexOf('let totals46=', start);
const plan = vm.runInNewContext(html.slice(start, end) + '\nplanGrow47');
for (const [version, expected] of [['v2.13','grow-23'], ['v2.22','grow-49']]) {
  for (const objects of [null, []]) {
    const result = plan(objects, 90, null, 150, {x:0, y:0}, {x:1, y:0}, version, 0, null);
    assert.equal(result.strategy, expected);
  }
}
console.log('Embedded scripts compile. Decision and stop records identify their respective versions.');
