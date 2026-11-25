# grow-10 camera overlay regression

Rollback: grow-9, Sites v182, source 11dd45d6592b7b9371cc0a562083d4e199771d81.

Only Grow isolated game rendering changes: camera box uses neutral gray-blue instead of player green; NPC dots render after camera fill/stroke, before the player. Source game files, physics/collision, marker locations/radii/colors, score isolation and planner decisions are unchanged (strategy version string updated). This restores visible red pixels, never invents hidden red markers.

Reproduce: `node scripts/make-grow10-fixture.mjs`; serve generated browser-fixture.html only through managed local preview; Download results. The harness uses the exact original/fixed four-version minimap draw snippets, production readImage/components/detectMinimap/growMarkers/planGrow/move/key functions and actual KeyboardEvents. Main scene is a synthetic named pink circle, not natural gameplay. No fixture hooks added to deployed page.

Chrome 156 Linux, 120 cases = 4 versions x 3 canvas configurations x 2 draw orders x 5 marker/frame conditions. Configurations: 800x600 DPR1; 384x467 DPR1 and DPR3, CSS-sized Canvas (not native Safari/device emulation). First cold run max readImage 190.4ms; final run 100.7ms, not an upper bound or full-tick guarantee. All dispatched keys match decisions. Additional no-main-candidate, missing-name, wall and release controls pass. Existing 23 planner cases and 4 isolated game/5 selector entries regression retained.

Exact desktop v2.13 reproduction: camera enabled red count0 -> E; camera disabled or red moved 2 map pixels outside frame count1 -> NE. Fixed camera red count1 -> NE. True no-red -> E, rear red -> E. Same across four versions. Mobile DPR1 corner signal recovered. Mobile DPR3 corner signal visible but outside the existing ±30° plus one-pixel sector remains E; moving red2 pixels outside produces NE. Do not present all corners as same-direction red. Player/red overlap, tiny fragments and unseen red can remain uncertain. Forward-red gate is deliberately unchanged.

With red and no reliable main object, no avoidance is synthesized. The main name requirement can still reject unlabeled objects; this round documents that separate limitation rather than broadening obstacle policy. Green player stays last and may cover truly overlapping dots. No-red rule knowingly permits potentially lethal contacts.

No natural starts or completed games; no win rate. No GitHub push. Other route response parity checked against rollback commit, including official OCR, sitemap, robots, verification and API versions. No leaderboard or database calls from isolated game.
