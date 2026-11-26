"""Compare causal NPC radius windows against held-out visible geometry.

Run: python size-windows.py LEDGER.jsonl OUTPUT.json
A position-only match is a proxy for identity. No game or planner is invoked.
"""
import argparse
import hashlib
import json
import math
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean, median

EXPECTED_SHA256 = "9f82ee6f548a233170f9be285e345abea765a6d42aad89b43dbbaeacc49fe092"
WIDTHS = (1, 3, 5)
MAX_GAP_MS = 160
MATCH_GATE = 60
CLEAN_CONFIDENCE = 0.90


def size_class(radius, hud):
    if hud >= 1.08 * radius:
        return "smaller"
    if radius >= 1.08 * hud:
        return "larger"
    return "middle"


def status(obj):
    if obj["clipped"]:
        return "clipped"
    if obj.get("blocked"):
        return "blocked"
    if not math.isfinite(obj["r"]) or obj["r"] <= 0:
        return "invalid_radius"
    if not (obj["labelSeen"] or obj["geometryAccepted"]):
        return "unverified"
    if (obj["labelSeen"] and obj["localReliable"] and obj["geometryAccepted"]
            and (obj.get("confidence") or 0) >= CLEAN_CONFIDENCE):
        return "clean"
    return "usable"


def frame_objects(frame):
    return [obj for obj in frame["planInput"]["objects"] if obj.get("npc")]


def successors(first, second, gap, gate):
    # Velocity is only the camera term. The size signal plays no part in matching.
    step = (second["decisionStartedAt"] - first["decisionStartedAt"]) / 1000
    if not 0 < step <= gap / 1000:
        return {}
    before, after = frame_objects(first), frame_objects(second)
    camera = second["planInput"]["velocity"]
    possible = defaultdict(list)
    incoming = Counter()
    for i, obj in enumerate(before):
        x, y = obj["x"] - camera["x"] * step, obj["y"] - camera["y"] * step
        for j, other in enumerate(after):
            if math.hypot(x - other["x"], y - other["y"]) <= gate:
                possible[i].append(j)
                incoming[j] += 1
    return {i: targets[0] for i, targets in possible.items()
            if len(targets) == 1 and incoming[targets[0]] == 1}


def tracks(frames, gate):
    all_tracks = []
    previous = {}
    for time, frame in enumerate(frames):
        objects = frame_objects(frame)
        indices = {}
        if time:
            for old, new in successors(frames[time - 1], frame, MAX_GAP_MS, gate).items():
                indices[new] = previous[old]
        for index, obj in enumerate(objects):
            if index not in indices:
                indices[index] = len(all_tracks)
                all_tracks.append([])
            all_tracks[indices[index]].append((time, obj))
        previous = indices
    return all_tracks


def estimates(objs, hud):
    result = {}
    for width in WIDTHS:
        window = objs[-width:]
        if len(window) == width and all(status(o) in {"clean", "usable"} for o in window):
            radius = median(o["r"] for o in window)
            result[width] = (radius, size_class(radius, hud))
    return result


def evaluate_game(game, frames, gate, coverage, statuses):
    for frame in frames:
        statuses.update(status(o) for o in frame_objects(frame))
    records = []
    for track_id, track in enumerate(tracks(frames, gate)):
        for i, (time, current) in enumerate(track):
            if status(current) not in {"usable", "clean"}:
                continue
            coverage["usable_anchors"] += 1
            future = [o for _, o in track[i + 1:i + 4]]
            if len(future) != 3:
                coverage["missing_three_matched_future_ticks"] += 1
                continue
            if any(status(o) != "clean" for o in future):
                coverage["future_geometry_ineligible"] += 1
                continue
            hud = frames[time]["hud"]
            future_classes = {size_class(o["r"], hud) for o in future}
            if len(future_classes) != 1:
                coverage["future_classes_disagree"] += 1
                continue
            proxy = median(o["r"] for o in future)
            history = [o for _, o in track[max(0, i - max(WIDTHS)):i + 1]]
            current_estimates = estimates(history, hud)
            prior_estimates = estimates(history[:-1], hud)
            records.append(dict(game=game, track=track_id, time=time, hud=hud,
                                estimates=current_estimates, prior=prior_estimates,
                                reference=proxy, label=future_classes.pop()))
    return records


def describe(records, width):
    errors = [abs(r["estimates"][width][0] - r["reference"]) for r in records]
    return {
        "class_disagreements": sum(r["estimates"][width][1] != r["label"] for r in records),
        "mean_absolute_radius_difference": mean(errors) if errors else None,
        "median_absolute_radius_difference": median(errors) if errors else None,
    }


def compare(records, width):
    paired = [r for r in records if width in r["estimates"]]
    flips = [r for r in paired if width in r["prior"]]
    outcome = Counter()
    game_counts = {}
    correction_counts = defaultdict(Counter)
    for r in paired:
        baseline = r["estimates"][1][1]
        test = r["estimates"][width][1]
        if test != baseline:
            code = ("corrected" if test == r["label"] else
                    "introduced" if baseline == r["label"] else "both_wrong")
            outcome[code] += 1
            correction_counts[r["game"]][code] += 1
    for game in sorted(set(r["game"] for r in paired)):
        sub = [r for r in paired if r["game"] == game]
        one_summary, window_summary = describe(sub, 1), describe(sub, width)
        game_counts[game] = {
            "anchors": len(sub),
            "baseline_disagreements": one_summary["class_disagreements"],
            "window_disagreements": window_summary["class_disagreements"],
            "one_mean_radius_difference": one_summary["mean_absolute_radius_difference"],
            "window_mean_radius_difference": window_summary["mean_absolute_radius_difference"],
            "class_changes": dict(correction_counts[game]),
        }
    threshold_distances = [min(abs(r["reference"] - r["hud"] / 1.08),
                               abs(r["reference"] - r["hud"] * 1.08)) for r in paired]
    return {
        "anchors": len(paired),
        "tracks": len(set((r["game"], r["track"]) for r in paired)),
        "games": len(game_counts), "reference_classes": dict(Counter(r["label"] for r in paired)),
        "one": describe(paired, 1), "window": describe(paired, width),
        "changed_vs_one": dict(outcome),
        "nearest_reference_to_class_boundary": min(threshold_distances, default=None),
        "references_within_five_radius_units_of_boundary": sum(d <= 5 for d in threshold_distances),
        "consecutive_class_flips": {
            "paired_transitions": len(flips),
            "one": sum(r["estimates"][1][1] != r["prior"][1][1] for r in flips),
            "window": sum(r["estimates"][width][1] != r["prior"][width][1] for r in flips),
        },
        "per_game": game_counts,
    }


def evaluate(games, gate):
    coverage, statuses, observations = Counter(), Counter(), []
    for game, frames in games:
        observations.extend(evaluate_game(game, frames, gate, coverage, statuses))
    shared = [r for r in observations if all(w in r["estimates"] for w in WIDTHS)]
    return {
        "npc_frame_statuses": dict(statuses), "coverage": dict(coverage),
        "one_with_future_reference": len(observations),
        "comparisons": {str(w): compare(observations, w) for w in WIDTHS},
        "same_five_frame_cohort": {str(w): describe(shared, w) for w in WIDTHS},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ledger", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    digest = hashlib.sha256()
    games = []
    with args.ledger.open("rb") as stream:
        for line in stream:
            digest.update(line)
            row = json.loads(line)
            if row.get("version") == "v2.22" and row["type"] == "result":
                frames = row["traceTail"]
                times = [f["decisionStartedAt"] for f in frames]
                if any(b <= a for a, b in zip(times, times[1:])):
                    raise ValueError("Unordered tail")
                for f in frames:
                    if f["diagnosticTruncated"] or f["planInput"]["map"]["observedAt"] != f["decisionStartedAt"]:
                        raise ValueError("Expected complete, newly observed frames")
                games.append((int(row["id"].rsplit("/", 1)[-1]), frames))
    if digest.hexdigest() != EXPECTED_SHA256 or sorted(g for g, _ in games) != list(range(1, 13)):
        raise ValueError("Expected the frozen 12-game Grow46 v2.22 confirmation ledger")
    result = {
        "ledger_sha256": digest.hexdigest(), "games": len(games),
        "frames": sum(len(f) for _, f in games),
        "method": {
            "input": "Logged r; require a positive, unclipped, unblocked labelled or geometry-accepted body in every input tick.",
            "class": "At the anchor's HUD throughout: smaller if 1.08*r <= HUD, larger if r >= 1.08*HUD, middle otherwise.",
            "link": "Each endpoint has exactly one candidate inside a 60-unit camera-compensated position gate; gap <=160 ms. No radius, label or red state in matching.",
            "reference": "Median r on next three consecutively matched, fresh ticks; all three must agree in class, be labelled, locally reliable, geometry accepted, unclipped and unblocked, with confidence >=0.90.",
            "flips": "Separate paired transitions with sufficient usable history for both adjacent estimates; both classified at the same current HUD.",
            "limits": "Future screen geometry shares the detector and proxies radius/identity. Terminal tails and overlapping windows limit generalization.",
        },
        "primary": evaluate(games, MATCH_GATE),
        "position_gate_sensitivity": {},
    }
    for gate in (45, 75):
        scored = evaluate(games, gate)
        compact = {}
        for width, data in scored["comparisons"].items():
            compact[width] = {key: data[key] for key in ("anchors", "games", "one", "window", "changed_vs_one")}
        result["position_gate_sensitivity"][str(gate)] = compact
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
