# Isolated offline audit only, samebaselineA200ms seed1237v20/v21 phase0. Rawcomponent+truthrecords only in outside harness aftercontrollercallback, not inputs. Compare replaydecisionsto original before interpretation.
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
import json,hashlib,time
p=Path('/home/gg/projects/ocr3');src=Path('/home/gg/projects/ocr3-release/.sites-checkout/src/game-v2.13.html').read_text();opts=Options();opts.add_argument('-headless');opts.binary_location='/snap/firefox/current/usr/lib/firefox/firefox';d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=opts);d.set_window_size(1280,900);d.set_script_timeout(60)
controller=(p/'source/controller-value24.js').read_text().replace('if(map){map.viewWidth', 'window.__rawDebug={rawParts,parts,w,h,ratio};if(map){map.viewWidth');controller=controller.replace("(()=>{","(()=>{const performance={now:()=>document.getElementById('game').contentWindow.__t};let firstTimer=true;window.__diagTimers=[];const setTimeout=(f,ms=0)=>{const extra=firstTimer?(window.__initialPhase||0):0;firstTimer=false;window.__diagTimers.push({f,due:performance.now()+Math.max(0,ms)+extra});return window.__diagTimers.length};",1).replace('move(d);showVision','window.__diagDecision={x:d.x,y:d.y,r:hud,clearance:d.clearance,objects,decision:d,logical_ms:performance.now()};move(d);showVision');out=[]
try:
 d.get('https://slime.gameson.cc/ocr-test');WebDriverWait(d,45).until(lambda d:d.execute_script("return !!document.getElementById('stop')"));d.execute_script("document.getElementById('stop').click()")
 for version,seed in [(v,s) for v in ['v2.21'] for s in [4001,5003]]:
  src=Path('/home/gg/projects/ocr3-release/.sites-checkout/src/'+('game.html' if version=='v2.22' else 'game-'+version+'.html')).read_text()
  for repeat in range(1):
   bootstrap='''<script>window.__q=[];window.__t=0;window.__blocked=0;let seed=SEED;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};window.requestAnimationFrame=f=>(__q.push(f),__q.length);window.cancelAnimationFrame=()=>{};window.__step=n=>{for(let i=0;i<n;i++){__t+=1000/60;let q=__q.splice(0);for(const f of q)f(__t)}};window.fetch=()=>{__blocked++;return Promise.reject(Error('diagnostic network blocked'))};window.XMLHttpRequest=function(){throw Error('blocked')};navigator.sendBeacon=()=>false;window.__memoryStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};</script>'''.replace('SEED',str(seed))
   src=src.replace('function splitNpc(i){', "const auditAddNpc=addNpc;addNpc=function(...args){auditAddNpc(...args);const s=slimes.at(-1);s.__auditId=(window.__auditCounter=(window.__auditCounter||0)+1);(window.__birthAudit||(window.__birthAudit=[])).push({id:s.__auditId,elapsed,x:s.x,y:s.y,r:s.r,px:player.x,py:player.y,pr:player.r,fromColor:args[3]||null})};function splitNpc(i){");audited=src.replace('function draw(){',"function draw(){window.__truthAudit={elapsed,playerR:player.r,cam:{x:cam.x,y:cam.y},npcs:slimes.map(s=>({x:s.x-cam.x-vw/2,y:s.y-cam.y-vh/2,r:s.r,color:s.color,id:s.__auditId})),vw,vh};");isolated=bootstrap+audited.replace('localStorage','__memoryStorage');d.execute_script("const f=document.getElementById('game');f.src='/'+arguments[1];f.srcdoc=arguments[0]",isolated,version);WebDriverWait(d,20).until(lambda d:d.execute_script("return !!document.getElementById('game').contentWindow.__step && !!document.getElementById('game').contentDocument.getElementById('start')"));time.sleep(.1)
   d.execute_script("window.__initialPhase=arguments[1];window.__diagDecision=null;window.__timerTrace=[];document.getElementById('stop').click();document.getElementById('runs').replaceChildren();const s=document.createElement('script');s.textContent=arguments[0];document.body.appendChild(s);document.getElementById('go').click();",controller if repeat%2==0 else controller.replace('200-(performance.now()-begin)', '100-(performance.now()-begin)'),100 if repeat>=2 else 0)
   samples=[];first_callback=None
   for step in range(750):
    r=d.execute_script("const w=document.getElementById('game').contentWindow;for(let frame=0;frame<12;frame++){w.__step(1);const due=(window.__diagTimers||[]).filter(t=>t.due<=w.__t+0.001);window.__diagTimers=(window.__diagTimers||[]).filter(t=>t.due>w.__t+0.001);for(const t of due){const before=window.performance.now();t.f();window.__timerTrace.push({due:t.due,actual:w.__t,cost_ms:window.performance.now()-before,observation:window.__diagDecision,raw:window.__rawDebug,audit:w.__truthAudit,pixel:false?w.document.querySelector('canvas').toDataURL():null});}}const doc=w.document;return {canvas:(w.__t>=arguments[1])?doc.querySelector('canvas').toDataURL():null,size:doc.getElementById('size').textContent,time:doc.getElementById('time').textContent,title:doc.getElementById('title').textContent,ending:!!doc.querySelector('#gameEnding.visible'),timer_trace:window.__timerTrace.splice(0),decision:window.__diagDecision,blocked:w.__blocked,logical_ms:w.__t};",step,57000 if version=='v2.20' else 90000)
    if r['canvas']:
     import base64
     png=p/'evidence'/f'failure-pixels-{version}-{step:04}.png';png.write_bytes(base64.b64decode(r['canvas'].split(',')[1]));r['canvas_file']=png.name;r['canvas_sha256']=hashlib.sha256(r.pop('canvas').encode()).hexdigest()
    else:r.pop('canvas')
    for tt in r['timer_trace']:
     if tt.get('pixel'):
      import base64
      fn=p/'evidence'/f"value24-death-{seed}-{round(tt['actual']):06}.png";fn.write_bytes(base64.b64decode(tt.pop('pixel').split(',')[1]));tt['pixel_file']=fn.name
    samples.append(r)
    if r['decision'] and first_callback is None:first_callback=r['timer_trace'][0]['actual'] if r['timer_trace'] else r['decision']['logical_ms']
    if step%50==0:d.save_screenshot(str(p/'evidence'/f'value24-deathwide-{version}-{seed}-{repeat}-{step//5:03}.png'))
    if r['ending']:break
   d.execute_script("document.getElementById('stop').click()")
   out.append({'version':version,'seed':seed,'variant':'AB'[repeat%2],'initial_phase_ms':100 if repeat>=2 else 0,'births':d.execute_script("return document.getElementById('game').contentWindow.__birthAudit"),'samples':samples,'first_callback_ms':first_callback});(p/'evidence/value24-birth-audit.json').write_text(json.dumps({'diagnostic_only':True,'runs':out}));d.save_screenshot(str(p/'evidence'/f'value24-deathwide-{version}-{seed}-{repeat}-final.png'));print(version,seed,'AB'[repeat%2],samples[-1]['title'],samples[-1]['size'],flush=True)

finally:d.quit()
