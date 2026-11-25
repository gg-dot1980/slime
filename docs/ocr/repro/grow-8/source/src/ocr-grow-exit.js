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
function planGrow(objects,r,map,speed,v,old){
 const baseline=planGrowBase(objects,r,map,speed,v,old);
 if(baseline.mapStatus==='lost')return baseline;
 const mapped=growMapInputs(objects,r,map),threats=mapped.objects.filter(o=>o.npc&&!o.mapVerified),targets=mapped.targets;
 const checks=targets.map(t=>({target:t,...growExitEvidence(t,r,map,speed,v,threats)}));
 const blocked=checks.filter(c=>c.state==='blocked');
 if(!blocked.length)return {...baseline,exitScreen:{changed:false,pass:checks.filter(c=>c.state==='pass').length,unknown:checks.filter(c=>c.state==='unknown').length,blocked:0}};
 const point=m=>({x:(m.x-map.player.x)/map.width*10400,y:(m.y-map.player.y)/map.height*7200});
 const filtered={...map,growMarkers:map.growMarkers.filter(m=>m.red||!blocked.some(c=>{const p=point(m);return Math.hypot(p.x-c.target.x,p.y-c.target.y)<.001;}))};
 const alternative=planGrowBase(objects,r,filtered,speed,v,old);
 // Do not replace emergency avoidance with a worse/unknown retreat.
 const use=alternative.wallOK&&alternative.clearance>3&&alternative.clearance>=Math.min(3,baseline.clearance);
 return {...(use?alternative:baseline),exitScreen:{changed:use&&(alternative.x!==baseline.x||alternative.y!==baseline.y),pass:checks.filter(c=>c.state==='pass').length,unknown:checks.filter(c=>c.state==='unknown').length,blocked:blocked.length,fallback:!use?'original-emergency':alternative.target?'remaining-target':'original-no-target-planner'}};
}
