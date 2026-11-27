# Grow-15 preparation record

This document records the state before the first browser run. The frozen
`screen-03` experiment subsequently began on 2026-11-25 at 01:35:07 UTC.
Consult the package README and results/evaluation-summary.json for the current
measured outcomes; the checks below are not gameplay evidence.

## Scope

- Base: Grow-14, source Site commit `14c1815351b32096b325e032331b90c1f7873159`.
- `planner.js` is identical to Grow-14 after replacing the candidate/function names.
  Edibility, neutral NPC handling, lethal thresholds, wall handling, 200 ms compute
  stop, eight-direction actions, and all score coefficients are unchanged.
- Keeps full 2000-pixel capture. The pipeline supplies strict `growMarkers` arrays
  for every candidate map, including empty arrays. The unchanged planner retains
  its legacy broad-dot fallback, but it is unreachable through this pipeline.
- Adds the frozen `geometry.js` refiner to already-classified NPCs only. A non-null
  result replaces both pixel centre and pixel radius, then divides by capture ratio.
  A null result preserves the existing component centre and highlight radius.
- Food classification/geometry is unchanged. No hidden game state is read.
- `geometryAccepted` (0/1), geometric consistency `confidence`, and `originalRadius`
  are available in object/target diagnostics. The harness records accepted count,
  NPC denominator, and mean accepted confidence once per sampled game second.
  Confidence is not a calibrated probability. No pixel data is saved.

## Fixed inputs and protocol

`source-base.html`, `geometry.js`, both game source files, and `game-isolation.mjs`
are local frozen copies. The build does not import the mutable `perception-next.js`.
Their hashes, planner/build/harness hashes, and the built page hash are in `manifest.json`.

`screen-03` interleaves v2.13 and v2.22 four times: 8 starts total. Each version must
win at least 2/4 within 150 seconds before `confirm-03` can run. Confirmation is
12 starts per version. Viewport is 2000×1163 and single-run compute limit is 200 ms.
All starts, failures, cutoffs, and aborts retain the existing denominator rules.

## Local checks

From the repository root:

```bash
node experiments/grow15/build-lab.mjs
node experiments/grow15/geometry.synthetic.cjs
node experiments/grow15/check-minimap-next.cjs experiments/grow15/index.html
node experiments/grow15/check-build.cjs
```

The geometry suite contains 12 generated numeric/RGBA cases. These checks do not
measure gameplay success. The preparation itself did not launch a server or change an active route.
The root operator subsequently selected Grow-15 for its separate frozen batch.
