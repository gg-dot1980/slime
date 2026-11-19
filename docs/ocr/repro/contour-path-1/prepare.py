"""Prepare private inputs; never upload the generated JSON."""
import argparse,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
files={'new':(a.root/'resume-20261119/batched-recorder-1/live-results/trial-raw-local.json',447,451),'success209':(a.root/'r209/A-raw-local.json',229,232),'success161':(a.root/'r161/A-raw-local.json',143,145)}
out=[]
for group,(path,lo,hi) in files.items():
 d=json.loads(path.read_text());rows={r['r65Seq']:r for r in d['rows']}
 for f in d['decisionRing']['frames']:
  seq=f['seq']
  if lo<=seq<=hi:
   r=rows[seq];out.append(dict(group=group,seq=seq,png=f['png'],capture=f['capture'],hud=r['hud'],objects=r['objects'],direction=r['direction'],walls=r['planInput']['map'].get('visibleWalls'),speed=r['speed']))
assert len(out)==12
a.output.write_text(json.dumps(out));print('12 local-only samples prepared')
