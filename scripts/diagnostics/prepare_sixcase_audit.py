from pathlib import Path
import json
p=Path('/home/gg/projects/ocr3');s=(p/'audit_capture_loss.py').read_text().replace('import json,hashlib,time','import json,hashlib,time,base64').replace('capture-loss','sixcase')
s=s.replace("for version,seed in [(v,s) for v in ['v2.22'] for s in [17011]]:","for version,seed,phase,windows in [('v2.13',18013,0,[(94.8,98),(102,105)]),('v2.22',17011,100,[(105,107.6),(108,111)]),('v2.22',18013,100,[(104.6,107.4),(108.4,111.4)])]:")
s=s.replace('range(555)','range(560)').replace('window.__initialPhase=arguments[1];','window.__sixWindows=arguments[2];window.__initialPhase=arguments[1];').replace("),100)\n", "),phase,windows)\n")
s=s.replace("'initial_phase_ms':100", "'initial_phase_ms':phase")
s=s.replace('policy:w.__t>59000?window.__policyAudit:null','policy:window.__policyAudit,toast:w.document.getElementById(\'toast\')?.textContent,toastVisible:w.document.getElementById(\'toast\')?.classList.contains(\'show\'),frame:window.__sixWindows.some(([a,b])=>w.__t>=a*1000&&w.__t<=b*1000)?w.document.querySelector(\'canvas\').toDataURL():null')
s=s.replace('samples.append(r)', '''for tr in r['timer_trace']:
     frame=tr.pop('frame',None)
     if frame:
      fn=f'sixcase-{version}-{seed}-{phase}-{round(tr["actual"]):06}.png';(p/'evidence'/fn).write_bytes(base64.b64decode(frame.split(',')[1]));tr['frame_file']=fn
    samples.append(r)''')
# WeakMap identity is diagnostic sidechannel only, controller never reads it.
s=s.replace('function draw(){window.__truthAudit=', 'function draw(){window.__auditIds ||= new WeakMap();window.__auditNext ||=1;window.__truthAudit=').replace('npcs:slimes.map(s=>({x:', 'npcs:slimes.map(s=>({id:(window.__auditIds.has(s)?window.__auditIds.get(s):(window.__auditIds.set(s,window.__auditNext++),window.__auditIds.get(s))),x:')
s=s.replace('npcR:slimes[i].r,distance:', 'npcId:window.__auditIds?.get(slimes[i]),npcR:slimes[i].r,distance:')
(p/'audit_sixcase.py').write_text(s)
plan={'cases':[{'version':'v2.13','seed':18013,'phase':0,'success':95.4,'failure':102.6},{'version':'v2.22','seed':17011,'phase':100,'success':105.6,'failure':108.4},{'version':'v2.22','seed':18013,'phase':100,'success':105.0,'failure':108.8}],'limits':'3 separate trajectories, selectedcases notprevalence. SuccessmeansHUDgrowth notyet attributed target; same-runcontrols only approximate size/radius matches, explicitnot randomized. Existingtrace missing fullcallbackPNG/toast/identity so3 bounded unchanged-policy replays supplement evidence. No intervention/acceptance.','gate':'Onlypropose commoncorrectablemechanismifall3failurecases show same visiblecause with safealternative and independentvalidation stillrequired.','separation':'WeakMaptruthidentity/eat events readonlyaftercallback byharness, nevercontroller input. Exactdecisionparity withoriginal required.'}
(p/'evidence/sixcase-plan.json').write_text(json.dumps(plan,indent=2));print('ready')
