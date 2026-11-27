"""Replay counterfactual screen crops of original, isolated, named NPC bodies.

Requires Python, NumPy, SciPy, Pillow, Node, the single-image replay helper,
two candidate HTMLs, the private JSON fixture selections, and archived PNGs.
The image landmark is the center of the original visible name's exact-color
glyph bounding box. Error is relative to that translated landmark, including
when it is subsequently outside the frame, and never uses a detector output
as the center reference. One source body contributes repeated placements.
"""
import argparse
from collections import Counter
import hashlib
import json
from math import hypot
from pathlib import Path
import runpy
import statistics
import subprocess
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage


WIDTH, HEIGHT = 2250, 1308
DIRECTIONS = {"left": 0, "right": 0, "top": 1, "bottom": 1}
SPATIAL_FIELDS = ("r","visualR","originalRadius","geometryAccepted","confidence","npc",
                  "labelSeen","localReliable","isRed","clipped","dangerRadius")


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def source_body(fixture, frames):
    raw = (frames / fixture["file"]).read_bytes()
    if sha(raw) != fixture["sha256"]:
        raise ValueError("Source PNG hash mismatch")
    with Image.open(frames / fixture["file"]) as image:
        if image.size != (WIDTH, HEIGHT):
            raise ValueError("Wrong native canvas size")
        original = image.convert("RGB")
        roi = fixture["sourceROI"]
        text_roi = fixture["anchorROI"]
        glyph = np.array(original.crop(text_roi))
        gy, gx = np.nonzero((glyph == fixture["textRGB"]).all(axis=2))
        if not len(gx):
            raise ValueError("Source name has no matching glyph pixels")
        center = (float(gx.min()+gx.max())/2 + text_roi[0], float(gy.min()+gy.max())/2 + text_roi[1])
        crop = original.crop(roi)
        bright = np.array(crop).max(axis=2) > 64
        labels, _ = ndimage.label(bright)
        seed = labels[round(center[1])-roi[1], round(center[0])-roi[0]]
        if seed == 0:
            raise ValueError("Name landmark lies outside the visible bright body")
        # Blank other components. Keep every original pixel inside the silhouette,
        # including holes such as the interiors of printed letters.
        body = ndimage.binary_fill_holes(labels == seed)
        ys, xs = np.nonzero(body)
        if xs.min()==0 or ys.min()==0 or xs.max()==crop.width-1 or ys.max()==crop.height-1:
            raise ValueError("Source body touches extraction boundary")
        extent = (int(xs.max()-xs.min()+1),int(ys.max()-ys.min()+1))
        return (crop, Image.fromarray(np.uint8(body)*255), roi, center, extent, len(gx))


def place(asset, test, depth):
    crop, mask, roi, center, extent, _ = asset
    radius = max(extent)/2
    near = round(radius*depth) if depth is not None else None
    if test == "left":
        goal = (near, 675)
    elif test == "right":
        goal = (WIDTH-1-near, 675)
    elif test == "top":
        goal = (800, near)
    elif test == "bottom":
        goal = (800, HEIGHT-1-near)
    elif test == "interior":
        goal = (650, 640)
    elif test == "two-edge-corner":
        goal = (round(.35*radius), round(.35*radius))
    elif test == "minimap-only":
        goal = (WIDTH-round(radius)-12, round(radius)+12)
    elif test == "one-edge-plus-minimap":
        goal = (WIDTH-round(.4*radius), round(radius)+20)
    else:
        raise ValueError("Unknown placement")
    # Integer translations preserve the original raster and its subpixel offset.
    dx, dy = round(goal[0]-center[0]), round(goal[1]-center[1])
    canvas = Image.new("RGBA",(WIDTH, HEIGHT),(24,40,48,255))
    canvas.paste(crop,(roi[0]+dx,roi[1]+dy),mask)
    return canvas, (center[0]+dx,center[1]+dy)


def static_code(html, section):
    segments = [section(html,"function isPlayerComponent(", "function hudSpeed("),
                section(html,"function growMarkers(", "function growMapInputs("),
                section(html,"function refineSlimeGeometry(", "if(typeof module!=='undefined'&&module.exports)module.exports={refineSlimeGeometry};")]
    return """(()=>{
      const runStrategy='grow-23',runGameVersion=window.edition,timing={capture(){}};
      const out=document.createElement('canvas'),ctx=out.getContext('2d',{willReadFrequently:true});
    """+"\n".join(segments)+"""
      window.staticObjects=(source,hud)=>readImage(source,hud,0,{x:0,y:0}).objects;
    })()
    """


def compare(outputs, truth, kind, depth):
    old, new, legacy = outputs
    if len(old)!=len(new) or old!=legacy:
        raise ValueError("Object-count or legacy version parity check failed")
    row = {"case":kind,"depthR":depth,"landmark":truth,"objectCount":len(old),
           "npcCount":sum(o["npc"] for o in old),"otherStaticFieldsIdentical":
           all(all(a[k]==b[k] for k in SPATIAL_FIELDS) for a,b in zip(old,new)),
           "correctedObjectCount":sum(bool(o.get("centerFit49")) for o in new)}
    picks = [i for i,o in enumerate(old) if o["npc"]]
    if not picks:
        return row
    # The frame contains only one source sprite on a dark background.
    i=max(picks,key=lambda i:old[i]["visualR"])
    row["largestObjectIndex"]=i
    for name, obj in (("old",old[i]),("new",new[i])):
        x,y = WIDTH/2+obj["x"], HEIGHT/2+obj["y"]
        dx,dy = x-truth[0], y-truth[1]
        row[name]={"xy":[x,y],"error":hypot(dx,dy),"axisError":abs((dx,dy)[DIRECTIONS[kind]]) if kind in DIRECTIONS else None,
                   "r":obj["r"],"visualR":obj["visualR"],"clipped":obj["clipped"],"corrected":bool(obj.get("centerFit49"))}
    return row


def summarize(cases):
    numeric=[r for r in cases if "old" in r]
    matched=[r for r in numeric if r["new"]["corrected"]]
    med=lambda x:statistics.median(x) if x else None
    corrected_axes=[r for r in matched if r["old"]["axisError"] is not None]
    return {"placements":len(cases),"npcFound":len(numeric),"multipleNpcs":sum(r["npcCount"]>1 for r in cases),
            "changedLargestCenter":len(matched),"anyOtherStaticFieldsChanged":sum(not r["otherStaticFieldsIdentical"] for r in cases),
            "worseEuclideanGreaterThan1px":sum(r["new"]["error"]>r["old"]["error"]+1 for r in numeric),
            "improvedEuclideanGreaterThan1px":sum(r["new"]["error"]<r["old"]["error"]-1 for r in numeric),
            "medianEuclideanOld":med([r["old"]["error"] for r in numeric]),
            "medianEuclideanNew":med([r["new"]["error"] for r in numeric]),
            "correctedMedianNormalOld":med([r["old"]["axisError"] for r in corrected_axes]),
            "correctedMedianNormalNew":med([r["new"]["axisError"] for r in corrected_axes]),
            "correctedMaxNormalNew":max((r["new"]["axisError"] for r in corrected_axes),default=None)}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    for arg in ("frames","fixtures","parent","candidate","png_helper","output"):
        p.add_argument(arg,type=Path)
    args=p.parse_args()
    helper=runpy.run_path(str(args.png_helper))
    old, new = args.parent.read_bytes(), args.candidate.read_bytes()
    if sha(old)!=helper["EXPECTED"]:
        raise ValueError("Frozen parent SHA-256 mismatch")
    spec=json.loads(args.fixtures.read_bytes())
    tests=[(d,q) for d in spec["directions"] for q in spec["centerDepthRadii"]]
    tests.extend((d,None) for d in spec["controls"])
    node=helper["NODE"].split("vm.runInThisContext(",1)[0]
    # Reuse one RGBA downsample for the three detector reads of an identical image.
    node=node.replace("    const xs = coordinates", "    if(scaled) return;\n    const xs = coordinates")
    node+="""
const result=[];
for(const [src,edition] of [[process.argv[2],'v2.22'],[process.argv[5],'v2.22'],[process.argv[5],'v2.13']]){
  global.window={edition,probes:[]};
  vm.runInThisContext(fs.readFileSync(src,'utf8'));
  result.push(window.staticObjects({width,height,clientWidth:width},hud));
}
process.stdout.write(JSON.stringify(result));
"""
    rows=[]
    assets=[]
    with tempfile.TemporaryDirectory() as work:
        work=Path(work)
        runtime=work/"runtime.cjs"
        runtime.write_text(node)
        old_js,new_js=work/"old.js",work/"new.js"
        for file,raw in ((old_js,old),(new_js,new)):
            file.write_text(static_code(raw.decode(),helper["section"]))
        for f in spec["fixtures"]:
            asset=source_body(f,args.frames)
            assets.append({"name":f["name"],"file":f["file"],"sha256":f["sha256"],"referenceLabelCenter":asset[3],
                           "widthHeight":asset[4],"brightTextPixels":asset[5]})
            for test,depth in tests:
                canvas,truth=place(asset,test,depth)
                result=subprocess.run(["node",str(runtime),str(old_js),str(f["hud"]),"[]",str(new_js)],
                                      input=canvas.tobytes(),stdout=subprocess.PIPE,check=True)
                row={"fixture":f["name"],**compare(json.loads(result.stdout),truth,test,depth)}
                if "bodyCoreRGB" in f:
                    samples=np.array(canvas)[:,:,:3]
                    row["visibleSourceCorePixels"]={k:int((samples==rgb).all(axis=2).sum()) for k,rgb in f["bodyCoreRGB"].items()}
                if "probeCenters" in f:
                    row["visibleProbePatches"]={k:4<=x+truth[0]-asset[3][0]<WIDTH-4 and
                                                   4<=y+truth[1]-asset[3][1]<HEIGHT-4
                                               for k,(x,y) in f["probeCenters"].items()}
                rows.append(row)
    edges=[r for r in rows if r["case"] in DIRECTIONS]
    summary={"edge":summarize(edges),"byEdge":{d:summarize([r for r in edges if r["case"]==d]) for d in DIRECTIONS},
             "byDepth":{str(q):summarize([r for r in edges if r["depthR"]==q]) for q in spec["centerDepthRadii"]},
             "controls":{t:summarize([r for r in rows if r["case"]==t]) for t in spec["controls"]},
             "v213CompleteObjectParity":len(rows)}
    report={"frozenSha256":sha(old),"candidateSha256":sha(new),"fixtureSha256":sha(args.fixtures.read_bytes()),
            "unit":"pixels of original 2250x1308 QHD canvas","reference":"translated visible name box, all centers integer-translated; full-body extent uses original visible silhouette, without outlines supplied by candidate",
            "scope":spec.get("scope","masked body observations from archived PNGs; constructed scenes, repeated placements; no natural outcomes or independent games"),
            "sources":assets,"summary":summary,"cases":rows}
    args.output.write_text(json.dumps(report,indent=2,allow_nan=False)+"\n")
    print(json.dumps(summary))


if __name__=="__main__":
    main()
