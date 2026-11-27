'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function instrumentPlanner(relativePath) {
  const html = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
  const start = html.indexOf('function planGrow23(');
  const end = html.indexOf("if (typeof module !== 'undefined'", start);
  assert.ok(start >= 0 && end > start);
  const source = html.slice(start, end);
  const beforeFiltering = 'const bounded = paths.filter';
  assert.equal(source.split(beforeFiltering).length, 2);
  const withObserver = source.replace(beforeFiltering, 'observe(paths);\n  ' + beforeFiltering);
  return function evaluate(input, now) {
    let paths = [];
    const observe = values => {
      paths = values.map(p => [p.first, p.second, p.endX, p.endY, p.clearance,
        p.immediateGap, p.endGap, p.wallOK, p.spawnWallOK, p.risk,
        p.wallCost, p.gain, p.discountedGain]);
    };
    const make = new Function('performance', 'observe', withObserver + '\nreturn planGrow23;');
    const plan = make({now: () => now}, observe);
    const output = plan(input.objects, input.hud, input.map, input.speed,
      input.velocity, input.heading, input.gameVersion);
    return {paths, output};
  };
}

function facesAway(output, input) {
  const target = output.target;
  if (!target || output.escaping) return false;
  const contact = target.npc ? .68 * (input.hud + target.r) : input.hud + .45 * target.r;
  return Math.hypot(target.x, target.y) > contact &&
    target.x * output.x + target.y * output.y < 0;
}

const baseline = instrumentPlanner('../grow-29-public/ocr-grow29.html');
const candidate = instrumentPlanner('ocr-grow30.html');
const fixtures = require('../grow-28-public/fixtures.json').cases;
const result = {cases: 0, pathsChecked: 0, directionsChanged: 0,
  parentFacesAway: 0, candidateFacesAway: 0, selectedClearanceLower: 0};
for (const f of fixtures) {
  const a = baseline(f.input, f.clock);
  const b = candidate(f.input, f.clock);
  assert.deepEqual(b.paths, a.paths, f.id + ' path geometry, safety and growth');
  assert.equal(b.output.mapStatus, a.output.mapStatus, f.id + ' map status');
  if (f.name === 'food-west-clear') {
    assert.equal(a.output.name, '東南');
    assert.equal(b.output.name, '西');
  }
  if (f.name.startsWith('map-only-') || a.output.mapStatus === 'lost')
    assert.deepEqual(b.output, a.output, f.id + ' unaffected case');
  result.cases++;
  result.pathsChecked += a.paths.length;
  result.directionsChanged += a.output.x !== b.output.x || a.output.y !== b.output.y;
  result.parentFacesAway += facesAway(a.output, f.input) ? 1 : 0;
  result.candidateFacesAway += facesAway(b.output, f.input) ? 1 : 0;
  result.selectedClearanceLower += b.output.clearance < a.output.clearance;
}
assert.equal(result.cases, 60);
assert.ok(result.parentFacesAway > 0);
assert.equal(result.candidateFacesAway, 0);
console.log(JSON.stringify(result, null, 2));
