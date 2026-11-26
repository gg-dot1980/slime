// Used only after the v2.22 immunity threshold when the parent has no chosen goal.
function forageFinish43(foods,map,r,speed,prior) {
  if (!map?.player || !(map.width>0) || !(map.height>0) || !Number.isFinite(map.observedAt)) return null;
  const now=map.observedAt, W=10400, H=7200, px=map.player.x*W/map.width, py=map.player.y*H/map.height;
  const distance=Math.hypot, gap=Math.max(0,200-r);
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const old=prior && now>=prior.at && now-prior.at<=1500 ? prior : null;
  const bans=(old?.bans||[]).filter(b=>b.until>now);
  const current=old?.active;
  const choices=[];
  function consider(kind,x,y,utility,detail){
    const wx=clamp(px+x,r+18,W-r-18),wy=clamp(py+y,r+18,H-r-18);
    const dx=wx-px,dy=wy-py,d=distance(dx,dy);
    if(d<22 || bans.some(b=>b.kind===kind&&distance(b.x-wx,b.y-wy)<(kind==='food'?95:340)))return;
    const same=current?.kind===kind && distance(current.x-wx,current.y-wy)<(kind==='food'?75:235);
    const since=(!same||r>current.radius)?now:current.since;
    const best=(!same||r>current.radius)?d:current.best;
    const advanced=d<best-70;
    const progress=(!same||advanced||r>current.radius)?now:current.progress;
    if(same && (now-progress>1500 || now-since>(kind==='food'?2200:6500) ||
        kind==='group'&&d<r+55&&now-since>500)){
      bans.push({kind,x:wx,y:wy,until:now+6500});
      return;
    }
    choices.push({kind,x:dx,y:dy,wx,wy,utility:utility*(same?1.22:1),detail,
      active:{kind,x:wx,y:wy,since,best:advanced?d:best,progress,radius:r}});
  }
  // Food lies on the arena floor. Clamp the player's destination and check that
  // its reachable centre intersects the separate food pickup radius.
  const visible=foods.filter(f=>f.r>=4&&f.r<=18);
  for(const f of visible){
    const u=clamp(px+f.x,r+18,W-r-18)-px,v=clamp(py+f.y,r+18,H-r-18)-py;
    const length=distance(u,v);
    if(!length||distance(u-f.x,v-f.y)>r+.45*f.r)continue;
    let foodGain=0,count=0;
    for(const q of visible){
      const t=clamp((q.x*u+q.y*v)/(length*length),0,1);
      if(distance(q.x-u*t,q.y-v*t)<r+.45*q.r){foodGain+=Math.max(.38,Math.min(13,q.r)*.035);count++;}
    }
    const eta=Math.max(.18,(length-r*.70)/speed);
    const value=Math.min(gap,foodGain);
    const utility=(gap<=foodGain+.45?8:2.4)*value/(eta+.45);
    consider('food',u,v,utility,{visibleFood:count,estimatedFoodGain:value});
  }
  // White markers are conservative search waypoints. A saturated mark on its
  // own has no upper size bound. Require two spatially distinct visible marks.
  const dots=[];
  for(const m of [...(map.dots39||[]),...(map.growMarkers||[])]){
    if(m.red||!Number.isFinite(m.x)||!Number.isFinite(m.y)||!(m.area>=2&&m.area<=36))continue;
    const x=(m.x-map.player.x)*W/map.width,y=(m.y-map.player.y)*H/map.height;
    const d=distance(x,y);
    if(d<r+100||d>speed*8||dots.some(q=>distance(x-q.x,y-q.y)<145))continue;
    dots.push({x,y});
    if(dots.length===40)break;
  }
  for(let i=0;i<dots.length;i++){
    const a=dots[i];
    const group=dots.filter(b=>{const separation=distance(a.x-b.x,a.y-b.y);return separation>=240&&separation<=900;});
    if(!group.length)continue;
    const b=group.reduce((best,q)=>distance(q.x,q.y)<distance(best.x,best.y)?q:best);
    const u=(a.x+b.x)/2,v=(a.y+b.y)/2,d=distance(u,v);
    if(d<r+60)continue;
    const interior=Math.min(px+u,W-px-u,py+v,H-py-v);
    const utility=(3+Math.min(3,group.length)*.55)*(1+.35*clamp((interior-r)/650,0,1))/(d/speed+.55);
    consider('group',u,v,utility,{visibleWhiteMembers:group.length+1,estimatedFoodGain:0});
  }
  const valid=choices.filter(c=>!bans.some(b=>b.kind===c.kind&&distance(b.x-c.wx,b.y-c.wy)<(c.kind==='food'?95:340)));
  valid.sort((a,b)=>b.utility-a.utility);
  const win=valid[0];
  const memory={at:now,bans:bans.slice(-8),active:win?.active||null};
  if(!win)return {memory,target:null};
  return {memory,target:{x:win.x,y:win.y,r:0,npc:false,vx:0,vy:0,mapOnly:win.kind==='group',
    finish43Kind:win.kind,...win.detail,utility:clamp(win.utility*3,2,10)}};
}
