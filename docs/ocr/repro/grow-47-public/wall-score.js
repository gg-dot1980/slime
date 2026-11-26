// Grow47 applies Claude22's wall-only score to Grow46's existing trajectory.
// Distances are body-edge world units derived solely from the visible map.
function wallEvidence47(walls, r, mapOK) {
  if (!mapOK || !Array.isArray(walls) || walls.length !== 4 ||
      !walls.every(Number.isFinite) || !Number.isFinite(r) || r <= 0) return null;
  return {penalty:0,min:null,end:null,collided:false,samples:0};
}
function observeWall47(state, walls, r, x, y, k) {
  if (!state || state.collided || k > 15) return;
  const t=k*.1;
  const wd=Math.min(walls[0]+x,walls[1]-x,walls[2]+y,walls[3]-y)-r;
  state.samples++;
  state.min=state.min===null?wd:Math.min(state.min,wd);
  if (k===15) state.end=wd;
  if (wd<0) {state.penalty+=400;state.collided=true;}
  else if (wd<150) state.penalty+=(150-wd)*.6/(t+.3);
  // Claude22 stores the 1.5 s endpoint before the collision test. A collision
  // exactly at k=15 therefore retains this terminal cost; an earlier one does not.
  if (k===15 && wd<600) state.penalty+=(600-wd)*.04;
}
