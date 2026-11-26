function edgeMarkers36(image,w,h,map) {
 const width=Math.ceil(map.width),height=Math.ceil(map.height),pad=4,W=width+2*pad,H=height+2*pad;
 const ox=Math.floor(map.x)-pad,oy=Math.floor(map.y)-pad;
 const mask=new Float32Array(W*H),seen=new Uint8Array(W*H),queue=new Int32Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const mx=x-pad,my=y-pad,dx=Math.min(mx,width-1-mx),dy=Math.min(my,height-1-my);
  if(dx>7&&dy>7)continue;
  const k=((oy+y)*w+ox+x)*4,rr=image.data[k],gg=image.data[k+1],bb=image.data[k+2];
  const base=dx<0||dy<0?[17,27,33]:[32,50,56];
  const cover=(rr-base[0])/(211-base[0]);
  if(cover<.18||cover>1.045)continue;
  if(Math.abs(gg-(base[1]+cover*(238-base[1])))<10&&Math.abs(bb-(base[2]+cover*(225-base[2])))<10)mask[y*W+x]=cover;
 }
 const rows=[];
 for(let i=0;i<mask.length;i++)if(mask[i]&&!seen[i]){
  let p=0,q=0,mass=0,bulk=0,xx=0,yy=0,l=W,r=0,t=H,b=0;queue[q++]=i;seen[i]=1;
  while(p<q){const j=queue[p++],x=j%W,y=Math.floor(j/W),c=mask[j];
   mass+=c;bulk+=c>.80;xx+=(x-pad+.5)*c;yy+=(y-pad+.5)*c;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
   for(let v=-1;v<=1;v++)for(let u=-1;u<=1;u++){const nx=x+u,ny=y+v,k=ny*W+nx;if(nx>=0&&nx<W&&ny>=0&&ny<H&&mask[k]&&!seen[k]){queue[q++]=k;seen[k]=1;}}
  }
  const bw=r-l+1,bh=b-t+1,cx=xx/mass,cy=yy/mass;
  if(mass<2.35||mass>34||bulk<1||bw>8||bh>8||Math.max(bw,bh)>Math.min(bw,bh)*1.8||cx<0||cy<0||cx>map.width||cy>map.height)continue;
  if(Math.min(cx,cy,map.width-cx,map.height-cy)>5.5)continue;
  rows.push({x:cx,y:cy,area:mass,edge:true});
 }
 return rows;
}
