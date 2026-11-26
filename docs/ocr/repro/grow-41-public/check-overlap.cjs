'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const p=process.argv[2]||path.join(__dirname,'ocr-grow41.html');
const text=fs.readFileSync(p,'utf8'),start=text.indexOf('function resolveOverlap41('),end=text.indexOf('function planGrow23(',start);
const resolve=new Function(text.slice(start,end)+';return resolveOverlap41;')();
const M={player:{x:55,y:42},width:144,height:99.6923,growMarkers:[],threats:[]};
const prey={npc:true,x:-265,y:42,r:108,geometryAccepted:1,localReliable:true,labelSeen:true,clipped:false,isRed:false,blocked:false,vx:-25,vy:0};
const combined={npc:true,x:-95,y:15,r:260,geometryAccepted:0,localReliable:false,labelSeen:false,clipped:false,isRed:false,vx:0,vy:0};
const flight={x:-125,y:0};
const cases=[];
function test(name,fn){fn();cases.push(name);}
function confirmed(){let b;for(let k=0;k<3;k++){const o={...prey,x:prey.x+k*10};b=resolve([o],147,M,270,flight,{contact41:b?.contact},100+k*100);}return b.contact;}
const prev=confirmed(), query=(objs=[combined], prior=prev, now=400,m=M,hud=147)=>resolve(objs,hud,m,270,flight,{contact41:prior},now);
test('three stable fitted observations',()=>assert.equal(prev.count,3));
test('unique centroid-consistent unlabeled combined shape',()=>{const q=query();assert.equal(q.coasting,true);assert(q.objects[0].trackedBeforeOverlap);assert.equal(q.objects[0].labelSeen,false);assert.equal(q.objects[0].geometryAccepted,0);});
test('no target history',()=>assert.equal(query([combined],null).coasting,false));
test('one or two observations cannot authorize',()=>{for(const count of [1,2])assert.equal(query([combined],{...prev,count}).coasting,false);});
for(const [k,v] of Object.entries({clipped:true,labelSeen:true,isRed:true,localReliable:true,geometryAccepted:1})){
 test('preserve reported '+k,()=>assert.equal(query([{...combined,[k]:v}]).coasting,false));}
test('different centroid',()=>assert.equal(query([{...combined,x:20,y:120}]).coasting,false));
test('incompatible extent',()=>assert.equal(query([{...combined,r:150}]).coasting,false));
test('multiple apparent unions',()=>assert.equal(query([combined,{...combined,x:combined.x+3}]).coasting,false));
test('red at player',()=>assert.equal(query([combined],prev,400,{...M,threats:[{x:55.4,y:42.2}]}).coasting,false));
test('red at estimated prey',()=>assert.equal(query([combined],prev,400,{...M,growMarkers:[{x:50.4,y:42.2,red:true}]}).coasting,false));
test('second approaching clipped body',()=>assert.equal(query([combined,{...combined,x:18,y:70,r:162,clipped:true}]).coasting,false));
test('lost map',()=>assert.equal(query([combined],prev,400,{...M,player:null}).coasting,false));
test('missed scheduling window',()=>assert.equal(query([combined],prev,590).coasting,false));
test('expired visual identification',()=>assert.equal(query([combined],{...prev,seenAt:-700}).coasting,false));
test('elapsed time cannot rewind',()=>assert.equal(query([combined],prev,280).coasting,false));
test('HUD radius already grew',()=>assert.equal(query([combined],prev,400,M,151).coasting,false));
test('stop when expected contact already passed',()=>assert.equal(query([combined],{...prev,x:-60,y:0}).coasting,false));
test('unobserved normal body left intact',()=>{const q=query([{...combined,r:100}]);assert.equal(q.coasting,false);assert.equal(q.objects[0].r,100);});
test('visible reacquisition clears coasting',()=>assert.equal(query([{...prey,x:-236}]).coasting,false));
test('unrelated new reliable target starts a new confirmation',()=>assert.equal(query([{...prey,x:128,y:40}]).contact.count,1));
test('nonedible target never seeds a latch',()=>assert.equal(query([{...prey,r:135}],null).contact,null));
test('current bigger body vetoes new identification',()=>assert.equal(query([prey,{...combined,isRed:true}],null).contact,null));
test('projection bounded beyond consecutive coast decisions',()=>{let c=prev;let n=0;for(let t=400;t<=1400;t+=85){const q=query([combined],c,t);if(!q.coasting)break;c=q.contact;n++;}assert(n>0&&n<=11);});
console.log(JSON.stringify({cases,passed:cases.length,nativeGames:0},null,2));
