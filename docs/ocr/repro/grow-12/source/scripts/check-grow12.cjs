const fs=require('fs'),vm=require('vm'),cp=require('child_process'),assert=require('assert');
const source='9a60e39a74eef32834b0602d089fc4d665337ae3',h=fs.readFileSync('src/ocr-grow.html','utf8'),core=h.slice(h.indexOf('const dirs='),h.indexOf('// grow-3:')),helper=fs.readFileSync('src/ocr-grow-minimap.js','utf8'),planner=fs.readFileSync('src/ocr-grow-planner.js','utf8'),old=cp.execFileSync('git',['show',source+':src/ocr-grow-planner.js'],{encoding:'utf8'});
function build(p){const c={performance:{now:()=>1000}};vm.createContext(c);vm.runInContext(core+helper+p+';this.run=planGrow;',c);return c.run}const A=build(old),B=build(planner);
const scenarios=[
 {name:'open-white',white:[700,0],red:[],walls:[2000,2000,2000,2000]},
 {name:'corner-lure',white:[600,-600],red:[],walls:[2000,460,460,2000]},
 {name:'side-wall',white:[600,0],red:[],walls:[2000,460,2000,2000]},
 {name:'red-pincers',white:[700,0],red:[[500,-300],[500,300]],walls:[2000,2000,2000,2000]},
 {name:'escape-gap',white:[700,0],red:[[550,-350],[-350,-350]],walls:[2000,2000,2000,2000]},
 {name:'corner-red',white:[700,0],red:[[-500,0],[0,500]],walls:[2000,460,460,2000]},
 {name:'no-map',white:[700,0],lost:true,red:[],walls:[]}
];
const rows=[];for(const s of scenarios)for(const mirror of [1,-1])for(const r of [89,90,91]){
 const point=(p,red)=>({x:72+p[0]*mirror/10400*144,y:50+p[1]/10400*144,red,sizeUpper:50});const map=s.lost?null:{width:144,height:144*7200/10400,pixelRatio:1,player:{x:72,y:50},observedAt:1000,growMarkers:[point(s.white,false),...s.red.map(p=>point(p,true))],visibleWalls:mirror===1?s.walls:[s.walls[1],s.walls[0],s.walls[2],s.walls[3]]};const args=[[],r,map,180,{x:0,y:0},{x:mirror,y:0}],a=A(...args),b=B(...args);if(r===89||s.name==='open-white'||s.name==='side-wall'||s.lost){assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-6,s.name+' must preserve control');}if(b.mode==='escape-route'){assert(b.wallOK&&b.redSafe&&b.clearance>3,'new selected direction remains safe');}if(s.name==='corner-lure'&&r>=90){assert(b.x*mirror<0&&b.y>0,'corner moves inward');}if(s.name==='red-pincers'&&r>=90)assert(b.x*mirror<=0,'do not flee toward other red');rows.push({name:s.name,mirror,r,a:{x:a.x,y:a.y,reason:a.reason},b:{x:b.x,y:b.y,reason:b.reason,escape:b.escape},changed:Math.hypot(a.x-b.x,a.y-b.y)>.01});}
assert(rows.some(x=>x.changed),'meaningful comparison');assert(h.includes(planner));console.log(JSON.stringify({pass:true,source,cases:rows.length,changed:rows.filter(x=>x.changed).length,naturalGames:0,rows},null,2));
