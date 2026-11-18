# r55 offline candidate: sustained wall progress

Not a public test release or new live game. Public strategy remains test-043. Frozen hypothesis/config in plan.json. Candidate changes wall-hit alignment/inward scoring to last1s displacement divided by speed*1s; original2s physics and all safety/pool rules unchanged. No fitted parameter sweep.

## Reproduce
Extract the archive into a clean directory and run from its root, with Node v24.22.1:
```
node r55/run.cjs
node r55/crosscheck.cjs
```
No npm dependencies. inputs.json contains all1713 exact frozen planner inputs (1298original plus415conditional separately). Current.js/source factory, generated baseline/candidate, scripts, outputs and provenance included. SHA256.json records every input/script/output. A clean temporary extraction replay was compared byte-for-byte with saved outputs. This is saved-planner replay, not original pixel recognition or random gameplay reproduction. Historical images are retained locally only and excluded from GitHub per latest user instruction; r14 full raw is not required by this replay. No seed used for these deterministic scripts.

## Findings
Baseline matches1713/1713 previously saved r53 directions. All1298original plus415conditional preserve clearance/gain/risk physics. Changes: r46 six, r14 four, r50 one, fixed75 zero; conditional one separately. No no-wall changes. Three original changes lower radius-model clearance by0.58–3.92px; none exceed predefined5px bound. Center-wall comparison likewise has no loss>5px, but neither model is ground truth.

r46-348 changes north→northeast: last1s horizontal displacement0.39→227.32px, radius-model clearance22.22→76.83; center-model improvement19.32px. Counterexample r46-382 still chooses north with only0.48px tail displacement. Existing r46-376 cross-model conflict remains: selected southwest center-model clearance−150.40 versus north−99.37 (bothnegative). This is not proof of death or a safe alternative, but prevents claiming whole-controller safety validation.

Conclusion: scoring now distinguishes decaying inertia and sustained motion; it does not generally resolve near-stationary selections, which may be chosen for lower predicted risk. Do not promote whole controller or run a new live batch solely from these proxy improvements. Next separate deliberate temporary waiting from a claimed escape, and test observed next-step risk/progress without tuning this same weight repeatedly.

New games0,wins0,deaths0,aborts0. Desktop<=150seconds and>=50%each existing version goal unchanged; mobile skipped. Preview stopped. No OCR4 or /ocr-test controller deployment; no Library upload.

## Environment and limits
Current host55a6111fa095, Linux cloud, Node24.22.1; historical desktop Chrome156 CSS/canvas2000x1163,DPR1 only applies to originalr46/r50. No browser launched here. Camera corrections are conditional frozen observations, not independent tests. Collision geometry and extrapolated1second tail remain unvalidated. No random game trajectory reproducibility claimed.

[Download r55-repro.zip](./r55-repro.zip), SHA256 `dee666aa49a64692ba007cc349794770a5f765c57d7161bf6d23e666b8c9b2bf`.
