'use strict';

// Run with Node 20+ and the private, closed Grow47 exploration ledger.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');

function readFrozen(file, expectedHash) {
  const bytes = fs.readFileSync(file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash);
  return bytes.toString('utf8');
}

const ledger = readFrozen(process.argv[2], 'ec83b24dfaf96441ef74e1eca86db4d5a38388c98f76940fd472eab12895fe4e');
const html = readFrozen(path.resolve(__dirname, '../ocr-grow47.html'), 'a333fd5ba52c2cbb4c6eb17fde85f5e53c9a98924a61440fe606ccb8fca27fee');
const start = html.indexOf('function chaseEvidence46(');
const end = html.indexOf('let totals46=', start);
assert(start >= 0 && end > start);
const planner = html.slice(start, end);
const endpoint = 'if (k===15 && wd<600) state.penalty+=(600-wd)*.04;';
assert.equal(planner.split(endpoint).length, 2);

let observationTime;
function loadPlanner(source) {
  const clock = { now: () => observationTime };
  return new Function('performance', source + '\nreturn planHunt47;')(clock);
}
const original = loadPlanner(planner);
const withoutEndpoint = loadPlanner(planner.replace(endpoint, ''));

function decisionFields(value) {
  const fields = JSON.parse(JSON.stringify(value));
  // The controller attaches these counters after choosing and dispatching a move.
  delete fields.tracking46.appliedCounts;
  delete fields.wallTracking47.appliedCounts;
  return fields;
}

const rows = ledger.trimEnd().split('\n').map(JSON.parse);
const deadlines = rows.filter(row => row.type === 'result' && row.version === 'v2.22' && row.outcome === 'deadline');
assert.equal(deadlines.length, 3);
const totals = { games: deadlines.length, periodicSamples: 0, uniqueSamples: 0, baselineMatches: 0,
  firstChanged: 0, routeChanged: 0, gainUp: 0, gainEqual: 0, gainDown: 0,
  changedRoutesCloserToWall: 0, changedRoutesBelow150: 0, sumPredictedGainDifference: 0 };
for (const game of deadlines) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id !== game.id || row.type !== 'sample') continue;
    totals.periodicSamples++;
    const sample = row.snapshot;
    if (seen.has(sample.recordAt)) continue;
    seen.add(sample.recordAt);
    totals.uniqueSamples++;
    const input = sample.planInput, output = sample.planOutput;
    assert(!sample.diagnosticTruncated && Number.isFinite(output.tracking46.observedAt));
    assert.equal(typeof output.tracking46.npcToast, 'boolean');
    const stamp = input.map?.observedAt;
    if (Number.isFinite(stamp)) {
      assert.equal(sample.decisionStartedAt - stamp > 600, sample.recordAt - stamp > 600);
    }
    observationTime = sample.recordAt;
    const args = [input.objects, input.hud, input.map, input.speed, input.velocity, input.heading,
      'v2.22', output.tracking46.observedAt, output.tracking46.npcToast];
    const base = original(...args);
    if (!isDeepStrictEqual(decisionFields(base), decisionFields(output))) continue;
    totals.baselineMatches++;
    const alternative = withoutEndpoint(...args);
    const firstChanged = alternative.first !== base.first;
    if (firstChanged) totals.firstChanged++;
    if (firstChanged || alternative.second !== base.second) {
      totals.routeChanged++;
      const before = base.wall47.min, after = alternative.wall47.min;
      assert(Number.isFinite(before) && Number.isFinite(after));
      if (after < before) totals.changedRoutesCloserToWall++;
      if (after < 150) totals.changedRoutesBelow150++;
    }
    const difference = alternative.gain - base.gain;
    assert(Number.isFinite(difference));
    if (difference > 1e-8) totals.gainUp++;
    else if (difference < -1e-8) totals.gainDown++;
    else totals.gainEqual++;
    totals.sumPredictedGainDifference += difference;
  }
}
assert.equal(totals.baselineMatches, totals.uniqueSamples, 'Original planner did not replay every sampled decision exactly');
assert(totals.baselineMatches > 0);
const meanPredictedGainDifference = totals.sumPredictedGainDifference / totals.baselineMatches;
console.log(JSON.stringify({ ...totals, meanPredictedGainDifference }, null, 2));
