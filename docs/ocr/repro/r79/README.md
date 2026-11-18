# r79 — highlight fallback cause and connected-region prototype

2026-11-18 Taiwan;0 new games/wins/deaths/aborts. No preview/game started; mobile skipped; no public strategy/OCR4 release or Library upload. r77B death remains unattributed to candidate.

## Direct evidence
Instrumented the original highlight estimator on12hash-verified B images and two previous independent scenes. Original small-radius guard bypasses all12selected parts. When bypass removed,3foodtargets have0bright pixels;9NPCtargets have28–36bright pixels and pass radius tests but **all fail upper area validation**. Pooled area/expected1.78–2.47 versus existing upper1.6. This corrects any supposition that the NPC fallback was caused by insufficient bright pixels.

Within each fixed search region,4-connected bright clusters separate one17–20pixel eligible region from lower/other regions that fail unchanged radius/area tests. Nine unique eligible clusters estimate35.704–37.053world radius, compared with old26.667–28.333. The apparent small prey may therefore be larger than HUD30–31. This is a renderer-derived estimate, not independently known collision radius, and does not confirm the killer. Text contamination is consistent with extra lower clusters, not separately labelled groundtruth. The upper large-threat alternative and final142.1ms gap remain.

## Frozen single correction
`candidate-radius.js`: first retain original accepted estimate; clipped components unchanged. Only on original fallback, split the same bright predicate into4-connected components and apply the exact original area>=4, radius0.7–1.4*visualRadius and area0.45–1.6*expected checks. Require exactlyone eligible region and allow upward correction only. No threshold tuning or global prey cutoff change. A component that does not meet those conditions stays unchanged; do not force an estimate. This avoids changing accepted large-NPC calibrations (naive splitting would alter two of the prior controls).

9/9BtargetNPCframes recover a larger radius; food controls unchanged. Prior six labelled control components remain unchanged under fallback-only upward logic. Additional fixed A-game13saved images (onepinned+last12) have52labelled components,0changes. All13pixel hashes checked before use. These52are correlated detections, not52independentNPCs or true-radius labels. No newly correctable small NPC in this holdout, so generalization of corrected values is unverified. Shape/label detections can themselves be false. No model or live safety claim.

## Reproduction / limits
Node24.22.1,Python3.12.14,original PillowRGBA decode13.0.0,host55a6111fa095. `python r79/replay.py` checks exported numeric results. `node r79/audit.cjs` needs local RGBA inputs under r78/ and r79/; image records intentionally excluded fromGitHub. Included r78 dependency metadata/source/results and r79fullprototype preserve exact algorithm and conditions; sourcepixels cannot be reconstructed from hashes. `Current.js` is frozen original controller; candidate-radius.js is an offline function prototype, not integrated or live-tested. Sourcegame renderer and full harness at r77commit4886debdc8401629d479db91bbbb53d3b964fb69. No hidden runtime state used.

Candidate function executed on all70fixed component cases:70/70match diagnostic,9changed. Node per-component timing in candidate-check.json is saved-pixel timing, not active-game overhead.

Next: check cost under original-resolution/live capture, then a predeclared bounded desktop trial with radius-source/provenance logging if justified. Do not silently replace uncertain radii as proven truth. Preserve known true-prey and near-threat cases, missed corrected-value holdout coverage, and all failed results. Original per-versiondesktop150s/>=50% acceptance unmet.
