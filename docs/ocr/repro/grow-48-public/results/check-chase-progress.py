"""Check a single visible pursuit signature on private, already closed batches.

Arguments are the terminal diagnostic, Grow47 exploration, Grow48 exploration
and a private output path. Only periodic observations are used in every group.
"""
import hashlib
import json
import math
import sys
from collections import Counter
from pathlib import Path

EXPECTED = [
    ("grow48", "diagnostic", "42e7619ac2da77557bed3c272dc43d57e628509d077c60a3d2dc9db41016ea25"),
    ("grow47", "explore", "ec83b24dfaf96441ef74e1eca86db4d5a38388c98f76940fd472eab12895fe4e"),
    ("grow48", "explore", "fc3a7043bf7a964f782eddcc2e1274537aa96d0b713c06d57e54853537dab173"),
]


def selected(s):
    u = s["planInput"]
    m = u.get("map")
    t = s["planOutput"].get("target")
    if not (m and m.get("player") and t and t.get("npc") and t.get("edible")
            and not t.get("mapOnly") and not s["planOutput"]["escaping"]):
        return None
    hits = [b for b in u["objects"] if b.get("npc") and b["x"] == t["x"] and b["y"] == t["y"]]
    if len(hits) != 1:
        return None
    b = hits[0]
    if (b.get("geometryAccepted") != 1 or not b.get("localReliable") or b.get("clipped")
            or b.get("isRed") or b.get("blocked") or t.get("mapRed")):
        return None
    return b


def map_position(s, b):
    m = s["planInput"]["map"]
    return (m["player"]["x"] / m["width"] * 10400 + b["x"],
            m["player"]["y"] / m["height"] * 7200 + b["y"])


def marker_scale(s):
    m = s["planInput"]["map"]
    return max(10400 / m["width"], 7200 / m["height"])


def match(a, body, b):
    dt = (b["recordAt"] - a["recordAt"]) / 1000
    m = b["planInput"].get("map")
    if not (0 < dt <= 1.5 and m and m.get("player")):
        return None
    x, y = map_position(a, body)
    pred = x + body.get("vx", 0) * dt, y + body.get("vy", 0) * dt
    gate = max(60, 1.35 * marker_scale(b)) + 30 * dt
    hits = [o for o in b["planInput"]["objects"] if o.get("npc")
            and abs(o["r"] - body["r"]) <= max(3, .08 * body["r"])
            and math.dist(map_position(b, o), pred) <= gate]
    return hits[0] if len(hits) == 1 else None


def seconds(s):
    m, t = map(int, s["hudTime"].split(":"))
    return 300 - 60 * m - t


def distance(body):
    return math.hypot(body["x"], body["y"])


def inspect(snapshots):
    alerts, chain = [], []
    emitted = False
    eligible = 0
    for i, s in enumerate(snapshots):
        body = selected(s)
        if not body:
            chain = []
            emitted = False
            continue
        if chain and match(*chain[-1], s) is not body:
            chain = []
            emitted = False
        chain.append((s, body))
        # Use the shortest suffix covering three actual seconds. This includes
        # four or more samples at the normal r4 periodic cadence.
        while len(chain) > 4 and s["recordAt"] - chain[1][0]["recordAt"] >= 3000:
            chain.pop(0)
        if len(chain) < 4 or s["recordAt"] - chain[0][0]["recordAt"] < 3000:
            continue
        eligible += 1
        gain = distance(chain[0][1]) - distance(body)
        if (emitted or gain > marker_scale(s) or any(q["hud"] != s["hud"]
                or q["planOutput"]["tracking46"]["npcToast"]
                or distance(o) <= .72 * (q["hud"] + o["r"]) for q, o in chain)):
            continue
        emitted = True
        following = []
        prev, tracked = s, body
        for nxt in snapshots[i + 1:]:
            if nxt["recordAt"] - s["recordAt"] > 4000:
                break
            tracked = match(prev, tracked, nxt)
            if not tracked:
                break
            following.append((seconds(nxt), distance(tracked)))
            prev = nxt
        neighbours = []
        for index, relation in [(i - 1, "before"), (i + 1, "after")]:
            if 0 <= index < len(snapshots):
                adj = snapshots[index]
                other = selected(adj)
                if other is None:
                    continue
                same = match(adj, other, s) is body if relation == "before" else match(s, body, adj) is other
                if same:
                    neighbours.append({"position":relation,"elapsed":seconds(adj),"recordAt":adj["recordAt"]})
        alerts.append({"elapsed":seconds(s), "recordAt":s["recordAt"], "hud":s["hud"],
                       "windowStart":seconds(chain[0][0]), "distance":distance(body),
                       "netApproach":gain, "mapPixel":marker_scale(s), "following":following,
                       "sameTargetNeighbours":neighbours})
    return eligible, alerts


def main():
    details=[]
    for filename, (candidate,phase,digest) in zip(sys.argv[1:4], EXPECTED, strict=True):
        path=Path(filename)
        raw=path.read_bytes()
        assert hashlib.sha256(raw).hexdigest()==digest
        report=json.loads(path.with_name(path.stem+"-summary.json").read_bytes())
        assert report["integrityOk"] and report["complete"] and report["rawSha256"]==digest
        rows=[json.loads(line) for line in raw.splitlines()]
        assert rows[0]["phase"]==phase and rows[0]["contract"]["candidate"]==candidate
        for result in [r for r in rows if r["type"]=="result" and r["version"]=="v2.22"]:
            sid=result["id"]
            items=[r["snapshot"] for r in rows if r["type"]=="sample" and r["id"]==sid]
            eligible, alerts=inspect(items)
            details.append({"candidate":candidate,"phase":phase,"outcome":result["outcome"],
                            "game":sid,"periodic":len(items),"threeSecondWindows":eligible,"alerts":alerts})
    assert Counter((d["phase"],d["outcome"]) for d in details)=={
        ("diagnostic","deadline"):1,("explore","deadline"):3,("explore","death"):3,("explore","win"):2}
    Path(sys.argv[4]).write_text(json.dumps(details,ensure_ascii=False,indent=2)+"\n")
    for phase,outcome in sorted({(d["phase"],d["outcome"]) for d in details}):
        group=[d for d in details if (d["phase"],d["outcome"])==(phase,outcome)]
        print(phase,outcome,"games with a flag",sum(bool(d["alerts"]) for d in group),"/",len(group),
              "alerts",sum(len(d["alerts"]) for d in group),"periodic",sum(d["periodic"] for d in group),
              "trackable windows",sum(d["threeSecondWindows"] for d in group))


if __name__ == "__main__":
    main()
