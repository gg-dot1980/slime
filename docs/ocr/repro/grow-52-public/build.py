"""Build Grow52 from the frozen Grow51 candidate."""
import argparse
import hashlib
from pathlib import Path

BASE = "5ffe0a35611299410c2f70ab20c849785783db2a9c740a38c4cacf1ac449f5f6"


def build(parent):
    raw = parent.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE, "Grow51 parent digest mismatch"
    html = raw.decode()

    def change(before, after):
        nonlocal html
        assert html.count(before) == 1, before
        html = html.replace(before, after)

    for old, new in [
        ("<title>OCR Grow · Grow51 · 切換路徑安全閘</title>",
         "<title>OCR Grow · Grow52 · 正常安全間隙 14</title>"),
        ("<strong>OCR Grow · Grow51 · 切換路徑安全閘</strong>",
         "<strong>OCR Grow · Grow52 · 正常安全間隙 14</strong>"),
        (">OCR Grow 51<", ">OCR Grow 52<"),
        ("<h1>Grow51 · 切換路徑安全閘</h1>",
         "<h1>Grow52 · 正常安全間隙 14</h1>"),
        ("Grow51 · v2.22 切換路徑安全閘", "Grow52 · v2.22 正常安全間隙 14"),
        ("v2.13 沿用 Grow38。v2.22 沿用 Grow50；新選路徑的預測終點間隙為負時，若另一條可行路徑能恢復正間隙，改走終點間隙最大者。",
         "v2.13 沿用 Grow38。v2.22 沿用 Grow51；正常選路的預測最小安全間隙由 4 提高為 14，既有逃逸與切換路徑安全閘不變。"),
        ("Grow51 候選／Grow-12 舊基線", "Grow52 候選／Grow-12 舊基線"),
    ]:
        change(old, new)
    assert html.count("strategy: 'grow-51'") == 2
    html = html.replace("strategy: 'grow-51'", "strategy: 'grow-52'")
    needle = "const safe = bounded.filter(p => p.clearance > (oldModeEscape ? 14 : 4));"
    assert html.count(needle) == 2
    at = html.rfind(needle)
    html = html[:at] + "const safe = bounded.filter(p => p.clearance > 14);" + html[at + len(needle):]
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
