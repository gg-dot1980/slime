'use strict';
// Rebuild the registered candidate from the Grow24 source and the frozen detector.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const parentPath='docs/ocr/repro/grow-24-public/ocr-grow24.html';
const parent=fs.readFileSync(path.join(root,parentPath),'utf8');
assert.equal(hash(parent),'f276dd1b6dd340c142f00027adf2ddeefc394c74db772edf814cd6f9445f6347','Frozen Grow24 changed.');
const helper=fs.readFileSync(path.join(__dirname,'locate-player.cjs'),'utf8');
function extract(text,startMarker,endMarker){
  const start=text.indexOf(startMarker),end=text.indexOf(endMarker,start);
  assert(start>=0&&end>start,'Extraction failed: '+startMarker);
  return text.slice(start,end);
}
const replacements=[];
function replace(source,old,value,count=1){
  assert.equal(source.split(old).length-1,count,'Replacement count differs: '+old.slice(0,70));
  replacements.push({old,value,count});return source.split(old).join(value);
}
const originalDetector=extract(parent,'function detectMinimap(','function hasSlimeLabel(');
const oldBlock=extract(originalDetector,' // A filled green disk',' const opportunities');
const newBlock=' const player=locateMinimapPlayer27(green,W,H,pixelRatio,width,height,w/pixelRatio,h/pixelRatio,x-Math.floor(x),y-Math.floor(y));\n';
let html=replace(parent,oldBlock,newBlock);
html=replace(html,'function detectMinimap(',helper+'\nfunction detectMinimap(');
html=replace(html,'OCR Grow · Grow-24 · 原遊戲視野候選','OCR Grow · Grow-27 · 綠色玩家定位候選',2);
html=replace(html,'<h1>Grow-24 · 原遊戲視野</h1>','<h1>Grow-27 · 綠色玩家定位</h1>');
html=replace(html,'Grow-24 · 沿用 Grow-23 策略','Grow-27 · 感知候選／既有策略');
html=replace(html,
 '實驗策略：在既有模型判定可避敵的路徑內，優先保留離牆空間，降低 NPC 生成位置受邊界限制的風險。目前只有合成案例，尚無自然實戰結果；目標仍為 150 秒內體型 200。',
 '感知候選：以綠色相機框與玩家圓點共同定位，定位拒判仍可能沿用既有主畫面控制。已核對有限合成案例，仍有拒判與變差案例；自然實戰 0，目標仍為 150 秒內體型 200。');
html=replace(html,
 '以 Grow-22 為父版。在 v2.22 仍可能被吞食時，優先選擇保有離牆空間且通過既有避敵條件的路徑；沒有合適路徑時仍以已見敵人的避讓為先。此策略可能放棄牆邊食物，尚未實戰驗證。',
 '直接以 Grow24 為父版，只修小地圖綠色玩家／相機框定位。原遊戲、原生視野、路徑規劃及安全條件維持；不含 Grow26 變更。合成結果不代表實戰勝率；下一自然批次僅限 958×557、DPR1、整數小地圖原點。');
html=replace(html,'共用辨識 test-033；','Grow27 小地圖定位；其餘辨識與策略沿用 Grow24。');
html=replace(html,'保持頁面前景。Grow-23 不送出','保持頁面前景。Grow-27 不送出');
const expectedSha256='08e618fa6d05703a302f8cfc798aea6074c7ffe99805529b92149a4c8fc6e914';
assert.equal(hash(html),expectedSha256);
const dest=path.join(__dirname,'ocr-grow27.html');
if(process.argv.includes('--write')) fs.writeFileSync(dest,html);
else assert.equal(fs.readFileSync(dest,'utf8'),html,'Registered candidate differs.');
console.log(expectedSha256);
