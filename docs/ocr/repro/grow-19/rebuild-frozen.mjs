#!/usr/bin/env node
// Restores and checks only a new output directory. No game, server or browser.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {materializeGames} from './materialize-game-sources.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const option = name => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
if (!option('--output')) throw Error('Usage: node docs/ocr/repro/grow-19/rebuild-frozen.mjs --output <new-directory> [--checks] [--repo-root <checkout>]');
const output = path.resolve(option('--output'));
const repositoryRoot = path.resolve(option('--repo-root') || path.resolve(here, '../../../..'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const safe = name => !path.isAbsolute(name) && !name.split('/').includes('..');
try { await fs.stat(output); throw Error('Output must not already exist: ' + output); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

const fileManifest = JSON.parse(await fs.readFile(path.join(here, 'source-checksums.json'), 'utf8'));
for (const entry of fileManifest.files) {
  assert(safe(entry.path) && /^(source|research)\//.test(entry.path));
  const bytes = await fs.readFile(path.join(here, entry.path));
  assert.equal(bytes.length, entry.bytes, entry.path + ': input length mismatch');
  assert.equal(sha(bytes), entry.sha256, entry.path + ': input hash mismatch');
}
const frozenDirectory = path.join(here, 'source/experiments/grow19');
const frozenManifestBytes = await fs.readFile(path.join(frozenDirectory, 'manifest.json'));
const manifest = JSON.parse(frozenManifestBytes);
const freeze = JSON.parse(await fs.readFile(path.join(frozenDirectory, 'freeze.json'), 'utf8'));
assert.equal(manifest.candidate, 'grow-19');
assert.equal(freeze.candidate, manifest.candidate);
assert.equal(manifest.protocolHash, freeze.protocolHash);
assert.equal(manifest.protocolHash, fileManifest.protocolHash);
await fs.cp(path.join(here, 'source'), output, {recursive: true, errorOnExist: true, force: false});
const restored = await materializeGames({repositoryRoot, destination: output});

// Re-create the original research script's relative input layout, with exactly
// pinned bytes. Raw games reuse the locally restored, already verified files.
const researchManifest = JSON.parse(await fs.readFile(path.join(here, 'research-inputs.json'), 'utf8'));
const prepared = [];
for (const entry of researchManifest.files) {
  assert(safe(entry.path) && safe(entry.destination) && entry.destination.startsWith('research-work/'));
  assert(['archive', 'runtime'].includes(entry.from));
  if (entry.from === 'archive') assert(/^(source|research)\//.test(entry.path));
  else assert(['experiments/grow19/game-v2.13.html', 'experiments/grow19/game-v2.22.html'].includes(entry.path));
  const bytes = await fs.readFile(path.join(entry.from === 'archive' ? here : output, entry.path));
  assert.equal(bytes.length, entry.bytes, entry.path + ': research length mismatch');
  assert.equal(sha(bytes), entry.sha256, entry.path + ': research hash mismatch');
  const destination = path.join(output, entry.destination);
  try { await fs.stat(destination); throw Error('Research destination already exists: ' + destination); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  prepared.push({destination, bytes});
}
for (const {destination, bytes} of prepared) {
  await fs.mkdir(path.dirname(destination), {recursive: true});
  await fs.writeFile(destination, bytes, {flag: 'wx'});
}

// Pin the original build's metadata timestamp only in its own Node process.
// This preload is never embedded in HTML, imported by the server, or used by a
// game/controller. Browser clocks, input timing and Math.random stay unchanged.
const buildClockPath = path.join(output, 'publication-build-clock.mjs');
const clockSource = 'const RealDate=globalThis.Date;const fixed=' + JSON.stringify(manifest.createdAt) + ';\n' +
  'class BuildDate extends RealDate{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return new RealDate(fixed).getTime();}}\n' +
  'globalThis.Date=BuildDate;\n';
await fs.writeFile(buildClockPath, clockSource, {flag: 'wx'});
function child(arguments_) {
  const result = spawnSync(process.execPath, arguments_, {cwd: output, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
  if (result.status !== 0) throw Error(result.stderr || result.stdout || String(result.error || 'Child check failed'));
  return result.stdout;
}
const buildStdout = child(['--import', pathToFileURL(buildClockPath).href, 'experiments/grow19/build-lab.mjs']);
const builtDirectory = path.join(output, 'experiments/grow19');
async function verifyFrozen() {
  for (const [name, entry] of Object.entries(freeze.files)) {
    const bytes = await fs.readFile(path.join(builtDirectory, name));
    assert.equal(bytes.length, entry.bytes, name + ': frozen length mismatch');
    assert.equal(sha(bytes), entry.sha256, name + ': frozen hash mismatch');
  }
  assert.deepEqual(await fs.readFile(path.join(builtDirectory, 'manifest.json')), frozenManifestBytes);
  assert.deepEqual(await fs.readFile(path.join(builtDirectory, 'protocol.json')), frozenManifestBytes);
}
await verifyFrozen();
const html = await fs.readFile(path.join(builtDirectory, 'index.html'), 'utf8');
assert(!/data:image\/|data:video\/|<svg(?:\s|>)|<img\b/i.test(html), 'Embedded image/video payload in generated page');
let parsedScripts = 0;
for (const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) { new vm.Script(match[1]); parsedScripts++; }
}
const report = {
  schemaVersion: 1, status: 'passed', kind: 'clean frozen source reconstruction',
  candidate: 'grow-19', protocolHash: manifest.protocolHash, node: process.version,
  buildMetadataClock: manifest.createdAt, gameClockModified: false, randomSeedModified: false,
  allFrozenFilesByteIdentical: true, frozenFilesVerified: Object.keys(freeze.files).length,
  pageHash: sha(Buffer.from(html)), parsedInlineScripts: parsedScripts,
  gameDependencies: restored, researchInputsRestored: prepared.length, buildStdout: JSON.parse(buildStdout),
  gameplayStarts: 0, browserStarts: 0, serverStarts: 0, checks: null
};
if (process.argv.includes('--checks')) {
  const checks = path.join(output, 'reproduction-checks');
  await fs.mkdir(checks, {recursive: true});
  const plannerStdout = child(['experiments/grow19/regression.cjs']);
  const planner = JSON.parse(plannerStdout);
  const archivedPlanner = JSON.parse(await fs.readFile(path.join(here, 'checks/regression-result.json'), 'utf8'));
  assert.equal(planner.sourceHashes.candidatePlanner, manifest.plannerHash);
  for (const name of ['counts', 'sourceHashes', 'scriptHash', 'normalizedPolicyHash', 'fixtures',
    'cases', 'controls', 'originalHazardCases', 'negativeGrowthTradeoffs', 'checks'])
    assert.deepEqual(planner[name], archivedPlanner[name], 'planner regression field: ' + name);
  assert.equal(planner.counts.assertions, planner.counts.passedAssertions);
  await fs.writeFile(path.join(checks, 'regression-result.json'), plannerStdout);

  child(['experiments/grow19/harness-regression.mjs']);
  const harnessBytes = await fs.readFile(path.join(builtDirectory, 'harness-regression.json'));
  const harness = JSON.parse(harnessBytes);
  const archivedHarness = JSON.parse(await fs.readFile(path.join(here, 'checks/harness-regression.json'), 'utf8'));
  assert.equal(harness.status, 'pass');
  assert.equal(harness.protocolHash, manifest.protocolHash);
  assert.equal(harness.caseCount, archivedHarness.caseCount);
  assert.equal(harness.failed, 0);
  await fs.writeFile(path.join(checks, 'harness-regression.json'), harnessBytes);

  // The historical verifier asserts that no freeze or log exists. Run it in a
  // separate new standby copy; never remove the complete reconstruction's freeze.
  const standby = path.join(checks, 'standby-build');
  await fs.mkdir(standby);
  const standbyNames = ['source-base.html', 'planner.js', 'geometry.js', 'harness.js', 'server.mjs',
    'build-lab.mjs', 'game-isolation.mjs', 'game-v2.13.html', 'game-v2.22.html', 'parent-manifest.json',
    'deployed-game-verification.json', 'template-provenance.json', 'index.html', 'manifest.json',
    'protocol.json', 'verify-build.mjs', 'harness-regression.mjs'];
  for (const name of standbyNames) await fs.copyFile(path.join(builtDirectory, name), path.join(standby, name));
  child(['reproduction-checks/standby-build/verify-build.mjs']);
  const buildCheck = JSON.parse(await fs.readFile(path.join(standby, 'build-verification.json'), 'utf8'));
  const archivedBuild = JSON.parse(await fs.readFile(path.join(here, 'checks/build-verification.json'), 'utf8'));
  assert.equal(buildCheck.status, 'passed');
  assert.equal(buildCheck.protocolHash, manifest.protocolHash);
  assert.deepEqual(buildCheck.hashes, archivedBuild.hashes);
  assert.deepEqual(buildCheck.checks, archivedBuild.checks);

  const researchStdout = child(['research-work/grow-next/research-perception/check-perception.cjs']);
  const research = JSON.parse(researchStdout);
  const archivedResearch = JSON.parse(await fs.readFile(path.join(here, 'research/research-perception.json'), 'utf8'));
  assert.deepEqual(research.provenance.inputHashes, archivedResearch.provenance.inputHashes);
  for (const name of ['counts', 'scriptHash', 'singleCandidate', 'mechanics', 'historicalContext',
    'fixtures', 'matrix', 'foodControls', 'retainedHazardLimitation', 'tracking', 'idealBounds', 'checks'])
    assert.deepEqual(research[name], archivedResearch[name], 'research field: ' + name);
  assert.equal(research.counts.assertions, research.counts.passedAssertions);
  await fs.writeFile(path.join(checks, 'research-perception.json'), researchStdout);
  report.checks = {
    plannerCases: planner.counts.plannerCases, plannerAssertions: planner.counts.passedAssertions,
    harnessCases: harness.caseCount, standbyBuildChecks: Object.keys(buildCheck.checks).length,
    researchPlannerCases: research.counts.numericPlannerCases, researchAssertions: research.counts.passedAssertions,
    historicalReportByteEqualityRequired: false,
    metadataDifferencesAllowed: 'new timestamps, Node/platform metadata, and research provenance.sourceRoot',
    frozenDirectoryPreservedDuringStandbyVerification: true, realBrowserOrGame: false
  };
}
await verifyFrozen();
await fs.writeFile(path.join(output, 'reconstruction-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({...report, output}, null, 2));
