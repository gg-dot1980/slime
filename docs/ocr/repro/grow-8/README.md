# grow-8: opening pursuit and bounded contact/exit screen

Frozen grow-7 Sites180/source c717ccca49e95c4cc6f8f4075f8586ced9632e6a. User later authorized immediate Sites publication and removed size90 gate. A remains unchanged; no GitHub push this round.

B uses visible minimap from opening size25 onward. Small clamped dots are NOT classified near-sized solely from equal pixels. Existing core-area near-size exception retained. At player130 NPC118 and143 both clamp to radius3 white; no size guarantee or inferred edible truth. Game physics, seed/random generation, no-score isolation and other routes unchanged.

One new screen: for each white pursuit target, eight fixed-heading approaches up to4s, with the same .1s step and .35 velocity response, check hypothetical contact followed by eight1s exit headings. Retain existing threat padding and wall floor min(observed wall,260+.75*r). Require every sampled gap>3 and an exit that increases target distance by r/2. Known walls constrain paths; missing walls produce unknown rather than proven safety. Beyond-horizon targets remain unknown. Only blocked targets lose pursuit utility; rerun unchanged grow-7 scorer on remaining markers. If no alternative satisfies current wall/clearance gates retain original emergency action; original no-target planner may keep heading. This does not guarantee escape, future NPC motion, actual swallowing or radius growth. No interception, locks, or score weight changes. Most frame evidence may remain unknown.

Telemetry correction: best approach target replaces earlier target when a better approach is found. This corrects reporting, not scoring. Reversed white input order tested for direction and reported target across all10 scenarios (equal-utility ties outside these fixtures remain unproven).

Commands:
```
node scripts/check-grow-exit.cjs
node scripts/check-grow8-controls.cjs
node scripts/build.mjs
node scripts/check-grow-versions.mjs c717ccca49e95c4cc6f8f4075f8586ced9632e6a
```
10 authored geometry scenarios,2 direction changes: blocked east target to northern alternative. Open, wall-with-exit, red-bypass, low-confidence, near-small, emergency and near-size controls unchanged. Explicit enclosed no-exit check passes. All-blocked fallback retains original direction (not claimed successful retreat). Initial fixture had nearer northern alternative already chosen by baseline: kept as a failed test-design observation, changed only target distance to compare an actually selected blocked target; not evidence of improvement.

20 pixel/control regressions pass, including small near-green dots, green overlap, red, wall, lost map, A function equality and size89/90/130; added minimum-radius white at25 pursues. Browser synthetic Canvas snippets from four original game versions, HUD25/89/90/130 x white/red =32 cases; actual KeyboardEvent dispatch and lost-map keyup verified. Chrome156 Linux maximum observed tick9.1ms, not full-game cost. Controlled adapter supplies pixel-derived minimap and hostile synthetic main-body hypotheses; no fixture hooks in public build. v2.13 saturation118/143 at player130 pixel equality separately checked.

17 other route response status/headers/body unchanged, including all formal OCR, sitemap,robots,verification. Five selector/switch cases and four isolation copies checked. v2.13 remains default.

Completed natural games0; wins0,deaths0,timeouts0; v2.13/v2.20/v2.21/v2.22 full-game batches NOT RUN, no seed or completion-time claims. Per latest direct-publication instruction, release after scoped regression without waiting for complete games. No private replay used. No win-rate/acceptance claim. Model/effort not exposed. The prior grow-7 pending patch is unchanged. Next useful validation: fixed-seed full games with actual exitScreen coverage, separating unknown geometry from blocked events.
