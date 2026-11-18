import json,base64,io
import numpy as np
from PIL import Image
from pathlib import Path
x=json.load(open('r65/live-raw-local.json'));ims=[x['decisionRing']['frames'][-1],x['images'][-1]];rows=[]
for rg in [12,15,18]:
 for bg in [5,8,11]:
  values=[]
  for f in ims:
   a=np.array(Image.open(io.BytesIO(base64.b64decode(f['png'].split(',')[1]))))[:,:,:3].astype(int);h,w=a.shape[:2];r,g,b=a[:,:,0],a[:,:,1],a[:,:,2];mask=(r>g+rg)&(b>g+bg)&(r>b+4)&(r>100);ys=np.flatnonzero(mask.sum(axis=1)>=w*.025);values.append(float(ys[0]*698/h) if len(ys) else None)
  rows.append({'redGreen':rg,'blueGreen':bg,'topY':values,'topShift':values[1]-values[0]})
Path('r66/sensitivity.json').write_text(json.dumps(rows,indent=2));print('terminal top shifts range',min(x['topShift'] for x in rows),max(x['topShift'] for x in rows))
