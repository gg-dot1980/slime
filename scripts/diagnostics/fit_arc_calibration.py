from pathlib import Path
import json,math,statistics as st
p=Path('/home/gg/projects/ocr3')
def fit(ps):
 if len(ps)<6:return None
 mx=st.mean(x for x,y in ps);my=st.mean(y for x,y in ps);rows=[[x-mx,y-my,1] for x,y in ps];z=[-(x*x+y*y) for x,y,_ in rows];a=[[sum(r[i]*r[j] for r in rows) for j in range(3)]+[sum(r[i]*q for r,q in zip(rows,z))] for i in range(3)]
 for i in range(3):
  k=max(range(i,3),key=lambda k:abs(a[k][i]));a[i],a[k]=a[k],a[i]
  if abs(a[i][i])<1e-8:return None
  v=a[i][i];a[i]=[x/v for x in a[i]]
  for j in range(3):
   if j!=i:
    v=a[j][i];a[j]=[x-v*y for x,y in zip(a[j],a[i])]
 A,B,C=[a[i][3] for i in range(3)];cx=mx-A/2;cy=my-B/2;r2=(A*A+B*B)/4-C
 if r2<=0:return None
 r=math.sqrt(r2);res=[abs(math.hypot(x-cx,y-cy)-r) for x,y in ps];angles=sorted(math.atan2(y-cy,x-cx) for x,y in ps);gaps=[b-a for a,b in zip(angles,angles[1:])]+[angles[0]+2*math.pi-angles[-1]];coverage=2*math.pi-max(gaps)
 return {'x':cx,'y':cy,'r':r,'residual_median':st.median(res),'residual_max':max(res),'coverage_degrees':coverage*180/math.pi,'arc_points':len(ps)}
xs=json.load(open(p/'evidence/arc-static-audit.json'));rs=json.load(open(p/'evidence/early-birth-policy-audit.json'))['runs'];ts={r['seed']:[t for s in r['samples'] for t in s['timer_trace'] if t['observation']] for r in rs};out=[]
for e in xs:
 estimates=[{'component':c,'fit':fit(c['arc'])} for c in e['components']]
 # Truth only used after all fits to score an existing case, never for fitting.
 if 'early-birth' not in e['file']:out.append({'file':e['file'],'variant':e['variant'],'estimates':estimates});continue
 seed,ms=map(int,e['file'].replace('.png','').split('-')[-2:]);t=next(t for t in ts[seed] if abs(t['actual']-ms)<1);id=156 if seed==12007 else 151;q=next(q for q in t['audit']['npcs'] if q['id']==id);cx=(q['x']+1000)*.6;cy=(q['y']+t['audit']['vh']/2)*.6
 nearby=[z for z in estimates if z['component']['r']>50];z=min(nearby,key=lambda z:math.hypot(z['component']['x']-cx,z['component']['y']-cy));f=z['fit'];row={'file':e['file'],'variant':e['variant'],'truth':q,'component':z['component'],'fit':f,'centroid_error':math.hypot(z['component']['x']-cx,z['component']['y']-cy)/.6,'fit_center_error':math.hypot(f['x']-cx,f['y']-cy)/.6 if f else None,'fit_radius_error':f['r']/.6-q['r'] if f else None};out.append(row);print(e['variant'],ms,'center',round(row['centroid_error']),round(row['fit_center_error']) if f else None,'radius_err',round(row['fit_radius_error']) if f else None,'coverage',round(f['coverage_degrees']) if f else None,'res',round(f['residual_median'],1) if f else None)
(p/'evidence/arc-calibration-summary.json').write_text(json.dumps({'scope':'Saved images only; circle fitted to visible convex hull points, frame edges excluded; truth used for posterior scoring only. No game/controller changes.','rows':out},indent=2))
