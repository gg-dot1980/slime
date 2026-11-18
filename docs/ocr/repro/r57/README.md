# r57 positive-clearance moving alternatives

Single hypothesis and frozen A→B batch in plan.json. A=public test043 with bounded telemetry, B=same strategy plus wall-stalled movement override. B only triggers if original chosen direction wall-clamped last1s progress<=6.667px; alternative must move and retain clearance>3px in both wall models. This allows a margin/progress tradeoff, not guaranteed safety. All-unsafe/no qualifying alternative remains original.

Important: r56 counterexamples were based on an offline candidate, not public test043. Public baseline does not stall in all those states. Fixed1298original inputs had15triggers and1change;415conditional inputs2triggers/1change separately. Namedr46-376 unchanged; r46-382 original east not stalled. This limits coverage.

Actual fixed desktop v2.20 A→B, Chrome156 Linux, CSS/canvas2000x1163,DPR1, normal unpaired random starts,<=150HUDseconds/210wallseconds/3consecutive stale/800rows. A:death96s,size104,483decisions. B:death90s,size81,458decisions,0trigger/0override. Total2starts,0wins,2deaths,0aborts,0timeouts. No rejected decisions or missed image records. Images21/20 retained locally only, stripped from GitHub JSON. Keys released. Compute medians18.1/17.7ms,max120.7/94.7ms; not a controlled performance benchmark.

No evidence of strategy effect because B never intervened. Do not expand identical batch or infer causality/winrate from two unpaired games. Public /ocr-test remains test043; no OCR4. Other desktop versions untested this batch,mobile skipped. Original<=150s,>=50%each version acceptance remains unmet. Next analyze newly saved B decisions for coverage gap/earlier bottleneck; do not merely lower progress threshold to force activation.

## Reproduction
Node24.22.1,Python3.12.14,no npm. Extract into a clean directory;run from root:
```
python r57/build.py
node r57/replay.cjs
python portable-r46-r50/prepare.py --output /absolute/preview/dist
cp r57/A.html r57/B.html r57/A-record.js r57/B-record.js /absolute/preview/dist/
```
Use supported static hosting for dist. Open A.html thenB.html,one trial each through Start single fixed trial,save outputs. Bundledv2.20 game and version endpoint included. Do not replay same random result: seeds,original browser binary and exact runtime scheduling unavailable. Frozen offline numerical results are reproducible;75PNG fixtures intentionally excluded. Raw-image hashes identify local-only evidence, not image files supplied on GitHub.

Includes full harness/controller/source/build scripts,portable game snapshot,frozen inputs,offline outputs,numerical live outputs and environment metadata in summary.json. Archive scan excludes data:image and image files. Clean extraction verified regenerated A/B/controller and offline result bytes. No Library upload. Preview stopped after both results saved.

[Download r57-repro.zip](./r57-repro.zip), SHA256 `b4b4669731d6a4cef1623e2773452f0098640d850f6c3857eaca622e5f7f6f5f`.
