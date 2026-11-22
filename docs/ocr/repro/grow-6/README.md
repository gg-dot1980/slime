# grow-6: retain resolved close white minimap markers

Base GitHub54771b595069550caf11c7c962683de3ffae4979 / Sites source e49021e775d639490ba6fe81afec31864b9b9882, v178. Only /ocr-grow B>=90 changes. No private inputs. Cloud Linux Node24.22.3 / Chrome156.

Reproduced authored RGBA800x600 fixture: map144 wide at641,70; background32,50,56; green r3 at711,120; white r2 at717,120 versus718,120. HUD96, speed180, zero velocity, previous west. Grow-5: gap7 => target/east; gap6 => no target/west. Grow-6: both => target/east. Same result for pixel scales1/2/3. This is a proven code defect, not proof of the user's unseen live frame.

Removed the white-only blanket6px center exclusion. Existing expanded mixed-color box still rejects green contact/overlap, player color, camera strokes, bounds and malformed components. Red detector behavior unchanged. Main-body fragments cannot reintroduce avoidance; walls/red and lost-map release remain. A/below90/defaultv2.13/game physics/no-score routes unchanged. No weighting change: restored target already outweighs old heading in fixed close fixtures; food ranking retained rather than an unrelated policy change.

Decision metadata reports eligibleDots and reason: missing-map, wall (boundary recovery), red-path (red threats present; not causal proof of an override), white-pursuit, no-eligible-dot. No eligible dot and continued heading must not be described as NPC avoidance. Details expose these contexts; not a safety guarantee.

Run in complete repo:
```
node scripts/check-grow-close-dot.cjs
node scripts/check-grow-map-authority.cjs
node scripts/check-ocr-grow.cjs
node scripts/build.mjs
```
19 close-marker cases;31 map-authority regressions;11 original planner cases passed. Includes true overlap, green, red, wall, map loss, A equality and sub90 equality. The map-authority harness runStrategy identifier was advanced to current B; no expectations relaxed. Local response comparison found17 other routes unchanged and5 selector/switch cases correct, including score isolation.

Browser fixture: four versions x scales1/2/3 x consecutive7→6=24 cases passed, real Canvas pixels and KeyboardEvent dispatch through tick/move; missing-map release passed. Fixture injects only hostile body hypotheses, not natural game state.390 CSS px content checks plausible narrow layout, simulated backing scales—not iPhone hardware or mobile acceptance. Temporary test route removed before packaging; browser-fixture.html is test code only, not served by public Worker.

Natural starts0; no success/death/win-rate claims. No proof of independent reviewer/CI or guaranteed swallowing. White may still be physically lethal. All public fixtures are authored code, no private imagery/pixel dumps/links. Historical handoff index not retried. Sites/GitHub publication recorded separately.
