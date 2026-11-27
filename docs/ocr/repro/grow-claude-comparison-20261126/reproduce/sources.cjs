'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const cwd = execFileSync('git', ['rev-parse', '--show-toplevel'], {encoding:'utf8'}).trim();
const games = {
  'v2.13': ['16d41cdf2997baf0b3af33567b201d2dfb835427', '94944ef137412e93817754791c64cf7803a94f25222a8922fe8aa6936ea46d97'],
  'v2.22': ['30af12f7608da91514711ecdbc01b57654ab2eab', 'd0349b70c0be4666142f0ed880adb1b1636bcd6d7bf32a13d0d90246899c6d14'],
};
const pages = {
  Grow26: ['5f260f114ccbf2deabe322f3af6a7d28b0e5f449','7f6494c12a22d2e833fbec796196cef39c04157325c304e3961ec644652a2f33'],
  Grow38: ['35c58f4559ced251b2a52bf25078d8d640babe1b','befaf6a2c6ac1ff14596628753e509e5c15eb5bffd0e6f62f81e91b884f239ec'],
  Grow42: ['d3409db6146e79648055b626245cf20155591e1d','1da5fc0d76d3de4a3c794776982a22c1c12249ab78943fd77f36240dc1be3763'],
  Claude21: ['dcd55ddb251a94e087c1d0de56ef4c0e0f2b608e','cb5f98560c76b1f773eb28af54532a7e91b9578ffdf3498b266f0072dd8e3dde'],
  Claude22: ['8f13c2062d8a3da9ec63a6a76b2577db029ca45d','1290eabeb9750248f7011b3ca863d41c47bdd63217274fbf797fe19662748ccf'],
};
const arms = {
  Grow42:['Grow42','grow-23',100], Claude22:['Claude22','claude-22',200], ClaudeDefault:['Claude22','grow-6',200],
  LiveGrow26:['Grow26','grow-26',100], LiveClaudeDefault:['Claude21','grow-6',200], LiveClaude21:['Claude21','claude-21',200],
  Grow38:['Grow38','grow-23',100],
};
const modes = {
  standard:['Grow42','Claude22','ClaudeDefault','LiveGrow26','LiveClaudeDefault','LiveClaude21'],
  qhd:['Grow38','Claude22'],
};
const seeds = [1,2].map(n => createHash('sha256').update('ocr-grow-claude-review-pair-v1/'+n).digest().readUInt32BE());
function blob(id) { return execFileSync('git',['cat-file','blob',id],{cwd}); }
function checked(bytes, expected) {
  const actual = hash(bytes);
  if (actual!==expected) throw Error(`source SHA-256 mismatch: ${actual} != ${expected}`);
  return bytes;
}
// Re-apply the two publicly visible labels in the separately served Claude21 page.
function siteLabels(html) {
  const replacements = [
    ['<title>OCR Claude 靜態測試</title>','<title>OCR Claude · claude-21 實驗版</title>'],
    ['<strong>OCR Claude 靜態測試頁｜預設 grow-6；claude-1／claude-2 實驗可選</strong>',
     '<strong>OCR Claude · claude-21 實驗版｜預設 grow-6；claude-1～21 可選</strong>'],
  ];
  for (const [from,to] of replacements) {
    if (html.split(from).length!==2) throw Error('unrecognized Claude21 label');
    html=html.replace(from,to);
  }
  return html;
}
function buildClaude(page, work) {
  const [commit,expected]=pages[page];
  const inputs=['scripts/build-ocr-claude.mjs','scripts/grow-games.mjs','src/ocr-claude.html',
    'src/game-v2.13.html','src/game-v2.20.html','src/game-v2.21.html','src/game.html'];
  const dir=path.join(work,'build-'+page);
  for (const name of inputs) {
    const dest=path.join(dir,name);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,blob(commit+':'+name));
  }
  execFileSync(process.execPath,['scripts/build-ocr-claude.mjs','out'],{cwd:dir});
  const built=fs.readFileSync(path.join(dir,'out','index.html'),'utf8');
  return checked(page==='Claude21'?siteLabels(built):built,expected);
}
function withSources(fn) {
  const work=fs.mkdtempSync(path.join(os.tmpdir(),'ocr-matched-'));
  try {
    for (const [version,[id,expected]] of Object.entries(games)) {
      fs.writeFileSync(path.join(work,version+'.html'),checked(blob(id),expected));
    }
    for (const [page,[id,expected]] of Object.entries(pages)) {
      const bytes=page.startsWith('Claude')?buildClaude(page,work):checked(blob(id),expected);
      fs.writeFileSync(path.join(work,page+'.html'),bytes);
    }
    return fn(work);
  } finally {fs.rmSync(work,{recursive:true,force:true});}
}
module.exports={hash,games,pages,arms,modes,seeds,withSources,checked};
