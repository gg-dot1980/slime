"""Audit repeated opposite-direction oscillation in archived Grow46 decisions.

Usage: oscillation-audit.py LEDGER SUMMARY OUTPUT
"""
import hashlib
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

RAW_SHA256 = "9f82ee6f548a233170f9be285e345abea765a6d42aad89b43dbbaeacc49fe092"
MAX_SAMPLE_MS = 1520
MIN_REVERSAL_DEGREES = 135
MAX_RETURN_DEGREES = 45.1
MAX_RADIUS_DELTA = 0.15
NEAR_WALL_DISTANCE = 150


def angle(first, second):
    dot = max(-1.0, min(1.0, first["x"] * second["x"] + first["y"] * second["y"]))
    return math.degrees(math.acos(dot))


def radius_continuous(first, second):
    first_target = first.get("target") or {}
    second_target = second.get("target") or {}
    first_radius = first_target.get("originalRadius")
    second_radius = second_target.get("originalRadius")
    if not all(isinstance(value, (int, float)) for value in (first_radius, second_radius)):
        return False
    if not (second_target.get("npc") and second_target.get("edible")):
        return False
    return abs(second_radius - first_radius) / max(first_radius, second_radius) <= MAX_RADIUS_DELTA


def safety_exclusions(snapshot):
    plan = snapshot.get("planOutput") or {}
    map_data = (snapshot.get("planInput") or {}).get("map") or {}
    walls = [value for value in map_data.get("visibleWalls", []) if isinstance(value, (int, float))]
    exclusions = []
    if plan.get("escaping") or plan.get("recovering"):
        exclusions.append("escape-or-recovery")
    if (plan.get("risk") or 0) > 0:
        exclusions.append("positive-risk")
    if not plan.get("wallOK", False) or (plan.get("wallCost") or 0) > 0:
        exclusions.append("wall-penalty")
    if walls and min(walls) < NEAR_WALL_DISTANCE:
        exclusions.append("near-visible-wall")
    return exclusions


def projected_distance(plan, target, speed):
    x = target["x"] + (target.get("vx") or 0) - plan["x"] * speed
    y = target["y"] + (target.get("vy") or 0) - plan["y"] * speed
    return math.hypot(x, y)


def main():
    ledger_path, summary_path, output_path = map(Path, sys.argv[1:4])
    raw = ledger_path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == RAW_SHA256
    summary = json.loads(summary_path.read_text())
    assert summary["rawSha256"] == RAW_SHA256
    assert summary["complete"] and summary["integrityOk"]
    assert summary["counts"]["v2.22"]["wins"] == 4
    assert summary["counts"]["v2.22"]["deaths"] == 8

    rows = [json.loads(line) for line in raw.splitlines()]
    results = {row["id"]: row for row in rows
               if row["type"] == "result" and row["version"] == "v2.22"}
    assert Counter(row["outcome"] for row in results.values()) == {"win": 4, "death": 8}
    samples_by_game = defaultdict(list)
    for row in rows:
        if row["type"] == "sample" and row["version"] == "v2.22":
            samples_by_game[row["id"]].append(row["snapshot"])

    windows = []
    games = defaultdict(Counter)
    for game_id, result in sorted(results.items(), key=lambda item: int(item[0].rsplit("/", 1)[1])):
        samples = sorted(samples_by_game[game_id], key=lambda sample: sample["recordAt"])
        game_number = int(game_id.rsplit("/", 1)[1])
        for index in range(len(samples) - 2):
            first, middle, last = samples[index:index + 3]
            plans = [sample.get("planOutput") or {} for sample in (first, middle, last)]
            if max(middle["recordAt"] - first["recordAt"], last["recordAt"] - middle["recordAt"]) > MAX_SAMPLE_MS:
                continue
            if not all(100 <= sample.get("hud", 0) < 150 for sample in (first, middle, last)):
                continue
            if not all(plan.get("reason") == "intercept-growth" and (plan.get("gain") or 0) > 0
                       for plan in plans):
                continue
            if not first["hud"] == middle["hud"] == last["hud"]:
                continue
            if not (radius_continuous(plans[0], plans[1]) and radius_continuous(plans[1], plans[2])):
                continue
            if angle(plans[0], plans[1]) < MIN_REVERSAL_DEGREES:
                continue
            if angle(plans[1], plans[2]) < MIN_REVERSAL_DEGREES:
                continue
            if angle(plans[0], plans[2]) > MAX_RETURN_DEGREES:
                continue

            next_growth = (index + 3 < len(samples)
                           and samples[index + 3]["recordAt"] - last["recordAt"] <= MAX_SAMPLE_MS
                           and samples[index + 3]["hud"] > last["hud"])
            exclusions = safety_exclusions(last)
            counter = games[(result["outcome"], game_number)]
            counter["windows"] += 1
            counter["nextGrowth"] += int(next_growth)
            counter["excluded"] += int(bool(exclusions))
            window = {
                "game": game_number,
                "outcome": result["outcome"],
                "hud": last["hud"],
                "directions": [plan["name"] for plan in plans],
                "nextGrowth": next_growth,
                "exclusions": exclusions,
            }
            if not exclusions:
                target = plans[2]["target"]
                speed = last["planInput"]["speed"]
                original_distance = projected_distance(plans[2], target, speed)
                retained_distance = projected_distance(plans[1], target, speed)
                difference = original_distance - retained_distance
                counter["safe"] += 1
                counter["retainedCloser"] += int(difference > 0)
                counter["retainedFarther"] += int(difference < 0)
                window.update({
                    "originalProjectedDistance": original_distance,
                    "retainMiddleProjectedDistance": retained_distance,
                    "distanceImprovement": difference,
                    "effect": "closer" if difference > 0 else "farther" if difference < 0 else "equal",
                })
            windows.append(window)

    totals = Counter()
    for counter in games.values():
        totals.update(counter)
    assert totals == {"windows": 5, "nextGrowth": 0, "excluded": 3,
                      "safe": 2, "retainedCloser": 1, "retainedFarther": 1}
    assert games[("death", 3)]["windows"] == 4
    assert games[("death", 11)]["windows"] == 1
    output = {
        "candidate": "grow46",
        "phase": "closed-confirmation-analysis",
        "version": "v2.22",
        "rawSha256": RAW_SHA256,
        "sample": {"games": 12, "wins": 4, "deaths": 8},
        "definition": {
            "window": "three consecutive unchanged-HUD intercept-growth samples",
            "targetContinuity": "selected edible target originalRadius differs by at most 15 percent across both transitions",
            "oscillation": "both turns are at least 135 degrees and the first and third headings differ by at most 45 degrees",
            "limitation": "Overlapping windows are counted and similar radius does not prove NPC identity.",
        },
        "totals": dict(totals),
        "games": [{"outcome": outcome, "game": game, **dict(counter)}
                  for (outcome, game), counter in sorted(games.items(), key=lambda item: item[0][1])],
        "windows": windows,
        "decision": {
            "supported": False,
            "reason": "All five windows were in death games 3 and 11, but only two survived safety exclusions; retaining the middle heading improved one and worsened one.",
            "coverage": "The signal did not cover death games 6 or 7 and did not occur in wins or death games 4 and 5.",
            "nextStep": "Audit the final three visible seconds of death games 4 and 5 for missed large-NPC threat recognition before another pursuit change.",
        },
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"sample": output["sample"], "totals": output["totals"],
                      "games": output["games"], "decision": output["decision"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
