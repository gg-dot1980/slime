from pathlib import Path
import json,math
from datetime import datetime,timezone,timedelta
p=Path('/home/gg/projects/ocr3');e=p/'evidence';runs=json.load(open(e/'deterministic-playermask-unseen.json'))['runs'];out=[]
for r in runs:
 if r['variant']!='B' or r['version']=='v2.13':continue
 ss=[s for s in r['samples'] if s.get('decision')];end=ss[-1]['logical_ms'];last5=[s for s in ss if s['logical_ms']>=end-5000];last30=[s for s in ss if s['logical_ms']>=end-30000];caps=[c for s in ss for c in s['captures']];tiny=medium=mapn=0
 for s in last30:
  d=s['decision'];t=d['decision']['target']
  if not t:continue
  mapn+=bool(t.get('mapOnly'));tiny+=bool(t['npc'] and not t.get('mapOnly') and t['r']<=20 and .8*d['r']<=math.hypot(t['x'],t['y'])<=1.3*d['r']);medium+=bool(t['npc'] and not t.get('mapOnly') and .4*d['r']<=t['r']<.91*d['r'])
 out.append({k:r[k] for k in ['version','seed','initial_phase_ms']}|{'end_seconds':end/1000,'end_size':ss[-1]['size'],'last_NPC_capture':caps[-1]['elapsed'] if caps else None,'last5_escape_fraction':sum(s['decision']['decision']['escaping'] for s in last5)/len(last5),'last30_n':len(last30),'last30_small_near_body_NPC_targets':tiny,'last30_medium_targets':medium,'last30_map_targets':mapn})
checks=[]
for prefix in ['player-mask-targeted','player-mask-v2021','player-mask-collected']:
 fs=json.load(open(e/(prefix+'-static.json')))['frames'];ps=json.load(open(e/(prefix+'-paths.json')));tot={};examples=[]
 for f in fs:
  for v in ['before','after']:
   x=next(x for x in ps if x['file']==f['file'] and x['variant']==v);bad=[]
   for o in x['objects']:
    if o['npc'] and o['r']<=20 and .8*f['r']<=math.hypot(o['x'],o['y'])<=1.3*f['r'] and not any(math.hypot(o['x']-n['x'],o['y']-n['y'])<max(20,n['r']*.25) for n in f['truth']):bad.append(o)
   z=tot.setdefault(v,{'unmatched_smallNPC_frames':0,'objects':0,'selected':0});z['unmatched_smallNPC_frames']+=bool(bad);z['objects']+=len(bad);selected=x['decision']['target'] in bad;z['selected']+=selected
   if selected:examples.append({'file':f['file'],'variant':v,'target':x['decision']['target']})
 checks.append({'source':prefix,'counts':tot,'examples':examples})
result={'at':datetime.now(timezone(timedelta(hours=8))).isoformat(),'scope':'Existingtraces/PNG only; no newgames. Smallnearbodytarget isheuristicnotbyitself falseNPC. Posthoctruth unmatched andpixelreview needed.','latest_strata':out,'offline_smallNPC_checks':checks,'finding':'Potentialdifferentunresolved perception/classificationroot: player-border/face highlight fragments acceptedas tinyNPC by hasSlimeLabel brightpixeltest. Existing targetedv22 at117.7/117.9 aftermask picks11.7/13.3radius nearplayeredge, absentfromtruthNPCs; reviewed117700PNG hasnoNPCatthatposition. Similarunmatchedtargets inindependentv21existingsequence. Notcausedonlybymask: targetedbeforeselected4after2; oldbaselinealsohasartifact.','latest_v22_timeout':'23003phase100 size188lastNPCcapture125.2 then~25secondsnoNPCgrowth; manytinynearbodyNPC/maptargets, notprovenallfalsewithoutsamecallbackrawPNG. Oneother timeoutsize160 differentmix.','v20_v21':'Deathstrataremainheterogeneous. v20last5allsafeempty8-72%,v21 8-64%; some diejustaftercapture,others20swithoutcapture. CurrentnewbatchnoexactfatalNPC/end-eventtruth, cannotassignmaincauseorproveunavoidable.','preregister_next_evidence_gate':'Beforeanynewcontrollerpatch: >=3independentepisodes ofconfirmedfalseNPC atplayeroutline pixels, >=3consecutivecallback targetdisruption withnogrowth; differentiate genuine tinyprey and partialocclusion. Proposedpixelclassifier mustpreserveindependentgenuineNPC/danger positives and restoreusefulsafe direction, notjustremoveobjects. Thenunseen validation. Existing2independentpixel-backed cases andlatestunverifiedwindow insufficient.','next':'UseexistingrawPNG tolabel trueNPC text vs ownoutline/face component and quantifylabeltestfalsepositives; iflatestv22rawframesneeded, atmostoneunchangedreplaywindow125-140s, butnotstarted. No globalr<=20ban, no threshold/marginadjustment. No claimthisfixesv20/21deaths.','decision':'Keepmaskcandidate rejected. No sufficientnextpatch/no newgamebatch;saveevidencegap.'};(e/'mask-failure-modes-summary.json').write_text(json.dumps(result,indent=2));cp=p/'OCR3-CHECKPOINT.md';cp.write_text('## '+result['at']+' · 白框失敗後既有資料分流／發現小型假NPC候選根因\n- 未新跑遊戲。v20/21死亡有剛吞食及長時間未長大兩類，最後5秒全向不安全比例亦差大，現trace缺精確致死物件不可歸一。\n- v22 23003p100達188後125.2秒最後吞食、之後約25秒停滯；常選玩家邊緣半徑<=20小NPC與地圖目標。另有既有v22/v21同時序影像確認部分小NPC不對應真實NPC，疑玩家白框/臉部亮點被label判斷誤認。\n- 這不是白框mask獨有：targeted64frame baseline假小NPC被選4次，mask2次。不能說mask新增主要根因，也不能全刪小NPC。\n- 新patch門檻：3獨立像素確認案例＋連續目標干擾、真小獵物/危險正例不誤刪；目前2獨立影像案例+新timeout未驗證，不達。不開策略批次，保存mask-failure-modes-summary。\n\n'+cp.read_text());print(json.dumps(out[-2:]));print([(c['source'],c['counts']) for c in checks])
