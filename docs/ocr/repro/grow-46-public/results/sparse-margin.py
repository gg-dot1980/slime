#!/usr/bin/env python3
"""Audit earlier, vulnerable v2.22 control decisions from frozen Grow46 confirmation.

Usage: python sparse-margin.py LEDGER CANDIDATE_HTML OUTPUT_JSON
Requires Python 3.10+ and Node.js. No browser, game instance, or network is used.
"""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import subprocess


LEDGER_SHA = "9f82ee6f548a233170f9be285e345abea765a6d42aad89b43dbbaeacc49fe092"
CANDIDATE_SHA = "2d1e128ecd0efd976a3578158f62ea2d1875105bd4f77d247dcf4c90ca5b87aa"

NODE_REPLAY = r"""
const fs = require('node:fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const start = html.indexOf('function chaseEvidence46(');
const end = html.indexOf('function planGrow46(', start);
if (start < 0 || end <= start) throw Error('planner boundary');
let source = html.slice(start, end);
function instrument(anchor, replacement) {
  if (source.split(anchor).length !== 2) throw Error('instrumentation anchor: '+anchor);
  source = source.replace(anchor, replacement);
}
// Read-only annotations. Meal indices only identify one planner input's meals.
instrument('let stagnantFirstLeg = false', 'let auditFirstGain = 0; let stagnantFirstLeg = false');
instrument('growth += g; gain +=', 'if (k <= turnAt) auditFirstGain += g; growth += g; gain +=');
instrument('endX: x, endY: y, penalty46});',
  'endX:x,endY:y,penalty46,auditFirstGain,auditPicked:[...picked]});');
instrument('return {...chosen, target, chase46:',
  'inspect(paths,chosen,reachableMeals); return {...chosen, target, chase46:');
let now = 0, detail = null;
const tolerance = 1e-8;
function sameTarget(a,b) {
  if (!a || !b) return a==null && b==null;
  return !!a.mapOnly===!!b.mapOnly && !!a.npc===!!b.npc &&
    Math.abs(a.x-b.x)<1e-6 && Math.abs(a.y-b.y)<1e-6;
}
function captures(p,target,meals) {
  if (!target || target.mapOnly) return false;
  return p.auditPicked.some(i=>sameTarget(meals[i],target));
}
function inspect(paths,chosen,meals) {
  detail={alternatives:0};
  if (!(chosen.risk>0 && chosen.clearance<85)) return;
  const passing = paths.filter(p=>p.first!==chosen.first && p.wallOK &&
    p.clearance>=chosen.clearance+10 && p.immediateGap>=chosen.immediateGap-tolerance &&
    p.endGap>=chosen.endGap-tolerance && p.risk<=chosen.risk+tolerance &&
    p.wallCost<=chosen.wallCost+tolerance && p.discountedGain>=chosen.discountedGain-tolerance
  ).sort((a,b)=>b.clearance-a.clearance || a.first-b.first || a.second-b.second);
  const chosenCaptured=captures(chosen,chosen.target,meals);
  function compare(p) {
    return {first:p.first,second:p.second,deltaClearance:p.clearance-chosen.clearance,
      deltaRisk:p.risk-chosen.risk,deltaRawGain:p.gain-chosen.gain,
      deltaFirstLegGain:p.auditFirstGain-chosen.auditFirstGain,
      deltaDiscountedGain:p.discountedGain-chosen.discountedGain,
      deltaApproach:p.approach-chosen.approach,deltaScore:p.score-chosen.score,
      sameSelectedTarget:sameTarget(p.target,chosen.target),
      chosenTargetCapturedByAlternative:captures(p,chosen.target,meals),
      alternativeCapturesItsTarget:captures(p,p.target,meals)};
  }
  const compared=passing.map(compare);
  detail={alternatives:passing.length,chosenCaptured,chosenTargetPresent:!!chosen.target,
    chosenTargetMapOnly:!!chosen.target?.mapOnly,chosenRawGain:chosen.gain,
    chosenFirstLegGain:chosen.auditFirstGain,chosenDiscountedGain:chosen.discountedGain,
    chosenApproach:chosen.approach,best:compared[0]??null,
    allLoseApproach:compared.length>0 && compared.every(p=>p.deltaApproach < -tolerance),
    allLoseFirstLegGain:compared.length>0 && compared.every(p=>p.deltaFirstLegGain < -tolerance),
    allLoseChosenCapture:chosenCaptured && compared.length>0 &&
      compared.every(p=>!p.chosenTargetCapturedByAlternative)};
}
const plan=Function('performance','inspect',source+';return planHunt46')({now:()=>now},inspect);
function audit(s) {
  const o=s.planOutput,i=s.planInput;
  const skip=reason=>({verified:false,reason});
  if (s.diagnosticTruncated) return skip('truncated');
  if (o.mapStatus==='lost' || s.decisionAgeMs>200) return skip('no-applied-heading');
  if (!o.tracking46 || !Number.isFinite(o.tracking46.observedAt) ||
      typeof o.tracking46.npcToast!=='boolean') return skip('missing-tracking-memory');
  now=s.decisionStartedAt;
  detail=null;
  const p=plan(i.objects,i.hud,i.map,i.speed,i.velocity,i.heading,'v2.22',
    o.tracking46.observedAt,o.tracking46.npcToast);
  if (!detail) return skip('no-comparable-routes');
  for(const k of ['first','second','escaping','reason','threats','uncertainNpc','immune','wallOK'])
    if(p[k]!==o[k]) return skip('mismatch-'+k);
  for(const k of ['clearance','immediateGap','endGap','risk','wallCost','discountedGain','gain','approach','score'])
    if(!Number.isFinite(p[k]) || Math.abs(p[k]-o[k])>1e-6) return skip('mismatch-'+k);
  if (!sameTarget(p.target,o.target)) return skip('mismatch-target');
  return {verified:true, ...detail};
}
process.stdout.write(JSON.stringify(JSON.parse(fs.readFileSync(0,'utf8')).map(audit)));
"""


def verify(path, expected):
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError(f"SHA-256 mismatch in {path}")


def analyse(game, samples, candidate):
    first_tail = game["traceTail"][0]["recordAt"]
    earlier = [s for s in samples if s["recordAt"] < first_tail]
    if len({s["recordAt"] for s in samples}) != len(samples):
        raise ValueError("duplicate sparse snapshots")
    vulnerable = [s for s in earlier if s["hud"] < 186]
    terminal = [s for s in game["traceTail"] if s["hud"] < 186]
    replay = subprocess.run(["node", "-e", NODE_REPLAY, str(candidate)],
                            input=json.dumps(vulnerable + terminal), text=True, capture_output=True, check=True)
    replayed = json.loads(replay.stdout)
    cases, failures = [], []
    for snapshot, audit in zip(vulnerable, replayed[:len(vulnerable)], strict=True):
        if not audit["verified"]:
            failures.append({"at": snapshot["recordAt"], "reason": audit["reason"]})
            continue
        plan = snapshot["planOutput"]
        if plan["risk"] > 0 and plan["clearance"] < 85:
            cases.append({"recordAtMs": snapshot["recordAt"], "hudRemaining": snapshot["hudTime"],
                          "hud": snapshot["hud"], "heading": plan["name"], "first": plan["first"],
                          "second": plan["second"], "reason": plan["reason"], "risk": plan["risk"],
                          "clearance": plan["clearance"], **audit})
    passing = [r for r in cases if r["alternatives"]]
    counts = {
        "sparseRows": len(samples), "overlapTailIntervalExcluded": len(samples)-len(earlier),
        "preTailRows": len(earlier), "immuneHudExcluded": len(earlier)-len(vulnerable),
        "vulnerableRows": len(vulnerable), "verifiedVulnerableRows": len(vulnerable)-len(failures),
        "unverifiedVulnerableRows": len(failures), "positiveRiskAndClearanceBelow85": len(cases),
        "withMargin": len(passing),
        "bestLowerApproach": sum(r["best"]["deltaApproach"] < -1e-8 for r in passing),
        "everyAlternativeLowerApproach": sum(r["allLoseApproach"] for r in passing),
        "bestLowerFirstLegGain": sum(r["best"]["deltaFirstLegGain"] < -1e-8 for r in passing),
        "bestLowerTotalRawGain": sum(r["best"]["deltaRawGain"] < -1e-8 for r in passing),
        "bestSwitchesTarget": sum(not r["best"]["sameSelectedTarget"] for r in passing),
        "chosenCapturedItsTarget": sum(r["chosenCaptured"] for r in passing),
        "bestLosesChosenCapture": sum(r["chosenCaptured"] and not r["best"]["chosenTargetCapturedByAlternative"]
                                      for r in passing),
        "everyAlternativeLosesChosenCapture": sum(r["allLoseChosenCapture"] for r in passing),
        "everyAlternativeLowerFirstLegGain": sum(r["allLoseFirstLegGain"] for r in passing),
    }
    terminal_margins = []
    terminal_verified = 0
    for snapshot, audit in zip(terminal, replayed[len(vulnerable):], strict=True):
        if audit["verified"]:
            terminal_verified += 1
            if audit["alternatives"]:
                terminal_margins.append({"recordAtMs": snapshot["recordAt"],
                                         "heading": snapshot["planOutput"]["name"], **audit})
    return {"game": int(game["id"].rsplit("/", 1)[1]), "outcome": game["outcome"],
            "firstTerminalRecordAtMs": first_tail, "counts": counts, "failures": failures,
            "qualifying": cases, "terminalVulnerableRows": len(terminal),
            "terminalVulnerableVerified": terminal_verified, "separateTerminalMargins": terminal_margins}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("ledger", "candidate", "output"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    verify(args.ledger, LEDGER_SHA)
    verify(args.candidate, CANDIDATE_SHA)
    samples, results = defaultdict(list), []
    with args.ledger.open(encoding="utf-8") as stream:
        for line in stream:
            record = json.loads(line)
            if record.get("version") != "v2.22":
                continue
            if record["type"] == "sample":
                samples[record["id"]].append(record["snapshot"])
            if record["type"] == "result":
                if not record["nativeStarted"] or not record["evidence"]["resultVisible"]:
                    raise ValueError("missing natural outcome")
                results.append(record)
    if Counter(g["outcome"] for g in results) != {"win": 4, "death": 8}:
        raise ValueError("confirmation cohort mismatch")
    games = [analyse(g, samples[g["id"]], args.candidate) for g in results]
    groups = {}
    for outcome in ("win", "death"):
        group = [g for g in games if g["outcome"] == outcome]
        counts = Counter()
        for game in group:
            counts.update(game["counts"])
        groups[outcome] = {"games": len(group), "gamesWithMargin": sum(bool(g["counts"]["withMargin"])
                                                                      for g in group), **counts}
    payload = {"ledgerSha256": LEDGER_SHA, "candidateSha256": CANDIDATE_SHA,
               "definition": "All sparse v2.22 confirmation samples strictly before the first retained dense tail row; require HUD <186. Reconstruct each planner call using its own recorded incoming heading/memory, clock, and toast. Unverified rows excluded from route comparisons.",
               "marginTest": "Same rule as risk-decisions.py: positive risk and clearance <85. Different first heading, wall-feasible, at least 10 units more minimum hard clearance, no worse immediate/end gap, risk, wall cost or discounted gain (1e-8 tolerance).",
               "approachAndCapture": "Best alternative maximizes clearance among matching routes, breaking ties by first and second direction. Approach is the frozen target-utility progress score. First-leg gain is simulated raw size growth in steps 1–6. Capture is a projected contact with the original chosen target on that snapshot. Forecasts only.",
               "terminalAnnotation": "Separate terminal list annotates approach/capture tradeoffs among previously measured dense margin rows. It is excluded from all sparse group counts.",
               "groups": groups, "games": games}
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False)+"\n", encoding="utf-8")


if __name__ == "__main__":
    main()
