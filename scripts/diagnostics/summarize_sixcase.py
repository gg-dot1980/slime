import json,math
from pathlib import Path
p=Path('/home/gg/projects/ocr3');e=p/'evidence';j=json.load(open(e/'sixcase-policy-audit.json'))['runs'];orig=json.load(open(e/'deterministic-clearancepriority-unseen.json'))['runs'];plan=json.load(open(e/'sixcase-plan.json'));out=[]
for run,case in zip(j,plan['cases']):
 b=next(r for r in orig if all(r[k]==run[k] for k in ['version','seed','initial_phase_ms']) and r['variant']=='A');mismatch=sum((x.get('decision') or {}).get('decision')!=(y.get('decision') or {}).get('decision') for x,y in zip(run['samples'],b['samples']));tr=[t for s in run['samples'] for t in s['timer_trace'] if t.get('observation')];eats=[v for s in run['samples'] for v in s['eats']]
 for label in ['success','failure']:
  t0=case[label];first=min(tr,key=lambda t:abs(t['actual']/1000-t0));o=first['observation']['decision']['target'];q=min(first['audit']['npcs'],key=lambda n:math.hypot(n['x']-o['x'],n['y']-o['y'])+abs(n['r']-o['r']));ident=q['id'];rows=[]
  for t in tr:
   tm=t['actual']/1000
   if not t0-.11<=tm<=t0+2.01:continue
   d=t['observation'];a=d['decision'];truth=next((n for n in t['audit']['npcs'] if n['id']==ident),None);nearest=min(d['objects'],key=lambda z:math.hypot(z['x']-truth['x'],z['y']-truth['y'])) if truth else None
   if nearest and (not nearest['npc'] or math.hypot(nearest['x']-truth['x'],nearest['y']-truth['y'])>60):nearest=None
   meals=t['policy']['meals'];match=next((m for m in meals if nearest and m['o']==nearest),None)
   rows.append({'t':round(tm,3),'hud':d['r'],'heading':a['name'],'clearance':a['clearance'],'escaping':a['escaping'],'recovering':a['recovering'],'truth_target':truth,'observed_match':nearest,'wall_excluded':match['wallExcluded'] if match else None,'chosen':match['chosen'] if match else False,'current_target':a['target'],'toast':t['toast'] if t['toastVisible'] else None,'frame':t.get('frame_file')})
  relevant=[v for v in eats if t0-.1<=v['elapsed']<=t0+2.1];result={k:case[k] for k in ['version','seed','phase']}|{'label':label,'start':t0,'samples_parity':len(run['samples']),'mismatches':mismatch,'target_truth_id':ident,'first_true_radius':q['r'],'first_est_radius':o['r'],'actual_eats':relevant,'rows':rows};out.append(result)
result={'scope':plan,'cases':out};(e/'sixcase-summary.json').write_text(json.dumps(result,indent=2))
for c in out:
 print('\n',c['version'],c['seed'],c['label'],c['start'],'parity',c['mismatches'],'id',c['target_truth_id'],'radius',round(c['first_true_radius'],1),round(c['first_est_radius'],1),'eats',c['actual_eats'])
 for r in c['rows']:
  t=r['truth_target'];o=r['observed_match'];print(r['t'],r['hud'],r['heading'],'trueR',round(t['r'],1) if t else None,'obsR',round(o['r'],1) if o else None,'chosen',r['chosen'],'wall',r['wall_excluded'],'clear',round(r['clearance']))
