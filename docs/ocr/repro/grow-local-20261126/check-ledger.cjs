'use strict';

const assert = require('node:assert/strict');
const { classifyEvidence, validateLedger } = require('./ledger.cjs');

const contract = {
  runnerSha256: 'a'.repeat(64), ledgerSha256: 'b'.repeat(64), sourceSha256: 'c'.repeat(64),
  browser: { name: 'Chromium', version: '156.0.0.0' },
  viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  versions: [{ version: 'v2.13', sha256: 'd'.repeat(64) }, { version: 'v2.22', sha256: 'e'.repeat(64) }]
};
const copy = value => JSON.parse(JSON.stringify(value));
const evidence = (title = '', description = '', remaining = '04:00', resultVisible = false, endingVisible = false) =>
  ({ resultVisible, endingVisible, title, description, remaining, size: 100 });
function resultEvidence(outcome) {
  if (outcome === 'win') return evidence('成功過關！', '遊玩時間 2:30 · 吞食 3 個。', '02:30', true);
  if (outcome === 'late-win') return evidence('成功過關！', '遊玩時間 2:31', '02:29', true);
  if (outcome === 'death') return evidence('被大史萊姆吞掉了', '遊玩時間 1:20', '03:40', true);
  if (outcome === 'game-timeout') return evidence('時間到！未達成目標', '遊玩時間 5:00', '00:00', true);
  if (outcome === 'deadline') return evidence('', '', '02:29');
  if (outcome === 'unknown-native') return evidence('未知結算', '遊玩時間 1:20', '03:40', true);
  return evidence();
}
function ledger({ phase = 'explore', outcomes = ['win', 'win', 'death', 'deadline'], batchId = 'synthetic-batch' } = {}) {
  const n = phase === 'confirm' ? 12 : phase === 'explore' ? 4 : 1;
  const planned = [];
  for (let i = 0; i < n; i++) for (const version of ['v2.13', 'v2.22']) planned.push({ id: `${batchId}/${version}/${i + 1}`, version });
  const rows = [{ type: 'batch', batchId, phase, contract: copy(contract), planned }];
  for (let i = 0; i < planned.length; i++) {
    const item = planned[i], outcome = outcomes[Math.floor(i / 2) % outcomes.length], observed = resultEvidence(outcome);
    rows.push({ type: 'start', batchId, ...item });
    rows.push({ type: 'result', batchId, ...item, nativeStarted: true, stopVerified: true,
      evidence: observed, outcome, seconds: classifyEvidence(observed)?.seconds ?? null });
  }
  rows.push({ type: 'batch-end', batchId });
  return rows;
}
const validate = (rows, opts = {}) => validateLedger(rows, { expectedContract: copy(contract), ...opts });
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS ' + name); }
function reject(rows, code) {
  const report = validate(rows);
  assert.equal(report.ok, false, JSON.stringify(report));
  assert.notEqual(report.gatePassed, true, JSON.stringify(report));
  if (code) assert(report.issues.some(issue => issue.code === code), JSON.stringify(report.issues));
}

test('149-second English native win', () => assert.deepEqual(classifyEvidence(evidence('You win!', 'Play time 2:29', '02:31', true)), { outcome: 'win', seconds: 149 }));
test('exactly 150 visible seconds is a win', () => assert.deepEqual(classifyEvidence(resultEvidence('win')), { outcome: 'win', seconds: 150 }));
test('151 visible seconds is a late win', () => assert.deepEqual(classifyEvidence(resultEvidence('late-win')), { outcome: 'late-win', seconds: 151 }));
test('native death is preserved', () => assert.deepEqual(classifyEvidence(resultEvidence('death')), { outcome: 'death', seconds: 80 }));
test('native game timeout is preserved', () => assert.deepEqual(classifyEvidence(resultEvidence('game-timeout')), { outcome: 'game-timeout', seconds: 300 }));
test('02:30 remaining is not over the deadline', () => assert.equal(classifyEvidence(evidence('', '', '02:30')), null));
test('02:29 remaining independently proves elapsed 151', () => assert.deepEqual(classifyEvidence(resultEvidence('deadline')), { outcome: 'deadline', seconds: 151 }));
test('hidden result text cannot award a win', () => assert.equal(classifyEvidence(evidence('You win!', 'Play time 2:30', '02:30', false)), null));
test('animation cannot award a win or force deadline', () => assert.equal(classifyEvidence(evidence('You win!', 'Play time 2:30', '02:29', false, true)), null));
test('visible native result takes precedence over last HUD', () => assert.deepEqual(classifyEvidence(evidence('You win!', 'Play time 2:30', '02:29', true)), { outcome: 'win', seconds: 150 }));
test('visible incomplete settlement stays unknown', () => assert.deepEqual(classifyEvidence(evidence('You win!', '', '02:29', true)), { outcome: 'unknown-native', seconds: null }));
test('invalid or out-of-range HUD is not a deadline', () => { for (const value of ['02:60', 'n/a', '05:01', '-1:59']) assert.equal(classifyEvidence(evidence('', '', value)), null); });
test('malformed evidence stays unknown', () => assert.deepEqual(classifyEvidence({ resultVisible: 'true' }), { outcome: 'unknown-evidence', seconds: null }));
test('complete exploration with failures is eligible', () => { const r = validate(ledger(), { requireGate: true }); assert(r.ok && r.integrityOk && r.complete && r.eligibleForConfirm); assert.equal(r.meetsGoal, false); assert.equal(r.counts['v2.13'].starts, 4); assert.equal(r.counts['v2.13'].wins, 2); assert.equal(r.counts['v2.13'].deaths, 1); assert.equal(r.counts['v2.13'].deadlines, 1); });
test('six of twelve each meets independent confirmation goal', () => { const r = validate(ledger({ phase: 'confirm', outcomes: ['win', 'win', 'win', 'death', 'deadline', 'late-win'] }), { requireGate: true }); assert(r.ok && r.meetsGoal); assert.equal(r.eligibleForConfirm, false); assert.equal(r.counts['v2.22'].wins, 6); assert.equal(r.counts['v2.22'].starts, 12); });
test('five of twelve confirmation fails without discarding failures', () => { const r = validate(ledger({ phase: 'confirm', outcomes: [...Array(5).fill('win'), ...Array(7).fill('death')] }), { requireGate: true }); assert.equal(r.ok, false); assert.equal(r.integrityOk, true); assert.equal(r.meetsGoal, false); assert.equal(r.counts['v2.13'].starts, 12); assert.equal(r.counts['v2.13'].deaths, 7); });
test('original counterexample: two wins plus two aborts cannot authorize confirm', () => { const r = validate(ledger({ outcomes: ['win', 'win', 'runner-abort', 'runner-abort'] }), { requireGate: true }); assert.equal(r.integrityOk, true); assert.equal(r.ok, false); assert.equal(r.eligibleForConfirm, false); assert.equal(r.counts['v2.13'].starts, 4); assert.equal(r.counts['v2.13'].aborts, 2); });
test('original counterexample: missing batch-end is rejected', () => { const rows = ledger(); rows.pop(); reject(rows, 'wrong_end_count'); });
test('original counterexample: duplicate sample identities are rejected', () => { const rows = ledger(); for (const p of rows[0].planned) p.id = 'duplicate'; for (const r of rows) if (r.id) r.id = 'duplicate'; reject(rows, 'duplicate_planned_id'); });
test('duplicate final marker is rejected', () => { const rows = ledger(); rows.push(copy(rows.at(-1))); reject(rows, 'wrong_end_count'); });
test('rows after final marker are rejected', () => { const rows = ledger(); rows.push({ type: 'event', batchId: rows[0].batchId }); reject(rows, 'row_after_end'); });
test('truncated attempt keeps unresolved start', () => { const rows = ledger(); rows.splice(-2); const r = validate(rows); assert.equal(r.ok, false); assert.equal(r.complete, false); assert.equal(r.totals.starts, 8); assert.equal(r.totals.results, 7); assert.equal(r.counts['v2.22'].unresolved, 1); });
test('result without start is rejected', () => { const rows = ledger(); rows.splice(1, 1); reject(rows, 'result_without_start'); });
test('duplicate result is rejected', () => { const rows = ledger(); rows.splice(3, 0, copy(rows[2])); reject(rows, 'duplicate_result'); });
test('fixed order cannot be permuted', () => { const rows = ledger(); rows.splice(1, 4, rows[3], rows[4], rows[1], rows[2]); reject(rows, 'planned_order_mismatch'); });
test('unknown versions are retained and rejected', () => { const rows = ledger(); rows[0].planned[0].version = 'v9.99'; rows[1].version = rows[2].version = 'v9.99'; const r = validate(rows); assert.equal(r.ok, false); assert.equal(r.counts['v9.99'].starts, 1); assert(r.issues.some(i => i.code === 'unknown_planned_version')); });
test('wrong complete contract is rejected', () => { const rows = ledger(); rows[0].contract.browser.version = '157.0.0.0'; reject(rows, 'contract_mismatch'); });
test('changed extra contract field is rejected', () => { const rows = ledger(); rows[0].contract.ledgerSha256 = 'f'.repeat(64); reject(rows, 'contract_mismatch'); });
test('missing runner hash cannot be self-approved', () => { const rows = ledger(); delete rows[0].contract.runnerSha256; const r = validate(rows, { expectedContract: copy(rows[0].contract) }); assert.equal(r.ok, false); assert(r.issues.some(i => i.code === 'missing_runner_hash')); });
test('independent frozen contract is mandatory', () => { const r = validateLedger(ledger()); assert.equal(r.ok, false); assert(r.issues.some(i => i.code === 'missing_expected_contract')); });
test('previous batch identity cannot be reused', () => { const rows = ledger(); const r = validate(rows, { seenBatchIds: new Set([rows[0].batchId]) }); assert.equal(r.ok, false); assert(r.issues.some(i => i.code === 'reused_batch_id')); });
test('cross-batch row is rejected', () => { const rows = ledger(); rows[2].batchId = 'another-batch'; reject(rows, 'row_batch_mismatch'); });
test('unknown result remains in the full denominator and blocks gate', () => { const r = validate(ledger({ outcomes: ['win', 'win', 'unknown-native', 'death'] }), { requireGate: true }); assert.equal(r.integrityOk, true); assert.equal(r.ok, false); assert.equal(r.counts['v2.13'].unknown, 1); assert.equal(r.counts['v2.13'].starts, 4); });
test('unverified key release blocks gate', () => { const rows = ledger(); rows[2].stopVerified = false; const r = validate(rows, { requireGate: true }); assert.equal(r.integrityOk, true); assert.equal(r.ok, false); assert.equal(r.counts['v2.13'].stopUnverified, 1); });
test('native outcome without a verified start is invalid', () => { const rows = ledger(); rows[2].nativeStarted = false; reject(rows, 'outcome_without_native_start'); });
test('hidden outcome cannot be recorded as a win', () => { const rows = ledger(); rows[2].evidence.resultVisible = false; reject(rows, 'outcome_evidence_mismatch'); });
test('animation cannot be recorded as a deadline', () => { const rows = ledger(); const r = rows.find(x => x.outcome === 'deadline'); r.evidence.endingVisible = true; reject(rows, 'outcome_evidence_mismatch'); });
test('wrong deadline seconds are rejected', () => { const rows = ledger(); rows.find(r => r.outcome === 'deadline').seconds = null; reject(rows, 'outcome_evidence_mismatch'); });
test('late success cannot be labelled a qualifying win', () => { const rows = ledger(); rows[2].evidence = resultEvidence('late-win'); rows[2].seconds = 151; reject(rows, 'outcome_evidence_mismatch'); });
test('evidenced native result cannot be replaced by an abort', () => { const rows = ledger(); rows[2].outcome = 'runner-abort'; rows[2].seconds = null; reject(rows, 'abort_conflicts_with_outcome'); });
test('header cannot be duplicated or omitted; all starts stay counted', () => { const rows = ledger(); rows.splice(1, 0, copy(rows[0])); reject(rows, 'duplicate_header'); const missing = ledger(); missing.shift(); reject(missing, 'missing_header'); assert.equal(validate(missing).totals.starts, 8); });
test('sample/event rows are accepted only under the active identity', () => { const rows = ledger(); rows.splice(2, 0, { type: 'sample', batchId: rows[0].batchId, id: rows[1].id, version: rows[1].version, evidence: evidence() }); const r = validate(rows); assert(r.ok && r.eligibleForConfirm); rows[2].id = 'wrong'; reject(rows, 'event_identity_mismatch'); });
test('diagnostic abort is complete evidence but never a passing gate', () => { const r = validate(ledger({ phase: 'diagnostic', outcomes: ['manual-abort'] })); assert(r.ok && r.complete); assert.equal(r.gatePassed, null); assert.equal(r.meetsGoal, false); assert.equal(r.eligibleForConfirm, false); assert.equal(r.totals.aborts, 2); const required = validate(ledger({ phase: 'diagnostic' }), { requireGate: true }); assert.equal(required.ok, false); });
test('extra or missing planned exploration attempts are rejected', () => { const rows = ledger(); rows[0].planned.pop(); reject(rows, 'wrong_planned_count'); });
test('non-array input produces a structured failure report', () => { const r = validateLedger(null, { expectedContract: contract }); assert.equal(r.ok, false); assert(r.issues.some(i => i.code === 'not_rows')); });

console.log(JSON.stringify({ kind: 'synthetic-ledger-regression', checks, status: 'passed', browserLaunches: 0, naturalGameStarts: 0, filesWritten: 0 }));
