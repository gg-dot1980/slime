from pathlib import Path
import json,statistics as st
p=Path('/home/gg/projects/ocr3');rs=json.load(open(p/'evidence/deterministic-clearancepriority-unseen.json'))['runs'];groups={};pairs=[]
def win(r):return 'win' in r['samples'][-1]['title'].lower()
def dead(r):return 'eaten' in r['samples'][-1]['title'].lower()
def sizeat(r,t):
 if r['samples'][-1]['logical_ms']<t*1000-.01:return None
 ss=[s for s in r['samples'] if s['logical_ms']<=t*1000+.01 and s['decision']];return ss[-1]['decision']['r'] if ss else None
for v in ['v2.13','v2.20','v2.21','v2.22']:
 for a in 'AB':
  rr=[r for r in rs if r['version']==v and r['variant']==a];costs=[c for r in rr for s in r['samples'] for c in s['costs']];groups[v+a]={'n':len(rr),'wins':sum(win(r) for r in rr),'deaths':sum(dead(r) for r in rr),'end_seconds':[round(r['samples'][-1]['logical_ms']/1000,1) for r in rr],'end_sizes':[r['samples'][-1]['size'] for r in rr],'override_count':sum(r['samples'][-1]['clearance_overrides'] for r in rr),'cost_p95':sorted(costs)[int(.95*(len(costs)-1))],'cost_max':max(costs)}
 for a in [r for r in rs if r['version']==v and r['variant']=='A']:
  b=next(r for r in rs if r['version']==v and r['variant']=='B' and r['seed']==a['seed'] and r['initial_phase_ms']==a['initial_phase_ms']);d={'version':v,'seed':a['seed'],'phase':a['initial_phase_ms'],'survival_delta_s':(b['samples'][-1]['logical_ms']-a['samples'][-1]['logical_ms'])/1000,'both_timeout':not any([win(a),win(b),dead(a),dead(b)]),'timeout_size_fraction':float(b['samples'][-1]['size'])/float(a['samples'][-1]['size']) if not any([win(a),win(b),dead(a),dead(b)]) else None}
  for t in [60,120]:
   x,y=sizeat(a,t),sizeat(b,t);d['both_alive_size_delta_'+str(t)]=y-x if x is not None and y is not None else None
  pairs.append(d)
summary={}
for v in ['v2.13','v2.20','v2.21','v2.22']:
 pp=[r for r in pairs if r['version']==v];ratios=[r['timeout_size_fraction'] for r in pp if r['timeout_size_fraction'] is not None];summary[v]={'paired_median_survival_delta_s':st.median(r['survival_delta_s'] for r in pp),'both_timeout_n':len(ratios),'both_timeout_size_fraction_median':st.median(ratios) if ratios else None}
 for t in [60,120]:
  x=[r['both_alive_size_delta_'+str(t)] for r in pp if r['both_alive_size_delta_'+str(t)] is not None];summary[v]['both_alive_'+str(t)]={'n':len(x),'median_size_delta':st.median(x) if x else None}
gate=all(groups[v+'B']['wins']>=groups[v+'A']['wins'] and groups[v+'B']['deaths']<=groups[v+'A']['deaths'] for v in summary) and all(summary[v]['paired_median_survival_delta_s']>=5 for v in ['v2.20','v2.21']) and all(summary[v]['both_timeout_size_fraction_median'] is None or summary[v]['both_timeout_size_fraction_median']>=.9 for v in ['v2.13','v2.22'])
out={'scope':'32pairedfixedseed/phase diagnostics,notformalacceptance. Sizeat60/120 conditionalbothalive, notunbiasedcausalpopulationgrowth.','groups':groups,'paired':pairs,'summary':summary,'preregistered_retention_gate_passed':gate,'decision':'Reject; noformalbatch/deploy' if not gate else 'Eligibleforfurthervalidation,notformalpass'};(p/'evidence/clearancepriority-summary.json').write_text(json.dumps(out,indent=2));print(json.dumps({'groups':groups,'summary':summary,'gate':gate},indent=2))
