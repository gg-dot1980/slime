// Grow46 tracks only an edible body which the previous applied decision selected.
function chaseEvidence46(old, bodies, meals, r, map, now, npcToast) {
  const player = map?.player;
  if (npcToast || !Number.isFinite(now) || !Number.isFinite(player?.x) || !Number.isFinite(player?.y) ||
      !(map.width > 0 && map.height > 0)) return null;
  const worldX = player.x / map.width * 10400, worldY = player.y / map.height * 7200;
  const dt = old ? (now-old.at)/1000 : NaN;
  const close = o => Math.hypot(o.x,o.y) <= .72*(r+o.r);
  const local = o => o?.npc && !o.mapOnly && !o.food && !o.isRed && !o.mapRed && !o.clipped && !o.blocked &&
    o.geometryAccepted === 1 && o.localReliable === true && o.edible === true;
  const stateFor = o => ({x:worldX+o.x,y:worldY+o.y,r:o.r,vx:o.vx,vy:o.vy,at:now,
    anchorAt:now,anchorDistance:Math.hypot(o.x,o.y),stagnant:0});
  let matched=null, next=null;
  if (old && dt>=0 && dt<=1.5) {
    const px = old.x+old.vx*dt, py = old.y+old.vy*dt;
    // At the measured native map resolution, one quantized marker pixel spans dozens of world units.
    const gate = Math.max(60,1.35*Math.max(10400/map.width,7200/map.height))+30*dt;
    const candidates = bodies.filter(o => Math.abs(o.r-old.r)<=Math.max(3,old.r*.08) &&
      Math.hypot(worldX+o.x-px,worldY+o.y-py)<=gate);
    if (candidates.length===1 && local(candidates[0]) && !close(candidates[0])) {
      const b = candidates[0];
      matched = meals.find(o=>o.npc && o.x===b.x && o.y===b.y && o.r===b.r);
      if (matched) {
        next = stateFor(matched);
        const distance=next.anchorDistance, age=now-old.anchorAt;
        if (old.anchorDistance-distance<=6 && age<=1500) {
          if (age>=600) next.stagnant=Math.min(2,old.stagnant+1);
          else Object.assign(next,{anchorAt:old.anchorAt,anchorDistance:old.anchorDistance,stagnant:old.stagnant});
        }
      }
    }
  }
  return {
    stalled:next?.stagnant===2?matched:null,
    remember(target, escaping) {
      if (escaping || !local(target) || close(target))return null;
      if (matched && target.x===matched.x && target.y===matched.y && target.r===matched.r)return next;
      return stateFor(target);
    },
    stagnant:next?.stagnant||0,
  };
}
