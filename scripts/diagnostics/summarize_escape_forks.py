from pathlib import Path
import json,math
p=Path('/home/gg/projects/ocr3');rs=json.load(open(p/'evidence/escape-forks-policy-audit.json'))['runs'];control=rs[0];out=[]
for r in rs:
 first=None;pre=0
 for s,t in zip(r['samples'],control['samples']):
  if s['decision']!=t['decision']:
   if first is None:first=s['logical_ms']/1000
   if s['logical_ms']<66499:pre+=1
 ts=[t for s in r['samples'] for t in s['timer_trace'] if t['observation']];selected=[]
 for t in ts:
  if not any(abs(t['actual']-v)<1 for v in [66500,67500,68500,69500,70500,71500,72500,74500,77500]):continue
  q=next((q for q in t['audit']['npcs'] if q['id']==202),None);selected.append({'seconds':t['actual']/1000,'player_size':t['observation']['r'],'visual_safe_directions':t['policy']['safe'],'parent_gap_truth_after_decision':math.hypot(q['x'],q['y'])-.72*(q['r']+t['audit']['playerR']) if q else None})
 out.append({'branch':r['branch'],'preferred_callbacks_applied':r['preferred_applied'],'pre_fork_mismatches':pre,'first_divergent_sample_seconds':first,'ending_seconds':r['end_audit']['elapsed'],'ending_size':r['end_audit']['player']['r'],'won':r['end_audit']['won'],'selected_audits':selected})
s={'scope':'Retrospective pixel-only admissible-action forks; NOT acceptance or independentwinrate. Sameonecase, arccentercontext retainedonlytodiagnosefailedtrajectory, no productionstrategy.','results':out,'verified':'NWpref for5callbacks(1s) createsreachabletrajectory pastoriginal70.583death, survives78.1 andgrows64→83. Parentgap at70.5 becomes542vs267control; visualsafe directions2vs0, later5at72.5. SWonecallbackdies70.45; Ssamecontrol.','limits':'NWchangesNPCinteractions/PRNGhistory; original70.583splitdoesnotoccuratsametimeinNWbranch. Thusprovesalternativepathinreplayedgame, NOT escapeagainstidenticalfixedfuture split andnotgeneralizablewin.','hypothesis':'Beforeall-directionsunsafe, whennumerousgiantscrowdplayerandgainforecastlow, compareprioritizingbestclearanceoverfoodalignment amongalreadysafedirections. At66.5NWclearance38.15vsS29.29, bothgain0; currentfood-alignmentscoreselectsS. Needsindependentvisualcases/neutralbaselinevalidation; no globalpatchyet.','instrumentation_corrections':'Initial3branchesinvalid due reusedinstrumentedsource; archived/excluded. Freshsourceperbranchfixed. Firstforkwindowmissed66.5 duefloatclock; archivedmisalignedresults, corrected1msboundarytolerance, allpre-forkdecisionsidentical. Onlyfinalalignedresultsreported.'};(p/'evidence/escape-forks-summary.json').write_text(json.dumps(s,indent=2))
