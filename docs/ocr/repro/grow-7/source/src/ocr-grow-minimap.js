// grow-3: read only rendered minimap pixels; no game state or absent-marker inference.
function growMarkers(image,w,h,map){
 if(!map?.player||!image?.data)return [];
 const q=map.pixelRatio||1,W=Math.ceil(map.width),H=Math.ceil(map.height),kind=new Uint8Array(W*H),seen=new Uint8Array(W*H),out=[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=Math.floor(map.x+x),Y=Math.floor(map.y+y);if(X<0||Y<0||X>=w||Y>=h)continue;const i=(Y*w+X)*4,r=image.data[i],g=image.data[i+1],b=image.data[i+2];kind[y*W+x]=r>=240&&g>=120&&g<=158&&b>=110&&b<=150?2:r>=200&&r<=217&&g>=228&&g<=244&&b>=215&&b<=233?1:r>=140&&r<=185&&g>=220&&b>=185&&b<=224?3:0;}
 for(let i=0;i<kind.length;i++)if((kind[i]===1||kind[i]===2)&&!seen[i]){const color=kind[i],todo=[i],points=[];seen[i]=1;while(todo.length){const k=todo.pop(),x=k%W,y=(k/W)|0;points.push([x,y]);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=x+dx,b=y+dy,j=b*W+a;if(a>=0&&a<W&&b>=0&&b<H&&!seen[j]&&kind[j]===color){seen[j]=1;todo.push(j);}}}
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...ys),b=Math.max(...ys),bw=r-l+1,bh=b-t+1,x=xs.reduce((a,b)=>a+b,0)/points.length+.5,y=ys.reduce((a,b)=>a+b,0)/points.length+.5;
 let mixed=false;for(let Y=Math.max(0,t-1);Y<=Math.min(H-1,b+1);Y++)for(let X=Math.max(0,l-1);X<=Math.min(W-1,r+1);X++){const k=kind[Y*W+X];if(k===3||k&&k!==color)mixed=true;}
 // A resolved white component is not rejected merely for proximity to the player.
 // The expanded mixed-color box still rejects green/white contact and camera strokes.
 // No food is painted here. Reject borders, text, player/camera strokes and touching colors.
 if(l<=0||t<=0||r>=W-1||b>=H-1||points.length<Math.max(2,q*q)||bw>7*q+1||bh>7*q+1||Math.max(bw,bh)/Math.min(bw,bh)>1.8||points.length/(bw*bh)<.45||mixed||(color===2&&Math.hypot(x-map.player.x,y-map.player.y)<=6*q))continue;
 let core=0;for(const [X,Y]of points){const i=((Math.floor(map.y)+Y)*w+Math.floor(map.x)+X)*4;if(image.data[i]===211&&image.data[i+1]===238&&image.data[i+2]===225)core++;}
 // Exact pale core area only: antialias/tint cannot increase this lower estimate.
 // NPC map radius = clamp(worldRadius/38,1.2,3); player marker is fixed3.
 const sizeLower=color===1&&Math.max(bw,bh)/Math.min(bw,bh)<=1.2&&points.length/(bw*bh)>=.7?38*Math.sqrt(core*.98/Math.PI)/q:0;
 out.push({x,y,red:color===2,area:points.length,sizeLower,source:'visible-minimap'});
 }return out;
}
function growMapInputs(objects,r,map){
 if(r<90)return {objects,targets:[]};
 const valid=Number.isFinite(map?.player?.x)&&Number.isFinite(map?.player?.y)&&map.width>0&&map.height>0&&Array.isArray(map.growMarkers);
 if(!valid)return {objects:[],targets:[],mapStatus:'lost'};
 // At >=90 the visible map is authoritative for NPC policy. Body fragments,
 // aliases, red text, radius and failed pairing must not reintroduce avoidance.
 const markers=map.growMarkers.filter(m=>Number.isFinite(m.x)&&Number.isFinite(m.y));
 const nearWhite=markers.filter(m=>m.red===false&&Number.isFinite(m.sizeLower)&&m.sizeLower>45.6&&m.sizeLower>=.9*(r+1));
 const reds=[...nearWhite.map(m=>({...m,nearWhite:true})),...markers.filter(m=>m.red),...(map.threats||[]).filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)&&!markers.some(m=>m.red&&Math.hypot(m.x-t.x,m.y-t.y)<2))];
 const copy=objects.filter(o=>!o.npc).map(o=>({...o})),targets=[];
 const point=m=>({x:(m.x-map.player.x)/map.width*10400,y:(m.y-map.player.y)/map.height*7200});
 for(const m of reds)copy.push({...point(m),r:Math.max(r*1.12,114)+75,nearWhite:!!m.nearWhite,npc:true,isRed:true,clipped:false,vx:0,vy:0,mapOnly:true});
 for(const m of markers.filter(m=>m.red===false)){
  if(reds.some(t=>Math.hypot(m.x-t.x,m.y-t.y)<=2*(map.pixelRatio||1)))continue;
  const o={...point(m),r:Math.min(r,60),npc:true,isRed:false,clipped:false,blocked:false,vx:0,vy:0,mapVerified:true,mapOnly:true};copy.push(o);targets.push(o);
 }
 return {objects:copy,targets,mapStatus:'visible',nearWhite:nearWhite.length};
}
