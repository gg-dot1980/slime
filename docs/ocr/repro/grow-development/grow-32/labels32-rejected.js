function labeledBodies32(image,w,h,hud,map) {
 const a=image.data, stride=2, W=Math.ceil(w/stride), H=Math.ceil(h/stride), whites=new Uint8Array(W*H), visited=new Uint8Array(W*H);
 const opaque=(x,y)=>(Math.round(y)*w+Math.round(x))*4;
 for(let j=1;j<H-1;j++)for(let i=1;i<W-1;i++){
    const x=i*stride,y=j*stride;if(map&&x>map.x-15&&y>map.y-18&&y<map.y+map.height+40)continue;
    const k=opaque(x,y),R=a[k],G=a[k+1],B=a[k+2];
    if(R>197&&G>206&&B>198&&G>R-2&&G>B-2&&Math.max(R,G,B)-Math.min(R,G,B)<27)whites[j*W+i]=1;
 }
 const found=[],queue=new Int32Array(W*H);
 for(let i=0;i<whites.length;i++)if(whites[i]&&!visited[i]){
   let p=0,q=0,left=w,right=0,top=h,bottom=0;queue[q++]=i;visited[i]=1;
   while(p<q){const k=queue[p++],x=k%W,y=Math.floor(k/W);left=Math.min(left,x*stride);right=Math.max(right,x*stride);top=Math.min(top,y*stride);bottom=Math.max(bottom,y*stride);
    for(let dy=-1;dy<=1;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy,j=ny*W+nx;if(nx>=0&&nx<W&&ny>=0&&ny<H&&whites[j]&&!visited[j]){visited[j]=1;queue[q++]=j;}}
   }
   if(q<5||q>140||right-left<5||right-left>45||bottom-top<3||bottom-top>15)continue;
   const cx=(left+right)/2,cy=(top+bottom)/2;
   if(Math.hypot(cx-w*.5,cy-h*.5)<hud*.83)continue;
   // Estimate the body paint using a small annulus around the name. The actual
   // rendered flat body occupies more samples here than text or its glint.
   const colors=new Map;
   for(let dy=-12;dy<=12;dy+=3)for(let dx=-12;dx<=12;dx+=3){
    const xx=Math.round(cx+dx),yy=Math.round(cy+dy);if(xx<0||xx>=w||yy<0||yy>=h||Math.abs(dx)+Math.abs(dy)<8)continue;
    const k=opaque(xx,yy),red=a[k],gr=a[k+1],bl=a[k+2]; if(Math.max(red,gr,bl)<65||Math.min(red,gr,bl)>215)continue;
    const v=(red>>3)*1024+(gr>>3)*32+(bl>>3);const item=colors.get(v)||[0,0,0,0];item[0]++;item[1]+=red;item[2]+=gr;item[3]+=bl;colors.set(v,item);
   }
   const best=[...colors.values()].sort((x,y)=>y[0]-x[0])[0];if(!best||best[0]<9)continue;
   const base=best.slice(1).map(v=>v/best[0]),dist=[];
   for(let i=0;i<16;i++){
    const angle=i*Math.PI/8,dx=Math.cos(angle),dy=Math.sin(angle);let matched=0,miss=0,edge=0;
    for(let d=6;d<=290;d+=3){
      const x=Math.round(cx+dx*d),y=Math.round(cy+dy*d);if(x<0||x>=w||y<0||y>=h)break;
      const k=opaque(x,y),error=Math.max(Math.abs(a[k]-base[0]),Math.abs(a[k+1]-base[1]),Math.abs(a[k+2]-base[2]));
      if(error<=17){matched++;edge=d;miss=0;}else miss++;
      if(miss>=3&&d>13&&matched>=1){if(matched*3>edge*.38)dist.push(edge);break;}
    }
   }
   if(dist.length<6)continue;
   dist.sort((x,y)=>x-y);const med=dist[Math.floor(dist.length*.5)],quart=dist[Math.floor(dist.length*.75)];
   if(quart-med>med*.32||med<9||med>250)continue;
   const x=cx-w*.5,y=cy-h*.5;
   found.push({x,y,r:med+1,visualR:med+1,npc:true,labelSeen:true,localReliable:true,geometryAccepted:0,clipped:false,isRed:false,vx:0,vy:0,semanticLabel:true});
 }
 return found;
}
