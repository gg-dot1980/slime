const fs=require('fs'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const h=fs.readFileSync('src/ocr-grow.html','utf8'),helper=fs.readFileSync('src/ocr-grow-minimap.js','utf8'),planner=fs.readFileSync('src/ocr-grow-planner.js','utf8');assert(h.includes(helper));assert(h.includes(planner));
const c={};vm.createContext(c);vm.runInContext('const dirs=Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4),name:String(i)}));'+helper+planner+';this.api={growMarkers,growMapInputs,planGrow}',c);let checks=0;const test=(name,f)=>{f();checks++};
const object=(x=722,r=105,extra={})=>({x,y:0,r,npc:true,isRed:false,clipped:false,blocked:false,vx:0,vy:0,...extra});
const map={x:641,y:70,width:144,height:144*7200/10400,pixelRatio:1,player:{x:60,y:50},growMarkers:[{x:70,y:50,red:false}]};
const run=(r,m=map,x=[object()])=>c.api.planGrow(x,r,m,180,{x:0,y:0},{x:-1,y:0});
for(const r of [89,90,91])test('size '+r,()=>{const d=run(r);assert.equal(!!d.target,r>=90);if(r>=90){assert(d.x>.5);assert.equal(d.threats,0)}else assert(d.threats>0)});
test('positive red never pursued',()=>{const d=run(90,{...map,growMarkers:[{x:70,y:50,red:true}]});assert(!d.target);assert(d.threats>0)});
for(const [name,x,m]of [['no marker',[object()],{...map,growMarkers:[]}],['ambiguous',[object(710),object(740)],map]])test(name,()=>assert(!run(90,m,x).target));
test('close wall still blocks approach',()=>{const d=run(90,{...map,visibleWalls:[null,80,null,null]});assert(d.wallOK);assert(d.x<=.01)});
test('confirmed red path blocks pursuit',()=>{const d=run(90,{...map,growMarkers:[{x:70,y:50,red:false},{x:65,y:50,red:true}]});assert(d.x<.99);assert(d.clearance>3)});
test('no safe route retains escape',()=>assert(run(90,map,[object(0,900,{isRed:true})]).escaping));
// Source rendering contract, not saved game pixels. Execute each version's exact minimap draw segment with fixed test actors.
const versions=['v2.13','v2.20','v2.21','v2.22'];
for(const version of versions)test('render contract '+version,()=>{
 const src=fs.readFileSync(version==='v2.22'?'src/game.html':'src/game-'+version+'.html','utf8'),segment=src.slice(src.indexOf('const miniPad='),src.indexOf('// Draw the exact visible camera rectangle'));
 const image={data:new Uint8ClampedArray(800*600*4)},ctx={fillStyle:'',beginPath(){},roundRect(){},stroke(){},strokeRect(){},arc(x,y,r){this.circle={x,y,r}},fillRect(x,y,w,h){this.rect={x,y,w,h};this.circle=null;this.paint()},fill(){this.paint()},paint(){let color=this.fillStyle;if(!/^#[0-9a-f]{6}$/.test(color))return;const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));const box=this.circle?{x:this.circle.x-this.circle.r,y:this.circle.y-this.circle.r,w:this.circle.r*2,h:this.circle.r*2}:this.rect;if(!box)return;for(let y=Math.floor(box.y);y<box.y+box.h;y++)for(let x=Math.floor(box.x);x<box.x+box.w;x++){if(x<0||y<0||x>=800||y>=600||this.circle&&Math.hypot(x+.5-this.circle.x,y+.5-this.circle.y)>this.circle.r)continue;image.data.set([...rgb,255],(y*800+x)*4)}}};
 vm.runInNewContext(segment,{ctx,vw:800,W:10400,H:7200,player:{r:90},slimes:[{x:70/144*10400,y:50/map.height*7200,r:100},{x:100/144*10400,y:50/map.height*7200,r:110}]});
 let result=c.api.growMarkers(image,800,600,map);assert.equal(result.length,2);assert.equal(result.filter(x=>x.red).length,1);
 // Player green and food-color disks are not NPC evidence; mixed/cropped cores rejected.
 ctx.fillStyle='#a3f3d1';ctx.arc(661,100,3);ctx.fill();ctx.fillStyle='#f2545b';ctx.arc(681,100,3);ctx.fill();assert.equal(c.api.growMarkers(image,800,600,map).length,2);
 ctx.fillStyle='#a3f3d1';ctx.arc(711,120,2);ctx.fill();assert.equal(c.api.growMarkers(image,800,600,map).filter(x=>!x.red).length,0);
});
const old=cp.execFileSync('git',['show','3cca7d0c1925edaf3edce758274c911b48097075:src/ocr-grow.html'],{encoding:'utf8',maxBuffer:1e6});
test('A byte identical',()=>assert.equal(h.slice(h.indexOf('function planBaseline('),h.indexOf('// grow-3:')).trim(),old.slice(old.indexOf('function planBaseline('),old.indexOf('function planGrow(')).trim().replace(/\/\/ grow-3[\s\S]*/,'')));
const legacy={};vm.createContext(legacy);vm.runInContext('const dirs=Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4),name:String(i)}));'+cp.execFileSync('git',['show','3cca7d0c1925edaf3edce758274c911b48097075:src/ocr-grow-planner.js'],{encoding:'utf8'})+';this.plan=planGrow',legacy);
test('under90 outputs unchanged',()=>{for(const r of [25,50,89])for(const x of [-600,-150,150,600]){const a=[object(x,35),object(-x,120)],args=[a,r,map,180,{x:20,y:-5},{x:1,y:0}];assert.equal(JSON.stringify(c.api.planGrow(...args)),JSON.stringify(legacy.plan(...args)))}});
console.log(JSON.stringify({checks,passed:true,renderedSourceVersions:versions,rendering:'deterministic non-antialiased source-command raster, not browser gameplay',newGames:0}));
