# r59 — fixed reversal score attribution

Single question: does target alignment, predicted gain, or estimated threat cause the score preference at reversals? No policy change, no new game. Source test043; inputs fixed from r58. Current environment Python3.12.14,Node24.22.1,Linux cloud. Desktop v2.20 source r57 A/B,2000x1163,DPR1,Chrome156. Historical inputs separately retained. Goal per-desktop-version <=150s and >=50% unchanged; mobile skipped.

## Results
Instrumented 2654 observations (1298 historical originals,415 conditional,941 r57), with0 direction/score/clearance mismatches and0 score-sum error. Terms exactly decompose original score; selection pools and all-unsafe ordering unchanged.

146 direction-vs-prior reversal states:A69,B77. B0 uses initialization heading, not observed adjacent control reversal;145 have preceding saved decision. Original prior direction eligible and not all-unsafe:A60,B62. Dominant positive score difference versus prior:alignment54+59=113,gain6+0=6,risk0+3=3. Dominant increase in preference versus previous observation:A alignment54,risk2,wall4;B alignment57,gain1,risk3,one unavailable initialization. These are code-level attribution, not physical root-cause certainty.

Removing one score component while retaining original eligible pool changes chosen direction in alignment38+31=69,gain14+12=26,risk3+4=7,wall0,inertia0 of those122states. These counts overlap and ablation is not gameplay. It does not establish which alternative survives or grows.

Among these122states,45 change target class(food/NPC/map);104 have target-relative-coordinate jump>100px. Neither is a validated identity switch:camera motion, occlusion and tracking ambiguity are not corrected by this count. Existing5second periodic images cannot label every decision; unknown remains unknown.

## Candidate screen / counterexamples
Hypothesis considered: when reversal predicts zero gain while prior eligible direction predicts positive gain, keep prior direction. Covers A3+B11=14states,including B257/259/261/263/265 repeated sequence. A r57A-225 loses71.9px modeled clearance; B has5 margin-loss cases. Predicted gain is not observed consumption. Reject unconditional application; no live test or claim of benefit. Do not simply enlarge r58 threshold. The observed dominance points toward validating target association/anticipated contacts, rather than blanket reversal suppression.

Next bounded work: inspect B195/197 and257-265 actual target/trajectory pairs with existing adjacent images; compensate camera and retain unidentifiable cases. Only then freeze an evidence-backed target policy and test it. This phase does not claim a new safe controller candidate.

## Reproduce
Extract complete no-image archive into empty directory and run from root:
```
node r59/analyze.cjs
```
Includes original complete Current.js, all frozen numerical inputs, instrumentation script/generated source, per-state components, summaries and hashes. Node only, no dependencies. Verify result.json and instrumented.js byte-identical after clean-directory replay. Input source raw-image hashes remain in prior r58/r57 records; no images uploaded or implied restored. Random live trajectories not reproducible from this package. New starts/wins/deaths/aborts all0. Preview not started; no OCR4 or publicstrategy deployment, no Library upload.
