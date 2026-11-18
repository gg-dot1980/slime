import json,math,hashlib
from pathlib import Path
out={'hypothesis':'A safe-direction false assurance is explained by optimistic collision threshold on the recorded NPCs','groups':{},'limits':['No decision-synchronous PNG in final 197 ms; terminal image cannot prove earlier visibility or identify attacker.','Static game collision logic is diagnostic only, never a controller hidden-state input.']}
for g in ['A','B']:
 p=Path('r60/'+g+'-results-noimages.json');d=json.loads(p.read_text());end=d['stop']['ms'];rows=[]
 for i,r in enumerate(d['rows']):
  if end-r['ms']>3500:continue
  threats=[]
  for j,o in enumerate(r['planInput']['objects']):
   if not o['npc']:continue
   body=o['dangerRadius'] if o['clipped'] else max(o['r'],r['hud']*1.1) if o['isRed'] else o['r']
   dist=math.hypot(o['x'],o['y']);s=r['hud']+body
   threats.append({'index':j,'x':o['x'],'y':o['y'],'r':o['r'],'body':body,'clipped':o['clipped'],'red':o['isRed'],'distance':dist,'plannerCurrentGap':dist-.75*s-12,'gameContactGapIfSameGeometry':dist-.72*s,'marginConservatism':.03*s+12})
  rows.append({'index':i,'toEndMs':end-r['ms'],'captureToEndMs':end-r['capture']['end'],'computeMs':r['elapsedCompute'],'direction':r['planOutput']['name'],'clearance':r['clearance'],'hud':r['hud'],'projectedR':r['planOutput']['projectedR'],'npcs':threats})
 out['groups'][g]={'inputSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'rows':rows,'imageMetadata':d['imageMetadata'][-2:],'rejectedInWindow':[r for r in d['rejected'] if end-r['ms']<=3500]}
s=Path('portable-r46-r50/v2.20/index.html').read_text();assert 'contact=(player.r+s.r)*.72' in s and 'else if(s.r>=player.r*1.08){endGame();return}' in s
out['staticCollisionCheck']={'gameSourceSha256':hashlib.sha256(s.encode()).hexdigest(),'sameGeometryPlannerMoreConservative':True,'gameContactCoefficient':.72,'plannerCoefficient':.75,'plannerExtraMargin':12,'npcGrowthBeforePlayerCollision':s.index('let npcAte=true')<s.index('contact=(player.r+s.r)*.72'),'actualGrowthCause':'unknown'}
Path('r63/result.json').write_text(json.dumps(out,indent=2)+'\n')
for g,a in out['groups'].items():
 print(g,'last rows',len(a['rows']),'last',[(r['index'],round(r['toEndMs'],1),r['direction'],round(r['clearance'],2),len(r['npcs']),round(min(n['gameContactGapIfSameGeometry'] for n in r['npcs']),2)) for r in a['rows'][-2:]])
