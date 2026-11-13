from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.firefox.options import Options
from pathlib import Path
import json,time,datetime,hashlib,re,traceback
r=Path('/home/gg/projects/ocr3');folder=r/'evidence/two-thirty-horizon-matrix-20261113';folder.mkdir(exist_ok=True)
manifest={'hypothesis':'New user gate: unchanged test022 at <=150 seconds, >=50%; 24 prespecified randomized A/B screening games, risk horizon only1.1s vs2s; independent40-game confirmation required','sequence':'ABBAABBAABBAABBAABBAABBA','A':'test022 threat ratio0.98','B':'test024 risk horizon2s','url':'https://slime.gameson.cc/ocr-test','games':['v2.13','v2.20','v2.21','v2.22'],'viewport':[1280,900],'wall_limit':175,'game_limit':150,'acceptance':'visible win AND final displayed Play time <=150 seconds; Per-version screening only,12A+12B; candidate>=6/12 and>A wins and deaths<=A. Then40fresh confirmations EACH version. Never publish from screening alone.','randomness':'ordinary randomized starts, not paired seeds','time':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2));results=[];d=None
cases=[(v,var) for var in manifest['sequence'] for v in ['v2.13','v2.20','v2.21','v2.22']]
opts=Options();opts.add_argument('-headless');opts.page_load_strategy='eager';opts.binary_location='/snap/firefox/current/usr/lib/firefox/firefox'
try:
 d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=opts);d.set_window_size(1280,900);d.set_page_load_timeout(45)
 for n,(version,var) in enumerate(cases,1):
  (folder/'status.json').write_text(json.dumps({'state':'running','run':n,'variant':var,'version':version,'time':datetime.datetime.now(datetime.timezone.utc).isoformat()}))
  d.get(manifest['url']);d.execute_script("document.getElementById('game').src=arguments[0]",'/'+version);WebDriverWait(d,45).until(lambda d:d.execute_script("return !!document.getElementById('game')?.contentDocument?.getElementById('size') && !document.getElementById('go').disabled"))
  WebDriverWait(d,45).until(lambda d:d.execute_script("return document.getElementById('game').contentWindow.location.pathname")== '/'+version)
  assert 'test-024' in d.title,d.title
  assert d.execute_script("return new URL(document.getElementById('game').src).pathname")== '/'+version
  if n==1:d.save_screenshot(str(folder/'published-test022.png'))
  source=(r/'source'/('controller-foodwall.js' if var=='A' else 'controller-risk2s.js')).read_text()
  source=source.replace('seconds<110','seconds<=150').replace('低於 1:50','2:30 內').replace('未低於 1:50','未在 2:30 內');source=source.replace('move(d);showVision','window.__ocrDecision={objects,decision:d,r:hud,velocity,map:analysis.map,cameraMatch:analysis.cameraMatch};move(d);showVision')
  d.execute_script("document.getElementById('stop').click();document.getElementById('runs').replaceChildren();const s=document.createElement('script');s.textContent=arguments[0];document.body.appendChild(s);",source)
  time.sleep(.5);d.find_element('id','go').click();start=time.monotonic();events=[];nextshot=0;outcome='timeout'
  while True:
   elapsed=time.monotonic()-start
   state=d.execute_script("const doc=document.getElementById('game').contentDocument;return {decision:window.__ocrDecision,hud:Object.fromEntries(['size','time','mix','toast','title','description','endingTitle'].map(id=>[id,doc.getElementById(id)?.innerText||doc.getElementById(id)?.textContent])),ending:!!doc.querySelector('#gameEnding.visible'),runs:document.getElementById('runs').innerText,status:document.getElementById('status').innerText,ms:document.getElementById('ms').innerText};")
   state['elapsed']=round(elapsed,3);events.append(state)
   if elapsed>=nextshot:d.save_screenshot(str(folder/f'run{n}-{int(elapsed):03}.png'));nextshot+=10
   if state['ending'] or state['runs']:outcome='finished';break
   remaining=re.fullmatch(r'(\d+):(\d+)',(state['hud'].get('time') or '').strip())
   if remaining and 300-(int(remaining[1])*60+int(remaining[2]))>150:break
   if elapsed>=175:outcome='infrastructure-time-limit';break
   if state['status']=='已停止':outcome='controller-stopped';break
   time.sleep(.5)
  d.find_element('id','stop').click();d.save_screenshot(str(folder/f'run{n}-final.png'))
  last=events[-1];hud=last['hud'];clock=re.search(r'(?:Play time|遊玩時間)\s*(\d+):(\d+)',hud.get('description') or '');seconds=int(clock[1])*60+int(clock[2]) if clock else None
  won=bool(re.search('You win|成功過關',hud.get('title') or ''));success=won and seconds is not None and seconds<=150
  result={'run':n,'variant':var,'version':version,'outcome':outcome,'success':success,'won':won,'game_seconds':seconds,'wall_seconds':last['elapsed'],'end_size':hud.get('size'),'title':hud.get('title'),'description':hud.get('description'),'source_sha256':hashlib.sha256(source.encode()).hexdigest(),'samples':len(events)}
  (folder/f'run{n}.json').write_text(json.dumps(events,ensure_ascii=False));results.append(result);(folder/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False),flush=True)
 (folder/'status.json').write_text(json.dumps({'state':'completed','runs':len(results),'time':datetime.datetime.now(datetime.timezone.utc).isoformat()}))
except Exception as e:
 (folder/'status.json').write_text(json.dumps({'state':'error','error':str(e),'runs':len(results),'time':datetime.datetime.now(datetime.timezone.utc).isoformat()}));traceback.print_exc();raise
finally:
 if d:d.quit()
