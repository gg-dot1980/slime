import json,math,statistics as st
from pathlib import Path
from datetime import datetime,timezone,timedelta
p=Path('/home/gg/projects/ocr3');src=p/'evidence/deterministic-escapehold-unseen.json';runs=json.load(open(src))['runs'];out=[]
def med(x):return round(st.median(x),2) if x else None
for run in runs:
 if run['variant']!='A':continue
 rows=[];prev=None
 for e in run['samples']:
  d=e.get('decision');t=e['logical_ms']/1000
  if not d:continue
  a=d['decision'];objs=d['objects'];r=d['r'];th=[o for o in objs if o['npc'] and (o['clipped'] or o['isRed'] or o['r']>=r*.98)];meals=[o for o in objs if o['npc'] and not(o['clipped'] or o['blocked'] or o['isRed']) and r*.4<=o['r']<r*.91];tar=a.get('target');mv=None
  if prev:
   pt,pd=prev;dt=t-pt;sh=[]
   for o in objs:
    if o['npc']:continue
    cs=[q for q in pd['objects'] if not q['npc'] and abs(q['r']-o['r'])<3];q=min(cs,key=lambda q:math.hypot(q['x']-o['x'],q['y']-o['y'])) if cs else None
    if q and math.hypot(q['x']-o['x'],q['y']-o['y'])<100:sh.append(((q['x']-o['x'])/dt,(q['y']-o['y'])/dt))
   if len(sh)>=3:
    mx,my=st.median(z[0] for z in sh),st.median(z[1] for z in sh);err=st.median(math.hypot(x-mx,y-my) for x,y in sh)
    if err<25:mv=math.hypot(mx,my)
  prev=t,d
  near=[o for o in th if math.hypot(o['x'],o['y'])<.75*(r+o['dangerRadius'])+200]
  rows.append({'t':t,'r':r,'escape':a['escaping'],'recover':a['recovering'],'threats':len(th),'near':len(near),'meals':len(meals),'selected_medium':bool(tar and tar.get('npc') and not tar.get('mapOnly') and tar['r']>=r*.4),'food':bool(tar and not tar.get('npc')),'map':bool(tar and tar.get('mapOnly')),'move':mv,'threat_speed':med([math.hypot(o['vx'],o['vy']) for o in near]),'clearance':a['clearance']})
 group={}
 for stage,rr in [('all',rows),('r90plus',[x for x in rows if x['r']>=90]),('last5',[x for x in rows if x['t']>=rows[-1]['t']-5])]:
  n=len(rr);has=[x for x in rr if x['meals']];group[stage]={'n':n,'escape_fraction':sum(x['escape'] for x in rr)/n if n else None,'recover_fraction':sum(x['recover'] for x in rr)/n if n else None,'medium_visible_fraction':len(has)/n if n else None,'medium_selected_given_visible':sum(x['selected_medium'] for x in has)/len(has) if has else None,'food_selected_given_medium':sum(x['food'] for x in has)/len(has) if has else None,'camera_speed_median':med([x['move'] for x in rr if x['move'] is not None]),'camera_speed_n':sum(x['move'] is not None for x in rr),'nearest_threat_est_speed_median':med([x['threat_speed'] for x in rr if x['threat_speed'] is not None]),'near_threats_median':med([x['near'] for x in rr]),'clearance_median':med([x['clearance'] for x in rr])}
 out.append({**{k:run[k] for k in ['version','seed','initial_phase_ms']},'end_t':rows[-1]['t'],'end_size':rows[-1]['r'],'ending':run['samples'][-1].get('title'),'groups':group})
result={'at':datetime.now(timezone(timedelta(hours=8))).isoformat(),'source':str(src),'scope':'Offline existing baseline A traces only,16 games,4/version; no new games or acceptance. Food-nearest-neighbour camera speed requires3 matches and median vector deviation<25; may be ambiguous and is screen camera not calibrated true player speed at walls. Threat speeds are existing controller estimates capped per component200, not independent ground truth. Medium visible excludes clipped/red/blocked and radius .4-.91player; not evidence of safely reachable missed meal. Samples correlated; no causal inference.','runs':out}
(p/'evidence/motion-growth-tradeoff-summary.json').write_text(json.dumps(result,indent=2))
for x in out: print(x['version'],x['seed'],x['initial_phase_ms'],x['end_size'],json.dumps(x['groups']['r90plus']), 'last5escape',x['groups']['last5']['escape_fraction'])
