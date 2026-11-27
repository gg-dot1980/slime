# Grow-17 conditional, inactive candidate

Prepared from frozen **Grow-15**, not Grow-16. This directory is not activated.
No server, preview, browser, game, raw log, or published report is changed by
preparation or source checks.

Activation is permitted only after the fixed Grow-16 `confirm-04` batch has
**12 native v2.22 finals and fewer than 6 wins within 150 seconds**. Partial
results do not authorize activation. An operator must verify the complete batch
before starting this isolated candidate; the page does not query another
candidate's records. The activation condition is in `manifest.json`.

## Exact single change versus Grow-15

The only planner source difference is the guard around white minimap scout goal
generation:

```diff
-  if (mapOK) {
+  if (mapOK && !immune) {
```

`immune` is the existing condition `cappedGame && r >= 186`, and `cappedGame`
selects v2.22. Thus v2.13 and v2.22 before HUD 186 retain the same policy. All
other planner bytes are unchanged, including Grow-15's original red-body upper
bounds. Grow-16's red-body upper=200 change is absent.

The original internal name `planGrow15` and its diagnostic `strategy` value are
retained for exact source and full-output comparisons. The candidate selection,
manifest and run records identify `grow-17`.

## Mechanism and limits

Original scout targets have `mapOnly:true`, `growth:0` and `pursuitOnly:true`.
They do not enter the real `reachableMeals` growth calculation. Their positive
`utility`, however, can produce `approach`, which contributes `approach * 4.2`
to a route's score. This candidate removes those goals during the existing
immune stage. It retains visible food and body meals, walls, movement inertia,
and the original exploration fallback when no useful targets remain.

The hypothesis is that this can improve late completion when zero-growth scout
approach is competing with local opportunities. It could also make discovery of
distant resources slower. Earlier numeric logs do not establish a causal reason
for cutoffs or deaths; passing source checks is not gameplay evidence.

## Fixed protocol

- `screen-05`: exactly four new v2.22 starts using grow-17.
- The confirmation gate requires exactly four distinct run IDs with native
  outcomes, and at least two `win_le150` outcomes.
- Native outcomes are `win_le150`, `win_late`, `death`, and `deadline_cutoff`.
  Late wins count as failures for the 150-second objective. Infrastructure
  errors, controller aborts and unknown outcomes cannot satisfy this gate.
- `confirm-05`: twelve new v2.22 starts after the screen gate passes, using the
  same frozen candidate. Every start and interruption stays in the record;
  there are no automatic replacement draws or pooled confirmation rates.
- No Grow-17 v2.13 samples are planned. Its unchanged policy reuses Grow-15
  `confirm-03` evidence, 11 wins among 12 native finals, with that provenance.

## Source requirements and checks

Runtime/build inputs are local to this directory: `source-base.html`,
`planner.js`, `geometry.js`, `game-isolation.mjs`, both game HTML files,
`parent-manifest.json`, `harness.js`, and `build-lab.mjs`. They use Node built-ins
and inline browser code. `server.mjs` is a dormant local server copy pointing
only to this directory.

Regression checks additionally require these fixed parent files:

```text
experiments/grow15/frozen/screen-03/planner.js
experiments/grow15/frozen/screen-03/index.html
```

The shared source, geometry, game construction and game inputs are exact
Grow-15 copies. `check-build.cjs` compares the actual built `readImage()` and
`tick()` with that parent, allowing candidate-name substitution only. It also
exercises the four-native-result gate, including incomplete, duplicate,
interrupted and wrong-version cases. `check-planner.cjs` checks the exact
single-line difference, unchanged version/stage outputs, and immune scout
removal against the original planner with only non-red map markers omitted.

From the repository root, local preparation and source checks are:

```bash
node experiments/grow17/build-lab.mjs
node experiments/grow17/check-planner.cjs
node experiments/grow17/check-build.cjs
```

These commands do not activate a preview or execute a game. Rebuilding updates
the manifest creation time and protocol hash; preserve the frozen prepared
manifest for the planned experiment. Page content and source hashes are the
reproducible build comparison targets.
