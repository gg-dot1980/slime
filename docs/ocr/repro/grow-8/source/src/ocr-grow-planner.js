function planGrowBase(objects,r,map,speed,v,old){
 const mapped=growMapInputs(objects,r,map);objects=mapped.objects;
 if(mapped.mapStatus==='lost')return {x:0,y:0,name:'小地圖遺失，釋放控制',clearance:0,gain:0,threats:0,escaping:false,strategy:'grow-8',mapStatus:'lost',reason:'missing-map'};
 const walls=map?.visibleWalls||null, margin=260+.75*r;
 const edible=o=>o.npc&&(o.mapVerified||!o.clipped&&!o.blocked&&!o.isRed)&&Number.isFinite(o.r)&&o.r>0&&(o.mapVerified||o.r<r*.85)&&Number.isFinite(o.vx)&&Number.isFinite(o.vy);
 const threats=objects.filter(o=>o.npc&&!o.mapVerified&&(o.clipped||o.isRed||!Number.isFinite(o.r)||o.r>=r*.94));
 const candidates=dirs.map(d=>{let x=0,y=0,vx=v.x,vy=v.y,clearance=1e6,risk=0,gain=0,npcUtility=0,target=null,eta=null,wallOK=true;const picked=new Set();
 for(let k=1;k<=20;k++){const t=k*.1;vx+=(d.x*speed-vx)*.35;vy+=(d.y*speed-vy)*.35;x+=vx*.1;y+=vy*.1;
 if(walls)walls.forEach((w,i)=>{if(Number.isFinite(w)&&w+[x,-x,y,-y][i]<Math.min(w,margin)-1)wallOK=false;});
 for(const o of threats){const body=o.clipped?Math.max(o.dangerRadius||0,o.r||r)+0:o.isRed?Math.max(o.r||0,r*1.1):Number.isFinite(o.r)?o.r:r*1.5;const gap=Math.hypot(o.x+(o.vx||0)*t-x,o.y+(o.vy||0)*t-y)-.75*(r+body)-12;clearance=Math.min(clearance,gap);risk+=Math.max(0,1-gap/100)**2/20;}
 for(const o of objects){if(o.mapOnly||picked.has(o)||!o.mapVerified&&(o.clipped||o.blocked)||o.npc&&!edible(o))continue;const contact=o.npc?.7*(r+o.r):r+o.r*.5;if(Math.hypot(o.x+(o.vx||0)*t-x,o.y+(o.vy||0)*t-y)<contact){picked.add(o);const g=o.npc?.75*(Math.sqrt(r*r+.55*o.r*o.r)-r):.45;gain+=g/(t+.35);if(o.npc){const utility=g/(t+.35);npcUtility+=utility;if(!target||utility>target.utility){target={...o,utility};eta=t;}}}}
 }
 let nearApproach=0;for(const o of threats.filter(o=>o.nearWhite)){const before=Math.hypot(o.x,o.y),after=Math.hypot(o.x-x,o.y-y);nearApproach+=Math.max(0,before-after)/Math.max(200,before);}
 let approach=0;for(const o of mapped.targets){const before=Math.hypot(o.x,o.y),after=Math.hypot(o.x-x,o.y-y),value=(before-after)/Math.max(200,before);if(value>approach){approach=value;target={...o,utility:0,pursuitOnly:true};}}
 return {...d,clearance,risk,gain,npcUtility,target,eta,wallOK,recovering:!!walls?.some(w=>Number.isFinite(w)&&w<margin),score:approach*80-nearApproach*80+npcUtility*12+gain*2-risk*12+(d.x*old.x+d.y*old.y)*.15};});
 const bounded=candidates.filter(d=>d.wallOK),safe=bounded.filter(d=>d.clearance>3),pool=safe.length?safe:bounded.length?bounded:candidates;
 pool.sort((a,b)=>safe.length?b.score-a.score:b.clearance-a.clearance||b.score-a.score);return {...pool[0],escaping:!safe.length,threats:threats.length,strategy:'grow-8',...({mapStatus:mapped.mapStatus,eligibleDots:mapped.targets.length,nearWhite:mapped.nearWhite||0,reason:pool[0].recovering?'wall':mapped.nearWhite?'near-white':threats.length?'red-path':mapped.targets.length?'white-pursuit':'no-eligible-dot'}),wallKnown:!!walls?.some(Number.isFinite)};
}

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
