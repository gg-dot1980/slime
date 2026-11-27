// Bounded offline build verification. This compiles scripts but does not run a
// browser, server, game, or controller. The candidate remains unactivated.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const sha = s => createHash('sha256').update(s).digest('hex');
const read = name => fs.readFile(dir + name, 'utf8');
const names = ['source-base.html', 'planner.js', 'geometry.js', 'harness.js',
  'server.mjs', 'build-lab.mjs', 'game-isolation.mjs', 'game-v2.13.html',
  'game-v2.22.html', 'parent-manifest.json', 'deployed-game-verification.json',
  'template-provenance.json', 'index.html', 'manifest.json', 'protocol.json'];
const source = Object.fromEntries(await Promise.all(names.map(async name => [name, await read(name)])));
const hashes = Object.fromEntries(names.map(name => [name, sha(source[name])]));
const manifest = JSON.parse(source['manifest.json']);
const provenance = JSON.parse(source['template-provenance.json']);
const parent = JSON.parse(source['parent-manifest.json']);
const deployed = JSON.parse(source['deployed-game-verification.json']);
const checks = {};
const check = (name, value) => {assert(value, name); checks[name] = value;};
check('manifestProtocolBytesEqual', source['manifest.json'] === source['protocol.json']);
const identity = {...manifest}; delete identity.protocolHash;
check('protocolHashValid', sha(JSON.stringify(identity)) === manifest.protocolHash);
for (const [field, file] of Object.entries({sourceHash:'source-base.html',
  plannerHash:'planner.js', geometryHash:'geometry.js', harnessHash:'harness.js',
  serverHash:'server.mjs', buildHash:'build-lab.mjs', pageHash:'index.html',
  isolationHash:'game-isolation.mjs', parentManifestHash:'parent-manifest.json',
  deployedGameVerificationHash:'deployed-game-verification.json'}))
  check(field + 'MatchesFile', manifest[field] === hashes[file]);
for (const [name, expected] of Object.entries(provenance.unchangedParent15Inputs))
  check('unchangedParent15/' + name, hashes[name] === expected);
check('parentIsGrow15', manifest.parentCandidate === 'grow-15' && manifest.parentPlannerHash === parent.plannerHash);
check('originalPolicyScopeV22Only', JSON.stringify(manifest.policyChange.versions) === '["v2.22"]');
for (const v of ['v2.13', 'v2.22']) {
  check('gameSource/' + v, manifest.games[v].sourceHash === hashes['game-' + v + '.html']);
  check('parentIsolatedGame/' + v, manifest.games[v].isolatedHash === parent.games[v].isolatedHash);
}

const oldFields = 'hardThreats:rec.planOutput?.hardThreats??null,softThreats:rec.planOutput?.softThreats??null,promotedLethalThreats:rec.planOutput?.promotedLethalThreats??null,';
const newField = 'boundAdjustedCount:rec.planOutput?.boundAdjustedCount??null,';
assert.equal(source['harness.js'].split(newField).length, 2);
check('harnessTemplateOnlyNumericFieldChange',
  sha(source['harness.js'].replace(newField, oldFields)) === provenance.templateFiles['harness.js']);
check('serverTemplateOnlyDirectoryChange',
  sha(source['server.mjs'].replace('experiments/grow19/', 'experiments/grow18/')) === provenance.templateFiles['server.mjs']);
const harnessRegression = await read('harness-regression.mjs');
check('harnessRegressionOnlyRunIdNamingChange',
  sha(harnessRegression.replace('screen-07-', 'screen-06-')) === provenance.templateFiles['harness-regression.mjs']);

let inlineScripts = 0;
for (const match of source['index.html'].matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (/\bsrc\s*=/.test(match[1])) continue;
  new vm.Script(match[2], {filename: 'grow19-inline-' + inlineScripts++});
}
check('twoInlineScriptsCompile', inlineScripts === 2);
new vm.Script(source['harness.js'], {filename:'grow19-harness.js'});
new vm.Script(source['planner.js'], {filename:'grow19-planner.js'});
execFileSync(process.execPath, ['--check', dir + 'server.mjs'], {stdio:'pipe'});
check('harnessPlannerServerCompile', true);
check('onePlanGrow19Declaration', [...source['index.html'].matchAll(/function planGrow19\(/g)].length === 1);
check('candidatePlannerCallWired', source['index.html'].includes("runStrategy==='grow-19'?planGrow19(objects,hud,analysis.map,speed,velocity,heading,runGameVersion)"));
check('geometryAndPlannerEmbeddedExactly', source['index.html'].includes(source['geometry.js'] + '\n' + source['planner.js']));
check('noGrow18PlannerCondition', !source['planner.js'].includes('const hard = red || o.clipped || o.r >='));
check('originalHardConditionRetained', source['planner.js'].includes('const hard = red || o.clipped || chance >= .45;'));
const normalizedPage = source['index.html'].replaceAll('grow-19', 'grow-15').replaceAll('planGrow19', 'planGrow15');
const start = normalizedPage.indexOf('function readImage('), end = normalizedPage.indexOf('function hudSpeed(', start);
assert(start >= 0 && end > start);
check('readImageSameAsFrozenGrow15', sha(normalizedPage.slice(start, end)) === provenance.parentControllerFunctionHashes.readImage);
for (const name of ['tick', 'move', 'stop', 'hudSpeed']) {
  const rows = normalizedPage.split('\n').filter(line => line.startsWith('function ' + name + '('));
  check(name + 'SameAsFrozenGrow15', rows.length === 1 && sha(rows[0]) === provenance.parentControllerFunctionHashes[name]);
}
const order = n => Array.from({length:n}, () => ['v2.13', 'v2.22'].map(version => ({version,strategy:'grow-19'}))).flat();
check('screen07OrderAndGate', manifest.screen.id === 'screen-07' && manifest.screen.NPerVersion === 4 &&
  manifest.screen.minimumWinsPerVersion === 2 && JSON.stringify(manifest.screen.order) === JSON.stringify(order(4)));
check('confirm07OrderAndGate', manifest.confirmation.id === 'confirm-07' && manifest.confirmation.NPerVersion === 12 &&
  manifest.confirmation.minimumWinsPerVersion === 6 && JSON.stringify(manifest.confirmation.order) === JSON.stringify(order(12)));
check('activationPendingCompleteGrow18Only', manifest.activationPrerequisite.status.startsWith('pending') &&
  manifest.activationPrerequisite.candidate === 'grow-18' && manifest.activationPrerequisite.notAutomatic === true &&
  manifest.activationPrerequisite.screenId === 'screen-06' && manifest.activationPrerequisite.confirmationId === 'confirm-06');
check('latestVerificationFreshRootProof', manifest.latestVersionVerification.status.startsWith('fresh root') && manifest.latestVersionVerification.rootPreActivationRecheckCompletedAt === deployed.checkedAt &&
  manifest.latestVersionCheckedAt === deployed.checkedAt && hashes['deployed-game-verification.json'] === provenance.deployedVerificationCopiedHash);
let freezeExists = true; try {await fs.stat(dir + 'freeze.json');} catch (e) {if (e.code === 'ENOENT') freezeExists = false; else throw e;}
check('noSourceBatchFreezeWritten', !freezeExists);
let eventLogExists = true; try {await fs.stat(dir + 'results/events.jsonl');} catch (e) {if (e.code === 'ENOENT') eventLogExists = false; else throw e;}
check('noGameEventLogCreated', !eventLogExists);
check('allVerifiedSourcesUnchanged', (await Promise.all(names.map(async name => sha(await read(name)) === hashes[name]))).every(Boolean));
const report = {schema:1, at:new Date().toISOString(), status:'passed', candidate:'grow-19',
  kind:'offline standby build verification; no gameplay, server, browser or activation',
  protocolHash:manifest.protocolHash, hashes, checks,
  prerequisites:manifest.activationPrerequisite, latestVersionVerification:manifest.latestVersionVerification,
  gameStarts:0, serverStarts:0, browserStarts:0, freezeWritten:false};
await fs.writeFile(dir + 'build-verification.json', JSON.stringify(report,null,2) + '\n');
console.log(JSON.stringify({status:report.status, checks:Object.keys(checks).length,
  pageHash:manifest.pageHash, plannerHash:manifest.plannerHash, protocolHash:manifest.protocolHash,
  freezeWritten:false, gameStarts:0},null,2));
