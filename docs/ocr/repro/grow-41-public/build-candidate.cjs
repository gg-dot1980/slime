const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const base=fs.readFileSync(path.join(root,'grow-32-public','ocr-grow32.html'),'utf8');
const moduleSource=fs.readFileSync(path.join(__dirname,'overlap.js'),'utf8');
const html=base.replace('function planGrow23(',moduleSource+'\nfunction planParent32(');
const i=html.indexOf('<script>');const header=html.slice(0,i).replaceAll('Grow-32','Grow-41').replaceAll('小地圖獵物追蹤','獵物近身追蹤')
 .replace('利用畫面上的小地圖標記估計獵物大小。靠近相機框時，短暫保留前幾拍的位置與尺寸，再從主畫面確認追逐方向。','只在已連續確認尺寸的獵物與玩家輪廓合併、且附近沒有其他危險時，短暫延續前一拍的接觸方向。');
const result=header+html.slice(i);
const destination=path.join(__dirname,'ocr-grow41.html');
if(process.argv.includes('--check')){if(fs.readFileSync(destination,'utf8')!==result)throw Error('Candidate bytes differ from reconstruction');}
else fs.writeFileSync(destination,result);
console.log(crypto.createHash('sha256').update(result).digest('hex'));
