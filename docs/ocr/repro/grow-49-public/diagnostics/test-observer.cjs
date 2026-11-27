'use strict';
// No browser, game or network. Exercise callback ordering and detached-frame delivery.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'observer.js'), 'utf8');

function realm(pathname, top) {
  const location = {protocol:'http:', hostname:'127.0.0.1', pathname};
  const nodes = new Map();
  const doc = {location, addEventListener() {}, readyState:'complete', getElementById:id => nodes.get(id)};
  const win = {location, document:doc, getComputedStyle:() => ({display:'block', visibility:'visible', opacity:'1'})};
  Object.assign(win, {window:win, self:win, top:top || win});
  doc.defaultView = win;
  return {win, doc, nodes};
}
function run(realm) { vm.runInNewContext(source, realm.win); }
const tick = () => new Promise(resolve => setImmediate(resolve));
async function test() {
  const host = realm('/');
  const candidate = realm('/candidate/grow49', host.win);
  const game = realm('/v2.13', host.win);
  let gameFrame = {contentDocument:game.doc};
  host.nodes.set('candidate', {contentDocument:candidate.doc});
  candidate.nodes.set('game', gameFrame);
  candidate.win.performance = {timeOrigin:5000, now:() => 30};
  let pixel = 1, ending = false, result = false, originalCalls = 0;
  const jobs = [], delivered = [], callbacks = [], order = [];
  const nativeCanvas = {width:2250, height:1308, get pixel() { return pixel; }};
  game.doc.querySelector = selector => selector === 'canvas' ? nativeCanvas : ending && selector === '#gameEnding.visible' ? {} : null;
  game.nodes.set('overlay', {ownerDocument:game.doc, getClientRects:() => result ? [1] : []});
  for (const [id, s] of Object.entries({size:'100', time:'02:57', start:'開始遊戲', title:'過關', description:'體型 200', gameEnding:'', endingTitle:'最後一秒！'}))
    game.nodes.set(id, {textContent:s});
  host.win.MutationObserver = class {
    constructor(fn) { callbacks.push(fn); }
    observe() {}
  };
  host.doc.createElement = name => {
    assert.equal(name, 'canvas');
    const copy = {width:0, height:0};
    copy.getContext = () => ({drawImage(src) { order.push('pixels'); copy.pixel=src.pixel; }});
    copy.toBlob = cb => { const frozen = copy.pixel; jobs.push(() => cb({pixel:frozen})); };
    return copy;
  };
  host.win.FileReader = class {
    readAsDataURL(blob) { this.result = 'mock-png-' + blob.pixel; this.onload(); }
  };
  host.win.saveGrow49Frame = async (meta, data) => { delivered.push({meta, data}); };
  const batchId = 'grow49-explore-20261127010101000';
  const state = {active:true, batchId, current:{id:batchId+'/v2.13/1',version:'v2.13'}, latest:null};
  host.win.growLocalStatus = () => state;
  run(host); run(candidate); run(game);
  candidate.win.ocrTestRecord = function(record) {
    assert.equal(this.id, 'receiver');
    order.push('original'); originalCalls++;
    state.latest = {recordAt:record.recordAt, decisionStartedAt:record.ms, planInput:{hud:100}};
    return originalCalls;
  };
  const receiver = {id:'receiver'}, record = {ms:10, recordAt:20, capture:{start:11,end:13}};
  assert.equal(candidate.win.ocrTestRecord.call(receiver, record), 1);
  assert.deepEqual(order, ['original','pixels']);
  assert.equal(candidate.win.ocrTestRecord.call(receiver, record), 2);
  assert.equal(host.win.grow49Observer.stats().busy, 1);
  pixel = 2; ending = true;
  callbacks[0](); callbacks[0]();
  pixel = 3; ending = false; result = true;
  game.nodes.get('start').textContent = '再玩一次';
  callbacks[0](); callbacks[0]();
  assert.equal(host.win.grow49Observer.stats().pending, 3);
  assert.equal(host.win.grow49Observer.drained(), false);
  // Remove the old game before any asynchronous PNG completes. Stale documents
  // must never be relabelled as a new attempt; metadata and copied pixels survive.
  gameFrame.contentDocument = null;
  state.current = {id:batchId+'/v2.22/1', version:'v2.22'};
  callbacks[0]();
  assert.equal(host.win.grow49Observer.stats().started, 3);
  jobs.splice(0).reverse().forEach(f => f());
  await tick();
  assert.equal(host.win.grow49Observer.drained(), true);
  const sorted = delivered.slice().sort((a,b) => a.meta.index-b.meta.index);
  assert.deepEqual(sorted.map(x=>x.meta.kind), ['decision','ending','result']);
  assert.deepEqual(sorted.map(x=>x.data), ['mock-png-1','mock-png-2','mock-png-3']);
  assert.ok(sorted.every(e => e.meta.version === 'v2.13' && e.meta.id === batchId+'/v2.13/1'));
  assert.equal(sorted[0].meta.decisionSnapshot.recordAt,20);
  assert.equal(sorted[2].meta.title,'過關');

  game.doc.location.pathname = '/v2.22';
  gameFrame.contentDocument = game.doc;
  result = false;
  assert.equal(candidate.win.ocrTestRecord.call(receiver, record), 3);
  host.win.saveGrow49Frame = async () => {throw Error('private sink unavailable');};
  jobs.shift()(); await tick();
  const stats = host.win.grow49Observer.stats();
  assert.equal(stats.saved, 3); assert.equal(stats.failed, 1);
  assert.equal(stats.started, stats.saved + stats.failed);
  assert.equal(stats.errors[0].kind,'decision'); assert.equal(stats.pending,0);
  assert.equal(stats.attempts[batchId+'/v2.22/1'].decisions,1);
  const shutdown = Error('original exception');
  candidate.win.ocrTestRecord = () => { throw shutdown; };
  assert.throws(() => candidate.win.ocrTestRecord(record), err => err === shutdown);
  assert.equal(host.win.grow49Observer.stats().started,4);
  console.log('Observer mocks passed; zero native starts.');
}
test().catch(error => {console.error(error);process.exitCode=1;});
