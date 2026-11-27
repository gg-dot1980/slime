'use strict';
// Local test support only. Use the supported preview launcher in managed Work.
// Original game bytes and candidate HTML are served unchanged. Game APIs cannot write.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../../../..');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const output = path.join(__dirname, 'results-private');
fs.mkdirSync(output, {recursive: true});
const versions = [
  {version: 'v2.13', path: '/v2.13', blob: '16d41cdf2997baf0b3af33567b201d2dfb835427'},
  {version: 'v2.22', path: '/v2.22', blob: '30af12f7608da91514711ecdbc01b57654ab2eab'}
];
const games = new Map(versions.map(v => {
  const bytes = cp.execFileSync('git', ['cat-file', 'blob', v.blob], {cwd: root, maxBuffer: 2e6});
  const actual = crypto.createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
  if (actual !== v.blob) throw Error('Game blob differs: ' + v.version);
  v.sha256 = hash(bytes);
  return [v.path, bytes];
}));
const candidates = new Map([24,25].map(n => {
  const relative = `docs/ocr/repro/grow-${n}-public/ocr-grow${n}.html`;
  const bytes = fs.readFileSync(path.join(root, relative));
  return ['grow' + n, {bytes, path: relative, sha256: hash(bytes)}];
}));
const sourceNames = ['server.cjs', 'harness.js', 'index.html', 'ledger.cjs', 'protocol.json'];
const startupSource = new Map(sourceNames.map(name => [name, fs.readFileSync(path.join(__dirname, name))]));
const sourceFiles = sourceNames.map(name => ({name, sha256: hash(startupSource.get(name))}));
const runnerSha256 = hash(JSON.stringify(sourceFiles));
const manifest = {
  schemaVersion: 1, runnerSha256, sourceFiles, versions,
  candidates: Object.fromEntries([...candidates].map(([id, v]) => [id, {path: v.path, sha256: v.sha256}])),
  sourceCommit: cp.execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
  node: process.version, platform: process.platform,
  protocol: JSON.parse(fs.readFileSync(path.join(__dirname, 'protocol.json'), 'utf8'))
};
const {validateLedger} = require('./ledger.cjs');
const sessions = new Map();
let deniedGameWrites = 0;
function answer(res, status, body, contentType = 'application/json; charset=utf-8') {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  res.writeHead(status, {'Content-Type': contentType, 'Content-Length': bytes.length, 'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'"});
  res.end(bytes);
}
function validId(id) { return typeof id === 'string' && /^[a-zA-Z0-9_-]{6,100}$/.test(id); }
function rowsFor(id) {
  if (!validId(id)) throw Error('Invalid batch id');
  const file = path.join(output, id + '.jsonl');
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
}
function summarize(id) {
  const rows = rowsFor(id);
  const frozen = JSON.parse(fs.readFileSync(path.join(output, id + '-contract.json'), 'utf8'));
  const report = validateLedger(rows, {expectedVersions: versions.map(v => v.version), expectedContract: frozen.contract});
  if (JSON.stringify(rows[0]?.planned) !== JSON.stringify(frozen.planned)) {
    report.ok=false;report.integrityOk=false;report.complete=false;report.gatePassed=false;
    report.eligibleForConfirm=false;report.meetsGoal=false;report.issues.push({code:'frozen_plan_mismatch',message:'Planned attempts differ from the independently frozen plan'});
  }
  return {batchId: id, candidate: rows[0]?.contract?.candidate, phase: rows[0]?.phase,
    ...report, rowCount: rows.length, lastType: rows.at(-1)?.type,
    rawSha256: hash(fs.readFileSync(path.join(output, id + '.jsonl')))};
}
function rejectPixels(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (/^(pixels|rgba|imageData|image|screenshot|dataUrl|png|jpeg|token|cookie|authorization)$/i.test(key)) throw Error('Prohibited evidence field');
    rejectPixels(child);
  }
}
async function body(req) {
  let chunks = [], n = 0;
  for await (const chunk of req) { n += chunk.length; if (n > 700000) throw Error('Body too large'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function route(req, res) {
  const url = new URL(req.url, 'http://localhost'), p = url.pathname;
  if (req.method === 'GET') {
    if (p === '/api/versions') return answer(res, 200, {versions: versions.map(v => ({version: v.version, path: v.path, current: v.version === 'v2.22'})), currentVersion: 'v2.22', currentPath: '/v2.22'});
    if (p === '/lab/manifest') return answer(res, 200, manifest);
    if (p === '/lab/status') {
      const id = url.searchParams.get('batchId');
      if (id) return answer(res, 200, summarize(id));
      return answer(res, 200, {deniedGameWrites, batches: fs.readdirSync(output).filter(x => x.endsWith('.jsonl')).map(x => x.slice(0,-6))});
    }
    if (p === '/lab/ledger') return answer(res, 200, rowsFor(url.searchParams.get('batchId')));
    if (games.has(p)) return answer(res, 200, games.get(p), 'text/html; charset=utf-8');
    if (p.startsWith('/candidate/')) {
      const candidate = candidates.get(p.slice('/candidate/'.length));
      if (candidate) return answer(res, 200, candidate.bytes, 'text/html; charset=utf-8');
    }
    if (p === '/' || p === '/index.html') return answer(res, 200, startupSource.get('index.html'), 'text/html; charset=utf-8');
    if (p === '/harness.js') return answer(res, 200, startupSource.get('harness.js'), 'application/javascript; charset=utf-8');
    return answer(res, 503, {error: 'Local test: resource unavailable'});
  }
  if (req.method === 'POST' && p === '/lab/append') {
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return answer(res, 403, {error: 'Same-origin lab requests only'});
    const data = await body(req), {batchId, seq, row} = data;
    if (!validId(batchId) || !Number.isSafeInteger(seq) || seq < 0 || row?.batchId !== batchId) throw Error('Invalid append identity');
    rejectPixels(row);
    let session = sessions.get(batchId);
    const serialized = JSON.stringify(row) + '\n', digest = hash(serialized);
    if (!session) {
      if (seq !== 0 || row.type !== 'batch') throw Error('New batch must begin with header');
      if (row.contract?.runnerSha256 !== runnerSha256) throw Error('Harness source changed');
      if (row.contract?.candidateSha256 !== candidates.get(row.contract?.candidate)?.sha256) throw Error('Candidate source changed');
      if (row.contract?.protocolId !== manifest.protocol.id || JSON.stringify(row.contract?.versions) !== JSON.stringify(versions)) throw Error('Game/protocol contract differs');
      if (row.phase === 'confirm') {
        const prior = summarize(row.priorExploration);
        const priorFrozen = JSON.parse(fs.readFileSync(path.join(output, row.priorExploration + '-contract.json'), 'utf8'));
        if (!prior.eligibleForConfirm || JSON.stringify(priorFrozen.contract) !== JSON.stringify(row.contract)) throw Error('No complete matching exploration');
      }
      fs.writeFileSync(path.join(output, batchId + '-contract.json'), JSON.stringify({contract: row.contract, planned: row.planned}, null, 2) + '\n', {flag: 'wx', mode: 0o600});
      const fd = fs.openSync(path.join(output, batchId + '.jsonl'), 'wx');
      session = {fd, next: 0, hashes: [], rows: [], closed: false};
      sessions.set(batchId, session);
    }
    if (seq < session.next && session.hashes[seq] === digest) return answer(res, 200, {accepted: true, duplicate: true, seq, ...(row.type==='batch-end'?{report:summarize(batchId)}:{})});
    if (session.closed || seq !== session.next) throw Error('Sequence mismatch or closed batch');
    fs.writeSync(session.fd, serialized); fs.fsyncSync(session.fd);
    session.hashes.push(digest); session.rows.push(row); session.next++;
    if (row.type === 'batch-end') {
      session.closed = true; fs.closeSync(session.fd);
      const report = summarize(batchId);
      fs.writeFileSync(path.join(output, batchId + '-summary.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
      return answer(res, 200, {accepted: true, seq, report});
    }
    return answer(res, 200, {accepted: true, seq});
  }
  deniedGameWrites++;
  return answer(res, 503, {error: 'Isolated test: game writes disabled'});
}
const server = http.createServer((req, res) => route(req, res).catch(error => answer(res, 400, {error: error.message})));
const argv = process.argv.slice(2), portIndex = argv.indexOf('--port');
const port = Number(process.env.PORT || (portIndex >= 0 ? argv[portIndex + 1] : 4173));
server.listen(port, '0.0.0.0', () => console.log('OCR Grow local test support ready; original games immutable; external writes disabled.'));
