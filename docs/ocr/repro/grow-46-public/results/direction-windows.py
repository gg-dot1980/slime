#!/usr/bin/env python3
"""Compare visible NPC direction estimates in retained QHD Grow46 decision tails.

python direction-windows.py LEDGER OUTPUT --previous-games 3,4,5,11
Optionally supply --sha256 to verify the complete input ledger.
The output includes private game- and window-level diagnostics.
"""
import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import statistics


PLANNER_STEP = 0.1
PLANNER_FOLLOW = 1 - math.exp(-4.2 * PLANNER_STEP)


HORIZON = 0.2
DEADBAND = 3.0
MODELS = ("two", "three", "five", "velocity", "issued_heading", "player_only")
HISTORY = {"two": 2, "three": 3, "five": 5}
BASELINE = "velocity"


def distance(o):
    return math.hypot(o["x"], o["y"])


def eligible(o, hud):
    return (o.get("npc") and not o.get("clipped") and o.get("geometryAccepted")
            and o.get("localReliable") and o["r"] >= hud)


def compatible(previous, current):
    return (math.hypot(current["x"] - previous["x"], current["y"] - previous["y"]) <= 65
            and abs(current["r"] - previous["r"]) <= max(3, .08 * previous["r"]))


def angle_degrees(x, y, dx, dy):
    if math.hypot(x, y) == 0 or math.hypot(dx, dy) == 0:
        return None
    return math.degrees(math.atan2(abs(x * dy - y * dx), x * dx + y * dy))


def sign(x):
    return (x > 0) - (x < 0)


def load_ledger(path, expected_hash):
    digest = hashlib.sha256()
    tails = {}
    dimensions_by_game = {}
    batch = None
    ending = None
    with path.open("rb") as ledger:
        for line in ledger:
            digest.update(line)
            row = json.loads(line)
            if row["type"] == "batch":
                if batch is not None:
                    raise ValueError("expected a single confirmation batch")
                batch = row
            elif row["type"] == "batch-end":
                ending = row
            elif row.get("version") == "v2.22":
                if row["type"] == "event" and row["event"]["type"] == "native-started":
                    dimensions_by_game[row["id"]] = row["event"]["dimensions"]
                if row["type"] == "result":
                    if row["id"] in tails:
                        raise ValueError("duplicate result")
                    tails[row["id"]] = row
    hexdigest = digest.hexdigest()
    if expected_hash and hexdigest != expected_hash.lower():
        raise ValueError("ledger SHA-256 mismatch")
    if not batch or batch["phase"] != "confirm" or batch["contract"]["candidate"] != "grow46":
        raise ValueError("expected a Grow46 confirmation ledger")
    if not ending or ending["reason"] != "planned-complete":
        raise ValueError("incomplete batch")
    dimensions = batch["contract"]["dimensions"]
    if (dimensions["outer"] != [2560, 1440] or dimensions["canvas"] != [2250, 1308]
            or dimensions["deviceScaleFactor"] != 1 or dimensions["gameDpr"] != 1):
        raise ValueError("expected archived QHD capture dimensions")
    planned = {r["id"] for r in batch["planned"] if r["version"] == "v2.22"}
    if len(planned) != 12 or planned != tails.keys():
        raise ValueError("expected twelve completed v2.22 games")
    for key, result in tails.items():
        if (not result["nativeStarted"] or not result["stopVerified"] or result["error"]
                or result["outcome"] not in {"win", "death"}
                or dimensions_by_game.get(key) != dimensions):
            raise ValueError("invalid result or dimensions")
    return tails, hexdigest


def tracks_for_game(tail):
    tracks = []
    active = []
    counts = Counter(rawDecisions=len(tail))
    previous_time = None
    for frame, snapshot in enumerate(tail):
        inputs = snapshot["planInput"]
        timestamp = (inputs.get("map") or {}).get("observedAt")
        if timestamp is None or snapshot.get("diagnosticTruncated"):
            active = []
            previous_time = None
            counts["unusableFrames"] += 1
            continue
        if timestamp == previous_time:
            counts["repeatedFrames"] += 1
            continue
        if previous_time is not None and not 0 < timestamp - previous_time <= 150:
            counts["timeBreaks"] += 1
            active = []
        previous_time = timestamp
        objects = [o for o in inputs["objects"] if eligible(o, inputs["hud"])]
        counts["effectiveFrames"] += 1
        counts["eligibleObservations"] += len(objects)
        counts["framesWithEligible"] += int(bool(objects))
        candidates = [[track for track in active if compatible(tracks[track][-1]["o"], o)]
                      for o in objects]
        multiplicity = Counter(track for options in candidates for track in options)
        next_active = []
        for o, options in zip(objects, candidates):
            if len(options) == 1 and multiplicity[options[0]] == 1:
                track = options[0]
            else:
                counts["ambiguousRestarts"] += int(bool(options))
                track = len(tracks)
                tracks.append([])
            tracks[track].append({"frame": frame, "time": timestamp, "o": o,
                                  "player": inputs["velocity"], "speed": inputs["speed"],
                                  "heading": snapshot["planOutput"]})
            next_active.append(track)
        active = next_active
    counts["tracks"] = len(tracks)
    counts["tracksAtLeastSeven"] = sum(len(track) >= 7 for track in tracks)
    return tracks, dict(counts)


def evaluate_window(game, outcome, track, observations):
    start, point, end = observations[0], observations[4], observations[6]
    o = point["o"]
    future_x = end["o"]["x"] - o["x"]
    future_y = end["o"]["y"] - o["y"]
    future_delta = distance(end["o"]) - distance(o)
    models = {}

    def add_model(name, delta, projected_delta, dx, dy):
        models[name] = {"delta": delta, "deltaAtHorizon": projected_delta,
                        "sign": sign(delta), "angle": angle_degrees(dx, dy, future_x, future_y)}

    for name, length in HISTORY.items():
        old = observations[5 - length]
        dt = (point["time"] - old["time"]) / 1000
        dx = o["x"] - old["o"]["x"]
        dy = o["y"] - old["o"]["y"]
        delta = distance(o) - distance(old["o"])
        # Preserve the previous audit's historical radial sign. Scale the observed
        # radial change to a common horizon only for the optional prediction deadband.
        add_model(name, delta, delta * HORIZON / dt, dx, dy)
    for name, vx, vy in [(BASELINE, o["vx"], o["vy"]), ("player_only", 0, 0)]:
        dx = (vx - point["player"]["x"]) * HORIZON
        dy = (vy - point["player"]["y"]) * HORIZON
        delta = math.hypot(o["x"] + dx, o["y"] + dy) - distance(o)
        add_model(name, delta, delta, dx, dy)

    # Frozen planner follow model for its two 0.1 s steps. Inputs and command
    # come only from the decision frame. The next real command is unknown.
    player_x = player_y = 0.0
    vx, vy = point["player"]["x"], point["player"]["y"]
    target_vx = point["heading"]["x"] * point["speed"]
    target_vy = point["heading"]["y"] * point["speed"]
    for _ in range(2):
        vx += (target_vx - vx) * PLANNER_FOLLOW
        vy += (target_vy - vy) * PLANNER_FOLLOW
        player_x += vx * PLANNER_STEP
        player_y += vy * PLANNER_STEP
    dx = o["vx"] * HORIZON - player_x
    dy = o["vy"] * HORIZON - player_y
    delta = math.hypot(o["x"] + dx, o["y"] + dy) - distance(o)
    add_model("issued_heading", delta, delta, dx, dy)

    return {"game": game, "outcome": outcome, "track": track,
            "firstFrame": start["frame"], "decisionFrame": point["frame"], "lastFrame": end["frame"],
            "horizonMs": end["time"] - point["time"], "historicalMs": point["time"] - start["time"],
            "futureDelta": future_delta, "actualSign": sign(future_delta), "models": models}


def model_scores(windows, model):
    def correct(w):
        return w["actualSign"] == w["models"][model]["sign"]

    angles = [w["models"][model]["angle"] for w in windows if w["models"][model]["angle"] is not None]
    clear = [w for w in windows if abs(w["models"][model]["deltaAtHorizon"]) >= DEADBAND]
    return {"n": len(windows), "correct": sum(map(correct, windows)),
            "predictedTie": sum(w["models"][model]["sign"] == 0 for w in windows),
            "approachCorrect": sum(w["actualSign"] < 0 and correct(w) for w in windows),
            "recedeCorrect": sum(w["actualSign"] > 0 and correct(w) for w in windows),
            "predictedClear": len(clear), "clearCorrect": sum(map(correct, clear)),
            "anglesAvailable": len(angles), "medianAngle": statistics.median(angles) if angles else None,
            "within45": sum(a <= 45 for a in angles)}


def summarize(windows):
    evaluated = [w for w in windows if abs(w["futureDelta"]) >= DEADBAND]
    scored = {m: model_scores(evaluated, m) for m in MODELS}
    pairs = {}
    for m in HISTORY:
        pairs[m] = Counter()
        for w in evaluated:
            frame_hit = w["models"][m]["sign"] == w["actualSign"]
            velocity_hit = w["models"][BASELINE]["sign"] == w["actualSign"]
            if frame_hit and velocity_hit:
                key = "both"
            elif frame_hit:
                key = "framesOnly"
            elif velocity_hit:
                key = "velocityOnly"
            else:
                key = "neither"
            pairs[m][key] += 1
    primary = (*HISTORY, BASELINE)
    clear_for_all = [w for w in evaluated if all(abs(w["models"][m]["deltaAtHorizon"]) >= DEADBAND
                                                for m in primary)]
    return {"commonPredictedClear": len(clear_for_all),
            "commonClearHits": {m: model_scores(clear_for_all, m)["correct"] for m in primary},
            "candidateWindows": len(windows), "nearFlatExcluded": len(windows) - len(evaluated),
            "scored": len(evaluated), "approach": sum(w["actualSign"] < 0 for w in evaluated),
            "recede": sum(w["actualSign"] > 0 for w in evaluated),
            "tracksScored": len({(w["game"], w["track"]) for w in evaluated}),
            "gamesScored": len({w["game"] for w in evaluated}), "models": scored, "paired": pairs}


def nonoverlap(windows):
    # Choose the first retained window by END frame, then track ID, and require
    # all seven frames to be disjoint across every NPC in the same game.
    last = {}
    out = []
    for w in sorted(windows, key=lambda w: (w["game"], w["lastFrame"], w["track"])):
        if abs(w["futureDelta"]) < DEADBAND or w["firstFrame"] <= last.get(w["game"], -1):
            continue
        out.append(w)
        last[w["game"]] = w["lastFrame"]
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ledger", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--sha256")
    parser.add_argument("--previous-games", required=True, help="Comma-separated game numbers already inspected")
    args = parser.parse_args()
    previous = {int(n) for n in args.previous_games.split(",")}
    tails, digest = load_ledger(args.ledger, args.sha256)
    windows = []
    by_game = {}
    for game_id, result in sorted(tails.items(), key=lambda pair: int(pair[0].rsplit("/", 1)[1])):
        game = int(game_id.rsplit("/", 1)[1])
        tracks, counts = tracks_for_game(result["traceTail"])
        group = [evaluate_window(game, result["outcome"], k, track[i - 6:i + 1])
                 for k, track in enumerate(tracks) for i in range(6, len(track))]
        by_game[game] = {"outcome": result["outcome"], "extraction": counts, "summary": summarize(group)}
        windows.extend(group)
    if not previous <= by_game.keys():
        raise ValueError("unknown game in --previous-games")
    groups = {"all": windows, "previous": [w for w in windows if w["game"] in previous],
              "other": [w for w in windows if w["game"] not in previous],
              "win": [w for w in windows if w["outcome"] == "win"],
              "death": [w for w in windows if w["outcome"] == "death"]}
    intervals = [w["horizonMs"] for w in windows if abs(w["futureDelta"]) >= DEADBAND]
    extraction = Counter()
    for game in by_game.values():
        extraction.update(game["extraction"])
    data = {"sha256": digest, "extraction": extraction, "version": "v2.22", "futureSecondsNominal": HORIZON,
            "minimumAbsOutcomeChange": DEADBAND, "previousGames": sorted(previous),
            "horizonMsMinMedianMax": [min(intervals), statistics.median(intervals), max(intervals)] if intervals else [],
            "groups": {key: summarize(group) for key, group in groups.items()},
            "disjoint": {key: summarize(nonoverlap(group)) for key, group in groups.items()},
            "byGame": by_game, "windows": windows}
    args.output.write_text(json.dumps(data, indent=2, allow_nan=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
