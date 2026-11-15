import json,math,statistics as st
from pathlib import Path
from datetime import datetime,timezone,timedelta
p=Path('/home/gg/projects/ocr3');src=p/'evidence/deterministic-clearancepriority-unseen.json';runs=json.load(open(src))['runs'];out=[]
for run in runs:
 if run['variant']!='A':continue
 rows=[s for s in run['samples'] if s.get('decision')];episodes=[];last_end=-10
 for i,s in enumerate(rows[:-6]):
  d=s['decision'];a=d['decision'];o=a.get('target');t=s['logical_ms']/1000;r=d['r']
  if t<last_end+2 or r<60 or not o or not o.get('npc') or o.get('mapOnly') or o['r']<r*.4 or o['r']>=r*.91:continue
  gap=math.hypot(o['x'],o['y'])-.7*(r+o['r'])
  if not 0<=gap<=80:continue
  # Follow observed component only; no truth identity, radius tolerance and displacement gate.
  q=o;track=[]
  for ss in rows[i+1:i+11]:
   dd=ss['decision'];aa=dd['decision'];tt=ss['logical_ms']/1000
   cand=[z for z in dd['objects'] if z['npc'] and abs(z['r']-q['r'])<max(6,q['r']*.2) and math.hypot(z['x']-q['x'],z['y']-q['y'])<130]
   z=min(cand,key=lambda z:math.hypot(z['x']-q['x'],z['y']-q['y'])) if cand else None
   track.append({'t':round(tt,3),'r':dd['r'],'match':z,'escaping':aa['escaping'],'recovering':aa['recovering'],'target':aa.get('target'),'heading':aa['name'],'clearance':aa['clearance']})
   if z:q=z
  if not track:continue
  growth=max(x['r'] for x in track)-r
  episodes.append({'t':round(t,3),'r':r,'target':o,'gap':gap,'heading':a['name'],'escape':a['escaping'],'recover':a['recovering'],'clearance':a['clearance'],'growth_next2s':growth,'missing_frames':sum(x['match'] is None for x in track),'blocked_frames':sum(bool(x['match'] and x['match']['blocked']) for x in track),'escape_frames':sum(x['escaping'] for x in track),'track':track});last_end=t
 out.append({k:run[k] for k in ['version','seed','initial_phase_ms']}|{'episodes':episodes})
summary={}
for v in sorted(set(x['version'] for x in out)):
 ee=[e for x in out if x['version']==v for e in x['episodes']];summary[v]={'episodes':len(ee),'growth':sum(e['growth_next2s']>0 for e in ee),'no_growth':sum(e['growth_next2s']<=0 for e in ee),'no_growth_missing':sum(e['growth_next2s']<=0 and e['missing_frames']>0 for e in ee),'no_growth_blocked':sum(e['growth_next2s']<=0 and e['blocked_frames']>0 for e in ee),'no_growth_escape':sum(e['growth_next2s']<=0 and e['escape_frames']>0 for e in ee)}
result={'at':datetime.now(timezone(timedelta(hours=8))).isoformat(),'source':str(src),'scope':'Existing 16 baseline A runs only; r>=60 medium chosen target .4-.91r gap0..80, starts separated>=2s, follow2s using approximate visible-component matching. No hidden state. HUD growth does not identify prey; disappearance not proof eaten/occluded; samples correlated. No gameplay or intervention.','summary':summary,'runs':out}
(p/'evidence/capture-loss-audit.json').write_text(json.dumps(result,indent=2));print(json.dumps(summary));
for x in out:
 for e in x['episodes']:
  if e['growth_next2s']<=0: print(x['version'],x['seed'],x['initial_phase_ms'],e['t'],e['r'],round(e['target']['r'],1),'missing',e['missing_frames'],'blocked',e['blocked_frames'],'escape',e['escape_frames'])
