'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const html = fs.readFileSync(process.argv[2] || path.join(__dirname, 'ocr-grow52.html'), 'utf8');
for (const [i, script] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries())
  new vm.Script(script[1], {filename: `candidate-script-${i}`});
assert.equal(html.match(/strategy: 'grow-52'/g).length, 2);
assert.ok(html.includes('Grow52 候選／Grow-12 舊基線'));
assert.equal(html.match(/const safe = bounded\.filter\(p => p\.clearance > 14\);/g).length, 1);
assert.equal(html.match(/const safe = bounded\.filter\(p => p\.clearance > \(oldModeEscape \? 14 : 4\)\);/g).length, 1);
assert.ok(html.includes("if (gameVersion === 'v2.22') return planHunt47("));
const start = html.indexOf('function planGrow23('), end = html.indexOf('let totals46=', start);
const plan = vm.runInNewContext(html.slice(start, end) + '\nplanGrow47');
assert.equal(plan([], 90, null, 150, {x:0,y:0}, {x:1,y:0}, 'v2.13', 0, null).strategy, 'grow-23');
assert.equal(plan([], 90, null, 150, {x:0,y:0}, {x:1,y:0}, 'v2.22', 0, null).strategy, 'grow-52');
console.log('Grow52 compiles; v2.13 remains grow-23 and only v2.22 normal clearance floor changes to 14.');
