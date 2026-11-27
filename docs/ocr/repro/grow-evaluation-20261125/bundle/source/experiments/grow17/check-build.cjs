#!/usr/bin/env node
'use strict';
// Source integrity and syntax only. Does not start a server or execute a game.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const dir = __dirname, read = name => fs.readFileSync(path.join(dir, name), 'utf8');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(read('manifest.json'));
const parent = JSON.parse(read('parent-manifest.json'));
const page = read('index.html');

for (const [field, file] of [
  ['sourceHash', 'source-base.html'], ['geometryHash', 'geometry.js'],
  ['plannerHash', 'planner.js'], ['harnessHash', 'harness.js'],
  ['buildHash', 'build-lab.mjs'], ['pageHash', 'index.html'],
  ['isolationHash', 'game-isolation.mjs'], ['parentManifestHash', 'parent-manifest.json']
]) assert.equal(manifest[field], sha(read(file)), field);
const protocol = {...manifest}; delete protocol.protocolHash;
assert.equal(manifest.protocolHash, sha(JSON.stringify(protocol)), 'Protocol hash');
assert.equal(manifest.parentProtocolHash, parent.protocolHash);
assert.equal(manifest.parentPlannerHash, parent.plannerHash);
for (const field of ['sourceHash', 'geometryHash', 'isolationHash'])
  assert.equal(manifest[field], parent[field], 'Unchanged shared input: ' + field);
assert.deepEqual(manifest.games, parent.games, 'Both isolated games are unchanged');
assert.deepEqual(manifest.viewport, parent.viewport);
assert.equal(manifest.maxComputeMs, parent.maxComputeMs);
assert.deepEqual(manifest.screen.order,
  Array.from({length: 4}, () => ({version: 'v2.22', strategy: 'grow-17'})));
assert.deepEqual(manifest.confirmation.order,
  Array.from({length: 12}, () => ({version: 'v2.22', strategy: 'grow-17'})));
assert.equal(manifest.screen.id, 'screen-05');
assert.equal(manifest.confirmation.id, 'confirm-05');
assert.equal(manifest.activationPrerequisite.completedNativeFinals, 12);
assert.equal(manifest.activationPrerequisite.winsStrictlyLessThan, 6);
const harness = read('harness.js');
assert(harness.includes("const slots=mode==='screen'?manifest.screen.order:manifest.confirmation.order;"));
assert.equal(manifest.parentCandidate, 'grow-15');
assert.equal(manifest.activationPrerequisite.candidate, 'grow-16');
assert.equal(manifest.activationPrerequisite.batch, 'confirm-04');
assert.deepEqual(manifest.screen.nativeOutcomes,
  ['win_le150', 'win_late', 'death', 'deadline_cutoff']);
assert.deepEqual(manifest.activationPrerequisite.nativeOutcomes, manifest.screen.nativeOutcomes);
assert.equal(manifest.reusedVersionPolicy.wins, 11);
assert.equal(manifest.reusedVersionPolicy.nativeFinals, 12);
assert(harness.includes("if(mode==='confirm'&&!screenReady(runFinals))"));
const gateSource = section(harness, 'function screenReady(rows)', '\n window.ocrLabEvent=');
const screenReady = new Function('manifest', gateSource + '\nreturn screenReady;')(manifest);
const native = ['win_le150', 'win_le150', 'death', 'deadline_cutoff'].map((outcome, i) =>
  ({runId: 'screen-05-' + (i + 1), batch: 'screen-05', version: 'v2.22', strategy: 'grow-17', outcome}));
assert.equal(screenReady(native), true, 'Two wins among four native finals');
assert.equal(screenReady(native.slice(0, 3)), false, 'Incomplete screen');
assert.equal(screenReady(native.map((r, i) => i === 1 ? {...r, outcome: 'death'} : r)), false, 'One win');
for (const outcome of ['infrastructure_error', 'controller_abort', 'unknown'])
  assert.equal(screenReady(native.map((r, i) => i === 3 ? {...r, outcome} : r)), false,
    'Nonnative final cannot satisfy gate: ' + outcome);
assert.equal(screenReady(native.map((r, i) => i === 3 ? {...r, runId: native[0].runId} : r)), false,
  'Duplicate run cannot satisfy four-final gate');
assert.equal(screenReady([...native, {...native[2], runId: 'extra'}]), false, 'Exactly four finals');
assert.equal(screenReady([...native, {...native[2], batch: 'screen-03', strategy: 'grow-15'}]), true,
  'Parent evidence is excluded from candidate screen');
assert.equal(screenReady(native.map((r, i) => i === 3 ? {...r, version: 'v2.13'} : r)), false,
  'v2.13 cannot fill a v2.22 slot');

// Verify the built perception and controller against the frozen tested parent.
// Candidate labels change; input capture, geometry and dispatch stay exact.
const parentPage = fs.readFileSync(path.join(dir, '../grow15/frozen/screen-03/index.html'), 'utf8');
function section(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a);
  assert(a >= 0 && b > a, 'Locate source section: ' + start);
  return text.slice(a, b);
}
for (const [start, end] of [
  ['function readImage(', '\nfunction hudSpeed('],
  ['function tick(runId)', '\nlet lastMap=null;']
]) assert.equal(section(page, start, end).replaceAll('grow-17', 'grow-15'),
  section(parentPage, start, end), 'Unchanged source section: ' + start);
assert(page.includes("gameChoice.value='/v2.22';"), 'Candidate defaults to v2.22');
assert(!page.includes('__GROW_GAMES__'));
let scripts = 0;
for (const match of page.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
  if (!match[1].trim()) continue;
  new vm.Script(match[1], {filename: 'grow17-inline-' + scripts + '.js'});
  scripts++;
}
new vm.Script(harness, {filename: 'grow17-harness.js'});
assert.equal(scripts, 2);
console.log(JSON.stringify({result: 'PASS', scripts,
  sharedInputs: 'byte-identical hashes', perceptionAndTick: 'exact after candidate-label normalization',
  screen: '4 unique native v2.22 finals and >=2 wins; gate negative cases passed', confirmation: '12 new v2.22 starts',
  protocolHash: manifest.protocolHash, plannerHash: manifest.plannerHash,
  scope: 'source integrity and syntax only; no browser, server or game executed'}, null, 2));
