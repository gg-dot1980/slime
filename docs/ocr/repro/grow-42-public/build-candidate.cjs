'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
function readParent(number, hash) {
  const name = '../grow-' + number + '-public/ocr-grow' + number + '.html';
  const html = fs.readFileSync(path.join(__dirname, name), 'utf8');
  assert.equal(digest(html), hash, 'Frozen parent changed');
  const start = html.indexOf('function isPlayerComponent(');
  const end = html.indexOf("if (typeof module !== 'undefined' && module.exports) module.exports = {planGrow23};");
  assert(start > 0 && end > start);
  return {html, pipeline: html.slice(start, end), shell: html.slice(html.indexOf('let lastVision=', end)), prefix: html.slice(0, start)};
}
function once(source, before, after) {
  assert.equal(source.split(before).length, 2, 'Expected one occurrence of ' + before);
  return source.replace(before, () => after);
}
const classic = readParent(36, '017cf13f29f941f8e7ac77ccd3e1e9103434cc2bb4bc764e215b148d3fc0885a');
const latest = readParent(39, '42e55f8e17819100b33f1d787673c61e612f49a89dd7c648c29d79e4d556181c');
const marker = '<script>';
assert.equal(classic.prefix.slice(classic.prefix.indexOf(marker)), latest.prefix.slice(latest.prefix.indexOf(marker)));
const legacyStart = 'challenging=true;runCount++;previous=[];';
const latestStart = 'challenging=true;runCount++;heading={x:1,y:0};previous=[];';
assert.equal(classic.shell, once(latest.shell, latestStart, legacyStart), 'Keyboard, freshness, scheduling and UI control shells changed');
let shell = once(classic.shell, legacyStart, "challenging=true;runCount++;if(runGameVersion==='v2.22')heading={x:1,y:0};previous=[];");
assert.equal(shell.split('imageState=null;').length, 4);
shell = shell.replaceAll('imageState=null;', 'resetAnalysis42();');
shell = once(shell, 'if(!expected){', 'if(!factories42.has(expected)){');
shell = once(shell, 'loadedVersion=actual;', 'selectParent42(actual);loadedVersion=actual;');
shell = once(shell, 'Grow-24 候選／Grow-12 舊基線', 'Grow-42 候選／Grow-12 舊基線');
shell = once(shell, 'versions.set(item.path,item.version);', 'if(factories42.has(item.version))versions.set(item.path,item.version);');
shell = once(shell, 'versions.set(path,data.currentVersion);', 'if(factories42.has(data.currentVersion))versions.set(path,data.currentVersion);');
let prefix = classic.prefix.replaceAll('Grow-36', 'Grow-42').replaceAll('限時追獵', '雙版本追獵');
prefix = once(prefix, 'v2.13 桌機研究版。用可見小地圖、HUD 與方向鍵，在 150 秒內追求體型 200。', 'v2.13 使用 Grow36，v2.22 使用 Grow39。每次載入時核對遊戲畫面顯示的版本。');
prefix = once(prefix, '桌機開發候選。比較八個方向的可見食物、NPC、紅點與牆界，並追蹤小地圖上尺寸可判定的白點。', 'v2.13 追蹤牆邊的獵物。v2.22 用跨視野量測規劃可連續吞食的獵物。');
function factory(number, parent) {
  return 'function createParent' + number + '(){\n' + parent.pipeline +
    'return {readImage,hudSpeed,planGrow23,planGrow,resetAnalysis42(){imageState=null;}};\n}\n';
}
const route = [
  "const factories42 = new Map([['v2.13',createParent36],['v2.22',createParent39]]);",
  'let readImage,hudSpeed,planGrow23,planGrow,resetAnalysis42=()=>{};',
  'function selectParent42(version){',
  ' const make=factories42.get(version);',
  " if(!make)throw Error('未支援的遊戲版本');",
  ' ({readImage,hudSpeed,planGrow23,planGrow,resetAnalysis42}=make());',
  '}',
  ''
].join('\n');
const result = prefix + factory(36,classic) + factory(39,latest) + route + shell;
assert.equal((result.match(/<iframe\b/g)||[]).length, 1);
assert.equal((result.match(/game\.src\s*=/g)||[]).length, 1);
const filename = path.join(__dirname, 'ocr-grow42.html');
if (process.argv.includes('--check')) assert.equal(fs.readFileSync(filename,'utf8'), result);
else fs.writeFileSync(filename, result);
console.log(digest(result));
