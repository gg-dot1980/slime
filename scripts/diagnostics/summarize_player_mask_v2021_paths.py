import json,math,statistics as st
from pathlib import Path
from datetime import datetime,timezone,timedelta
p=Path('/home/gg/projects/ocr3');e=p/'evidence';j=json.load(open(e/'player-mask-v2021-path-summary.json'))['rows'];a=json.load(open(e/'player-mask-v2021-paths.json'));frames=json.load(open(e/'player-mask-v2021-static.json'))['frames'];groups={}
for g in ['heldout-v2.20','heldout-v2.21']:
 rr=[r for r in j if r['group']==g];ff=[f for f in frames if f['group']==g];overlap=[(f,n) for f in ff for n in f['truth'] if n['r']>=f['r']*1.08 and math.hypot(n['x'],n['y'])<f['r']+n['r']];summary={'frames':len(ff),'mask_accepted':sum(f['accepted'] for f in ff),'actual_overlap_observations':len(overlap),'overlap_mask_accepted':sum(f['accepted'] for f,n in overlap),'heading_changes':sum(r['changed'] for r in rr),'safe_count_changes':sum(r['before_safe']!=r['after_safe'] for r in rr),'variants':{}}
 for v in ['before','after']:
  er=[];rad=[];miss=0;n=0;under=[]
  for frame in ff[1:]:
   res=next(x for x in a if x['file']==frame['file'] and x['variant']==v)
   for t in frame['truth']:
    if t['r']<frame['r']*1.08 or math.hypot(t['x'],t['y'])>frame['r']+t['r']+80 or abs(t['x'])>950 or abs(t['y'])>530:continue
    n+=1;c=[o for o in res['objects'] if o['npc']];o=min(c,key=lambda o:math.hypot(o['x']-t['x'],o['y']-t['y'])+abs(o['r']-t['r'])) if c else None
    if not o or math.hypot(o['x']-t['x'],o['y']-t['y'])>max(30,t['r']*.3):miss+=1;continue
    er.append(math.hypot(o['vx']-t['vx'],o['vy']-t['vy']));rad.append(o['r']-t['r']);under.append({'file':frame['file'],'id':t['id'],'bias':o['r']-t['r']})
  summary['variants'][v]={'n':n,'miss':miss,'median_velocity_error':st.median(er) if er else None,'median_radius_bias':st.median(rad) if rad else None,'worst_radius_underestimate':min(rad) if rad else None,'worst':min(under,key=lambda x:x['bias']) if under else None}
 groups[g]=summary
r={'at':datetime.now(timezone(timedelta(hours=8))).isoformat(),'source':'arc-confirm-policy-audit.json seed2467 phase100 v20/v21 previouslysavedimages; no newgame; unchangedmask gates frozenpreviouscalibration','groups':groups,'limits':'2trajectories only, correlated62frames inclterminalendframe. Nearcriteria r+NPCr+80, actualoverlapseparatelylisted. Firstframecoldstart excludedvelocitymetrics; matchingtruthproxy offlineonly; predictions use savedplayer velocity, currentheading notold, ownpixelNPCvelocity. Notexacthistoricaldecisionorclosedloopproof.','result':'No additionalmatched-dangerdeletion observed, butexistingv21misspersists;v20velocitymedian30.66->31.09 slightlyworse, no systematictemporalimprovement. No safe-directioncountchanges;oneheadingchangeeach. Radiusunderestimate retained, maskingnotradiusfix.','next':'Beforeclosedloop need reproducecalibrationbenefit with maintainedtemporaltracking acrossindependentplayer/preymergeepisodes, notjustdangercontrolframes. Currentmethod has smallsample nonregression support but no proven growthbenefit. Preservebaseline/no deployment.'};(e/'player-mask-v2021-reviewed-summary.json').write_text(json.dumps(r,indent=2));print(json.dumps(groups));cp=p/'OCR3-CHECKPOINT.md';cp.write_text('## '+r['at']+' · v20/v21近身遮疊離線安全補證\n- 找到既有seed2467 phase100兩條獨立軌跡62frame，無新遊戲；危險身體遮疊11/2次，mask接受8/2，信心不足沿用原辨識。\n- 完整時序pipeline近身危險25/11筆：v20前後皆0漏，v21前後皆1漏；v20速度誤差中位30.66→31.09略差，v21約6.57不變，沒有追蹤改善證明。\n- 安全方向數皆未變，每版1frame選向改變；樣本含terminalframe、只有兩軌跡，不能證安全。半徑原有低估未解；尚無閉環成長收益證據，保留baseline。\n- player-mask-v2021-reviewed-summary.json與62frame結果已保存；無策略批次/部署變更。\n\n'+cp.read_text())
