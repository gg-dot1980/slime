# r64 — original browser ImageData stage audit

2026-11-18, Chrome156 Linux, original 2000x1163 PNGs from r60 A/B last periodic and terminal. Original readImage scales to1200x698, ratio0.6. Fixed four images; cold instance per image, no temporal tracking claim. Sources: r45-source/Current.js, r60 original PNG hashes in fixtures.json. Instrumentation only separates containment and final filtering and exposes accepted components. The unmodified and instrumented complete analysis outputs agree4/4. Browser results downloaded, not inferred from source.

|Image|Raw accepted components|After containment|Kept|Cold-image diagnostic safe directions|
|---|---:|---:|---:|---:|
|A periodic|38|38|30|4|
|A terminal|29|27|27|0|
|B periodic|12|11|9|1|
|B terminal|12|11|10|0|

A terminal purple giant: analysis-space center(510.675,498.268),radius341,clipped true; detected, survives containment and player exclusion. Equivalent source-coordinate radius568.33px. Thus the candidate of relaxing containment/player filtering is NOT supported by this fixed case; no patch changes those gates. Terminal geometry under original planner yields all-unsafe, best clearance -253.63; B terminal -62.32. Cold-image NPC velocities are zero and last prior player state reused; these diagnostics are not historical decisions and not proof another action could survive.

The last A historical decision remains197.1ms before terminal capture, with4 threats and no corresponding lower-central giant. Previous saved PNG3067ms earlier. Terminal detection success does not prove earlier visibility, growth, spawning, identity, correct earlier segmentation, attacker identity or avoidability. No last-decision PNG exists. The changed scene explains why terminal and earlier model outputs can differ but cannot determine how the change occurred. Do not reconstruct missing pixels from summaries or treat terminal success as earlier safety.

No evidence-supported controller modification this round; no live games. New starts/wins/deaths/aborts0. Mobile skipped; all-version desktop150s/50% goal unchanged and unmet. test-043 unchanged; noOCR4 publication, noLibraryupload. Preview stopped.

## Reproduce
Use complete pinned r62 package from commit4b7eb2aec66f70e205b05712a60f7169bd64851c, docs/ocr/repro/r62/r62-repro.zip, SHA25625cfb07bff57469cb2cd6976938251f01bdef1ae0b36c04ecaac28763688e00b. Place this directory as r64 under archive root. It supplies original controller/game, numerical r60 data and harness. Python3.12.14,Node24.22.1,stdlib only.

Numerical stage/planner replay without images:
```
node r64/compare.cjs
```
Fresh empty-directory output byte-identical on same host. Original browser stage output is browser-results.json; code-only replay cannot independently validate PNG perception without local originals.

To repeat ImageData test with locally available original r60/A-raw-local.json and B-raw-local.json:
```
python r64/build.py --output /absolute/authorized-preview/dist --raw-dir /absolute/local-raw-directory
```
Use supported Sites preview on that checkout; open r64.html, Run fixed four images, Save numerical results. No game/keys/network submission. Verify fixtures.json PNG hashes, compare outputsEqual and stage lists. Raw inputs/PNGs intentionally excluded from GitHub per user. Missing originals are a reproduction limitation, not permission to reconstruct them. Fresh build with local originals verified generated code/fixture/PNG hashes; only PNGs require local raw evidence. Audited.js is the full instrumented original source.

Next targeted evidence: last accepted decision-source frame plus terminal frame using an already bounded recorder, with actual capture/dispatch timestamps and component-stage diagnostics; preserve accepted/rejected outcomes and overhead. Before any new live trial, establish this captures the missing decision instant without changing control. Existing sparse periodic images cannot settle a197ms onset. Avoid another threshold adjustment or identical sparse trial.
