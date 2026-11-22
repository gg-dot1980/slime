# grow-3 — visible non-red minimap pursuit at size 90

2026-11-22 (Taiwan). Scope /ocr-grow B only. Sites base 94eda4ba4f46e836a88da67aca68e1b63ba8adff (v175); GitHub base 3cca7d0c1925edaf3edce758274c911b48097075. Source is this commit: src/ocr-grow-minimap.js, src/ocr-grow-planner.js and the identical embedded functions in src/ocr-grow.html. Original per-version game sources and A planning unchanged. Default game v2.13.

All four sources v2.13/v2.20/v2.21/v2.22 draw the same minimap: pale #d3eee1 NPCs, red #ff8a7e NPCs above 1.12 times player radius, green #a3f3d1 player/camera. Food is not drawn on that map. Non-red does NOT guarantee edible (the eating threshold differs).

Only B with visible HUD size >=90 extracts positive pale/red components in the observed minimap. It rejects edges, elongated/mixed components and the player vicinity; missing evidence is not positive evidence. One-to-one body association can bypass the old 0.85 edible / 0.94 threat size estimates. Red text, clipped/blocked or ambiguous associations do not qualify. Unmatched visible pale markers can provide approach-only map targets; those receive no confirmed-growth claim. Existing red map detections remain hazards, including those the stricter new component rule rejects. Red positions use conservative padded geometry; true size, motion and overlap remain uncertain. Walls and known red hazards constrain the two-second candidate paths. No game objects are read at runtime, no scoring/API/DB behavior changed.

Reproduction (Node 24.22.3, cloud Linux; no new packages):

```
node scripts/build.mjs
node scripts/check-ocr-grow.cjs
node scripts/check-grow-minimap.cjs
node scripts/check-grow-versions.mjs
```

17 new fixed checks pass: 89/90/91; red/non-red/no marker/ambiguous/clipped/red-text cases; wall, red-path detour and no-safe-route; four versions' original minimap drawing commands rendered into a deterministic non-antialiased software raster; A byte equality; 12 under-90 output comparisons. Existing 11 strategy/stop checks and 5 switch cases pass. Sites-only route comparison against the base preserves 17 route responses including sitemap, robots, verification and all old OCR routes. GitHub does not include the verification file.

One initial test incorrectly disallowed every forward component near a red marker; it was corrected to permit a diagonal detour only with positive modeled clearance. This was a test-expectation correction, not a relaxed planner hazard boundary.

Synthetic/source-rendering tests are not real gameplay or browser antialias validation. No private images, per-object replay data or credentials are inputs. Browser smoke and >=90 gameplay remain separately reported; formal games/wins 0/0. Seeds are not assigned, mobile acceptance skipped, no win-rate or independent-CI claim. Formal per-desktop-version 150-second/50% acceptance unchanged. Model/effort not displayed. Known limits: close/overlapping/tiny/edge marks may be rejected; minimap quantization and velocity estimates are not safety guarantees. Do not infer edible from absence of red.

## Published smoke result

Sites v176 (source b63339a6089dff726eea4f2676a22823d0f7a41d), public /ocr-grow read back grow-3/default v2.13/default B. Cloud Chrome desktop: four fresh starts, one per game version; each had 25/05:00/attempt0 before Start, then attempt1 and visible game time progress. All four deliberately stopped and showed paused; no repeated Start/Resume counted. Aggregate: 4 starts, 4 operator interruptions, 0 completed, 0 wins, 0 deaths. All observed sizes were below90. Red/pale map dots and green player/camera marks visually present across four versions; this is not a precision/recall or >=90 behavior test. Visible decision timings sampled 7.6–50.9ms (not a bound). Returned page to v2.13 ready with no active game. No formal acceptance, no mobile test. No screenshots are included here.

GitHub test refers to its own base 3cca7d0c1925edaf3edce758274c911b48097075 instead of the equivalent Sites source base when loading historical code; strategy inputs/code are the same. Full Git history is required. The previously blocked historical handoff-index operation is not retried; this standalone grow-3 entry is the direct handoff.
