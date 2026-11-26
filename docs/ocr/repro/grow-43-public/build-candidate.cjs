'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const classic=fs.readFileSync(path.join(__dirname,'../grow-39-public/ocr-grow39.html'),'utf8');
assert.equal(hash(classic),'42e55f8e17819100b33f1d787673c61e612f49a89dd7c648c29d79e4d556181c');
const forage=fs.readFileSync(path.join(__dirname,'endgame.js'),'utf8');
function once(src,a,b){assert.equal(src.split(a).length,2);return src.replace(a,()=>b);}
const at=classic.indexOf('<script>');
let head=classic.slice(0,at).replaceAll('Grow-39','Grow-43').replaceAll('跨視野獵物追蹤','免疫期補食');
head=head.replace(/(<header class="test-banner"><strong>.*?<\/strong><p>).*?(<\/p><\/header>)/,'$1v2.22 體型達 186 且暫無目標時，優先收集可到的食物，或前往多個可見白點附近搜尋。$2');
head=head.replace(/(<h1>.*?<\/h1><p>).*?(<\/p>)/,'$1v2.13 使用 Grow39。v2.22 的免疫收尾分開估算可見食物增量與白點搜尋路線。$2');
let body=classic.slice(at);
body=once(body,'function planGrow23(',forage+'\nfunction planGrow23(');
body=once(body,'const target31 = localHarvest || goals[0] || null;',[
 'const originalGoal = localHarvest || goals[0] || null;',
 '  const forage43 = immune && !originalGoal ? forageFinish43(foods,map,r,speed,old.finish43) : null;',
 '  const target31 = originalGoal || forage43?.target || null;'].join('\n'));
body=once(body,'return {...chosen, target, pursuit31, memory39,','return {...chosen, ...(forage43?{finish43:forage43.memory}:{}), target, pursuit31, memory39,');
const result=head+body,filename=path.join(__dirname,'ocr-grow43.html');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(filename,'utf8'),result);
else fs.writeFileSync(filename,result);
console.log(hash(result));
