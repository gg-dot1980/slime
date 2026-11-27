#!/usr/bin/env node
'use strict';

// Isolated, deterministic research. No browser, network, game loop or saved
// pixels. Only --write writes a numeric report beside this script.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const os = require('node:os');
const base = path.resolve(__dirname, '../../grow-repro-publish');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const files = [
  'source/src/ocr-grow.html', 'source/src/game.html', 'source/src/game-v2.13.html',
  'source/experiments/grow15/planner.js', 'source/experiments/grow15/geometry.js',
  'source/experiments/grow15/build-lab.mjs',
  'source/experiments/grow15/geometry.synthetic.cjs',
  'results/grow17-late-cutoff-diagnostic.json'
];
const contents = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(base, f), 'utf8')]));
const inputHashes = Object.fromEntries(files.map(f => [f, sha(contents[f])]));
assert.equal(inputHashes['source/experiments/grow15/planner.js'], 'e89d6a8cb0201a8caf0314c023e16f37f63396dd44615bf4dcdc823077e0fd0e');
assert.equal(inputHashes['source/experiments/grow15/geometry.js'], 'f229b10be76816bdaec554b49a204dad8d77d4765d61dae168a5075d1d3033ec');

function between(s, first, next) {
  const i = s.indexOf(first), j = s.indexOf(next, i + first.length);
  assert(i >= 0 && j > i, `Missing frozen source boundary: ${first}`);
  return s.slice(i, j);
}
function load(code) {
  const box = {module: {exports: {}}};
  vm.createContext(box);
  vm.runInContext(code, box);
  return box;
}
const source = contents['source/src/ocr-grow.html'];
const plannerSource = contents['source/experiments/grow15/planner.js'];
const fixtureSource = contents['source/experiments/grow15/geometry.synthetic.cjs'];
const historical = JSON.parse(contents['results/grow17-late-cutoff-diagnostic.json']);
const perception = load(
  between(source, 'function components(', 'function canvasUiMasks(') +
  between(source, 'function hasSlimeLabel(', 'let imageState=null;') +
  contents['source/experiments/grow15/geometry.js'] + '\n' +
  between(fixtureSource, 'function scene(', 'const specs=')
);
const oldPlan = load(plannerSource).planGrow15;

// Exactly one proposed policy addition. It is evaluated only in this VM; no
// candidate, archived source, build or active lab file is written by this script.
const anchor = '    if (o.clipped) upper = Math.max(upper, o.dangerRadius || 0, o.r + 45);';
const addition = '    if (cappedGame && o.geometryAccepted === 0 && finite(o.visualR) && o.visualR > 0) upper = Math.max(upper, (o.visualR + 6) / .808);';
assert.equal(plannerSource.split(anchor).length, 2);
const proposedSource = plannerSource.replace(anchor, addition + '\n' + anchor);
assert.equal(proposedSource.replace(addition + '\n', ''), plannerSource);
const newPlan = load(proposedSource).planGrow15;
const checks = [];
function check(name, condition, detail = null) {
  checks.push({name, pass: !!condition, detail});
  assert(condition, name);
}
const plain = v => JSON.parse(JSON.stringify(v));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function classify(p) {
  return p.eligibleNpc ? 'npc-meal' : p.threats ? (p.uncertainNpc ? 'soft-hazard' : 'hard-hazard') : p.neutralNpc ? 'neutral-npc' : p.target?.npc === false ? 'food' : 'none';
}
function result(plan, object, hud, version) {
  const p = plain(plan([object], hud, null, 250, {x: 0, y: 0}, {x: 1, y: 0}, version));
  return {full: p, summary: {classification: classify(p), eligibleNpc: p.eligibleNpc,
    neutralNpc: p.neutralNpc, threats: p.threats, uncertainNpc: p.uncertainNpc,
    targetRadius: p.target?.r ?? null, targetUpper: p.target?.upper ?? null,
    targetGeometryAccepted: p.target?.geometryAccepted ?? null,
    gain: p.gain, reason: p.reason, direction: p.name, clearance: p.clearance}};
}
function physicalClass(player, npc) {
  return player >= npc * 1.08 ? 'npc-meal' : npc >= player * 1.08 ? 'lethal-npc' : 'neutral-npc';
}
function visibleObject(spec) {
  const s = perception.scene(spec);
  const p = perception.components(s.image, s.w, s.h, 3).sort((a, b) => b.area - a.area)[0];
  assert(p, 'Expected a synthetic body component');
  const geometry = perception.refineSlimeGeometry(s.image, s.w, s.h, p);
  const labelSeen = perception.hasSlimeLabel(s.image, s.w, s.h, p);
  const originalRadius = perception.highlightRadius(s.image, s.w, s.h, p);
  const object = {x: 260, y: 0, r: geometry ? geometry.r : originalRadius,
    visualR: p.r, originalRadius, geometryAccepted: geometry ? 1 : 0,
    confidence: geometry?.confidence ?? null, npc: labelSeen || p.r > 20,
    labelSeen, localReliable: !p.clipped && labelSeen &&
      Math.max(p.bw, p.bh) / Math.min(p.bw, p.bh) <= 1.4 &&
      p.area * 9 / (p.bw * p.bh) >= .5,
    clipped: p.clipped, blocked: false, isRed: false, vx: 0, vy: 0};
  return {component: plain(p), geometry: plain(geometry), object: plain(object)};
}

const fixtureSpecs = [];
for (const R of [96, 120]) {
  fixtureSpecs.push(
    {id: `R${R}-no-highlight`, spec: {R, wobble: .8, highlights: [], text: true}},
    {id: `R${R}-half-highlight`, spec: {R, wobble: .8, cut: true, text: true}},
    {id: `R${R}-full-highlight`, spec: {R, wobble: .8, text: true}}
  );
}
fixtureSpecs.push({id: 'R40-large-outline-no-highlight', spec: {R: 40, wobble: 1.15, highlights: [], text: true}});
const fixtures = fixtureSpecs.map(({id, spec}) => ({id, spec, ...visibleObject(spec)}));
const matrix = [];
for (const fixture of fixtures) for (const hud of [60, 80, 100, 120, 180, 195]) for (const version of ['v2.13', 'v2.22']) {
  const a = result(oldPlan, fixture.object, hud, version), b = result(newPlan, fixture.object, hud, version);
  const equivalent = same(a.full, b.full);
  matrix.push({fixture: fixture.id, gameVersion: version, hud,
    fixturePhysicalClass: physicalClass(hud, fixture.spec.R),
    old: a.summary, proposed: b.summary, fullResultEqual: equivalent});
  if (version === 'v2.13') check(`${fixture.id}/HUD${hud}/v2.13-unchanged`, equivalent);
  if (fixture.object.geometryAccepted === 1) check(`${fixture.id}/HUD${hud}/${version}/accepted-unchanged`, equivalent);
}
for (const id of ['R96-no-highlight', 'R96-half-highlight']) {
  const f = fixtures.find(x => x.id === id), row = matrix.find(x => x.fixture === id && x.hud === 100 && x.gameVersion === 'v2.22');
  check(`${id}/geometry-rejects-but-localReliable-true`, !f.geometry && f.object.localReliable && f.object.labelSeen && !f.object.clipped);
  check(`${id}/original-false-meal`, row.fixturePhysicalClass === 'neutral-npc' && row.old.classification === 'npc-meal');
  check(`${id}/proposed-removes-false-meal`, row.proposed.eligibleNpc === 0);
}
const ordinaryFood = {x: 260, y: 0, r: 10, visualR: 10, geometryAccepted: 0,
  npc: false, clipped: false, blocked: false, vx: 0, vy: 0};
const foodControls = [];
for (const hud of [25, 60, 100, 180, 195]) for (const version of ['v2.13', 'v2.22']) {
  const a = result(oldPlan, ordinaryFood, hud, version), b = result(newPlan, ordinaryFood, hud, version);
  check(`ordinary-food/size${hud}/${version}/unchanged`, same(a.full, b.full));
  foodControls.push({hud, gameVersion: version, old: a.summary, proposed: b.summary, fullResultEqual: true});
}

// This isolates an already identified limitation. The proposed upper floor does
// not change the frozen probabilistic hard/soft hazard decision.
const exactR200 = {x: 260, y: 0, r: 200, visualR: 200, geometryAccepted: 1,
  npc: true, labelSeen: true, localReliable: true, clipped: false,
  blocked: false, isRed: false, vx: 0, vy: 0};
const retainedHazardLimitation = [180, 185, 186, 195].map(hud => {
  const a = result(oldPlan, exactR200, hud, 'v2.22'), b = result(newPlan, exactR200, hud, 'v2.22');
  check(`exact-R200/size${hud}/unchanged`, same(a.full, b.full));
  return {hud, fixturePhysicalClass: physicalClass(hud, 200), old: a.summary, proposed: b.summary};
});

// Run the exact original tracker statement, with only its image-derived input
// functions stubbed. This tests state retention, not real image tracking accuracy.
const trackerSource = between(source, ' const used=new Set(),objects=parts.map(', '\n const analysis=');
const tracker = new Function('parts', 'radius', 'prior', 'dt', 'camera', 'measuredCamera', 'w', 'h', 'ratio', 'image', 'hasSlimeLabel', 'highlightRadius', 'hasDangerLabel',
  'const previous=prior?.objects||[];' + trackerSource + 'return objects;');
function trackStep(prior, distance, hud = 100, radius = 80) {
  const p = {x: 1000 + distance, y: 580, r: radius, clipped: false,
    bw: radius * 2, bh: radius * 2, area: Math.PI * radius * radius / 9};
  const objects = tracker([p], hud, prior, .1, {x: 0, y: 0}, null, 2000, 1160, 1, {},
    () => true, (_image, _w, _h, part) => part.r, () => false);
  return {radius: hud, objects};
}
function sequence(distances, huds = distances.map(() => 100)) {
  let prior = {radius: 100, objects: []};
  return distances.map((d, i) => {prior = trackStep(prior, d, huds[i]);
    return {distance: d, hud: huds[i], stalled: prior.objects[0].stalled, blocked: prior.objects[0].blocked};});
}
const tracking = {
  statementHash: sha(trackerSource), threshold: .74 * (100 + 80),
  leaveAndReenter: sequence([132, 132, 132, 132, 132, 132, 134, 132]),
  repeatedBoundaryJitter: sequence([132, 132, 132, 132, 134, 132, 132, 132, 132, 134]),
  incidentalHudGrowth: sequence(Array(9).fill(132), [100, 100, 100, 100, 101, 101, 101, 101, 102]),
  radiusFallbackJump: {before: {r: 96, stalled: .6, blocked: true}, currentRadius: 76.5,
    allowedDifference: Math.max(6, 76.5 * .2), actualDifference: 19.5,
    result: plain(trackStep({radius: 100, objects: [{x: 132, y: 0, r: 96, npc: true, vx: 0, vy: 0, stalled: .6, blocked: true}]}, 132, 100, 76.5).objects[0])}
};
check('blocked-lost-on-leaving-contact', tracking.leaveAndReenter[5].blocked && !tracking.leaveAndReenter[6].blocked);
check('boundary-jitter-prevents-block', tracking.repeatedBoundaryJitter.every(x => !x.blocked));
check('radius-fallback-loses-match-and-stall', tracking.radiusFallbackJump.result.stalled === 0);

const idealBounds = [];
for (const phase of [0, .7, 1.3, 6.1, 21.7]) for (const wobble of [.8, 1, 1.15]) {
  const R = 96, x0 = R * (1 + Math.sin(phase) * .045 + Math.cos(-phase * .8) * .025) * 1.01 * wobble;
  const x8 = -R * (1 + Math.sin(3 * Math.PI + phase) * .045 + Math.cos(5 * Math.PI - phase * .8) * .025) * 1.01 * wobble;
  const halfSpan = (x0 - x8) / 2, expected = R * 1.01 * wobble;
  check(`ideal-x-span/phase${phase}/wobble${wobble}`, Math.abs(halfSpan - expected) < 1e-10);
  idealBounds.push({phase, wobble, physicalRadius: R, idealXAxisHalfSpan: halfSpan, expected});
}
const sourceUnchanged = files.every(f => sha(fs.readFileSync(path.join(base, f))) === inputHashes[f]);
check('all-read-inputs-unchanged', sourceUnchanged);
const report = {
  schema: 1, status: 'research-only; inactive proposal; no live gameplay',
  kind: 'static-source-analysis-and-deterministic-synthetic', createdAt: new Date().toISOString(),
  provenance: {repo: 'gg-dot1980/slime', authorityBranch: 'test/ocr-test',
    githubPublicationBase: '46b8aa3f8207ed03bc89c84c6ed896a23bcd5601',
    originalSitesSourceBase: '14c1815351b32096b325e032331b90c1f7873159',
    candidateOriginalGithubCommit: null, candidateSourceIdentity: 'complete frozen files plus SHA256',
    sourceRoot: base, inputHashes},
  environment: {node: process.version, platform: process.platform, arch: process.arch, osRelease: os.release(),
    execution: 'Node standard libraries only; no browser/server', seed: 'none; fixed synthetic cases',
    liveGamesStarted: 0, liveResults: null},
  command: 'node grow-next/research-perception/check-perception.cjs --write',
  scriptHash: sha(fs.readFileSync(__filename)),
  singleCandidate: {suggestedName: 'Grow19 research proposal', parent: 'frozen Grow15',
    notParent: 'Grow18; its hazard-classification change is not included here',
    active: false, exactAddedStatement: addition.trim(), insertion: 'before clipped expansion and original v2.22 upper cap',
    proposedPlannerHash: sha(proposedSource), policyScope: 'v2.22, all HUD stages, geometryAccepted exactly 0 only',
    untouched: ['v2.13 policy', 'accepted geometry', 'ordinary food', 'centre/radius estimates', 'tracking', 'path scoring', 'red bounds', 'hard/soft formula', 'immune threshold'],
    rationale: 'Prevent a rejected metric geometry estimate from automatically inheriting a narrow outline-based error band.',
    constants: {completeIdealOutlineMinHalfWidthFactor: .808, worldUnitPadding: 6,
      paddingReason: 'two step-3 component cells in the frozen 2000-wide capture at ratio1; deliberately chosen heuristic allowance, not an occlusion or anti-aliasing proof'},
    expectedTradeoff: 'Fewer false meals and a larger uncertain hazard envelope, but some truly edible large-outline or partially occluded NPCs are excluded; live growth and survival can both worsen.',
    acceptance: 'Synthetic results establish behavior only; any live test needs a separately frozen protocol and full native outcomes.'},
  mechanics: {
    idealOutlineDerivation: 'At angles0 and pi both vertices use1.01*wobble. Their sin3a/cos5a terms cancel in the left-right span; halfSpan=1.01*wobble*R>=.808R. The full unoccluded continuous polygon bbox radius V is at least this halfSpan, hence R<=V/.808 under that condition.',
    interpretation: 'The existing visualR*.88 floor is not a physical-radius upper bound. The proposed floor is an uncertainty policy informed by the complete-outline relation, not a universally certified bound.',
    observabilityLimit: 'clipped checks canvas/UI boundaries only. labelSeen, localReliable density/aspect and component connectivity do not certify an unoccluded body or complete circumference. An occluded compact region can still pass them.',
    tracking: 'The previous-object match uses estimated r tolerance max(6,.2r), class and a100-unit position gate. stalled requires that match, unchanged integer HUD and d<.74*(HUD+r); blocked is only stalled>.5 and has no persistent cooldown.'},
  historicalContext: {source: 'results/grow17-late-cutoff-diagnostic.json',
    runId: historical.exactRunId, outcome: historical.outcome,
    finalVisible: historical.finalVisible, stallTiming: historical.stallTiming,
    plateauBodyTargetSamples: historical.stallBodyTargetDetails.length,
    rejectedGeometrySamples: historical.stallBodyTargetDetails.filter(x => x.geometryAccepted === 0).length,
    estimatedAlreadyInContactSamples: historical.stallBodyTargetDetails.filter(x => x.withinEstimatedCurrentPlannerContact),
    interpretation: 'Prediction/outcome disagreement motivates research, but the numeric log lacks x/y, stalled/blocked, full objects and stable identity; it does not prove a specific false meal or death cause.'},
  fixtures, matrix, foodControls, retainedHazardLimitation, tracking, idealBounds,
  counts: {numericPlannerCases: matrix.length + foodControls.length + retainedHazardLimitation.length,
    pixelAlgorithmFixtures: fixtures.length, assertions: checks.length, passedAssertions: checks.filter(x => x.pass).length},
  checks,
  limits: [
    'Synthetic fixtures use the frozen circular-body test generator and a synthetic label, not exact browser rasterization of the game polygon/font/anti-aliasing.',
    'Missing and half highlights model ambiguous visibility; they do not establish that an identical composite image occurred in a recorded game.',
    'Fixture physical radii label synthetic expected outcomes only. They are never passed to either planner; controller inputs are derived pixel estimates and the supplied visible HUD.',
    'The selected synthetic body is placed at a fixed visible relative distance260 for planner isolation, not reconstructed from a real screenshot.',
    'No recorded images, full object frames or stable target identities are available in the historical numeric logs. Those logs cannot prove a specific culprit NPC or replay its classification.',
    'The6-unit padding is fixed to the frozen capture/ratio assumptions and is not a universal sampling bound. It must not be silently reused at another ratio.',
    'Occlusion and merged/split components can defeat any radius bound derived from the current bounding box alone. This proposal does not solve that observability limit.',
    'The original soft-hazard treatment of a capped radius200 at HUD180..185 remains in this isolated proposal. It is not a substitute for the separate Grow18 hypothesis.',
    'The tracker limitations are measured but not changed. Adding a blocked TTL alone would not fix radius-gated identity loss or repeated boundary jitter.',
    'No win-rate, safety, precision or formal OCR4 improvement is demonstrated; no live game, server, browser, archive or GitHub mutation was performed.'
  ]
};
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(__dirname, 'research-perception.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({status: 'written', report: path.join(__dirname, 'research-perception.json'), counts: report.counts,
    sourceUnchanged, scriptHash: report.scriptHash, proposedPlannerHash: report.singleCandidate.proposedPlannerHash,
    examples: matrix.filter(x => x.gameVersion === 'v2.22' && ((x.fixture.startsWith('R96-') && x.hud === 100) || (x.fixture.startsWith('R40-') && x.hud === 60)))}, null, 2));
} else console.log(JSON.stringify(report, null, 2));
