'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
function parent(n,expected){
  const bytes=fs.readFileSync(path.join(__dirname,'../grow-'+n+'-public/ocr-grow'+n+'.html'));
  if(sha256(bytes)!==expected)throw Error('Unexpected Grow'+n+' hash');
  return bytes.toString('utf8');
}
function between(s,a,b){
  const i=s.indexOf(a),j=s.indexOf(b,i+1);
  if(i<0||j<0)throw Error('Parent section not found');
  return s.slice(i,j);
}
const grow31=parent(31,'c7eea92bc8b1698b457d157c5f1d102b69293af3e724cadf312a1833b38461af');
const grow32=parent(32,'d4ada6b01f42fd7791dabdf121441de81c96f59d276301d907e4f03ed495f8d4');
const parentPlanner=between(grow31,'function planGrow23(', 'if (typeof module').replace('function planGrow23(', 'function planLatest31(');
const markerCode=between(grow31,'function scoutDots29(', 'function growMapInputs(');
const router=`function planGrow23(objects,r,map,speed,velocity,old,version){
 if(version==='v2.13')return planClassic32(objects,r,map,speed,velocity,old,version);
 if(version==='v2.22')return planLatest31(objects,r,map,speed,velocity,old,version);
 throw Error('Grow35 supports v2.13 and v2.22');
}
`;
const marker32='if(map&&map.player)map.developmentMarkers=scoutComponents32(image,w,h,map);';
const dimensions='if(map){map.observedAt=now;map.viewWidth=w/ratio;map.viewHeight=h/ratio;}';
const routed32="if(runGameVersion==='v2.13'&&map&&map.player)map.developmentMarkers=scoutComponents32(image,w,h,map);";
const routed31="if(runGameVersion==='v2.22'&&map?.player&&runStrategy==='grow-23')map.growMarkers.push(...scoutDots29(image,w,map));";
if(!grow32.includes(marker32)||!grow32.includes(dimensions))throw Error('Missing perception section');
const scriptsAt=grow32.indexOf('<script>');
const header=grow32.slice(0,scriptsAt).replaceAll('Grow-32','Grow-35').replaceAll('小地圖獵物追蹤候選','雙版本追獵候選')
 .replace('利用畫面上的小地圖標記估計獵物大小。靠近相機框時，短暫保留前幾拍的位置與尺寸，再從主畫面確認追逐方向。','v2.13 使用 Grow32 的小地圖獵物追蹤，v2.22 使用 Grow31 的持續追獵。按下開始前會核對原遊戲的版本。');
const js=grow32.slice(scriptsAt).replace(marker32,routed32).replace(dimensions,dimensions+'\n '+routed31)
 .replace('function planGrow23(',markerCode+'\n'+parentPlanner+'\n'+router+'\nfunction planClassic32(');
const out=header+js;
const output=path.join(__dirname,'ocr-grow35.html');
if(process.argv.includes('--check')){
 if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==out)throw Error('Candidate differs from reconstructed parents');
}else fs.writeFileSync(output,out);
console.log(sha256(out));
