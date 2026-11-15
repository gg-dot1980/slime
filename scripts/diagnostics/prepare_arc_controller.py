from pathlib import Path
import ast
p=Path('/home/gg/projects/ocr3');base=(p/'source/controller-foodwall.js').read_text()
node=ast.parse((p/'audit_arc_static.py').read_text());payload=next(n.args[1].value for n in ast.walk(node) if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='replace' and len(n.args)>1 and isinstance(n.args[0],ast.Constant) and isinstance(n.args[0].value,str) and n.args[0].value.startswith('if(area>=7&&diam'))
arc=payload.split('if(area>=7&&diam')[0];arc=arc.replace('const rows=', 'const rows=',1)
helper='''function fittedClippedCenter(queue,tail,W,w,h,scale,originalX,originalY,originalR){
ARCCODE
if(arc.length<8)return null;let mx=0,my=0;for(const [x,y]of arc){mx+=x;my+=y}mx/=arc.length;my/=arc.length;const a=Array.from({length:3},()=>[0,0,0,0]);for(const [x,y]of arc){const z=[x-mx,y-my,1],v=-(z[0]*z[0]+z[1]*z[1]);for(let i=0;i<3;i++){for(let j=0;j<3;j++)a[i][j]+=z[i]*z[j];a[i][3]+=z[i]*v}}for(let i=0;i<3;i++){let k=i;for(let j=i+1;j<3;j++)if(Math.abs(a[j][i])>Math.abs(a[k][i]))k=j;[a[i],a[k]]=[a[k],a[i]];if(Math.abs(a[i][i])<1e-8)return null;const v=a[i][i];a[i]=a[i].map(x=>x/v);for(let j=0;j<3;j++)if(j!==i){const v=a[j][i];a[j]=a[j].map((x,k)=>x-v*a[i][k])}}const [A,B,C]=a.map(x=>x[3]),r2=(A*A+B*B)/4-C;if(r2<=0)return null;const r=Math.sqrt(r2),x=mx-A/2,y=my-B/2,res=arc.map(([xx,yy])=>Math.abs(Math.hypot(xx-x,yy-y)-r)).sort((a,b)=>a-b),angles=arc.map(([xx,yy])=>Math.atan2(yy-y,xx-x)).sort((a,b)=>a-b);let gap=angles[0]+Math.PI*2-angles.at(-1);for(let i=1;i<angles.length;i++)gap=Math.max(gap,angles[i]-angles[i-1]);const coverage=(Math.PI*2-gap)*180/Math.PI,median=res.length%2?res[res.length>>1]:(res[res.length/2-1]+res[res.length/2])/2;if(coverage<150||coverage>340||median>.03*r||r/originalR<.7||r/originalR>1.8||Math.hypot(x-originalX,y-originalY)>.6*r)return null;return{x,y};
}
'''.replace('ARCCODE',arc)
base=base.replace('function components(',helper+'function components(',1)
needle='found.push({hue:seedHue,x:cx,y:cy,r:diam/2,area,bw:bw*scale,bh:bh*scale,clipped:'
assert needle in base
base=base.replace(needle,'found.push({arcCenter:diam/2>30&&(minX<=1||minY<=1||maxX>=W-2||maxY>=H-2)?fittedClippedCenter(queue,tail,W,w,h,scale,cx,cy,diam/2):null,hue:seedHue,x:cx,y:cy,r:diam/2,area,bw:bw*scale,bh:bh*scale,clipped:')
old='const x=(p.x-w/2)/ratio,y=(p.y-h/2)/ratio,visualR=p.r/ratio';new='const rawx=(p.x-w/2)/ratio,rawy=(p.y-h/2)/ratio,x=((p.arcCenter?.x??p.x)-w/2)/ratio,y=((p.arcCenter?.y??p.y)-h/2)/ratio,visualR=p.r/ratio';assert old in base;base=base.replace(old,new)
old='Math.hypot(q.x+(q.vx-camera.x)*dt-x,q.y+(q.vy-camera.y)*dt-y)';new='Math.hypot((q.rawx??q.x)+((q.rawvx??q.vx)-camera.x)*dt-rawx,(q.rawy??q.y)+((q.rawvy??q.vy)-camera.y)*dt-rawy)';assert old in base;base=base.replace(old,new)
base=base.replace('return {x,y,r,npc,stalled,blocked:', 'return {x,y,rawx,rawy,arcCorrected:!!p.arcCenter,rawvx:npc&&match?clamp((match.rawvx??match.vx??0)*.65+((rawx-(match.rawx??match.x))/dt+(measuredCamera?.x??camera.x))*.35):0,rawvy:npc&&match?clamp((match.rawvy??match.vy??0)*.65+((rawy-(match.rawy??match.y))/dt+(measuredCamera?.y??camera.y))*.35):0,r,npc,stalled,blocked:')
base=base.replace('(x-match.x)/dt','(p.arcCenter&&match.arcCorrected?x-match.x:rawx-(match.rawx??match.x))/dt').replace('(y-match.y)/dt','(p.arcCenter&&match.arcCorrected?y-match.y:rawy-(match.rawy??match.y))/dt')
# Food camera shifts must retain raw coordinates (foods are not corrected, but make semantics explicit).
assert '__truth' not in base
(p/'source/controller-arccenter.js').write_text(base)
