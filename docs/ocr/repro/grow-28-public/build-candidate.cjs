'use strict';
// Deterministic text construction only. No DOM, image, network, or game execution.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const parentPath=path.join(__dirname,'../grow-27-public/ocr-grow27.html');
const candidatePath=path.join(__dirname,'ocr-grow28.html');
const parentSha256='08e618fa6d05703a302f8cfc798aea6074c7ffe99805529b92149a4c8fc6e914';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function replaceOne(text,before,after){assert.equal(text.split(before).length,2,'unique source replacement: '+before.slice(0,60));return text.replace(before,after);}
function plannerText(html){const a=html.indexOf('function planGrow23('),b=html.indexOf('\nif (typeof module',a);assert(a>=0&&b>a);return html.slice(a,b);}
const oldApproach=`      const before = hypot(o.x, o.y), after = hypot(o.x + (o.vx || 0) * 1.4 - x, o.y + (o.vy || 0) * 1.4 - y);
      const captured = !o.mapOnly && [...picked].some(i => {
        const meal = reachableMeals[i];
        return !!meal.npc === !!o.npc && Math.abs(meal.x - o.x) < 1e-6 && Math.abs(meal.y - o.y) < 1e-6;
      });`;
const newApproach=`      const captured = !o.mapOnly && [...picked].some(i => {
        const meal = reachableMeals[i];
        return !!meal.npc === !!o.npc && Math.abs(meal.x - o.x) < 1e-6 && Math.abs(meal.y - o.y) < 1e-6;
      });
      // Grow28: only uncaptured, directly visible targets use first-command
      // progress. Map-only scouting keeps Grow27's endpoint, and a capture
      // anywhere in the full 2.2-second path still earns the original reward.
      const firstProgress = !o.mapOnly && !captured;
      const progressX = firstProgress ? firstSegmentX : x;
      const progressY = firstProgress ? firstSegmentY : y;
      const before = hypot(o.x, o.y), after = hypot(o.x + (o.vx || 0) * 1.4 - progressX, o.y + (o.vy || 0) * 1.4 - progressY);`;
const replacements=[
  ['    let x = 0, y = 0, vx = v.x, vy = v.y, gain = 0, growth = 0, risk = 0;','    let x = 0, y = 0, vx = v.x, vy = v.y, gain = 0, growth = 0, risk = 0;\n    let firstSegmentX = 0, firstSegmentY = 0;'],
  ['      x += vx * dt; y += vy * dt;','      x += vx * dt; y += vy * dt;\n      if (k === turnAt) { firstSegmentX = x; firstSegmentY = y; }'],
  [oldApproach,newApproach]
];
const uiReplacements=[
  ['<title>OCR Grow · Grow-27 · 綠色玩家定位候選</title>','<title>OCR Grow · Grow-28 · 可見目標接近候選</title>'],
  ['<strong>OCR Grow · Grow-27 · 綠色玩家定位候選</strong>','<strong>OCR Grow · Grow-28 · 可見目標接近候選</strong>'],
  ['感知候選：以綠色相機框與玩家圓點共同定位，定位拒判仍可能沿用既有主畫面控制。已核對有限合成案例，仍有拒判與變差案例；自然實戰 0，目標仍為 150 秒內體型 200。','直接沿用 Grow27，只有未預測捕獲的可見目標改以第一段 0.6 秒評估接近。小地圖偵察與完整路徑捕獲收益維持；未來捕獲仍可能誘發第一段反向。自然實戰 0，目標仍為 150 秒內體型 200。'],
  ['<h1>Grow-27 · 綠色玩家定位</h1>','<h1>Grow-28 · 可見目標接近</h1>'],
  ['直接以 Grow24 為父版，只修小地圖綠色玩家／相機框定位。原遊戲、原生視野、路徑規劃及安全條件維持；不含 Grow26 變更。合成結果不代表實戰勝率；下一自然批次僅限 958×557、DPR1、整數小地圖原點。','直接以 Grow27 為父版，保留其綠色玩家定位；只調整未預測捕獲的可見食物／NPC 接近評分。原有安全條件不改，但選中路徑可能更靠近危險。沒有加入 Grow26 偵察變更；合成案例不代表勝率。自然測試仍限 958×557、DPR1、整數小地圖原點。'],
  ['<option value="grow-23" selected>Grow-27 · 感知候選／既有策略</option>','<option value="grow-23" selected>Grow-28 · 可見目標接近候選</option>'],
  ['Grow27 小地圖定位；其餘辨識與策略沿用 Grow24。','Grow27 小地圖定位；Grow28 可見目標接近評分。'],
  ['保持頁面前景。Grow-27 不送出','保持頁面前景。Grow-28 不送出']
];
function build(){
  const bytes=fs.readFileSync(parentPath);assert.equal(hash(bytes),parentSha256,'fixed Grow27 parent');
  const parent=bytes.toString('utf8'),oldPlanner=plannerText(parent);let nextPlanner=oldPlanner;
  for(const pair of replacements)nextPlanner=replaceOne(nextPlanner,...pair);
  let candidate=replaceOne(parent,oldPlanner,nextPlanner);
  for(const pair of uiReplacements)candidate=replaceOne(candidate,...pair);
  let reversed=candidate;
  for(const [before,after] of [...uiReplacements].reverse())reversed=replaceOne(reversed,after,before);
  reversed=replaceOne(reversed,nextPlanner,oldPlanner);
  assert.equal(reversed,parent,'only stated planner and displayed text changes');
  const styles=html=>[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]);
  assert.deepEqual(styles(candidate),styles(parent),'native CSS unchanged');
  const scripts=[...candidate.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  assert.equal(scripts.length,2);scripts.forEach((s,i)=>new vm.Script(s,{filename:'grow28-inline-'+i}));
  const tick=html=>html.slice(html.indexOf('function tick(runId){'),html.indexOf('\nconst gameChoice=',html.indexOf('function tick(runId){')));
  assert.equal(tick(candidate),tick(parent),'tick/start/control branches byte-identical');
  const detector=html=>html.slice(html.indexOf('function detectMinimap('),html.indexOf('\nfunction hasSlimeLabel('));
  assert.equal(detector(candidate),detector(parent),'parent detector byte-identical');
  const manifest={schemaVersion:1,candidate:'grow28',sourceCommit:null,status:'prepared; natural starts 0; not deployed',
    parent:{candidate:'grow27',path:'../grow-27-public/ocr-grow27.html',sha256:parentSha256},
    candidateSha256:hash(candidate),candidateBytes:Buffer.byteLength(candidate),
    parentPlannerSha256:hash(oldPlanner),candidatePlannerSha256:hash(nextPlanner),
    internalStrategyId:'grow-23',internalPlannerName:'planGrow23',
    change:'Only uncaptured directly visible target approach uses the first 0.6-second position. Map-only approach, full-horizon captures, gain, safety, and control branches are unchanged.',
    checks:{reverseToParentExact:true,cssExact:true,detectorExact:true,tickAndStartExact:true,inlineScriptsParsed:2},
    nativeTestScope:{canvas:[958,557],dpr:1,minimapOrigin:[799,70]},
    inheritedLimitations:'Grow27 perception rejection/regression/resource findings remain; see its README. Detector rejection is not a guarantee of released controls.',
    remainingLimitation:'A capture predicted during the second segment still receives full capture progress and gain and may favor an initially opposite action.'};
  return {parent,candidate,manifest};
}
if(require.main===module){const {candidate,manifest}=build();if(process.argv.includes('--write')){
  for(const [file,data] of [[candidatePath,candidate],[path.join(__dirname,'candidate-manifest.json'),JSON.stringify(manifest,null,2)+'\n']]){
    if(fs.existsSync(file))assert.equal(fs.readFileSync(file,'utf8'),data,'existing artifact differs: '+file);else fs.writeFileSync(file,data,{flag:'wx'});
  }
}else assert.equal(fs.readFileSync(candidatePath,'utf8'),candidate,'candidate matches deterministic build');console.log(JSON.stringify(manifest,null,2));}
module.exports={build,plannerText,hash,parentSha256};
