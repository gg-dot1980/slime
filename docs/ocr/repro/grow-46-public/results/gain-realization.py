"""Audit predicted growth against later visible HUD growth in Grow46 v2.22.

Usage: gain-realization.py LEDGER SUMMARY OUTPUT
"""
import hashlib
import json
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path

RAW_SHA256 = "9f82ee6f548a233170f9be285e345abea765a6d42aad89b43dbbaeacc49fe092"
HORIZONS_SECONDS = (1.5, 2.5, 3.5)


def median(values):
    return statistics.median(values) if values else None


def selected_edible_npc(plan):
    target = plan.get("target") or {}
    return bool(target.get("npc") and target.get("edible"))


def visible_growth_within(samples, index, horizon_seconds):
    current = samples[index]
    current_hud = current["hud"]
    limit = current["recordAt"] + horizon_seconds * 1000 + 20
    future = [sample for sample in samples[index + 1:]
              if sample["recordAt"] <= limit]
    if not future:
        return None
    maximum = max([current_hud] + [sample["hud"] for sample in future])
    return maximum - current_hud


def summarize_group(games, outcome):
    selected = [game for game in games if game["outcome"] == outcome]
    horizons = {}
    for horizon in HORIZONS_SECONDS:
        realized = sum(game["horizons"][str(horizon)]["realized"] for game in selected)
        eligible = sum(game["horizons"][str(horizon)]["eligible"] for game in selected)
        ratios = [game["horizons"][str(horizon)]["ratio"] for game in selected
                  if game["horizons"][str(horizon)]["ratio"] is not None]
        horizons[str(horizon)] = {
            "realized": realized,
            "eligible": eligible,
            "pooledRatio": realized / eligible,
            "gameMedianRatio": median(ratios),
            "gameRatioRange": [min(ratios), max(ratios)],
        }
    reason_counts = defaultdict(lambda: {"predictedPositive": 0, "nextHudIncreased": 0})
    for game in selected:
        for reason, counts in game["reasons"].items():
            reason_counts[reason]["predictedPositive"] += counts["predictedPositive"]
            reason_counts[reason]["nextHudIncreased"] += counts["nextHudIncreased"]
    return {
        "games": len(selected),
        "stageSamples": sum(game["stageSamples"] for game in selected),
        "predictedPositive": sum(game["predictedPositive"] for game in selected),
        "selectedEdibleNpc": sum(game["selectedEdibleNpc"] for game in selected),
        "horizons": horizons,
        "reasonsAtNextSample": dict(sorted(reason_counts.items())),
    }


def main():
    ledger_path, summary_path, output_path = map(Path, sys.argv[1:4])
    raw = ledger_path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == RAW_SHA256
    summary = json.loads(summary_path.read_text())
    assert summary["rawSha256"] == RAW_SHA256
    assert summary["complete"] and summary["integrityOk"]
    assert summary["phase"] == "confirm"
    assert summary["counts"]["v2.22"]["wins"] == 4
    assert summary["counts"]["v2.22"]["deaths"] == 8

    rows = [json.loads(line) for line in raw.splitlines()]
    results = {row["id"]: row for row in rows
               if row["type"] == "result" and row["version"] == "v2.22"}
    assert len(results) == 12
    assert Counter(row["outcome"] for row in results.values()) == {"win": 4, "death": 8}

    samples_by_game = defaultdict(list)
    for row in rows:
        if row["type"] == "sample" and row["version"] == "v2.22":
            samples_by_game[row["id"]].append(row["snapshot"])

    games = []
    for game_id, result in sorted(results.items(), key=lambda item: int(item[0].rsplit("/", 1)[1])):
        samples = sorted(samples_by_game[game_id], key=lambda sample: sample["recordAt"])
        stage_indexes = [index for index, sample in enumerate(samples)
                         if 100 <= sample["hud"] < 150]
        predicted_indexes = [index for index in stage_indexes
                             if (samples[index].get("planOutput") or {}).get("gain", 0) > 0]
        horizons = {}
        for horizon in HORIZONS_SECONDS:
            deltas = [visible_growth_within(samples, index, horizon)
                      for index in predicted_indexes]
            eligible_deltas = [delta for delta in deltas if delta is not None]
            realized = sum(delta > 0 for delta in eligible_deltas)
            horizons[str(horizon)] = {
                "realized": realized,
                "eligible": len(eligible_deltas),
                "ratio": realized / len(eligible_deltas) if eligible_deltas else None,
                "medianVisibleHudDelta": median(eligible_deltas),
            }
        reasons = defaultdict(lambda: {"predictedPositive": 0, "nextHudIncreased": 0})
        for index in predicted_indexes:
            plan = samples[index].get("planOutput") or {}
            delta = visible_growth_within(samples, index, 1.5)
            if delta is None:
                continue
            reason = plan.get("reason") or "unknown"
            reasons[reason]["predictedPositive"] += 1
            reasons[reason]["nextHudIncreased"] += int(delta > 0)
        games.append({
            "game": int(game_id.rsplit("/", 1)[1]),
            "outcome": result["outcome"],
            "stageSamples": len(stage_indexes),
            "predictedPositive": len(predicted_indexes),
            "selectedEdibleNpc": sum(selected_edible_npc(samples[index].get("planOutput") or {})
                                      for index in stage_indexes),
            "horizons": horizons,
            "reasons": dict(sorted(reasons.items())),
        })

    groups = {outcome: summarize_group(games, outcome) for outcome in ("win", "death")}
    assert groups["win"]["horizons"]["1.5"]["realized"] == 58
    assert groups["win"]["horizons"]["1.5"]["eligible"] == 88
    assert groups["death"]["horizons"]["1.5"]["realized"] == 62
    assert groups["death"]["horizons"]["1.5"]["eligible"] == 145

    output = {
        "candidate": "grow46",
        "phase": "confirm",
        "version": "v2.22",
        "rawSha256": RAW_SHA256,
        "sample": {"games": 12, "wins": 4, "deaths": 8},
        "stage": {"minimumHud": 100, "maximumHudExclusive": 150},
        "method": {
            "rows": "top-level approximately one-second samples only",
            "prediction": "planOutput.gain > 0",
            "realization": "a later visible HUD sample exceeds the current HUD within the stated horizon",
            "note": "Repeated samples within a game are correlated; pooled ratios are paired with game-level medians and ranges.",
        },
        "groups": groups,
        "games": games,
        "conclusion": {
            "observedDifference": "Predicted-positive decisions were followed by visible growth less often in deaths than wins at every checked horizon.",
            "nextSample": {"wins": "58/88", "deaths": "62/145"},
            "threeSampleSensitivity": {"wins": "72/88", "deaths": "90/145"},
            "counterexamples": "Death games 4 and 5 had high realization ratios, while win game 2 had a low ratio. This is not a sufficient freeze rule.",
        },
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"sample": output["sample"], "groups": groups,
                      "conclusion": output["conclusion"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
