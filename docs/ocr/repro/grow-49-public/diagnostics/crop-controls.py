"""Challenge visible-rim fitting with translated/cropped bodies from private archive PNGs.

Usage: python diagnostics/crop-controls.py CANDIDATE.html EVIDENCE.zip INVENTORY.json OUTPUT.json
Requires Node and Pillow. Original pixels are copied at their native size.
"""
import argparse
from collections import Counter
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import statistics
import subprocess
import tempfile
from zipfile import ZipFile
from PIL import Image

def name_center(im, box):
    region = im.crop(box)
    pixels = list(region.convert("RGB").get_flattened_data()) if hasattr(region,"get_flattened_data") else list(region.convert("RGB").getdata())
    counts = Counter(v for v in pixels if min(v) >= 200 and max(v) - min(v) < 20)
    rgb, hits = counts.most_common(1)[0]
    xy = [(i % region.width, i // region.width) for i,v in enumerate(pixels) if v == rgb]
    xs, ys = zip(*xy)
    assert hits >= 35 and 10 <= max(xs)-min(xs) <= 32 and 4 <= max(ys)-min(ys) <= 18
    return [box[0]+(min(xs)+max(xs))/2, box[1]+(min(ys)+max(ys))/2]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ["candidate","evidence","inventory","output"]:
        parser.add_argument(key, type=Path)
    args = parser.parse_args()
    with ZipFile(args.evidence) as archive, tempfile.TemporaryDirectory() as work:
        specs = []
        cases = json.loads(args.inventory.read_bytes())
        for case in cases:
            key, role, member = (case[k] for k in ("key","role","member"))
            png = archive.read(member)
            assert sha256(png).hexdigest() == case["sha256"], "Original image digest mismatch"
            im = Image.open(BytesIO(png)).convert("RGBA")
            anchor = name_center(im, case["nameSearchBox"]) if role == "single" else case["referenceSeed"]
            rect = case["tileBox"]
            tile = im.crop(rect)
            assert tile.width == tile.height and len({s["key"] for s in specs} | {key}) == len(specs) + 1
            name = str(Path(work)/f"tile-{len(specs)}.rgba")
            Path(name).write_bytes(tile.tobytes())
            specs.append({"key":key, "member":member, "sha256":case["sha256"], "file":name, "size":tile.width,
                          "anchor":[anchor[0]-rect[0],anchor[1]-rect[1]], "absoluteReference":anchor,
                          "r":case["extentRadius"], "role":role, "sourceBounds":rect})
        spec = Path(work)/"inputs.json"
        spec.write_text(json.dumps(specs))
        runtime = Path(__file__).with_name("crop-controls.cjs")
        rows = json.loads(subprocess.check_output(["node",str(runtime),str(args.candidate),str(spec)]))
    tested = [r for r in rows if r["kind"] == "single"]
    excluded = [r for r in rows if r["kind"] != "single"]
    assert all(r["object"] for r in tested), "A single-body crop could not be associated with its reference"
    assert all(r["object"] for r in excluded), "Negative control missing an associated component"
    assert all(not r["object"]["applied"] for r in excluded), "Negative control accepted"
    accepted = [r for r in tested if r["object"]["applied"]]
    summary = {"singleBodyCrops":len(tested),"singleSourceBodies":sum(s["role"] == "single" for s in specs),"changed":len(accepted),
               "improved":sum(r["object"]["before"] > r["object"]["after"] for r in accepted),
               "worsened":sum(r["object"]["before"] < r["object"]["after"] for r in accepted),
               "beforeMedianAll":statistics.median(r["object"]["before"] for r in tested),
               "afterMedianAll":statistics.median(r["object"]["after"] for r in tested),
               "negativeControls":dict(Counter(r["kind"] for r in excluded)),
               "negativeControlsWithAssociatedComponent":dict(Counter(r["kind"] for r in excluded if r["object"])),
               "negativeActivations":sum(bool(r["object"] and r["object"]["applied"]) for r in excluded)}
    result = {"summary":summary, "candidateSha256":sha256(args.candidate.read_bytes()).hexdigest(),
              "method":"Named, fully visible NPCs copied to all four edges, with the printed center 0.8, 0.5 or 0.15 radii inside. Baseline and fitted positions scored against the translated visible name anchor. Negative cases are separate. Sampled native tiles use a three-pixel connectivity grid.",
              "sources":[{k:v for k,v in s.items() if k!="file"} for s in specs], "rows":rows}
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(summary))

if __name__ == "__main__":
    main()
