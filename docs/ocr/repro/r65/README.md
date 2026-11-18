# r65 — bounded last-decision ImageData recording

Hypothesis: retain the already-read ImageData by reference (no active extra capture/encoding) in a12-frame/48MiB ring; associate accepted/rejected decisions with sequence and capture/decision timestamps; encode sequentially after stopping and compare PNG-decoded pixels byte-for-byte. Instrumentation does not change controller policy. Ring retains1200x698 analysis pixels, not2000x1163 source-resolution image. Existing periodic/terminal full-size PNGs remain separate.

## Fixed verification and one live diagnosis
Chrome156 Linux, same cloud host, desktop CSS/canvas2000x1163,DPR1,v2.20,test-043 baseline withr50telemetry.16 fixed-image calls from4images: outputs identical16/16; ring keepsseq5–16, evicts4, bytes40204800 (38.34MiB), associations complete; PNGroundtrip12/12. Fixed-order baseline/read+ring median103.15/65.8ms is order-biased, NOT speedup evidence. No threshold tuning.

One random non-seeded live start2026-11-18T03:08:27.783Z: visible ending death01:02,size93;0wins,1death,0aborts.321 accepted decisions,2 rejected (263.3/239.1ms),15periodic+terminalimages,0missedimage events, keysAfter empty. Accepted compute median21.2,max147.5ms. Original planner replay321/321 byte-exact outputs; not a proof instrumentation had zero timing effect. Fixed stops:150game seconds,210wallseconds,800acceptedrows,3consecutive rejecteddecisions,no automatic retry.

323 reads retained last12(seq312–323), evicted311 by design,40204800bytes, no association failures.12/12 accepted-row sequence, decision timestamp and capture metadata exact;12/12PNG pixel roundtrip identical. Captures span2323.7→91.2ms before terminal. Earlier decision images intentionally evicted, not silently missing. Late ring has no rejections; the2earlier rejected images have aged out while their metadata remains. Terminal encoding after stop; keys released. Not every game render captured, so final91.2ms remains a between-decision gap.

## New observed evidence, not a cause claim
Last image seq323 visibly contains the left/lower large purple/pink NPC and a smaller orange danger NPC. Corresponding recorded estimates include(-403.50,412.01,r445,clipped,dangerRadius495) and(-207.93,111.97,r147.24). Last selected south clearance26.24; player velocity(115.26,236.84), observed top-wall distance141.67. Terminal full-size image91.2ms later shows a markedly changed large pink boundary overlapping player; orange is no longer separately visible. This establishes a visible transition rather than absence of all threat detections. It does NOT establish true growth, identity association, exact attacker, actual radius, motion, or avoidability. Clipped component radius/centroid can change with visibility; terminal and decision image resolutions differ. No hidden-state control or assertion of collision cause.

Next fixed hypothesis: determine whether the visible boundary transition can be explained by clipping/occlusion and camera motion or requires an unmodelled shape/size change. Use these12same-source frames and terminal, preserve existing r60A/B counterexamples. Do not infer a missing threat solely from positive model clearance, and do not blind-rerun the recorder.

## Reproduction / files
Python3.12.14,Node24.22.1,Chrome156 Linux. Full game/controller/harness source included. No images or embedded pixels inGitHub. Local originals `live-raw-local.json`,`probe-raw-local.json` excluded. `live-results-noimages.json` includes full numeric decisions, key events, rejected rows and ring hashes/metadata. `plan.json` hashes are exact live-launch source; later build helper portability changes are separate. Randomgame outcomes cannot be reproduced exactly without recorded seed/state; no hidden state was recorded.

```
python r65/build.py --output /absolute/authorized-preview/dist
node r65/check.cjs
```
Use supported Sites preview with static.directory=dist; open r65.html; Start single fixed trial; Save trial evidence. Fixed single start and stops apply. Existing prepared fixture assets needed only for probe: use included r64/build.py with localr60raw inputs, then openr65-probe.html. Missing rawimages explicitly prevent independent perception/pixel test reproduction fromGitHub. Numerical original planner replay requires noimages.

For a local raw live download:
```
python r65/analyze.py /absolute/local/raw.json
```
This strips images into the noimage result and computes summary. Do not upload rawdownload. Fresh empty-directory build and numerical replay checked; same host, notnewOS. Raw ring bounded48MiB, but total browser/PNG/decisionmetadata memory is not claimed bounded to48MiB.

Newstarts1,wins0,deaths1,aborts0;diagnosticnotformalacceptance. Desktop each version150s/50% unmet,mobile skipped. Publictest-043 unchanged; noOCR4/Libraryupload. Previewstopped. Images stay executionenvironment only.
