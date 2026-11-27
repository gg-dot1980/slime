"""Build Grow50 from the frozen Grow49 candidate and merged warning recovery."""
import argparse
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = "85071f2d68a8320b444aa643f5dffb61cbe2523f6de5caf8cb45ba542bd5a0b6"

def build(parent):
    raw = parent.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE, "Grow49 parent digest mismatch"
    html = raw.decode()
    def change(before, after):
        nonlocal html
        assert html.count(before) == 1, before
        html = html.replace(before, after)
    for old, new in [
        ("<title>OCR Grow · Grow49 · 單邊裁切定位</title>", "<title>OCR Grow · Grow50 · 重疊警告復原</title>"),
        ("<strong>OCR Grow · Grow49 · 單邊裁切定位</strong>", "<strong>OCR Grow · Grow50 · 重疊警告復原</strong>"),
        (">OCR Grow 49<", ">OCR Grow 50<"),
        ("<h1>Grow49 · 單邊裁切定位</h1>", "<h1>Grow50 · 重疊警告復原</h1>"),
        ("Grow49 · v2.22 單邊裁切定位", "Grow50 · v2.22 重疊警告復原"),
        ("v2.13 沿用 Grow38。v2.22 以 Grow48 為基礎。大型 NPC 在畫面單邊被裁切時，若可見輪廓符合單一圓形，沿垂直於該邊的方向修正其中心。",
         "v2.13 沿用 Grow38。v2.22 沿用 Grow49；僅在大型 NPC 與玩家輪廓合併、且可見名稱與危險文字成對時，補回一個硬威脅。"),
    ]:
        change(old, new)
    change("Grow49 候選／Grow-12 舊基線", "Grow50 候選／Grow-12 舊基線")
    assert html.count("strategy: 'grow-49'") == 2
    html = html.replace("strategy: 'grow-49'", "strategy: 'grow-50'")
    change("function readImage(source,radius,now,predictedVelocity=null){",
           (ROOT / "merged-warning.js").read_text() + "\nfunction readImage(source,radius,now,predictedVelocity=null){")
    change("const analysis={objects,map,velocity};imageState=",
           "if(runStrategy==='grow-23'&&runGameVersion==='v2.22'){for(const p of mergedWarningActors50(image,w,h,ratio,r,rawParts,parts)){p.x=(p.x-w/2)/ratio;p.y=(p.y-h/2)/ratio;p.r/=ratio;p.visualR/=ratio;p.originalRadius/=ratio;p.dangerRadius/=ratio;objects.push(p);}}\n const analysis={objects,map,velocity};imageState=")
    return html.encode()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("parent", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    html = build(args.parent)
    if args.check:
        assert args.output.read_bytes() == html, "Candidate differs from reproducible build"
    else:
        args.output.write_bytes(html)
    print(hashlib.sha256(html).hexdigest())
