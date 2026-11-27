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

const v2Contract = {
  ...copy(contract), protocolId: 'grow-native-local-20261126-v2', candidate: 'grow24',
  origin: 'https://grow-test.invalid',
  versions: contract.versions.map(v => ({ ...v, path: '/' + v.version })),
  dimensions: { outer: [1440, 900], canvas: [958, 557], deviceScaleFactor: 1 }
};
function provenanceLedger(options = {}) {
  const base = ledger(options), rows = [], identities = new Map();
  base[0].contract = copy(v2Contract);
  for (const row of base) {
    if (row.type === 'start') {
      const identity = { candidateUrl: `${v2Contract.origin}/candidate/grow24?load=${1000000000000 + identities.size}`,
        gameUrl: v2Contract.origin + '/' + row.version, visibleVersion: row.version };
      identities.set(row.id, identity);
      rows.push(row, { type: 'event', batchId: row.batchId, id: row.id, version: row.version,
        event: { type: 'native-started', dimensions: copy(v2Contract.dimensions),
          evidence: { ...evidence('', '', '05:00'), overlayVisible: false, size: 25, documentIdentity: copy(identity) } } });
    } else if (row.type === 'result') {
      row.expectedDocumentIdentity = copy(identities.get(row.id));
      row.evidence.documentIdentity = copy(identities.get(row.id));
      rows.push(row);
    } else rows.push(row);
  }
  return rows;
}
const validateV2 = (rows, opts = {}) => validateLedger(rows, { expectedContract: copy(v2Contract), ...opts });
function rejectV2(rows, code, opts = {}) {
  const report = validateV2(rows, opts);
  assert.equal(report.ok, false, JSON.stringify(report));
  assert.notEqual(report.gatePassed, true, JSON.stringify(report));
  assert(report.issues.some(issue => issue.code === code), JSON.stringify(report.issues));
}
function changeIdentity(rows, id, transform) {
  for (const row of rows) if (row.id === id) {
    if (row.expectedDocumentIdentity) transform(row.expectedDocumentIdentity);
    if (row.evidence?.documentIdentity) transform(row.evidence.documentIdentity);
    if (row.event?.evidence?.documentIdentity) transform(row.event.evidence.documentIdentity);
  }
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

test('v2 complete native document chain authorizes exploration', () => { const r = validateV2(provenanceLedger(), { requireGate: true }); assert(r.ok && r.provenanceRequired && r.eligibleForConfirm); });
test('v2 complete confirmation still requires six of twelve each', () => { const r = validateV2(provenanceLedger({ phase: 'confirm', outcomes: ['win', 'win', 'win', 'death', 'deadline', 'late-win'] }), { requireGate: true }); assert(r.ok && r.meetsGoal && r.provenanceRequired); });
test('v2 native outcome without native-started event is rejected', () => { const rows = provenanceLedger(); rows.splice(rows.findIndex(r => r.event?.type === 'native-started'), 1); rejectV2(rows, 'missing_or_duplicate_native_start'); });
test('v2 duplicate native-started event is rejected', () => { const rows = provenanceLedger(); rows.splice(3, 0, copy(rows[2])); rejectV2(rows, 'duplicate_native_start'); });
test('v2 native-start event cannot use another attempt identity', () => { const rows = provenanceLedger(); rows[2].id = rows[0].planned[1].id; rejectV2(rows, 'native_start_identity_mismatch'); });
test('v2 result must include documentIdentity', () => { const rows = provenanceLedger(); delete rows.find(r => r.type === 'result').evidence.documentIdentity; rejectV2(rows, 'invalid_document_identity'); });
test('v2 result must include prepared expectedDocumentIdentity', () => { const rows = provenanceLedger(); delete rows.find(r => r.type === 'result').expectedDocumentIdentity; rejectV2(rows, 'invalid_document_identity'); });
test('v2 result cannot use a different load nonce', () => { const rows = provenanceLedger(); rows.find(r => r.type === 'result').evidence.documentIdentity.candidateUrl += '1'; rejectV2(rows, 'result_document_identity_mismatch'); });
test('v2 native start and expected result must identify the same document', () => { const rows = provenanceLedger(); rows[2].event.evidence.documentIdentity.candidateUrl += '1'; rejectV2(rows, 'native_result_document_mismatch'); });
test('v2 visible version must match the planned game', () => { const rows = provenanceLedger(); const id = rows[0].planned[0].id; changeIdentity(rows, id, identity => identity.visibleVersion = 'v2.22'); rejectV2(rows, 'document_version_mismatch'); });
test('v2 candidate route must match the frozen candidate', () => { const rows = provenanceLedger(); changeIdentity(rows, rows[0].planned[0].id, identity => identity.candidateUrl = identity.candidateUrl.replace('/grow24?', '/grow25?')); rejectV2(rows, 'candidate_document_url_mismatch'); });
test('v2 original game URL must match the planned version', () => { const rows = provenanceLedger(); changeIdentity(rows, rows[0].planned[0].id, identity => identity.gameUrl = v2Contract.origin + '/v2.22'); rejectV2(rows, 'game_document_url_mismatch'); });
test('v2 matching foreign-origin identities cannot bypass the frozen origin', () => { const rows = provenanceLedger(); changeIdentity(rows, rows[0].planned[0].id, identity => { identity.candidateUrl = identity.candidateUrl.replace(v2Contract.origin, 'https://other.invalid'); identity.gameUrl = identity.gameUrl.replace(v2Contract.origin, 'https://other.invalid'); }); rejectV2(rows, 'document_origin_mismatch'); });
test('v2 frozen origin is mandatory even when expectedContract agrees', () => { const rows = provenanceLedger(); delete rows[0].contract.origin; rejectV2(rows, 'invalid_document_origin', { expectedContract: copy(rows[0].contract) }); });
test('v2 game query/hash cannot silently change the source route', () => { const rows = provenanceLedger(); changeIdentity(rows, rows[0].planned[0].id, identity => identity.gameUrl += '?other=1'); rejectV2(rows, 'game_document_url_mismatch'); });
test('v2 candidate document requires a load nonce', () => { const rows = provenanceLedger(); changeIdentity(rows, rows[0].planned[0].id, identity => identity.candidateUrl = v2Contract.origin + '/candidate/grow24'); rejectV2(rows, 'document_nonce_missing'); });
test('v2 new attempt cannot reuse an earlier candidate document URL', () => { const rows = provenanceLedger(), first = rows[2].event.evidence.documentIdentity.candidateUrl; changeIdentity(rows, rows[0].planned[1].id, identity => identity.candidateUrl = first); rejectV2(rows, 'native_document_reused'); });
test('v2 samples require a preceding native-started event', () => { const rows = provenanceLedger(); rows.splice(2, 0, { type: 'sample', batchId: rows[0].batchId, id: rows[1].id, version: rows[1].version }); rejectV2(rows, 'sample_before_native_start'); });
test('v2 native-started cannot contain an old terminal game', () => { const rows = provenanceLedger(); rows[2].event.evidence.remaining = '02:29'; rejectV2(rows, 'invalid_native_start_evidence'); });
test('v2 native-started requires the original overlay to be hidden', () => { const rows = provenanceLedger(); rows[2].event.evidence.overlayVisible = true; rejectV2(rows, 'invalid_native_start_evidence'); });
test('v2 native-start dimensions must match the frozen geometry', () => { const rows = provenanceLedger(); rows[2].event.dimensions.canvas[0]++; rejectV2(rows, 'native_dimensions_mismatch'); });
test('v2 setup-abort with no native event and empty evidence is preserved', () => {
  const rows = provenanceLedger({ phase: 'diagnostic', outcomes: ['manual-abort'] });
  const id = rows[0].planned[0].id; rows.splice(rows.findIndex(r => r.id === id && r.event?.type === 'native-started'), 1);
  const result = rows.find(r => r.id === id && r.type === 'result');
  Object.assign(result, { nativeStarted: false, outcome: 'setup-abort', expectedDocumentIdentity: null, seconds: null,
    evidence: { ...evidence('', '', ''), size: null, documentIdentity: null } });
  const report = validateV2(rows); assert(report.ok && report.complete); assert.equal(report.gatePassed, null); assert.equal(report.totals.starts, 2); assert.equal(report.totals.nativeStarts, 1); assert.equal(report.totals.aborts, 2);
});
test('v2 setup-abort cannot carry the preceding game HUD', () => {
  const rows = provenanceLedger(), id = rows[0].planned[0].id; rows.splice(rows.findIndex(r => r.id === id && r.event?.type === 'native-started'), 1);
  const result = rows.find(r => r.id === id && r.type === 'result'); Object.assign(result, { nativeStarted: false, outcome: 'setup-abort', seconds: null, expectedDocumentIdentity: null });
  result.evidence = { ...evidence('', '', '02:29'), size: 158, documentIdentity: null };
  rejectV2(rows, 'unstarted_attempt_has_game_evidence');
});
test('v2 nativeStarted false cannot hide a recorded native-started event', () => { const rows = provenanceLedger(); const r = rows.find(r => r.type === 'result'); Object.assign(r, { nativeStarted: false, outcome: 'setup-abort', seconds: null, expectedDocumentIdentity: null, evidence: { ...evidence('', '', ''), size: null, documentIdentity: null } }); rejectV2(rows, 'unexpected_native_start'); });
test('v2 an abort cohort remains ineligible despite valid provenance', () => { const r = validateV2(provenanceLedger({ outcomes: ['win', 'win', 'runner-abort', 'runner-abort'] }), { requireGate: true }); assert(r.integrityOk && r.complete); assert.equal(r.ok, false); assert.equal(r.eligibleForConfirm, false); assert.equal(r.counts['v2.13'].aborts, 2); });
test('v2 provenance cannot make a truncated cohort eligible', () => { const rows = provenanceLedger(); rows.splice(-2); const r = validateV2(rows, { requireGate: true }); assert.equal(r.ok, false); assert.equal(r.complete, false); assert.equal(r.eligibleForConfirm, false); assert.equal(r.totals.starts, 8); assert.equal(r.totals.results, 7); });

console.log(JSON.stringify({ kind: 'synthetic-ledger-regression', checks, status: 'passed', browserLaunches: 0, naturalGameStarts: 0, filesWritten: 0 }));
