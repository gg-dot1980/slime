// grow-3: read only rendered minimap pixels; no game state or absent-marker inference.
function growMarkers(image,w,h,map){
 if(!map?.player||!image?.data)return [];
 const q=map.pixelRatio||1,W=Math.ceil(map.width),H=Math.ceil(map.height),kind=new Uint8Array(W*H),seen=new Uint8Array(W*H),out=[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=Math.floor(map.x+x),Y=Math.floor(map.y+y);if(X<0||Y<0||X>=w||Y>=h)continue;const i=(Y*w+X)*4,r=image.data[i],g=image.data[i+1],b=image.data[i+2];kind[y*W+x]=r>=240&&g>=120&&g<=158&&b>=110&&b<=150?2:r>=200&&r<=217&&g>=228&&g<=244&&b>=215&&b<=233?1:r>=140&&r<=185&&g>=220&&b>=185&&b<=224?3:0;}
 for(let i=0;i<kind.length;i++)if((kind[i]===1||kind[i]===2)&&!seen[i]){const color=kind[i],todo=[i],points=[];seen[i]=1;while(todo.length){const k=todo.pop(),x=k%W,y=(k/W)|0;points.push([x,y]);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=x+dx,b=y+dy,j=b*W+a;if(a>=0&&a<W&&b>=0&&b<H&&!seen[j]&&kind[j]===color){seen[j]=1;todo.push(j);}}}
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...ys),b=Math.max(...ys),bw=r-l+1,bh=b-t+1,x=xs.reduce((a,b)=>a+b,0)/points.length+.5,y=ys.reduce((a,b)=>a+b,0)/points.length+.5;
 let mixed=false;for(let Y=Math.max(0,t-1);Y<=Math.min(H-1,b+1);Y++)for(let X=Math.max(0,l-1);X<=Math.min(W-1,r+1);X++){const k=kind[Y*W+X];if(k===3||k&&k!==color)mixed=true;}
 // No food is painted here. Reject borders, text, player/camera strokes and touching colors.
 if(l<=0||t<=0||r>=W-1||b>=H-1||points.length<Math.max(2,q*q)||bw>7*q+1||bh>7*q+1||Math.max(bw,bh)/Math.min(bw,bh)>1.8||points.length/(bw*bh)<.45||mixed||Math.hypot(x-map.player.x,y-map.player.y)<=6*q)continue;
 out.push({x,y,red:color===2,area:points.length,source:'visible-minimap'});
 }return out;
}
function growMapInputs(objects,r,map){
 const markers=map?.growMarkers;if(r<90||!map?.player||!markers)return {objects,targets:[]};
 const observed=[...markers,...(map.threats||[]).filter(t=>!markers.some(m=>m.red&&Math.hypot(m.x-t.x,m.y-t.y)<2)).map(t=>({...t,red:true}))];
 const dots=observed.map(m=>({...m,x:(m.x-map.player.x)/map.width*10400,y:(m.y-map.player.y)/map.height*7200})),copy=objects.map(o=>({...o})),targets=[];
 for(const m of dots){const near=copy.filter(o=>o.npc&&Math.hypot(o.x-m.x,o.y-m.y)<100+Math.min(60,o.r*.3||0));const unique=near.length===1&&dots.filter(n=>Math.hypot(near[0].x-n.x,near[0].y-n.y)<100+Math.min(60,near[0].r*.3||0)).length===1;
 if(m.red){copy.push({x:m.x,y:m.y,r:Math.max(r*1.12,114)+75,npc:true,isRed:true,clipped:false,vx:0,vy:0,mapOnly:true});continue;}
 if(near.length){if(!unique)continue;near[0].mapVerified=true;targets.push(near[0]);}
 else {const o={x:m.x,y:m.y,r:Math.min(r,60),npc:true,isRed:false,clipped:false,blocked:false,vx:0,vy:0,mapVerified:true,mapOnly:true};copy.push(o);targets.push(o);}
 }return {objects:copy,targets};
}
