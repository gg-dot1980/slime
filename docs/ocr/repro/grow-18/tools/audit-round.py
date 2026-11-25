#!/usr/bin/env python3
"""Read-only independent audit of a frozen source directory and numeric JSONL.

Usage: python3 audit-round.py SOURCE_DIR EVENTS_JSONL [--summary ROOT_SUMMARY]
                             [--out REVIEW_JSON] [--sidecar REVIEWER_JSON ...]
No candidate, game, server or browser code is executed. Only --out is written.
"""
import argparse
import collections
import datetime
import hashlib
import json
import math
from pathlib import Path
import re
import sys

PARSER = argparse.ArgumentParser(description=__doc__)
PARSER.add_argument('source_dir', type=Path)
PARSER.add_argument('events', type=Path)
PARSER.add_argument('--summary', type=Path)
PARSER.add_argument('--out', type=Path)
PARSER.add_argument('--sidecar', action='append', type=Path, default=[])
ARGS = PARSER.parse_args()
SOURCE = ARGS.source_dir.resolve()
ISSUES = []


def issue(kind, **detail):
    ISSUES.append({'kind': kind, **detail})


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    # Current protocol contains ordinary finite JSON numbers and UTF-8 strings.
    # Object insertion order is preserved, matching its JSON.stringify contract.
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()


def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def quantile(values, fraction):
    a = sorted(v for v in values if numeric(v))
    if not a:
        return None
    pos = (len(a) - 1) * fraction
    lower, upper = math.floor(pos), math.ceil(pos)
    return a[lower] + (a[upper] - a[lower]) * (pos - lower)


def distribution(values):
    a = [v for v in values if numeric(v)]
    return {'n': len(a), 'median': quantile(a, .5), 'p95': quantile(a, .95),
            'p99': quantile(a, .99), 'max': max(a) if a else None}


def wilson(wins, starts):
    if not starts:
        return None
    z2 = 3.841458820694124
    middle = (wins + z2 / 2) / (starts + z2)
    radius = math.sqrt(z2 * (wins * (1 - wins / starts) + z2 / 4)) / (starts + z2)
    return {'low': max(0, middle - radius), 'high': min(1, middle + radius)}


def iso(value):
    return datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))


manifest_bytes = (SOURCE / 'manifest.json').read_bytes()
manifest = json.loads(manifest_bytes)
freeze_bytes = (SOURCE / 'freeze.json').read_bytes()
freeze = json.loads(freeze_bytes)
identity = dict(manifest)
identity.pop('protocolHash', None)
if digest(canonical(identity)) != manifest.get('protocolHash'):
    issue('protocol_self_hash')
if (SOURCE / 'protocol.json').read_bytes() != manifest_bytes:
    issue('protocol_manifest_bytes_differ')
if freeze.get('protocolHash') != manifest.get('protocolHash') or freeze.get('candidate') != manifest.get('candidate'):
    issue('freeze_identity')
if freeze.get('startsAtFreeze') != 0:
    issue('freeze_not_before_starts')

required_fields = {'sourceHash': 'source-base.html', 'geometryHash': 'geometry.js',
                   'plannerHash': 'planner.js', 'harnessHash': 'harness.js',
                   'serverHash': 'server.mjs', 'buildHash': 'build-lab.mjs',
                   'pageHash': 'index.html', 'isolationHash': 'game-isolation.mjs',
                   'deployedGameVerificationHash': 'deployed-game-verification.json',
                   'parentManifestHash': 'parent-manifest.json'}
required_names = set(required_fields.values()) | {'manifest.json', 'protocol.json'}
required_names |= {'game-' + v + '.html' for v in manifest['games']}
if required_names - set(freeze['files']):
    issue('freeze_missing_required_files', files=sorted(required_names - set(freeze['files'])))
file_checks = []
for name, frozen in freeze['files'].items():
    path = SOURCE / name
    if not path.is_file():
        issue('frozen_file_missing', file=name)
        continue
    data = path.read_bytes()
    good = digest(data) == frozen['sha256'] and len(data) == frozen['bytes']
    file_checks.append({'file': name, 'bytes': len(data), 'sha256': digest(data), 'matches': good})
    if not good:
        issue('frozen_file_changed', file=name)
for field, name in required_fields.items():
    if not (SOURCE / name).is_file() or digest((SOURCE / name).read_bytes()) != manifest.get(field):
        issue('manifest_file_hash', file=name, field=field)
for version, hashes in manifest['games'].items():
    name = 'game-' + version + '.html'
    if not (SOURCE / name).is_file() or digest((SOURCE / name).read_bytes()) != hashes['sourceHash']:
        issue('game_source_hash', version=version)

raw = ARGS.events.read_bytes() if ARGS.events.exists() else b''
if raw and not raw.endswith(b'\n'):
    issue('incomplete_terminal_jsonl_line')
records = []
for line, text in enumerate(raw.splitlines(), 1):
    if not text.strip():
        continue
    try:
        row = json.loads(text)
        records.append((line, row))
    except (ValueError, UnicodeDecodeError) as error:
        issue('invalid_jsonl', line=line, error=str(error))
starts = [(line, row) for line, row in records if row.get('kind') == 'start']
finals = [(line, row) for line, row in records if row.get('kind') == 'final']
start_counts = collections.Counter(row.get('runId') for _, row in starts)
final_by_id = collections.defaultdict(list)
for line, row in finals:
    final_by_id[row.get('runId')].append((line, row))
    if row.get('runId') not in start_counts:
        issue('orphan_final', runId=row.get('runId'), line=line)
for run_id, count in start_counts.items():
    if count != 1:
        issue('duplicate_start', runId=run_id, count=count)
for run_id, matches in final_by_id.items():
    if len(matches) != 1:
        issue('duplicate_final', runId=run_id, count=len(matches))

phases = {manifest[name]['id']: name for name in ['screen', 'confirmation']}
expected = {}
for phase in ['screen', 'confirmation']:
    spec = manifest[phase]
    count = collections.Counter(s['version'] for s in spec['order'])
    if len(set(spec['versions'])) != len(spec['versions']) or set(count) != set(spec['versions']):
        issue('manifest_version_plan', phase=phase)
    for version in spec['versions']:
        if count[version] != spec['NPerVersion']:
            issue('manifest_planned_count', phase=phase, version=version)
    for index, slot in enumerate(spec['order']):
        expected[f"{spec['id']}-{index + 1:02}"] = {'batch': spec['id'], 'index': index, **slot}

sidecars = {}
sidecar_inputs = []
for path in ARGS.sidecar:
    data = path.read_bytes()
    review = json.loads(data)
    entry = review.get('interruptedRun', review)
    run_id = entry.get('runId')
    evidence = review.get('rawEventFile', {})
    prefix_bytes = evidence.get('bytes')
    prefix_ok = (isinstance(prefix_bytes, int) and prefix_bytes <= len(raw)
                 and digest(raw[:prefix_bytes]) == evidence.get('sha256'))
    valid = (run_id in start_counts and not final_by_id.get(run_id)
             and entry.get('isNativeFinal') is False
             and entry.get('countInStartedDenominator') is True and prefix_ok)
    if not valid:
        issue('unsupported_reviewer_sidecar', path=str(path), runId=run_id)
    elif run_id in sidecars:
        issue('duplicate_reviewer_annotation', runId=run_id)
    else:
        sidecars[run_id] = {'outcome': entry.get('reviewerClassification', 'unknown'),
                            'path': str(path), 'sha256': digest(data)}
    sidecar_inputs.append({'path': str(path), 'sha256': digest(data), 'accepted': valid})


def classify(final):
    visible = final.get('final') or {}
    title, description = visible.get('title', ''), visible.get('description', '')
    time = re.search(r'(?:Play time|遊玩時間)\s*(\d+):(\d{2})', description)
    seconds = int(time[1]) * 60 + int(time[2]) if time else None
    if 'resultSeconds' in visible and visible.get('resultSeconds') != seconds:
        issue('visible_result_time_mismatch', runId=final['runId'], parsed=seconds,
              recorded=visible.get('resultSeconds'))
    declared = final.get('outcome')
    if declared in ['infrastructure_error', 'controller_abort']:
        # Operational classification is not overwritten by a later visible state.
        return declared, seconds
    if visible.get('settled') and re.search(r'You win|成功過關', title, re.I):
        if 'You win' in title and 'You reached size 200 and survived!' not in description:
            issue('win_size_goal_not_supported', runId=final['runId'])
        return ('unknown' if seconds is None else 'win_le150' if seconds <= 150 else 'win_late'), seconds
    if visible.get('settled') and re.search(r'You were eaten|被大史萊姆|swallowed', title, re.I):
        return 'death', seconds
    if (not visible.get('settled') and not visible.get('ending')
            and numeric(visible.get('elapsedVisible')) and visible['elapsedVisible'] > 150
            and final.get('reason') == 'visible HUD elapsed >150'):
        return 'deadline_cutoff', seconds
    return 'unknown', seconds


runs = []
phase_start_order = collections.defaultdict(list)
for start_line, start in starts:
    run_id = start.get('runId')
    phase = phases.get(start.get('batch'))
    plan = expected.get(run_id)
    planned_identity = bool(plan and all(start.get(k) == v for k, v in plan.items()))
    if not planned_identity:
        issue('unplanned_start_identity', runId=run_id, line=start_line)
    if phase:
        phase_start_order[phase].append(run_id)
    for key in ['protocolHash', 'sourceHash', 'geometryHash', 'plannerHash', 'pageHash']:
        if start.get(key) != manifest.get(key):
            issue('start_source_identity', runId=run_id, field=key)
    if start.get('gameHashes') != manifest['games'].get(start.get('version')):
        issue('start_game_identity', runId=run_id)
    if start.get('startedVisible') is not True:
        issue('start_not_visibly_confirmed', runId=run_id)
    try:
        if iso(start['at']) < iso(freeze['frozenAt']):
            issue('start_precedes_freeze', runId=run_id)
    except (KeyError, ValueError):
        issue('start_or_freeze_timestamp_invalid', runId=run_id)
    env = start.get('environment') or {}
    canvas, iframe = env.get('canvas', {}), env.get('iframe', {})
    if (env.get('devicePixelRatio') != manifest['viewport']['devicePixelRatio']
            or env.get('visibility') != 'visible'
            or any(canvas.get(k) != 2000 for k in ['width', 'cssWidth'])
            or any(canvas.get(k) != 1163 for k in ['height', 'cssHeight'])
            or iframe.get('width') != 2000 or iframe.get('height') != 1163):
        issue('start_environment', runId=run_id)
    matches = final_by_id.get(run_id, [])
    f = matches[0][1] if len(matches) == 1 else None
    record = {'runId': run_id, 'startLine': start_line, 'startAt': start.get('at'),
              'phase': phase, 'batch': start.get('batch'), 'version': start.get('version'),
              'strategy': start.get('strategy'), 'plannedIdentity': planned_identity,
              'nativeFinalPresent': f is not None, 'environment': env}
    if not f:
        record.update(outcome='duplicate_final' if len(matches) > 1 else
                      sidecars.get(run_id, {}).get('outcome', 'in_progress'),
                      outcomeEvidence='reviewer_sidecar' if run_id in sidecars else 'unresolved_raw',
                      reviewerAnnotation=sidecars.get(run_id), gameResultSeconds=None,
                      hudElapsedVisible=None, finalHud=None, computeMs=distribution([]),
                      promotedSamples=0, savedSamples=0)
    else:
        final_line = matches[0][0]
        if final_line < start_line:
            issue('final_precedes_start', runId=run_id)
        for key in ['batch', 'version', 'strategy', 'protocolHash']:
            if f.get(key) != start.get(key):
                issue('final_start_metadata_mismatch', runId=run_id, field=key)
        if 'index' in f and f['index'] != start.get('index'):
            issue('final_index_mismatch', runId=run_id)
        if f.get('keysReleased') is not True:
            issue('keys_not_confirmed_released', runId=run_id)
        outcome, seconds = classify(f)
        if outcome != f.get('outcome'):
            issue('native_outcome_mismatch', runId=run_id, declared=f.get('outcome'), derived=outcome)
        compute, samples = f.get('computeMs', []), f.get('samples', [])
        if len(compute) != f.get('decisions') or not all(numeric(v) and v >= 0 for v in compute):
            issue('compute_count_or_values', runId=run_id)
        if any(numeric(v) and v > manifest['maxComputeMs'] for v in compute):
            issue('compute_exceeds_protocol_limit', runId=run_id)
        events = f.get('controllerEvents', [])
        promoted = []
        for sample in samples:
            hard, soft, total = (sample.get(k) for k in ['hardThreats', 'softThreats', 'threats'])
            value = sample.get('promotedLethalThreats')
            if not all(numeric(v) and v >= 0 and int(v) == v for v in [hard, soft, total, value]):
                issue('hazard_diagnostic_counts_invalid', runId=run_id,
                      elapsedVisible=sample.get('elapsedVisible'))
            elif hard + soft != total or value > hard:
                issue('hazard_diagnostic_counts_inconsistent', runId=run_id,
                      elapsedVisible=sample.get('elapsedVisible'))
            if numeric(value) and value > 0:
                promoted.append(sample)
        observed_stop = f.get('stopObservedWallMs')
        if observed_stop is not None and (not numeric(observed_stop) or not numeric(f.get('wallMs'))
                                          or observed_stop < 0 or observed_stop > f['wallMs']):
            issue('stop_snapshot_wall_order', runId=run_id)
        record.update(outcome=outcome, outcomeEvidence='native_final', finalLine=final_line,
                      finalAt=f.get('at'), declaredOutcome=f.get('outcome'),
                      gameResultSeconds=seconds, hudElapsedVisible=f.get('final', {}).get('elapsedVisible'),
                      finalHud=f.get('final', {}).get('hudSize'), visibleFinal=f.get('final'),
                      wallMs=f.get('wallMs'), stopObservedWallMs=observed_stop,
                      keysReleased=f.get('keysReleased'), decisions=f.get('decisions'),
                      computeMs=distribution(compute), controllerEvents=events,
                      savedSamples=len(samples), promotedSamples=len(promoted),
                      promotedSampleFraction=len(promoted) / len(samples) if samples else None,
                      promotedCountMax=max((s['promotedLethalThreats'] for s in promoted), default=0),
                      firstPromotedSample={k: promoted[0].get(k) for k in ['elapsedVisible', 'hudSize', 'reason']}
                      if promoted else None, stopReason=f.get('reason'))
    if start_counts[run_id] > 1:
        record['outcomeBeforeDuplicateStartAnnotation'] = record['outcome']
        record['outcome'] = 'ambiguous_duplicate_start'
    runs.append(record)

for phase, observed in phase_start_order.items():
    batch = manifest[phase]['id']
    planned_order = [f'{batch}-{i + 1:02}' for i in range(len(manifest[phase]['order']))]
    if observed != planned_order[:len(observed)]:
        issue('start_order_not_planned_prefix', phase=phase, observed=observed)

batch_ends = collections.defaultdict(list)
batch_start_counts = collections.Counter(row.get('batch') for _, row in records if row.get('kind') == 'batch_start')
for batch in {row.get('batch') for _, row in starts}:
    if batch_start_counts[batch] != 1:
        issue('batch_start_count', batch=batch, count=batch_start_counts[batch])
for line, row in records:
    if row.get('kind') == 'batch_start':
        phase = phases.get(row.get('batch'))
        if not phase or row.get('protocol') != manifest or row.get('planned') != manifest[phase]['order']:
            issue('batch_start_protocol_or_plan', line=line, batch=row.get('batch'))
    if row.get('kind') == 'batch_end':
        batch_ends[row.get('batch')].append((line, row))
        phase = phases.get(row.get('batch'))
        finished = sum(f.get('batch') == row.get('batch') and fl < line for fl, f in finals)
        if not phase or row.get('planned') != len(manifest[phase]['order']) or row.get('completed') != finished:
            issue('batch_end_counts', line=line, batch=row.get('batch'))

keys = [(phase, manifest[phase]['id'], version) for phase in ['screen', 'confirmation']
        for version in manifest[phase]['versions']]
for run in runs:
    key = (run['phase'], run['batch'], run['version'])
    if key not in keys:
        keys.append(key)  # Unexpected starts are visible in a group, never silently dropped.
groups = []
for phase, batch, version in keys:
    rs = [r for r in runs if (r['phase'], r['batch'], r['version']) == (phase, batch, version)]
    planned_group = bool(phase and version in manifest[phase]['versions'])
    planned_n = manifest[phase]['NPerVersion'] if planned_group else None
    counts = collections.Counter(r['outcome'] for r in rs)
    winners = [r for r in rs if r['outcome'] == 'win_le150']
    completed_end = [row for _, row in batch_ends.get(batch, []) if row.get('halted') is False]
    complete = bool(planned_group and len(rs) == planned_n and len(completed_end) == 1
                    and all(r['outcome'] not in ['in_progress', 'duplicate_final', 'ambiguous_duplicate_start'] for r in rs))
    compute = [v for r in rs for _, f in final_by_id.get(r['runId'], []) for v in f.get('computeMs', [])]
    groups.append({'phase': phase, 'batch': batch, 'version': version, 'plannedGroup': planned_group,
                   'planned': planned_n, 'starts': len(rs), 'nativeFinals': sum(r['nativeFinalPresent'] for r in rs),
                   'knownNativeOutcomes': sum(r['outcome'] in ['win_le150', 'win_late', 'death', 'deadline_cutoff'] for r in rs),
                   'counts': dict(counts), 'wins': len(winners), 'observedRate': len(winners) / len(rs) if rs else None,
                   'wilson95': wilson(len(winners), len(rs)), 'winningResultSeconds': distribution([r['gameResultSeconds'] for r in winners]),
                   'computeMsFromNativeFinals': distribution(compute), 'promotedSamples': sum(r['promotedSamples'] for r in rs),
                   'savedSamples': sum(r['savedSamples'] for r in rs),
                   'runsWithPromotedExposure': sum(r['promotedSamples'] > 0 for r in rs),
                   'complete': complete, 'provisional': not complete, 'runIds': [r['runId'] for r in rs]})

screen_groups = [g for g in groups if g['phase'] == 'screen' and g['plannedGroup']]
screen_ready = all(g['complete'] and g['knownNativeOutcomes'] == g['planned']
                   and g['wins'] >= manifest['screen']['minimumWinsPerVersion'] for g in screen_groups)
confirm_starts = [(line, row) for line, row in starts if row.get('batch') == manifest['confirmation']['id']]
if confirm_starts:
    first_line = confirm_starts[0][0]
    screen_done_before = any(line < first_line and row.get('halted') is False
                             for line, row in batch_ends.get(manifest['screen']['id'], []))
    if not screen_ready or not screen_done_before:
        issue('confirmation_started_without_complete_screen_gate')

root_comparison = None
if ARGS.summary:
    summary_bytes = ARGS.summary.read_bytes()
    summary = json.loads(summary_bytes)
    root_comparison = {'path': str(ARGS.summary), 'sha256': digest(summary_bytes),
                       'sameRawSnapshot': summary.get('raw', {}).get('sha256') == digest(raw), 'differences': []}
    differences = root_comparison['differences']
    if not root_comparison['sameRawSnapshot']:
        differences.append({'field': 'raw.sha256', 'reason': 'different snapshot; no numerical comparison attempted'})
    else:
        for key, value in [('starts', len(starts)), ('finals', len(finals))]:
            if summary.get(key) != value:
                differences.append({'field': key, 'root': summary.get(key), 'independent': value})
        for g in groups:
            matches = [x for x in summary.get('groups', []) if (x.get('phase'), x.get('batch'), x.get('version')) == (g['phase'], g['batch'], g['version'])]
            if len(matches) != 1:
                differences.append({'group': [g['phase'], g['version']], 'field': 'group_missing_or_duplicate'})
                continue
            rg = matches[0]
            for key in ['starts', 'wins', 'counts', 'complete']:
                if rg.get(key) != g[key]:
                    differences.append({'group': [g['phase'], g['version']], 'field': key, 'root': rg.get(key), 'independent': g[key]})
            for bound in ['low', 'high']:
                a, b = (rg.get('wilson95') or {}).get(bound), (g['wilson95'] or {}).get(bound)
                if (a is None) != (b is None) or a is not None and abs(a - b) > 1e-12:
                    differences.append({'group': [g['phase'], g['version']], 'field': 'wilson95.' + bound, 'root': a, 'independent': b})
    if differences:
        issue('root_summary_comparison_difference', differences=differences)

confirmation_groups = [g for g in groups if g['phase'] == 'confirmation' and g['plannedGroup']]
report = {'schemaVersion': 1, 'recordType': 'independent_read_only_round_audit',
          'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
          'candidate': manifest['candidate'], 'protocolHash': manifest['protocolHash'],
          'auditor': {'file': str(Path(__file__).resolve()), 'sha256': digest(Path(__file__).read_bytes()),
                      'pythonVersion': sys.version.split()[0], 'dependencies': 'Python standard library only'},
          'inputs': {'sourceDirectory': str(SOURCE), 'eventsFile': str(ARGS.events.resolve()),
                     'rawBytes': len(raw), 'rawSha256': digest(raw), 'rawRecords': len(records),
                     'manifestFileSha256': digest(manifest_bytes), 'freezeFileSha256': digest(freeze_bytes),
                     'sidecars': sidecar_inputs},
          'sourceFreeze': {'frozenAt': freeze.get('frozenAt'), 'fileChecks': file_checks},
          'integrity': {'ok': not ISSUES, 'issues': ISSUES},
          'counts': {'allStartRows': len(starts), 'uniqueRunIds': len(start_counts), 'nativeFinalRows': len(finals),
                     'reviewerClassifiedMissingFinals': len(sidecars), 'unresolvedRunIds': [r['runId'] for r in runs if r['outcome'] in ['in_progress', 'duplicate_final', 'ambiguous_duplicate_start']],
                     'allStartRowsIncludedInGroups': sum(g['starts'] for g in groups) == len(starts)},
          'screenGatePassed': not ISSUES and screen_ready,
          'confirmationSampleTargetMet': not ISSUES and screen_ready and all(g['complete'] and g['wins'] >= manifest['confirmation']['minimumWinsPerVersion'] for g in confirmation_groups),
          'formalAcceptance': False, 'groups': groups, 'runs': runs, 'rootSummaryComparison': root_comparison,
          'method': 'Independent Python standard-library read of frozen source hashes, raw start/final identities, visible-result text, phase order, release and compute diagnostics; no import or execution of the primary summarizer or candidate.',
          'limitations': ['All started attempts remain in their phase/version denominator, including infra/unknown/unresolved; an unfinished cohort cannot pass.',
                          'Result Play time, HUD-derived elapsed and wall time remain separate. A successful settlement can precede the HUD showing200.',
                          'promotedSamples measures saved approximately1Hz observations, not controller decisions, unique NPCs, exposure duration or causal benefit.',
                          'Unknown natural seeds and selected candidate batches do not establish causal superiority. Wilson intervals are nominal per-group intervals.',
                          'No pixels, full hazard state or hidden world inputs are used; these records cannot reconstruct exact game trajectories.',
                          'Missing native finals remain unresolved unless an explicit valid reviewer sidecar is supplied; active status cannot be proved solely from a raw prefix.']}
if ARGS.out:
    ARGS.out.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + '\n')
print(json.dumps({'integrity': report['integrity'], 'counts': report['counts'],
                  'screenGatePassed': report['screenGatePassed'],
                  'confirmationSampleTargetMet': report['confirmationSampleTargetMet'],
                  'groups': [{k: g[k] for k in ['phase', 'version', 'starts', 'counts', 'wins', 'complete', 'promotedSamples', 'savedSamples']} for g in groups]}, ensure_ascii=False, indent=2))
raise SystemExit(0 if not ISSUES else 1)
