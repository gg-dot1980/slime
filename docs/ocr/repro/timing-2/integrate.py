from pathlib import Path
import sys
p=Path(sys.argv[1]);s=p.read_text();m=Path(__file__).with_name('timing.js').read_text()
def once(a,b):
 global s
 assert s.count(a)==1,('anchor count',a[:40],s.count(a))
 s=s.replace(a,b,1)
once("<script>(()=>{const $=id=>document.getElementById(id),game=","<script>"+m+"</script><script>(()=>{const $=id=>document.getElementById(id),game=")
once('let active=false',"const timing=window.ocrTiming=OCRTiming.create();document.getElementById('timingEnabled').onchange=e=>timing.enable(e.target.checked);let active=false")
once('const image=ctx.getImageData(0,0,w,h),pixels=','const image=ctx.getImageData(0,0,w,h);timing.capture(image,captureStart,performance.now());const pixels=')
once('win.dispatchEvent(new win.KeyboardEvent(type,{key:k,bubbles:true,cancelable:true}));','timing.dispatch(type,k,()=>win.dispatchEvent(new win.KeyboardEvent(type,{key:k,bubbles:true,cancelable:true})));')
once('const planOutput=JSON.parse(JSON.stringify(d));move(d);','timing.decision(d);const planOutput=JSON.parse(JSON.stringify(d));move(d);')
once('active=false;release();if(pause)','active=false;release();timing.stop();if(pause)')
once('<section class="decision"><label><input type="checkbox" id="recordEnabled">','<section class="decision"><label><input type="checkbox" id="timingEnabled"> 啟用 timing-2 本機時序診斷（預設關閉，最多512事件）</label><p>獨立記錄擷取、決策完成、按下／放開派送與像素變化；朝向不是位移。實戰驗證尚未執行，不自動上傳或匯出。啟用完整像素雜湊可能增加耗時，先於私有環境量測。</p><label><input type="checkbox" id="recordEnabled">')
p.write_text(s)
