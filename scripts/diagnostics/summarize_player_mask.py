from pathlib import Path
import json,math,statistics as st
p=Path('/home/gg/projects/ocr3');j=json.load(open(p/'evidence/player-mask-static.json'));rows=[]
for f in j['frames']:
 for n in f['truth']:
  if n['r']<20 or abs(n['x'])>950 or abs(n['y'])>530:continue
  near=math.hypot(n['x'],n['y'])<f['r']+n['r']+80
  if not near:continue
  pair={}
  for v in ['before','after']:
   candidates=[]
   for o in f[v]:
    x=o['x']/.6-1000;y=o['y']/.6-581.6666666667;r=o['r']/.6
    if r<20:continue
    # remove clear player component for proxy matching; sameoriginalheuristic.
    if math.hypot(x,y)<=f['r']*.65 and f['r']*.45<=r<=f['r']*1.55:continue
    dist=math.hypot(x-n['x'],y-n['y']);score=dist+abs(r-n['r']);candidates.append((score,dist,r))
   best=min(candidates,default=(1e9,1e9,0));pair[v]={'center_error':best[1],'radius':best[2],'matched':best[1]<=max(30,n['r']*.3) and .5*n['r']<=best[2]<=1.8*n['r']}
  rows.append({'file':f['file'],'group':f['group'],'id':n['id'],'true_r':n['r'],'player_r':f['r'],'danger':n['r']>=f['r']*1.08,**pair})
groups={}
for group in ['calibration','heldout']:
 rr=[x for x in rows if x['group']==group];groups[group]={'frames':sum(f['group']==group for f in j['frames']),'near_npc_observations':len(rr),'before_matched':sum(x['before']['matched'] for x in rr),'after_matched':sum(x['after']['matched'] for x in rr),'lost_previously_matched':sum(x['before']['matched'] and not x['after']['matched'] for x in rr),'danger_observations':sum(x['danger'] for x in rr),'lost_danger':sum(x['danger'] and x['before']['matched'] and not x['after']['matched'] for x in rr),'after_matched_median_abs_radius_error':st.median(abs(x['after']['radius']-x['true_r']) for x in rr if x['after']['matched']) if any(x['after']['matched'] for x in rr) else None}
r={'method':j['method'],'groups':groups,'rows':rows,'limits':'Rawcomponent proxy nearesttruth matching after playerfilter, not fullproductionclassification/tracking. Truthscore onlyoffline. Heldout2trajectories v13/v22, correlatedframes, no v20/v21 nearplayerdanger corpus; no safeclosedloop proof. Maskhidesoccludedparts, mayunderestimateradius.','decision':'Calibration restores separateprey in2mergedframes, thirdunchanged. Need independentnearplayerdanger overlaps and fullpipeline safety before intervention; do notclaim62frames means62independentcases.'};(p/'evidence/player-mask-summary.json').write_text(json.dumps(r,indent=2));print(json.dumps(groups))
