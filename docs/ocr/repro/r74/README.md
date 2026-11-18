# r74: bounded first-intervention snapshot

Taiwan date2026-11-18. Recorder-only diagnostic, not acceptance or a new strategy. One predeclared v2.20 desktop Chrome156 game,2000x1163,DPR1: **0 wins,1 death at68s,size90,0 aborts**.345 accepted decisions,0 rejected,0 image request misses; keys released. Preview stopped. Mobile skipped. Public test-043/OCR4 unchanged; no Library upload.

## Hypothesis and implementation
A separate first-intervention slot preserves the exact accepted source image after12-frame ring eviction without changing planner outputs. `ring.js` adds one immutable pixel copy, capped4MiB, plus counters. Only accepted `planOutput.r72.changed` invokes it in `record.js`, after original move(d). Later interventions increment skipped count, never overwrite. PNG encoding/hash/readback still occur after stopping. Original ring48MiB plus pin4MiB worst-case raw budget52MiB; current1200x698 images total43,555,200bytes (41.54MiB), not total browser memory. Export temporary canvas/PNG allocations are additional.

## Verification
- Existing2235 fixed directions match; historical589 full plan outputs exact; new345/345 full outputs exact. Controller and dispatch/stop source unchanged; observer does add time, so this is not a claim of identical real-time trajectories.
- Browser non-game fixture: pinned image survives source mutation and ring eviction;13/13 PNG roundtrips equal, first pixel17, pin2.1ms, finish689.9ms. Unit cases reject unassociated/oversize pin and count skipped repeated pins.
- Live first pin seq304:2.5ms copy,0 missing,3 interventions/2 deliberately skipped.13 exported frames all roundtrip equal. seq304 capture equals recorded decision capture, although it would be outside final ring334–345.
- First intervention03:59,size83,SW→SE,8.372s before stop; model clearance475.95 and gain1.867 are predictions. Visible image shows player central, left wall, small food below-left, larger NPC at right and clipped NPC lower-left. It does not show imminent contact at the player. Subsequent recorded directions SE,SW,SE,SW show short-lived changes, not proven actual reversals or causal death. Later interventions seq306 and322 lack same-source images by design. No claim about their visuals.

Raw local evidence SHA256 `d441876e6745dd67e0d58f4af4fa4474a710b69beb05a5841681832f5d5f2d58`. Images stay local only. `results-noimages.json` retains image hashes/metadata, not pixels. Single random game cannot establish overhead distribution, strategy benefit or win rate.

## Reproduce
Python3.12.14,Node24.22.1; no npm dependencies. Unzip to an empty directory containing r74/.
```
python r74/build.py
node r74/check.cjs
node r74/planner-check.cjs
node r74/planner-live-check.cjs
node r74/current-replay.cjs
python r74/analyze.py r74/results-noimages.json
python r74/preview-build.py --output /absolute/checkout/dist
```
Use supported Sites preview with static.directory=dist; browser fixture r74-fixture.html; trial r74-trial.html starts only via its Start button. Full baseline controller, candidate, original recorder, game, timing module and numerical fixed inputs included in baseline/. `build.py` is reversible; no remote assets needed for the local game harness. Do not run new random games as though they recreate this outcome. No seed recorded. No image replay possible from GitHub alone, by user instruction.

## Next
Use the new exact intervention case together with existing independent normal/collision examples to evaluate short-lived direction switching; do not just rerun this unchanged candidate or assume switching caused death. The record-only hypothesis is supported for this fixture and one game. Acceptance remains each required desktop version<=150s,>=50%; still unmet.
