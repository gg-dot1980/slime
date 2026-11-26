"""Measure visible HUD first passages in the closed Grow46 v2.22 confirmation.

Usage: progress-timing.py LEDGER SUMMARY OUTPUT
"""
import hashlib
import json
import statistics
import sys
from collections import Counter
from pathlib import Path

RAW_SHA256 = "9f82ee6f548a233170f9be285e345abea765a6d42aad89b43dbbaeacc49fe092"
THRESHOLDS = (100, 150, 186)


def load_json(path):
    return json.loads(path.read_bytes())


def elapsed(snapshot):
    minutes, seconds = map(int, snapshot["hudTime"].split(":"))
    return 300 - 60 * minutes - seconds


def first_passage(snapshots, threshold):
    matches = [s for s in snapshots if s["hud"] >= threshold]
    if not matches:
        return None
    first = min(matches, key=lambda s: (s["recordAt"], elapsed(s)))
    return {"seconds": elapsed(first), "hud": first["hud"]}


def median(values):
    reached = [value for value in values if value is not None]
    return statistics.median(reached) if reached else None


def main():
    ledger_path, summary_path, output_path = map(Path, sys.argv[1:4])
    raw = ledger_path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == RAW_SHA256
    summary = load_json(summary_path)
    assert summary["rawSha256"] == RAW_SHA256
    assert summary["complete"] and summary["integrityOk"] and summary["phase"] == "confirm"
    rows = [json.loads(line) for line in raw.splitlines()]
    header = rows[0]
    assert header["type"] == "batch" and header["contract"]["candidate"] == "grow46"
    results = [row for row in rows if row["type"] == "result" and row["version"] == "v2.22"]
    assert len(results) == 12
    assert Counter(row["outcome"] for row in results) == {"win": 4, "death": 8}
    games = []
    for ordinal, result in enumerate(results, 1):
        snapshots = {
            row["snapshot"]["recordAt"]: row["snapshot"]
            for row in rows if row["type"] == "sample" and row["id"] == result["id"]
        }
        for snapshot in result["traceTail"]:
            previous = snapshots.get(snapshot["recordAt"])
            assert previous is None or previous == snapshot
            snapshots[snapshot["recordAt"]] = snapshot
        ordered = sorted(snapshots.values(), key=lambda s: s["recordAt"])
        assert ordered and all(s["hudTime"] for s in ordered)
        passages = {str(q): first_passage(ordered, q) for q in THRESHOLDS}
        games.append({
            "ordinal": ordinal,
            "outcome": result["outcome"],
            "nativeResultSeconds": result["seconds"],
            "lastVisibleHud": result["evidence"]["size"],
            "visibleDecisionCount": len(ordered),
            "firstPassage": passages,
        })
    groups = {}
    for outcome in ("win", "death"):
        part = [game for game in games if game["outcome"] == outcome]
        groups[outcome] = {
            "games": len(part),
            "thresholds": {
                str(q): {
                    "reached": sum(game["firstPassage"][str(q)] is not None for game in part),
                    "denominator": len(part),
                    "medianSecondsAmongReached": median([
                        game["firstPassage"][str(q)]["seconds"]
                        if game["firstPassage"][str(q)] else None for game in part
                    ]),
                    "seconds": [
                        game["firstPassage"][str(q)]["seconds"]
                        if game["firstPassage"][str(q)] else None for game in part
                    ],
                } for q in THRESHOLDS
            },
        }
    assert groups["win"]["thresholds"]["150"]["reached"] == 4
    assert groups["death"]["thresholds"]["150"]["reached"] == 0
    first_winner_150 = min(
        game["firstPassage"]["150"]["seconds"] for game in games if game["outcome"] == "win"
    )
    output = {
        "candidate": "grow46",
        "phase": "confirm",
        "version": "v2.22",
        "rawSha256": RAW_SHA256,
        "sample": {"games": 12, "wins": 4, "deaths": 8},
        "thresholds": list(THRESHOLDS),
        "groups": groups,
        "earliestObservedSeparation": {
            "threshold": 150,
            "seconds": first_winner_150,
            "winnerReached": "4/4",
            "deathReached": "0/8",
            "interpretation": "Crossing visible HUD size 150 separated these archived outcomes; it is an observed correlate, not a validated control rule.",
        },
        "games": games,
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"sample": output["sample"], "groups": groups,
                      "earliestObservedSeparation": output["earliestObservedSeparation"]},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
