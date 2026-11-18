# r61 — four interventions and terminal timing audit

No policy change or new game. Existing r60 B v2.20 desktop Chrome156 Linux,2000x1163,DPR1. Python3.12.14,Node24.22.1. All numerical source rows and original controller/harness retained in archive; images excluded.

## Fixed evidence
Rows186/243/245/356 are the four candidate-vs-baseline direction changes. To ending:47.675/36.099/35.682/12.390seconds. Prior image gaps0.626/2.101/2.518/0.618seconds; following gaps4.474/2.911/2.494/4.389seconds. HUD gain after1s:0/0/0/0;after3s:1/2/2/0. Rows243/245 windows overlap and are not independent. Growth cannot be attributed to the intervention or a particular target. Images41.033,51.134,56.146,76.326seconds visually checked:real food and large threats present, but no exact intervention frame to validate the excluded target. No label of false target or successful consumption is justified.

Last preterminal image86.433seconds shows multiple largeNPCs surrounding player. Terminal89.334seconds shows overlapping bodies; exact attacker and contact onset remainunknown. Existing detections contain largeNPCs; this is not evidence of complete threat omission. Coordinate/radius estimates may still be wrong.

## Single hypothesis and result
Tested whether terminal failure is primarily stale computation/held obsolete control. Final5s:25accepted rows,0rejected,median capture spacing199.9ms,max203.6ms,capture-to-record max39ms;last capture70.8ms before terminal sample.13rows all-unsafe,first2.671s before ending.0candidate direction changes in final5s;all match baseline on those frozen observations. Prior2rejections occurred78.434/74.821s before ending. Thus persistent terminal stale-compute blockage is not supported. This does not measure physical key effectiveness or exclude the ordinary200ms control period as a contributingfactor.

Key event timestamps included in result.json. recordAt follows dispatch,not a measurement of game physics. Terminal sample timing is not exact collision time. Baseline on frozen observations is not an alternate trajectory; earlier candidate actions could affect the later state. Do not infer causal harmlessness or harm.

No supported policy candidate from this hypothesis,so no additional live comparison. Original r60 result remains A100sdeath,size104;B77sdeath,size79,0/2wins,not acceptance. Desktop<=150s/>=50%each specified version unchanged;mobile skipped. No publicteststrategy orOCR4deployment;no Libraryupload;preview remainsstopped.

## Reproduce
Extract archive into emptydirectory;run:
```
python r61/analyze.py
```
Uses r60/B-results-noimages.json andr60/live-check.json from included complete r60repro package. Output result.json deterministic;clean-directory replay checked. Image review cannot be independently repeated from GitHub because user excludes image records;raw B hash f455eeb7511cca87b7591be28f0d9d32df2c571268048efe9f82a2172d13ee61 identifies local original. No exact random-game replay claimed. Earlier r60 commands remain documented and source included.

Next: audit early crowd geometry/escape trajectory on existing observations before all-unsafe; preserve radius/visibility uncertainty. Do not reopen same food-confirmation or latency experiment without new evidence.
