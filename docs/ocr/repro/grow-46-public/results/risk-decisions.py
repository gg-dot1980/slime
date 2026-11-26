#!/usr/bin/env python3
"""Audit terminal Grow46 v2.22 decisions. Requires Python 3 and Node.js.

Usage: python risk-decisions.py LEDGER CANDIDATE_HTML OUTPUT_JSON

Only recorded terminal snapshots are used. Node evaluates the pinned planner's
pure functions offline with the recorded inputs. There is no browser or game.
"""
import argparse
from collections import Counter
import hashlib
import json
from math import hypot
from pathlib import Path
import subprocess


LEDGER_SHA = "9f82ee6f548a233170f9be285e345abea765a6d42aad89b43dbbaeacc49fe092"
CANDIDATE_SHA = "2d1e128ecd0efd976a3578158f62ea2d1875105bd4f77d247dcf4c90ca5b87aa"
MATCH_DISTANCE = 100
MATCH_RADIUS_FRACTION = 0.20

# Inspect values computed by the frozen function before return. This adds no
# inputs, directions or scores and does not change the planner's choice.
NODE_INSPECT = r"""
const fs = require('node:fs');
const source = fs.readFileSync(process.argv[1], 'utf8');
const from = source.indexOf('function chaseEvidence46(');
const to = source.indexOf('function planGrow46(', from);
const marker = 'return {...chosen, target, chase46:';
const body = source.slice(from, to);
if (from < 0 || to <= from || body.split(marker).length !== 2) throw Error('source boundary');
const inspected = body.replace(marker, 'inspect(localHazards, paths, chosen, safe); ' + marker);
let now = 0, detail;
function inspect(hazards, paths, chosen, safe) {
  const different = paths.filter(p => p.first !== chosen.first && p.wallOK);
  // A descriptive model test. Require at least 10 world units of extra
  // minimum clearance, with no loss on the other listed route dimensions.
  const alternatives = different.filter(p =>
    p.clearance >= chosen.clearance + 10 &&
    p.immediateGap >= chosen.immediateGap - 1e-8 &&
    p.endGap >= chosen.endGap - 1e-8 && p.risk <= chosen.risk + 1e-8 &&
    p.wallCost <= chosen.wallCost + 1e-8 && p.discountedGain >= chosen.discountedGain - 1e-8
  ).sort((a,b) => b.clearance-a.clearance || a.first-b.first || a.second-b.second);
  const pick = p => p && Object.fromEntries(['first','second','clearance','immediateGap',
    'endGap','risk','wallCost','discountedGain'].map(k=>[k,p[k]]));
  const nearest = hazards.map(h=>({x:h.x, y:h.y, distance:Math.hypot(h.x,h.y),
    upper:h.upper, hard:h.hard, mapOnly:h.mapOnly, mapRed:!!h.mapRed, clipped:!!h.clipped}))
    .sort((a,b)=>a.distance-b.distance)[0] || null;
  detail = {safeRouteCount:safe.length, localHazards:hazards.length, nearestLocalHazard:nearest,
    alternativesWithMargin:alternatives.length, bestAlternative:pick(alternatives[0]) || null};
}
const plan = Function('performance', 'inspect', inspected+';return planHunt46')
  ({now:()=>now},inspect);
const cases = JSON.parse(fs.readFileSync(0, 'utf8'));
const rows = cases.map(s=>{
  const i=s.planInput, o=s.planOutput;
  now=s.decisionStartedAt; detail=null;
  const p=plan(i.objects,i.hud,i.map,i.speed,i.velocity,i.heading,'v2.22',
    o.tracking46.observedAt,o.tracking46.npcToast);
  for(const k of ['first','second','escaping','threats','uncertainNpc','reason'])
    if(p[k]!==o[k]) throw Error('recorded selection mismatch: '+k);
  for(const k of ['clearance','immediateGap','endGap','risk','wallCost','discountedGain'])
    if(!Number.isFinite(p[k]) || Math.abs(p[k]-o[k])>1e-6) throw Error('recorded value mismatch: '+k);
  if(!detail || detail.localHazards!==o.threats) throw Error('missing replay detail');
  return detail;
});
process.stdout.write(JSON.stringify(rows));
"""


def verify_file(path, checksum):
    if hashlib.sha256(path.read_bytes()).hexdigest() != checksum:
        raise ValueError(f"SHA-256 mismatch for {path.name}")


def minimap_red_distance(map_data):
    """Nearest red centre after the frozen mapPoint transform, before matching."""
    player = map_data.get("player")
    if not player or not map_data.get("width") or not map_data.get("height"):
        return None
    red = [m for m in map_data.get("growMarkers", []) if m.get("red") is True]
    red.extend(map_data.get("threats", []))
    return min((hypot((m["x"] - player["x"]) * 10400 / map_data["width"],
                      (m["y"] - player["y"]) * 7200 / map_data["height"])
                for m in red), default=None)


def large_appearances(snapshot):
    """Main-view observations. Distinct from the planner's fused hazards."""
    hud, direction = snapshot["hud"], snapshot["planOutput"]
    result = []
    for index, obj in enumerate(snapshot["planInput"]["objects"]):
        if not obj["npc"]:
            continue
        radius = obj["r"]
        red = bool(obj.get("isRed"))
        if radius < 1.08 * (hud - 0.5) and not red:
            continue
        distance = hypot(obj["x"], obj["y"])
        reliable = bool(obj["localReliable"])
        error = max(1.4 if reliable else 2.5,
                    radius * (0.07 if reliable else 0.10 if obj["labelSeen"] else 0.15))
        lower = min(max(1, radius - error), max(1, obj.get("rLower", 1e6)))
        lower = min(200, max(lower, (obj.get("visualR") or 0) * 0.72))
        fitted = (obj["geometryAccepted"] == 1 and not obj["clipped"] and
                  lower >= 1.08 * (hud + 0.5))
        projection = ((direction["x"] * obj["x"] + direction["y"] * obj["y"]) / distance
                      if distance else None)
        result.append({
            "inputIndex": index, "x": obj["x"], "y": obj["y"], "r": radius,
            "distance": distance, "radiusLower": lower, "redMain": red,
            "clipped": obj["clipped"], "geometryAccepted": obj["geometryAccepted"] == 1,
            "localReliable": reliable, "labelSeen": obj["labelSeen"],
            "fittedLarge": fitted, "strictLarge": fitted and reliable,
            "headingCosine": projection,
        })
    return sorted(result, key=lambda obj: (obj["distance"], obj["inputIndex"]))


def possible_neighbours(point, candidates):
    return [other for other in candidates
            if hypot(point["x"] - other["x"], point["y"] - other["y"]) <= MATCH_DISTANCE
            and abs(point["r"] - other["r"]) <= MATCH_RADIUS_FRACTION *
            max(point["r"], other["r"])]


def successive_distance(point, current, previous, dt):
    """Require a unique match in both directions. This is a screen-space proxy."""
    if not point or not (0 < dt <= 220):
        return None
    previous_matches = possible_neighbours(point, previous)
    if len(previous_matches) != 1:
        return None
    prior = previous_matches[0]
    if len(possible_neighbours(prior, current)) != 1:
        return None
    return point["distance"] - prior["distance"]


def present_min(values):
    present = [value for value in values if value is not None]
    return min(present, default=None)


def audit_game(result, inspections):
    frames = result["traceTail"]
    applied = [s["planOutput"]["tracking46"]["appliedCounts"]["applied"] for s in frames]
    if applied != list(range(applied[0], result["controller"]["decisions"] + 1)):
        raise ValueError("missing consecutive terminal decision(s)")
    if any(s["diagnosticTruncated"] or s["planOutput"]["mapStatus"] == "lost"
           or s["decisionAgeMs"] > 200 for s in frames):
        raise ValueError("terminal decision was truncated, discarded or released")
    final_time = frames[-1]["recordAt"]
    rows, previous_objects, previous_at = [], [], None
    for seq, (snap, inspection) in enumerate(zip(frames, inspections, strict=True)):
        out = snap["planOutput"]
        objects = large_appearances(snap)
        nearest = next(iter(objects), None)
        fitted = next((o for o in objects if o["fittedLarge"]), None)
        strict = next((o for o in objects if o["strictLarge"]), None)
        dt = snap["recordAt"] - previous_at if previous_at is not None else 0
        delta = successive_distance(nearest, objects, previous_objects, dt)
        rows.append({
            "applied": applied[seq], "recordAtMs": snap["recordAt"],
            "secondsToFinalDecision": (final_time - snap["recordAt"]) / 1000,
            "hud": snap["hud"], "hudRemaining": snap["hudTime"],
            "heading": out["name"], "first": out["first"], "second": out["second"],
            "reason": out["reason"], "escaping": out["escaping"], "recovering": out["recovering"],
            "immune": out["immune"], "risk": out["risk"], "clearance": out["clearance"],
            "immediateGap": out["immediateGap"], "endGap": out["endGap"],
            "softNpcCount": out["uncertainNpc"], "threats": out["threats"],
            "nearestRawLarge": nearest, "nearestFittedLarge": fitted, "nearestStrictLarge": strict,
            "nearestRawLargeDistanceDelta": delta,
            "nearestMinimapRedDistance": minimap_red_distance(snap["planInput"]["map"]),
            **inspection,
        })
        previous_objects, previous_at = objects, snap["recordAt"]

    raw = [r for r in rows if r["nearestRawLarge"]]
    closing = [r for r in raw if r["nearestRawLargeDistanceDelta"] is not None
               and r["nearestRawLargeDistanceDelta"] < -1]
    concerned = [r for r in rows if r["risk"] > 0 and r["clearance"] < 85]
    escapes = [r for r in rows if r["escaping"]]
    return {
        "game": int(result["id"].rsplit("/", 1)[1]), "outcome": result["outcome"],
        "resultSeconds": result["seconds"], "resultHud": result["evidence"]["size"],
        "resultRemaining": result["evidence"]["remaining"], "rows": len(rows),
        "spanSeconds": rows[0]["secondsToFinalDecision"], "immuneRows": sum(r["immune"] for r in rows),
        "positiveRiskRows": sum(r["risk"] > 0 for r in rows), "peakRisk": max(r["risk"] for r in rows),
        "minRecordedClearance": min(r["clearance"] for r in rows),
        "minRecordedImmediateGap": min(r["immediateGap"] for r in rows),
        "escapeRows": len(escapes),
        "firstEscapeSecondsToFinalDecision": escapes[0]["secondsToFinalDecision"] if escapes else None,
        "reasonCounts": dict(Counter(r["reason"] for r in rows)),
        "headingCounts": dict(Counter(r["heading"] for r in rows)),
        "rawLargeRows": len(raw), "fittedLargeRows": sum(bool(r["nearestFittedLarge"]) for r in rows),
        "strictLargeRows": sum(bool(r["nearestStrictLarge"]) for r in rows),
        "comparableRawLargeRows": sum(r["nearestRawLargeDistanceDelta"] is not None for r in rows),
        "closingRawLargeRows": len(closing),
        "closingAndPointingTowardRows": sum(r["nearestRawLarge"]["headingCosine"] > 1e-8 for r in closing),
        "closestRawLargeDistance": present_min(r["nearestRawLarge"]["distance"] for r in raw),
        "minMinimapRedDistance": present_min(r["nearestMinimapRedDistance"] for r in rows),
        "lastMinimapRedDistance": rows[-1]["nearestMinimapRedDistance"],
        "positiveRiskAndClearanceBelow85Rows": len(concerned),
        "marginAmongThoseRows": sum(r["alternativesWithMargin"] > 0 for r in concerned),
        "ticks": rows,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ledger", type=Path)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    verify_file(args.ledger, LEDGER_SHA)
    verify_file(args.candidate, CANDIDATE_SHA)
    games = []
    with args.ledger.open(encoding="utf-8") as stream:
        for line in stream:
            record = json.loads(line)
            if record["type"] == "result" and record["version"] == "v2.22":
                if not record["nativeStarted"] or not record["evidence"]["resultVisible"]:
                    raise ValueError("natural result evidence missing")
                games.append(record)
    if Counter(r["outcome"] for r in games) != {"win": 4, "death": 8}:
        raise ValueError("confirmation outcomes changed")
    report = []
    for game in games:
        run = subprocess.run(["node", "-e", NODE_INSPECT, str(args.candidate)],
                             input=json.dumps(game["traceTail"]), text=True,
                             capture_output=True, check=True)
        report.append(audit_game(game, json.loads(run.stdout)))
    payload = {
        "ledgerSha256": LEDGER_SHA, "candidateSha256": CANDIDATE_SHA, "version": "v2.22",
        "cohort": "Grow46 independent confirmation; 4 wins, 8 deaths; no new games",
        "scope": "All retained result.traceTail rows once. Time zero is the final applied decision, not the collision. Windows have different lengths.",
        "definitions": {
            "rawLarge": "Main-view NPC whose r >= 1.08*(HUD-.5) or whose main-view danger label is red. Raw radius can be a composite or clipping artefact.",
            "fittedLarge": "Among those, unclipped, geometryAccepted, and conservative capped radius lower bound >= 1.08*(HUD+.5).",
            "strictLarge": "Fitted large and localReliable (including visible label and body-shape checks). Size evidence does not identify the terminal NPC.",
            "closing": "Nearest raw-large observation moves >1 unit closer since previous tick in a mutually unique screen-position/radius match (<=100 units movement, <=20% radius difference, <=220 ms). This is a continuity proxy.",
            "headingCosine": "Dot product of applied unit heading and direction toward visible centre. Positive is toward; this measures command, not realised motion.",
            "localHazards": "Frozen planner count after map association, upper-radius bounds, vicinity filtering and limit. Soft NPC count is the planner diagnostic; differs from visual geometry uncertainty.",
            "minimapRed": "Nearest observed red centre from growMarkers or threats; mapPoint world transform, before association. Empty sets are null.",
            "marginTest": "In rows with recorded risk>0 and clearance<85, require a wall-feasible alternative first heading with >=10 units better 1.6 s minimum hard clearance and no worse immediate gap, end gap, risk, wall cost or discounted gain (1e-8 numeric tolerance). These are within-snapshot model outputs. No altered trajectory was run.",
            "clearanceSentinel": "1000000 is the planner's no-hard-hazard sentinel, not a measured distance.",
        }, "games": report,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
                           encoding="utf-8")


if __name__ == "__main__":
    main()
