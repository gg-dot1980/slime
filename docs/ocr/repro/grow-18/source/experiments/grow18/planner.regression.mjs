// Bounded pure-planner/stop-contract checks. No game, browser or server is started.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const argument = name => {
  const at = process.argv.indexOf(name);
  return at < 0 ? null : process.argv[at + 1];
};
const baselinePath = path.resolve(argument('--baseline') || path.join(dir,
  '../../../../grow-repro-publish/source/experiments/grow15/frozen/screen-03/planner.js'));
const controllerPath = path.resolve(argument('--controller') || path.join(dir,
  '../../../../grow-repro-publish/source/experiments/grow15/frozen/screen-03/source-base.html'));
const baselineSource = fs.readFileSync(baselinePath, 'utf8');
const candidateSource = fs.readFileSync(path.join(dir, 'planner.js'), 'utf8');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const sha = source => createHash('sha256').update(source).digest('hex');
assert.equal(sha(baselineSource), 'e89d6a8cb0201a8caf0314c023e16f37f63396dd44615bf4dcdc823077e0fd0e');
assert.equal(sha(controllerSource), 'e9d818294509cca36ccc41826c8138008705d313c99ba4cc28e21bd427dc1a6b');

// The byte-level contract permits names, the one classification condition, and
// three output counters. It forbids an inherited Grow16 or Grow17 policy change.
const diagnosticBlock = `
    // Numeric diagnostics only: local hazards after the existing range/limit filter.
    hardThreats: localHazards.filter(o => o.hard).length,
    softThreats: localHazards.filter(o => !o.hard).length,
    promotedLethalThreats: localHazards.filter(o => !o.mapOnly && !o.isRed && !o.mapRed &&
      !o.clipped && o.r >= playerLow * 1.08 && clamp((o.upper - playerLow * 1.08) /
        Math.max(2, o.upper - o.lower), .12, 1) < .45).length,`;
assert(candidateSource.includes(diagnosticBlock));
const normalizedSource = candidateSource
  .replaceAll('grow-18', 'grow-15').replaceAll('planGrow18', 'planGrow15')
  .replace('const hard = red || o.clipped || o.r >= playerLow * 1.08 || chance >= .45;',
    'const hard = red || o.clipped || chance >= .45;')
  .replace(', hardThreats: 0, softThreats: 0, promotedLethalThreats: 0', '')
  .replace(diagnosticBlock, '');
assert.equal(normalizedSource, baselineSource, 'Unexpected change outside the one-rule/diagnostics contract');
function load(source, symbol) {
  const context = {performance: {now: () => 1000}};
  vm.createContext(context);
  vm.runInContext(source + ';this.run=' + symbol, context);
  return context.run;
}
const before = load(baselineSource, 'planGrow15');
const after = load(candidateSource, 'planGrow18');
const plain = value => JSON.parse(JSON.stringify(value));
const withoutNamesAndDiagnostics = value => {
  const copy = plain(value);
  delete copy.strategy;
  delete copy.hardThreats;
  delete copy.softThreats;
  delete copy.promotedLethalThreats;
  return copy;
};
const rows = [];
let cases = 0;
const npc = (x, y, r, extra = {}) => ({x, y, r, visualR: r,
  geometryAccepted: 1, confidence: .98, originalRadius: r,
  npc: true, labelSeen: true, localReliable: true, isRed: false,
  clipped: false, blocked: false, vx: 0, vy: 0, ...extra});
const food = (x, y, r = 10) => ({x, y, r, visualR: r, npc: false,
  clipped: false, blocked: false, vx: 0, vy: 0});
const map = extra => ({width: 144, height: 144 * 7200 / 10400,
  player: {x: 72, y: (144 * 7200 / 10400) / 2}, growMarkers: [],
  visibleWalls: [2500, 2500, 2500, 2500], viewWidth: 2000,
  viewHeight: 1163, observedAt: 1000, ...extra});
const args = (objects, hud, version = 'v2.22', observed = map()) =>
  [objects, hud, observed, 210, {x: 0, y: 0}, {x: 1, y: 0}, version];
function legalAndFinite(output) {
  assert(Number.isFinite(output.gain));
  assert(Number.isFinite(output.clearance));
  assert(output.x === 0 && output.y === 0 ||
    Math.abs(Math.hypot(output.x, output.y) - 1) < 1e-12);
  if (output.x !== 0) assert([1, Math.SQRT1_2].includes(Math.abs(output.x)));
  if (output.y !== 0) assert([1, Math.SQRT1_2].includes(Math.abs(output.y)));
  assert.equal(output.hardThreats + output.softThreats, output.threats);
  assert(output.promotedLethalThreats <= output.hardThreats);
}
function unchanged(name, input) {
  const a = before(...input), b = after(...input);
  assert.deepEqual(withoutNamesAndDiagnostics(b), withoutNamesAndDiagnostics(a), name);
  legalAndFinite(b);
  assert.equal(b.promotedLethalThreats, 0, name);
  rows.push({name, type: 'full-output-unchanged', clearance: b.clearance,
    hard: b.hardThreats, soft: b.softThreats});
  cases++;
}

// Detector-level observations: isRed=false means the danger label was not
// detected, not that the renderer necessarily omitted it. A physical R=200 NPC
// has a white minimap dot at all these HUD values. At true player R>=182 it also
// has no danger text; HUD180/181 cases allow a missed danger-text observation.
// All starting distances are outside the actual .72*(playerR+200) contact zone.
for (const hud of [180, 181, 182, 183, 184, 185]) {
  for (const distance of [320, 400, 500]) {
    assert(distance > .72 * (hud + 200));
    const input = args([npc(distance, 0, 200), food(distance + 180, 0), food(distance + 185, 12)], hud);
    const a = before(...input), b = after(...input);
    assert.equal(a.uncertainNpc, 1);
    assert.equal(a.clearance, 1e6, 'Old nominally lethal body was absent from hard clearance');
    assert.equal(b.hardThreats, 1);
    assert.equal(b.softThreats, 0);
    assert.equal(b.promotedLethalThreats, 1);
    assert.equal(b.uncertainNpc, 0);
    assert(b.clearance > 4 && b.clearance < 1e6);
    legalAndFinite(b);
    rows.push({name: `nominal-200-hud-${hud}-distance-${distance}`, type: 'promoted',
      hud, distance, oldFirst: a.first, newFirst: b.first,
      oldSecond: a.second, newSecond: b.second,
      oldClearance: a.clearance, newClearance: b.clearance,
      oldUncertain: a.uncertainNpc, hard: b.hardThreats,
      soft: b.softThreats, promoted: b.promotedLethalThreats});
    cases++;
  }
}

// The nominal condition has the same inclusive 1.08 threshold as the game,
// evaluated against the existing HUD lower bound. This is not a new tuned gap.
const threshold = (182 - .5) * 1.08;
unchanged('just-below-nominal-lethal', args([npc(400, 0, threshold - .001), food(600, 0)], 182));
const boundary = after(...args([npc(400, 0, threshold), food(600, 0)], 182));
assert.equal(boundary.promotedLethalThreats, 1);
assert.equal(boundary.hardThreats, 1);
legalAndFinite(boundary);
rows.push({name: 'at-nominal-lethal-inclusive', type: 'promoted', threshold, clearance: boundary.clearance});
cases++;

for (const hud of [180, 181, 182, 183, 184, 185]) {
  unchanged(`nominal-190-below-lethal-hud-${hud}`, args([npc(400, 0, 190), food(600, 0)], hud));
}
for (const hud of [25, 90, 150, 175, 179]) {
  for (const body of [hud * .6, hud, 200]) {
    unchanged(`v222-existing-classification-${hud}-${body}`, args([npc(450, 0, body), food(300, 170)], hud));
  }
}
for (const hud of [25, 90, 179, 182, 186, 195]) {
  for (const body of [hud * .55, hud, hud * 1.3]) {
    unchanged(`v213-${hud}-${body}`, args([npc(450, 0, body), food(300, 170)], hud, 'v2.13'));
  }
}
for (const hud of [186, 190, 195]) {
  for (const withScout of [false, true]) {
    const observed = map({growMarkers: withScout ? [{x: 94, y: 49.84615384615385, red: false, area: 16}] : []});
    unchanged(`immune-${hud}-scout-${withScout}`, args([npc(400, 0, 200), food(350, 120)], hud, 'v2.22', observed));
    const result = after(...args([npc(400, 0, 200), food(350, 120)], hud, 'v2.22', observed));
    assert.equal(result.immune, true);
    assert.equal(result.threats, 0);
  }
}
unchanged('already-hard-red', args([npc(400, 0, 180, {isRed: true}), food(600, 0)], 100));
unchanged('already-hard-clipped', args([npc(900, 0, 200, {clipped: true, dangerRadius: 250}), food(600, 0)], 182));
unchanged('wall-recovery', args([food(200, 0), npc(-700, 0, 80)], 182, 'v2.22', map({visibleWalls: [150, 2500, 2500, 2500]})));

// Execute the unchanged controller's real release function and its observed
// dispatch branch with the stale planner output. This checks the existing input
// contract, not browser focus, KeyboardEvent delivery or a new UI integration.
const releaseSource = controllerSource.match(/function release\(\)\{[^\n]*\}/)?.[0];
const dispatchSource = "if(d.mapStatus==='lost')release();else move(d);";
assert(releaseSource && controllerSource.includes(dispatchSource));
for (const observed of [map({observedAt: 399}), map({stale: true})]) {
  const result = after(...args([npc(400, 0, 200)], 182, 'v2.22', observed));
  assert.equal(result.reason, 'stale-visible-frame');
  assert.equal(result.mapStatus, 'lost');
  assert.equal(result.x, 0);
  assert.equal(result.y, 0);
  legalAndFinite(result);
  const released = [];
  const context = {d: result, held: new Set(['ArrowRight', 'ArrowUp', ' ']),
    key: (type, key) => released.push([type, key]), move: () => {throw Error('Stale input moved');}};
  vm.createContext(context);
  vm.runInContext(releaseSource + dispatchSource, context);
  assert.equal(context.held.size, 0);
  assert.deepEqual(released, [['keyup', 'ArrowRight'], ['keyup', 'ArrowUp'], ['keyup', ' ']]);
  rows.push({name: observed.stale ? 'explicit-stale-release' : 'over-600ms-release', type: 'release-contract', keysReleased: released.length});
  cases++;
}

console.log(JSON.stringify({schema: 1, kind: 'pure planner and stop contract; no gameplay',
  pass: true, cases, baselineSha256: sha(baselineSource), plannerSha256: sha(candidateSource),
  controllerSha256: sha(controllerSource), regressionSha256: sha(fs.readFileSync(fileURLToPath(import.meta.url))),
  normalizedSourceExactlyParent: true,
  changedFirstHeadingsIn18PromotionScenes: rows.filter(r => r.oldFirst !== undefined && r.oldFirst !== r.newFirst).length,
  liveGames: 0, browserRuns: 0,
  limitations: ['Synthetic detector-level observations are not saved-pixel replay.',
    'No complete recorded planner inputs exist in the final numeric logs; no natural-game decisions were replayed.',
    'Geometry, radius intervals, scouting, gains, tracking, hazard range and scoring weights remain the parent policy.',
    'The real release function is checked with an in-memory key sink; browser focus and dispatch remain an integration check.'],
  rows}, null, 2));
