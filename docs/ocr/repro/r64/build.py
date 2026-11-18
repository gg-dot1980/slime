from pathlib import Path
import json,base64,hashlib,shutil,argparse
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--raw-dir',type=Path);args=parser.parse_args();root=Path(__file__).resolve().parent.parent;out=args.output;out.mkdir(parents=True,exist_ok=True);p=root/'r64';raw=args.raw_dir or root/'r60'
s=(root/'r45-source/Current.js').read_text();audit=s.replace(',parts=rawParts.filter(', ',contained=rawParts.filter(',1).replace(')).filter(p=>!isPlayerComponent', ')),parts=contained.filter(p=>!isPlayerComponent',1)
audit=audit.replace('if(map){map.viewWidth=',"window.stageAudit={rawParts,contained,parts,stages:rawParts.map(p=>({p,contained:contained.includes(p),kept:parts.includes(p),player:isPlayerComponent(p,r,w/2,h/2)}))};if(map){map.viewWidth=",1).replace('window.makeCurrent=', 'window.makeAudited=',1)
assert audit!=s and ',parts=contained.filter' in audit
(p/'Audited.js').write_text(audit);shutil.copy(p/'Audited.js',out/'r64-audit.js');shutil.copy(root/'r45-source/Current.js',out/'r64-original.js')
fixtures=[]
for g in ['A','B']:
 d=json.loads((raw/f'{g}-raw-local.json').read_text())
 for i in [-2,-1]:
  im=d['images'][i];b=base64.b64decode(im['png'].split(',')[-1]);name=f'r64-{g}-{i}.png';(out/name).write_bytes(b)
  fixtures.append({'name':name,'radius':float(im['size']),'ms':im['ms'],'sha256':hashlib.sha256(b).hexdigest()})
(p/'fixtures.json').write_text(json.dumps(fixtures,indent=2));(out/'r64-fixtures.json').write_text(json.dumps(fixtures))
html='''<!doctype html><title>r64 original ImageData stage audit</title><button id="run">Run fixed four images</button><button id="save" disabled>Save numerical results</button><pre id="status">Ready; no game or keys</pre><script src="r64-original.js"></script><script src="r64-audit.js"></script><script>
let results;run.onclick=async()=>{try{const fixtures=await(await fetch('r64-fixtures.json')).json();results={ua:navigator.userAgent,rows:[]};for(const f of fixtures){const im=new Image();im.src=f.name;await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.style.width=c.width+'px';document.body.append(c);c.getContext('2d').drawImage(im,0,0);const a=makeCurrent().readImage(c,f.radius,100),b=makeAudited().readImage(c,f.radius,100);results.rows.push({fixture:f,width:c.width,height:c.height,outputsEqual:JSON.stringify(a)===JSON.stringify(b),analysis:b,audit:structuredClone(stageAudit)});c.remove();}status.textContent=JSON.stringify(results);save.disabled=false;}catch(e){status.textContent=String(e.stack)}};save.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(results)],{type:'application/json'}));a.download='r64-browser-results.json';a.click()};
</script>'''.replace('status.textContent','document.getElementById("status").textContent')
(p/'fixture.html').write_text(html);(out/'r64.html').write_text(html)
