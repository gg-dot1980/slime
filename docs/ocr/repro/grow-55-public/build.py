"""Build Grow55 from the frozen Grow54 candidate."""
import argparse
import hashlib
from pathlib import Path

BASE = "3372fbb4c9d1e42e14d2f88a1f980a68477b7856f55f58ba32e53610e77338f4"


def build(parent):
    raw = parent.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE, "Grow54 parent digest mismatch"
    html = raw.decode()

    def change(before, after):
        nonlocal html
        assert html.count(before) == 1, before
        html = html.replace(before, after)

    for old, new in [
        ("<title>OCR Grow · Grow54 · 兩畫面安全後解除逃逸</title>",
         "<title>OCR Grow · Grow55 · 立即間隙優先逃逸</title>"),
        ("<strong>OCR Grow · Grow54 · 兩畫面安全後解除逃逸</strong>",
         "<strong>OCR Grow · Grow55 · 立即間隙優先逃逸</strong>"),
        (">OCR Grow 54<", ">OCR Grow 55<"),
        ("<h1>Grow54 · 兩畫面安全後解除逃逸</h1>",
         "<h1>Grow55 · 立即間隙優先逃逸</h1>"),
        ("Grow54 · v2.22 兩畫面安全後解除逃逸", "Grow55 · v2.22 立即間隙優先逃逸"),
        ("v2.13 沿用 Grow38。v2.22 沿用 Grow53；安全間隙小於等於 0 的逃逸啟動後，須連續兩個可見畫面的間隙至少 14 才解除；每幀仍重算方向，若正常路徑間隙小於玩家半徑或終點間隙小於 0，改用既有緊急逃逸排序。",
         "v2.13 沿用 Grow38。v2.22 沿用 Grow54；僅在逃逸保持中且所有可行路徑的 0.6 秒立即間隙都為負時，先最大化立即間隙，再比較 2.2 秒終點間隙；其餘選路不變。"),
        ("Grow54 候選／Grow-12 舊基線", "Grow55 候選／Grow-12 舊基線"),
    ]:
        change(old, new)
    assert html.count("strategy: 'grow-54'") == 2
    html = html.replace("strategy: 'grow-54'", "strategy: 'grow-55'")

    marker = """  const escapeSafeFrames54 = forceEscape54 ?
    (chosen.clearance >= 14 ? (escapeHold54Input.safeFrames || 0) + 1 : 0) : 0;"""
    patch = """  let immediatePriority55 = null;
  if (forceEscape54) {
    const pool55 = bounded.length ? bounded : paths;
    if (pool55.length && pool55.every(p => p.immediateGap < 0)) {
      const baselineChoice55 = chosen;
      chosen = [...pool55].sort((a, b) => b.immediateGap - a.immediateGap ||
        b.endGap - a.endGap || b.score - a.score)[0] || baselineChoice55;
      immediatePriority55 = {active:true,baselineFirst:baselineChoice55.first,
        baselineSecond:baselineChoice55.second,baselineImmediateGap:baselineChoice55.immediateGap,
        baselineEndGap:baselineChoice55.endGap,changed:baselineChoice55.first !== chosen.first ||
          baselineChoice55.second !== chosen.second};
    }
  }
  const escapeSafeFrames54 = forceEscape54 ?
    (chosen.clearance >= 14 ? (escapeHold54Input.safeFrames || 0) + 1 : 0) : 0;"""
    change(marker, patch)
    change("const escapeHold54 = {\n    active:",
           "const escapeHold54 = {\n    immediatePriority55,\n    active:")
    return html.encode()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("parent", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    candidate = build(args.parent)
    if args.check:
        assert args.output.read_bytes() == candidate, "candidate differs from reproducible build"
    else:
        args.output.write_bytes(candidate)
    print(hashlib.sha256(candidate).hexdigest())
