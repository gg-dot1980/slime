#!/usr/bin/env node
// Numeric-only review of Grow experiment JSONL. No browser or game-state access.
// Usage: node summarize.mjs events.jsonl [more-events.jsonl ...]
// Harness records use {kind, runId, batch, version, strategy}; final records
// include {final:{title,description,hudSize,hudTime,elapsedVisible,resultSeconds},
// computeMs:[], samples:[], controllerEvents:[], keysReleased}.
// A visible winning result plus its play time determines success; HUD size alone
// does not. Aborts/errors/unknowns after a start remain in the primary denominator.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const finite = value => typeof value === 'number' && Number.isFinite(value);
export function quantile(values, probability) {
  if (!finite(probability) || probability < 0 || probability > 1) throw new RangeError('Quantile probability must be between 0 and 1');
  const sorted = values.filter(finite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * probability;
  const low = Math.floor(position), high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}
export const median = values => quantile(values, .5);
export function describe(values) {
  const numbers = values.filter(finite);
  return {n: numbers.length, median: median(numbers), p95: quantile(numbers, .95), p99: quantile(numbers, .99), max: numbers.length ? numbers.reduce((a, b) => Math.max(a, b), -Infinity) : null};
}
export function wilsonInterval(wins, total, z = 1.959963984540054) {
  if (!Number.isInteger(wins) || !Number.isInteger(total) || wins < 0 || total < 0 || wins > total || !finite(z) || z <= 0) throw new RangeError('Invalid binomial counts or z score');
  if (!total) return {low: null, high: null};
  const rate = wins / total, z2 = z * z, denominator = 1 + z2 / total;
  const center = (rate + z2 / (2 * total)) / denominator;
  const radius = z * Math.sqrt(rate * (1 - rate) / total + z2 / (4 * total * total)) / denominator;
  return {low: Math.max(0, center - radius), high: Math.min(1, center + radius)};
}

const aliases = {
  'win<=150': 'win_le150', 'win>150': 'win_late', win: 'win_le150',
  cutoff150: 'deadline_cutoff', cutoff: 'deadline_cutoff',
  'controller-stop': 'controller_abort', 'controller-abort': 'controller_abort',
  'infra-error': 'infrastructure_error', 'wall-timeout': 'infrastructure_error',
  timeout300: 'game_timeout',
};
const outcomes = ['win_le150', 'win_late', 'death', 'deadline_cutoff', 'game_timeout', 'controller_abort', 'infrastructure_error', 'unknown', 'in_progress'];
const normalizeOutcome = value => aliases[value] || (outcomes.includes(value) ? value : 'unknown');
const first = (...values) => values.find(value => value !== undefined && value !== null);
const eventType = event => first(event.type, event.event, event.kind);
const text = value => typeof value === 'string' ? value : '';
function resultFields(event) {
  const title = text(first(event.final?.title, event.resultTitle, event.visible?.title, event.result?.title, event.title));
  const description = text(first(event.final?.description, event.resultDescription, event.visible?.description, event.result?.description, event.description));
  const clock = /(?:遊玩時間|Play time)\s*(\d+):(\d+)/i.exec(description);
  const visibleSeconds = clock ? Number(clock[1]) * 60 + Number(clock[2]) : null;
  const gameSeconds = first(visibleSeconds, finite(event.final?.resultSeconds) ? event.final.resultSeconds : null, finite(event.gameSeconds) ? event.gameSeconds : null);
  const size = first(event.final?.hudSize, event.size, event.visible?.hudSize);
  return {title, description, gameSeconds: gameSeconds ?? null,
    elapsedVisible: finite(event.final?.elapsedVisible) ? event.final.elapsedVisible : null,
    hudTime: text(first(event.final?.hudTime, event.hudTime, event.visible?.hudTime)), size: finite(size) ? size : null};
}
export function classifyFinal(event, deadlineSeconds = 150) {
  const fields = resultFields(event), declared = normalizeOutcome(first(event.outcome, event.result?.outcome));
  let outcome = declared;
  const flags = [];
  if (/成功過關|You win/i.test(fields.title)) {
    outcome = fields.gameSeconds === null ? 'unknown' : fields.gameSeconds <= deadlineSeconds ? 'win_le150' : 'win_late';
    if (fields.gameSeconds === null) flags.push('winning_title_without_play_time');
  } else if (/吞掉|吞食|eaten|swallowed/i.test(fields.title)) outcome = 'death';
  else if (/時間到|Time(?: is)? up/i.test(fields.title)) outcome = 'game_timeout';
  else if (declared === 'win_le150' || declared === 'win_late') {
    outcome = 'unknown';
    flags.push('declared_win_without_visible_winning_title');
  }
  if (declared !== 'unknown' && outcome !== declared) flags.push(`declared_outcome_mismatch:${declared}:${outcome}`);
  return {...fields, outcome, declaredOutcome: declared, flags};
}

function identity(start, final) {
  return {
    batchId: text(first(start?.batchId, start?.batch, final?.batchId, final?.batch)) || 'unassigned',
    phase: text(first(start?.phase, final?.phase)) || 'unspecified',
    gameVersion: text(first(start?.gameVersion, start?.version, final?.gameVersion, final?.version)) || 'unknown',
    strategy: text(first(start?.strategy, final?.strategy)) || 'unknown',
  };
}
export function summarizeEvents(events, {deadlineSeconds = 150, inputErrors = []} = {}) {
  const byRun = new Map(), issues = inputErrors.map(error => ({severity: 'error', ...error})), manifests = [], lifecycle = [], slots = [];
  let ignoredEvents = 0;
  for (const [index, event] of events.entries()) {
    if (!event || typeof event !== 'object' || Array.isArray(event)) {issues.push({severity: 'error', index, reason: 'event_not_object'}); continue;}
    const type = eventType(event);
    if (['batch_start', 'protocol', 'manifest'].includes(type)) {manifests.push(event); continue;}
    if (['batch_end', 'batch_error'].includes(type)) {lifecycle.push(event); continue;}
    if (type === 'slot') {slots.push(event); continue;}
    if (!['start', 'final', 'progress', 'sample', 'decision'].includes(type)) {ignoredEvents++; continue;}
    if (typeof event.runId !== 'string' || !event.runId) {issues.push({severity: 'error', index, reason: 'missing_run_id', type}); continue;}
    if (!byRun.has(event.runId)) byRun.set(event.runId, {runId: event.runId, starts: [], finals: [], progress: [], metrics: []});
    const run = byRun.get(event.runId);
    if (type === 'start') run.starts.push(event);
    else if (type === 'final') run.finals.push(event);
    else if (type === 'progress') run.progress.push(event);
    const computeMs = first(event.computeMs, event.elapsedCompute, event.timing?.computeMs);
    if (finite(computeMs)) run.metrics.push(computeMs);
  }
  const runs = [], groups = new Map();
  for (const run of byRun.values()) {
    const start = run.starts[0], final = run.finals[0], id = identity(start, final);
    const batchManifest = manifests.find(event => first(event.batch, event.batchId) === id.batchId);
    if (id.phase === 'unspecified' && batchManifest?.protocol) {
      if (batchManifest.protocol.screen?.id === id.batchId) id.phase = 'exploration';
      else if (batchManifest.protocol.confirmation?.id === id.batchId) id.phase = 'confirmation';
    }
    const classified = final ? classifyFinal(final, deadlineSeconds) : {outcome: 'in_progress', gameSeconds: null, size: null, title: '', description: '', hudTime: '', flags: []};
    const flags = [...classified.flags];
    if (!start) flags.push('missing_start_record');
    if (run.starts.length > 1) flags.push('duplicate_start_records');
    if (run.finals.length > 1) flags.push('duplicate_final_records');
    if (!final && lifecycle.some(event => first(event.batch, event.batchId) === id.batchId)) {flags.push('batch_ended_without_final'); classified.outcome = 'unknown';}
    const finals = run.finals.map(value => classifyFinal(value, deadlineSeconds));
    if (new Set(finals.map(value => JSON.stringify([value.outcome, value.gameSeconds, value.title, value.description]))).size > 1) {flags.push('conflicting_final_records'); classified.outcome = 'unknown';}
    if (id.gameVersion === 'unknown' || id.strategy === 'unknown') flags.push('missing_version_or_strategy');
    if (start && final) {
      const a = identity(start, null), b = identity(null, final);
      for (const key of ['gameVersion', 'strategy']) if (a[key] !== 'unknown' && b[key] !== 'unknown' && a[key] !== b[key]) {flags.push(`identity_conflict:${key}`); classified.outcome = 'unknown';}
      if (start.protocolHash && final.protocolHash && start.protocolHash !== final.protocolHash) flags.push('protocol_hash_changed_within_run');
    }
    if (final?.keysReleased === false) flags.push('keys_not_released');
    const protocol = batchManifest?.protocol;
    if (start && protocol) {
      for (const key of ['protocolHash', 'pageHash', 'plannerHash']) if (start[key] && protocol[key] && start[key] !== protocol[key]) flags.push(`manifest_hash_mismatch:${key}`);
      const expected = batchManifest.planned?.[start.index];
      if (expected && (expected.version !== id.gameVersion || expected.strategy !== id.strategy)) flags.push('planned_slot_identity_mismatch');
    }
    const regularMetrics = Array.isArray(final?.computeMs) ? final.computeMs.filter(finite) : run.metrics;
    const controllerEvents = Array.isArray(final?.controllerEvents) ? final.controllerEvents : [];
    const overrunMetrics = controllerEvents.filter(event => event.type === 'compute_overrun').map(event => event.elapsedCompute).filter(finite);
    const metrics = [...regularMetrics, ...overrunMetrics];
    if (Number.isInteger(final?.decisions) && Array.isArray(final?.computeMs) && final.decisions !== final.computeMs.length) flags.push('decision_metric_count_mismatch');
    const samples = Array.isArray(final?.samples) ? final.samples : [];
    const checkpoints = [30, 60, 90, 120].map(requested => {
      const sample = samples.find(value => finite(value.elapsedVisible) && value.elapsedVisible >= requested);
      return {requestedElapsedVisible: requested, observedElapsedVisible: sample?.elapsedVisible ?? null, observedHudSize: sample?.hudSize ?? null, samplingRule: 'first_sample_at_or_after_requested_visible_time'};
    });
    for (const flag of flags) issues.push({severity: 'error', runId: run.runId, reason: flag});
    const row = {runId: run.runId, ...id, index: start?.index ?? final?.index ?? null,
      started: !!start, startedVisible: typeof start?.startedVisible === 'boolean' ? start.startedVisible : null,
      finalized: !!final, startRecordCount: run.starts.length, finalRecordCount: run.finals.length,
      ...classified, flags, keysReleased: final?.keysReleased ?? null, decisions: final?.decisions ?? null,
      progressRecords: run.progress.length, latestProgress: run.progress.at(-1)?.visible ?? null,
      computeMs: describe(metrics), completedDecisionComputeMs: describe(regularMetrics), computeOverruns: overrunMetrics.length,
      growthCheckpoints: checkpoints,
      sourceHashes: start?.sourceHashes ?? {protocolHash: start?.protocolHash ?? final?.protocolHash ?? null,
        pageHash: start?.pageHash ?? null, plannerHash: start?.plannerHash ?? null, gameHashes: start?.gameHashes ?? null}};
    runs.push(row);
    if (!start) continue; // Orphan finals cannot manufacture starts or successes.
    const key = JSON.stringify(id);
    if (!groups.has(key)) groups.set(key, {...id, rows: [], metrics: []});
    groups.get(key).rows.push(row); groups.get(key).metrics.push(...metrics);
  }
  // Keep planned groups visible even when a batch stops before their first start.
  for (const manifest of manifests) {
    if (!Array.isArray(manifest.planned)) continue;
    const batchId = first(manifest.batch, manifest.batchId) || 'unassigned';
    const phase = manifest.protocol?.screen?.id === batchId ? 'exploration' : manifest.protocol?.confirmation?.id === batchId ? 'confirmation' : 'unspecified';
    for (const slot of manifest.planned) {
      const id = {batchId, phase, gameVersion: slot.version, strategy: slot.strategy}, key = JSON.stringify(id);
      if (!groups.has(key)) groups.set(key, {...id, rows: [], metrics: []});
    }
  }
  const summaries = [...groups.values()].map(({rows, metrics, ...id}) => {
    const counts = Object.fromEntries(outcomes.map(outcome => [outcome, 0]));
    for (const row of rows) counts[row.outcome]++;
    const started = rows.length, wins = counts.win_le150;
    const batchManifest = manifests.find(event => first(event.batch, event.batchId) === id.batchId);
    const planned = batchManifest?.planned?.filter(slot => slot.version === id.gameVersion && slot.strategy === id.strategy).length ?? null;
    return {...id, plannedRuns: planned, startedRuns: started, visiblyConfirmedStarts: rows.filter(row => row.startedVisible === true).length,
      visiblyUnconfirmedStarts: rows.filter(row => row.startedVisible === false).length,
      startConfirmationNotRecorded: rows.filter(row => row.startedVisible === null).length,
      finalizedRuns: rows.filter(row => row.finalized).length, counts,
      winRate: started ? wins / started : null, winRateFraction: `${wins}/${started}`, wilson95: wilsonInterval(wins, started),
      denominator: 'all_recorded_start_attempts_including_unconfirmed_starts_aborts_errors_unknowns_and_in_progress',
      provisional: rows.some(row => !row.finalized) || (planned !== null && started !== planned), computeMs: describe(metrics),
      computeOverruns: rows.reduce((sum, row) => sum + row.computeOverruns, 0),
      winningGameSeconds: describe(rows.filter(row => row.outcome === 'win_le150').map(row => row.gameSeconds)),
      deathGameSeconds: describe(rows.filter(row => row.outcome === 'death').map(row => row.gameSeconds)),
      cutoffObservedSize: describe(rows.filter(row => row.outcome === 'deadline_cutoff').map(row => row.size)),
      runIds: rows.map(row => row.runId)};
  });
  const batches = manifests.filter(event => eventType(event) === 'batch_start').map(manifest => {
    const batchId = first(manifest.batch, manifest.batchId), members = runs.filter(row => row.batchId === batchId), ended = lifecycle.filter(event => first(event.batch, event.batchId) === batchId);
    if (manifests.filter(event => eventType(event) === 'batch_start' && first(event.batch, event.batchId) === batchId).length > 1) issues.push({severity: 'error', batchId, reason: 'duplicate_batch_start'});
    return {batchId, plannedRuns: manifest.planned?.length ?? null, recordedSlots: slots.filter(slot => first(slot.batch, slot.batchId) === batchId).length,
      recordedStarts: members.filter(row => row.started).length, recordedFinals: members.filter(row => row.finalized).length,
      lifecycle: ended, protocolHash: manifest.protocol?.protocolHash ?? null};
  });
  return {schemaVersion: 1, deadlineSeconds, inputEventCount: events.length, ignoredEventCount: ignoredEvents,
    integrity: {ok: !issues.some(issue => issue.severity === 'error'), issues}, batches, manifests, groups: summaries, runs,
    limitations: ['No automatic acceptance claim: exploration and confirmation remain separate.', 'Visible game times have their displayed resolution; cutoff size is not exact 150-second size.', 'No outcomes or sample counts are inferred for unrecorded starts.']};
}

export async function readJsonl(paths) {
  const events = [], errors = [];
  for (const path of paths) {
    const source = await readFile(path, 'utf8');
    for (const [line, raw] of source.split(/\r?\n/).entries()) {
      if (!raw.trim()) continue;
      try {events.push(JSON.parse(raw));}
      catch (error) {errors.push({file: path, line: line + 1, reason: 'invalid_json', message: error.message});}
    }
  }
  return {events, errors};
}
async function main(paths) {
  if (!paths.length) throw new Error('Usage: node summarize.mjs events.jsonl [more-events.jsonl ...]');
  const {events, errors} = await readJsonl(paths);
  const summary = summarizeEvents(events, {inputErrors: errors});
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  if (!summary.integrity.ok) process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(error => {process.stderr.write(`${error.message}\n`); process.exitCode = 1;});
