'use strict';

const { isDeepStrictEqual } = require('node:util');

const DEFAULT_VERSIONS = Object.freeze(['v2.13', 'v2.22']);
const VALID_OUTCOMES = new Set(['win', 'late-win', 'death', 'game-timeout', 'deadline']);
const ABORT_OUTCOMES = new Set([
  'setup-abort', 'runner-abort', 'background-abort', 'wall-time-abort',
  'controller-abort', 'manual-abort', 'environment-abort'
]);
const UNKNOWN_OUTCOMES = new Set(['unknown-native', 'unknown-evidence', 'unknown']);

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const secondsValue = value => value === null || (Number.isSafeInteger(value) && value >= 0);

function clock(text) {
  const match = /^(\d+):([0-5]\d)$/.exec(String(text).trim());
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  return Number.isSafeInteger(seconds) ? seconds : null;
}

function evidenceShape(evidence) {
  return object(evidence) && typeof evidence.resultVisible === 'boolean' &&
    ['title', 'description', 'remaining'].every(key => typeof evidence[key] === 'string') &&
    (evidence.size === null || (Number.isFinite(evidence.size) && evidence.size >= 0)) &&
    (evidence.endingVisible === undefined || typeof evidence.endingVisible === 'boolean');
}

/**
 * Only public DOM evidence is accepted. resultVisible MUST mean that the native
 * result overlay (including its elapsed-time description) is actually visible.
 * endingVisible marks the separate animation; it is not a visible result.
 * No wall clock, predicted size, controller state, or hidden game state decides a win.
 */
function classifyEvidence(evidence) {
  if (!evidenceShape(evidence)) return { outcome: 'unknown-evidence', seconds: null };
  if (evidence.resultVisible) {
    const match = /(?:遊玩時間|Play time)\s*(\d+):([0-5]\d)(?!\d)/i.exec(evidence.description);
    const seconds = match ? clock(match[1] + ':' + match[2]) : null;
    if (seconds === null || evidence.endingVisible === true) return { outcome: 'unknown-native', seconds };
    const title = evidence.title.trim();
    if (/^(?:成功過關[！!]?|You win!)$/i.test(title)) return { outcome: seconds <= 150 ? 'win' : 'late-win', seconds };
    if (/^(?:被大史萊姆吞掉了|You were eaten!)$/i.test(title)) return { outcome: 'death', seconds };
    if (/^(?:時間到[！!]未達成目標|Time's up!)$/i.test(title)) return { outcome: 'game-timeout', seconds };
    return { outcome: 'unknown-native', seconds };
  }
  if (evidence.endingVisible === true) return null;
  const remaining = clock(evidence.remaining);
  if (remaining !== null && remaining >= 0 && remaining <= 300 && 300 - remaining > 150) {
    return { outcome: 'deadline', seconds: 300 - remaining };
  }
  return null;
}

function emptyCounts() {
  return {
    planned: 0, starts: 0, nativeStarts: 0, results: 0, validResults: 0,
    wins: 0, lateWins: 0, deaths: 0, gameTimeouts: 0, deadlines: 0,
    aborts: 0, unknown: 0, unresolved: 0, stopUnverified: 0
  };
}

/**
 * Validate the entire immutable JSONL ledger, not a filtered list of successes.
 * expectedContract is required and compared in full. seenBatchIds prevents
 * reusing an earlier batch identity when checking multiple independent batches.
 * ok means integrity passed; requireGate:true additionally requires that phase's
 * research threshold. diagnostic has no threshold and cannot authorize confirm.
 */
function validateLedger(rows, opts = {}) {
  const issues = [], gateIssues = [], counts = Object.create(null);
  const add = (code, message, row, id) => issues.push({ code, message, ...(row === undefined ? {} : { row }), ...(id === undefined ? {} : { id }) });
  const versions = opts.expectedVersions === undefined ? DEFAULT_VERSIONS : opts.expectedVersions;
  const validVersions = Array.isArray(versions) && versions.length > 0 && versions.every(nonempty) && new Set(versions).size === versions.length;
  if (!validVersions) add('invalid_expected_versions', 'expectedVersions must contain unique, nonempty version names.');
  const allowed = new Set(validVersions ? versions : DEFAULT_VERSIONS);
  for (const version of allowed) counts[version] = emptyCounts();
  const countFor = version => counts[version] || (counts[version] = emptyCounts());
  const data = Array.isArray(rows) ? rows : [];
  if (!Array.isArray(rows)) add('not_rows', 'Ledger must be an array of parsed JSONL objects.');
  const header = object(data[0]) ? data[0] : {};
  if (header.type !== 'batch') add('missing_header', 'The first row must be the only batch header.', 0);
  if (!nonempty(header.batchId)) add('invalid_batch_id', 'batchId must be a nonempty string.', 0);
  const phase = header.phase;
  if (!['diagnostic', 'explore', 'confirm'].includes(phase)) add('invalid_phase', 'Unknown batch phase.', 0);
  const seen = opts.seenBatchIds === undefined ? [] : opts.seenBatchIds;
  if (!(Array.isArray(seen) || seen instanceof Set)) add('invalid_seen_batches', 'seenBatchIds must be an array or Set.');
  else if (new Set(seen).has(header.batchId)) add('reused_batch_id', 'batchId already belongs to an earlier batch.', 0);

  const contract = header.contract;
  if (!object(contract)) add('invalid_contract', 'Batch contract must be an object.', 0);
  else {
    if (!/^[a-f0-9]{64}$/.test(contract.runnerSha256 || '')) add('missing_runner_hash', 'contract.runnerSha256 must freeze the runner bytes.', 0);
    if (!object(contract.browser) || !nonempty(contract.browser.name) || !nonempty(contract.browser.version)) add('missing_browser', 'contract.browser requires name and exact version.', 0);
    if (!object(contract.viewport) || !Number.isSafeInteger(contract.viewport.width) || contract.viewport.width <= 0 || !Number.isSafeInteger(contract.viewport.height) || contract.viewport.height <= 0) add('invalid_viewport', 'contract.viewport requires positive integer width and height.', 0);
    if (!Number.isFinite(contract.deviceScaleFactor) || contract.deviceScaleFactor <= 0) add('invalid_dpr', 'contract.deviceScaleFactor must be positive.', 0);
  }
  if (!object(opts.expectedContract)) add('missing_expected_contract', 'Pass the independently frozen expectedContract.');
  else if (!isDeepStrictEqual(contract, opts.expectedContract)) add('contract_mismatch', 'The complete contract differs from the frozen expectedContract.', 0);

  const planned = Array.isArray(header.planned) ? header.planned : [];
  if (!Array.isArray(header.planned) || planned.length === 0) add('invalid_plan', 'The batch must declare a nonempty planned sequence.', 0);
  const planIds = new Set();
  for (const item of planned) {
    if (!object(item) || !nonempty(item.id) || !nonempty(item.version)) { add('invalid_plan_entry', 'Every planned entry requires id and version.', 0); continue; }
    if (planIds.has(item.id)) add('duplicate_planned_id', 'Every planned id must be unique across versions.', 0, item.id);
    planIds.add(item.id);
    if (!allowed.has(item.version)) add('unknown_planned_version', 'The plan includes an unknown game version.', 0, item.id);
    countFor(item.version).planned++;
  }
  const required = phase === 'explore' ? 4 : phase === 'confirm' ? 12 : null;
  if (required !== null) for (const version of allowed) {
    if (counts[version].planned !== required) add('wrong_planned_count', `${phase} requires exactly ${required} planned attempts for ${version}.`, 0);
  }

  const startIds = new Map(), resultIds = new Map();
  let active = null, cursor = 0, endCount = 0, endIndex = -1;
  function rowIdentity(row, index) {
    if (row.batchId !== header.batchId) add('row_batch_mismatch', 'Row belongs to a different or missing batchId.', index, row.id);
  }
  for (let index = header.type === 'batch' ? 1 : 0; index < data.length; index++) {
    const row = data[index];
    if (!object(row)) { add('invalid_row', 'Every row must be an object.', index); continue; }
    if (endCount) add('row_after_end', 'No rows may follow batch-end.', index, row.id);
    rowIdentity(row, index);
    if (row.type === 'batch') { add('duplicate_header', 'A ledger may contain only one batch header.', index); continue; }
    if (row.type === 'batch-end') {
      endCount++; endIndex = index;
      if (active !== null || cursor !== planned.length) add('premature_end', 'batch-end appears before all planned attempts have a result.', index);
      continue;
    }
    if (row.type === 'sample' || row.type === 'event') {
      if (row.type === 'sample' && active === null) add('sample_without_start', 'Samples must belong to the currently active attempt.', index, row.id);
      if (row.type === 'sample' || row.id !== undefined || row.version !== undefined) {
        if (active === null || row.id !== active.id || row.version !== active.version) add('event_identity_mismatch', 'Sample/event identity does not match the active attempt.', index, row.id);
      }
      continue;
    }
    if (!['start', 'result'].includes(row.type)) { add('unknown_row_type', 'Unexpected ledger row type.', index, row.id); continue; }
    if (!nonempty(row.id) || !nonempty(row.version)) add('invalid_run_identity', 'start/result require nonempty id and version.', index, row.id);
    if (!allowed.has(row.version)) add('unknown_result_version', 'start/result includes an unknown game version.', index, row.id);
    const count = countFor(String(row.version));
    const expected = planned[cursor];
    if (!expected || row.id !== expected.id || row.version !== expected.version) add('planned_order_mismatch', 'Attempt order or identity differs from the fixed plan.', index, row.id);
    if (row.type === 'start') {
      count.starts++;
      startIds.set(row.id, (startIds.get(row.id) || 0) + 1);
      if (startIds.get(row.id) > 1) add('duplicate_start', 'An attempt may start only once.', index, row.id);
      if (active !== null) add('start_before_result', 'The preceding attempt is still unresolved.', index, row.id);
      else active = row;
      continue;
    }

    count.results++;
    resultIds.set(row.id, (resultIds.get(row.id) || 0) + 1);
    if (resultIds.get(row.id) > 1) add('duplicate_result', 'An attempt may have only one result.', index, row.id);
    if (active === null) add('result_without_start', 'Result has no currently active start.', index, row.id);
    else if (row.id !== active.id || row.version !== active.version) add('result_identity_mismatch', 'Result does not close the active attempt.', index, row.id);
    if (active !== null) { active = null; cursor++; }
    if (typeof row.nativeStarted !== 'boolean' || typeof row.stopVerified !== 'boolean') add('invalid_result_flags', 'nativeStarted and stopVerified must be booleans.', index, row.id);
    if (row.nativeStarted === true) count.nativeStarts++;
    if (row.stopVerified !== true) count.stopUnverified++;
    if (!secondsValue(row.seconds)) add('invalid_seconds', 'Result seconds must be null or a nonnegative integer.', index, row.id);
    if (!evidenceShape(row.evidence)) add('invalid_evidence', 'Result requires the complete visible-evidence shape.', index, row.id);
    const classified = classifyEvidence(row.evidence);
    if (VALID_OUTCOMES.has(row.outcome)) {
      count.validResults++;
      const counter = { win: 'wins', 'late-win': 'lateWins', death: 'deaths', 'game-timeout': 'gameTimeouts', deadline: 'deadlines' }[row.outcome];
      count[counter]++;
      if (row.nativeStarted !== true) add('outcome_without_native_start', 'A valid game outcome requires a verified native start.', index, row.id);
      if (!classified || classified.outcome !== row.outcome || classified.seconds !== row.seconds) add('outcome_evidence_mismatch', 'Reclassification of visible evidence disagrees with the recorded outcome/time.', index, row.id);
    } else if (ABORT_OUTCOMES.has(row.outcome)) {
      count.aborts++;
      if (row.seconds !== null) add('abort_has_game_time', 'An infrastructure/controller abort must use seconds:null.', index, row.id);
      if (classified && VALID_OUTCOMES.has(classified.outcome)) add('abort_conflicts_with_outcome', 'An abort cannot replace an already evidenced native outcome/deadline.', index, row.id);
    } else if (UNKNOWN_OUTCOMES.has(row.outcome)) {
      count.unknown++;
      if (classified && VALID_OUTCOMES.has(classified.outcome)) add('unknown_conflicts_with_outcome', 'Unknown conflicts with a definite visible outcome/deadline.', index, row.id);
      if (row.outcome === 'unknown-native' && (!classified || classified.outcome !== 'unknown-native' || row.seconds !== classified.seconds)) add('unknown_native_mismatch', 'unknown-native must preserve the visible native result and any parsed time.', index, row.id);
      if (row.outcome !== 'unknown-native' && row.seconds !== null) add('unknown_has_game_time', 'Generic unknown must use seconds:null.', index, row.id);
    } else {
      count.unknown++;
      add('unknown_outcome', 'Unrecognized outcome; it is retained and cannot pass a gate.', index, row.id);
    }
  }
  if (endCount !== 1) add('wrong_end_count', 'Exactly one final batch-end is required.');
  if (endIndex !== data.length - 1) add('end_not_last', 'The last row must be batch-end.');
  if (active !== null) add('unresolved_start', 'The final started attempt has no result.', undefined, active.id);
  for (const item of planned) if (object(item) && nonempty(item.id)) {
    if (startIds.get(item.id) !== 1) add('missing_or_duplicate_start', 'Each planned attempt must have exactly one start.', undefined, item.id);
    if (resultIds.get(item.id) !== 1) add('missing_or_duplicate_result', 'Each planned attempt must have exactly one result.', undefined, item.id);
  }
  for (const count of Object.values(counts)) count.unresolved = Math.max(0, count.starts - count.results);
  const totals = emptyCounts();
  for (const count of Object.values(counts)) for (const key of Object.keys(totals)) totals[key] += count[key];
  const complete = endCount === 1 && endIndex === data.length - 1 && active === null && cursor === planned.length &&
    totals.starts === planned.length && totals.results === planned.length &&
    planned.every(item => object(item) && startIds.get(item.id) === 1 && resultIds.get(item.id) === 1);
  const integrityOk = issues.length === 0;
  let gatePassed = null;
  if (required !== null) {
    if (!integrityOk || !complete) gateIssues.push({ code: 'ledger_not_valid', message: 'The complete ledger must pass integrity verification.' });
    const threshold = phase === 'explore' ? 2 : 6;
    for (const version of allowed) {
      const c = counts[version];
      if (c.starts !== required || c.results !== required || c.nativeStarts !== required || c.validResults !== required || c.stopUnverified !== 0 || c.aborts !== 0 || c.unknown !== 0) {
        gateIssues.push({ code: 'incomplete_native_cohort', version, message: 'Every planned attempt must have an approved game outcome/deadline and verified release; aborts and unknowns remain in the denominator.' });
      }
      if (c.wins < threshold) gateIssues.push({ code: 'win_threshold_not_met', version, message: `At least ${threshold}/${required} visible wins within 150 seconds are required.` });
    }
    gatePassed = gateIssues.length === 0;
  } else if (opts.requireGate === true) gateIssues.push({ code: 'diagnostic_has_no_gate', message: 'A diagnostic batch cannot authorize confirmation or establish the win-rate goal.' });
  return {
    schemaVersion: 1, batchId: header.batchId || null, phase: phase || null,
    ok: integrityOk && (opts.requireGate !== true || gatePassed === true), integrityOk, complete, gatePassed,
    eligibleForConfirm: phase === 'explore' && gatePassed === true,
    meetsGoal: phase === 'confirm' && gatePassed === true,
    counts, totals, issues, gateIssues
  };
}

module.exports = { classifyEvidence, validateLedger, clock, DEFAULT_VERSIONS };
