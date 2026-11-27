"""Build Grow53 from the frozen Grow52 candidate."""
import argparse
import hashlib
from pathlib import Path

BASE = "6a0562b8bd74c38e9d49a666d870fd5e33314dfab8df1b09b4d4633ac96875b6"


def build(parent):
    raw = parent.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE, "Grow52 parent digest mismatch"
    html = raw.decode()

    def change(before, after):
        nonlocal html
        assert html.count(before) == 1, before
        html = html.replace(before, after)

    for old, new in [
        ("<title>OCR Grow · Grow52 · 正常安全間隙 14</title>",
         "<title>OCR Grow · Grow53 · 三畫面目標速度中位數</title>"),
        ("<strong>OCR Grow · Grow52 · 正常安全間隙 14</strong>",
         "<strong>OCR Grow · Grow53 · 三畫面目標速度中位數</strong>"),
        (">OCR Grow 52<", ">OCR Grow 53<"),
        ("<h1>Grow52 · 正常安全間隙 14</h1>",
         "<h1>Grow53 · 三畫面目標速度中位數</h1>"),
        ("Grow52 · v2.22 正常安全間隙 14", "Grow53 · v2.22 三畫面目標速度中位數"),
        ("v2.13 沿用 Grow38。v2.22 沿用 Grow51；正常選路的預測最小安全間隙由 4 提高為 14，既有逃逸與切換路徑安全閘不變。",
         "v2.13 沿用 Grow38。v2.22 沿用 Grow52；HUD 停滯至少 4 秒且同一可吃 NPC 連續匹配三個畫面時，只以三畫面速度中位數抑制當幀速度雜訊，不鎖目標、方向或第一段時長。"),
        ("Grow52 候選／Grow-12 舊基線", "Grow53 候選／Grow-12 舊基線"),
    ]:
        change(old, new)
    assert html.count("strategy: 'grow-52'") == 2
    html = html.replace("strategy: 'grow-52'", "strategy: 'grow-53'")

    marker = "  for (const o of reds) if (!o.matched) hazards.push({...o, hard: true,"
    assert html.count(marker) == 2
    velocity = r'''  const priorVelocity53 = old.velocityMedian53;
  const stallStartedAt53 = priorVelocity53?.hud === r ? priorVelocity53.stallStartedAt : now;
  const history53 = priorVelocity53?.hud === r && Array.isArray(priorVelocity53.history) ?
    priorVelocity53.history.slice(-2) : [];
  const sameTarget53 = (prior, current, dt, currentPlayerV) => {
    if (!prior || !current || dt <= 0 || dt > 1.5 ||
        Math.abs(current.r - prior.r) > Math.max(8, prior.r * .14)) return false;
    const px = prior.x + (prior.vx || 0) * dt -
      ((prior.playerV?.x || 0) + (currentPlayerV?.x || 0)) * .5 * dt;
    const py = prior.y + (prior.vy || 0) * dt -
      ((prior.playerV?.y || 0) + (currentPlayerV?.y || 0)) * .5 * dt;
    return hypot(current.x - px, current.y - py) <= Math.max(180, speed * dt * .9, r * 1.25);
  };
  let appliedVelocity53 = null;
  if (now - stallStartedAt53 >= 4000 && history53.length >= 2) {
    const prior = history53[history53.length - 1], dt = (now - prior.recordAt) / 1000;
    const candidates53 = meals.filter(o => o.npc && !o.food &&
      Math.abs(o.r - prior.r) <= Math.max(8, prior.r * .14))
      .map(o => { const px = prior.x + (prior.vx || 0) * dt -
          ((prior.playerV?.x || 0) + (v.x || 0)) * .5 * dt,
        py = prior.y + (prior.vy || 0) * dt -
          ((prior.playerV?.y || 0) + (v.y || 0)) * .5 * dt;
        return {o, distance: hypot(o.x - px, o.y - py)}; })
      .filter(x => x.distance <= Math.max(180, speed * dt * .9, r * 1.25))
      .sort((a, b) => a.distance - b.distance);
    const match53 = candidates53[0];
    if (match53 && sameTarget53(prior, match53.o, dt, v)) {
      const median53 = values => values.slice().sort((a, b) => a - b)[1];
      match53.o.rawVx53 = match53.o.vx || 0; match53.o.rawVy53 = match53.o.vy || 0;
      match53.o.vx = median53([history53[0].vx || 0, history53[1].vx || 0, match53.o.rawVx53]);
      match53.o.vy = median53([history53[0].vy || 0, history53[1].vy || 0, match53.o.rawVy53]);
      appliedVelocity53 = {vx: match53.o.vx, vy: match53.o.vy, distance: match53.distance};
    }
  }
'''
    marker_at = html.rfind(marker)
    html = html[:marker_at] + velocity + html[marker_at:]

    end_marker = "  const target = chosen.target && {...chosen.target};\n  return {...chosen, target,"
    assert html.count(end_marker) == 2
    end_patch = r'''  const target = chosen.target && {...chosen.target};
  let nextHistory53 = [];
  if (target?.npc && !target.mapOnly) {
    const current53 = {recordAt: now, x: target.x, y: target.y, r: target.r,
      vx: target.rawVx53 ?? target.vx ?? 0, vy: target.rawVy53 ?? target.vy ?? 0,
      playerV: {x: v.x, y: v.y}};
    const prior53 = history53[history53.length - 1], dt53 = prior53 ? (now - prior53.recordAt) / 1000 : 0;
    nextHistory53 = prior53 && sameTarget53(prior53, current53, dt53, v) ?
      [...history53, current53].slice(-2) : [current53];
  }
  return {...chosen, target,
    velocityMedian53:{hud:r,stallStartedAt:stallStartedAt53,history:nextHistory53,
      applied:!!appliedVelocity53,median:appliedVelocity53},'''
    end_at = html.rfind(end_marker)
    html = html[:end_at] + end_patch + html[end_at + len(end_marker):]
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
