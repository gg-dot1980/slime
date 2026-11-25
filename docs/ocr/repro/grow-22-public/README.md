# Grow22 — visible NPC pair growth envelope

Self-contained `ocr-grow22.html`, directly based on Grow20. It embeds the isolated v2.13/v2.22 games and reads rendered canvas pixels and visible HUD only. No Grow21 scout memory is included.

On v2.22 below size186, a pair of visible, reliable, geometrically accepted and unclipped NPCs can trigger a conservative one-meal size envelope when their estimated motion may bring them into eating contact within0.6s. The new upper radius is applied before both edible-target and hazard classification. This may prevent approaching an NPC that becomes lethal after eating another NPC, but false-positive avoidance can slow growth. No chain eating is assumed.

Validation:15 fixed numerical cases /53 assertions passed, including a preserved false-positive tradeoff. Control regression18/18 and harness regression25/25 passed. The fixed eight-game natural screen is complete: v2.13 2/4 wins (2 deadline failures), v2.22 3/4 wins (1 death). All8 starts have native finals; all controls released;9,584 completed decisions, maximum179.5ms, no overrun. The screen gate passed, and the predeclared fresh12-game confirmation per version is now in progress. No confirmation result or causal win-rate improvement is claimed. Only both versions having four native outcomes and at least2/4 wins permits a fresh12-game confirmation per version. All starts, deaths, deadline failures and aborts remain in their respective denominators, without replacements.

This public snapshot contains executable source and this summary, with no recorded image, replay, runtime telemetry, credentials or private project identifiers. It does not publish the private full diagnostic log. Open the HTML in a foreground desktop browser and use the visible Start control; hidden background tabs can throttle the game.

Source SHA256: `f19b4d21ca3b7ef12ff3603e0e52a017be3aeafcf7004b39bfaa338fa95ac1b2`
Planner SHA256: `a979160e6b479c1f4969b67f354aa887498f19f7e7430165bbcc5e556084d30b`
