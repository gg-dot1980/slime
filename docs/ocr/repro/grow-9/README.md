# grow-9: minimap guidance and gated local avoidance

Baseline Sites v181/source cfefdca2a748d192ac026cbd8e2796946487b765. A baseline unchanged. B starts immediately, default game v2.13. No GitHub update authorized this round.

Only a minimap red in the forward ±30 degree sector plus one minimap pixel allowance enables main NPC avoidance. Rear and unrelated side reds do not. Walls are independent; missing reliable minimap releases keys. This user-requested policy accepts potentially lethal non-red NPC contact. Near-size white is excluded from prey, not an independent local avoidance source.

Local obstacles require existing visible-name detection, non-clipped compact contour (aspect <=1.4, density >=0.5), and red text or radius >=1.08 player. Overlapping aliases remain uncertain. Local path uses 1 second at 100ms steps; safe gap >3. Return-to-guide gap >20; adjacent safe heading hysteresis 0.3 alignment. These are heuristics, not calibrated safety guarantees. Equal octant alignment resolves using larger clearance rather than floating-point noise.

NPC minimap destinations rank by time and map hazard proximity. Plausible small food from existing non-NPC classification (radius <=6, not clipped/blocked) is fallback when no NPC, or when nearest ranked NPC exceeds 8 seconds travel and nearby food exists. No main NPC used as destination. Main-view reliability failures can miss threats. White saturation is not proof of edibility.

Reproduce from checkout:
- `node scripts/check-grow-guide.cjs` (23 controlled cases; also baseline A function equality)
- `node scripts/build.mjs`
- `node scripts/check-grow-versions.mjs cfefdca2a748d192ac026cbd8e2796946487b765`
- browser-fixture.html is a local isolated harness; no deployed fixture hooks. It runs exact planner/tick/key dispatch with Canvas minimap pixels from four version render snippets and controlled main-object observations. It does NOT validate full real-game main-image recognition or win rate.

Observed Chrome 156 Linux: 96/96 Canvas-to-key controlled cases, map loss key release; sampled maximum tick 12.8ms. HUD 25/89/90/130, versions v2.13/v2.20/v2.21/v2.22, no/front/rear red, main obstacle above/below. Body fixture remains constant radius60; high-HUD emergency can choose retreat rather than lateral motion. 0 natural game starts, 0 completed games, no win-rate claim.

Route check: 4 isolated game versions / 5 selector entries, no-score network restrictions, version switch stale/mismatch rejection; 17 other route response status/headers/body identical including sitemap, robots, Google verification, official OCR and leaderboard routes untouched.
