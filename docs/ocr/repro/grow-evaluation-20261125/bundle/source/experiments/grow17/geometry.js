'use strict';

/* Next-candidate pixel refinement. Not wired into the active grow-13 run.
 * Input/output coordinates are image pixels, not CSS/world units.
 * The renderer draws a white 48/255-alpha ellipse with axes .18R/.09R,
 * angle -.5, and centre (-.25R,-.33R), independently of outline wobble.
 * confidence is a geometric consistency score, NOT a calibrated probability.
 * Rejects uncertain, cropped or multiple highlights; never reads game objects.
 */
function refineSlimeGeometry(image, w, h, p) {
  if (!image?.data || !p || p.clipped || ![p.x,p.y,p.r,w,h].every(Number.isFinite) || p.r < 13 || w < 1 || h < 1) return null;
  const rgb = image.data, V = p.r, alpha0 = 48/255;
  const pixel = (x,y) => {
    x=Math.round(x);y=Math.round(y);
    if(x<0||y<0||x>=w||y>=h)return null;
    const i=(y*w+x)*4;return [rgb[i],rgb[i+1],rgb[i+2]];
  };
  const median = a => a.sort((a,b)=>a-b)[a.length>>1];
  const samples=[];
  for(const [dx,dy] of [[.28,-.28],[.28,.20],[0,.40],[-.15,.35],[.40,0]])
    for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++) {
      const c=pixel(p.x+dx*V+x,p.y+dy*V+y);if(c)samples.push(c);
    }
  if(samples.length<30)return null;
  const base=[0,1,2].map(k=>median(samples.map(c=>c[k])));
  const sameBody=c=>Math.max(...c.map((v,k)=>Math.abs(v-base[k])))<=5;
  const baseSupport=samples.filter(sameBody).length/samples.length;
  if(baseSupport<.62||Math.max(...base)<55||Math.max(...base)>225)return null;

  // Broad enough to tolerate a shifted component centroid, but excludes most
  // lower-body text. Text edge pixels still have to pass full ellipse checks.
  const x0=Math.max(0,Math.floor(p.x-.78*V)),x1=Math.min(w-1,Math.ceil(p.x+.18*V));
  const y0=Math.max(0,Math.floor(p.y-.82*V)),y1=Math.min(h-1,Math.ceil(p.y+.08*V));
  const W=x1-x0+1,H=y1-y0+1,N=W*H;
  if(W<5||H<5||N>250000)return null;
  const weights=new Float32Array(N),alphas=new Float32Array(N),seen=new Uint8Array(N),queue=new Int32Array(N);
  const b0=base[0],b1=base[1],b2=base[2],d0=255-b0,d1=255-b1,d2=255-b2;
  for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){
    const j=yy*W+xx,i=((y0+yy)*w+x0+xx)*4;
    // Scalar channels avoid two temporary arrays per ROI pixel. Keep divisions
    // and addition order identical to the reference implementation.
    // Most ROI pixels are unhighlighted body. These are exactly the original
    // min/max alpha bounds, evaluated early before the other channel work.
    const ar=(rgb[i]-b0)/d0;if(!(ar>=.025&&ar<=.30))continue;
    const ag=(rgb[i+1]-b1)/d1;if(!(ag>=.025&&ag<=.30))continue;
    const ab=(rgb[i+2]-b2)/d2;if(!(ab>=.025&&ab<=.30))continue;
    const lo=Math.min(ar,ag,ab),hi=Math.max(ar,ag,ab),m=(ar+ag+ab)/3;
    // The white label's opaque interior is rejected by the upper alpha bound.
    if(lo>=.025&&hi<=.30&&hi-lo<=.065&&m>=.04){alphas[j]=m;weights[j]=Math.min(1.15,m/alpha0);}
  }
  const candidates=[];
  for(let seed=0;seed<N;seed++){
    if(!weights[seed]||seen[seed])continue;
    let head=0,tail=0,sum=0,sx=0,sy=0,sxx=0,syy=0,sxy=0,aa=0,edge=false;
    queue[tail++]=seed;seen[seed]=1;
    while(head<tail){
      const j=queue[head++],xx=j%W,yy=(j/W)|0,q=weights[j],x=x0+xx+.5,y=y0+yy+.5;
      sum+=q;sx+=q*x;sy+=q*y;sxx+=q*x*x;syy+=q*y*y;sxy+=q*x*y;aa+=q*alphas[j];
      edge ||= xx===0||yy===0||xx===W-1||yy===H-1;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=xx+dx,ny=yy+dy,k=ny*W+nx;
        if(nx>=0&&ny>=0&&nx<W&&ny<H&&!seen[k]&&weights[k]){seen[k]=1;queue[tail++]=k;}
      }
    }
    if(edge||sum<8||tail<8||aa/sum<.11||aa/sum>.235)continue;
    const hx=sx/sum,hy=sy/sum,cxx=sxx/sum-hx*hx,cyy=syy/sum-hy*hy,cxy=sxy/sum-hx*hy;
    const disc=Math.hypot(cxx-cyy,2*cxy),l1=(cxx+cyy+disc)/2,l2=(cxx+cyy-disc)/2;
    if(l2<=.16||l1<=l2)continue;
    const a=2*Math.sqrt(l1),b=2*Math.sqrt(l2),axisRatio=a/b;
    const angle=.5*Math.atan2(2*cxy,cxx-cyy);
    const angleError=Math.abs(Math.atan2(Math.sin(2*(angle+.5)),Math.cos(2*(angle+.5)))/2);
    const rA=a/.18,rB=b/.09,rArea=Math.sqrt(sum/(Math.PI*.18*.09));
    const r=(rA+rB+rArea)/3,axisError=Math.abs(rA-rB)/r,areaError=Math.abs(rArea-(rA+rB)/2)/r;
    if(axisRatio<1.65||axisRatio>2.35||angleError>.25||axisError>.20||areaError>.15||r<V*.70||r>V*1.45)continue;
    const x=hx+.25*r,y=hy+.33*r;
    if(Math.hypot(x-p.x,y-p.y)>V*.42)continue;
    // A highlight from a different overlapping sprite must also agree with the
    // proposed actor's inner body colour. Allow limited occlusion, not a shell.
    let bodyHits=0,bodyCount=0;
    for(let j=0;j<12;j++){
      const t=j*Math.PI/6,c=pixel(x+Math.cos(t)*r*.56,y+Math.sin(t)*r*.56);
      if(c){bodyCount++;if(sameBody(c))bodyHits++;}
    }
    const bodySupport=bodyHits/Math.max(1,bodyCount);
    if(bodyCount<10||bodySupport<.66)continue;
    const confidence=Math.max(0,Math.min(.99,.99-.35*axisError-.35*areaError-.20*angleError-.12*(1-baseSupport)-.12*(1-bodySupport)));
    candidates.push({x,y,r,confidence});
  }
  // Two plausible highlights imply a merged/ambiguous component. Abstain.
  return candidates.length===1?candidates[0]:null;
}

if(typeof module!=='undefined'&&module.exports)module.exports={refineSlimeGeometry};
