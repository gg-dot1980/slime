from pathlib import Path
import json,base64,math
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
p=Path('/home/gg/projects/ocr3');data=json.load(open(p/'evidence/targeted-merge-policy-audit.json'))['runs'];frames=[]
for run in data:
 for sample in run['samples']:
  for tr in sample['timer_trace']:
   if not tr.get('frame_file'):continue
   frames.append({'file':tr['frame_file'],'group':'heldout-'+run['version'],'r':tr['observation']['r'],'truth':tr['audit']['npcs']})
js=r'''window.__maskAudit=(image,r)=>{const w=image.width,h=image.height,cx=w/2,cy=h/2,R=r*.6,N=180,rad=[],rgb=image.data;for(let a=0;a<N;a++){const ang=a*2*Math.PI/N;let hit=null;for(let d=R*.65;d<=R*1.4;d+=.5){const x=Math.round(cx+Math.cos(ang)*d),y=Math.round(cy+Math.sin(ang)*d),i=(y*w+x)*4,v=[rgb[i],rgb[i+1],rgb[i+2]];if(Math.min(...v)>=205&&Math.max(...v)-Math.min(...v)<=45){hit=d;break}}rad.push(hit)}const coverage=rad.filter(x=>x!==null).length/N;let maxGap=0,gap=0;for(let i=0;i<N*2;i++){gap=rad[i%N]===null?gap+1:0;maxGap=Math.max(maxGap,gap)}const accepted=coverage>=.95&&maxGap<=5;const before=components(image,w,h,2,canvasUiMasks(w,h,.6));if(!accepted)return {coverage,maxGap,accepted,before,after:before};for(let i=0;i<N;i++)if(rad[i]===null){let l=1,rr=1;while(rad[(i-l+N)%N]===null)l++;while(rad[(i+rr)%N]===null)rr++;rad[i]=(rad[(i-l+N)%N]*rr+rad[(i+rr)%N]*l)/(l+rr)}const copy=new ImageData(new Uint8ClampedArray(rgb),w,h);let removed=0;for(let y=Math.floor(cy-R*1.45);y<=cy+R*1.45;y++)for(let x=Math.floor(cx-R*1.45);x<=cx+R*1.45;x++){const dx=x-cx,dy=y-cy,ang=(Math.atan2(dy,dx)+2*Math.PI)%(2*Math.PI),a=ang*N/(2*Math.PI),lo=Math.floor(a),rr=rad[lo]*(1-(a-lo))+rad[(lo+1)%N]*(a-lo);if(Math.hypot(dx,dy)<=rr+2){const i=(y*w+x)*4;copy.data[i]=32;copy.data[i+1]=50;copy.data[i+2]=56;removed++}}return {coverage,maxGap,accepted,removed,before,after:components(copy,w,h,2,canvasUiMasks(w,h,.6))}};'''
# No truth used in browser function. HUD radius and visiblewhiteoutlineonly.
source=(p/'source/controller-foodwall.js').read_text().replace('let lastVision=0;',js+'let lastVision=0;');opts=Options();opts.add_argument('-headless');opts.binary_location='/snap/firefox/current/usr/lib/firefox/firefox';d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=opts);out=[]
try:
 d.get('https://slime.gameson.cc/ocr-test');d.execute_script("document.getElementById('stop').click();const s=document.createElement('script');s.textContent=arguments[0];document.body.appendChild(s)",source)
 for f in frames:
  b=base64.b64encode((p/'evidence'/f['file']).read_bytes()).decode();res=d.execute_async_script("const [data,r,done]=arguments;const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=1200;c.height=Math.round(img.height*.6);const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);done(window.__maskAudit(ctx.getImageData(0,0,c.width,c.height),r))};img.src='data:image/png;base64,'+data",b,f['r']);out.append(f|res)
 (p/'evidence/player-mask-targeted-static.json').write_text(json.dumps({'method':'Visible whiteplayeroutline radial barrier,180rays HUD.65..1.4r,white>=205range<=45,coverage>=.95maxgap<=5,maskinterior+2analysispx; frozenbeforeevaluation. Components samehue22,notbrightness24. No decisioncontrollerchange.','frames':out}));print('frames',len(out),'accepted',sum(x['accepted'] for x in out))
finally:d.quit()
