'use strict';
// Inspect a closed private ledger. The optional fifth argument supplies pursuit
// alerts from check-chase-progress.py instead of the two terminal windows.
// Frame-level values go only to the private output. Controller scores stay frozen.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = fs.readFileSync(process.argv[2]);
const report = JSON.parse(fs.readFileSync(process.argv[3]));
assert.equal(sha(raw), report.rawSha256);
assert(report.complete && report.integrityOk);
const controller = {
  grow47: ['../../grow-47-public/ocr-grow47.html', 'a333fd5ba52c2cbb4c6eb17fde85f5e53c9a98924a61440fe606ccb8fca27fee'],
  grow48: ['../ocr-grow48.html', 'c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253']
}[report.candidate];
assert(controller);
const html = fs.readFileSync(path.join(__dirname, controller[0]), 'utf8');
assert.equal(sha(html), controller[1]);
const rows = raw.toString().trimEnd().split('\n').map(JSON.parse);
assert.equal(rows[0].contract.candidateSha256, sha(html));
const flags = new Map();
const byFlag = Boolean(process.argv[5]);
if (byFlag) {
  const groups = JSON.parse(fs.readFileSync(process.argv[5])).filter(
    g => g.candidate === report.candidate && g.phase === report.phase);
  assert(groups.length > 0);
  for (const g of groups) for (const a of g.alerts) {
    const probes = process.argv[6] === 'neighbours' ? a.sameTargetNeighbours : [a];
    for (const probe of probes) {
      const key = g.game + '/' + probe.recordAt;
      assert(!flags.has(key), 'Overlapping observation windows');
      flags.set(key, g.outcome + (probe.position ? '-' + probe.position : ''));
    }
  }
} else {
  assert.equal(rows[0].contract.protocolId, 'grow-native-local-20261126-v4-terminal-observation');
}
const code = html.slice(html.indexOf('function chaseEvidence46('), html.indexOf('let totals46='));
function inject(source, needle, instrumentation) {
  assert.equal(source.split(needle).length, 2);
  return source.replace(needle, instrumentation + '\n' + needle);
}
const traced = inject(inject(code, 'paths.push({...d, first, second, score, gain: growth,',
  'remember(first,second,[...picked].map(i=>reachableMeals[i]));'),
  'const target = chosen.target && {...chosen.target};', 'capture(safe, chosen);');
let now, safe, chosen;
const picked = new Map();
const plan = new Function('performance', 'remember', 'capture', traced + '\nreturn planHunt47;')(
  {now: () => now}, (first, second, items) => picked.set(first * 8 + second, items),
  (paths, selected) => { safe = paths; chosen = selected; });
const sameTarget = (a, b) => a && b && Boolean(a.npc) === Boolean(b.npc)
  && Boolean(a.mapOnly) === Boolean(b.mapOnly) && a.x === b.x && a.y === b.y;
const details = [];
for (const row of rows) {
  if (row.type !== 'sample' || row.version !== 'v2.22') continue;
  const s = row.snapshot;
  const [minutes, seconds] = s.hudTime.split(':').map(Number);
  const elapsed = 300 - minutes * 60 - seconds;
  const window = byFlag ? flags.get(row.id + '/' + s.recordAt)
    : elapsed >= 70 && elapsed <= 81 ? 'plateau' : elapsed >= 88 && elapsed <= 91 ? 'closing' : null;
  if (!window) continue;
  const u = s.planInput, expected = structuredClone(s.planOutput);
  assert(!s.diagnosticTruncated);
  delete expected.wallTracking47.appliedCounts;
  delete expected.tracking46.appliedCounts;
  const tracking = expected.tracking46;
  now = s.decisionStartedAt;
  picked.clear();
  const d = plan(u.objects, u.hud, u.map, u.speed, u.velocity, u.heading, 'v2.22',
    tracking.observedAt, tracking.npcToast);
  assert.deepEqual(JSON.parse(JSON.stringify(d)), expected);
  assert.equal(picked.size, 64);
  // A different initial direction must intercept an actual visible meal, and
  // must not pick up the current target anywhere along that simulated path.
  const others = safe.filter(p => {
    const meals = picked.get(p.first * 8 + p.second);
    return p.first !== chosen.first && meals.length > 0
      && meals.every(m => !sameTarget(m, chosen.target)) && p.gain > chosen.gain;
  });
  const clear = others.filter(p => p.clearance >= chosen.clearance);
  const protectedRoutes = clear.filter(p => p.wall47.min >= chosen.wall47.min);
  details.push({window, game: row.id, elapsed, recordAt: s.recordAt, hud: u.hud, heading: d.name,
    targetRadius: d.target?.r, targetDistance: d.target ? Math.hypot(d.target.x, d.target.y) : null,
    gain: chosen.gain, clearance: chosen.clearance, wallMinimum: chosen.wall47.min,
    higherGain: others.length, noLessClearance: clear.length, noLessWall: protectedRoutes.length});
}
if (byFlag) assert.equal(details.length, flags.size);
const expectedCounts = byFlag ? [...new Set(flags.values())].map(
  name => [name, [...flags.values()].filter(group => group === name).length]) : [['plateau', 12], ['closing', 4]];
for (const [name, count] of expectedCounts) {
  const part = details.filter(s => s.window === name);
  assert.equal(part.length, count);
  console.log(JSON.stringify({window: name, samples: part.length,
    higherGain: part.filter(p => p.higherGain).length,
    noLessClearance: part.filter(p => p.noLessClearance).length,
    noLessWall: part.filter(p => p.noLessWall).length}));
}
fs.writeFileSync(process.argv[4], JSON.stringify(details, null, 2) + '\n');
