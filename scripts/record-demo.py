from pathlib import Path
import urllib.request,time,base64,json,hashlib
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
p=Path('/home/gg/projects/slime-demo')
o=Options();o.set_preference('intl.accept_languages','zh-TW,zh');o.add_argument('-headless');o.binary_location='/snap/firefox/current/usr/lib/firefox/firefox'
d=webdriver.Firefox(options=o,service=Service('/snap/bin/geckodriver'));d.set_window_size(1280,900)
try:
 d.get('https://slime.gameson.cc/');time.sleep(3);src=d.page_source.encode();(p/'game.html').write_bytes(src);d.get((p/'game.html').as_uri());time.sleep(2)
 d.execute_script("window.fetch=()=>Promise.resolve({ok:true,json:async()=>({entries:[]})});document.getElementById('nickname').value='Demo';document.getElementById('start').click()")
 d.execute_script('''
 const game=document.querySelector('canvas');const c=document.createElement('canvas');c.width=960;c.height=640;
 const x=c.getContext('2d');window.demoChunks=[];window.demoRecorder=new MediaRecorder(c.captureStream(24),{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:1800000});demoRecorder.ondataavailable=e=>demoChunks.push(e.data);demoRecorder.onstop=()=>{const r=new FileReader();r.onload=()=>window.demoData=r.result.split(',')[1];r.readAsDataURL(new Blob(demoChunks,{type:'video/webm'}))};
 const lines=['吃得巧，活得久。','WASD／方向鍵移動','吃原色食物，混出自己的顏色','吞掉比你小的史萊姆，逐步長大','大型史萊姆會追你，留意邊界','手機也能用螢幕搖桿／傾斜操控','目標：5 分鐘內成長到體型 200','準備好了？來挑戰 Slime Arena'];
 const begin=performance.now();function draw(){const t=(performance.now()-begin)/1000;x.fillStyle='#0c1520';x.fillRect(0,0,960,640);x.drawImage(game,0,0,960,540);x.fillStyle='#101e2c';x.fillRect(0,540,960,100);x.textAlign='center';x.fillStyle='#b4f7d6';x.font='bold 30px sans-serif';x.fillText(lines[Math.min(7,Math.floor(t/5))],480,583);x.fillStyle='#9eb4c8';x.font='17px sans-serif';x.fillText('SLIME ARENA v2.22  ·  實際遊戲畫面 · 操作示範',480,619);if(t<40)requestAnimationFrame(draw)};demoRecorder.start();draw();
 ''')
 for i in range(40):
  key=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'][(i//4)%4]
  d.execute_script("for(const k of ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'])document.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));document.dispatchEvent(new KeyboardEvent('keydown',{key:arguments[0],bubbles:true}));if(document.getElementById('start').textContent.match(/再玩|Play again/))document.getElementById('start').click()",key)
  time.sleep(1)
 d.execute_script('demoRecorder.stop()');time.sleep(3)
 data=d.execute_script('return window.demoData');(p/'slime-demo-v1.webm').write_bytes(base64.b64decode(data));d.save_screenshot(str(p/'record-end.png'))
 (p/'record.json').write_text(json.dumps({'source':'https://slime.gameson.cc/','source_sha256':hashlib.sha256(src).hexdigest(),'duration_target':40,'version':'2.22','captured':'actual game canvas; keyboard input; local copy; scoreboard network disabled'},indent=2))
 print('recorded',len(data))
finally:d.quit()
