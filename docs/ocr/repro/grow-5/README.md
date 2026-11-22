# grow-5 — visible minimap controls NPC policy

Base GitHub fd8681b7cff905836019d3b6bfdb109fd5c92ad4 / Sites499cd8643db9ad4d59a8c61b629f7a68a88a3e21 (v177). B at displayed size>=90 now takes NPC targets/hazards exclusively from positively observed white/red minimap markers; main-view matching, clipped fragments, aliases, red text and body radius cannot reintroduce NPC avoidance. Food scoring and visible walls remain. Red overlap rejects white; missing map/player releases all controls and waits for a usable map. A, below90, game physics, score isolation and defaultv2.13 unchanged.

Intentional risk: a white NPC may be lethal (radius98 versus player90); white pursuit is policy, not edible ground truth. Missing/ambiguous/overlapping marker pixels are not inferred white. No new detector thresholds.

Cloud Linux Node24.22.3; Chrome156 fixture, DPR1. No packages added. Commands from complete checkout:

```
node scripts/check-grow-map-authority.cjs
node scripts/check-ocr-grow.cjs
node scripts/build.mjs
```

Map authority test compares frozen grow-4 source with current functions. For GitHub it uses the base SHA above. 31 assertions passed, four source-rendered game versions, 16 main-view absent/mismatched/split/alias cases;12 differ from grow-4 in threat count or direction. Includes89/90/91, A byte equality, below90 equality, two-red controls, red overlap, wall and missing-map cases, full tick/move key callbacks. Original11 planner regressions passed. Route verifier confirmed17 unchanged responses,5 version choices/switch cases and stale-input rejection.

Browser fixture is authored synthetic Canvas content, not a private replay or game session. It uses exact version minimap drawing snippets, current detector/planner/tick/key functions, and adverse body hypotheses injected only in the fixture. Four versions × white/red controls passed (8), white sent east with0 threats; red detoured southeast with1 threat. Actual KeyboardEvent listeners confirmed dispatch and missing-map release. Initial test incorrectly treated any right key (including a safe diagonal) as failed red avoidance; assertion corrected to inspect full direction, no controller threshold changed. No natural gameplay starts; no win-rate claim. Browser fixture was served only through a temporary local preview route, removed before packaging. It is not bundled into public pages; no fixture hook in public controller.

All materials are public-safe authored code/fixtures/aggregate results, no private images or per-object recordings. Prior grow-3/grow-4 pairing expectations are historical, superseded in this policy; use this version's test entry. Historical handoff index is not retried. Public deployment/readback recorded separately.
