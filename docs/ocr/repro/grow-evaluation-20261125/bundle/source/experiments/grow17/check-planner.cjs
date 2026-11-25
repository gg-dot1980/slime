#!/usr/bin/env node
'use strict';
// Inactive-candidate regression only: no browser, server, pixels, or log writes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const parentPath = path.resolve(__dirname, '../grow15/frozen/screen-03/planner.js');
const candidatePath = path.join(__dirname, 'planner.js');
const parentSource = fs.readFileSync(parentPath, 'utf8');
const candidateSource = fs.readFileSync(candidatePath, 'utf8');
const oldGuard = '  if (mapOK) {';
const newGuard = '  if (mapOK && !immune) {';
assert.equal(parentSource.split(oldGuard).length, 2, 'Unique scout-generation guard');
assert.equal(candidateSource, parentSource.replace(oldGuard, newGuard),
  'Only the scout guard changes; parent is frozen Grow15, not Grow16');
const parentLines = parentSource.split('\n'), candidateLines = candidateSource.split('\n');
assert.equal(candidateLines.length, parentLines.length);
assert.equal(parentLines.filter((line, i) => line !== candidateLines[i]).length, 1);
const originalRedLine = 'if (red && !immune) o.upper = Math.max(o.upper, Math.min(cappedGame ? 200 : Infinity, playerHigh * 1.12));';
assert(candidateSource.includes(originalRedLine), 'Original Grow15 red upper bound retained');
assert(!candidateSource.includes('o.upper = cappedGame ? 200 :'), 'Grow16 red change is absent');

function load(source, filename) {
  const context = {module: {exports: {}}, performance: {now: () => 0}};
  vm.runInNewContext(source, context, {filename});
  assert.equal(typeof context.module.exports.planGrow15, 'function');
  return context.module.exports.planGrow15;
}
const parent = load(parentSource, parentPath), candidate = load(candidateSource, candidatePath);
const json = value => JSON.parse(JSON.stringify(value));
function evaluate(fn, args) {
  const result = json(fn(...structuredClone(args)));
  assert.equal(result.strategy, 'grow-15', 'Original output strategy string retained');
  assert(Number.isFinite(result.gain) && Number.isFinite(result.clearance));
  const dirs = [[1, 0], [Math.SQRT1_2, Math.SQRT1_2], [0, 1],
    [-Math.SQRT1_2, Math.SQRT1_2], [-1, 0], [-Math.SQRT1_2, -Math.SQRT1_2],
    [0, -1], [Math.SQRT1_2, -Math.SQRT1_2]];
  assert(dirs.some(([x, y]) => Math.abs(x - result.x) < 1e-12 && Math.abs(y - result.y) < 1e-12),
    'Valid scenes emit an actual keyboard octant');
  return result;
}
const marker = (x, y, red = false) => ({x: 72 + x * 144 / 10400,
  y: 50 + y * 100 / 7200, red, area: 20});
const map = (markers = [], extra = {}) => ({width: 144, height: 100,
  pixelRatio: 1, player: {x: 72, y: 50}, viewWidth: 2000,
  viewHeight: 1163, growMarkers: markers, threats: [], ...extra});
const food = (x, y, r = 10) => ({x, y, r, npc: false});
const body = (x, y, r, extra = {}) => ({x, y, r, visualR: r, npc: true,
  labelSeen: true, localReliable: true, vx: 0, vy: 0, ...extra});
const input = ({objects = [], r = 80, minimap = map(), speed = 220,
  velocity = {x: -80, y: 0}, old = {x: -1, y: 0}, version = 'v2.22'} = {}) =>
  [objects, r, minimap, speed, velocity, old, version];
const cases = [];
function equalCase(name, args, group) {
  const before = evaluate(parent, args), after = evaluate(candidate, args);
  assert.deepEqual(after, before, name + ': full JSON output unchanged');
  cases.push({name, group, result: 'PASS'});
  return after;
}

const ordinary = [
  ['empty-view', {}],
  ['food-lane', {objects: [food(-280, 40), food(250, 90)]}],
  ['edible-moving-body', {objects: [body(350, 30, 35, {vx: 60, vy: -20}), food(-200, 70)]}],
  ['neutral-band', {objects: [body(180, 0, 80), food(-240, 50)]}],
  ['clipped-body', {objects: [body(250, 80, 70, {clipped: true, dangerRadius: 140}), food(-240, 70)]}],
  ['near-wall', {objects: [food(-100, 50), food(180, 80)],
    minimap: map([], {visibleWalls: [105, 3000, 1000, 3000]})}],
  ['no-minimap', {objects: [body(350, 30, 35), food(-240, 50)], minimap: null}]
];
for (const [name, scenario] of ordinary) for (const version of ['v2.13', 'v2.22'])
  equalCase(version + '-' + name, input({...scenario, version}), version + ' ordinary unchanged');

const redScenes = [
  ['matched-map-red', {objects: [body(360, 0, 40), food(-240, 70)],
    minimap: map([marker(360, 0, true)])}],
  ['visible-red', {objects: [body(220, 0, 40, {isRed: true}), food(-240, 70)]}]
];
for (const [name, scenario] of redScenes) for (const version of ['v2.13', 'v2.22'])
  equalCase(version + '-' + name, input({...scenario, version}), version + ' red unchanged');

for (const r of [25, 80, 155, 185]) {
  const args = input({r, minimap: map([marker(1400, 0)])});
  const after = equalCase('v2.22-preimmune-HUD' + r + '-offscreen-white', args,
    'v2.22 preimmune scout unchanged');
  assert.equal(after.immune, false);
  assert(after.scoutTargets > 0, 'Preimmune scout remains available');
}
for (const r of [186, 190]) {
  const args = input({r, version: 'v2.13', minimap: map([marker(1400, 0)])});
  const after = equalCase('v2.13-high-HUD' + r + '-offscreen-white', args,
    'v2.13 high-HUD scout unchanged');
  assert.equal(after.immune, false, 'Cap200 immunity is not applied to v2.13');
  assert(after.scoutTargets > 0);
}

for (const r of [186, 190]) for (const [name, scenario] of [
  ['food-no-markers', {objects: [food(-280, 40)]}],
  ['body-no-markers', {objects: [body(-440, 0, 80)]}],
  ['red-only', {objects: [body(350, 0, 40, {isRed: true}), food(-280, 40)],
    minimap: map([marker(350, 0, true)])}],
  ['white-filtered-in-view', {minimap: map([marker(200, 0)])}]
]) {
  const after = equalCase('v2.22-immune-HUD' + r + '-' + name, input({...scenario, r}),
    'immune without eligible scout unchanged');
  assert.equal(after.immune, true);
  assert.equal(after.scoutTargets, 0);
}

// Positive controls use an offscreen body represented only by a visible map dot.
// The oracle leaves red markers, map threats, all real objects and all other
// inputs intact; it removes only non-red markers from the ORIGINAL Grow15 input.
const positiveControls = [];
for (const r of [186, 190]) for (const kind of ['scout-only', 'food-present', 'body-present']) {
  const objects = kind === 'scout-only' ? [] : kind === 'food-present' ?
    [food(-280, 40)] : [body(-440, 0, 80)];
  const args = input({r, objects, minimap: map([marker(1400, 0), marker(-1200, 0, true)])});
  const oracleArgs = structuredClone(args);
  oracleArgs[2].growMarkers = oracleArgs[2].growMarkers.filter(m => m.red === true);
  const before = evaluate(parent, args), after = evaluate(candidate, args), oracle = evaluate(parent, oracleArgs);
  const name = 'v2.22-immune-HUD' + r + '-' + kind;
  assert(before.scoutTargets > 0, name + ': positive control has a real scout candidate');
  assert.equal(after.scoutTargets, 0, name + ': scout candidates disabled');
  assert(!after.target?.mapOnly, name + ': no mapOnly selected target');
  assert.deepEqual(after, oracle, name + ': equals parent with only non-red map markers removed');
  if (kind === 'scout-only') {
    assert.equal(before.target?.mapOnly, true);
    assert.equal(after.target, null);
    assert.equal(before.gain, 0, 'Old scout never contributed path gain');
    assert.equal(after.gain, 0, 'Exploration without food/body has zero path gain');
    assert.equal(before.first, 0);
    assert.equal(after.first, 4, 'Existing exploration follows the previous westward direction');
  } else if (kind === 'food-present') {
    assert.equal(after.target?.npc, false);
    assert(Math.abs(after.gain - .38) < 1e-12, 'Real food retains its original radius-gain value');
  } else {
    assert.equal(after.target?.npc, true);
    const expected = Math.min(200 - r, .75 * (Math.sqrt(r * r + .55 * 80 * 80) - r));
    assert(Math.abs(after.gain - expected) < 1e-12, 'Real body retains its original expected gain');
  }
  positiveControls.push({name, oldFirst: before.first, newFirst: after.first,
    oldScoutTargets: before.scoutTargets, newScoutTargets: after.scoutTargets,
    oldGain: before.gain, newGain: after.gain,
    newTarget: after.target ? (after.target.npc ? 'bodyNpc' : 'food') : null,
    matchesParentWithOnlyWhiteMarkersRemoved: true});
  cases.push({name, group: 'immune scout disabled with original-gain oracle', result: 'PASS'});
}

const groupCounts = {};
for (const c of cases) groupCounts[c.group] = (groupCounts[c.group] || 0) + 1;
const sha = source => crypto.createHash('sha256').update(source).digest('hex');
console.log(JSON.stringify({result: 'PASS', sourceLineChanges: 1,
  parentPlannerHash: sha(parentSource), candidatePlannerHash: sha(candidateSource),
  plannerCases: cases.length, groupCounts, positiveControls,
  scope: 'Pure planner regression only; preserves gain semantics, not a gameplay-success or safety claim'}, null, 2));
