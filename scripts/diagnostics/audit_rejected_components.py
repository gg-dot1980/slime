from pathlib import Path
import json,base64
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
p=Path('/home/gg/projects/ocr3');s=(p/'source/controller-foodwall.js').read_text();condition='area>=7&&diam>=9&&density>=.28&&aspect<=12&&!textLike';assert condition in s;s=s.replace('if('+condition+')found.push({hue:', 'if(area>=7)found.push({accepted:('+condition+'),aspect,density,minX,minY,maxX,maxY,hue:');hook='window.__auditPixels=(image)=>components(image,image.width,image.height,Math.max(1,Math.ceil(image.width/700)),canvasUiMasks(image.width,image.height,.6));';s=s.replace('let lastVision=0;',hook+'let lastVision=0;');assert hook in s
op=Options();op.add_argument('-headless');op.binary_location='/snap/firefox/current/usr/lib/firefox/firefox';d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=op);d.set_script_timeout(60);out=[]
try:
 d.get('https://slime.gameson.cc/ocr-test');d.execute_script("document.getElementById('stop').click();const s=document.createElement('script');s.textContent=arguments[0];document.body.appendChild(s)",s)
 for fn in ['failure-pixels-v2.21-0416.png','failure-pixels-v2.21-0418.png','failure-pixels-v2.20-0298.png']:
  data=base64.b64encode((p/'evidence'/fn).read_bytes()).decode();r=d.execute_async_script("const [data,done]=arguments;const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=1200;c.height=Math.round(img.height*.6);const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);done(window.__auditPixels(ctx.getImageData(0,0,c.width,c.height)))};img.src='data:image/png;base64,'+data",data);out.append({'file':fn,'components':r});print(fn,[x for x in r if x['r']>60 and not x['accepted']])
 (p/'evidence/rejected-components-audit.json').write_text(json.dumps(out,indent=2))
finally:d.quit()
