// Publication adapter only. Historical controller and test files remain byte-exact.
// Run from any directory: node <this-file> 7 /absolute/new/output [--synthetic]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import util from 'node:util';
import childProcess from 'node:child_process';
import {createRequire, syncBuiltinESMExports} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

const args = process.argv.slice(2);
const version = Number(args[0]);
const output = args[1] && path.resolve(args[1]);
const rootFlag = args.indexOf('--repo-root');
const repository = rootFlag < 0
  ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..')
  : path.resolve(args[rootFlag + 1]);
if (!Number.isInteger(version) || version < 7 || version > 12 || !output) {
  throw Error('Usage: node docs/ocr/repro/grow-7/source/reproduce.mjs <7..12> <new-output-directory> [--synthetic] [--repo-root <checkout>]');
}
if (fs.existsSync(output)) throw Error('Output must not already exist: ' + output);
const manifestPath = path.join(repository, `docs/ocr/repro/grow-${version}/source/manifest.json`);
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
if (manifest.strategyVersion !== `grow-${version}`) throw Error('Version/manifest mismatch');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function checkedSource(entry) {
  const source = path.resolve(repository, entry.repositoryPath);
  if (!source.startsWith(repository + path.sep)) throw Error('Source outside repository');
  const bytes = fs.readFileSync(source);
  if (bytes.length !== entry.bytes || sha(bytes) !== entry.sha256) {
    throw Error('Pinned source mismatch: ' + entry.repositoryPath);
  }
  return bytes;
}
// Check all dependencies before creating any output. No network or Git checkout needed.
for (const entry of Object.values(manifest.materialize)) checkedSource(entry);
for (const entry of Object.values(manifest.gitShow)) checkedSource(entry);
fs.mkdirSync(output, {recursive: true});
for (const [relative, entry] of Object.entries(manifest.materialize)) {
  const destination = path.resolve(output, relative);
  if (!destination.startsWith(output + path.sep)) throw Error('Destination outside output');
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, checkedSource(entry));
}
fs.writeFileSync(path.join(output, 'package.json'), JSON.stringify({private: true, type: 'module'}) + '\n');
fs.writeFileSync(path.join(output, 'source-manifest.json'), manifestBytes);
const helper = await import(pathToFileURL(path.join(output, 'scripts/grow-games.mjs')));
const games = {};
for (const gameVersion of ['v2.13', 'v2.20', 'v2.21', 'v2.22']) {
  games[gameVersion] = fs.readFileSync(path.join(output,
    gameVersion === 'v2.22' ? 'src/game.html' : `src/game-${gameVersion}.html`), 'utf8');
}
const bundle = helper.makeGrowBundle(games, 'v2.22');
const template = fs.readFileSync(path.join(output, 'src/ocr-grow.html'), 'utf8');
if (template.split('__GROW_GAMES__').length !== 2) throw Error('Unexpected embedding token count');
// This is the same Grow-specific embedding expression as the pinned Sites build.
const html = template.replace('__GROW_GAMES__', JSON.stringify(bundle).replaceAll('<', '\\u003c'));
if (html.includes('__GROW_GAMES__')) throw Error('Unresolved game embedding token');
let parsedScripts = 0;
for (const source of [html, ...Object.values(bundle.entries).map(entry => entry.html)]) {
  for (const match of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
    new vm.Script(match[1]);
    parsedScripts++;
  }
}
fs.writeFileSync(path.join(output, 'ocr-grow.html'), html);
const report = {
  kind: 'publication packaging verification; not browser or gameplay',
  strategyVersion: manifest.strategyVersion,
  sitesSourceCommit: manifest.sitesSourceCommit,
  sourceManifestSha256: sha(manifestBytes),
  node: process.version,
  generatedPageSha256: sha(Buffer.from(html)),
  generatedPageBytes: Buffer.byteLength(html),
  parsedScripts,
  isolatedGameVersions: 4,
  sourceDependenciesVerified: Object.keys(manifest.materialize).length + Object.keys(manifest.gitShow).length,
  syntheticChecks: [],
  browserRuns: 0,
  newGameplayStarts: 0,
  routeParity: 'not rerun; full historical Sites routes/media are outside this capsule'
};
if (args.includes('--synthetic')) {
  const previousDirectory = process.cwd();
  const realExecFileSync = childProcess.execFileSync;
  const realLog = console.log;
  const require = createRequire(path.join(output, 'package.json'));
  childProcess.execFileSync = function (command, commandArgs, options = {}) {
    if (command !== 'git' || commandArgs?.length !== 2 || commandArgs[0] !== 'show') {
      throw Error('Publication adapter only permits listed fixed git-show source reads');
    }
    const entry = manifest.gitShow[commandArgs[1]];
    if (!entry) throw Error('Unlisted historical source: ' + commandArgs[1]);
    const bytes = checkedSource(entry);
    return options.encoding ? bytes.toString(options.encoding) : bytes;
  };
  syncBuiltinESMExports();
  process.chdir(output);
  try {
    for (const script of manifest.syntheticChecks) {
      const lines = [];
      console.log = (...values) => lines.push(util.format(...values));
      require(path.join(output, script));
      const stdout = lines.join('\n') + '\n';
      const resultPath = path.join(output, 'publication-checks', path.basename(script) + '.stdout.txt');
      fs.mkdirSync(path.dirname(resultPath), {recursive: true});
      fs.writeFileSync(resultPath, stdout);
      report.syntheticChecks.push({script, status: 'passed', stdoutBytes: Buffer.byteLength(stdout), stdoutSha256: sha(Buffer.from(stdout))});
    }
  } finally {
    console.log = realLog;
    childProcess.execFileSync = realExecFileSync;
    syncBuiltinESMExports();
    process.chdir(previousDirectory);
  }
}
fs.writeFileSync(path.join(output, 'publication-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({...report, output}, null, 2));
