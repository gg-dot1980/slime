"""Build Grow54 from the frozen Grow53 candidate."""
import argparse
import hashlib
from pathlib import Path

BASE = "2ee212a3be69555a9b04b39bc7b8f45f932f79154e075d41da37ebc18cca794c"


def replace_last(text, before, after):
    at = text.rfind(before)
    assert at >= 0, before
    return text[:at] + after + text[at + len(before):]


def build(parent):
    raw = parent.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE, "Grow53 parent digest mismatch"
    html = raw.decode()

    def change(before, after):
        nonlocal html
        assert html.count(before) == 1, before
        html = html.replace(before, after)

    for old, new in [
        ("<title>OCR Grow · Grow53 · 三畫面目標速度中位數</title>",
         "<title>OCR Grow · Grow54 · 兩畫面安全後解除逃逸</title>"),
        ("<strong>OCR Grow · Grow53 · 三畫面目標速度中位數</strong>",
         "<strong>OCR Grow · Grow54 · 兩畫面安全後解除逃逸</strong>"),
        (">OCR Grow 53<", ">OCR Grow 54<"),
        ("<h1>Grow53 · 三畫面目標速度中位數</h1>",
         "<h1>Grow54 · 兩畫面安全後解除逃逸</h1>"),
        ("Grow53 · v2.22 三畫面目標速度中位數", "Grow54 · v2.22 兩畫面安全後解除逃逸"),
        ("v2.13 沿用 Grow38。v2.22 沿用 Grow52；HUD 停滯至少 4 秒且同一可吃 NPC 連續匹配三個畫面時，只以三畫面速度中位數抑制當幀速度雜訊，不鎖目標、方向或第一段時長。",
         "v2.13 沿用 Grow38。v2.22 沿用 Grow53；安全間隙小於等於 0 的逃逸啟動後，須連續兩個可見畫面的間隙至少 14 才解除；每幀仍重算方向，若正常路徑間隙小於玩家半徑或終點間隙小於 0，改用既有緊急逃逸排序。"),
        ("Grow53 候選／Grow-12 舊基線", "Grow54 候選／Grow-12 舊基線"),
    ]:
        change(old, new)
    assert html.count("strategy: 'grow-53'") == 2
    html = html.replace("strategy: 'grow-53'", "strategy: 'grow-54'")

    old_input = "const oldModeEscape = old.escaping === true;\n  const startHazardGap"
    new_input = """const oldModeEscape = old.escaping === true;
  const escapeHold54Input = old.escapeHold54?.active === true ? old.escapeHold54 : null;
  const startHazardGap"""
    html = replace_last(html, old_input, new_input)

    old_choice = """let chosen, escaping = false, baseline46=null, beforeWall47=null, routeSwitchGap51=false;
  if (safe.length) {"""
    new_choice = """let chosen, escaping = false, baseline46=null, beforeWall47=null, routeSwitchGap51=false;
  const forceEscape54 = escapeHold54Input !== null;
  if (safe.length) {"""
    change(old_choice, new_choice)

    target_marker = "  const target = chosen.target && {...chosen.target};\n  let nextHistory53 = [];"
    escape_patch = r'''  let retreatChoice54 = null;
  if (forceEscape54 && safe.length && (chosen.clearance < r || chosen.endGap < 0)) {
    const normalChoice54 = chosen, pool54 = bounded.length ? bounded : paths;
    let fx54 = 0, fy54 = 0;
    for (const h of localHazards.filter(o => o.hard)) {
      const distance54 = hypot(h.x, h.y) || 1;
      const weight54 = 1 / Math.max(60, distance54 - .72 * (r + h.upper));
      fx54 -= h.x / distance54 * weight54; fy54 -= h.y / distance54 * weight54;
    }
    const fl54 = hypot(fx54, fy54) || 1;
    const escapeScore54 = p => clamp(p.immediateGap, -160, 120) * .7 +
      clamp(p.endGap - startHazardGap, -500, 500) * .8 - p.wallCost * 40 +
      (p.x * fx54 + p.y * fy54) / fl54 * 22 + (p.x * ox + p.y * oy) * 6;
    chosen = [...pool54].sort((a, b) => escapeScore54(b) - escapeScore54(a) ||
      b.score - a.score)[0] || normalChoice54;
    retreatChoice54 = {baselineFirst:normalChoice54.first,baselineSecond:normalChoice54.second,
      baselineGain:normalChoice54.gain,baselineClearance:normalChoice54.clearance,
      baselineEndGap:normalChoice54.endGap,changed:normalChoice54.first!==chosen.first ||
        normalChoice54.second!==chosen.second};
  }
  const escapeSafeFrames54 = forceEscape54 ?
    (chosen.clearance >= 14 ? (escapeHold54Input.safeFrames || 0) + 1 : 0) : 0;
  const activatedEscape54 = !forceEscape54 && escaping && chosen.clearance <= 0;
  const releasedEscape54 = forceEscape54 && escapeSafeFrames54 >= 2;
  const escapeHold54 = {
    active: activatedEscape54 || forceEscape54 && !releasedEscape54,
    safeFrames: activatedEscape54 ? 0 : escapeSafeFrames54,
    forced: forceEscape54,
    released: releasedEscape54,
    triggerClearance: activatedEscape54 ? chosen.clearance : escapeHold54Input?.triggerClearance ?? null,
    retreatChoice54
  };
  if (forceEscape54) escaping = true;
  const target = chosen.target && {...chosen.target};
  let nextHistory53 = [];'''
    html = replace_last(html, target_marker, escape_patch)
    return_marker = "return {...chosen, target,\n    velocityMedian53:"
    return_patch = "return {...chosen, target, escapeHold54,\n    velocityMedian53:"
    html = replace_last(html, return_marker, return_patch)
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
