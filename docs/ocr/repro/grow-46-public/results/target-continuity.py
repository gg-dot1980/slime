"""Audit target continuity and heading changes in Grow46 v2.22 size 100-149.

Usage: target-continuity.py LEDGER SUMMARY OUTPUT
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


def angle_degrees(first, second):
    dot = max(-1.0, min(1.0, first["x"] * second["x"] + first["y"] * second["y"]))
    return math.degrees(math.acos(dot))


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


def rate(hit, miss):
    return hit / (hit + miss) if hit + miss else None


def add_observation(counter, realized, large_turn, radius_continuous):
    counter["eligible"] += 1
    counter["realized"] += int(realized)
    counter["missed"] += int(not realized)
    counter["largeTurn"] += int(large_turn)
    counter["largeTurnRealized"] += int(large_turn and realized)
    counter["largeTurnMissed"] += int(large_turn and not realized)
    counter["noLargeTurnRealized"] += int(not large_turn and realized)
    counter["noLargeTurnMissed"] += int(not large_turn and not realized)
    counter["radiusContinuous"] += int(radius_continuous)
    counter["radiusContinuousLargeTurnRealized"] += int(radius_continuous and large_turn and realized)
    counter["radiusContinuousLargeTurnMissed"] += int(radius_continuous and large_turn and not realized)
    counter["radiusContinuousNoLargeTurnRealized"] += int(radius_continuous and not large_turn and realized)
    counter["radiusContinuousNoLargeTurnMissed"] += int(radius_continuous and not large_turn and not realized)


def with_rates(counter):
    values = dict(counter)
    values["largeTurnRealizationRate"] = rate(
        counter["largeTurnRealized"], counter["largeTurnMissed"])
    values["noLargeTurnRealizationRate"] = rate(
        counter["noLargeTurnRealized"], counter["noLargeTurnMissed"])
    values["radiusContinuousLargeTurnRealizationRate"] = rate(
        counter["radiusContinuousLargeTurnRealized"],
        counter["radiusContinuousLargeTurnMissed"])
    values["radiusContinuousNoLargeTurnRealizationRate"] = rate(
        counter["radiusContinuousNoLargeTurnRealized"],
        counter["radiusContinuousNoLargeTurnMissed"])
    return values


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

    totals = Counter()
    groups = {"win": Counter(), "death": Counter()}
    games = []
    for game_id, result in sorted(results.items(), key=lambda item: int(item[0].rsplit("/", 1)[1])):
        samples = sorted(samples_by_game[game_id], key=lambda sample: sample["recordAt"])
        game_counter = Counter()
        for index, sample in enumerate(samples[:-1]):
            plan = sample.get("planOutput") or {}
            next_sample = samples[index + 1]
            next_plan = next_sample.get("planOutput") or {}
            if not (100 <= sample.get("hud", 0) < 150):
                continue
            if plan.get("reason") != "intercept-growth" or (plan.get("gain") or 0) <= 0:
                continue
            if next_sample["recordAt"] - sample["recordAt"] > MAX_NEXT_SAMPLE_MS:
                continue
            realized = next_sample.get("hud", sample["hud"]) > sample["hud"]
            large_turn = angle_degrees(plan, next_plan) > LARGE_TURN_DEGREES
            radius_continuous = radius_continuous_edible_target(plan, next_plan)
            add_observation(totals, realized, large_turn, radius_continuous)
            add_observation(groups[result["outcome"]], realized, large_turn, radius_continuous)
            add_observation(game_counter, realized, large_turn, radius_continuous)
        games.append({
            "game": int(game_id.rsplit("/", 1)[1]),
            "outcome": result["outcome"],
            **with_rates(game_counter),
        })

    assert totals["eligible"] == 123
    assert totals["realized"] == 53 and totals["missed"] == 70
    assert totals["largeTurnRealized"] == 16 and totals["largeTurnMissed"] == 41
    assert totals["noLargeTurnRealized"] == 37 and totals["noLargeTurnMissed"] == 29
    assert totals["radiusContinuousLargeTurnRealized"] == 5
    assert totals["radiusContinuousLargeTurnMissed"] == 28
    assert totals["radiusContinuousNoLargeTurnRealized"] == 21
    assert totals["radiusContinuousNoLargeTurnMissed"] == 20

    output = {
        "candidate": "grow46",
        "phase": "confirm",
        "version": "v2.22",
        "rawSha256": RAW_SHA256,
        "sample": {"games": 12, "wins": 4, "deaths": 8},
        "stage": {"minimumHud": 100, "maximumHudExclusive": 150},
        "method": {
            "eligible": "intercept-growth with positive predicted gain and a next visible sample within 1.52 seconds",
            "realized": "the next visible HUD exceeds the current HUD",
            "largeTurn": "the next selected heading differs by more than 45 degrees",
            "radiusContinuousProxy": "both selected targets are edible NPCs and originalRadius differs by at most 15 percent",
            "limitation": "The radius proxy does not prove NPC identity; results are associations within archived trajectories.",
        },
        "totals": with_rates(totals),
        "groups": {outcome: with_rates(counter) for outcome, counter in groups.items()},
        "games": games,
        "conclusion": {
            "localSignal": "Large heading changes were associated with lower next-sample growth realization, including when the next target had a similar radius.",
            "counterexamples": "Death game 4 had no misses and death game 5 had only two, while win game 2 had fifteen. This is a pursuit-efficiency signal, not a death classifier.",
            "freezeDecision": "Do not freeze a candidate from this audit alone.",
        },
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"sample": output["sample"], "totals": output["totals"],
                      "groups": output["groups"], "conclusion": output["conclusion"]},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
