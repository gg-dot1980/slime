from pathlib import Path
import json,statistics as st
from datetime import datetime,timezone,timedelta
p=Path('/home/gg/projects/ocr3');rs=json.load(open(p/'evidence/deterministic-playermask-unseen.json'))['runs'];groups={};pairs=[]
def win(r):return 'win' in r['samples'][-1]['title'].lower()
def dead(r):return 'eaten' in r['samples'][-1]['title'].lower()
def captures(r):return [c for s in r['samples'] for c in s.get('captures',[])]
for v in ['v2.13','v2.20','v2.21','v2.22']:
 for a in 'AB':
  rr=[r for r in rs if r['version']==v and r['variant']==a];costs=[c for r in rr for s in r['samples'] for c in s['costs']];duration=sum(r['samples'][-1]['logical_ms']/1000 for r in rr);cs=[c for r in rr for c in captures(r)];groups[v+a]={'n':len(rr),'wins':sum(win(r) for r in rr),'deaths':sum(dead(r) for r in rr),'end_seconds':[round(r['samples'][-1]['logical_ms']/1000,1) for r in rr],'NPC_captures':len(cs),'NPC_net_growth':sum(c['net'] for c in cs),'alive_seconds':duration,'captures_per100s':100*len(cs)/duration,'mask_calls':sum(r['samples'][-1].get('mask_calls',0) for r in rr),'mask_accepted':sum(r['samples'][-1].get('mask_accepted',0) for r in rr),'cost_p95':sorted(costs)[int(.95*(len(costs)-1))],'cost_max':max(costs)}
 for a in [r for r in rs if r['version']==v and r['variant']=='A']:
  b=next(r for r in rs if r['version']==v and r['variant']=='B' and r['seed']==a['seed'] and r['initial_phase_ms']==a['initial_phase_ms']);both=min(a['samples'][-1]['logical_ms'],b['samples'][-1]['logical_ms'])>=60000-.01;pairs.append({'version':v,'seed':a['seed'],'phase':a['initial_phase_ms'],'NPC_growth_delta_at60':sum(c['net'] for c in captures(b) if c['elapsed']<=60)-sum(c['net'] for c in captures(a) if c['elapsed']<=60) if both else None})
growth={}
for v in ['v2.13','v2.22']:
 vals=[r['NPC_growth_delta_at60'] for r in pairs if r['version']==v and r['NPC_growth_delta_at60'] is not None];growth[v]={'n':len(vals),'median':st.median(vals) if vals else None}
rates={a:100*sum(g['NPC_captures'] for k,g in groups.items() if k.endswith(a))/sum(g['alive_seconds'] for k,g in groups.items() if k.endswith(a)) for a in 'AB'}
gate=len(rs)==32 and all(groups[v+'B']['wins']>=max(2,groups[v+'A']['wins']) and groups[v+'B']['deaths']<=groups[v+'A']['deaths'] and groups[v+'B']['cost_p95']<200 for v in ['v2.13','v2.20','v2.21','v2.22']) and rates['B']>=rates['A'] and all(x['median'] is not None and x['median']>=0 for x in growth.values())
r={'at':datetime.now(timezone(timedelta(hours=8))).isoformat(),'scope':'32fixedseed/phase paired diagnostic, not original acceptance; captures sidechannel posthoc only. Growth60 conditionedbothalive withdenominators, not unbiasedcausalpopulation.','groups':groups,'pairs':pairs,'growth60':growth,'pooled_capture_rates':rates,'retention_gate':gate,'decision':'Reject andstopcandidate/noformal/no deployment' if not gate else 'Eligibleoriginalindependentvalidation only;notpublishedorpassedformal'};(p/'evidence/playermask-summary.json').write_text(json.dumps(r,indent=2));print(json.dumps({'groups':groups,'growth':growth,'rates':rates,'gate':gate}))
