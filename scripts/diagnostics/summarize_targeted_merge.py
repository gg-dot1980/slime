import json,math
from pathlib import Path
from datetime import datetime,timezone,timedelta
p=Path('/home/gg/projects/ocr3');e=p/'evidence';plan=json.load(open(e/'targeted-merge-plan.json'));runs=json.load(open(e/'targeted-merge-policy-audit.json'))['runs'];frames=json.load(open(e/'player-mask-targeted-static.json'))['frames'];paths=json.load(open(e/'player-mask-targeted-paths.json'));out=[]
for case,run in zip(plan['cases'],runs):
 original=next(r for r in json.load(open(e/case['source']))['runs'] if r['version']==case['version'] and r['seed']==case['seed'] and r['initial_phase_ms']==case['phase'] and r['variant']=='A');parity=sum((s.get('decision') or {}).get('decision')!=(t.get('decision') or {}).get('decision') for s,t in zip(run['samples'],original['samples']));ff=[f for f in frames if f['group']=='heldout-'+case['version']];rows=[]
 for f in ff:
  a,b=[x for x in paths if x['file']==f['file']];r=f['r'];fake=lambda x:sum(o['npc'] and o['r']>1.55*r and math.hypot(o['x'],o['y'])<r for o in x['objects']);row={'file':f['file'],'before_fake':fake(a),'after_fake':fake(b),'before_safe':sum(c['clearance']>3 for c in a['paths']),'after_safe':sum(c['clearance']>3 for c in b['paths']),'headings':[a['decision']['name'],b['decision']['name']],'matches':[]}
  for n in f['truth']:
   if n['r']<20 or math.hypot(n['x'],n['y'])>r+n['r']+80:continue
   pair={}
   for label,x in [('before',a),('after',b)]:
    oo=[o for o in x['objects'] if o['npc']];o=min(oo,key=lambda o:math.hypot(o['x']-n['x'],o['y']-n['y'])+abs(o['r']-n['r'])) if oo else None;matched=bool(o and math.hypot(o['x']-n['x'],o['y']-n['y'])<max(30,n['r']*.3));danger=bool(o and(o['clipped'] or o['isRed'] or o['r']>=r*.98));pair[label]={'matched':matched,'danger':danger,'radius':o['r'] if matched else None}
   row['matches'].append({'id':n['id'],'truth_r':n['r'],'actual_danger':n['r']>=r*1.08,**pair})
  rows.append(row)
 allpairs=[m for row in rows for m in row['matches']];streak=best=0
 for row in rows:
  benefit=row['before_fake']>0 and row['after_fake']==0;streak=streak+1 if benefit else 0;best=max(best,streak)
 out.append({'case':case,'parity_samples':len(run['samples']),'decision_mismatches':parity,'frames':len(rows),'before_fake_frames':sum(x['before_fake']>0 for x in rows),'after_fake_frames':sum(x['after_fake']>0 for x in rows),'max_benefit_streak':best,'lost_matched_NPC':sum(m['before']['matched'] and not m['after']['matched'] for m in allpairs),'new_misclassified_danger':sum(m['actual_danger'] and m['before']['matched'] and m['before']['danger'] and (not m['after']['matched'] or not m['after']['danger']) for m in allpairs),'near_danger_observations':sum(m['actual_danger'] for m in allpairs),'rows':rows})
res={'at':datetime.now(timezone(timedelta(hours=8))).isoformat(),'plan':plan,'runs':out,'limits':'Truth nearestmatching proxy onlyposthoc; fullpipeline independenttracking coldstart atwindow. Sameoriginalplayer velocities/headings, notclosedloopfuture. Selectionfailure-enriched, no winrateinference.','status':'No controllerintervention; targeted3replaycapfinished. Need reviewgate andradius anomalies beforeanygameAB.'};(e/'targeted-merge-summary.json').write_text(json.dumps(res,indent=2));print(json.dumps([{k:v for k,v in r.items() if k!='rows'} for r in out]))
