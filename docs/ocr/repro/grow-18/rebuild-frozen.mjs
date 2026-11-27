#!/usr/bin/env node
// Rebuild only in a new output directory; never edits the frozen archive or a run.
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
if (!option('--output')) throw Error('Usage: node docs/ocr/repro/grow-18/rebuild-frozen.mjs --output <new-directory> [--checks] [--repo-root <checkout>]');
const output = path.resolve(option('--output'));
const repositoryRoot = path.resolve(option('--repo-root') || path.resolve(here, '../../../..'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
try { await fs.stat(output); throw Error('Output must not already exist: ' + output); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const fileManifest = JSON.parse(await fs.readFile(path.join(here, 'source-checksums.json'), 'utf8'));
for (const entry of fileManifest.files) {
  assert(entry.path.startsWith('source/') && !entry.path.split('/').includes('..'));
  const bytes = await fs.readFile(path.join(here, entry.path));
  assert.equal(bytes.length, entry.bytes, entry.path + ': source length mismatch');
  assert.equal(sha(bytes), entry.sha256, entry.path + ': source hash mismatch');
}
const frozenDirectory = path.join(here, 'source/experiments/grow18');
const frozenManifestBytes = await fs.readFile(path.join(frozenDirectory, 'manifest.json'));
const manifest = JSON.parse(frozenManifestBytes);
const freeze = JSON.parse(await fs.readFile(path.join(frozenDirectory, 'freeze.json'), 'utf8'));
assert.equal(manifest.protocolHash, freeze.protocolHash);
assert.equal(manifest.protocolHash, fileManifest.protocolHash);
await fs.cp(path.join(here, 'source'), output, {recursive: true, errorOnExist: true, force: false});
const restored = await materializeGames({repositoryRoot, destination: output});

// The original build includes its creation timestamp in protocolHash. Pin Date
// only in this separate Node BUILD process to reproduce those metadata bytes.
// This preload is never embedded in the HTML, imported by the server, or used by
// any game/controller. Browser clocks and natural Math.random remain unchanged.
const buildClockPath = path.join(output, 'publication-build-clock.mjs');
const clockSource = `const RealDate=globalThis.Date;const fixed=${JSON.stringify(manifest.createdAt)};
class BuildDate extends RealDate{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return new RealDate(fixed).getTime();}}
globalThis.Date=BuildDate;\n`;
await fs.writeFile(buildClockPath, clockSource, {flag: 'wx'});
function child(arguments_) {
  const result = spawnSync(process.execPath, arguments_, {cwd: output, encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024});
  if (result.status !== 0) throw Error(result.stderr || result.stdout || String(result.error || 'Child check failed'));
  return result.stdout;
}
const buildStdout = child(['--import', pathToFileURL(buildClockPath).href, 'experiments/grow18/build-lab.mjs']);
const builtDirectory = path.join(output, 'experiments/grow18');
for (const [name, entry] of Object.entries(freeze.files)) {
  const bytes = await fs.readFile(path.join(builtDirectory, name));
  assert.equal(bytes.length, entry.bytes, name + ': frozen length mismatch');
  assert.equal(sha(bytes), entry.sha256, name + ': frozen hash mismatch');
}
assert.deepEqual(await fs.readFile(path.join(builtDirectory, 'manifest.json')), frozenManifestBytes);
assert.deepEqual(await fs.readFile(path.join(builtDirectory, 'protocol.json')), frozenManifestBytes);
const html = await fs.readFile(path.join(builtDirectory, 'index.html'), 'utf8');
assert(!/data:image\/|data:video\/|<svg(?:\s|>)|<img\b/i.test(html), 'Embedded image/video payload in generated page');
let parsedScripts = 0;
for (const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
  if (match[1].trim()) {new vm.Script(match[1]); parsedScripts++;}
}
const report = {schemaVersion: 1, status: 'passed', kind: 'clean frozen source reconstruction',
  candidate: 'grow-18', protocolHash: manifest.protocolHash, node: process.version,
  buildMetadataClock: manifest.createdAt, gameClockModified: false, randomSeedModified: false,
  allFrozenFilesByteIdentical: true, pageHash: sha(Buffer.from(html)), parsedInlineScripts: parsedScripts,
  gameDependencies: restored, buildStdout: JSON.parse(buildStdout),
  gameplayStarts: 0, browserStarts: 0, serverStarts: 0, checks: null};
if (process.argv.includes('--checks')) {
  const checks = path.join(output, 'reproduction-checks');
  await fs.mkdir(checks, {recursive: true});
  const plannerStdout = child(['experiments/grow18/planner.regression.mjs',
    '--baseline', 'parent/grow15-planner.js', '--controller', 'experiments/grow18/source-base.html']);
  const plannerResult = JSON.parse(plannerStdout);
  assert.equal(plannerResult.pass, true);
  assert.equal(plannerResult.plannerSha256, manifest.plannerHash);
  const archivedPlanner = JSON.parse(await fs.readFile(path.join(here, 'checks/planner-regression-result.json'), 'utf8'));
  assert.equal(plannerResult.cases, archivedPlanner.cases);
  await fs.writeFile(path.join(checks, 'planner-regression.json'), plannerStdout);
  child(['experiments/grow18/harness-regression.mjs']);
  const harnessBytes = await fs.readFile(path.join(builtDirectory, 'harness-regression.json'));
  const harnessResult = JSON.parse(harnessBytes);
  assert.equal(harnessResult.status, 'pass');
  assert.equal(harnessResult.protocolHash, manifest.protocolHash);
  const archivedHarness = JSON.parse(await fs.readFile(path.join(here, 'checks/harness-regression.json'), 'utf8'));
  assert.equal(harnessResult.caseCount, archivedHarness.caseCount);
  assert.equal(harnessResult.failed, 0);
  await fs.writeFile(path.join(checks, 'harness-regression.json'), harnessBytes);
  report.checks = {plannerCases: plannerResult.cases, harnessCases: harnessResult.caseCount,
    realBrowserOrGame: false};
}
await fs.writeFile(path.join(output, 'reconstruction-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({...report, output}, null, 2));
