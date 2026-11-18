# r56: dual-model dominance for stalled selections

Offline hypothesis only, public test-043 unchanged. See plan.json for frozen trigger and acceptance rules. No fitted parameters. Fixed1298original states plus415conditional states separately; models use saved r55 Candidate.js and original frozen numerical inputs.

Rule: when wall-stalled(last1s displacement<=6.667px) or all-unsafe models disagree, select an alternative only if clearance in BOTH wall models is no worse and progress increases by>6.667px. Otherwise retain old output and mark unresolved. This is model dominance, not a true safety guarantee.

Results:40original triggers,3changes,37unresolved. r46:28triggers/2changes; r50:12/1;r14 and75controls no triggers. Conditional:11triggers/1change, separate. Changes r46-340/341 and r50-392 improve modeled progress from0.463/0.006/0.055px to228.177/227.721/223.400px. No claim of real growth or survival.

Named counterexamples remain unresolved, so the hypothesis is rejected as a solution to the named bottleneck; no live test. r46-376: no alternative dominates both models; north improves center clearance but worsens radius clearance and loses progress. r46-382: northeast has sustained progress227.23px and positive modeled clearances12.48/80.86 but lowers them from72.58/99.69. The actual issue is a risk/progress tradeoff, not absence of ANY model-positive moving direction. Do not equate no dominating option with no physically feasible escape. Next bounded proposal should explicitly evaluate that tradeoff against observed next-step movement and threat evidence, not repeat dominance filtering or claim zero-risk safety.

## Reproduce
Extract ZIP into an empty directory; from its root:
```
node r56/run.cjs
```
Node24.22.1, no npm dependencies. Includes r55/Candidate.js, r55/inputs.json, r56 code/config/results and SHA256 manifest. Clean temporary extraction regenerated result.json byte-identically. Pure numerical planner replay only; no browser/pixel regression or random game replay. No image files or data:image records included. Historical images stay local. Current Linux cloud host55a6111fa095; same original recorded input versions as r55. Random seed irrelevant for this deterministic replay; historical game seeds/browser binaries unavailable.

New starts0,wins0,deaths0,aborts0. Desktop<=150seconds and>=50%each version acceptance unchanged; mobile skipped;preview stopped; no OCR4/test deployment or Library upload. Future records retain code/config/scripts/numerical outputs/env/commands/hashes/limitations, excluding image records.

[Download r56-repro.zip](./r56-repro.zip), SHA256 `0c07c5484fa347f6d5934da99487b49e18c153979da21391121ff24913835cc9`.
