// Numeric synthetic geometry only. No browser, game state or gameplay claims.
const fs=require('node:fs'),vm=require('node:vm');
const sandbox={module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/geometry.js','utf8'),sandbox);
const refine=sandbox.module.exports.refineSlimeGeometry;
function scene({R=60,wobble=1,shift=[0,0],color=[100,155,85],highlights=[{}],text=false,cut=false}={}){
 const w=320,h=260,C={x:160,y:135},background=[25,42,48],base=color.map((v,i)=>Math.round(v*.88+background[i]*.12)),data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4,c=Math.hypot(x+.5-C.x,y+.5-C.y)<R*wobble?base:background;for(let j=0;j<3;j++)data[k+j]=c[j];data[k+3]=255;}
 for(const spec of highlights){const a=(spec.ar??.18)*R,b=(spec.br??.09)*R,angle=spec.angle??-.5,cx=C.x-.25*R+(spec.dx||0),cy=C.y-.33*R+(spec.dy||0),co=Math.cos(angle),si=Math.sin(angle);
  for(let y=Math.floor(cy-a-2);y<=cy+a+2;y++)for(let x=Math.floor(cx-a-2);x<=cx+a+2;x++){if(x<0||y<0||x>=w||y>=h)continue;let count=0;for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){const dx=x+(sx+.5)/4-cx,dy=y+(sy+.5)/4-cy,u=co*dx+si*dy,v=-si*dx+co*dy;if(u*u/a/a+v*v/b/b<=1&&(!cut||dx<0))count++;}const k=(y*w+x)*4;for(let j=0;j<3;j++)data[k+j]=Math.round(data[k+j]+(255-data[k+j])*(48/255)*(count/16));}
 }
 if(text)for(let y=130;y<139;y++)for(let x=151;x<170;x++)if(y===130||y===134||x===151||x===160||x===169){const k=(y*w+x)*4;data[k]=243;data[k+1]=250;data[k+2]=245;}
 return {image:{data},w,h,p:{x:C.x+shift[0],y:C.y+shift[1],r:R*wobble,clipped:false},C,R};
}
const specs=[
 ['clean-r20',{R:20},true],['clean-r40',{R:40},true],['clean-r80',{R:80},true],
 ['wobble080-shifted',{R:60,wobble:.8,shift:[7,-5]},true],
 ['wobble115-shifted',{R:60,wobble:1.15,shift:[-7,5]},true],
 ['bright-body',{R:60,color:[220,218,225]},true],
 ['real-highlight-plus-text',{R:60,text:true},true],
 ['text-only',{R:60,highlights:[],text:true},false],
 ['wrong-angle',{R:60,highlights:[{angle:.5}]},false],
 ['round-patch',{R:60,highlights:[{ar:.13,br:.13}]},false],
 ['half-highlight',{R:60,cut:true},false],
 ['two-highlights',{R:80,wobble:1.15,highlights:[{dx:-16},{dx:16}]},false]
];
const results=specs.map(([name,spec,accept])=>{const s=scene(spec),r=refine(s.image,s.w,s.h,s.p),error=r?{radius:Math.abs(r.r-s.R),center:Math.hypot(r.x-s.C.x,r.y-s.C.y)}:null,pass=!!r===accept&&(!r||(error.radius<=Math.max(2,s.R*.08)&&error.center<=Math.max(2,s.R*.06)));return {name,expected:accept?'accept':'null',pass,result:r,error};});
console.log(JSON.stringify({kind:'synthetic-geometry-only',cases:results.length,passed:results.filter(x=>x.pass).length,results},null,2));
if(results.some(x=>!x.pass))process.exitCode=1;
