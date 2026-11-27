"""Build Grow51 from the frozen Grow50 candidate."""
import argparse
import hashlib
from pathlib import Path

BASE = "3f04d509d6bc0b8ad95865bf8f5a75f2282ad87cf2cd6737b6ed11e6e44ff8f6"


def build(parent):
    raw = parent.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE, "Grow50 parent digest mismatch"
    html = raw.decode()

    def change(before, after):
        nonlocal html
        assert html.count(before) == 1, before
        html = html.replace(before, after)

    def change_last(before, after):
        nonlocal html
        assert html.count(before) >= 1, before
        head, tail = html.rsplit(before, 1)
        html = head + after + tail

    for old, new in [
        ("<title>OCR Grow · Grow50 · 重疊警告復原</title>",
         "<title>OCR Grow · Grow51 · 切換路徑安全閘</title>"),
        ("<strong>OCR Grow · Grow50 · 重疊警告復原</strong>",
         "<strong>OCR Grow · Grow51 · 切換路徑安全閘</strong>"),
        (">OCR Grow 50<", ">OCR Grow 51<"),
        ("<h1>Grow50 · 重疊警告復原</h1>", "<h1>Grow51 · 切換路徑安全閘</h1>"),
        ("Grow50 · v2.22 重疊警告復原", "Grow51 · v2.22 切換路徑安全閘"),
        ("v2.13 沿用 Grow38。v2.22 沿用 Grow49；僅在大型 NPC 與玩家輪廓合併、且可見名稱與危險文字成對時，補回一個硬威脅。",
         "v2.13 沿用 Grow38。v2.22 沿用 Grow50；新選路徑的預測終點間隙為負時，若另一條可行路徑能恢復正間隙，改走終點間隙最大者。"),
    ]:
        change(old, new)
    change("Grow50 候選／Grow-12 舊基線", "Grow51 候選／Grow-12 舊基線")
    assert html.count("strategy: 'grow-50'") == 2
    html = html.replace("strategy: 'grow-50'", "strategy: 'grow-51'")
    change(
        "  let chosen, escaping = false, baseline46=null, beforeWall47=null;",
        "  let chosen, escaping = false, baseline46=null, beforeWall47=null, routeSwitchGap51=false;",
    )
    change(
        "    chosen = safe[0];\n  } else {",
        """    chosen = safe[0];
    const switchedRoute51 = Number.isInteger(old.first) && Number.isInteger(old.second) &&
      (chosen.first !== old.first || chosen.second !== old.second);
    if (switchedRoute51 && chosen.endGap < 0) {
      const gapRoute51 = [...safe].sort((a, b) => b.endGap - a.endGap ||
        b.clearance - a.clearance || b.score - a.score)[0];
      if (gapRoute51.endGap > 0) { chosen = gapRoute51; routeSwitchGap51 = true; }
    }
  } else {""",
    )
    change_last(
        "wallKnown: walls.filter(finite).length, projectedR: r + chosen.gain};",
        "wallKnown: walls.filter(finite).length, projectedR: r + chosen.gain, routeSwitchGap51};",
    )
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
