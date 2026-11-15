from pathlib import Path
from PIL import Image
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
import base64,io
opts=Options();opts.add_argument('-headless');opts.binary_location='/snap/firefox/current/usr/lib/firefox/firefox';d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=opts)
import json,math,statistics
p=Path('/home/gg/projects/ocr3');e=p/'evidence';out=[]
# Offline features only; no controller changes. Full-resolution source then analysis resize approximates browser resampling.
for prefix in ['player-mask-targeted','player-mask-v2021','player-mask-collected']:
 frames=json.load(open(e/(prefix+'-static.json')))['frames'];paths=json.load(open(e/(prefix+'-paths.json')))
 for f in frames:
  data=d.execute_async_script("const [b,done]=arguments;let im=new Image();im.onload=()=>{let c=document.createElement('canvas');c.width=1200;c.height=698;let ctx=c.getContext('2d');ctx.drawImage(im,0,0,1200,698);done(c.toDataURL())};im.src='data:image/png;base64,'+b",base64.b64encode((e/f['file']).read_bytes()).decode());im=Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).convert('RGB')
  row=next(x for x in paths if x['file']==f['file'] and x['variant']=='after')
  for o in row['objects']:
   if not o['npc']:continue
   near=math.hypot(o['x'],o['y'])<=1.3*f['r'];truth=min(f['truth'],key=lambda n:math.hypot(n['x']-o['x'],n['y']-o['y']))
   matched=math.hypot(truth['x']-o['x'],truth['y']-o['y'])<max(20,truth['r']*.25)
   if not matched and not(near and o['r']<=20):continue
   part=min(f['after'],key=lambda v:math.hypot(v['x']-600-o['x']*.6,v['y']-349-o['y']*.6));cx=part['x'];cy=part['y'];hw=min(40,part['r']*.65);hh=min(7,part['r']*.25)
   pix=set()
   for y in range(max(0,math.floor(cy-hh)),min(697,math.floor(cy+hh))+1):
    for x in range(max(0,math.floor(cx-hw)),min(1199,math.floor(cx+hw))+1):
     rgb=im.getpixel((x,y))
     if min(rgb)>200 and max(rgb)-min(rgb)<40:pix.add((x,y))
   groups=[];remaining=pix.copy()
   while remaining:
    todo=[remaining.pop()];g=[]
    while todo:
     x,y=todo.pop();g.append((x,y))
     for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
      q=(x+dx,y+dy)
      if q in remaining:remaining.remove(q);todo.append(q)
    groups.append(g)
   out.append({'file':f['file'],'r':f['r'],'object':o,'class':'trueNPC' if matched else 'unmatched-player-near','truthR':truth['r'] if matched else None,'selected':o==row['decision']['target'],'white_count':len(pix),'components':len([g for g in groups if len(g)>=2]),'largest_share':max(map(len,groups),default=0)/max(1,len(pix))})
(e/'label-structure-browser-observations.json').write_text(json.dumps(out))
for c in ['trueNPC','unmatched-player-near']:
 a=[x for x in out if x['class']==c];print(c,len(a),'selected',sum(x['selected'] for x in a),'components>=2',sum(x['components']>=2 for x in a),'white0',sum(x['white_count']==0 for x in a))
print('genuine small',[(x['file'],round(x['object']['r'],1),x['components']) for x in out if x['class']=='trueNPC' and x['object']['r']<=20][:15])

d.quit()
