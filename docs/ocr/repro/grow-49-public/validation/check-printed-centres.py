"""Measure held PNG name-landmark errors for a reviewed private colour/ROI fixture.
Use: python check-printed-centres.py FRAME_DIR PAIR_REPORT FIXTURES OUTPUT
"""
import argparse
import hashlib
import json
from math import hypot
from pathlib import Path
from statistics import median
from PIL import Image, ImageChops

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for k in ('frames','pairs','fixtures','output'):
        parser.add_argument(k,type=Path)
    a=parser.parse_args()
    data=json.loads(a.pairs.read_bytes())
    indexed={r['index']:r for r in data['rows']}
    results=[]
    for f in json.loads(a.fixtures.read_bytes())['landmarks']:
        r=indexed[f['index']]
        path=a.frames/r['file']
        if hashlib.sha256(path.read_bytes()).hexdigest()!=f['sha256'] or f['sha256']!=r['sha256']:
            raise ValueError('Image digest mismatch')
        with Image.open(path) as im:
            region=im.crop(f['roi']).convert('RGB')
        red,green,blue=ImageChops.difference(region,Image.new('RGB',region.size,tuple(f['nameCoreRGB']))).split()
        mask=ImageChops.lighter(red,ImageChops.lighter(green,blue)).point([255]+[0]*255)
        if mask.histogram()[255]!=f['expectedPixels']:raise ValueError('Printed name pixel count differs')
        left,top,right,bottom=mask.getbbox()
        name=[f['roi'][0]+(left+right-1)/2,f['roi'][1]+(top+bottom-1)/2]
        pos=[]
        for key in ('frozen','candidate'):
            row=r[key]
            i=f['sourceObjectIndex']
            raw=row['objects'][i]
            fused,=[v for v in row['carried']['bodies'] if v['i']==i]
            def error(o):
                return hypot(1125+o['x']-name[0],654+o['y']-name[1])
            pos.append({'rawError':error(raw),'fusedError':error(fused),'mapRed':fused['mapRed'],
                        'scoredLocal':any(v['i']==i for v in row['carried']['local'])})
        results.append({'index':f['index'],'sha256':f['sha256'],'sourceObjectIndex':i,'name':name,'old':pos[0],'new':pos[1]})
    def describe(rs,key):
        aa=[r['old'][key] for r in rs];bb=[r['new'][key] for r in rs]
        return {'n':len(rs),'median':[median(aa),median(bb)],'min':[min(aa),min(bb)],'max':[max(aa),max(bb)],
                'better':sum(a>b+1e-6 for a,b in zip(aa,bb)),'worse':sum(b>a+1e-6 for a,b in zip(aa,bb))}
    kept=[r for r in results if r['old']['mapRed'] and r['new']['mapRed']]
    lost=[r for r in results if r['old']['mapRed'] and not r['new']['mapRed']]
    summary={'candidateSha256':data['summary']['candidateSha256'],'allRaw':describe(results,'rawError'),
             'allFused':describe(results,'fusedError'),'redMatchedBothRaw':describe(kept,'rawError'),
             'redMatchedBothFused':describe(kept,'fusedError'),'lostAssociationFused':describe(lost,'fusedError')}
    a.output.write_text(json.dumps({'summary':summary,'rows':results},indent=2)+'\n')
    print(json.dumps(summary))

if __name__=='__main__':main()
