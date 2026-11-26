"""Replay a one-sample 45-degree heading limit on archived Grow46 decisions.

Usage: turn-limit-replay.py LEDGER SUMMARY OUTPUT
"""
import hashlib
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

RAW_SHA256 = "9f82ee6f548a233170f9be285e345abea765a6d42aad89b43dbbaeacc49fe092"
MAX_NEXT_SAMPLE_MS = 1520
MAX_RADIUS_DELTA = 0.15
LARGE_TURN_DEGREES = 45.1
NEAR_WALL_DISTANCE = 150
SQRT_HALF = 2 ** -0.5
DIRECTIONS = (
    (1, 0, "東"), (SQRT_HALF, SQRT_HALF, "東南"), (0, 1, "南"),
    (-SQRT_HALF, SQRT_HALF, "西南"), (-1, 0, "西"),
    (-SQRT_HALF, -SQRT_HALF, "西北"), (0, -1, "北"),
    (SQRT_HALF, -SQRT_HALF, "東北"),
)


def angle_degrees(first, second):
    dot = max(-1.0, min(1.0, first["x"] * second["x"] + first["y"] * second["y"]))
    return math.degrees(math.acos(dot))


def direction_index(plan):
    return max(range(8), key=lambda index: DIRECTIONS[index][0] * plan["x"]
               + DIRECTIONS[index][1] * plan["y"])


def radius_continuous_edible_target(first, second):
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
    walls = [value for value in map_data.get("visibleWalls", [])
             if isinstance(value, (int, float))]
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


def projected_distance(target, speed, direction_index_value):
    direction = DIRECTIONS[direction_index_value]
    x = target["x"] + (target.get("vx") or 0) - direction[0] * speed
    y = target["y"] + (target.get("vy") or 0) - direction[1] * speed
    return math.hypot(x, y)


def capped_direction(previous, selected, target, speed):
    previous_index = direction_index(previous)
    selected_index = direction_index(selected)
    clockwise = (selected_index - previous_index) % 8
    counterclockwise = (previous_index - selected_index) % 8
    candidates = []
    if clockwise <= counterclockwise:
        candidates.append((previous_index + 1) % 8)
    if counterclockwise <= clockwise:
        candidates.append((previous_index - 1) % 8)
    return min(candidates, key=lambda index: projected_distance(target, speed, index))


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

    triggers = []
    games = defaultdict(Counter)
    for game_id, result in sorted(results.items(), key=lambda item: int(item[0].rsplit("/", 1)[1])):
        samples = sorted(samples_by_game[game_id], key=lambda sample: sample["recordAt"])
        game_number = int(game_id.rsplit("/", 1)[1])
        for index, previous in enumerate(samples[:-1]):
            current = samples[index + 1]
            previous_plan = previous.get("planOutput") or {}
            current_plan = current.get("planOutput") or {}
            if not (100 <= previous.get("hud", 0) < 150):
                continue
            if previous_plan.get("reason") != "intercept-growth" or (previous_plan.get("gain") or 0) <= 0:
                continue
            if current["recordAt"] - previous["recordAt"] > MAX_NEXT_SAMPLE_MS:
                continue
            if current.get("hud") != previous.get("hud"):
                continue
            if angle_degrees(previous_plan, current_plan) <= LARGE_TURN_DEGREES:
                continue
            if not radius_continuous_edible_target(previous_plan, current_plan):
                continue

            exclusions = safety_exclusions(current)
            counter = games[(result["outcome"], game_number)]
            counter["potential"] += 1
            counter["excluded"] += int(bool(exclusions))
            trigger = {
                "game": game_number,
                "outcome": result["outcome"],
                "hud": current["hud"],
                "previousDirection": previous_plan["name"],
                "selectedDirection": current_plan["name"],
                "exclusions": exclusions,
            }
            if not exclusions:
                target = current_plan["target"]
                speed = current["planInput"]["speed"]
                capped_index = capped_direction(previous_plan, current_plan, target, speed)
                selected_index = direction_index(current_plan)
                selected_distance = projected_distance(target, speed, selected_index)
                capped_distance = projected_distance(target, speed, capped_index)
                difference = selected_distance - capped_distance
                counter["safe"] += 1
                counter["closer"] += int(difference > 0)
                counter["farther"] += int(difference < 0)
                trigger.update({
                    "cappedDirection": DIRECTIONS[capped_index][2],
                    "selectedProjectedDistance": selected_distance,
                    "cappedProjectedDistance": capped_distance,
                    "distanceImprovement": difference,
                    "effect": "closer" if difference > 0 else "farther" if difference < 0 else "equal",
                })
            triggers.append(trigger)

    totals = Counter()
    for counter in games.values():
        totals.update(counter)
    assert totals == {"potential": 28, "excluded": 14, "safe": 14, "closer": 6, "farther": 8}
    output = {
        "candidate": "grow46",
        "phase": "closed-confirmation-replay",
        "version": "v2.22",
        "rawSha256": RAW_SHA256,
        "sample": {"games": 12, "wins": 4, "deaths": 8},
        "rule": {
            "trigger": "unchanged HUD, similar-radius edible target, and a selected turn greater than 45 degrees",
            "change": "limit the current turn to one adjacent 45-degree direction for one sample",
            "safetyExclusions": ["escape or recovery", "positive risk", "wall penalty", "visible wall under 150"],
            "projection": "one second using visible target velocity, player speed, and the selected or capped heading",
        },
        "totals": dict(totals),
        "games": [
            {"outcome": outcome, "game": game, **dict(counter)}
            for (outcome, game), counter in sorted(games.items(), key=lambda item: item[0][1])
        ],
        "triggers": triggers,
        "decision": {
            "supported": False,
            "reason": "Only 6/14 safe triggers shortened projected target distance; 8/14 increased it.",
            "counterexamples": "Both safe triggers in win game 2 became farther. Death games 4 and 5 never reached the safe trigger, so the rule cannot address them.",
            "nextStep": "Test a narrower repeated direction-oscillation hypothesis before any candidate change.",
        },
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"sample": output["sample"], "totals": output["totals"],
                      "games": output["games"], "decision": output["decision"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
