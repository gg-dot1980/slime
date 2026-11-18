# r76 — separate target progress from threat avoidance

2026-11-18 Taiwan. Offline qualification:0 new games,0 wins/deaths/aborts. Preview not started. No public controller or OCR4 publication; mobile skipped. No image or Library upload.

## Frozen hypothesis
Keep the prior r72 intervention when baseline has a positive **existing NPC risk penalty** OR baseline projected wall margin is below existing margin260+.75r. Otherwise use baseline target preference. This reuses existing risk geometry (penalty inside100px), not a newly fitted threshold; no heading lock. r74seq304 and r50index386 are development/counterexample anchors. Frozen regressions2235 plus r74all345; separate r72A285/B304 used only after rule fixed. These are previously collected games, not fresh statistical samples; “holdout” labels in old group names do not mean untouched data.

## Quantified tradeoff
3169 states; prior54 interventions, proposed35 retained,19 reverted. Distribution of reversions:r60A2,r60B9,r14:4,r50:1,r74:3. All19 have zero existing risk penalty before and after; their shorter0.2s **modeled** distance reduction to the same selected target improves. Summed changes and per-case values are in results.json; summing correlated state scores is not actual harvested size or time saved. The target-progress model uses the original2x0.1s inertia update and observed target velocity. No claim of stable identity or physically calibrated accuracy.

Gain comparison is the original2s weighted path gain, a different horizon and quantity. It falls in14 cases and is unchanged in5: approaching the preferred target faster trades against other predicted food along the trajectory. Thus better target progress alone does not establish better growth. Across group totals, progress improvements range from5.29 to58.57px except smaller r14 cases2.99/4.73px; full per-state evidence retained. No new negative NPC prefix gap or negative wall distance compared with prior under frozen0/100/200ms prefix models. Not proof of real safety.

The r75 counterexample r50index386 is preserved: risk0.2124>0 retains NE; no-prefix gap remains2.340 rather than revertingN/0.684. Existing−3.612 prefix gap at100/200ms is still present in both and not concealed. r65last12 all outputs unchanged, retaining two interventions. Previously rejected prefix cases remain protected by unchanged original prefix gate.

## Validation limit / decision
r72A/B589 held-out states produce **zero changed decisions** (three prior overrides retained). They verify compatibility but do not test the new behavior. Do not call19 model improvements independent live validation. No tuning after held-out observation and no new game this bounded qualification phase, as predeclared in plan.json. Candidate remains an offline prototype; not rejected for demanding zero deaths, but unproven because growth benefit and independent changed-case coverage are missing.

Next executable stage: predeclare a small bounded baseline/candidate desktop comparison with the r74 first-intervention image recorder, measure actual size over complete windows and ending outcomes, retain deaths/aborts, and report no-trigger cases. Do not expand unchanged r72 or adjust thresholds using this holdout. This would test the tradeoff that offline metrics cannot resolve; original per-version150s/>=50% acceptance remains unchanged.

## Reproduce
Node24.22.1 standard fs/vm/assert; Python3.12.14 packaging. `node r76/analyze.cjs` regenerates candidate-plan.js and results.json. Includes full Current.js,prior-plan.js, fixed inputs, r74inputs and r72A/Binputs; no external source needed for numerical replay. Empty-directory replay checked on same host55a6111fa095, not a new OS/browser. The game and recorder remain r74 commit f9b9441bfe28fb49eb51cc111901ecc7639137ee; no live harness change here. Numerical reconstruction is not random-game replay. Images absent by user instruction; last two r74 interventions remain visually unattributable.
