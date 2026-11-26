'use strict';

/* Grow27: rendered green camera frame and player disk, no live game state.
 * Return null whenever the complete visible shape is not sufficiently supported.
 * Pixel tolerances are finite empirical raster tolerances, not error guarantees.
 */
function locateMinimapPlayer27(green, W, H, q, mapWidth, mapHeight, viewWidth, viewHeight) {
  const finite = Number.isFinite;
  if (!(green instanceof Uint8Array) || ![W,H,q,mapWidth,mapHeight,viewWidth,viewHeight].every(finite) ||
      W < 40 || H < 25 || W > 300 || H > 220 || green.length !== W*H ||
      q < .6 || q > 1.5 || viewWidth < 350 || viewHeight < 300 || viewWidth > 2400 || viewHeight > 1600) return null;
  const hx = viewWidth/10400*mapWidth/2, hy = viewHeight/7200*mapHeight/2;
  // A tiny camera frame cannot provide independent edges and disk evidence.
  if (hx < 3*q || hy < 2.5*q || hx > mapWidth*.42 || hy > mapHeight*.42) return null;
  const points=[];
  let left=W,right=-1,top=H,bottom=-1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(green[y*W+x]){
    points.push([x+.5,y+.5]);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(points.length < 18*q*q || points.length > 10*q*(hx+hy)+40*q*q) return null;
  if((left<=1&&right>=W-2)||(top<=1&&bottom>=H-2))return null;
  const seed=(lo,hi,limit,half)=>lo<=1?hi+.5-Math.max(half+q*.5,3*q):
    hi>=limit-2?lo+.5+Math.max(half+q*.5,3*q):(lo+hi+1)/2;
  const seedX=seed(left,right,W,hx),seedY=seed(top,bottom,H,hy);
  const hypotheses=[];
  const margin=1.5,step=.25;
  function shape(x,y,cx,cy,l,r,t,b){
    const disk=Math.hypot(x-cx,y-cy);
    const horizontal=x>=l-.4&&x<=r+.4?Math.min(Math.abs(y-t),Math.abs(y-b)):Infinity;
    const vertical=y>=t-.4&&y<=b+.4?Math.min(Math.abs(x-l),Math.abs(x-r)):Infinity;
    return {disk,edge:Math.min(horizontal,vertical)};
  }
  function evidenceAt(x,y){
    let hits=0,total=0;
    const reach=Math.max(.8,q*.85);
    for(let yy=Math.floor(y-reach);yy<=Math.floor(y+reach);yy++)for(let xx=Math.floor(x-reach);xx<=Math.floor(x+reach);xx++){
      if(xx<0||xx>=W||yy<0||yy>=H)continue;
      if(Math.hypot(xx+.5-x,yy+.5-y)>reach+.35)continue;
      total++;hits+=green[yy*W+xx];
    }
    return total>0&&hits>0;
  }
  for(let ix=-6;ix<=6;ix++)for(let iy=-6;iy<=6;iy++){
    const cx=seedX+ix*step,cy=seedY+iy*step;
    if(cx<0||cx>mapWidth||cy<0||cy>mapHeight)continue;
    const l=Math.max(0,cx-hx),r=Math.min(mapWidth,cx+hx),t=Math.max(0,cy-hy),b=Math.min(mapHeight,cy+hy);
    if(r-l<4*q||b-t<4*q)continue;
    let outliers=0;
    for(const[x,y]of points){const s=shape(x,y,cx,cy,l,r,t,b);if(s.disk>3*q+.65&&s.edge>q+.65)outliers++;}
    if(outliers>Math.max(1,Math.floor(points.length*.015)))continue;
    let diskCore=0,diskHits=0,mismatch=0,predicted=0,union=0;
    for(let y=Math.max(0,Math.floor(top-margin));y<Math.min(H,Math.ceil(bottom+margin+1));y++)for(let x=Math.max(0,Math.floor(left-margin));x<Math.min(W,Math.ceil(right+margin+1));x++){
      const s=shape(x+.5,y+.5,cx,cy,l,r,t,b),actual=!!green[y*W+x];
      if(s.disk<2.35*q&&s.edge>q+.65){diskCore++;if(actual)diskHits++;}
      const expected=s.disk<2.8*q||s.edge<.72*q;
      if(expected)predicted++;
      if(expected||actual)union++;
      if(expected!==actual)mismatch++;
    }
    // The center must contain independently visible disk pixels, not just frame.
    if(diskCore<Math.max(3,Math.ceil(2.5*q*q))||diskHits/diskCore<.8)continue;
    const coverage=[];
    let edgeBad=false;
    for(const edge of [[l,t,r,t],[l,b,r,b],[l,t,l,b],[r,t,r,b]]){
      const[x1,y1,x2,y2]=edge,length=Math.hypot(x2-x1,y2-y1),n=Math.max(1,Math.floor(length));
      let eligible=0,hits=0,gap=0,maxGap=0;
      for(let j=1;j<n;j++){
        const x=x1+(x2-x1)*j/n,y=y1+(y2-y1)*j/n;
        if(Math.hypot(x-cx,y-cy)<3.6*q)continue;
        eligible++;
        if(evidenceAt(x,y)){hits++;gap=0;}else{gap++;maxGap=Math.max(maxGap,gap);}
      }
      if(eligible<2||hits/eligible<.78||maxGap>1){edgeBad=true;break;}
      coverage.push(hits/eligible);
    }
    if(edgeBad||mismatch/Math.max(1,union)>.32)continue;
    const score=mismatch/Math.max(1,union)+outliers/points.length+(1-diskHits/diskCore)*.25;
    hypotheses.push({x:cx,y:cy,score,diskCore,diskHits,edgeCoverage:coverage,outliers});
  }
  if(!hypotheses.length)return null;
  hypotheses.sort((a,b)=>a.score-b.score);
  const best=hypotheses[0],near=hypotheses.filter(h=>h.score<=best.score+.008);
  const loX=Math.min(...near.map(h=>h.x)),hiX=Math.max(...near.map(h=>h.x));
  const loY=Math.min(...near.map(h=>h.y)),hiY=Math.max(...near.map(h=>h.y));
  if(Math.hypot(hiX-loX,hiY-loY)>1.6*q)return null;
  const x=near.reduce((sum,h)=>sum+h.x,0)/near.length,y=near.reduce((sum,h)=>sum+h.y,0)/near.length;
  return {x,y,method:'green-frame-and-disk',fitError:best.score,
    ambiguityPixels:Math.hypot(hiX-loX,hiY-loY),diskEvidence:best.diskHits,
    edgeCoverage:Math.min(...best.edgeCoverage)};
}

if(typeof module!=='undefined'&&module.exports)module.exports={locateMinimapPlayer27};
