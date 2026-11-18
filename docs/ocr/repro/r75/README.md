# r75 — r74 first-intervention attribution and wall-only gate counterexample

2026-11-18 Taiwan. Offline only:0 new starts/0 wins/0 deaths/0 aborts. r74 remains one diagnostic death68s,size90. No game or preview started; no public strategy/OCR4 release. Mobile skipped. Images local only, no Library upload.

## Evidence and single hypothesis
Viewed the saved seq304 intervention PNG: player central, left wall, food below-left, large NPC right and clipped NPC lower-left. Numerical target remains below-left across seq303–305, consistent with the saved frame; no stable-ID or adjacent-image proof is claimed. At seq304 the base selects SW (score12.302,gain1.105,NPCclear419.725,minWall450.118), but r72 selects SE (score9.516,gain1.867,NPCclear475.954,minWall896.674). Existing wall margin322.25; observed left distance980. This is a model-clearance/gain override outside the wall-preservation zone, not a wall emergency. Next frame's selected direction is SW. Recorded SE→SW is a90-degree heading change (horizontal sign reversal), not a180-degree turn or measured physical reversal.

Seq306 changes target to right/above; baseE,overrideSE, then seq307 target below-left/baseSW. This is a separate target-switch contribution inferred only from metadata. Seq306/322 lack saved images; their visual correctness and causal effect cannot be attributed. No claim that these switches caused the death8.37seconds after first intervention.

Single falsifiable hypothesis: permit the r72 override only if base.minWall < existing margin260+.75*playerRadius. No new tuned threshold, no forced heading lock. Frozen r74 development sequence plus2235 preexisting fixed cases, including normal and safety counterexamples. Historical “holdout” names indicate earlier provenance; these are not newly independent samples or game trials.

## Fixed results and decision
2580 states total;35 direction differences (r60A3,r60B11,r14:8,r50:10,r74:3). All35 revert to base and lower model NPC clearance. The first r74 override disappears, removing SW→SE→SW in this frozen sequence; this is not a counterfactual live trajectory, because actual observations followed the original controller.

Counterexample r50 index386: base predicted wall389.797 exceeds margin323.75, yet returning from NE to N lowers no-prefix continuous NPCgap2.340→0.684. Original discrete gap7.631→4.720. At100/200ms prefixes both original and proposed already have−3.612, so this is **not a newly created negative-gap case**. No changed case introduces a new negative gap relative to prior or a negative wall distance under these models. Nevertheless a wall-only trigger removes threat avoidance when wall clearance is adequate, and its remaining0.684px is not a calibrated real safety margin. Hypothesis insufficient as a general strategy; do not live-test or patch another threshold in this phase. This is specific regression evidence, not a demand to prove zero deaths.

## Reproduction
Python3.12.14/Node24.22.1 on55a6111fa095; onlyNode standard fs/vm/assert needed. `node r75/analyze.cjs` regenerates candidate-plan.js and results.json from included Current.js,prior-plan.js,fixed-inputs.json,r74-inputs.json. All numerical sources included; fixed results retain null for JSON-serializedInfinity. candidate-plan.js is rejected offline prototype, not deployed. Full original game/harness at r74 commit f9b9441bfe28fb49eb51cc111901ecc7639137ee; no game source change here. PNGs intentionally absent; visual interpretation cannot be pixel-replayed fromGitHub alone. Exact r74 rawSHA d441876e6745dd67e0d58f4af4fa4474a710b69beb05a5841681832f5d5f2d58; immutable interventionPNG remains local.

## Next
Separate target progression from threat-margin need rather than gating only on walls. Preserve r50index386 and the earlier prefix counterexamples before proposing another control change; use the saved seq304 as an actual image-supported case. No new game justified by this rejected prototype. Original desktop per-version<=150s,>=50% target remains unmet.
