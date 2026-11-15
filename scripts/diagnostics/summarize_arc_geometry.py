from pathlib import Path
import json,math,statistics as st
p=Path('/home/gg/projects/ocr3');rs=json.load(open(p/'evidence/arc-end-policy-audit.json'))['runs'];old=json.load(open(p/'evidence/deterministic-arccenter-unseen.json'))['runs'];out=[]
for r in rs:
 b=next(z for z in old if z['version']==r['version'] and z['seed']==r['seed'] and z['variant']=='B' and z['initial_phase_ms']==0);mis=0
 for s,t in zip(r['samples'],b['samples']):
  d=dict(s['decision']) if s['decision'] else None
  if d:d.pop('velocity',None)
  mis+=d!=t['decision']
 e=r['end_audit'];pr=e['player'];fatal=[q for q in e['npcs'] if q['r']>=pr['r']*1.08 and math.hypot(q['x']-pr['x'],q['y']-pr['y'])<.72*(q['r']+pr['r'])];ts=[t for s in r['samples'] for t in s['timer_trace'] if t['observation']];metrics=[]
 for t in ts:
  d=t['observation']
  for o in d['objects']:
   if not o['npc'] or not o['arcCorrected']:continue
   q=min(t['audit']['npcs'],key=lambda q:math.hypot(q['x']-o['x'],q['y']-o['y']));err=math.hypot(q['x']-o['x'],q['y']-o['y'])
   if err>80 or q['r']<t['audit']['playerR']*1.08:continue
   actual=math.hypot(q['x'],q['y'])-.72*(q['r']+t['audit']['playerR']);est=math.hypot(o['x'],o['y'])-.75*(o['dangerRadius']+d['r'])-12;raw=math.hypot(o['rawx'],o['rawy'])-.75*(o['dangerRadius']+d['r'])-12;metrics.append({'ms':t['actual'],'gap_error':est-actual,'gap_increase':est-raw,'actual_gap':actual,'model_gap':est})
 out.append({'version':r['version'],'seed':r['seed'],'actual_variant':'arccenterB (replay runner labelA only)','parity_mismatches':mis,'samples':len(r['samples']),'end':{'elapsed':e['elapsed'],'player':pr,'fatal_colliders':fatal},'last_callback_ms':ts[-1]['actual'],'last_clearance':ts[-1]['observation']['clearance'],'recent_births':[z for z in r['births'] if z['elapsed']>e['elapsed']-.1],'geometry_matched_samples':len(metrics),'median_gap_error':st.median(x['gap_error'] for x in metrics) if metrics else None,'maximum_optimistic_gap_error':max(x['gap_error'] for x in metrics) if metrics else None,'near_false_safe_count':sum(x['actual_gap']<20 and x['model_gap']>50 for x in metrics),'limitation':'Nearesttruth matches center<80 only; missed/merged NPC excluded. Not formalacceptance.'})
result={'scope':'Three exact candidatefailure replays; truth only postcallback/endGame audit, no decisionschanged. Staticcurrentgap comparison notfullfuturepathproof.','cases':out,'conclusion':'No matched corrected-object false-safe evidence attributable to unchanged dangerRadius. v20/v22 actualfatal NPC appeared afterlastcallback and collided duringbirth/clamp/growth; v21 fatalnewchild consistentwithsplit: squaredchildradii sum matchespreviousparent510.383, midpoint matchesmovingparent. Priorparentgap266.65 but no-safe-directionalreadyactive. Do not assume all failureduecenter/radius or blindly inflateallradii.','next':'Keepcandidate rejected. Distinguish spawn/clamp and split-emergence risk fromtracking errors; validate visible-parent trajectory and attainableescape opportunities before another strategy hypothesis.'};(p/'evidence/arc-geometry-summary.json').write_text(json.dumps(result,indent=2));print([(x['version'],x['parity_mismatches'],x['geometry_matched_samples'],x['median_gap_error'],x['maximum_optimistic_gap_error']) for x in out])
