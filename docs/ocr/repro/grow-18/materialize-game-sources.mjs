#!/usr/bin/env node
// Restore existing pinned repo files locally. No download or source transform.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const blob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
export async function materializeGames({repositoryRoot = path.resolve(here, '../../../..'),
  destination = path.join(here, 'source')} = {}) {
  const manifest = JSON.parse(await fs.readFile(path.join(here, 'game-source-dependencies.json'), 'utf8'));
  const planned = [];
  for (const entry of manifest.files) {
    assert(['src/game-v2.13.html', 'src/game.html'].includes(entry.sourcePath), 'Unexpected existing source');
    assert(['experiments/grow18/game-v2.13.html', 'experiments/grow18/game-v2.22.html'].includes(entry.runtimePath), 'Unexpected destination');
    const bytes = await fs.readFile(path.join(repositoryRoot, entry.sourcePath));
    assert.equal(bytes.length, entry.bytes, 'Pinned game length mismatch: ' + entry.sourcePath);
    assert.equal(sha(bytes), entry.sha256, 'Pinned game SHA-256 mismatch: ' + entry.sourcePath);
    assert.equal(blob(bytes), entry.gitBlobSha, 'Pinned game Git blob mismatch: ' + entry.sourcePath);
    const target = path.join(destination, entry.runtimePath);
    let existing;
    try { existing = await fs.readFile(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (existing !== undefined) {
      assert.equal(sha(existing), entry.sha256, 'Refusing to overwrite different game source: ' + entry.runtimePath);
    }
    planned.push({target, bytes, exists: existing !== undefined});
  }
  // All source and destination checks precede writes.
  for (const item of planned) if (!item.exists) {
    await fs.mkdir(path.dirname(item.target), {recursive: true});
    await fs.writeFile(item.target, item.bytes, {flag: 'wx'});
  }
  return {status: 'verified', sourceCommit: manifest.sourceCommit,
    dependencies: planned.length, created: planned.filter(item => !item.exists).length,
    retainedIdentical: planned.filter(item => item.exists).length};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = name => {
    const index = process.argv.indexOf(name);
    return index < 0 ? undefined : path.resolve(process.argv[index + 1]);
  };
  console.log(JSON.stringify(await materializeGames({repositoryRoot: option('--repo-root'),
    destination: option('--destination')}), null, 2));
}
