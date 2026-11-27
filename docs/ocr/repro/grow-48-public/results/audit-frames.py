"""Join an unmodified Grow48 terminal-observer run by record ID and verify its PNGs.

Usage: python audit-frames.py RAW_BATCH OUTPUT [--extra 1,9] [--retained-only]
Restored archives contain only retained PNGs. --retained-only still checks every
retained SHA-256 and every indexed decision, but cannot verify discarded pixels.
All outputs include private case-level evidence. Keep them beside the ledger.
"""
import argparse
from collections import Counter
import hashlib
import json
from math import ceil, hypot
from pathlib import Path
import struct


def demand(condition, message):
    if not condition:
        raise ValueError(message)


def read(path):
    return json.loads(path.read_bytes())


def lines(path):
    data = path.read_bytes()
    demand(data.endswith(b'\n'), f"Unterminated journal {path.name}")
    return [json.loads(row) for row in data.splitlines()]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write(directory, name, value):
    (directory / name).write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n')


def describe(items):
    if not items:
        return None
    ordered = sorted(items)
    def q(p):
        return round(ordered[max(0, ceil(p * len(items)) - 1)], 2)
    return {"n": len(items), "min": round(ordered[0], 2), "p50": q(.5), "p95": q(.95),
            "max": round(ordered[-1], 2), "quantile": "nearest-rank"}


def numbers_by_decision(rows, ident, result):
    tail = {s["recordAt"] for s in result["traceTail"]}
    samples = [r["snapshot"] for r in rows if r.get("id") == ident and r["type"] == "sample"]
    index = {}
    for snap in samples + result["traceTail"]:
        at = snap["recordAt"]
        demand(index.get(at, snap) == snap, "Duplicate key has conflicting numeric snapshots")
        index[at] = snap
    return index, tail


def join(frame, snapshot, tail):
    at = frame["recordAt"]
    demand(frame["decisionStart"] == snapshot["decisionStartedAt"], "Different decision start")
    demand(int(frame["hud"]) == snapshot["hud"] and frame["countdown"] == snapshot["hudTime"],
           "HUD mismatch at joined decision")
    data = snapshot["planInput"]
    output = snapshot["planOutput"]
    objects = data["objects"]
    map_data = data.get("map") or {}
    map_player = map_data.get("player")
    reds = []
    if map_player:
        for name in ("growMarkers", "threats"):
            for m in map_data.get(name, []):
                if name == "growMarkers" and not m.get("red"):
                    continue
                reds.append({"type": name, "x": (m["x"]-map_player["x"])*10400/map_data["width"],
                             "y": (m["y"]-map_player["y"])*7200/map_data["height"]})
    return {"file": frame["file"], "sha256": frame["sha256"], "index": frame["index"],
            "recordAt": at, "controllerCapture": frame["controllerCapture"], "pngAt": frame["localTime"],
            "inTraceTail": at in tail, "hud": snapshot["hud"], "countdown": snapshot["hudTime"],
            "diagnosticTruncated": snapshot["diagnosticTruncated"],
            "mapObservedAt": map_data.get("observedAt"), "mapRedMarksWorld": reds,
            "objects": objects, "heading": output.get("name"), "reason": output.get("reason"),
            "target": output.get("target"), "clearance": output.get("clearance"), "risk": output.get("risk"),
            "escaping": output.get("escaping"), "immune": output.get("immune"),
            "nearestNpc": min(({"row": i, "centerDistance": hypot(o["x"],o["y"]),
                               "diskGap": hypot(o["x"],o["y"])-o["r"]-snapshot["hud"]}
                              for i,o in enumerate(objects) if o.get("npc")),
                             key=lambda o:o["diskGap"], default=None)}


def zero_start(batch, out):
    ledger_files = list((batch / "ledger").iterdir())
    demand(len(ledger_files)==1 and ledger_files[0].match("transport-*.jsonl"), "Expected transport-only ledger")
    events = lines(ledger_files[0])
    demand([r["type"] for r in events] == ["server-created","listening"], "Unexpected transport events")
    log = (batch/"driver.log").read_text()
    demand("/usr/lib/chromium/chromium: not found" in log and "exitCode=127" in log,
           "Explicit pre-browser executable failure required")
    index = (batch/"frames.jsonl").read_bytes()
    demand(not index and not list((batch/"frames").iterdir()), "Capture evidence present")
    result = {"phase":"startup-before-browser","transportEvents":[r["type"] for r in events],
              "nativeStarts":0,"results":0,"decisionPNGs":0,"nativeTerminalPNGs":0,
              "retainedPNGCount":0,"exactNumericImagePairs":0,"newSettledDeathsReviewed":0,
              "newObservedMisses":None,"frameJournalSha256":sha(index),
              "transportSha256":sha(ledger_files[0].read_bytes()),
              "driverLogSha256":sha((batch/"driver.log").read_bytes())}
    write(out,"audit.json",result)
    for name in ("matches.json","retained.json","visual-review.json"):
        write(out,name,[])
    print(json.dumps(result))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("batch", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--extra", default="", help="additional comma-separated observer PNG index values")
    parser.add_argument("--zero-start", action="store_true", help="audit a pre-browser Chromium launch failure")
    parser.add_argument("--retained-only", action="store_true")
    args = parser.parse_args()
    batch, out = args.batch, args.output
    out.mkdir(mode=0o700, exist_ok=True, parents=True)
    if args.zero_start:
        zero_start(batch,out)
        return
    report_path, = (batch / "ledger").glob("grow48-diagnostic-*-summary.json")
    report = read(report_path)
    demand(report["complete"] and report["integrityOk"], "Incomplete batch or ledger integrity failure")
    journal = report_path.with_name(report_path.name.replace("-summary.json",".jsonl"))
    demand(sha(journal.read_bytes()) == report["rawSha256"], "Ledger digest differs")
    rows = lines(journal)
    demand(rows[0]["phase"] == "diagnostic" and rows[-1]["reason"] == "planned-complete", "Unexpected phase/ending")
    dims = rows[0]["contract"]["dimensions"]
    demand(dims["canvas"] == dims["canvasCss"] == [2250,1308] and dims["deviceScaleFactor"] == dims["gameDpr"] == 1,
           "Unexpected geometry")
    planned = rows[0]["planned"]
    demand([a["version"] for a in planned] == ["v2.13","v2.22"], "Unexpected plan")
    results = [r for r in rows if r["type"] == "result"]
    demand([r["id"] for r in results] == [a["id"] for a in planned], "Results differ from plan")
    for r in results:
        demand(r["nativeStarted"] and r["stopVerified"] and r["error"] is None,
               "Unverified start, stop or result")
    result = results[1]
    numbers, tail = numbers_by_decision(rows, result["id"], result)
    frame_path = batch / "frames.jsonl"
    frames = sorted(lines(frame_path),key=lambda f:f["index"])
    decisions = [f for f in frames if f["kind"] == "decision"]
    terminal = [f for f in frames if f["kind"] != "decision"]
    stats = read(batch/"capture-stats.json")
    demand(stats["saved"] == stats["started"] == len(frames) and not stats["errors"], "Incomplete observer delivery")
    demand(stats["decisions"] == result["controller"]["decisions"] == len(decisions) + stats["busy"],
           "Applied/evidenced/skipped count mismatch")
    demand([f["index"] for f in frames] == list(range(1,len(frames)+1)), "Missing delivery indices")
    demand(all(f["id"] == result["id"] and f["version"] == "v2.22" for f in frames), "Unexpected observer subject")
    demand(len({f["kind"] for f in terminal}) == len(terminal), "Duplicate terminal marker")
    demand(result["outcome"] not in ("death","win","late-win","game-timeout") or
           any(f["kind"]=="result" for f in terminal), "Missing native result image")
    demand(all(a["recordAt"]<b["recordAt"] and a["localTime"]<b["localTime"]
               for a,b in zip(decisions,decisions[1:])), "Nonmonotonic decision order")
    extra = {int(s) for s in args.extra.split(",") if s}
    reasons = {}
    if decisions:
        first, last = decisions[0], decisions[-1]
        reasons[first["index"]] = ["first"]
        last_rep = first["localTime"]
        for f in decisions[1:]:
            if f["localTime"] - last_rep >= 15000:
                reasons[f["index"]] = ["15s representative"]
                last_rep = f["localTime"]
        for f in decisions:
            if f["localTime"] >= last["localTime"] - 5000:
                reasons.setdefault(f["index"], []).append("last 5s")
    for f in terminal:
        reasons[f["index"]] = [f["kind"]]
    for i in sorted(extra):
        demand(1 <= i <= len(frames), "Extra frame not found")
        reasons.setdefault(i, []).append("supplementary visual review")
    files = {p.name for p in (batch/"frames").glob('*.png')}
    expected_files = {f["file"] for f in frames}
    demand(files <= expected_files and (args.retained_only or files == expected_files), "PNG directory/index mismatch")
    keep, paired, png_at, from_read, gaps = [], [], [], [], []
    for f in frames:
        idx, name = f["index"], f["file"]
        demand(name == f"{idx:06d}.png" and [f["width"],f["height"]] == dims["canvas"], "Wrong PNG index/size")
        if name in files:
            content = (batch/"frames"/name).read_bytes()
            demand(content[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack(">II",content[16:24])==(2250,1308) and
                   sha(content) == f["sha256"], f"Invalid PNG data: {name}")
        if idx in reasons:
            demand(name in files, f"Retained frame missing: {name}")
            keep.append({"index":idx, "file":name, "sha256":f["sha256"], "reasons":reasons[idx],
                         "kind":f["kind"], "hud":f["hud"], "countdown":f["countdown"],
                         "localTime":f["localTime"], "recordAt":f["recordAt"]})
        if f["kind"] != "decision":
            continue
        c = f["controllerCapture"]
        demand(f["decisionStart"] <= c["start"] <= c["end"] <= f["recordAt"] <= f["localTime"] and
               [c["sourceWidth"],c["sourceHeight"]] == dims["canvas"], "Impossible observer timeline")
        png_at.append(f["localTime"]-f["recordAt"])
        from_read.append(f["localTime"]-c["end"])
        if f["recordAt"] in numbers:
            paired.append(join(f,numbers[f["recordAt"]],tail))
    for a,b in zip(decisions,decisions[1:]):
        gaps.append(b["localTime"]-a["localTime"])
    tail_matches = [r for r in paired if r["inTraceTail"]]
    terminal_gaps = {f["kind"]:round(f["localTime"]-decisions[-1]["localTime"],2) for f in terminal} if decisions else {}
    outcomes = {r["version"]:{"outcome":r["outcome"],"seconds":r["seconds"],"hud":r["evidence"]["size"],
                  "overruns":r["controller"]["overruns"],"decisions":r["controller"]["decisions"]} for r in results}
    summary = {"phase":"paired natural observation", "ledgerSha256":report["rawSha256"],
               "frameJournalSha256":sha(frame_path.read_bytes()), "candidateSha256":rows[0]["contract"]["candidateSha256"],
               "outcomes":outcomes, "observer":stats, "decisionPNGs":len(decisions),"nativeTerminalPNGs":len(terminal),
               "allPNGsVerifiedHere":len(files), "allPNGRecords":len(frames), "uniqueNumericDecisions":len(numbers),
               "exactNumericImagePairs":len(paired), "traceTailDecisions":len(tail), "traceTailPairs":len(tail_matches),
               "truncatedNumericPairs":sum(r["diagnosticTruncated"] for r in paired),
               "retainedPNGCount":len(keep), "retentionReasonCounts":dict(Counter(reason for r in keep for reason in r["reasons"])),
               "decisionPNGIntervalsMs":describe(gaps), "recordToPNGCopyMs":describe(png_at),
               "controllerDrawEndToPNGCopyMs":describe(from_read), "lastDecisionPNGToTerminalMs":terminal_gaps}
    write(out,"retained.json",keep)
    write(out,"matches.json",paired)
    write(out,"audit.json",summary)
    print(json.dumps(summary,ensure_ascii=False))


if __name__ == "__main__":
    main()
