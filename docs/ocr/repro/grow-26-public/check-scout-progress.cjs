'use strict';
// Fixed numeric regressions only; this script does not start or simulate a real game.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const crypto = require('node:crypto');

function extract(html, name, withPaths = false) {
  const start = html.indexOf('function ' + name + '(');
  const end = html.indexOf('\nif (typeof module', start);
  assert(start >= 0 && end > start, 'planner boundaries');
  let source = html.slice(start, end);
  if (withPaths) {
    assert.equal(source.split('return {...chosen, target, strategy:').length, 2);
    source = source.replace('return {...chosen, target, strategy:', 'return {paths, ...chosen, target, strategy:');
  }
  return new Function(source + '\nreturn ' + name + ';')();
}

function check(parentHtml, candidateHtml) {
  const before = extract(parentHtml, 'planGrow23', true);
  const after = extract(candidateHtml, 'planGrow26', true);
  let assertions = 0;
  const ok = (value, message) => { assert(value, message); assertions++; };
  const equal = (a, b, message) => { assert.deepEqual(a, b, message); assertions++; };
  const scripts = [...candidateHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  equal(scripts.length, 2, 'both inline scripts present');
  for (const [i, script] of scripts.entries()) new vm.Script(script, {filename: 'grow26-inline-' + i});
  const styles = html => [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
  equal(styles(parentHtml), styles(candidateHtml), 'native responsive CSS unchanged');
  ok(candidateHtml.includes('game.src=path;'), 'original same-origin iframe navigation retained');
  ok(!candidateHtml.includes('nearScout'), 'no Grow25 near-distance policy inherited');

  const baseMap = {
    player: {x: 72, y: 144 * 9 / 26}, width: 144, height: 144 * 9 / 13,
    pixelRatio: 1, viewWidth: 958, viewHeight: 557,
    threats: [], growMarkers: [], visibleWalls: [5200, 5200, 3600, 3600]
  };
  const mark = (x, y, area = 4, red = false, m = baseMap) => ({
    x: m.player.x + x / 10400 * m.width,
    y: m.player.y + y / 7200 * m.height, area, red
  });
  const food = (x, y, r = 13) => ({x, y, r, npc: false, clipped: false, blocked: false});
  const body = (x, y, r, isRed = false) => ({x, y, r, npc: true, isRed,
    clipped: false, blocked: false, localReliable: true, geometryAccepted: 1, vx: 0, vy: 0});
  const closeWall = {...baseMap, player: {x: 72, y: 450 / 7200 * baseMap.height},
    visibleWalls: [5200, 5200, 450, 6750]};
  const north = {...baseMap, growMarkers: [mark(0, -350)]};
  const cases = [
    {name: 'north scout 350', map: north, expectedDirection: -1},
    {name: 'south scout 350', map: {...baseMap, growMarkers: [mark(0, 350)]}, expectedDirection: 1},
    {name: 'north far 1500', map: {...baseMap, growMarkers: [mark(0, -1500, 20)]}, sameDirection: true},
    {name: 'south far 1500', map: {...baseMap, growMarkers: [mark(0, 1500, 20)]}, sameDirection: true},
    {name: 'near 275 stays excluded', map: {...baseMap, growMarkers: [mark(0, -275)]}, unchanged: true},
    {name: 'wide viewport point inside', map: {...north, viewWidth: 2000, viewHeight: 1163}, unchanged: true},
    {name: 'visible food north', objects: [food(0, -220)], unchanged: true},
    {name: 'visible food cluster', objects: [food(250, 0), food(290, 20), food(320, -20)], unchanged: true},
    {name: 'visible edible NPC', objects: [body(260, 0, 50)], unchanged: true},
    {name: 'visible moving NPC', objects: [{...body(260, 0, 50), vx: 80, vy: -20}], unchanged: true},
    {name: 'visible danger with scout', map: north, objects: [body(0, -240, 145, true)]},
    {name: 'map red corridor', map: {...north, threats: [mark(0, -300, 20, true)]}},
    {name: 'north wall with scout', map: {...closeWall, growMarkers: [mark(0, -350, 4, false, closeWall)]}},
    {name: 'stale visible map', map: {...north, stale: true}, unchanged: true},
    {name: 'empty valid map', unchanged: true},
    {name: 'missing map and empty view', map: null, unchanged: true},
    {name: 'inertia toward scout', map: north, velocity: {x: 0, y: -250}},
    {name: 'inertia away from scout', map: north, velocity: {x: 0, y: 250}},
    {name: 'sideways inertia', map: north, velocity: {x: 250, y: 0}},
    {name: 'food versus scouting tradeoff', map: {...baseMap, growMarkers: [mark(0, -600, 20)]},
      objects: [food(120, 0)], tradeoff: true}
  ];
  const safetyKeys = ['first', 'second', 'x', 'y', 'clearance', 'immediateGap', 'endGap',
    'wallOK', 'wallCost', 'risk', 'spawnWallOK', 'endX', 'endY', 'gain', 'discountedGain'];
  const pathEvidence = p => Object.fromEntries(safetyKeys.map(k => [k, p[k]]));
  const normalise = p => ({...p, strategy: 'same'});
  const report = p => ({direction: p.name, first: p.first ?? null, second: p.second ?? null,
    gain: p.gain, clearance: p.clearance, wallOK: p.wallOK ?? null,
    spawnWallOK: p.spawnWallOK ?? null, scoutTargets: p.scoutTargets ?? 0,
    mapOnly: !!p.target?.mapOnly, approach: p.approach ?? null});
  const rows = [];
  for (const version of ['v2.13', 'v2.22']) for (const c of cases) {
    const map = Object.hasOwn(c, 'map') ? c.map : baseMap;
    const args = [c.objects || [], 95, map, 300, c.velocity || {x: 0, y: 0}, {x: 1, y: 0}, version];
    const a = before(...args), b = after(...args), label = version + ': ' + c.name;
    if (a.paths && b.paths) {
      equal(a.paths.length, 64, label + ' complete path pool');
      equal(a.paths.map(pathEvidence), b.paths.map(pathEvidence), label + ' all 64 safety/food/NPC trajectories unchanged');
      if (a.wallOK) ok(b.wallOK, label + ' keeps hard-wall-valid choice');
      if (!a.escaping) ok(!b.escaping, label + ' does not discard existing safe choices');
      if (a.spawnWallOK) ok(b.spawnWallOK, label + ' retains viable spawn reserve');
    }
    if (c.unchanged) equal(normalise(a), normalise(b), label + ' complete unchanged control');
    if (c.sameDirection) equal([a.x, a.y], [b.x, b.y], label + ' far-scout initial direction');
    if (c.expectedDirection) {
      equal([a.x, a.y], [0, -c.expectedDirection], label + ' reproduces initial wrong-way movement');
      equal([b.x, b.y], [0, c.expectedDirection], label + ' initial movement approaches visible map point');
      equal([a.scoutTargets, b.scoutTargets], [1, 1], label + ' same eligible scout');
      equal([a.gain, b.gain], [0, 0], label + ' no invented swallow reward');
      ok(b.target?.mapOnly, label + ' scouting remains distinct from food');
    }
    if (c.tradeoff) {
      equal([a.x, a.y, !!a.target?.mapOnly], [0, -1, true], label + ' baseline chooses distant white point');
      equal([b.x, b.y, !!b.target?.mapOnly], [1, 0, false], label + ' candidate delays scouting for known food');
      ok(b.gain > a.gain, label + ' records local model gain, not unknown future NPC benefit');
    }
    rows.push({version,case: c.name,before: report(a),after: report(b),tradeoff: !!c.tradeoff});
  }
  return {kind: 'numeric-synthetic',cases: rows.length,assertions,inlineScriptsParsed: scripts.length,
    liveStarts: 0,rows};
}

if (require.main === module) {
  const parent = fs.readFileSync(path.join(__dirname, '../grow-24-public/ocr-grow24.html'), 'utf8');
  const candidate = fs.readFileSync(path.join(__dirname, 'ocr-grow26.html'), 'utf8');
  const result = check(parent, candidate);
  result.sourceSha256 = crypto.createHash('sha256').update(candidate).digest('hex');
  console.log(JSON.stringify(result, null, 2));
}
module.exports = {check, extract};
