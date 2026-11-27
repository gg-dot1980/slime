"""Compare both candidates on retained settled historical PNGs with exact ledger pairs.

Use Python/Pillow, Node, and the original PNG decoder replay-png.py. All JSON
inputs/outputs are private. Uses recorded trajectory and action context, and
carries changed object velocities only between consecutive applied decisions.
"""
import argparse
import hashlib
import json
from math import hypot
from pathlib import Path
import runpy
from statistics import median
import subprocess
import tempfile
from PIL import Image

FROZEN='c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253'
STATIC=('x','y','r','visualR','originalRadius','geometryAccepted','confidence','npc','labelSeen',
        'localReliable','isRed','clipped','dangerRadius')


def section(html,begin,end):
    if html.count(begin)!=1 or html.count(end)!=1:
        raise ValueError("Source anchors changed")
    return html[html.index(begin):html.index(end,html.index(begin))]


def detector_and_planner(html):
    pieces=[section(html,'function isPlayerComponent(','function hudSpeed('),
            section(html,'function growMarkers(','function growMapInputs('),
            section(html,'function refineSlimeGeometry(', "if(typeof module!=='undefined'&&module.exports)module.exports={refineSlimeGeometry};"),
            section(html,'function chaseEvidence46(','function planGrow47(')]
    marker='const progress = chaseEvidence46(old.chase46, bodies, meals, r, map, now, npcToast);'
    if pieces[-1].count(marker)!=1: raise ValueError('Planner inspect marker differs')
    pieces[-1]=pieces[-1].replace(marker,'observe(bodies,hazards,localHazards);'+marker)
    return """(function(version,time) {
const runStrategy='grow-23',runGameVersion=version,timing={capture(){}};
const out=document.createElement('canvas'),ctx=out.getContext('2d',{willReadFrequently:true});
const performance={now:()=>time};
let frameInfo;
function observe(bodies,hazards,local){
 const select=h=>({i:h._sourceIndex??null,x:h.x,y:h.y,upper:h.upper,lower:h.lower??null,
   mapRed:!!h.mapRed,mapOnly:!!h.mapOnly,vx:h.vx,vy:h.vy});
 frameInfo={bodies:bodies.map(select),hazards:hazards.map(select),local:local.map(select)};
}
""" + '\n'.join(pieces) + """
return {
 read(hud,prior,prediction){
  imageState=prior?{pixels:[],width:2000,height:1163,timestamp:prior.at,radius:prior.hud,
    objects:prior.objects,analysis:{map:prior.map,velocity:prediction}}:null;
  return readImage({width:2250,height:1308,clientWidth:2250},hud,time,prediction);
 },
 plan(snapshot,objects) {
  const pi=snapshot.planInput,o=snapshot.planOutput;
  frameInfo=null;
  const d=planHunt47(objects.map((o,i)=>({...o,_sourceIndex:i})),pi.hud,pi.map,pi.speed,pi.velocity,
   pi.heading,'v2.22',o.tracking46.observedAt,o.tracking46.npcToast);
  if(!frameInfo)throw Error('no planner fusion detail');
  const fields=['first','second','escaping','recovering','reason','threats','risk','clearance','score',
    'gain','discountedGain','immediateGap','endGap','wallCost'];
  const target=d.target?Object.fromEntries(['x','y','r','npc','mapOnly'].map(k=>[k,d.target[k]])):null;
  return {choice:{...Object.fromEntries(fields.map(k=>[k,d[k]])),target},...frameInfo};
 }
};})"""


NODE = r"""
global.window={};
global.document={createElement(){return {width:0,height:0,getContext(){return context;}};}};
const s=JSON.parse(fs.readFileSync(process.argv[4],'utf8'));
const previous=JSON.parse(fs.readFileSync(process.argv[5],'utf8'));
const engines=process.argv.slice(2,4).map(p=>vm.runInThisContext(fs.readFileSync(p,'utf8')));
const fields=['x','y','r','visualR','originalRadius','geometryAccepted','confidence','npc','labelSeen','localReliable','isRed','clipped','dangerRadius'];
const dynamic=['vx','vy','blocked','stalled'];
const eq=(a,b)=>typeof a==='number'&&typeof b==='number'?Math.abs(a-b)<=1e-6:a===b;
const same=(a,b,keys)=>keys.every(k=>eq(a[k],b[k]));
const extract=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o[k]]));
const pi=s.planInput, now=s.decisionStartedAt, old=pi.objects;
let predicted={x:0,y:0};
if(previous){
 const follow=1-Math.exp(-4.2*Math.min(.2,(now-previous[0].at)/1000));
 for(const axis of ['x','y'])predicted[axis]=previous[0].velocity[axis]+
     (pi.heading[axis]*pi.speed-previous[0].velocity[axis])*follow;
}
const result=[], carry=[];
for(let j=0;j<2;j++){
 const engine=engines[j]('v2.22',now);
 const obs=engine.read(pi.hud,previous?.[j],predicted);
 if(obs.objects.length!==old.length)throw Error('Different count requires independent row rematch');
 let spatialChanged=[],otherChanged=[],radiusChanged=[];
 let historical=obs.objects.map((o,i)=>{
    if(!same(o,old[i],['x','y']))spatialChanged.push(i);
    if(!same(o,old[i],fields.filter(k=>k!=='x'&&k!=='y')))otherChanged.push(i);
    if(!eq(o.r,old[i].r))radiusChanged.push(i);
    return {...old[i],...extract(o,fields),...(o.centerFit49?{centerFit49:true}:{})};
 });
 if(!j&&(spatialChanged.length||otherChanged.length))throw Error('Frozen image/recorded reconstruction mismatch');
 const dynamicMismatch=previous?obs.objects.filter((o,i)=>!same(o,old[i],dynamic)).length:null;
 if(!j&&previous&&(dynamicMismatch||!same(obs.velocity,pi.velocity,['x','y'])))throw Error('Historical chained motion differs at '+now);
 const selected=previous?obs.objects:historical;
 carry.push({at:now,hud:pi.hud,velocity:pi.velocity,map:pi.map,objects:selected});
 const motionDeltas=previous?obs.objects.flatMap((o,i)=>same(o,old[i],dynamic)?[]:[{i,...extract(o,dynamic)}]):[];
 const fixedPlan=engine.plan(s,historical);
 const motionPlan=previous?engine.plan(s,selected):fixedPlan;
 const ablation=[];
 if(j && previous && (motionPlan.choice.first!==fixedPlan.choice.first || motionPlan.choice.second!==fixedPlan.choice.second)){
  for(const delta of motionDeltas){
   const {i,...vel}=delta;
   const trial=historical.map((o,k)=>k===i?{...o,...vel}:o);
   const ret=engine.plan(s,trial).choice;
   ablation.push({i,first:ret.first,second:ret.second,clearance:ret.clearance,risk:ret.risk,
        isTarget:!!ret.target&&same(ret.target,historical[i],['x','y','r'])});
  }
 }
 const expected=s.planOutput;
 if(!j){
    for(const [k,v] of Object.entries(motionPlan.choice)){
      if(k==='target'){if((v===null)!=(expected.target===null)||v&&!same(v,expected.target,Object.keys(v)))throw Error('Historic target differs');}
      else if(!eq(v,expected[k])) throw Error('Historic planner differs: '+k);
    }
 }
 const cross=engines[j]('v2.13',now).read(pi.hud,null,{x:0,y:0}).objects;
 result.push({spatialChanged,otherChanged,radiusChanged,motionDeltas,ablation,accepted:obs.objects.map((o,i)=>o.centerFit49?i:null).filter(i=>i!==null),
    objects:historical.map(o=>extract(o,fields)),historicalMotionDifferences:dynamicMismatch,
    fixed:fixedPlan,carried:motionPlan,v213:cross.map(o=>extract(o,fields))});
}
const v213Equal=result[0].v213.length===result[1].v213.length&&
  result[0].v213.every((o,i)=>same(o,result[1].v213[i],fields));
for(const r of result)delete r.v213;
fs.writeFileSync(process.argv[6],JSON.stringify(carry));
process.stdout.write(JSON.stringify({result,v213Equal}));
"""


def digest(data):
    return hashlib.sha256(data).hexdigest()


def visible_track(image, record, silhouette):
    # Visible name and optional fill colour come from separate private fixtures.
    # Use the identical visible colour mask on old/new; the last label is partial.
    roi=record['anchor']['roi']
    rgb=tuple(record['anchor']['rgb'])
    crop=image.crop(roi).convert('RGB')
    px=crop.load()
    hits=[(x+roi[0],y+roi[1]) for y in range(crop.height) for x in range(crop.width) if px[x,y]==rgb]
    xs,ys=zip(*hits)
    box=[min(xs),min(ys),max(xs)+1,max(ys)+1]
    center=[(box[0]+box[2]-1)/2,(box[1]+box[3]-1)/2]
    anchor=record["anchor"]
    if len(hits)!=anchor["pixels"] or box!=anchor["box"] or center!=anchor["xy"]:
        raise ValueError('Printed name mask does not reproduce')
    # Half-width of an exact-fill mask is a silhouette proxy that excludes the stroke.
    if not silhouette:
        return {'namePixels':len(hits),'complete':record['completeName'],'xy':center}
    f=image.crop(silhouette['roi']).convert('RGB')
    green=tuple(silhouette['rgb'])
    # Coordinates of the bounding box of pixels with this exact fill colour.
    channels=f.split()
    from PIL import ImageChops
    masks=[ch.point([255 if i==v else 0 for i in range(256)]) for ch,v in zip(channels,green)]
    box=ImageChops.multiply(ImageChops.multiply(masks[0],masks[1]),masks[2]).getbbox()
    if not box: raise ValueError('Green silhouette absent')
    return {'namePixels':len(hits),'complete':record["completeName"],'xy':center,'fillHalfWidth':(box[2]-box[0])/2}


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    for field in ('batch','matches','controls','frozen','candidate','decoder','output'):
        ap.add_argument(field,type=Path)
    ap.add_argument('--silhouette',type=Path,help='Optional private JSON with {roi,rgb} for the independent fill-width check')
    a=ap.parse_args()
    silhouette=json.loads(a.silhouette.read_bytes()) if a.silhouette else None
    if digest(a.frozen.read_bytes())!=FROZEN:raise ValueError('Unexpected baseline')
    snapshots={}
    journal,=(a.batch/'ledger').glob('grow48-*.jsonl')
    for line in journal.read_bytes().splitlines():
        row=json.loads(line)
        if row.get('version')!='v2.22':continue
        if row['type']=='sample':snapshots[row['snapshot']['recordAt']]=row['snapshot']
        if row['type']=='result':snapshots.update({v['recordAt']:v for v in row['traceTail']})
    track={v['recordAt']:v for v in json.loads(a.controls.read_bytes())['clippedGreenNpc']['frames']}
    rows=json.loads(a.matches.read_bytes())
    prefix=runpy.run_path(str(a.decoder))['NODE'].split('global.window = ')[0]
    if 'function coordinates(' not in prefix:raise ValueError('Unexpected pixel decoder')
    results=[]
    with tempfile.TemporaryDirectory() as tmp:
        w=Path(tmp)
        (w/'runner.cjs').write_text(prefix+NODE)
        for version,path in enumerate((a.frozen,a.candidate)):
            (w/f'{version}.js').write_text(detector_and_planner(path.read_text()))
        last=-2;prev=w/'prev.json'
        for m in rows:
            path=a.batch/'frames'/m['file']
            if not path.is_file():continue
            if digest(path.read_bytes())!=m['sha256']:raise ValueError('PNG digest mismatch')
            s=snapshots[m['recordAt']]
            no=s['planOutput']['tracking46']['appliedCounts']['applied']
            consecutive=no==last+1
            if not consecutive:prev.write_text('null')
            last=no
            (w/'snapshot.json').write_text(json.dumps(s))
            with Image.open(path) as im:
                if im.size!=(2250,1308) or im.mode!='RGBA' or im.getchannel('A').getextrema()!=(255,255):
                    raise ValueError('Original opaque geometry required')
                raw=im.tobytes()
                ref=visible_track(im,track[s['recordAt']],silhouette) if s['recordAt'] in track else None
            cmd=['node',str(w/'runner.cjs'),str(w/'0.js'),str(w/'1.js'),str(w/'snapshot.json'),str(prev),str(w/'next.json')]
            inspection=json.loads(subprocess.run(cmd,input=raw,stdout=subprocess.PIPE,check=True).stdout)
            (w/'next.json').replace(prev)
            points=[]
            for r in inspection['result']:
                if ref is None:continue
                historical=track[s['recordAt']]['localNpc']['xy']
                i=min((idx for idx,o in enumerate(s['planInput']['objects']) if o['npc']),key=lambda k:hypot(s['planInput']['objects'][k]['x']+1125-historical[0],s['planInput']['objects'][k]['y']+654-historical[1]))
                if hypot(s['planInput']['objects'][i]['x']+1125-historical[0],s['planInput']['objects'][i]['y']+654-historical[1])>.002:raise ValueError('Track/source row mismatch')
                obj=r['objects'][i]
                def pos(v):
                    if v is None:return None
                    xy=[v['x']+1125,v['y']+654]
                    return {'xy':xy,'error':hypot(xy[0]-ref['xy'][0],xy[1]-ref['xy'][1]) if ref['complete'] else None,
                            'mapRed':v.get('mapRed'),'vx':v.get('vx'),'vy':v.get('vy')}
                def find(group):
                    hits=[v for v in r['carried'][group] if v['i']==i]
                    if len(hits)>1:raise ValueError('Body repeated')
                    return pos(hits[0]) if hits else None
                points.append({'index':i,'raw':pos(obj),'radius':obj['r'],'accepted':i in r['accepted'],
                              'body':find('bodies'),'hazard':find('hazards'),'scoredLocalHazard':find('local')})
            results.append({'file':m['file'],'sha256':m['sha256'],'index':m['index'],'applied':no,'consecutive':consecutive,
                           'trackReference':ref,'track':points,'v213Equal':inspection['v213Equal'],
                           'frozen':inspection['result'][0],'candidate':inspection['result'][1]})
    stats={'frozenSha256':FROZEN,'candidateSha256':digest(a.candidate.read_bytes()),'frames':len(results),
           'consecutiveTransitions':sum(r['consecutive'] for r in results),'objects':sum(len(r['frozen']['objects']) for r in results),
           'v213SameImagesNoDiff':sum(r['v213Equal'] for r in results),
           'changedPositions':sum(len(r['candidate']['spatialChanged']) for r in results),
           'acceptedCenterFits':sum(len(r['candidate']['accepted']) for r in results),
           'otherSpatialFieldsChanged':sum(len(r['candidate']['otherChanged']) for r in results),
           'radiusChanges':sum(len(r['candidate']['radiusChanged']) for r in results)}
    for mode in ('fixed','carried'):
        pair=[(r['frozen'][mode]['choice'],r['candidate'][mode]['choice']) for r in results]
        stats[mode+'PlannerChanges']={k:sum(x[k]!=y[k] if not isinstance(x[k],float) else abs(x[k]-y[k])>1e-6 for x,y in pair)
                                     for k in ('first','second','target','escaping','threats','risk','clearance')}
    refs=[r['track'] for r in results if r['trackReference'] and r['trackReference']['complete']]
    for layer in ('raw','body','hazard','scoredLocalHazard'):
        comparable=[v for v in refs if all(unit[layer] for unit in v)]
        stats[layer+'NameComparisons']={'n':len(comparable)}
        if comparable:
            old,new=([v[i][layer]['error'] for v in comparable] for i in (0,1))
            stats[layer+'NameComparisons'].update({'median':[median(old),median(new)],'max':[max(old),max(new)],
                      'better':sum(b<a-1e-6 for a,b in zip(old,new)),'worse':sum(b>a+1e-6 for a,b in zip(old,new)),
                      'mappedOld':sum(bool(v[0][layer]['mapRed']) for v in comparable),
                      'mappedNew':sum(bool(v[1][layer]['mapRed']) for v in comparable)})
    a.output.write_text(json.dumps({'summary':stats,'rows':results},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(stats,ensure_ascii=False))


if __name__=='__main__':main()
