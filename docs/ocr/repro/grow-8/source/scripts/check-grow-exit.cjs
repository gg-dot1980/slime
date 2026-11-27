const fs=require('fs'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const base='c717ccca49e95c4cc6f8f4075f8586ced9632e6a',h=cp.execFileSync('git',['show',base+':src/ocr-grow.html'],{encoding:'utf8'}),dirs=h.slice(h.indexOf('const dirs='),h.indexOf('function planBaseline(')),helper=fs.readFileSync('src/ocr-grow-minimap.js','utf8');
function api(p){const c={};vm.createContext(c);vm.runInContext(dirs+helper+p+';this.run=planGrow;if(typeof growExitEvidence!=="undefined")this.run.evidence=growExitEvidence;',c);return c.run}
const A=api(cp.execFileSync('git',['show',base+':src/ocr-grow-planner.js'],{encoding:'utf8'})),B=api(fs.readFileSync('src/ocr-grow-planner.js','utf8'));
const dot=(x,y,red=false,sizeLower=0)=>({x:72+x/10400*144,y:50+y/7200*(144*7200/10400),red,sizeLower});
const scenarios=[
 ['open',[dot(300,0)],[2000,2000,2000,2000]],
 ['wall-exit',[dot(0,280)],[400,1500,1500,1500]],
 ['corner-blocked',[dot(600,0),dot(0,-700)],[1500,700,1500,400]],
 ['red-bypass',[dot(300,300),dot(600,0,true)],[2000,2000,2000,2000]],
 ['multiple',[dot(600,0),dot(0,-700)],[1500,700,1500,1500]],
 ['low-confidence',[dot(300,0)],null],
 ['near-small',[dot(6/144*10400,0)],[2000,2000,2000,2000]],
 ['red-emergency',[dot(100,0,true),dot(-300,0)],[2000,2000,2000,2000]],
 ['all-blocked',[dot(600,0)],[1500,700,400,400]],
 ['near-size',[dot(300,0,false,98),dot(0,-300)],[2000,2000,2000,2000]]
];const rows=[];for(const [name,markers,walls]of scenarios){const map={width:144,height:144*7200/10400,player:{x:72,y:50},growMarkers:markers,visibleWalls:walls};const args=[[],96,map,180,{x:0,y:0},{x:1,y:0}],a=A(...args),b=B(...args);const rev=B(...[[],96,{...map,growMarkers:[...markers].reverse()},180,{x:0,y:0},{x:1,y:0}]);assert.equal(b.x,rev.x);assert.equal(b.y,rev.y);assert.deepEqual(b.target,rev.target);if(['open','wall-exit','low-confidence','near-small','red-emergency'].includes(name)){assert.equal(a.x,b.x,name);assert.equal(a.y,b.y,name)}if(['corner-blocked','multiple'].includes(name))assert(a.x!==b.x||a.y!==b.y,name);rows.push({name,A:{x:a.x,y:a.y,clearance:a.clearance},B:{x:b.x,y:b.y,clearance:b.clearance,exitScreen:b.exitScreen},changed:a.x!==b.x||a.y!==b.y});}
assert.equal(B.evidence({x:100,y:0,r:60},96,{visibleWalls:[332,332,332,332]},180,{x:0,y:0},[]).reason,'no-exit');
assert.equal(B([],96,null,180,{x:0,y:0},{x:1,y:0}).mapStatus,'lost');console.log(JSON.stringify({passed:true,scenarios:rows.length,rows,naturalGames:0},null,2));
