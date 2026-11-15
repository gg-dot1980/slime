from pathlib import Path
import json,base64
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
p=Path('/home/gg/projects/ocr3');op=Options();op.add_argument('-headless');op.binary_location='/snap/firefox/current/usr/lib/firefox/firefox';d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=op);d.set_script_timeout(60);out=[]
files=['callback-v21-083300.png','callback-v21-083500.png','callback-v21-083700.png']+[f'early-birth-12007-{v:06}.png' for v in [74000,74400,75000,75400,75800,76000,76200,76400,76600]]+['early-birth-11003-070000.png']
try:
 for variant in ['baseline','value24','hue8']:
  s=(p/('source/controller-value24.js' if variant=='value24' else 'source/controller-foodwall.js')).read_text()
  if variant=='hue8':s=s.replace('delta<=22||delta>=338','delta<=8||delta>=352')
  hook="window.__auditPixels=(image)=>components(image,image.width,image.height,Math.max(1,Math.ceil(image.width/700)),canvasUiMasks(image.width,image.height,.6));";s=s.replace('let lastVision=0;',hook+'let lastVision=0;')
  d.get('https://slime.gameson.cc/ocr-test');d.execute_script("document.getElementById('stop').click();const s=document.createElement('script');s.textContent=arguments[0];document.body.appendChild(s)",s)
  for fn in files:
   data=base64.b64encode((p/'evidence'/fn).read_bytes()).decode();r=d.execute_async_script("const [data,done]=arguments;const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=1200;c.height=Math.round(img.height*.6);const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);done(window.__auditPixels(ctx.getImageData(0,0,c.width,c.height)))};img.src='data:image/png;base64,'+data",data);out.append({'variant':variant,'file':fn,'components':r})
 (p/'evidence/hue-static-audit.json').write_text(json.dumps(out));print('records',len(out))
finally:d.quit()
