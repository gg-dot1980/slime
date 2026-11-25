#!/usr/bin/env node
// Restore byte-identical dependencies already present in the pinned repository.
// This never downloads files, changes a controller, or overwrites different data.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const here = new URL('./', import.meta.url);
const repo = new URL('../../../../', here);
const manifest = JSON.parse(await readFile(new URL('game-source-dependencies.json', here), 'utf8'));
const sha256 = b => createHash('sha256').update(b).digest('hex');
const gitBlob = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const sourceBytes = new Map();
for (const entry of manifest.files) {
  assert(['src/game-v2.13.html', 'src/game.html'].includes(entry.sourcePath), 'Unexpected source path');
  assert(entry.path.startsWith('bundle/source/') && !entry.path.split('/').includes('..'), 'Unexpected destination path');
  if (!sourceBytes.has(entry.sourcePath)) sourceBytes.set(entry.sourcePath, await readFile(new URL(entry.sourcePath, repo)));
  const bytes = sourceBytes.get(entry.sourcePath);
  assert.equal(bytes.length, entry.bytes, `${entry.sourcePath}: length differs from pinned source`);
  assert.equal(sha256(bytes), entry.sha256, `${entry.sourcePath}: SHA-256 differs from pinned source`);
  assert.equal(gitBlob(bytes), entry.gitBlobSha, `${entry.sourcePath}: Git blob differs from pinned source`);
}
let created = 0;
for (const entry of manifest.files) {
  const destination = new URL(entry.path, here);
  let previous;
  try { previous = await readFile(destination); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous !== undefined) {
    assert.equal(sha256(previous), entry.sha256, `${entry.path}: refusing to overwrite different content`);
    continue;
  }
  await mkdir(new URL('./', destination), { recursive: true });
  await writeFile(destination, sourceBytes.get(entry.sourcePath), { flag: 'wx' });
  created++;
}
console.log(JSON.stringify({ status: 'verified', sourceCommit: manifest.sourceCommit, sourceFiles: sourceBytes.size, dependencies: manifest.files.length, created, retainedIdentical: manifest.files.length - created }));
