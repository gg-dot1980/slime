import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';
import {makeGrowBundle} from './grow-games.mjs';
import worker from '../dist/server/index.js';

const read = path => readFile(path, 'utf8');
const digest = text => createHash('sha256').update(text).digest('hex');
const get = (path, method = 'GET') => worker.fetch(new Request('https://test.invalid' + path, {method}), {});
async function sourceAt(path, type = 'text/html') {
  const response = await get(path);
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get('content-type').split(';')[0], type, path);
  return response.text();
}

const shell = await read('src/ocr.html');
for (const alias of ['/ocr', '/ocr/', '/ocr.html']) assert.equal(await sourceAt(alias), shell, alias);
for (const id of ['controllerFrame', 'familyChoice', 'gameChoice', 'variantChoice', 'run', 'stop', 'historyPanel']) {
  assert(shell.includes(`id="${id}"`), 'Missing console element ' + id);
}
for (const [route, file, type] of [
  ['style.css', 'src/ocr-console.css', 'text/css'],
  ['catalog.js', 'src/ocr-console-catalog.js', 'text/javascript'],
  ['runtime.js', 'src/ocr-console-runtime.js', 'text/javascript']
]) {
  const path = '/ocr-console/' + route;
  assert(shell.includes('"' + path + '"'), path + ' not linked');
  const asset = await sourceAt(path, type);
  assert.equal(asset, await read(file), path);
  if (type === 'text/javascript') new Script(asset, {filename: file});
  const head = await get(path, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
}
assert.equal((await get('/ocr-console/missing.js')).status, 404);

for (const name of ['ocr1', 'ocr2', 'ocr3', 'ocr-test']) {
  const source = await read('src/' + name + '.html');
  for (const path of ['/' + name, '/' + name + '/', '/' + name + '.html']) {
    assert.equal(await sourceAt(path), source, path);
  }
  if (name !== 'ocr-test') assert(source.includes('href="/ocr">所有 OCR'), name);
}
const original = (await read('src/ocr1.html')).match(/<script>([\s\S]*)<\/script>/)[1];
assert.equal(digest(original), '25081bc57f0e978a824ff516559b4fa713e2934b15f444261274b2437da1fae2');

const manifest = await (await get('/api/versions')).json();
assert(manifest.versions.some(item => item.version === 'v2.13'));
const games = {};
for (const {version, path, current} of manifest.versions) {
  games[version] = await read(current ? 'src/game.html' : 'src/game-' + version + '.html');
  assert.equal(await sourceAt(path), games[version], path);
}
assert.equal(await sourceAt('/'), games[manifest.currentVersion]);
const bundle = JSON.stringify(makeGrowBundle(games, manifest.currentVersion)).replaceAll('<', '\\u003c');
for (const [file, routes] of [
  ['src/ocr-grow.html', ['/ocr-grow', '/ocr-grow/']],
  ['src/ocr-claude.html', ['/ocr-console/claude', '/ocr-console/claude/']]
]) {
  const template = await read(file);
  const expected = template.replace('__GROW_GAMES__', () => bundle);
  for (const path of routes) {
    const html = await sourceAt(path);
    assert.equal(html, expected, path);
    for (const [, code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(code, {filename: file});
  }
}
const registry = JSON.parse(await read('docs/ocr/repro/grow-local-r4-20261126/candidates.json'));
const candidate = await read('docs/ocr/repro/grow-49-public/ocr-grow49.html');
assert.equal(digest(candidate), registry.grow49.sha256);
for (const path of ['/ocr-console/grow', '/ocr-console/grow/']) assert.equal(await sourceAt(path), candidate, path);
console.log('PASS console and asset routes, native controller bytes, isolated bundles, game versions and original OCR logic');
