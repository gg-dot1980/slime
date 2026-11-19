import json
from pathlib import Path
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--evidence-root',type=Path,required=True,help='Local evidence root containing r209, r161 and resume-20261119')
parser.add_argument('--output',type=Path,required=True,help='Local-only output directory; do not upload generated pixels')
a=parser.parse_args();b=a.evidence_root;p=b/'resume-20261119/visible-approach-1';out=[]
for stage,lo,hi,file in [('new',447,451,p.parent/'batched-recorder-1/live-results/trial-raw-local.json'),('success209',229,232,b/'r209/A-raw-local.json'),('success161',143,145,b/'r161/A-raw-local.json')]:
 d=json.loads(file.read_text());rows={r['r65Seq']:r for r in d['rows']}
 for f in d['decisionRing']['frames']:
  seq=f['seq']
  if lo<=seq<=hi:
   r=rows[seq];out.append({'group':stage,'seq':seq,'png':f['png'],'capture':f['capture'],'rowMs':r['ms'],'hud':r['hud'],'objects':r['objects'],'direction':r['direction'],'walls':r['planInput']['map'].get('visibleWalls'),'gain':r['gain']})
for i in range(4):
 for j,f in enumerate(json.loads((p.parent/f'batched-recorder-1/live-results/window-part-{i}.json').read_text())['frames']):out.append({'group':'window','seq':i*3+j,'pngBytes':f['png'],'capture':{'start':f['start']},'objects':[]})
a.output.mkdir(parents=True,exist_ok=True)
assert len(out)==24, f'Expected24 samples, got{len(out)}'
(a.output/'visible-approach-samples.json').write_text(json.dumps(out))
print(json.dumps({'samples':len(out),'containsPixels':True,'localOnly':True}))
