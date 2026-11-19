"""Independent optional pixel-decoder check; local images never leave the host."""
import base64,hashlib,io,json,sys
from PIL import Image,__version__
samples=json.load(open(sys.argv[1]));result=json.load(open(sys.argv[2]));checks=[]
for s,r in zip(samples,result['rows'],strict=True):
 assert (s['group'],s['seq'])==(r['group'],r['seq'])
 rgba=Image.open(io.BytesIO(base64.b64decode(s['png'].split(',')[1]))).convert('RGBA').tobytes()
 checks.append(hashlib.sha256(rgba).hexdigest()==r['rgbaSha256'])
assert len(checks)==12 and all(checks)
print(json.dumps({'pillow':__version__,'passed':sum(checks),'total':len(checks)}))
