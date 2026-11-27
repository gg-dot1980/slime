#!/usr/bin/env python3
"""TEST-ONLY offline study: how many frames help estimate NPC size and motion.

Input: *-frames.jsonl written by scripts/ocr-claude-hybrid.mjs with HYBRID_REC=1 (10 fps game time).
Association is IDEAL (each detection is matched to its true NPC per frame), so results are an upper bound on what a
tracker could reach; a real tracker also has to associate detections itself.

World positions of detections use the controller's OWN player-velocity estimate (dead reckoning), not the true
player position, so camera-motion error is included.

Usage: python3 scripts/analyze-ocr-claude-tracking.py <frames.jsonl>... > summary.json
"""
import gzip, json, math, sys, statistics as st

H = 15  # prediction horizon in frames (1.5 s at 10 fps), the planner's rollout length


def q(a, p):
    a = sorted(a)
    return round(a[int(p * (len(a) - 1))], 3) if a else None


def load(paths):
    for path in paths:
        for line in (gzip.open(path, 'rt') if path.endswith('.gz') else open(path)):
            yield json.loads(line)


def match(frame):
    """Per frame: {true id: detection} for in-view true NPCs, nearest centre within a gate."""
    out, used = {}, set()
    px, py = frame['p'][0], frame['p'][1]
    cx, cy, vw, vh = frame['cam']
    for tid, x, y, r, vx, vy, inview in sorted(frame['tru'], key=lambda t: -t[3]):
        if not inview:
            continue
        wx, wy = x + px, y + py
        part = wx - r < cx or wy - r < cy or wx + r > cx + vw or wy + r > cy + vh
        gate, best = (r if part else max(40, r * .6)), None
        for j, d in enumerate(frame['det']):
            if j in used:
                continue
            dd = math.hypot(d[0] - x, d[1] - y)
            if dd < gate:
                gate, best = dd, j
        if best is not None:
            used.add(best)
            out[tid] = (frame['det'][best], part)
    return out


def study(games):
    res = {'velocity': {}, 'size': {}, 'counts': {}}
    vel = {}   # (fps, N) -> list of (pred err px over 1.5 s, angle err deg or None)
    base = []  # controller's own per-frame velocity estimate
    size = {}  # method -> list of (ratio, true r/R, clipped)
    for g in games:
        F = g['frames']
        # dead-reckoned player world position from the controller's own velocity estimate
        est = [(0.0, 0.0)]
        for k in range(1, len(F)):
            dt = (F[k]['t'] - F[k - 1]['t']) / 1000
            ev = F[k]['ev'] or [F[k]['p'][3], F[k]['p'][4]]
            est.append((est[-1][0] + ev[0] * dt, est[-1][1] + ev[1] * dt))
        M = [match(f) for f in F]
        truth = [{t[0]: t for t in f['tru']} for f in F]
        for k in range(len(F)):
            R = F[k]['p'][2]
            for tid, (d, part) in M[k].items():
                tr = truth[k][tid]
                # --- motion: does tid exist H frames later? true world displacement
                if k + H < len(F) and tid in truth[k + H]:
                    t2 = truth[k + H][tid]
                    true_dx = (t2[1] + F[k + H]['p'][0]) - (tr[1] + F[k]['p'][0])
                    true_dy = (t2[2] + F[k + H]['p'][1]) - (tr[2] + F[k]['p'][1])
                    tspeed = math.hypot(true_dx, true_dy) / 1.5

                    def err(vx, vy):
                        e = math.hypot(vx * 1.5 - true_dx, vy * 1.5 - true_dy)
                        a = None
                        if tspeed > 20 and math.hypot(vx, vy) > 1:
                            a = abs(math.degrees(math.atan2(vx * true_dy - vy * true_dx, vx * true_dx + vy * true_dy)))
                        return e, a
                    if not d[3]:
                        base.append(err(d[4], d[5]) + (tspeed,))
                        for fps, step in ((10, 1), (5, 2)):
                            for N in (2, 3, 4, 5, 6, 8, 10, 12, 15):
                                pts = []
                                for j in range(N):
                                    kk = k - j * step
                                    if kk < 0 or tid not in M[kk]:
                                        continue
                                    dj, _ = M[kk][tid]
                                    if dj[3]:
                                        continue  # clipped centres are biased
                                    pts.append((F[kk]['t'] / 1000, dj[0] + est[kk][0], dj[1] + est[kk][1]))
                                if len(pts) < 2:
                                    continue
                                ts = [p[0] for p in pts]
                                mt = sum(ts) / len(ts)
                                den = sum((t - mt) ** 2 for t in ts)
                                if den <= 0:
                                    continue
                                vx = sum((p[0] - mt) * p[1] for p in pts) / den
                                vy = sum((p[0] - mt) * p[2] for p in pts) / den
                                vel.setdefault((fps, N), []).append(err(vx, vy) + (tspeed,))
                # --- size
                rt = tr[3]
                single = d[2]
                if d[3]:  # clipped: controller's own best estimate = seg/fit if larger than the visible part
                    cands = [v for v in (d[6], d[7]) if v and v >= d[2] * .95]
                    single = cands[0] if cands else d[2]
                size.setdefault('single', []).append((single / rt, rt / R, d[3]))
                for fps, step in ((10, 1), (5, 2)):
                    for N in (3, 5, 10, 15, 30):
                        vals = []
                        for j in range(N):
                            kk = k - j * step
                            if kk >= 0 and tid in M[kk] and not M[kk][tid][0][3]:
                                vals.append(M[kk][tid][0][2])
                        est_r = st.median(vals) if vals else single
                        size.setdefault(f'{fps}fps-median{N}', []).append((est_r / rt, rt / R, d[3]))
                # memory: last unclipped size seen within 5 s (any frame rate), else single
                mem = None
                for kk in range(k, max(-1, k - 50), -1):
                    if tid in M[kk] and not M[kk][tid][0][3]:
                        vals = [M[j][tid][0][2] for j in range(kk, max(-1, kk - 5), -1) if tid in M[j] and not M[j][tid][0][3]]
                        mem = st.median(vals)
                        break
                size.setdefault('memory5s-median5', []).append(((mem or single) / rt, rt / R, d[3]))
        res['counts'][f"{g['version']}#{g['index']}"] = {'frames': len(F), 'matched': sum(len(m) for m in M)}

    def vsum(rows):
        e = [r[0] for r in rows]
        a = [r[1] for r in rows if r[1] is not None]
        return {'n': len(rows), 'err1.5s_med_px': q(e, .5), 'err1.5s_p90_px': q(e, .9), 'angle_med_deg': q(a, .5),
                'angle_over45_pct': round(100 * sum(x > 45 for x in a) / len(a), 1) if a else None}
    res['velocity']['controller-now'] = vsum(base)
    res['velocity']['zero-velocity'] = vsum([(r[2] * 1.5, None, r[2]) for r in base])
    for (fps, N), rows in sorted(vel.items()):
        res['velocity'][f'{fps}fps-N{N}({N * (10 // fps) / 10:.1f}s)'] = vsum(rows)

    def ssum(rows):
        def part(sel):
            rr = [r for r in rows if sel(r)]
            ab = [abs(r[0] - 1) for r in rr]
            return {'n': len(rr), 'abs_err_med': q(ab, .5), 'abs_err_p90': q(ab, .9),
                    'threat_read_below_1.08_pct': round(100 * sum(r[0] * r[1] < 1.08 for r in rr if r[1] >= 1.08) / max(1, sum(r[1] >= 1.08 for r in rr)), 1),
                    'prey_read_not_edible_pct': round(100 * sum(r[0] * r[1] >= 1 / 1.08 for r in rr if r[1] < 1 / 1.08) / max(1, sum(r[1] < 1 / 1.08 for r in rr)), 1)}
        return {'unclipped': part(lambda r: not r[2]), 'clipped': part(lambda r: r[2])}
    for k2, rows in size.items():
        res['size'][k2] = ssum(rows)
    return res


if __name__ == '__main__':
    print(json.dumps(study(list(load(sys.argv[1:]))), ensure_ascii=False, indent=1))
