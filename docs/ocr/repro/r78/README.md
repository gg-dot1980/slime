# r78 — early-death image audit and falsified highlight-gate fix

2026-11-18 Taiwan.0 new starts/wins/deaths/aborts. r77B remains death10s,size31,53accepted decisions,0candidate differences. No candidate attribution, no gameplay or preview this phase; no OCR4 release. Mobile skipped; all image pixels remain local, no Library upload.

## Observed versus unknown
Last12 same-source frames seq42–53 available. Seq53 captured11354.5ms,terminal11496.6ms:142.1ms gap. Visual inspection of seq53 and terminal shows upper large gray NPC, left large green NPC, right large cyan NPC, and a small green selected NPC beside player. Small target approaches from below-left to player-left; upper large NPC also approaches. Terminal shows player touching/overlapping the small target and near the upper surface. No exact collision-time image or hidden true identity/radius was read; **killer not confirmed**. Do not automatically select the largest visible NPC as cause.

Metadata seq45 targetr26.667/HUD30;seq46–53 targetr28.333/HUD31,non-red/nonclipped. Directions seq47–52NW,seq53SW; final modeled clearance52.07 is not measured safe separation. Captures match stored decisions. Renderer/collision source inspection supplies a hypothesis, not game state: draw radius is multiplied by per-NPC wobble0.8–1.15 plus small phase perturbations, while collision uses unscaled radius and.72 contact sum/1.08 predator ratio. Thus visible radius may differ from collision radius. Label danger threshold1.1 also differs from lethal1.08; absence of label alone cannot certify prey.

## One tested hypothesis
Perhaps skipping highlight calibration for componentradius<18analysis pixels causes the near-size target underestimate, and removing just that guard recovers a more reliable radius. Fixed12deathframes plus two separate saved scenes r74firstintervention/r72lastframe; no tuning after results.

PillowRGBA decoding of all12deathPNG byte arrays matches original recorded ImageDataSHA256 exactly. Pure original JS components/highlight functions run in Node on those bytes; this is NOT a new browser ImageData capture. Matching selected-target component center error0px in12/12. Seq45componentr16,seq46–53r17 trigger original small-radius bypass; divided by0.6 gives26.667/28.333worldpixels. Removing onlyp.r<18 changes **0/12** selected-target estimates. Independent two scenes contain6labelled components;0/6changed. No evidence this simple relaxation repairs radius classification; rejected, no strategy patch or new game.

Important limits: first3selectedtargets are food, not NPC, and the independent controls are not measured true-radius labels. Pixel equality proves faithful replay, not true-size accuracy or safety. The raw appearance/collision-radius discrepancy is still a plausible factor, not proven killer or rootcause. Do not lower prey thresholds blindly or relabel all small objects threats from this result.

## Reproduce
Node24.22.1,Python3.12.14,Pillow13.0.0 on55a6111fa095. Included Current.js/game-source.html are frozen original sources; no runtime hiddenstate used. `python r78/replay.py` verifies exported numerical audit and source metadata without image access. `python r78/pixels.py` and `node r78/pixel-check.cjs` require the local sourcePNG/RGBA files; images intentionally absent fromGitHub, so pixel execution cannot be reconstructed from this package alone. inputs.json retains12decisions/raw pixel hashes; independent.json records separate scene hashes; pixel-results.json/independent-results.json retain complete tested component numerics. B rawSHA c6f95ad90105da83c626cfc04d79c08d6bd0c48e10c8b3f33762bb8a83eebfaf. Full live harness remains r77commit4886debdc8401629d479db91bbbb53d3b964fb69.

## Next
Diagnose why the ungated small-target highlight estimator still falls back (pixel support, overlap/text or validation geometry), using these same fixed images and independent normal NPC controls; do not repeat unchanged gameplay. If original-size evidence is required, specify the exact missing measurement first. Preserve alternative upper-threat motion hypothesis and final142.1ms gap. No new strategy is supported yet; per-version desktop150s/>=50% acceptance unchanged.
