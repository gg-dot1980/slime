import {createHash} from 'node:crypto';
import {readFile, readdir, mkdir, writeFile, cp, rm} from 'node:fs/promises';
import {makeGrowBundle} from './grow-games.mjs';
import {designDocuments} from '../src/ocr-gui-design/routes.mjs';

const readText = path => readFile(path, 'utf8');
const sha256 = text => createHash('sha256').update(text).digest('hex');

// The native strategy value "grow-23" is reused across frozen revisions.
// Update the controller, catalog and expected digest together when switching revisions.
async function pinnedGrowController() {
  const directory = 'docs/ocr/repro';
  const registry = JSON.parse(await readText(directory + '/grow-local-r4-20261126/candidates.json'));
  const expected = '85071f2d68a8320b444aa643f5dffb61cbe2523f6de5caf8cb45ba542bd5a0b6';
  const source = await readText(directory + '/grow-49-public/ocr-grow49.html');
  if (registry.grow49?.sha256 !== expected || sha256(source) !== expected) {
    throw Error('Grow49 source or registry differs from the reviewed console pin');
  }
  return source;
}

const html = await readText('src/game.html');
const current = html.match(/SLIME ARENA · (v[\d.]+)/)[1];
const games = {};
for (const file of await readdir('src')) {
  const match = /^game-(v[\d.]+)\.html$/.exec(file);
  if (match) games[match[1]] = await readText('src/' + file);
}
games[current] = html;
const versions = Object.keys(games).sort((a, b) => b.localeCompare(a, undefined, {numeric: true}))
  .map(version => ({version, path: '/' + version, current: version === current}));
const manifest = {currentVersion: current, currentPath: '/', versions};
const isolatedGames = JSON.stringify(makeGrowBundle(games, current)).replaceAll('<', '\\u003c');

function embedGames(template) {
  if (template.split('__GROW_GAMES__').length !== 2) throw Error('Expected one game bundle placeholder');
  return template.replace('__GROW_GAMES__', () => isolatedGames);
}

// Claude strategy updates are made on this ocr branch since 2026-11-27 (claude-27 onward); before that the source
// came from gg-dot1980/slime’s ocr-claude branch (80b1f79). Update this pin/digest together with
// src/ocr-claude.html and re-run the build and route checks.
const claude = await readText('src/ocr-claude.html');
// claude-37 on the ocr branch (based on ocr-claude 80b1f79), Git blob cdb2fd78ed487fa5436ef627f3572d2a3a8ba27f.
if (sha256(claude) !== 'ebec2dcb6c56e9053c9444cf924c4d8db0d777e83af6220adba059485b6fcaf9') {
  throw Error('Claude source differs from the reviewed pin');
}
const shell = await readText('src/ocr.html');
const catalog = await readText('src/ocr-console-catalog.js');
const consoleAssets = [
  ['grow', ['text/html', await pinnedGrowController()]],
  ['claude', ['text/html', embedGames(claude)]],
  ['style.css', ['text/css', await readText('src/ocr-console.css')]],
  ['catalog.js', ['text/javascript', catalog]],
  ['runtime.js', ['text/javascript', await readText('src/ocr-console-runtime.js')]]
];
const content = {
  __OCR_GUI_DESIGN_DOCUMENTS__: designDocuments(shell, catalog),
  __OCR_CONSOLE_ASSETS__: consoleAssets,
  __SITEMAP_XML__: await readText('src/sitemap.xml'),
  __ROBOTS_TXT__: await readText('src/robots.txt'),
  __OCR_GROW_HTML__: embedGames(await readText('src/ocr-grow.html')),
  __GAME_HTML__: html,
  __GAMES__: games,
  __VERSIONS__: manifest,
  __CONTROLLER_HTML__: await readText('src/controller.html'),
  __RELEASE_HTML__: await readText('src/release.html'),
  __OCR1_HTML__: await readText('src/ocr1.html'),
  __OCR_HTML__: shell,
  __OCR_TEST_HTML__: await readText('src/ocr-test.html'),
  __OCR3_HTML__: await readText('src/ocr3.html'),
  __OCR2_HTML__: await readText('src/ocr2.html')
};

// Insert only into the original Worker template. Native source can contain
// dollar replacement patterns and strings that resemble other placeholders.
const template = await readText('src/worker.js');
const used = new Set();
const worker = template.replace(/__[A-Z][A-Z0-9_]*__/g, token => {
  if (!Object.hasOwn(content, token)) throw Error('Unknown Worker placeholder: ' + token);
  used.add(token);
  return JSON.stringify(content[token]);
});
for (const token of Object.keys(content)) {
  if (!used.has(token)) throw Error('Missing Worker placeholder: ' + token);
}

await rm('dist', {recursive: true, force: true});
await mkdir('dist/server', {recursive: true});
await mkdir('dist/.openai', {recursive: true});
await writeFile('dist/server/index.js', worker);
await cp('.openai/hosting.json', 'dist/.openai/hosting.json');
