function planGrow(objects,r,map,speed,v,old){
 const mapped=growMapInputs(objects,r,map);objects=mapped.objects;
 if(mapped.mapStatus==='lost')return {x:0,y:0,name:'小地圖遺失，釋放控制',clearance:0,gain:0,threats:0,escaping:false,strategy:'grow-7',mapStatus:'lost',reason:'missing-map'};
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
 let approach=0;for(const o of mapped.targets){const before=Math.hypot(o.x,o.y),after=Math.hypot(o.x-x,o.y-y),value=(before-after)/Math.max(200,before);if(value>approach){approach=value;if(!target)target={...o,utility:0,pursuitOnly:true};}}
 return {...d,clearance,risk,gain,npcUtility,target,eta,wallOK,recovering:!!walls?.some(w=>Number.isFinite(w)&&w<margin),score:approach*80-nearApproach*80+npcUtility*12+gain*2-risk*12+(d.x*old.x+d.y*old.y)*.15};});
 const bounded=candidates.filter(d=>d.wallOK),safe=bounded.filter(d=>d.clearance>3),pool=safe.length?safe:bounded.length?bounded:candidates;
 pool.sort((a,b)=>safe.length?b.score-a.score:b.clearance-a.clearance||b.score-a.score);return {...pool[0],escaping:!safe.length,threats:threats.length,strategy:r>=90?'grow-7':'grow-1',...(r>=90?{mapStatus:mapped.mapStatus,eligibleDots:mapped.targets.length,nearWhite:mapped.nearWhite||0,reason:pool[0].recovering?'wall':mapped.nearWhite?'near-white':threats.length?'red-path':mapped.targets.length?'white-pursuit':'no-eligible-dot'}:{}),wallKnown:!!walls?.some(Number.isFinite)};
}
