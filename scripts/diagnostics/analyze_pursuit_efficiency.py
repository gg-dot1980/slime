from pathlib import Path
import json,math,statistics
p=Path('/home/gg/projects/ocr3');runs=json.load(open(p/'evidence/deterministic-scaledwall-unseen.json'))['runs'];episodes=[]
for r in runs:
 if r['variant'] not in 'AC':continue
 chain=[]
 def finish():
  if len(chain)<10:return
  first,last=chain[0],chain[-1];duration=last[0]-first[0]
  if duration<1.8:return
  episodes.append({**{k:r[k] for k in ['version','seed','variant','initial_phase_ms']},'start':first[0],'duration':duration,'player_start':first[1],'player_end':last[1],'target_radius_start':first[2]['r'],'distance_start':first[3],'distance_end':last[3],'closing_per_second':(first[3]-last[3])/duration,'away_fraction':sum(z[4]<0 for z in chain)/len(chain),'escaping_fraction':sum(z[5] for z in chain)/len(chain),'median_visible_threats':statistics.median(z[6] for z in chain)})
 for e in r['samples']:
  d=e.get('decision');t=(d or {}).get('decision',{}).get('target');time=e['logical_ms']/1000
  if not d or not t or not t.get('npc') or t.get('mapOnly') or t['r']<d['r']*.4:
   finish();chain=[];continue
  if chain and (abs(chain[-1][2]['r']-t['r'])>max(6,.2*t['r']) or math.hypot(chain[-1][2]['x']-t['x'],chain[-1][2]['y']-t['y'])>150):finish();chain=[]
  dist=math.hypot(t['x'],t['y']);align=(d['x']*t['x']+d['y']*t['y'])/(dist or 1);chain.append((time,d['r'],t,dist,align,d['decision']['escaping'],d['decision']['threats']))
 finish()
summ={}
for v in ['v2.13','v2.20','v2.21','v2.22']:
 for variant in 'AC':
  rows=[r for r in episodes if r['version']==v and r['variant']==variant];summ[v+variant]={'n_episodes':len(rows),'median_closing_speed':statistics.median(x['closing_per_second'] for x in rows) if rows else None,'nonclosing':sum(x['closing_per_second']<=0 for x in rows),'no_HUD_growth':sum(x['player_end']<=x['player_start'] for x in rows),'away_gt_half':sum(x['away_fraction']>.5 for x in rows)}
out={'scope':'Existingvisual/HUDtrace only. Approximate targetlink within150 displacement/20%radius,>=1.8s. Relative distanceclosing nottrueworldspeed. GrowthdoesnotprovewhichNPCeaten. Noformalacceptance.','groups':summ,'episodes':episodes};(p/'evidence/pursuit-efficiency-summary.json').write_text(json.dumps(out,indent=2));print(json.dumps(summ,indent=2));print('longest_nonclosing',sorted([x for x in episodes if x['closing_per_second']<=0],key=lambda x:-x['duration'])[:3])
