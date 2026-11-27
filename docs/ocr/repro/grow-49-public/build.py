"""Build the standalone Grow49 HTML from the exact frozen Grow48 and a visible-rim fit."""
import argparse
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = "c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253"

def build(parent):
    raw = parent.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE, "Grow48 parent digest mismatch"
    html = raw.decode()
    def change(before, after):
        nonlocal html
        assert html.count(before) == 1, before
        html = html.replace(before, after)
    for old, new in [
        ("<title>OCR Grow · Grow48 · 近牆避讓</title>", "<title>OCR Grow · Grow49 · 單邊裁切定位</title>"),
        ("<strong>OCR Grow · Grow48 · 近牆避讓</strong>", "<strong>OCR Grow · Grow49 · 單邊裁切定位</strong>"),
        (">OCR Grow 48<", ">OCR Grow 49<"),
        ("<h1>Grow48 · 近牆避讓</h1>", "<h1>Grow49 · 單邊裁切定位</h1>"),
        ("Grow48 · v2.22 近牆避讓", "Grow49 · v2.22 單邊裁切定位"),
        ("v2.13 沿用 Grow38。v2.22 保留 Grow46 捕食與逃生條件，在已通過安全檢查的路徑中僅對未來 1.5 秒內距牆小於 150 或穿牆的路徑扣分。",
         "v2.13 沿用 Grow38。v2.22 以 Grow48 為基礎。大型 NPC 在畫面單邊被裁切時，若可見輪廓符合單一圓形，沿垂直於該邊的方向修正其中心。"),
    ]:
        change(old, new)
    change("Grow48 候選／Grow-12 舊基線", "Grow49 候選／Grow-12 舊基線")
    assert html.count("strategy: 'grow-48'") == 2
    html = html.replace("strategy: 'grow-48'", "strategy: 'grow-49'")
    change("function components(data,w,h,scale,uiMasks=[]){",
           (ROOT / "clipped-center.js").read_text() + "\nfunction components(data,w,h,scale,uiMasks=[],edgePlayerRadius=0){")
    change("&&aspect<=12&&!textLike)found.push", "&&aspect<=12&&!textLike){found.push")
    change("minY*scale<=rect.y+rect.h+scale)});", """minY*scale<=rect.y+rect.h+scale)});
   const part = found.at(-1);
   if (edgePlayerRadius > 0 && part.clipped && part.r >= 16 * scale) {
     const center = clippedCenter49(rgb, w, h, scale, queue, tail, W,
       {left:minX,right:maxX,top:minY,bottom:maxY}, uiMasks, part, edgePlayerRadius);
     if (center) part.center49 = center;
   }
  }""")
    change("canvasUiMasks(w,h,ratio)),parts=", "canvasUiMasks(w,h,ratio),runStrategy==='grow-23'&&runGameVersion==='v2.22'?r:0),parts=")
    change("x=((geometry?geometry.x:p.x)-w/2)/ratio,y=((geometry?geometry.y:p.y)-h/2)/ratio",
           "center=geometry||p.center49||p,x=(center.x-w/2)/ratio,y=(center.y-h/2)/ratio")
    change("return {x,y,r,visualR,geometryAccepted:geometry?1:0", "return {x,y,r,visualR,...(p.center49?{centerFit49:true}:{}),geometryAccepted:geometry?1:0")
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
