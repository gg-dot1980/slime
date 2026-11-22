# grow-4 — confirmed non-red means pursuit, not avoidance

Experimental default B on /ocr-grow only. At displayed HUD size >=90, a uniquely associated, positively observed non-red NPC minimap marker overrides that same NPC's estimated-size, clipped, blocked and danger-text avoidance. Separate red markers and walls remain hazards. Ambiguous, player and unobserved markers are not positive non-red evidence. A and below90 behavior remain unchanged. Default game: v2.13.

Intentional risk: radius98 NPC against actual player radius90 can be non-red yet lethal under unchanged game physics. Pursuit does not guarantee swallowing or survival.

Source baseline: GitHub test/ocr-test b6afc96a0be8734af3d803bde7a63799eec9ead0; Sites source b63339a6089dff726eea4f2676a22823d0f7a41d, live v176. Changes: minimap association, grow planner, embedded /ocr-grow controller and version notes. No threat-dedup prototype included.

Environment: cloud Linux, Node24.22.3. No dependencies added. Run from checkout:

```
node scripts/check-ocr-grow.cjs
node scripts/check-grow-minimap.cjs
node scripts/check-grow-nonred.cjs
node scripts/build.mjs
```

Results: 11 original planner cases; 15 minimap/source-render cases covering four bundled game versions; 9 non-red cases including 89/90/91, lethal98 fixture, red overlap ambiguity, absent marker, separate red path, walls and full default-B tick through actual move/key-dispatch function. All passed. Two grow-3 clipped/danger-text rejection expectations are intentionally superseded by grow-4 positive-association behavior. Local route comparison against Sites baseline confirms17 other responses unchanged and5 selector/load cases (four versions plus current alias), stale/mismatched results rejected.

These are synthetic/source-command rendering and controller regressions, not a real-game outcome batch. New games0; wins/deaths not measured. No win-rate claim, mobile acceptance or independent CI claim. No private images, replays or per-object private measurements included. Historical handoff index not modified.
