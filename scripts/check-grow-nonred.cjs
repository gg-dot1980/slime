const fs=require('fs'),vm=require('vm'),assert=require('assert');
const h=fs.readFileSync('src/ocr-grow.html','utf8'),helpers=fs.readFileSync('src/ocr-grow-minimap.js','utf8'),planner=fs.readFileSync('src/ocr-grow-planner.js','utf8'),dirs=h.slice(h.indexOf('const dirs='),h.indexOf('function planBaseline('));
const obj={x:350,y:0,r:98,npc:true,isRed:true,clipped:true,blocked:true,dangerRadius:160,vx:0,vy:0},map={width:144,height:144*7200/10400,player:{x:60,y:50},growMarkers:[{x:60+350/10400*144,y:50,red:false}]};
const c={};vm.createContext(c);vm.runInContext(dirs+helpers+planner+';this.plan=planGrow;',c);let checks=0;function test(n,f){f();checks++}
for(const r of [89,90,91])test('lethal fixture '+r,()=>{const d=c.plan([obj],r,map,180,{x:0,y:0},{x:-1,y:0});if(r<90){assert(!d.target);assert(d.threats>0)}else{assert(d.target?.mapVerified);assert.equal(d.threats,0);assert(!d.escaping);assert(d.x>.99);assert(d.gain>0);assert(d.eta<=2)}});
test('red overlap ambiguous',()=>{const d=c.plan([obj],90,{...map,growMarkers:[...map.growMarkers,{...map.growMarkers[0],red:true}]},180,{x:0,y:0},{x:1,y:0});assert(!d.target);assert(d.threats>0)});
test('no observation remains hazard',()=>{const d=c.plan([obj],90,{...map,growMarkers:[]},180,{x:0,y:0},{x:1,y:0});assert(!d.target);assert(d.threats>0)});
test('separate red path detours',()=>{const d=c.plan([obj],90,{...map,growMarkers:[...map.growMarkers,{x:60+160/10400*144,y:50,red:true}]},180,{x:0,y:0},{x:1,y:0});assert(d.threats>0);assert(d.x<.99)});
test('wall retained',()=>{const d=c.plan([obj],90,{...map,visibleWalls:[null,70,null,null]},180,{x:0,y:0},{x:1,y:0});assert(d.wallOK);assert(d.x<=.01)});
test('full default B tick sends contact heading without evasive shunt',()=>{
 const nodes={strategy:{value:'grow-4'},size:{textContent:'90'},mix:{textContent:''},time:{textContent:'03:00'}};let sent=[],chosen;
 const doc={querySelector:s=>s==='canvas'?{}:null,getElementById:id=>nodes[id]};
 const q={active:true,epoch:1,game:{contentDocument:doc},performance:{now:()=>100},buttons:()=>[],last:0,held:new Set(),heading:{x:-1,y:0},velocity:{x:0,y:0},runStrategy:'grow-4',readImage:()=>({objects:[{...obj}],map,velocity:{x:0,y:0}}),hudSpeed:()=>180,timing:{decision:d=>chosen=d},showVision(){},window:{},setTimeout(){},key:(type,k)=>sent.push([type,k]),$:id=>nodes[id]??={},previous:[],stop(){throw Error('unexpected stop')},finish(){throw Error('unexpected finish')}};
 vm.createContext(q);vm.runInContext(dirs+helpers+planner+h.slice(h.indexOf('function release()'),h.indexOf('const visible='))+h.slice(h.indexOf('function tick('),h.indexOf('let lastMap=null;'))+';tick(1);',q);
 assert(chosen.target.mapVerified);assert.equal(chosen.threats,0);assert(!chosen.escaping);assert(sent.some(x=>x[0]==='keydown'&&x[1]==='ArrowRight'));assert(!sent.some(x=>x[1]==='ArrowLeft'));assert(h.includes('<option value="grow-4">B'));
});
// The game can kill this fixture: 98 >= 90*1.08, yet the minimap is non-red: 98 <=90*1.12.
test('risk semantics explicit',()=>{assert(98>=90*1.08);assert(98<=90*1.12)});
console.log(JSON.stringify({checks,passed:true,typedFixture:{player:90,npc:98,nonRed:true,canKill:true},actualGameplay:false,newGames:0}));
