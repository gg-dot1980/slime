import json
from pathlib import Path
p=Path(__file__).parent
m=json.loads((p/'measurements.json').read_text());d=json.loads((p/'inputs.json').read_text())
assert len(m)==13 and len(d['last12'])==12
assert all(x['purpleRoiFraction']==0 for x in m[:-1])
assert m[-1]['purpleRoiFraction']==1
out={'stage':'r73','newStarts':0,'newWins':0,'newDeaths':0,'newAborts':0,'fixedImages':13,'last12PurpleFractions':[x['purpleRoiFraction'] for x in m[:-1]],'terminalPurpleFraction':m[-1]['purpleRoiFraction'],'wallShiftAnalysisPixels':m[-1]['wallY']-m[-2]['wallY'],'captureEndToTerminalMs':181.09999999776483,'translationSensitivity':d['translationSensitivity'],'interventionImageMissing':True,'hypothesis':'Retrospective: vertical camera translation explains new player-adjacent purple surface','conclusion':'Not supported at measured wall shift and tested horizontal sensitivity; cause and identity remain unknown. Not a predictive warning or strategy improvement.','preview':'stopped','publication':'analysis only; no strategy release'}
(p/'summary.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
