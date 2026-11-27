# grow-12 — preserve a visible escape corridor

Baseline: Sites v184 / source `9a60e39a74eef32834b0602d089fc4d665337ae3` (grow-11). Only `/ocr-grow` changes; A and HUD <90 return the identical baseline planner. No GitHub push is part of this release.

## Frozen policy

At HUD >=90, simulate the existing 1-second candidate motion, then an eight-direction 1.5-second exit fan at 100 ms steps with existing inertia. Reject fan segments crossing a known wall margin or within 20 model units of a visible red exclusion circle. Compute contiguous exit width plus exit count. Only apply the additional ranking when at least two red markers are within `r + redRadius + speed*4`, or perpendicular walls are within the existing margin plus `speed*2`. An alternative must already pass the existing immediate wall, redSafe and clearance gates. Switch only for at least one extra exit octant, or an inward corner improvement of `speed*.35`, plus a quality gain >1. Existing bounded emergency fallback remains if no safe direction exists. No independent NPC-main-view veto without same-direction red.

Red positions are held static for this short estimate, not predicted hidden state. Missing/unobserved walls remain unknown (wallKnown telemetry); exit count is not a proof of safety. Offscreen threats, growing NPCs, map quantization and stale observations remain limitations. Unavailable/stale map releases keys. Existing neutral-camera-before-markers rendering and small/unknown white rejection are unchanged.

## Reproduction

Node 24 / no additional dependencies. Commands from checkout:

- `node scripts/check-grow11.cjs` — 32 prior policy and A parity cases.
- `node scripts/check-grow12.cjs` — 42 fixed scenario comparisons, 4 changed; corner lure, pincer, gap, side wall, blocked corner, open, missing map, horizontal mirrors, HUD 89/90/91.
- `node scripts/make-grow12-fixture.mjs` — controlled browser HTML, baseline from the pinned Git commit above.
- Open the generated `docs/ocr/repro/grow-12/browser-fixture.html` through the supported managed preview in a fixture-only session. It runs automatically, prints assertions/results and offers Download results. Never inject this fixture into the published game.
- `node scripts/build.mjs`
- `node scripts/check-grow-versions.mjs 9a60e39a74eef32834b0602d089fc4d665337ae3`

## Observed results

Cloud Linux / Chrome 156. 108 Canvas pixel-to-decision/keyboard cases across v2.13, v2.20, v2.21, v2.22 and 800x600 DPR1 / 384x467 DPR1/3 passed. Additional 54 browser comparisons using rendered map/player/white plus explicitly controlled wall/red observations passed; 12 corner directions changed inward. These latter observations are controlled inputs, not natural game state measurements. All emitted keys matched selected directions, missing-map release passed. Maximum additional-case planner time observed 2.9 ms; maximum readImage time 91.4 ms. Neither is an overall latency guarantee. Narrow Canvas dimensions do not establish native Safari or physical iPhone compatibility.

17 other route bodies/headers/statuses identical to baseline, including formal OCR, OCR-test, game routes, robots, sitemap, verification and version API. Four isolated game versions retain no-network/no-leaderboard and switching/stale-generation guards. Public defaults remain B / v2.13.

Natural starts/completed games/wins/deaths: 0/0/0/0. No win-rate evidence or formal OCR acceptance. Synthetic scenes are not independent natural gameplay trials. No source images/private artifacts included. Rollback point is baseline v184.
