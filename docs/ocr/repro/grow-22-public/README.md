# Grow22 — visible NPC pair growth envelope

Self-contained `ocr-grow22.html`, directly based on Grow20. It embeds the isolated v2.13/v2.22 games and reads rendered canvas pixels and visible HUD only. No Grow21 scout memory is included.

On v2.22 below size186, a pair of visible, reliable, geometrically accepted and unclipped NPCs can trigger a conservative one-meal size envelope when their estimated motion may bring them into eating contact within0.6s. The new upper radius is applied before both edible-target and hazard classification. This may prevent approaching an NPC that becomes lethal after eating another NPC, but false-positive avoidance can slow growth. No chain eating is assumed.

Validation: 15 fixed numerical cases / 53 assertions passed, including a preserved false-positive tradeoff. Control regression 18/18 and harness regression 25/25 passed.

## Fixed natural-game results

The eight-game screen and the subsequent 24 fresh confirmation games are complete, with 32 starts and 32 final results. Success requires a visible win settlement within 150 game seconds. Each version passed the screen gate with four native outcomes and at least two wins; screen and confirmation are reported separately.

| Phase | Game | Wins within 150 s | Deadline | Death | Controller abort | Other failures |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Screen | v2.13 | 2/4 | 2 | 0 | 0 | 0 |
| Screen | v2.22 | 3/4 | 0 | 1 | 0 | 0 |
| Confirmation | v2.13 | 5/12 | 5 | 2 | 0 | 0 |
| Confirmation | v2.22 | 1/12 | 4 | 7 | 0 | 0 |

The predeclared confirmation sample target of at least 6/12 wins in both versions was not met. These are fixed natural cohorts with uncontrolled randomness, not a causal comparison or formal OCR4 acceptance. All starts, deaths, deadline failures and aborts remain in their original phase/version denominators, without replacements. All 32 finals recorded released controls. Grow21 remains an unactivated prototype with 0 natural games. Grow23 starts a separate fixed screen after this completed Grow22 confirmation; none of its games is included here.

Confirmation uncertainty: v2.13 5/12 (41.7%; Wilson 95% interval 19.3%–68.0%); v2.22 1/12 (8.3%; Wilson 95% interval 1.5%–35.4%). These intervals describe the small cohorts and do not establish a true success rate of at least 50%.

## Recorded timing and recovery

There were 39,819 completed decisions. Their maximum decision age was 186.5 ms; the maximum across all 39,820 recorded computations, including the discarded one, was 219.6 ms.

| Recorded timing | Maximum (ms) |
| --- | ---: |
| Completed decision age, all completed decisions | 186.5 |
| Computation age, completed plus discarded overruns | 219.6 |
| Tick total, recorded samples plus overruns | 220.5 |
| Setup, recorded samples plus overruns | 10.8 |
| Image reading, recorded samples plus overruns | 206.7 |
| Planner/diagnostic cloning, recorded samples plus overruns | 37.6 |
| Record/render stage, recorded samples plus overruns | 30.5 |

One 219.6 ms decision was discarded before movement; held keys were released, a fresh observation was scheduled after 100 ms, and a 16.4 ms fresh decision was then applied. Its image-reading phase was 206.7 ms and tick total was 220.5 ms. There was one recovery attempt, one successful recovery and no hard-overrun abort. Therefore, it would be incorrect to describe all computations as within 200 ms.

Tick/phase figures cover approximately 1 Hz accepted samples plus every explicit overrun, not every tick. Observer recording/transport work is excluded from those timing fields. Phase maxima may come from different observations and must not be summed. No new test or natural game was run to prepare this summary.

This public snapshot contains executable source and this summary, with no recorded image, replay, raw runtime telemetry, credentials or private project identifiers. It does not publish the private full diagnostic log. Open the HTML in a foreground desktop browser and use the visible Start control; hidden background tabs can throttle the game.

Source SHA256: `f19b4d21ca3b7ef12ff3603e0e52a017be3aeafcf7004b39bfaa338fa95ac1b2`
Planner SHA256: `a979160e6b479c1f4969b67f354aa887498f19f7e7430165bbcc5e556084d30b`
