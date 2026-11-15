import json
from pathlib import Path
from datetime import datetime,timezone,timedelta
p=Path('/home/gg/projects/ocr3');j=json.load(open(p/'evidence/deterministic-competition-shadow.json'));out=[]
for r in j['runs']:
 valid=[s for s in r['samples'] if s.get('opportunity')];n=streak=maximum=contested=alternatives=0;events=[]
 for s in valid:
  a=s['opportunity'];ok=a['eligible'];streak=streak+1 if ok else 0;maximum=max(maximum,streak);n+=ok
  con=a['r']>=60 and a['targetGap'] is not None and a['targetGap']<30;contested+=con;alternatives+=bool(con and a['alternatives'])
  if con:events.append({'t':s['logical_ms']/1000,'r':a['r'],'targetGap':a['targetGap'],'alternative_count':len(a['alternatives']),'eligible':ok,'selected':a['selected'],'alternatives':a['alternatives']})
 out.append({k:r[k] for k in ['version','seed','initial_phase_ms']}|{'frames':len(valid),'contested':contested,'with_safe_alternative':alternatives,'eligible':n,'max_streak':maximum,'events':events})
group={}
for v in ['v2.13','v2.20','v2.21','v2.22']:
 rr=[r for r in out if r['version']==v];group[v]={'cases':len(rr),'qualifying_cases':sum(r['max_streak']>=3 for r in rr),'contested_frames':sum(r['contested'] for r in rr),'safe_alternative_frames':sum(r['with_safe_alternative'] for r in rr),'eligible_frames':sum(r['eligible'] for r in rr),'gate':len(rr)==4 and sum(r['max_streak']>=3 for r in rr)>=2}
result={'at':datetime.now(timezone(timedelta(hours=8))).isoformat(),'source':'deterministic-competition-shadow.json','scope':'Independent observation-only16 games, baseline022 actions unchanged. Visibleobjects/HUD only, no truth. Fixedseedphase not acceptance; frames correlated, predictions not actual reward.','groups':group,'gate':all(v['gate'] for v in group.values()),'runs':out};(p/'evidence/competition-shadow-summary.json').write_text(json.dumps(result,indent=2));print(json.dumps({'groups':group,'gate':result['gate']}))
