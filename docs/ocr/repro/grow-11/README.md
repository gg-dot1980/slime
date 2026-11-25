# grow-11 inclusive 90 threshold

Rollback: Sites v183 / source d210b40504172b02bfe8ffe82696b0c70be6e9c7. Retains Grow-only camera neutral color / below-marker rendering repair. No shared game/render/physics file changed. No GitHub push.

B below HUD90 directly calls the verified unchanged planBaseline (same source as rollback; A unchanged). HUD90+ uses map white pursuit and map red obstacles. Near red approach paths are rejected if predicted endpoint moves closer and red is within player radius + conservative red radius + 2 seconds travel; red behind permits moving away. Walls remain independent. Main NPC only supplements avoidance when a same-direction red exists. Missing map or observedAt older than400ms releases control; unchanged image reuse retains its original observation timestamp.

White size evidence: already accepted visible component only; non-saturated (<5 map pixels diameter) bounding extent plus1 pixel gives estimated radius upper bound 38*(diameter+1)/2. Require positive bound below0.9*HUD. Saturated/unknown and near-size whites excluded, not guessed edible. Pixel quantization can reject genuine tiny prey; this is not guaranteed collision safety. Green player is never a target. Red/white overlapping evidence rejects prey; red avoidance wins. No hidden game input.

Commands:
- node scripts/check-grow11.cjs (32 controlled policy cases, baseline equality)
- node scripts/make-grow11-fixture.mjs (generate local fixture, then managed preview; Download results)
- node scripts/build.mjs
- node scripts/check-grow-versions.mjs d210b40504172b02bfe8ffe82696b0c70be6e9c7

Browser: Chrome156 Linux, 108 controlled Canvas/main-recognition/KeyboardEvent cases: four rendered game versions x800x600 DPR1 or384x467 DPR1/3 xHUD89/90/91 xno/near-forward/rear red. 24/24 white-only eligible pursuit;24/24 near-red avoidance;36/36 HUD89 baseline parity. Sample max readImage61.8ms, not a guarantee. Missing map key release passes. Not Safari, no natural games or win rate. Earlier fixture used NPC76 atHUD90 (correctly white), then distant safe red; those invalid expectations were corrected, not reported as strategy failures.

Route/isolated-game checks: 17 other responses identical; four bundled games, five options, stale version switching/no-score isolation retained. Default B/v2.13. Natural starts0, completions0. Formal OCR unchanged.
