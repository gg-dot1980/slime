'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const html = fs.readFileSync(process.argv[2] || path.join(__dirname, 'ocr-grow55.html'), 'utf8');
for (const [i, script] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries())
  new vm.Script(script[1], {filename: `candidate-script-${i}`});
assert.equal(html.match(/strategy: 'grow-55'/g).length, 2);
assert.ok(html.includes('Grow55 候選／Grow-12 舊基線'));
assert.ok(html.includes('escapeHold54Input'));
assert.ok(html.includes('chosen.clearance < r || chosen.endGap < 0'));
assert.ok(html.includes('escapeSafeFrames54 >= 2'));
assert.ok(html.includes('pool55.every(p => p.immediateGap < 0)'));
assert.ok(html.includes('b.immediateGap - a.immediateGap ||'));
assert.ok(html.includes('immediatePriority55'));
assert.ok(html.includes("if (gameVersion === 'v2.22') return planHunt47("));
const start = html.indexOf('function planGrow23('), end = html.indexOf('let totals46=', start);
const plan = vm.runInNewContext(html.slice(start, end) + '\nplanGrow47');
assert.equal(plan([], 90, null, 150, {x:0,y:0}, {x:1,y:0}, 'v2.13', 0, null).strategy, 'grow-23');
assert.equal(plan([], 90, null, 150, {x:0,y:0}, {x:1,y:0}, 'v2.22', 0, null).strategy, 'grow-55');
console.log('Grow55 compiles; v2.13 remains grow-23 and v2.22 adds gated immediate-gap-first escape ordering.');
