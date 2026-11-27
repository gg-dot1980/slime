'use strict';
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const hash = data => createHash('sha256').update(data).digest('hex');
const parent = fs.readFileSync(path.join(__dirname, '../grow-47-public/ocr-grow47.html'), 'utf8');
assert.equal(hash(parent), 'a333fd5ba52c2cbb4c6eb17fde85f5e53c9a98924a61440fe606ccb8fca27fee');
const removed = [
  '  // Claude22 stores the 1.5 s endpoint before the collision test. A collision',
  '  // exactly at k=15 therefore retains this terminal cost; an earlier one does not.',
  '  if (k===15 && wd<600) state.penalty+=(600-wd)*.04;',
].join('\n');
assert.equal(parent.split(removed).length, 2);
const html = parent.replace(removed + '\n', '')
  .replaceAll("strategy: 'grow-47'", "strategy: 'grow-48'")
  .replaceAll('Grow47 · 預測牆距評分', 'Grow48 · 近牆避讓')
  .replaceAll('Grow47 · v2.22 預測牆距', 'Grow48 · v2.22 近牆避讓')
  .replace('Grow47 候選／', 'Grow48 候選／')
  .replace('OCR Grow 47</strong>', 'OCR Grow 48</strong>')
  .replace('加入未來 1.5 秒的牆距扣分', '僅對未來 1.5 秒內距牆小於 150 或穿牆的路徑扣分');
const dest = path.join(__dirname, 'ocr-grow48.html');
if (process.argv.includes('--write')) fs.writeFileSync(dest, html);
else assert.equal(fs.readFileSync(dest, 'utf8'), html);
console.log(hash(html));
