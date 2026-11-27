// A newly observed dot is only a scouting hint. Occlusion, fusion and edge
// appearances can look like births, so retain older tracks before promoting it.
function trackFreshDots40(map, previous, r, now) {
  if(!map?.player) return [];
  const scale=10400/map.width, input=[];
  for(const m of [...(map.growMarkers||[]),...(map.threats||[]).map(o=>({...o,red:true})),...(map.opportunities||[]).map(o=>({...o,red:false}))]){
    if(!Number.isFinite(m.x)||!Number.isFinite(m.y)||input.some(a=>Math.hypot(a.x-m.x,a.y-m.y)<2.1))continue;
    input.push(m);
  }
  const old=(previous||[]).filter(a=>now-a.last<1750),assigned=new Set(),tracks=[];
  for(const m of input){
    let hit=null,score=Infinity;
    for(const a of old){
      if(assigned.has(a))continue;
      const dt=(now-a.last)/1000,dist=Math.hypot(a.x+a.vx*dt-m.x,a.y+a.vy*dt-m.y);
      const cost=dist+(a.red===m.red?0:.4);
      if(dist<=1.65+Math.min(2.0,dt*1.3)&&cost<score){hit=a;score=cost;}
    }
    if(hit)assigned.add(hit);
    const dx=(m.x-map.player.x)*scale,dy=(m.y-map.player.y)*scale,d=Math.hypot(dx,dy);
    const outside=Math.abs(dx)>(map.viewWidth||958)/2+125||Math.abs(dy)>(map.viewHeight||557)/2+125;
    const clean=old.length>=7&&Math.min(m.x,map.width-m.x,m.y,map.height-m.y)>3.5&&outside&&d>620&&d<2160
      && !old.some(a=>Math.hypot(a.x-m.x,a.y-m.y)<3.8);
    const dt=hit?Math.max(.05,(now-hit.last)/1000):1;
    tracks.push({x:m.x,y:m.y,red:!!m.red,last:now,first:hit?.first??now,seen:(hit?.seen??0)+1,
      vx:hit?hit.vx*.82+.18*(m.x-hit.x)/dt:0,vy:hit?hit.vy*.82+.18*(m.y-hit.y)/dt:0,
      fresh:hit?hit.fresh&&!m.red:!m.red&&clean,spawnR:hit?.spawnR??r});
  }
  return tracks.concat(old.filter(a=>!assigned.has(a))).slice(0,80);
}
