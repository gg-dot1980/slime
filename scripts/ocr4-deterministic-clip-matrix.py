from pathlib import Path
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
import json,hashlib,time
p=Path('/home/gg/projects/ocr3');src=Path('/home/gg/projects/ocr3-release/.sites-checkout/src/game-v2.13.html').read_text();opts=Options();opts.add_argument('-headless');opts.binary_location='/snap/firefox/current/usr/lib/firefox/firefox';d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=opts);d.set_window_size(1280,900);d.set_script_timeout(60)
controllerClip=(p/'source/controller-clippolygon-diagnostic.js').read_text();controllerClip=controllerClip.replace("(()=>{","(()=>{const performance={now:()=>document.getElementById('game').contentWindow.__t};const setTimeout=f=>{window.__diagCallback=f;return 1};",1).replace('move(d);showVision','window.__diagDecision={x:d.x,y:d.y,r:hud,clearance:d.clearance};move(d);showVision');controller=(p/'source/controller-foodwall.js').read_text();controller=controller.replace("(()=>{","(()=>{const performance={now:()=>document.getElementById('game').contentWindow.__t};const setTimeout=f=>{window.__diagCallback=f;return 1};",1).replace('move(d);showVision','window.__diagDecision={x:d.x,y:d.y,r:hud,clearance:d.clearance};move(d);showVision');out=[]
try:
 d.get('https://slime.gameson.cc/ocr-test');WebDriverWait(d,45).until(lambda d:d.execute_script("return !!document.getElementById('stop')"));d.execute_script("document.getElementById('stop').click()")
 for version,seed in [(v,s) for v in ['v2.13','v2.20','v2.21','v2.22'] for s in [101,202,303,404]]:
  src=Path('/home/gg/projects/ocr3-release/.sites-checkout/src/'+('game.html' if version=='v2.22' else 'game-'+version+'.html')).read_text()
  for repeat in range(2):
   bootstrap='''<script>window.__q=[];window.__t=0;window.__blocked=0;let seed=SEED;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};window.requestAnimationFrame=f=>(__q.push(f),__q.length);window.cancelAnimationFrame=()=>{};window.__step=n=>{for(let i=0;i<n;i++){__t+=1000/60;let q=__q.splice(0);for(const f of q)f(__t)}};window.fetch=()=>{__blocked++;return Promise.reject(Error('diagnostic network blocked'))};window.XMLHttpRequest=function(){throw Error('blocked')};navigator.sendBeacon=()=>false;window.__memoryStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};</script>'''.replace('SEED',str(seed))
   isolated=bootstrap+src.replace('localStorage','__memoryStorage');d.execute_script("const f=document.getElementById('game');f.src='/'+arguments[1];f.srcdoc=arguments[0]",isolated,version);WebDriverWait(d,20).until(lambda d:d.execute_script("return !!document.getElementById('game').contentWindow.__step && !!document.getElementById('game').contentDocument.getElementById('start')"));time.sleep(.1)
   d.execute_script("document.getElementById('stop').click();document.getElementById('runs').replaceChildren();const s=document.createElement('script');s.textContent=arguments[0];document.body.appendChild(s);document.getElementById('go').click();",controller if repeat==0 else controllerClip)
   samples=[]
   for step in range(750):
    r=d.execute_script("const w=document.getElementById('game').contentWindow;w.__step(12);const cb=window.__diagCallback;window.__diagCallback=null;if(cb)cb();const doc=w.document;return {canvas:arguments[0]%25===0?doc.querySelector('canvas').toDataURL():null,size:doc.getElementById('size').textContent,time:doc.getElementById('time').textContent,title:doc.getElementById('title').textContent,ending:!!doc.querySelector('#gameEnding.visible'),decision:window.__diagDecision,blocked:w.__blocked,logical_ms:w.__t};",step)
    if r['canvas']:r['canvas_sha256']=hashlib.sha256(r.pop('canvas').encode()).hexdigest()
    else:r.pop('canvas')
    samples.append(r)
    if r['ending']:break
   d.execute_script("document.getElementById('stop').click()")
   out.append({'version':version,'seed':seed,'variant':'AB'[repeat],'samples':samples});(p/'evidence/deterministic-clip-matrix.json').write_text(json.dumps({'diagnostic_only':True,'runs':out}));print(version,seed,'AB'[repeat],samples[-1]['title'],samples[-1]['size'],flush=True)

finally:d.quit()
