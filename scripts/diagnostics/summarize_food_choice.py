from pathlib import Path
import json,math
p=Path('/home/gg/projects/ocr3');r=json.load(open(p/'evidence/food-choice-policy-audit.json'))['runs'][0];old=next(x for x in json.load(open(p/'evidence/deterministic-escapehold-unseen.json'))['runs'] if x['version']=='v2.13' and x['seed']==10007 and x['variant']=='A' and x['initial_phase_ms']==0)
mis=0;rows=[];case=None
for s,b in zip(r['samples'],old['samples']):
 d=s['decision'];c=dict(d) if d else d
 if c:c.pop('velocity',None)
 mis+=c!=b['decision']
 for t in s['timer_trace']:
  pol=t.get('policy');d=t['observation']
  if not pol or not d or d['r']<90:continue
  tar=d['decision'].get('target');medium=[z for z in pol['meals'] if z['o']['npc'] and z['o']['r']>=.4*d['r']]
  if tar and not tar['npc'] and medium:rows.append({'t':t['actual']/1000,'all_excluded':all(z['wallExcluded'] for z in medium),'safe':pol['safe'],'bounded':pol['bounded']})
  if abs(t['actual']-78900)<1:
   case=t
out={'scope':'Single offline replay, baseline v2.13 seed10007 phase0; not acceptance. Controller pixel/HUD only, truth collected after callback; instrumentation logs without changing decisions.','decision_mismatches_750_samples':mis,'samples':len(r['samples']),'large_player_food_target_with_medium_samples':len(rows),'all_medium_wall_excluded_samples':sum(x['all_excluded'] for x in rows),'finding':'All59 food-over-medium samples are explained by existing wall exclusion, not lower gain score or inability to recognize edible size. At78.9s nearby NPCtrue62.69/player99, distance173.38 vscontact116.76; SWpredictedclearance174.58 gain10.65 score37.83 but boundedpool rejects outward direction, choosesNE. This doesnotprove safety under later spawns or guaranteed capture.','case':case,'contact_evidence':[{'logical_ms':s['logical_ms'],'eats':s['eats']} for s in r['samples'] if s['eats']],'next_hypothesis':'Only under high predicted food gain and substantial predicted threat clearance, permit a bounded near-wall attack direction while keeping physical wall clearance. Do not lower global margin or change edible threshold. Must compare independent seeds/phases and survival cost; not yet implemented.'}
(p/'evidence/food-choice-summary.json').write_text(json.dumps(out,indent=2));print('mismatches',mis,'foodmedium',len(rows),'excluded',sum(x['all_excluded'] for x in rows))
