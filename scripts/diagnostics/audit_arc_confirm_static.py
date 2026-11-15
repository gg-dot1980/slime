from pathlib import Path
import json,base64
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
p=Path('/home/gg/projects/ocr3');op=Options();op.add_argument('-headless');op.binary_location='/snap/firefox/current/usr/lib/firefox/firefox';d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=op);d.set_script_timeout(60);out=[]
runs=json.load(open(p/'evidence/arc-confirm-policy-audit.json'))['runs'];files=[t['pixel_file'] for r in runs for sample in r['samples'] for t in sample['timer_trace'] if t.get('pixel_file')]
try:
 for variant in ['baseline']:
  s=(p/('source/controller-value24.js' if variant=='value24' else 'source/controller-foodwall.js')).read_text()
  if variant=='hue8':s=s.replace('delta<=22||delta>=338','delta<=8||delta>=352')
  s=s.replace('if(area>=7&&diam>=9&&density>=.28&&aspect<=12&&!textLike)found.push({hue:', '''const rows=new Map(),cols=new Map();for(let z=0;z<tail;z++){const xx=queue[z]%W,yy=(queue[z]/W)|0;const row=rows.get(yy)||[xx,xx],col=cols.get(xx)||[yy,yy];row[0]=Math.min(row[0],xx);row[1]=Math.max(row[1],xx);col[0]=Math.min(col[0],yy);col[1]=Math.max(col[1],yy);rows.set(yy,row);cols.set(xx,col)}const ps=[];for(const [yy,xx] of rows)for(const x of xx)ps.push([x*scale,yy*scale]);for(const [xx,yy] of cols)for(const y of yy)ps.push([xx*scale,y*scale]);ps.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const a of ps){while(lo.length>=2&&cross(lo.at(-2),lo.at(-1),a)<=0)lo.pop();lo.push(a)}for(const a of ps.slice().reverse()){while(hi.length>=2&&cross(hi.at(-2),hi.at(-1),a)<=0)hi.pop();hi.push(a)}const arc=lo.slice(0,-1).concat(hi.slice(0,-1)).filter(([x,y])=>x>scale*2&&x<w-scale*3&&y>scale*2&&y<h-scale*3);if(area>=7&&diam>=9&&density>=.28&&aspect<=12&&!textLike)found.push({arc,hue:''')
  hook="window.__auditPixels=(image)=>components(image,image.width,image.height,Math.max(1,Math.ceil(image.width/700)),canvasUiMasks(image.width,image.height,.6));";s=s.replace('let lastVision=0;',hook+'let lastVision=0;')
  d.get('https://slime.gameson.cc/ocr-test');d.execute_script("document.getElementById('stop').click();const s=document.createElement('script');s.textContent=arguments[0];document.body.appendChild(s)",s)
  for fn in files:
   data=base64.b64encode((p/'evidence'/fn).read_bytes()).decode();r=d.execute_async_script("const [data,done]=arguments;const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=1200;c.height=Math.round(img.height*.6);const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);done(window.__auditPixels(ctx.getImageData(0,0,c.width,c.height)))};img.src='data:image/png;base64,'+data",data);out.append({'variant':variant,'file':fn,'components':r})
 (p/'evidence/arc-confirm-static.json').write_text(json.dumps(out));print('records',len(out))
finally:d.quit()
