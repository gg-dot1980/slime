import json,base64,io,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
x=json.load(open('r65/live-raw-local.json'));frames=x['decisionRing']['frames']+[{'seq':'terminal','png':x['images'][-1]['png'],'capture':{'end':x['images'][-1]['ms']}}];out=[]
for f in frames:
 b=base64.b64decode(f['png'].split(',')[1]);im=Image.open(io.BytesIO(b));a=np.array(im)[:,:,:3].astype(int);h,w=a.shape[:2];r,g,bl=a[:,:,0],a[:,:,1],a[:,:,2];pink=(r>g+15)&(bl>g+8)&(r>bl+4)&(r>100);wall=(r>=40)&(r<=95)&(g>=85)&(g<=150)&(bl>=75)&(bl<=140)&(g-r>=30)&(g-r<=60)&(g-bl>=5)&(g-bl<=20)
 # Fixed wide-row criterion excludes isolated labels/dots. No resize or inferred offscreen pixels.
 ys=np.flatnonzero(pink.sum(axis=1)>=w*.025);wy=np.flatnonzero(wall.sum(axis=1)>=w*.25);py,px=np.nonzero(pink);sx=1200/w;sy=698/h
 top=float(ys[0]*sy) if len(ys) else None;wallY=float(np.median(wy)*sy) if len(wy) else None
 # Horizontal grid phase: top strip, exclude minimap; shift modulo96px is ambiguous bywholeperiods.
 col=a[:int(h*.15),:int(w*.85),:].mean(axis=(0,2));base=np.median(col);peaks=np.flatnonzero(col>base+1.5);phases=[float(i*sx%96) for i in peaks];
 out.append({'seq':f['seq'],'captureEnd':f['capture']['end'],'sourceSha256':hashlib.sha256(b).hexdigest(),'width':w,'height':h,'pinkPixelCount':int(pink.sum()),'pinkTopAnalysisY':top,'wallAnalysisY':wallY,'pinkTopRelativeWall':top-wallY if top is not None and wallY is not None else None,'pinkNearestCenterPx':float(np.min(np.hypot(px*sx-600,py*sy-349))) if len(px) else None,'gridPhaseSamples':phases[:150]})
Path('r66/measurements.json').write_text(json.dumps(out,indent=2));print([(r['seq'],round(r['pinkTopAnalysisY'],1),round(r['wallAnalysisY'],1),round(r['pinkTopRelativeWall'],1),round(r['pinkNearestCenterPx'],1)) for r in out])
