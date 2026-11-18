import json,math,statistics
from pathlib import Path
from PIL import Image
p=Path('r54');p.joinpath('plan.json').write_text(json.dumps({'hypothesis':'Visible orthogonal wall displacement can distinguish sustained tangent movement from decaying inertia when the contact wall stays fixed.','fixed':'All13 r50 contact intervals; image17 and terminal18; r46 contact data as orthogonal-wall availability countercheck','timing':'Use actual previous decision for interval; acknowledge capture/actuation offsets and 6.667px wall quantization. No identity truth.'},indent=2))
x=json.load(open('r50/game.json'));rs=sorted(x['rows']+x['rejected'],key=lambda r:r['ms']);contact={a['ms'] for a in json.load(open('r50/contact-observations.json'))};out=[]
for n,r in enumerate(rs):
 if r['ms'] not in contact:continue
 prev=rs[n-1];w=r['map']['visibleWalls'];pw=prev['map']['visibleWalls'];dt=(r['ms']-prev['ms'])/1000;d=prev['direction'];dx=pw[1]-w[1];obs=dx/dt;priorV=None
 if n>1:
  pp=rs[n-2];ww=pp['map'].get('visibleWalls');dd=(prev['ms']-pp['ms'])/1000
  if ww and ww[1] is not None:priorV=(ww[1]-pw[1])/dd
 pred=None
 if priorV is not None:
  # Continuous equivalent of frozen planner 0.35 velocity update each 0.1s.
  rate=-math.log(.65)/.1;goal=d['x']*prev['speed'];pred=goal*dt+(priorV-goal)*(1-math.exp(-rate*dt))/rate
 out.append({'ms':r['ms'],'dt':dt,'command':d,'wallNormalDelta':w[3]-pw[3],'observedTangentDelta':dx,'observedAvgTangentVelocity':obs,'priorIntervalVelocity':priorV,'inertiaPredictedDelta':pred,'constantCommandDelta':d['x']*prev['speed']*dt,'actuationOffsetMs':prev.get('recordAt',prev['ms'])-prev['ms']})
# Independently locate vertical wall lines from stored source PNGs using existing fixed wall-color rule.
imageChecks=[]
for name in ['17','18']:
 im=Image.open('r50/images/'+name+'.png').convert('RGB');W,H=im.size;px=im.load();cols=[]
 for xx in range(W//2,W):
  count=sum(1 for yy in range(0,H,4) if (lambda a,b,c:40<=a<=95 and 85<=b<=150 and 75<=c<=140 and 30<=b-a<=60 and 5<=b-c<=20)(*px[xx,yy]))
  if count/len(range(0,H,4))>=.55:cols.append(xx)
 imageChecks.append({'image':name,'wallColumns':cols,'center':statistics.mean(cols) if cols else None})
valid=[r for r in out if r['inertiaPredictedDelta'] is not None];summary={'intervals':len(out),'normalUnchanged':sum(r['wallNormalDelta']==0 for r in out),'tangentCommandIntervals':sum(abs(r['command']['x'])>.1 for r in out),'zeroTangentCommand':[{k:r[k] for k in ['ms','observedTangentDelta','inertiaPredictedDelta','constantCommandDelta']} for r in out if abs(r['command']['x'])<.1],'inertiaMedianAbsError':statistics.median(abs(r['inertiaPredictedDelta']-r['observedTangentDelta']) for r in valid),'constantMedianAbsError':statistics.median(abs(r['constantCommandDelta']-r['observedTangentDelta']) for r in valid),'imageChecks':imageChecks,'imageTangentDelta':imageChecks[0]['center']-imageChecks[1]['center']}
p.joinpath('result.json').write_text(json.dumps({'summary':summary,'intervals':out},indent=2));print(json.dumps(summary,indent=2))
