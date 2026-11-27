#!/usr/bin/env node
'use strict';
// Pure, deterministic planner checks. No browser, pixels, game state, or writes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const parentPath = path.resolve(__dirname, '../grow15/frozen/screen-03/planner.js');
const candidatePath = path.join(__dirname, 'planner.js');
const parentSource = fs.readFileSync(parentPath, 'utf8');
const candidateSource = fs.readFileSync(candidatePath, 'utf8');
const oldLine = '    if (red && !immune) o.upper = Math.max(o.upper, Math.min(cappedGame ? 200 : Infinity, playerHigh * 1.12));';
const newLine = '    if (red && !immune) o.upper = cappedGame ? 200 : Math.max(o.upper, Math.min(cappedGame ? 200 : Infinity, playerHigh * 1.12));';
assert.equal(parentSource.split(oldLine).length, 2, 'Unique source line');
assert.equal(candidateSource, parentSource.replace(oldLine, newLine),
  'Candidate must differ from frozen grow15 by this exact single line only');
const parentLines = parentSource.split('\n'), candidateLines = candidateSource.split('\n');
assert.equal(parentLines.length, candidateLines.length);
assert.equal(parentLines.filter((line, i) => line !== candidateLines[i]).length, 1);

function load(source, filename) {
  const context = {module: {exports: {}}, performance: {now: () => 0}};
  vm.runInNewContext(source, context, {filename});
  assert.equal(typeof context.module.exports.planGrow15, 'function');
  return context.module.exports.planGrow15;
}
const parent = load(parentSource, parentPath), candidate = load(candidateSource, candidatePath);
const json = value => JSON.parse(JSON.stringify(value));
const evaluate = (fn, args) => json(fn(...structuredClone(args)));
const marker = (x, y, red = true) => ({x: 72 + x * 144 / 10400,
  y: 50 + y * 100 / 7200, red, area: 8});
const map = (markers = [], extra = {}) => ({width: 144, height: 100,
  pixelRatio: 1, player: {x: 72, y: 50}, viewWidth: 2000,
  viewHeight: 1163, growMarkers: markers, threats: [], ...extra});
const body = (x, y, r, extra = {}) => ({x, y, r, visualR: r, npc: true,
  labelSeen: true, localReliable: true, vx: 0, vy: 0, ...extra});
const food = (x, y, r = 10) => ({x, y, r, npc: false});
const input = ({objects = [], r = 80, minimap = map(), speed = 250,
  velocity = {x: 100, y: 0}, old = {x: 1, y: 0}, version = 'v2.22'} = {}) =>
  [objects, r, minimap, speed, velocity, old, version];
const cases = [];
function equalCase(name, args, group) {
  const before = evaluate(parent, args), after = evaluate(candidate, args);
  assert.deepEqual(after, before, name + ': full JSON output unchanged');
  assert.equal(after.strategy, 'grow-15', name + ': original strategy string retained');
  cases.push({name, group, result: 'PASS'});
}

const unchangedScenarios = [
  ['empty-view', {}],
  ['food-lane', {objects: [food(180, 0), food(230, 40), food(-120, 70)]}],
  ['edible-moving-body', {objects: [body(350, 30, 35, {vx: 65, vy: -20}), food(-130, 40)]}],
  ['neutral-band', {objects: [body(180, 0, 80), food(250, 0), food(0, -150)]}],
  ['large-unflagged-body', {objects: [body(360, 0, 195), food(180, 0), food(-120, 70)]}],
  ['clipped-unflagged-body', {objects: [body(240, -90, 70,
    {clipped: true, dangerRadius: 130}), food(-130, 70)]}],
  ['near-wall', {objects: [food(-100, 50), food(180, 80)],
    minimap: map([], {visibleWalls: [105, 3000, 1000, 3000]})}],
  ['no-minimap', {objects: [body(350, 30, 35), food(-100, 50)], minimap: null}],
  ['white-scout', {minimap: map([marker(1300, 100, false)])}]
];
for (const [name, scenario] of unchangedScenarios) {
  equalCase('v2.13-' + name, input({...scenario, version: 'v2.13'}), 'v2.13 unchanged');
  equalCase('v2.22-' + name, input(scenario), 'v2.22 no-red unchanged');
}

const redScenarios = [
  ['matched-map-red', {objects: [body(360, 0, 40), food(180, 0), food(-120, 70)],
    minimap: map([marker(360, 0)])}],
  ['visible-red', {objects: [body(220, 0, 40, {isRed: true}), food(-120, 70)]}],
  ['clipped-visible-red', {objects: [body(250, 80, 40,
    {isRed: true, clipped: true, dangerRadius: 100}), food(-120, 70)]}],
  ['multiple-red-corner', {objects: [body(300, 0, 45), body(0, 340, 60, {isRed: true}),
    food(-120, -100)], minimap: map([marker(300, 0)],
      {visibleWalls: [120, 5000, 125, 5000]})}],
  ['high-HUD-still-v2.13', {r: 190, objects: [body(360, 0, 40, {isRed: true}), food(-120, 70)]}]
];
for (const [name, scenario] of redScenarios)
  equalCase('v2.13-' + name, input({...scenario, version: 'v2.13'}), 'v2.13 red unchanged');

for (const [name, minimap, objects] of [
  ['no-body', map([marker(360, 0)]), [food(180, 0), food(-120, 70)]],
  ['far-body', map([marker(360, 0)]), [body(-700, 350, 35), food(-120, 70)]],
  ['legacy-map-threat', map([], {threats: [marker(360, 0)]}), [food(-120, 70)]]
]) equalCase('v2.22-unmatched-red-' + name, input({minimap, objects}), 'unmatched red unchanged');

for (const r of [186, 190]) for (const kind of ['matched-map-red', 'visible-red']) {
  const scenario = {r, objects: [body(300, 0, 40, {isRed: kind === 'visible-red'}),
    body(-280, 120, 110), food(-120, 70)],
    minimap: map(kind === 'matched-map-red' ? [marker(300, 0)] : [])};
  const args = input(scenario);
  equalCase('v2.22-immune-HUD' + r + '-' + kind, args, 'immune unchanged');
  assert.equal(evaluate(candidate, args).immune, true);
}
equalCase('v2.22-matched-red-already-capped', input({objects: [body(360, 0, 195),
  food(180, 0), food(-120, 70)], minimap: map([marker(360, 0)])}), 'already capped unchanged');

// One red body and one exact-position marker ensure the same unambiguous
// association. The oracle is the UNMODIFIED planner fed that body at r=200.
// Returned hazard internals are neither exposed nor instrumented.
const conservativeExamples = [];
for (const kind of ['matched-map-red', 'visible-red']) for (const x of [260, 360]) {
  const args = input({objects: [body(x, 0, 40, {isRed: kind === 'visible-red'}),
    food(180, 0), food(-120, 70)],
    minimap: map(kind === 'matched-map-red' ? [marker(x, 0)] : [])});
  const oracleArgs = structuredClone(args);
  oracleArgs[0][0].r = 200;
  oracleArgs[0][0].visualR = 200;
  const before = evaluate(parent, args), after = evaluate(candidate, args), oracle = evaluate(parent, oracleArgs);
  const name = 'v2.22-' + kind + '-underestimate-distance' + x;
  assert.deepEqual(after, oracle, name + ': matches original r=200 conservative oracle');
  assert.notDeepEqual(after, before, name + ': underestimated-red result changes');
  assert.equal(after.strategy, 'grow-15');
  assert.equal(after.threats, 1, name + ': single red is not double counted');
  if (x === 360) {
    assert.equal(before.first, 0, name + ': old initial direction is east');
    assert.equal(after.first, 3, name + ': conservative initial direction is southwest');
  } else {
    assert.equal(after.first, before.first, name + ': same path allows direct clearance comparison');
    assert.equal(after.second, before.second);
    const oldUpper = (80 + .5) * 1.12;
    assert(Math.abs((before.clearance - after.clearance) - .72 * (200 - oldUpper)) < 1e-9,
      name + ': clearance uses full200-radius envelope');
  }
  conservativeExamples.push({name, oldFirst: before.first, newFirst: after.first,
    oldClearance: before.clearance, newClearance: after.clearance,
    matchesUnmodified200RadiusOracle: true});
  cases.push({name, group: 'underestimated red conservative oracle', result: 'PASS'});
}

const groupCounts = {};
for (const c of cases) groupCounts[c.group] = (groupCounts[c.group] || 0) + 1;
const sha = source => crypto.createHash('sha256').update(source).digest('hex');
console.log(JSON.stringify({result: 'PASS',sourceLineChanges: 1,
  parentPlannerHash: sha(parentSource), candidatePlannerHash: sha(candidateSource),
  plannerCases: cases.length, groupCounts, conservativeExamples,
  scope: 'Pure planner source/regression checks only; not gameplay or safety proof'}, null, 2));
