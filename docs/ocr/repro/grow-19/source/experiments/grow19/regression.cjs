#!/usr/bin/env node
'use strict';
// Pure, deterministic regression for the inactive Grow19 candidate. No browser,
// server, live game or network. --write writes only this directory's result JSON.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const parent = path.resolve(__dirname, '../grow15/frozen/screen-03');
const paths = {
  parentPlanner: path.join(parent, 'planner.js'),
  source: path.join(parent, 'source-base.html'),
  geometry: path.join(parent, 'geometry.js'),
  fixtureGenerator: path.resolve(__dirname, '../grow15/geometry.synthetic.cjs'),
  candidatePlanner: path.join(__dirname, 'planner.js')
};
const text = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, fs.readFileSync(p, 'utf8')]));
const sourceHashes = Object.fromEntries(Object.entries(text).map(([k, s]) => [k, sha(s)]));
assert.equal(sourceHashes.parentPlanner, 'e89d6a8cb0201a8caf0314c023e16f37f63396dd44615bf4dcdc823077e0fd0e');
assert.equal(sourceHashes.geometry, 'f229b10be76816bdaec554b49a204dad8d77d4765d61dae168a5075d1d3033ec');
assert.equal(sourceHashes.source, 'e9d818294509cca36ccc41826c8138008705d313c99ba4cc28e21bd427dc1a6b');
const checks = [];
function check(name, pass, detail = null) {
  checks.push({name, pass: !!pass, detail});
  assert(pass, name);
}
function once(s, a, b) {
  assert.equal(s.split(a).length, 2, `Expected one source anchor: ${a}`);
  return s.replace(a, b);
}
const policyLine = '    if (cappedGame && o.geometryAccepted === 0 && finite(o.visualR) && o.visualR > 0) upper = Math.max(upper, (o.visualR + 6) / .808);';
const clippedLine = '    if (o.clipped) upper = Math.max(upper, o.dangerRadius || 0, o.r + 45);';
const diagnosticBlock = '    // Count deduplicated bodies whose effective bound increased after clipped\n' +
  '    // expansion and the 200 cap, before later red-map merging/expansion.\n' +
  '    if (cappedGame && upper > Math.min(200, o.clipped ?\n' +
  '        Math.max(beforeFallbackUpper, o.dangerRadius || 0, o.r + 45) : beforeFallbackUpper)) boundAdjustedCount++;\n';
let normalized = text.candidatePlanner.replaceAll('grow-19', 'grow-15').replaceAll('planGrow19', 'planGrow15');
normalized = once(normalized, '    recovering: false, target: null, boundAdjustedCount: 0});', '    recovering: false, target: null});');
normalized = once(normalized, '  let boundAdjustedCount = 0;\n', '');
normalized = once(normalized, '    const beforeFallbackUpper = upper;\n', '');
normalized = once(normalized, diagnosticBlock, '');
normalized = once(normalized, '    threats: localHazards.length, escaping, recovering, immune, boundAdjustedCount,', '    threats: localHazards.length, escaping, recovering, immune,');
const expectedPolicy = once(text.parentPlanner, clippedLine, policyLine + '\n' + clippedLine);
check('exact-single-policy-addition-after-removing-naming-and-count-only-diagnostics', normalized === expectedPolicy);
check('normalized-policy-is-frozen-research-proposal', sha(normalized) === '516ae8cab03c6f0a8efd8615826a61a87645898adc15ca45b2f0dc6252398dac');
check('original-hard-soft-rule-retained', normalized.includes('const hard = red || o.clipped || chance >= .45;'));
check('grow18-nominal-lethal-hard-change-not-carried', !normalized.includes('const hard = red || o.clipped || o.r >='));
check('original-200-cap-retained', normalized.includes('if (cappedGame) { lower = Math.min(200, lower); upper = Math.min(200, upper); }'));

function load(s) {const box = {module: {exports: {}}}; vm.createContext(box); vm.runInContext(s, box); return box;}
function between(s, first, next) {const a = s.indexOf(first), b = s.indexOf(next, a + first.length); assert(a >= 0 && b > a); return s.slice(a, b);}
const oldPlan = load(text.parentPlanner).planGrow15;
const newPlan = load(text.candidatePlanner).planGrow19;
const perception = load(between(text.source, 'function components(', 'function canvasUiMasks(') +
  between(text.source, 'function hasSlimeLabel(', 'let imageState=null;') + text.geometry + '\n' +
  between(text.fixtureGenerator, 'function scene(', 'const specs='));
const plain = v => JSON.parse(JSON.stringify(v));
function policyOutput(p, stripOracleRUpper = false) {
  const q = plain(p); delete q.boundAdjustedCount; q.strategy = 'grow-15';
  if (stripOracleRUpper && q.target) delete q.target.rUpper;
  return q;
}
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function classify(p) {return p.eligibleNpc ? 'npc-meal' : p.threats ? (p.uncertainNpc ? 'soft-hazard' : 'hard-hazard') : p.neutralNpc ? 'neutral-npc' : p.target?.npc === false ? 'food' : 'none';}
function summary(p) {return {classification: classify(p), eligibleNpc: p.eligibleNpc ?? 0,
  neutralNpc: p.neutralNpc ?? 0, threats: p.threats, uncertainNpc: p.uncertainNpc ?? 0,
  gain: p.gain, reason: p.reason, direction: p.name, targetUpper: p.target?.upper ?? null,
  clearance: p.clearance, boundAdjustedCount: p.boundAdjustedCount ?? null};}
function call(fn, objects, hud, version = 'v2.22', map = null) {return plain(fn(objects, hud, map, 250, {x: 0, y: 0}, {x: 1, y: 0}, version));}
function physicalClass(player, npc) {return player >= npc * 1.08 ? 'npc-meal' : npc >= player * 1.08 ? 'lethal-npc' : 'neutral-npc';}
function fixture(spec) {
  const s = perception.scene(spec), p = perception.components(s.image, s.w, s.h, 3).sort((a, b) => b.area - a.area)[0];
  assert(p);
  const geometry = perception.refineSlimeGeometry(s.image, s.w, s.h, p);
  const labelSeen = perception.hasSlimeLabel(s.image, s.w, s.h, p);
  const originalRadius = perception.highlightRadius(s.image, s.w, s.h, p);
  return {component: plain(p), geometry: plain(geometry), object: {x: 260, y: 0,
    r: geometry ? geometry.r : originalRadius, visualR: p.r, originalRadius,
    geometryAccepted: geometry ? 1 : 0, confidence: geometry?.confidence ?? null,
    npc: labelSeen || p.r > 20, labelSeen, localReliable: !p.clipped && labelSeen &&
      Math.max(p.bw, p.bh) / Math.min(p.bw, p.bh) <= 1.4 && p.area * 9 / (p.bw * p.bh) >= .5,
    clipped: p.clipped, blocked: false, isRed: false, vx: 0, vy: 0}};
}
const specs = [];
for (const R of [96, 120]) specs.push(
  {id: `R${R}-no-highlight`, spec: {R, wobble: .8, highlights: [], text: true}},
  {id: `R${R}-half-highlight`, spec: {R, wobble: .8, cut: true, text: true}},
  {id: `R${R}-full-highlight`, spec: {R, wobble: .8, text: true}}
);
specs.push({id: 'R40-large-outline-no-highlight', spec: {R: 40, wobble: 1.15, highlights: [], text: true}});
const fixtures = specs.map(s => ({...s, ...fixture(s.spec)}));
const cases = [];
for (const f of fixtures) for (const hud of [60, 80, 100, 120, 180, 195]) for (const version of ['v2.13', 'v2.22']) {
  check(`${f.id}/HUD${hud}/outside-true-contact`, Math.hypot(f.object.x, f.object.y) > .72 * (hud + f.spec.R));
  const a = call(oldPlan, [f.object], hud, version), b = call(newPlan, [f.object], hud, version);
  const unchanged = equal(policyOutput(a), policyOutput(b));
  if (version === 'v2.13' || f.object.geometryAccepted === 1) check(`${f.id}/HUD${hud}/${version}/negative-control-unchanged`, unchanged);
  // The old planner already accepts rUpper. Its public input contract provides
  // an independent integration oracle for this stronger-bound-only change.
  const oracleObject = {...f.object};
  const injectBound = version === 'v2.22' && f.object.geometryAccepted === 0;
  if (injectBound) oracleObject.rUpper = (f.object.visualR + 6) / .808;
  const oracle = call(oldPlan, [oracleObject], hud, version);
  check(`${f.id}/HUD${hud}/${version}/legacy-rUpper-contract`, equal(policyOutput(b), policyOutput(oracle, injectBound)));
  check(`${f.id}/HUD${hud}/${version}/counter`, b.boundAdjustedCount === (injectBound ? 1 : 0));
  cases.push({id: `${f.id}/HUD${hud}/${version}`, fixture: f.id, hud, gameVersion: version,
    fixturePhysicalClass: physicalClass(hud, f.spec.R), old: summary(a), candidate: summary(b),
    unchangedPolicyOutput: unchanged});
}
for (const id of ['R96-no-highlight', 'R96-half-highlight']) {
  const row = cases.find(c => c.fixture === id && c.hud === 100 && c.gameVersion === 'v2.22');
  check(`${id}/removes-synthetic-false-meal`, row.fixturePhysicalClass === 'neutral-npc' && row.old.classification === 'npc-meal' && row.candidate.classification === 'neutral-npc');
}
const costCases = cases.filter(c => c.fixturePhysicalClass === 'npc-meal' && c.old.classification === 'npc-meal' && c.candidate.classification !== 'npc-meal');
check('negative-growth-tradeoff-is-retained', costCases.some(c => c.fixture === 'R40-large-outline-no-highlight' && c.hud === 60 && c.candidate.classification === 'soft-hazard'));

const controls = [];
const food = {x: 260, y: 0, r: 10, visualR: 10, geometryAccepted: 0, npc: false, clipped: false, blocked: false, vx: 0, vy: 0};
for (const hud of [25, 60, 100, 180, 195]) for (const version of ['v2.13', 'v2.22']) {
  const a = call(oldPlan, [food], hud, version), b = call(newPlan, [food], hud, version);
  check(`ordinary-food/HUD${hud}/${version}`, equal(policyOutput(a), policyOutput(b)) && b.boundAdjustedCount === 0 && b.gain === .38);
  controls.push({id: `ordinary-food/HUD${hud}/${version}`, old: summary(a), candidate: summary(b)});
}
const rejected = fixtures.find(f => f.id === 'R96-no-highlight').object;
for (const [id, change] of [
  ['geometry-field-missing', {geometryAccepted: undefined}],
  ['geometry-field-null', {geometryAccepted: null}],
  ['visual-radius-missing', {visualR: undefined}],
  ['existing-upper-at-cap', {rUpper: 200}],
  ['clipped-expansion-dominates', {clipped: true, dangerRadius: 160}]
]) {
  const object = {...rejected, ...change}, a = call(oldPlan, [object], 100), b = call(newPlan, [object], 100);
  check(`${id}/unchanged-and-counter-zero`, equal(policyOutput(a), policyOutput(b)) && b.boundAdjustedCount === 0);
  controls.push({id, old: summary(a), candidate: summary(b)});
}
const duplicates = [rejected, {...rejected, x: rejected.x + 1}];
const duplicateResult = call(newPlan, duplicates, 100);
check('counter-is-after-body-deduplication', duplicateResult.boundAdjustedCount === 1);
controls.push({id: 'two-coincident-body-aliases', candidate: summary(duplicateResult)});

const originalHazardCases = [];
for (const hud of [180, 185, 186, 195]) for (const distance of [320, 400, 500]) {
  const object = {x: distance, y: 0, r: 200, visualR: 200, geometryAccepted: 1,
    npc: true, labelSeen: true, localReliable: true, clipped: false, blocked: false, isRed: false, vx: 0, vy: 0};
  check(`exact-R200/HUD${hud}/x${distance}/outside-contact`, distance > .72 * (hud + 200));
  const a = call(oldPlan, [object], hud), b = call(newPlan, [object], hud);
  check(`exact-R200/HUD${hud}/x${distance}/unchanged`, equal(policyOutput(a), policyOutput(b)) && b.boundAdjustedCount === 0);
  if (hud < 186) check(`exact-R200/HUD${hud}/x${distance}/old-soft-rule-retained`, b.uncertainNpc === 1);
  originalHazardCases.push({hud, distance, fixturePhysicalClass: physicalClass(hud, 200), old: summary(a), candidate: summary(b)});
}
for (const [id, objects, hud, map] of [['invalid-objects', null, 100, null], ['invalid-HUD', [], 0, null], ['stale-visible-map', [], 100, {stale: true}]]) {
  const a = call(oldPlan, objects, hud, 'v2.22', map), b = call(newPlan, objects, hud, 'v2.22', map);
  check(`${id}/stop-unchanged-and-counter-zero`, equal(policyOutput(a), policyOutput(b)) && b.boundAdjustedCount === 0 && b.x === 0 && b.y === 0);
  controls.push({id, old: summary(a), candidate: summary(b)});
}
check('all-read-inputs-unchanged', Object.entries(paths).every(([k, p]) => sha(fs.readFileSync(p)) === sourceHashes[k]));
const report = {schema: 1, createdAt: new Date().toISOString(), status: 'synthetic regression only; inactive candidate',
  strategy: 'grow-19', parent: 'frozen grow-15/screen-03', sourceHashes,
  normalizedPolicyHash: sha(normalized), scriptHash: sha(fs.readFileSync(__filename)),
  derivedFromResearch: {scriptHash: '7ec9df82caac5888781c6104b8b0a797eb618db154f1df94278647ece8091d7b',
    resultHash: 'a3df57cd8b3446ab4bd0eb107e0cfab4103cd7c993293439f6086c260c774f63'},
  environment: {node: process.version, platform: process.platform, arch: process.arch, dependencies: 'Node standard libraries only', browser: null, seed: 'fixed synthetic inputs, no RNG'},
  command: 'node experiments/grow19/regression.cjs --write',
  change: {policy: policyLine.trim(), scope: 'v2.22 geometryAccepted exactly0 only, all HUD stages',
    diagnostic: 'boundAdjustedCount counts deduplicated NPC bodies whose bound is strictly higher after original clipped expansion and200 cap, before map-red association/red expansion and before local-hazard distance/36 limit. A later red expansion can erase this difference; the counter does not count deaths avoided or final local hazards.',
    diagnosticStopValue: 0, liveActivated: false},
  counts: {pixelFixtures: fixtures.length, plannerCases: cases.length + controls.length + originalHazardCases.length,
    assertions: checks.length, passedAssertions: checks.filter(c => c.pass).length, liveGames: 0},
  fixtures, cases, controls, originalHazardCases, negativeGrowthTradeoffs: costCases, checks,
  limits: [
    'Ideal complete continuous polygon obeys V>=.808R, but current components do not certify a full unoccluded outline. Neither labelSeen nor localReliable proves it.',
    '+6 world units is the fixed step3/two-cell heuristic for the archived2000-wide ratio1 capture, not a universal pixel/occlusion bound.',
    'The inherited circle/label fixtures are synthetic algorithm tests, not exact browser polygon/font/anti-aliasing renders or real captured game images.',
    'Fixture physical radius is used only to label expected outcomes; the planner receives derived visible estimates. No hidden live-game state is read.',
    'The new floor can incorrectly discard truly edible prey; all encountered negative meal-to-nonmeal cases are retained in negativeGrowthTradeoffs.',
    'Accepted geometry, v2.13, ordinary food and original hard/soft classifier remain unchanged. This candidate does not include Grow18.',
    'The original exact-radius200 soft-hazard behavior at HUD180/185 remains; cases start outside physical contact and are planner tests only.',
    'Tracking/blocked resets remain unchanged. These tests cannot prove live survival, growth, success rate or OCR4 acceptance.'
  ]};
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(__dirname, 'regression-result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({status: 'passed', counts: report.counts, sourceHashes,
    normalizedPolicyHash: report.normalizedPolicyHash, scriptHash: report.scriptHash,
    negativeGrowthTradeoffs: report.negativeGrowthTradeoffs}, null, 2));
} else console.log(JSON.stringify(report, null, 2));
