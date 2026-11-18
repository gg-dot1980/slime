# r73: r72-B terminal surface audit

Updated 2026-11-18, Taiwan time. Offline analysis only: 0 new starts, wins, deaths or aborts. r72 remains A death56s/size66 and B death60s/size63 (2 starts, 0 wins, 2 deaths, 0 aborts). No new controller, public test-043 unchanged, OCR4 not released. Mobile skipped.

## Fixed hypothesis and observations
Retrospective hypothesis: camera translation alone explains the large purple surface that covers the player in the ending image. Compare all 12 retained same-source decision images (293–304) and terminal, using one fixed player-right ROI and colour rule. This is an explanatory test selected after inspecting terminal, not a prospective classifier or independent safety validation.

ROI x640:680/y330:370 in1200x698; RGB rule B-G>15,R-G>5,B-R>5,R>60. Purple occupancy is0 in12/12 decisions and1 in terminal. Visible bottom wall moves548.5→526.651 analysis pixels. Sampling the previous image with this22px vertical displacement and horizontal offsets−40,−20,0,20,40 still yields0. This sensitivity does not establish a physical camera bound. A visible surface change beyond the tested translation is supported; spawn, growth, overlap, blending and identity cannot be distinguished across the181.1ms final gap. Source code allows replenishment and absorption, but neither is established as this death's cause.

Last actions: W,W,NW,NW,NW,S,S,S,S,S,SW,SW. Last retained planner clearance28.4; this is model output, not measured future safety. Left large purple NPC, right salmon NPC and top clipped NPC are visible before death. Terminal contains an additional/changed large purple surface across the player; assigning it to a prior ID is unjustified. The small purple and green objects already overlap in the last image, but prior r67 adjacency warning and failed candidate history prevent treating this single similarity as a new validated control rule.

The sole B intervention at index291/seq292 occurred2.584s before stop, NE→W, and lies outside the retained12-frame ring. Its nearest periodic image is1383.4ms away. No same-source intervention image exists; do not infer its causal benefit or harm. Last12 frames are retained, hashed and roundtrip-verified, but they do not fill the final181.1ms.

## Reproduction and limits
`python replay.py` regenerates numerical summary from inputs/measurements using Python3.12.14 standard library. `python analyze.py` requires local13 PNGs, Pillow13.0.0 and numpy2.3.5; it cannot reproduce pixels from this GitHub package because images intentionally stay local. Exact source PNG hashes are in measurements.json. Translation sensitivity is recorded numerical evidence; not independent truth. Full frozen game/controller/harness are the r72 package at commit cd711536a5fd95812232157e413b2b814ad33ef2, docs/ocr/repro/r72; no source or strategy changes in r73. Random game outcomes cannot be replayed exactly; no known seed.

Environment: host55a6111fa095; Chrome156 desktop2000x1163 DPR1 for historical B; current phase offline Python. Preview verified stopped. No Library upload.

## Decision / executable next step
Do not expand r72 candidate unchanged or add a single-case threshold. No evidence-supported new control candidate established. Before another strategy batch, use the existing12-frame ring with a dedicated one-slot intervention snapshot (bounded, no GitHub images) to preserve the exact candidate decision that is currently missing; verify unchanged control output and stop behavior on fixed cases. This addresses a precise attribution gap, not the unobserved181ms or a guarantee to prevent abrupt terminal changes. Any future strategy needs independent normal/overlap examples and actual desktop results. Acceptance remains every required desktop version <=150s and >=50%; no passing claim.
