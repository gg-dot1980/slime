# Grow-16 isolated contingency candidate

Prepared only. No preview, server, browser, or gameplay is started by preparation
or by the verification scripts. Activation remains conditional on all twelve
Grow-15 `confirm-03` v2.22 finals being available and fewer than six being wins
within 150 seconds. The current Grow-15 files, package script and active preview
are not modified.

## One falsifiable policy change

`planner.js` comes from the fixed Grow-15 `screen-03` source. Exactly one
expression changes: for a confirmed red body in v2.22 before HUD size 186,
`upper` becomes 200. A confirmed red body means `o.isRed || o.mapRed`; an
unmatched minimap red dot already had upper 200. The branch for v2.13 and the
immune v2.22 branch remain unchanged. NPC/food classification, neutral handling,
velocity prediction, route horizon, growth scoring, geometry and capture remain
unchanged.

The original internal name `planGrow15` and its diagnostic `strategy` value are
retained deliberately, so the pure source differs by only that expression and
unchanged version outputs can be compared without stripping metadata. The
candidate selection, run records, manifest and protocol identify `grow-16`.

A red marker establishes that an NPC is dangerous; its red threshold is not an
upper bound on physical radius. The candidate uses the known v2.22 maximum size
for that bound. This may increase clearance around red NPCs, and may also make
routes more conservative or delay growth. Prior numeric logs lack full hazard
positions, upper bounds and velocities, so this is not a demonstrated cause or
fix for the recorded deaths.

## Fixed protocol

- `screen-04`: exactly four new v2.22 starts, all using grow-16.
- `confirm-04`: twelve new v2.22 starts, permitted after all four screening
  finals exist and at least two are `win_le150`.
- Preserve every start, death, cutoff and interruption. Do not pool screening
  or previous candidates into the confirmation rate.
- Do not run new v2.13 trials. Its unchanged policy is supported by the parent
  Grow-15 `confirm-03` evidence, reported with that provenance. A successful new
  v2.22 candidate would be a version-dispatched policy with an unchanged v2.13
  branch, not new v2.13 gameplay evidence.
- The activation precondition is documented in the manifest and must be checked
  by the operator before any preview is activated. The isolated page does not
  query or change another candidate's records.

`parent-manifest.json` is the exact fixed Grow-15 manifest. Shared source,
geometry, isolated game construction, and both game sources are copied without
modification. Build checks verify their hashes and the actual built perception
and controller source. `check-planner.cjs` compares the pure planners and checks
the one-expression difference, unchanged v2.13 and immune behavior, and the new
red-body bound against a conservative numeric control.

From the repository root, preparation and source checks are:

```bash
node experiments/grow16/build-lab.mjs
node experiments/grow16/check-planner.cjs
node experiments/grow16/check-build.cjs
```

Building regenerates the manifest creation time and protocol hash. Freeze the
prepared sources and manifest before gameplay. `server.mjs` is an isolated copy
pointing only to this directory; it has not been activated.
