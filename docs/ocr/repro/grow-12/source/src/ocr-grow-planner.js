// Visible-map-only target screen. A contact is hypothetical, never a claimed eat.
function growExitEvidence(target,r,map,speed,v,threats){
 const walls=map?.visibleWalls||[null,null,null,null],complete=walls.length===4&&walls.every(Number.isFinite);
 const margin=260+.75*r,contact=.7*(r+target.r);let reached=false,attempted=false;
 function legal(s,t){
  if(walls.some((w,i)=>Number.isFinite(w)&&w+[s.x,-s.x,s.y,-s.y][i]<Math.min(w,margin)-1))return false;
  return threats.every(o=>Math.hypot(o.x+(o.vx||0)*t-s.x,o.y+(o.vy||0)*t-s.y)-.75*(r+Math.max(o.r||0,r*1.1))-12>3);
 }
 function step(s,d){const vx=s.vx+(d.x*speed-s.vx)*.35,vy=s.vy+(d.y*speed-s.vy)*.35;return {x:s.x+vx*.1,y:s.y+vy*.1,vx,vy};}
 for(const d of dirs){let geometric={x:0,y:0,vx:v.x,vy:v.y},inRange=false;for(let k=0;k<=40;k++){if(Math.hypot(target.x-geometric.x,target.y-geometric.y)<=contact){inRange=true;break;}geometric=step(geometric,d);}if(!inRange)continue;attempted=true;let s={x:0,y:0,vx:v.x,vy:v.y};
  for(let k=0;k<=40;k++){
   if(!legal(s,k*.1))break;
   if(Math.hypot(target.x-s.x,target.y-s.y)<=contact){
    reached=true;const startDistance=Math.hypot(target.x-s.x,target.y-s.y);
    for(const exit of dirs){let end={...s},ok=true;
     for(let j=1;j<=10;j++){end=step(end,exit);if(!legal(end,(k+j)*.1)){ok=false;break;}}
     if(ok&&Math.hypot(end.x-target.x,end.y-target.y)>=startDistance+r*.5)return {state:complete?'pass':'unknown',reason:complete?'bounded-exit':'partial-walls',contactAt:k*.1,exit:{x:exit.x,y:exit.y}};
    }break;
   }s=step(s,d);
  }
 }
 if(!attempted)return {state:'unknown',reason:'beyond-fixed-horizon'};
 return {state:'blocked',reason:reached?'no-exit':'no-bounded-approach'};
}
function growLocalThreats(objects,r,speed){
 const reliable=objects.filter(o=>o.npc&&!o.clipped&&!o.blocked&&o.localReliable===true&&Number.isFinite(o.r)&&o.r>0&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&(o.isRed||o.r>=r*1.08));
 // Coincident aliases cannot establish independent solid boundaries.
 return reliable.filter(o=>!reliable.some(q=>q!==o&&Math.hypot(q.x-o.x,q.y-o.y)<Math.min(q.r,o.r)*.5)&&Math.hypot(o.x,o.y)<r+o.r+speed*1.1+50);
}
// Short visible-only escape fan; unknown walls are not claimed clear.
function growEscapeFan(state,r,walls,speed,reds){
 const margin=260+.75*r,allowed=[];
 for(const d of dirs){let {x,y,vx,vy}=state,ok=true,minGap=1e6;
  for(let j=1;j<=15;j++){vx+=(d.x*speed-vx)*.35;vy+=(d.y*speed-vy)*.35;x+=vx*.1;y+=vy*.1;
   if(walls.some((w,i)=>Number.isFinite(w)&&w+[x,-x,y,-y][i]<Math.min(w,margin)-1)){ok=false;break;}
   const gap=reds.reduce((g,o)=>Math.min(g,Math.hypot(o.x-x,o.y-y)-.75*(r+Math.max(o.r,r*1.1))-12),1e6);
   minGap=Math.min(minGap,gap);if(gap<=20){ok=false;break;}
  }allowed.push(ok);
 }
 let arc=0;for(let i=0;i<8;i++){let n=0;while(n<8&&allowed[(i+n)%8])n++;arc=Math.max(arc,n);}
 return {count:allowed.filter(Boolean).length,arc,wallKnown:walls.filter(Number.isFinite).length};
}
function planGrow(objects,r,map,speed,v,old){
 if(r<90)return {...planBaseline(objects,r,map,speed,v,old),strategy:'grow-12',reason:'below-90-baseline'};
 if(map?.stale||Number.isFinite(map?.observedAt)&&performance.now()-map.observedAt>400)map=null;
 const mapped=growMapInputs(objects,r,map);
 mapped.targets=mapped.targets.filter(t=>t.sizeUpper>0&&t.sizeUpper<r*.9);
 if(mapped.mapStatus==='lost')return {x:0,y:0,name:'小地圖遺失，釋放控制',clearance:0,gain:0,threats:0,escaping:false,strategy:'grow-12',mapStatus:'lost',reason:'missing-map'};
 const walls=map?.visibleWalls||[],margin=260+.75*r;
 const checks=mapped.targets.map(t=>({target:t,...growExitEvidence(t,r,map,speed,v,[])}));
 const available=checks.filter(c=>c.state!=='blocked');
 const poolTargets=(available.length?available:checks).map(c=>c.target);
 const mapHazards=mapped.objects.filter(o=>o.npc&&!o.mapVerified);
 // Minimap red/near-size only rank destinations, never local escape directions.
 const ranked=poolTargets.map(t=>{const distance=Math.hypot(t.x,t.y),pressure=mapHazards.reduce((p,o)=>p+Math.max(0,1-Math.hypot(t.x-o.x,t.y-o.y)/Math.max(1,r+o.r+100)),0);return {t,value:1/(distance/Math.max(1,speed)+.35)/(1+pressure)};}).sort((a,b)=>b.value-a.value||a.t.x-b.t.x||a.t.y-b.t.y);
 const food=objects.filter(o=>!o.npc&&!o.clipped&&!o.blocked&&o.r>0&&o.r<=6&&Number.isFinite(o.x)&&Number.isFinite(o.y)).sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y))[0];
 const npcTarget=ranked[0]?.t||null;
 const target=npcTarget&&(!food||Math.hypot(npcTarget.x,npcTarget.y)/Math.max(1,speed)<=8)?npcTarget:food||npcTarget,tx=target?target.x:old.x,ty=target?target.y:old.y,length=Math.max(1,Math.hypot(tx,ty));
 const guide=[...dirs].sort((a,b)=>(b.x*tx+b.y*ty)-(a.x*tx+a.y*ty))[0];
 const correspondingRed=mapped.objects.filter(o=>o.npc&&!o.mapVerified&&!o.nearWhite).some(o=>{const along=o.x*guide.x+o.y*guide.y,cross=Math.abs(o.x*guide.y-o.y*guide.x);return along>0&&cross<=along*Math.tan(Math.PI/6)+10400/map.width*(map.pixelRatio||1);});
 const redThreats=mapped.objects.filter(o=>o.npc&&!o.mapVerified&&!o.nearWhite);
 const threats=[...redThreats,...(correspondingRed?growLocalThreats(objects,r,speed):[])];
 const startGap=threats.reduce((g,o)=>Math.min(g,Math.hypot(o.x,o.y)-.75*(r+Math.max(o.r,r*1.1))-12),1e6);
 const candidates=dirs.map(d=>{let x=0,y=0,vx=v.x,vy=v.y,gap=1e6,wallOK=true,endGap=1e6;
  for(let k=1;k<=10;k++){vx+=(d.x*speed-vx)*.35;vy+=(d.y*speed-vy)*.35;x+=vx*.1;y+=vy*.1;
   if(walls.some((w,i)=>Number.isFinite(w)&&w+[x,-x,y,-y][i]<Math.min(w,margin)-1))wallOK=false;
   endGap=threats.reduce((g,o)=>Math.min(g,Math.hypot(o.x+(o.vx||0)*k*.1-x,o.y+(o.vy||0)*k*.1-y)-.75*(r+Math.max(o.r,r*1.1))-12),1e6);gap=Math.min(gap,endGap);
  }const redSafe=redThreats.every(o=>Math.hypot(o.x,o.y)>r+o.r+speed*2||Math.hypot(o.x-x,o.y-y)>=Math.hypot(o.x,o.y)-1);return {...d,escape:growEscapeFan({x,y,vx,vy},r,walls,speed,redThreats),wallEnd:walls.map((w,i)=>Number.isFinite(w)?w+[x,-x,y,-y][i]:null),clearance:gap,endGap,wallOK,redSafe,alignment:(d.x*tx+d.y*ty)/length};
 });
 const direct=candidates.find(d=>d.name===guide.name),safe=candidates.filter(d=>d.wallOK&&d.redSafe&&d.clearance>3);
 let selected,mode='map-guide';
 const threshold=old.mode==='local-avoid'?20:3;
 if(direct.wallOK&&direct.redSafe&&direct.clearance>threshold)selected=direct;
 else if(safe.length){
  safe.sort((a,b)=>Math.round(b.alignment*1000)-Math.round(a.alignment*1000)||b.clearance-a.clearance||(b.x*old.x+b.y*old.y)-(a.x*old.x+a.y*old.y));selected=safe[0];mode='local-avoid';
  // Keep the prior safe adjacent turn within one octant, not a locked target.
  const prior=safe.find(d=>d.x*old.x+d.y*old.y>.99);
  if(old.mode==='local-avoid'&&prior&&selected.alignment-prior.alignment<.3)selected=prior;
 }else{const bounded=candidates.filter(d=>d.wallOK);selected=[...(bounded.length?bounded:candidates)].sort((a,b)=>b.endGap-a.endGap||b.clearance-a.clearance||b.alignment-a.alignment)[0];mode='emergency';}
 // Only bias already feasible directions. Never trade immediate red/wall safety for exit count.
 const nearX=[0,1].filter(i=>Number.isFinite(walls[i])&&walls[i]<margin+speed*2),nearY=[2,3].filter(i=>Number.isFinite(walls[i])&&walls[i]<margin+speed*2);
 const corner=nearX.length>0&&nearY.length>0,nearReds=redThreats.filter(o=>Math.hypot(o.x,o.y)<r+o.r+speed*4);
 if(safe.length&&(corner||nearReds.length>=2)){
  const cornerRoom=d=>corner?Math.min(...[...nearX,...nearY].map(i=>d.wallEnd[i])):0;
  const quality=d=>d.escape.arc*2+d.escape.count+Math.min(3,cornerRoom(d)/Math.max(1,speed));
  const best=[...safe].sort((a,b)=>quality(b)-quality(a)||b.alignment-a.alignment)[0];
  // A full octant of extra escape coverage or a substantial inward corner step.
  if(best!==selected&&(best.escape.arc>=selected.escape.arc+1||corner&&cornerRoom(best)>cornerRoom(selected)+speed*.35)&&quality(best)>quality(selected)+1){selected=best;mode='escape-route';}
 }
 return {...selected,target,gain:0,threats:threats.length,escaping:mode==='emergency',recovering:!direct.wallOK,strategy:'grow-12',mapStatus:'visible',mode,correspondingRed,reason:mode==='escape-route'?'preserve-exit':mode==='map-guide'?(target?(target.npc?'white-guidance':'food-fallback'):'no-eligible-dot'):!direct.wallOK?'wall':(redThreats.length?'red-map-threat':'main-view-threat'),guide:{x:guide.x,y:guide.y},nearWhite:mapped.nearWhite||0,eligibleDots:mapped.targets.length,exitScreen:{pass:checks.filter(c=>c.state==='pass').length,unknown:checks.filter(c=>c.state==='unknown').length,blocked:checks.filter(c=>c.state==='blocked').length},startGap};
}
