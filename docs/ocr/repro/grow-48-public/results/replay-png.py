"""Verify saved visible PNGs with frozen Grow48's single-image object detector.

No game, controller loop, planner or network is loaded. Compare only fields
that do not require a prior image. Keep per-object output private.
Usage: python replay-png.py BATCH MATCHES CANDIDATE OUTPUT [--indices 1,9]
Needs Python, Pillow and Node.js. Images are opaque QHD canvas PNGs.
"""
import argparse
import hashlib
import json
from math import isclose
from pathlib import Path
import subprocess
import tempfile
from PIL import Image

EXPECTED = 'c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253'
FIELDS = ('x','y','r','visualR','originalRadius','geometryAccepted','confidence','npc',
          'labelSeen','localReliable','isRed','clipped','dangerRadius')


def section(html, begin, end):
    if html.count(begin) != 1 or html.count(end) != 1:
        raise ValueError("Frozen source anchors differ")
    return html[html.index(begin):html.index(end,html.index(begin))]


def single_image_code(candidate):
    if hashlib.sha256(candidate).hexdigest() != EXPECTED:
        raise ValueError("Expected frozen Grow48 candidate digest")
    source = candidate.decode()
    pieces = [section(source,'function isPlayerComponent(','function hudSpeed('),
              section(source,'function growMarkers(','function growMapInputs('),
              section(source,'function refineSlimeGeometry(','if(typeof module!==' +
                      "'undefined'&&module.exports)module.exports={refineSlimeGeometry};")]
    # Instrument the exact two frozen filters on successfully segmented components,
    # to distinguish nested-component removal from player / near-player removal.
    anchor = 'parts=rawParts.filter(p=>!rawParts.some('
    middle = ')).filter(p=>!isPlayerComponent'
    end = ';\n if(map&&'
    fragment = pieces[0]
    if fragment.count(anchor)!=1 or fragment.count(middle)!=1:
        raise ValueError("Cannot instrument frozen component filter")
    push = 'found.push({hue:seedHue,'
    if fragment.count(push)!=1:
        raise ValueError("Cannot index components")
    # Select the closest sampled grid cell to a reviewed native-pixel landmark.
    # Read queue membership while it still contains the current connected set.
    probe_expr = """window.probes.filter(p=>{
      const xx=Math.round(((p.x+.5)*w/2250-.5)/scale);
      const yy=Math.round(((p.y+.5)*h/1308-.5)/scale);
      return queue.subarray(0,tail).includes(yy*W+xx);
    }).map(p=>p.name)"""
    fragment=fragment.replace(push,'found.push({probes:'+probe_expr+',hue:seedHue,')
    nested = 'p=>rawParts.some(' + fragment.split(anchor)[1].split(middle)[0] + ')'
    keep_near_player = 'p=>!isPlayerComponent' + fragment.split(middle)[1].split(end)[0][:-1]
    injection = f"""
    const isNested = {nested};
    const survivesPlayerRegion = {keep_near_player};
    const seenComponents = rawParts.map(p=>({{
      x:(p.x-w/2)/ratio,y:(p.y-h/2)/ratio,visualR:p.r/ratio,hue:p.hue,
      width:p.bw/ratio,height:p.bh/ratio,probes:p.probes,clipped:p.clipped,label:hasSlimeLabel(image,w,h,p),
      stage:isNested(p)?'nested':isPlayerComponent(p,r,w/2,h/2)?'player':
          !survivesPlayerRegion(p)?'small/near-player':'retained'
    }}));
    window.lastComponents=seenComponents;
    """
    i=fragment.index(end,fragment.index(anchor))+1
    pieces[0]=fragment[:i]+injection+fragment[i:]
    return """(() => {
      const runStrategy='grow-23', timing={capture(){}};
      const out=document.createElement('canvas'), ctx=out.getContext('2d',{willReadFrequently:true});
    """ + '\n'.join(pieces) + """
    window.staticObjects=(source,hud)=>{
      imageState=null;
      const objects=readImage(source,hud,0,{x:0,y:0}).objects;
      return {objects, components:window.lastComponents};
    };})()"""


def same(a,b):
    if isinstance(a,bool) or isinstance(b,bool):
        return type(a) is type(b) and a == b
    if isinstance(a,(int,float)) and isinstance(b,(int,float)):
        return isclose(a,b,abs_tol=1e-6,rel_tol=0)
    return a == b


# Chromium's software bilinear readback uses 4 fractional bits per axis on this
# opaque QHD canvas. The saved planInput is a separate check, frame by frame.
# Rounding or generic high-quality resampling can alter connected components.
NODE = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const rgba = fs.readFileSync(0);
const width = 2250, height = 1308, hud = Number(process.argv[3]);
if (rgba.length !== 4 * width * height) throw Error('Unexpected raw length');
let scaled = null;
function coordinates(n, original) {
  return Array.from({length:n}, (_, i) => {
    const value = (i + .5) * original / n - .5;
    const first = Math.floor(value);
    return [first, Math.floor(16 * (value - first))];
  });
}
const context = {
  drawImage(source,x,y,w,h) {
    if (w !== 2000 || h !== 1163 || x || y) throw Error('Unexpected detector dimensions');
    const xs = coordinates(w,width), ys = coordinates(h,height);
    scaled = new Uint8ClampedArray(4*w*h);
    for (let j=0; j<h; j++) {
      const [sy,fy] = ys[j];
      for (let i=0; i<w; i++) {
        const [sx,fx] = xs[i];
        const src = 4*(sy*width+sx), dst = 4*(j*w+i);
        for (let channel=0; channel<3; channel++) {
          const k = src+channel;
          const top = (16-fx)*rgba[k]+fx*rgba[k+4];
          const lower = (16-fx)*rgba[k+4*width]+fx*rgba[k+4*(width+1)];
          scaled[dst+channel] = ((16-fy)*top+fy*lower) >> 8;
        }
        scaled[dst+3]=255;
      }
    }
  },
  getImageData() { return {data:scaled}; }
};
global.window = {probes:JSON.parse(process.argv[4])};
global.document = {createElement() {return {width:0,height:0,getContext() {return context;}};}};
vm.runInThisContext(fs.readFileSync(process.argv[2],'utf8'));
const result=window.staticObjects({width,height,clientWidth:width},hud);
process.stdout.write(JSON.stringify(result));
"""


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for k in ('batch','matches','candidate','output'):
        parser.add_argument(k,type=Path)
    parser.add_argument('--indices',help="Limit replay to these numeric PNG indices, comma-separated")
    parser.add_argument('--probes',type=Path,help="Optional JSON object keyed by PNG index, each an array of {name,x,y} body-pixel landmarks")
    args=parser.parse_args()
    probes=json.loads(args.probes.read_bytes()) if args.probes else {}

    code=single_image_code(args.candidate.read_bytes())
    index_filter={int(s) for s in args.indices.split(',')} if args.indices else None
    data=json.loads(args.matches.read_bytes())
    per_frame=[]
    with tempfile.TemporaryDirectory() as work:
        runtime=Path(work)/'replay.cjs'
        detector=Path(work)/'frozen-detection.js'
        runtime.write_text(NODE)
        detector.write_text(code)
        for row in data:
            if index_filter and row['index'] not in index_filter:
                continue
            path=args.batch/'frames'/row['file']
            if not path.exists():
                continue
            if hashlib.sha256(path.read_bytes()).hexdigest()!=row['sha256']:
                raise ValueError('PNG digest mismatch')
            selected_probes=probes.get(str(row['index']),[])
            patches=[]
            with Image.open(path) as im:
                if im.size!=(2250,1308) or im.mode!='RGBA' or im.getchannel('A').getextrema()!=(255,255):
                    raise ValueError('Expected QHD opaque canvas PNG')
                for probe in selected_probes:
                    x,y=probe['x'],probe['y']
                    if not (4 <= x < im.width-4 and 4 <= y < im.height-4):
                        raise ValueError('Probe patch outside image')
                    bounds=im.crop((x-4,y-4,x+5,y+5)).getextrema()
                    patches.append({**probe,'patchWidth':9,'allPixelsIdentical':all(a==b for a,b in bounds),
                                    'centerRGB':list(im.getpixel((x,y))[:3])})
                actual=json.loads(subprocess.run(['node',str(runtime),str(detector),str(row['hud']),json.dumps(selected_probes)],
                                                 input=im.tobytes(),stdout=subprocess.PIPE,check=True).stdout)
            old,new=row['objects'],actual['objects']
            raw_components=actual['components']
            kept=[c for c in raw_components if c['stage']=='retained']
            if len(kept)!=len(new):
                raise ValueError('Staged filter instrumentation changed the frozen retained count')
            for object_index,component in enumerate(kept):
                if component['probes']:
                    component['outputObjectIndex']=object_index
                    component['outputStaticFields']={k:new[object_index][k] for k in FIELDS}
            different=[{'i':i,'fields':[k for k in FIELDS if not same(a[k],b[k])]} for i,(a,b) in enumerate(zip(old,new))]
            different=[v for v in different if v['fields']]
            equal=len(old)==len(new) and not different
            per_frame.append({'index':row['index'],'file':row['file'],'sha256':row['sha256'],'inTraceTail':row['inTraceTail'],
                              'exactStaticFields':equal,'oldCount':len(old),'replayedCount':len(new),
                              'differentPositionsOrFields':different,'probePatches':patches,'visibleComponents':raw_components})
    summary={'candidateSha256':EXPECTED,'resampling':'opaque QHD, four-bit bilinear interpolation; floor result',
             'comparedFields':FIELDS,'tolerance':1e-6,'matchedPNGsReplayed':len(per_frame),
             'framesFullyReproduced':sum(r['exactStaticFields'] for r in per_frame),
             'tailFramesFullyReproduced':sum(r['exactStaticFields'] and r['inTraceTail'] for r in per_frame),
             'tailFramesReplayed':sum(r['inTraceTail'] for r in per_frame),
             'totalOriginalObjectObservations':sum(r['oldCount'] for r in per_frame)}
    args.output.write_text(json.dumps({'summary':summary,'frames':per_frame},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(summary))


if __name__=='__main__':
    main()
