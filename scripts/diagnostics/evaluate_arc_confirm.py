from pathlib import Path
import json,math,statistics as st
p=Path('/home/gg/projects/ocr3');exec((p/'fit_arc_calibration.py').read_text().split('xs=json.load')[0]);data=json.load(open(p/'evidence/arc-confirm-static.json'));frames={e['file']:e['components'] for e in data};runs=json.load(open(p/'evidence/arc-confirm-policy-audit.json'))['runs'];output=[];corrections=[]
def median(xs):return st.median(xs) if xs else None
for run in runs:
 sequence=[t for s in run['samples'] for t in s['timer_trace'] if t.get('pixel_file')]
 for variant in ['baseline','gated_center']:
  previous=[];last_ms=None;nextid=0;oldtruth={};records=[]
  for t in sequence:
   r=t['observation']['r'];camera=t['observation']['velocity'];dt=(t['actual']-last_ms)/1000 if last_ms else .2;last_ms=t['actual'];cs=frames[t['pixel_file']];objects=[];truth=t['audit']['npcs'];vw=t['audit']['vw'];vh=t['audit']['vh']
   for c in cs:
    if c['r']<=30 or math.hypot(c['x']/0.6-vw/2,c['y']/0.6-vh/2)<r*.7:continue
    f=fit(c['arc']);gate=bool(c['clipped'] and f and len(c['arc'])>=8 and 150<=f['coverage_degrees']<=340 and f['residual_median']<=.03*f['r'] and .7<=f['r']/c['r']<=1.8 and math.hypot(f['x']-c['x'],f['y']-c['y'])<=.6*f['r']);x=c['x']/.6-vw/2;y=c['y']/.6-vh/2
    if gate and variant=='gated_center':
     xx=f['x']/.6-vw/2;yy=f['y']/.6-vh/2
     q=min(truth,key=lambda q:math.hypot(q['x']-x,q['y']-y));before=math.hypot(q['x']-x,q['y']-y);after=math.hypot(q['x']-xx,q['y']-yy);corrections.append({'version':run['version'],'ms':t['actual'],'file':t['pixel_file'],'before_error':before,'after_error_same_truth':after,'baseline_nearest_truth_id':q['id'],'truth_radius':q['r'],'component_radius':c['r']/.6,'fit':f});x,y=xx,yy
    objects.append({'x':x,'y':y,'r':c['r']/.6,'ax':c['x']/.6-vw/2,'ay':c['y']/.6-vh/2,'hue':c['hue'],'corrected':gate and variant=='gated_center'})
   # Association uses visual coordinates/radius and visual camera estimate only.
   used=set()
   for o in objects:
    candidates=[(i,q) for i,q in enumerate(previous) if i not in used and abs(q['r']-o['r'])<=max(6,.2*o['r'])];candidates.sort(key=lambda z:math.hypot(z[1]['ax']+(z[1]['rawvx']-camera['x'])*dt-o['ax'],z[1]['ay']+(z[1]['rawvy']-camera['y'])*dt-o['ay']));match=None
    if candidates:
     i,q=candidates[0]
     if math.hypot(q['ax']+(q['rawvx']-camera['x'])*dt-o['ax'],q['ay']+(q['rawvy']-camera['y'])*dt-o['ay'])<100:match=q;used.add(i)
    if match:
     dx=o['ax']-match['ax'];dy=o['ay']-match['ay'];rawvx=max(-200,min(200,.65*match['rawvx']+.35*(dx/dt+camera['x'])));rawvy=max(-200,min(200,.65*match['rawvy']+.35*(dy/dt+camera['y'])))
     if o['corrected'] and match['corrected']:dx=o['x']-match['x'];dy=o['y']-match['y']
     o.update(id=match['id'],rawvx=rawvx,rawvy=rawvy,vx=max(-200,min(200,.65*match['vx']+.35*(dx/dt+camera['x']))),vy=max(-200,min(200,.65*match['vy']+.35*(dy/dt+camera['y']))))
    else:nextid+=1;o.update(id=nextid,vx=0,vy=0,rawvx=0,rawvy=0)
    # Posterior scoring only, not used above. Nearest-center attribution remains ambiguous.
    q=min(truth,key=lambda q:math.hypot(q['x']-o['x'],q['y']-o['y']));err=math.hypot(q['x']-o['x'],q['y']-o['y']);valid=err<80;switch=bool(valid and o['id'] in oldtruth and oldtruth[o['id']]!=q['id']);
    if valid:oldtruth[o['id']]=q['id']
    records.append({'ms':t['actual'],'track':o['id'],'matched':bool(match),'truth_valid':valid,'center_error':err,'velocity_error':math.hypot(q['vx']-o['vx'],q['vy']-o['vy']) if valid and match else None,'identity_switch_proxy':switch,'corrected':o['corrected']})
   previous=objects
  output.append({'version':run['version'],'variant':variant,'n_frames':len(sequence),'records':records,'summary':{'objects':len(records),'tracks_created':nextid,'center_median':median([x['center_error'] for x in records]),'center_within80':sum(x['truth_valid'] for x in records),'velocity_median_matched':median([x['velocity_error'] for x in records if x['velocity_error'] is not None]),'identity_switch_proxy':sum(x['identity_switch_proxy'] for x in records)}})
result={'scope':'Frozen rawidentity method onnewseed2467 phase100; identityassociatedusingrawpixelcoords/rawvelocity, correctedvelocityonlywithconsecutiveconfidence. Independentof1237 tuningcases. Frozen geometrygate on v20/v21 seed2467 phase100; replay parity checked separately. Raw accepted NPC-sized components, not fullcontrollerpartfilter. Trackassociation pixelonly; truth onlyposterior, nearestcenter identities ambiguous. No causalgameperformanceclaim. Preserveoriginalradius.','groups':output,'corrections':corrections,'decision':'Hold for analysis; no gameplaystrategybatch.'};(p/'evidence/arc-confirm-evaluation.json').write_text(json.dumps(result,indent=2));print(json.dumps([{k:v for k,v in o.items() if k!='records'} for o in output],indent=2));print('corrections',len(corrections),'worse20',sum(c['after_error_same_truth']>c['before_error']+20 for c in corrections));print('worst',sorted(corrections,key=lambda c:-(c['after_error_same_truth']-c['before_error']))[:3])
