"""Retrospective image test; PNGs local only. Numerical replay: python replay.py."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
p=Path(__file__).parent
out=[]
for name in [str(i) for i in range(293,305)]+['terminal']:
 f=p/(name+'-local.png');a=np.array(Image.open(f).convert('RGB'));h,w=a.shape[:2]
 # Fixed normalized player-right ROI, same thresholds all 13 images.
 x0,x1=round(w*640/1200),round(w*680/1200);y0,y1=round(h*330/698),round(h*370/698)
 b=a[y0:y1,x0:x1].astype(int);r,g,bl=b[:,:,0],b[:,:,1],b[:,:,2]
 purple=(bl-g>15)&(r-g>5)&(bl>r+5)&(r>60)
 # Broad visible horizontal wall colour; median row in lower half.
 b=a[h//2:,:w//4].astype(int);r,g,bl=b[:,:,0],b[:,:,1],b[:,:,2]
 mask=(g-r>20)&(g-bl>8)&(g>65);counts=mask.sum(axis=1)
 ys=np.where(counts>w*.15)[0]+h//2
 out.append(dict(frame=name,purpleRoiFraction=float(purple.mean()),wallY=float(np.median(ys)*698/h) if len(ys) else None,pngSha256=hashlib.sha256(f.read_bytes()).hexdigest()))
(p/'measurements.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))

# Reproduce the explicit translation sensitivity, without interpreting it as a bound.
a=np.array(Image.open(p/"304-local.png").convert("RGB")).astype(int)
checks=[]
for dx in [-40,-20,0,20,40]:
 b=a[352:392,640+dx:680+dx];r,g,bl=b[:,:,0],b[:,:,1],b[:,:,2]
 checks.append(float(((bl-g>15)&(r-g>5)&(bl>r+5)&(r>60)).mean()))
assert checks==json.loads((p/"inputs.json").read_text())["translationSensitivity"]["priorPurpleFractions"]
print("translation sensitivity verified",checks)
