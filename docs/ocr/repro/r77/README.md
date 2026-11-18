# r77 — fixed desktop growth A/B screening

2026-11-18 Taiwan. Predeclared order A then B, one game each, no replacement; normal random unseeded v2.20 snapshot, Chrome156 desktop2000x1163,DPR1. A=r74/r72 prior strategy; B=r76 risk-aware gate only. Same recording/stopping behavior. Two starts,0wins,2deaths,0aborts,0timeouts. No strategy improvement or acceptance claim. Mobile skipped; public test-043 unchanged; OCR4 not published.

| Group | Ending | Visible ending seconds | Terminal size | 30s size | 60s size | 90/120/150s |
|---|---|---:|---:|---:|---:|---|
| A | death |74|102|42|73|missing after death|
| B | death |10|31|missing after death|missing after death|missing after death|

No common predeclared30s growth window: cannot compare unequal terminal sizes as growth-rate evidence. The games are not paired seeds. B had **zero retained or suppressed overrides**, so the new rule had no observable directional effect in its53 accepted decisions. Early death is real and retained, not attributed to the candidate and not replaced. Earlier r76 heldout589states also had0 changed cases; coverage remains unresolved, not a validated improvement.

A:372 accepted,0rejected,22prior overrides,first seq138 pinned;21later intervention images intentionally skipped.13exported frames including last12; all PNG roundtrips equal. Pin1.9ms,raw43,555,200bytes. B:53accepted,0rejected,0overrides,12lastframes all roundtrip equal,raw40,204,800bytes. Both no missed image requests and keysAfter[]. No new image-based attribution in this phase.

## Fixed protocol and implementation
plan.json registered before play. Max150 HUD elapsed seconds,210wall seconds,3stale decisions,hidden/script errors and800rows stop; visiblewin/death classified from current ending, not ranking. Size checkpoint nearest accepted visibleHUD within1s, exact where available; missing stays null. All starts retained. B records priorChoice before applying frozen r76 gate so changed-vs-A suppression is observable and pins the first such event; retained prior interventions also pin. Instrumented B matches frozen r76 **3169/3169 complete planner outputs**, excluding diagnostic r77 field. This implementation computes original selection/prefix before suppression, so instrumentation may add work relative to r76 early-gated prototype; timing equality is not claimed. Live replay A372/372 andB53/53 exact.

## Reproduce
Python3.12.14,Node24.22.1,host55a6111fa095. No packages required beyond standard libraries. Unzip so r77/ is present:
```
python r77/build.py
node r77/check.cjs
node r77/replay.cjs
python r77/analyze.py A r77/A-results-noimages.json
python r77/analyze.py B r77/B-results-noimages.json
python r77/preview-build.py --output /absolute/checkout/dist
```
Full controller, frozen comparator, game, telemetry, ring, build scripts, fixed inputs and numerical results included. Supported Sites static preview serves r77-A.html/B.html; starts only via Start single fixed trial. Empty-directory reconstruction and exact summaries verified on same host, not a freshOS. Random outcomes cannot be exactly replayed; seeds unknown. Image payloads intentionally absent, only metadata/hashes retained, so pixel replay requires local raw evidence.

Local raw hashes: A b64a86b127a98a00102c7756a97059892cecc53039a2f9744199e8e116d32b3b; B c6f95ad90105da83c626cfc04d79c08d6bd0c48e10c8b3f33762bb8a83eebfaf. No images uploaded to GitHub or Library. Preview stopped.

## Next
Analyze B's retained last12 same-source frames and decisions to identify an observable early-death mechanism before another batch. Do not rerun B to replace the no-trigger failure or infer strategy harm from it. Preserve r75 near-threat counterexample and r76 growth tradeoff. Every required desktop version still needs<=150s and>=50% acceptance; this two-game screening does not satisfy it.
