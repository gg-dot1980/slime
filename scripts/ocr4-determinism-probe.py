from pathlib import Path
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
import json,hashlib,time
p=Path('/home/gg/projects/ocr3');src=Path('/home/gg/projects/ocr3-release/.sites-checkout/src/game-v2.13.html').read_text();opts=Options();opts.add_argument('-headless');opts.binary_location='/snap/firefox/current/usr/lib/firefox/firefox';d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=opts);d.set_window_size(1280,900);d.set_script_timeout(60)
out=[]
try:
 d.get('https://slime.gameson.cc/ocr-test');WebDriverWait(d,45).until(lambda d:d.execute_script("return !!document.getElementById('stop')"));d.execute_script("document.getElementById('stop').click()")
 for seed in [101,202,303]:
  for repeat in range(2):
   bootstrap='''<script>window.__q=[];window.__t=0;window.__blocked=0;let seed=SEED;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};window.requestAnimationFrame=f=>(__q.push(f),__q.length);window.cancelAnimationFrame=()=>{};window.__step=n=>{for(let i=0;i<n;i++){__t+=1000/60;let q=__q.splice(0);for(const f of q)f(__t)}};window.fetch=()=>{__blocked++;return Promise.reject(Error('diagnostic network blocked'))};window.XMLHttpRequest=function(){throw Error('blocked')};navigator.sendBeacon=()=>false;window.__memoryStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};</script>'''.replace('SEED',str(seed))
   isolated=bootstrap+src.replace('localStorage','__memoryStorage');d.execute_script("const f=document.getElementById('game');f.srcdoc=arguments[0]",isolated);WebDriverWait(d,20).until(lambda d:d.execute_script("return !!document.getElementById('game').contentWindow.__step && !!document.getElementById('game').contentDocument.getElementById('start')"));time.sleep(.1)
   d.execute_script("document.getElementById('game').contentDocument.getElementById('start').click()")
   samples=[]
   for step in range(12):
    r=d.execute_script("const w=document.getElementById('game').contentWindow;for(const key of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'])w.dispatchEvent(new w.KeyboardEvent('keyup',{key}));w.dispatchEvent(new w.KeyboardEvent('keydown',{key:['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'][arguments[0]%4]}));w.__step(300);const doc=w.document;return {canvas:doc.querySelector('canvas').toDataURL(),size:doc.getElementById('size').textContent,time:doc.getElementById('time').textContent,title:doc.getElementById('title').textContent,blocked:w.__blocked,logical_ms:w.__t};",step);r['canvas_sha256']=hashlib.sha256(r.pop('canvas').encode()).hexdigest();samples.append(r)
   out.append({'seed':seed,'repeat':repeat,'samples':samples});print(seed,repeat,flush=True)
 result={'scope':'isolated diagnostic only, fixed key path; not controller or acceptance','source_sha256':hashlib.sha256(src.encode()).hexdigest(),'equal':[out[i]['samples']==out[i+1]['samples'] for i in range(0,6,2)],'runs':out};(p/'evidence/determinism-probe.json').write_text(json.dumps(result,indent=2));print(json.dumps({'equal':result['equal']}))
finally:d.quit()
