# r58: bounded reversal-hysteresis hypothesis rejected

One hypothesis and one frozen threshold: retain prior eligible direction for one decision when an immediate >120 degree reversal scores at most1.8 higher (nominal food gain .45*4). Original safe/bounded pool and all-unsafe fallback preserved. This is not a safety guarantee.

Observed r57 A/B deaths96/90 seconds unchanged historical results. B last~15seconds size81->81,27 reversals in75-90wallseconds; A reversals coexist with growth. Local image checks show multiple large NPCs near B at~76seconds and A prey plus walls near~96seconds. Five-second images cannot establish every reversal or exact fatal mechanism. HUD settlement time and browser wall clock differ; not interchangeable.

Fixed numerical replay:1298 historical originals,415 conditional observations separately,and941 r57 rows. r57 A69 reversals/2 changes;B77/1. Only3/146 reversals changed; Bchanged339 before final stall, no final-stall coverage. Historical originals4changes; conditional1separate; fixed75zero. No changes select clearance<=3 or all-unsafe fallback, but r14-191 loses40.62px modeled clearance, remains103.06px. Positive model clearance is not real safety. Hypothesis rejected as covering the observed bottleneck. No threshold relaxation or live batch. Newgames0,wins0,deaths0,aborts0. Desktop150s/50%per-version goal unmet;mobile skipped.

## Reproduce
Extract archive into empty directory. Python3.12.14 andNode24.22.1,no third-party packages:
```
python r58/build.py
node r58/replay.cjs
```
Build contains complete baseline source, standalone candidate, A/B pages and recorder. replay.cjs reads immutable numerical inputs.json; no image or hidden audit truth. Source raw hashes in summary identify locally retained image evidence, not uploaded. Same-directory generated source and numerical replay must match manifest hashes. Browser/game was not run for this rejected candidate; no random seeds or trajectory reproduction promised. Existing publictest043 unchanged; noOCR4/Libraryupload. Inputs are frozen recorded observations, not independent games.

Next: decompose score jumps between reversal pairs (alignment,contact gain,risk,wall), with actual target identity uncertainty preserved. Do not force coverage by increasing hysteresis threshold.
