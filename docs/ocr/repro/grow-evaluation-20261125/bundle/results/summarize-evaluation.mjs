#!/usr/bin/env node
// Evidence analysis only. Never changes a raw event file or manufactures a final.
// Run: node results/summarize-evaluation.mjs --write
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { summarizeEvents, describe, wilsonInterval } from '../source/experiments/grow13/summarize.mjs';

const root = new URL('./', import.meta.url);
const sha = data => createHash('sha256').update(data).digest('hex');
const names = (await readdir(root)).sort();
const logNames = names.filter(n => /^(screen|confirm)-\d+(?:-recovery)?-events-noimages\.jsonl$/.test(n));
const inputs = [];
const logs = [];
const events = [];
const runEvents = new Map();
const batches = new Map();
for (const name of logNames) {
  const bytes = await readFile(new URL(name, root));
  const rows = bytes.toString('utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const info = { file: name, sha256: sha(bytes), bytes: bytes.length, events: rows.length, lastSavedAt: rows.at(-1)?.at ?? null };
  inputs.push(info); logs.push({ ...info, rows }); events.push(...rows);
  for (const row of rows) {
    if (row.kind === 'batch_start') {
      assert(!batches.has(row.batch), `Duplicate batch_start: ${row.batch}`);
      const manifest = { ...row.protocol }; delete manifest.protocolHash;
      assert.equal(sha(JSON.stringify(manifest)), row.protocol.protocolHash, `${row.batch}: protocol hash`);
      batches.set(row.batch, { row, input: info });
    }
    if (row.runId) {
      const item = runEvents.get(row.runId) ?? { input: info, rows: [] };
      assert.equal(item.input.file, name, `Run appears in two raw files: ${row.runId}`);
      item.rows.push(row); runEvents.set(row.runId, item);
    }
  }
}
const rawSummary = summarizeEvents(events);
const nativeRuns = new Map(rawSummary.runs.map(r => [r.runId, r]));
const annotations = new Map();
for (const name of names.filter(n => n.endsWith('-reviewer-sidecar.json'))) {
  const bytes = await readFile(new URL(name, root));
  const sidecar = JSON.parse(bytes);
  assert.equal(sidecar.recordType, 'reviewer_sidecar', `${name}: recordType`);
  const input = inputs.find(x => x.file === sidecar.rawEventFile.path);
  assert(input, `${name}: missing raw input`);
  assert.equal(input.sha256, sidecar.rawEventFile.sha256, `${name}: raw hash mismatch`);
  const a = sidecar.interruptedRun;
  assert.equal(a.isNativeFinal, false);
  assert.equal(a.nativeFinalPresent, false);
  assert.equal(a.countInStartedDenominator, true);
  assert.equal(a.countAsSuccess, false);
  assert.equal(a.reviewerClassification, 'infrastructure_error');
  assert(!annotations.has(a.runId), `Duplicate reviewer classification: ${a.runId}`);
  const evidence = { file: name, sha256: sha(bytes), bytes: bytes.length };
  annotations.set(a.runId, { annotation: a, evidence });
  inputs.push({ ...evidence, type: 'reviewer_sidecar' });
}

const logicalPlans = new Map();
const physicalToLogical = new Map();
const cohortMetadata = new Map();
function phaseOf(batch, protocol) {
  return batch === protocol.screen?.id ? 'exploration' : batch === protocol.confirmation?.id ? 'confirmation' : 'unknown';
}
for (const [batch, { row }] of batches) {
  const recovery = row.protocol.recovery;
  if (recovery && batch === row.protocol.screen.id) continue;
  const phase = phaseOf(batch, row.protocol);
  cohortMetadata.set(batch, { phase, protocol: row.protocol });
  row.planned.forEach((slot, index) => {
    const id = `${batch}-${String(index + 1).padStart(2, '0')}`;
    assert(!logicalPlans.has(id));
    logicalPlans.set(id, { logicalRunId: id, cohort: batch, phase, originalIndex: index, version: slot.version, strategy: slot.strategy });
  });
}
for (const [batch, { row }] of batches) {
  const recovery = row.protocol.recovery;
  if (!recovery || batch !== row.protocol.screen.id) continue;
  const parent = batches.get(recovery.originalBatch)?.row;
  assert(parent, `${batch}: original batch absent`);
  assert.equal(recovery.parentProtocolHash, parent.protocol.protocolHash);
  for (const key of ['sourceHash', 'plannerHash', 'harnessHash', 'isolationHash', 'games', 'viewport', 'perception', 'input', 'seed', 'maxComputeMs', 'concurrency']) {
    assert.deepEqual(row.protocol[key], parent.protocol[key], `${batch}: changed ${key}`);
  }
  assert.equal(Object.keys(recovery.slotMapping).length, row.planned.length);
  row.planned.forEach((slot, index) => {
    const physical = `${batch}-${String(index + 1).padStart(2, '0')}`;
    const logical = recovery.slotMapping[physical];
    const plan = logicalPlans.get(logical);
    assert(plan, `${batch}: unknown logical slot ${logical}`);
    assert.equal(plan.version, slot.version); assert.equal(plan.strategy, slot.strategy);
    assert(!runEvents.get(logical)?.rows.some(x => x.kind === 'start'), `Replayed original start: ${logical}`);
    assert(![...physicalToLogical.values()].includes(logical), `Logical slot mapped twice: ${logical}`);
    physicalToLogical.set(physical, logical);
  });
}
const logicalToPhysical = new Map([...physicalToLogical].map(([p, l]) => [l, p]));
const usedAnnotations = new Set();
const allRuns = [];
for (const plan of logicalPlans.values()) {
  const physicalRunId = logicalToPhysical.get(plan.logicalRunId) ?? plan.logicalRunId;
  const entry = runEvents.get(physicalRunId);
  const starts = entry?.rows.filter(x => x.kind === 'start') ?? [];
  const finals = entry?.rows.filter(x => x.kind === 'final') ?? [];
  assert(starts.length <= 1 && finals.length <= 1, `${physicalRunId}: repeated start/final`);
  const start = starts[0]; const final = finals[0]; const annotation = annotations.get(physicalRunId);
  assert(!final || start, `${physicalRunId}: final without start`);
  assert(!annotation || (start && !final), `${physicalRunId}: reviewer annotation conflicts with native records`);
  const native = nativeRuns.get(physicalRunId);
  if (start) {
    assert.equal(start.version, plan.version); assert.equal(start.strategy, plan.strategy);
    const protocol = batches.get(start.batch)?.row.protocol;
    assert(protocol, `${physicalRunId}: batch absent`);
    assert.equal(start.protocolHash, protocol.protocolHash);
    assert.equal(start.pageHash, protocol.pageHash);
    assert.equal(start.plannerHash, protocol.plannerHash);
    if (protocol.geometryHash) assert.equal(start.geometryHash, protocol.geometryHash);
    if (start.sourceHash) assert.equal(start.sourceHash, protocol.sourceHash);
    assert.deepEqual(start.gameHashes, protocol.games[start.version]);
  }
  if (annotation) usedAnnotations.add(physicalRunId);
  const progress = entry?.rows.filter(x => x.kind === 'progress').at(-1);
  allRuns.push({
    ...plan, physicalRunId, physicalBatch: start?.batch ?? null,
    sourceFile: entry?.input.file ?? null, sourceSha256: entry?.input.sha256 ?? null,
    started: !!start, startedAt: start?.at ?? null, startedVisible: start?.startedVisible ?? null,
    nativeFinalPresent: !!final, nativeFinalAt: final?.at ?? null,
    nativeOutcome: native?.outcome ?? 'not_started',
    reviewedOutcome: annotation ? 'infrastructure_error' : native?.outcome ?? 'not_started',
    outcomeEvidence: annotation ? 'reviewer_sidecar' : final ? 'native_final' : start ? 'unresolved_native_record' : 'not_started',
    reviewerAnnotation: annotation?.evidence ?? null,
    nativeFinal: final ? { visible: final.final, wallMs: final.wallMs, decisions: final.decisions, keysReleased: final.keysReleased } : null,
    lastSavedProgress: progress ? { at: progress.at, visible: progress.visible, wallMs: progress.wallMs, decisions: progress.decisions } : null,
    gameSeconds: final ? native.gameSeconds : null,
    growthCheckpoints: final ? native.growthCheckpoints : null,
    computeMs: final ? native.computeMs : null,
    environment: start?.environment ?? null,
    flags: native?.flags ?? []
  });
}
assert.equal(usedAnnotations.size, annotations.size, 'Unused reviewer annotation');
assert.equal(allRuns.filter(r => r.started).length, events.filter(e => e.kind === 'start').length, 'Unaccounted or duplicate start');
const outcomeNames = ['win_le150', 'win_late', 'death', 'deadline_cutoff', 'game_timeout', 'controller_abort', 'infrastructure_error', 'unknown', 'in_progress'];
const groupKeys = [...new Set(allRuns.map(r => JSON.stringify([r.cohort, r.phase, r.version, r.strategy])))];
const groups = groupKeys.map(key => {
  const [cohort, phase, version, strategy] = JSON.parse(key);
  const planned = allRuns.filter(r => r.cohort === cohort && r.phase === phase && r.version === version && r.strategy === strategy);
  const runs = planned.filter(r => r.started);
  const counts = Object.fromEntries(outcomeNames.map(k => [k, runs.filter(r => r.reviewedOutcome === k).length]));
  const completeFinals = runs.filter(r => r.nativeFinalPresent).map(r => runEvents.get(r.physicalRunId).rows.find(e => e.kind === 'final'));
  const compute = completeFinals.flatMap(f => [...(f.computeMs ?? []), ...(f.controllerEvents ?? []).filter(e => e.type === 'compute_overrun').map(e => e.elapsedCompute)]);
  return {
    cohort, phase, gameVersion: version, strategy, plannedRuns: planned.length, startedRuns: runs.length,
    visiblyConfirmedStarts: runs.filter(r => r.startedVisible === true).length,
    nativeFinals: completeFinals.length, reviewerClassifiedInfrastructureErrors: runs.filter(r => r.outcomeEvidence === 'reviewer_sidecar').length,
    unresolvedNativeStarts: runs.filter(r => !r.nativeFinalPresent).length,
    unresolvedAfterReview: runs.filter(r => ['in_progress', 'unknown'].includes(r.reviewedOutcome)).length,
    unstartedLogicalSlots: planned.length - runs.length, counts,
    denominator: 'all_recorded_starts_including_reviewed_infrastructure_failures; phases_and_versions_separate',
    winRateFraction: `${counts.win_le150}/${runs.length}`, winRate: runs.length ? counts.win_le150 / runs.length : null,
    wilson95: runs.length ? wilsonInterval(counts.win_le150, runs.length) : null,
    provisional: runs.length < planned.length || runs.some(r => ['in_progress', 'unknown'].includes(r.reviewedOutcome)),
    winningGameSeconds: describe(runs.filter(r => r.reviewedOutcome === 'win_le150').map(r => r.gameSeconds)),
    computeMsFromNativeFinalsOnly: describe(compute), completeComputeDataRuns: completeFinals.length,
    computeCoverageNote: 'Final compute arrays only; missing-final runs have incomplete diagnostics and are not reconstructed from progress samples.',
    logicalRunIds: planned.map(r => r.logicalRunId), physicalRunIds: runs.map(r => r.physicalRunId)
  };
});
const gates = [];
function candidateOf(protocol) {
  return protocol.candidate ?? protocol.confirmation?.condition?.match(/^(grow-\d+)/)?.[1];
}
function plannedVersions(protocol, phase, candidate = candidateOf(protocol)) {
  const config = phase === 'confirmation' ? protocol.confirmation : protocol.screen;
  const fromOrder = [...new Set((config.order ?? []).filter(s => !candidate || s.strategy === candidate).map(s => s.version))];
  const fromScreen = [...new Set(protocol.screen.order.filter(s => !candidate || s.strategy === candidate).map(s => s.version))];
  const versions = config.versions ?? (fromOrder.length ? fromOrder : fromScreen);
  assert(versions.length && new Set(versions).size === versions.length, `${config.id}: missing or duplicate planned version`);
  if (fromOrder.length) assert.deepEqual([...versions].sort(), fromOrder.sort(), `${config.id}: declared versions differ from order`);
  return versions;
}
for (const [cohort, meta] of cohortMetadata) {
  if (meta.phase !== 'exploration') continue;
  const condition = meta.protocol.confirmation?.condition ?? '';
  const candidate = candidateOf(meta.protocol);
  const threshold = condition.match(/>=\s*(\d+)\s*\/\s*(\d+)/);
  const winsThreshold = threshold?.[1] ?? condition.match(/>=\s*(\d+)\s+wins\b/)?.[1];
  const runThreshold = threshold?.[2] ?? meta.protocol.screen.NPerVersion;
  if (!candidate || winsThreshold === undefined || runThreshold === undefined) continue;
  const requiredVersions = plannedVersions(meta.protocol, 'exploration', candidate);
  const candidateGroups = groups.filter(g => g.cohort === cohort && g.strategy === candidate);
  const cohortComplete = groups.filter(g => g.cohort === cohort).every(g => !g.provisional);
  const requiredWins = +winsThreshold, requiredRunsPerVersion = +runThreshold;
  const allowedNativeFinalOutcomes = meta.protocol.screen.nativeOutcomes ?? null;
  const requiredNativeFinalsPerVersion = allowedNativeFinalOutcomes ? requiredRunsPerVersion : +(condition.match(/exactly\s+(\d+)\s+finals\b/)?.[1] ?? 0);
  assert(Number.isInteger(requiredWins) && requiredWins > 0 && requiredWins <= requiredRunsPerVersion);
  assert(Number.isInteger(requiredRunsPerVersion) && requiredRunsPerVersion > 0);
  if (allowedNativeFinalOutcomes) assert(Array.isArray(allowedNativeFinalOutcomes) && allowedNativeFinalOutcomes.length > 0 && allowedNativeFinalOutcomes.every(o => outcomeNames.includes(o)), `${cohort}: invalid native outcome gate`);
  const versionsMatch = candidateGroups.length === requiredVersions.length && requiredVersions.every(v => candidateGroups.some(g => g.gameVersion === v));
  const nativeOutcomesMatch = !allowedNativeFinalOutcomes || allRuns.filter(r => r.cohort === cohort && r.strategy === candidate && r.started).every(r => r.nativeFinalPresent && allowedNativeFinalOutcomes.includes(r.nativeOutcome));
  const eligible = cohortComplete && rawSummary.integrity.ok && versionsMatch && nativeOutcomesMatch && candidateGroups.every(g => g.plannedRuns === requiredRunsPerVersion && g.startedRuns === requiredRunsPerVersion && g.counts.win_le150 >= requiredWins && (!requiredNativeFinalsPerVersion || g.nativeFinals === requiredNativeFinalsPerVersion));
  gates.push({ cohort, candidate, phase: 'exploration', condition, requiredVersions, requiredWins, requiredRunsPerVersion, requiredNativeFinalsPerVersion, allowedNativeFinalOutcomes,
    status: !cohortComplete ? 'pending' : eligible ? 'met' : 'not_met', eligibleForConfirmation: eligible,
    confirmationBatch: meta.protocol.confirmation.id, confirmationNPerVersion: meta.protocol.confirmation.NPerVersion,
    confirmationVersions: plannedVersions(meta.protocol, 'confirmation', candidate),
    confirmationRecordedStarts: allRuns.filter(r => r.cohort === meta.protocol.confirmation.id && r.started).length });
}
const pendingEvidence = [];
const experiments = new URL('../source/experiments/', root);
for (const name of (await readdir(experiments)).filter(n => /^grow\d+$/.test(n)).sort()) {
  const manifestBytes = await readFile(new URL(`${name}/manifest.json`, experiments));
  const manifest = JSON.parse(manifestBytes);
  if (!batches.has(manifest.screen.id)) pendingEvidence.push({
    candidate: name.replace('grow', 'grow-'), batch: manifest.screen.id, phase: 'exploration',
    manifestFile: `../source/experiments/${name}/manifest.json`, manifestSha256: sha(manifestBytes), protocolHash: manifest.protocolHash,
    plannedVersions: plannedVersions(manifest, 'exploration'), plannedRuns: manifest.screen.order.length, allowedNativeFinalOutcomes: manifest.screen.nativeOutcomes ?? null,
    recordedStartsInLoadedSnapshots: 0, status: 'event_snapshot_not_yet_included',
    conditionalConfirmation: { batch: manifest.confirmation.id, plannedVersions: plannedVersions(manifest, 'confirmation'), plannedRunsPerVersion: manifest.confirmation.NPerVersion, condition: manifest.confirmation.condition, recordedStartsInLoadedSnapshots: 0, status: 'not_started_in_loaded_evidence' },
    reusedVersionPolicy: manifest.reusedVersionPolicy ?? null
  });
}
const scriptHash = sha(await readFile(new URL(import.meta.url)));
const confirmationAssessments = [...new Set(groups.filter(g => g.phase === 'confirmation').map(g => g.cohort))].map(cohort => {
  const selected = groups.filter(g => g.cohort === cohort && g.phase === 'confirmation');
  const protocol = cohortMetadata.get(cohort).protocol;
  const expected = protocol.confirmation.NPerVersion;
  const requiredVersions = plannedVersions(protocol, 'confirmation');
  const complete = selected.length === requiredVersions.length && requiredVersions.every(v => selected.some(g => g.gameVersion === v)) && selected.every(g => !g.provisional && g.plannedRuns === expected && g.startedRuns === expected);
  const met = complete && rawSummary.integrity.ok && selected.every(g => g.counts.win_le150 >= Math.ceil(expected * 0.5));
  return { cohort, phase: 'confirmation', requiredVersions, plannedRunsPerVersion: expected, minimumWinsPerVersion: Math.ceil(expected * 0.5), status: !complete ? 'pending' : met ? 'observed_target_met' : 'observed_target_not_met', formalAcceptanceClaim: false, note: 'Observed all-start proportion only; exploration is excluded and this is not a proof that long-term success probability is at least 50%. Reused evidence for an unchanged version remains under its original candidate and batch.' };
});
const result = {
  schemaVersion: 1, recordType: 'reviewed_evaluation_summary', deadlineSeconds: 150,
  evidenceAsOfLastSavedEvent: events.map(e => e.at).filter(Boolean).sort().at(-1) ?? null,
  derivation: { script: 'summarize-evaluation.mjs', sha256: scriptHash, nativeStatistics: '../source/experiments/grow13/summarize.mjs', nativeStatisticsSha256: sha(await readFile(new URL('../source/experiments/grow13/summarize.mjs', root))), rawOnlySummaryFile: 'raw-native-summary.json', rule: 'Preserve every recorded start; apply only explicitly hashed reviewer sidecars to missing finals; recovery IDs map to unstarted original logical slots; never pool phases or versions.' },
  inputs, integrity: rawSummary.integrity,
  totals: { scope: 'loaded_event_snapshots_only; see pendingEvidence for manifests without included events', recordedStarts: allRuns.filter(r => r.started).length, nativeFinals: allRuns.filter(r => r.nativeFinalPresent).length, reviewerClassifiedInfrastructureErrors: usedAnnotations.size, unstartedLogicalSlots: allRuns.filter(r => !r.started).length },
  groups, confirmationGates: gates, confirmationAssessments, runs: allRuns, pendingEvidence,
  limitations: ['Reviewer infrastructure classifications are distinct from native finals; no final time, size, compute history or key-release state is fabricated.', 'Raw-native-summary.json intentionally retains missing-final runs as unresolved.', 'Exploration and confirmation remain separate; small samples do not prove a long-term success probability.', 'Compute statistics exclude incomplete decision arrays from interrupted runs; this creates incomplete timing coverage.', 'Infrastructure failures count against the precommitted operational target and do not by themselves identify a strategy-logic failure.']
};
if (process.argv.includes('--write')) {
  await writeFile(new URL('raw-native-summary.json', root), JSON.stringify(rawSummary, null, 2) + '\n');
  await writeFile(new URL('evaluation-summary.json', root), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ written: ['raw-native-summary.json', 'evaluation-summary.json'], totals: result.totals, confirmationGates: gates, pendingEvidence }, null, 2));
} else console.log(JSON.stringify(result, null, 2));
if (!rawSummary.integrity.ok) process.exitCode = 2;
