from pathlib import Path
import argparse,shutil,json,subprocess,sys
p=Path(__file__).resolve().parent
a=argparse.ArgumentParser();a.add_argument('--output',type=Path,default=p/'dist');d=a.parse_args().output.resolve();d.mkdir(parents=True,exist_ok=True)
for name in ['index.html','Current.js','Archived.js','Telemetry.js','frames.json','r46-baseline.html','r46-record.js','r50-game.html','r50-record.js','r50.html']:
 shutil.copy2(p/name,d/name)
shutil.copytree(p/'v2.20',d/'v2.20',dirs_exist_ok=True)
(d/'api').mkdir(exist_ok=True);(d/'api/versions').write_text(json.dumps({'currentVersion':'v2.20 bundled snapshot','currentPath':'/v2.20/','versions':[{'version':'v2.20','path':'/v2.20/','current':True}]}))
subprocess.run([sys.executable,str(p/'r50/build.py'),'--output',str(d)],check=True)
# Explicit missing fixture status; no substitute images or false pass.
f=d/'r50.html';s=f.read_text().replace("for(const f of await(await fetch('frames.json')).json()){","for(const f of await(await fetch('frames.json')).json()){if(!(await fetch('frames/'+f.file,{method:'HEAD'})).ok)throw Error('FIXTURE_UNAVAILABLE: image records intentionally excluded; provide local fixtures');");f.write_text(s)
print(json.dumps({'output':str(d),'game':'v2.20','fixtureImagesIncluded':False}))