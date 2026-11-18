import json,base64,io,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
x=json.load(open('r65/live-raw-local.json'));out=[]
for f in x['decisionRing']['frames']:
 b=base64.b64decode(f['png'].split(',')[1]);a=np.array(Image.open(io.BytesIO(b)))[:,:,:3].astype(int);r,g,bl=a[:,:,0],a[:,:,1],a[:,:,2];pink=(r>g+15)&(bl>g+8)&(r>bl+4)&(r>100);orange=(r>g+20)&(g>bl+15)&(r>100);h,w=orange.shape
 # Fixed lower arena ROI excludesminimap and labels above bodies; color rulesare diagnostic,not IDs.
 orange[:300]=False;pink[:300]=False;orange[:,1050:]=False;pink[:,1050:]=False
 cols=[]
 for j in range(w):
  oy=np.flatnonzero(orange[:,j]);py=np.flatnonzero(pink[:,j]);
  if len(oy)>=20 and len(py)>=20:cols.append({'x':j,'orangeBottom':int(oy[-1]),'pinkTop':int(py[0]),'gap':int(py[0]-oy[-1])})
 out.append({'seq':f['seq'],'captureEnd':f['capture']['end'],'sourceSha256':hashlib.sha256(b).hexdigest(),'sharedColumns':len(cols),'nearColumns':sum(c['gap']<=3 for c in cols),'minimumGap':min((c['gap'] for c in cols),default=None),'orangeArea':int(orange.sum()),'columns':cols})
Path('r67/measurements.json').write_text(json.dumps(out,indent=2));print([(r['seq'],r['sharedColumns'],r['nearColumns'],r['minimumGap']) for r in out])
