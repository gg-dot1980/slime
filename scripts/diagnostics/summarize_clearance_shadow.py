from pathlib import Path
import json,statistics as st
p=Path('/home/gg/projects/ocr3');rs=json.load(open(p/'evidence/deterministic-clearance-shadow.json'))['runs'];rows=[];losses=[]
for r in rs:
 valid=[s for s in r['samples'] if s.get('decision') and s.get('opportunity')];eligible=[s for s in valid if s['opportunity']['eligible']];run=longest=0;episodes=[];start=None
 for s in valid:
  if s['opportunity']['eligible']:
   if not run:start=s['logical_ms']/1000
   run+=1;longest=max(longest,run);losses.append(max(0,s['opportunity']['selected']['gain']-s['opportunity']['alternative']['gain']))
  else:
   if run:episodes.append({'start':start,'callbacks':run})
   run=0
 if run:episodes.append({'start':start,'callbacks':run})
 rows.append({**{k:r[k] for k in ['version','seed','initial_phase_ms']},'valid':len(valid),'eligible':len(eligible),'longest_consecutive':longest,'episodes':episodes,'end_title':r['samples'][-1]['title'],'end_seconds':r['samples'][-1]['logical_ms']/1000})
by={v:sum(x['eligible'] for x in rows if x['version']==v)/sum(x['valid'] for x in rows if x['version']==v) for v in ['v2.13','v2.20','v2.21','v2.22']};cases=[x for x in rows if x['version'] in ['v2.20','v2.21'] and x['longest_consecutive']>=3];median=st.median(losses) if losses else None;gate=len(cases)>=3 and len(set(x['version'] for x in cases))==2 and median is not None and median<=.25 and all(x<=.15 for x in by.values());out={'scope':'Unchanged baseline022 observation-only,16unseen cases; forecast notrealizedgrowth, samplescorrelated, noacceptance.','cases':rows,'version_eligible_fraction':by,'persistent_target_cases':len(cases),'persistent_versions':list(set(x['version'] for x in cases)),'median_predicted_growth_loss':median,'gate_passed':gate};(p/'evidence/clearance-shadow-summary.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
