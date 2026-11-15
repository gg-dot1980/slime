from pathlib import Path
import json,base64,ast
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
p=Path('/home/gg/projects/ocr3');tree=ast.parse((p/'audit_player_mask.py').read_text());maskjs=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='js' for t in n.targets));frames=json.load(open(p/'evidence/player-mask-static.json'))['frames'];traces={t['frame_file']:t for r in json.load(open(p/'evidence/sixcase-policy-audit.json'))['runs'] for s in r['samples'] for t in s['timer_trace'] if t.get('frame_file')};opts=Options();opts.add_argument('-headless');opts.binary_location='/snap/firefox/current/usr/lib/firefox/firefox';d=webdriver.Remote(command_executor='http://127.0.0.1:42441',options=opts);out=[]
try:
 for variant in ['before','after']:
  source=(p/'source/controller-foodwall.js').read_text();source=source.replace('return {...pool[0],escaping:','window.__safePaths=candidates.map(c=>({name:c.name,clearance:c.clearance,gain:c.gain}));return {...pool[0],escaping:')
  if variant=='after':source=source.replace('rawParts=components(image,w,h,Math.max(1,Math.ceil(w/700)),canvasUiMasks(w,h,ratio))','rawParts=window.__maskAudit(image,radius).after')
  hook=maskjs+'''window.__staticPath=(source,r,speed,v,old)=>{imageState=null;const a=readImage(source,r,1000,v);const d=plan(a.objects,r,a.map,speed,v,old);return {objects:a.objects,decision:d,paths:window.__safePaths}};''';source=source.replace('let lastVision=0;',hook+'let lastVision=0;');d.get('https://slime.gameson.cc/ocr-test');d.execute_script("document.getElementById('stop').click();const s=document.createElement('script');s.textContent=arguments[0];document.body.appendChild(s)",source)
  for f in frames:
   t=traces[f['file']];pol=t['policy'];obs=t['observation'];b=base64.b64encode((p/'evidence'/f['file']).read_bytes()).decode();res=d.execute_async_script("const [data,r,speed,v,old,done]=arguments;const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.width;c.height=img.height;Object.defineProperty(c,'clientWidth',{value:img.width});c.getContext('2d').drawImage(img,0,0);done(window.__staticPath(c,r,speed,v,old))};img.src='data:image/png;base64,'+data",b,f['r'],pol['speed'],pol['v'],obs['decision']);out.append({'file':f['file'],'group':f['group'],'variant':variant,**res})
 (p/'evidence/player-mask-paths.json').write_text(json.dumps(out));summary=[]
 for f in frames:
  a,b=[x for x in out if x['file']==f['file']];summary.append({'file':f['file'],'group':f['group'],'before_safe':sum(x['clearance']>3 for x in a['paths']),'after_safe':sum(x['clearance']>3 for x in b['paths']),'before_dir':a['decision']['name'],'after_dir':b['decision']['name'],'changed':a['decision']['name']!=b['decision']['name']})
 (p/'evidence/player-mask-path-summary.json').write_text(json.dumps({'limits':'Static fullimage pipeline resettracking eachframe; originalpixel-derived speed/velocity andcurrentheading reused both variants. Not exacthistoricalcontroller, notactualfuture safety; no truthinput. Alloriginalsafetythresholds unchanged.','rows':summary},indent=2));print('rows',len(summary));print([s for s in summary if s['group']=='calibration']);print('heldoutchanged',sum(s['changed'] for s in summary if s['group']=='heldout'))
finally:d.quit()
