# r62 — crowd formation and two-stage exit audit

Single fixed hypothesis: a currently eligible safe direction may preserve more safe follow-up directions than actual choice before all-unsafe. Diagnosticfirst0.2seconds followedby0.9seconds,8x8directions,originalvelocity smoothing0.35/0.1s,originalNPCgapformulaand>3threshold. Original eligiblepool retained,alternative musthave no lower original clearance and strictlymore validfollowups. Frozen NPCvelocity/radius,no futuregrowth; visiblewalls checked with player-radius allowance,unseenwallconstraints remainunknown. This is a diagnostic model,not physics truth or deployed policy.

## Fixed B and A comparison
B417rows,last15s72rows:22modelalternative states. Examples:14.903s beforeending north7followups/clearance57.66 vs south8/217.10;10.142s north6/135.87 vs southwest8/197.91;9.103s northwest5/74.17 vs southwest7/113.76. These do not demonstrate escape or actual path availability. Prior image76.326s shows surroundinglargeNPCs with open screen space;86.433s shows tighter enclosure;no synchronous image for each simulationstate.

B safe count drops to2 atrow380(~7.302s beforeending),thenfluctuates. First three consecutive <=2withinlast15s startrow396(4.072s) but onlyconfirmedat398(3.672s). Do not backdate an onlinewarning to396. At396/398/400 no alternative satisfies both morefollowups and nonlowerclearance. All-unsafe firstinthisterminalrun row403(2.671s). Endrow416allunsafe. The warning is late for this fixedrule.

A508rows,last15s67rows:21modelalternatives but no three-consecutive<=2warning. Rows506/507 only397/197ms beforeending still7/6originalsafedirections. Thus A death is counterexample to using narrowed directioncount as a generaldeathwarning. No radius/velocitythreshold tunedtoforcepass. Not evidence that A physically had6safe exits;the model missed something or the recordedstate/model assumptions were insufficient.

Totalalternative statesB88/A132 acrossentiregames;not all are dangerous orbeneficial. Modelcoverage is not winrate. Fullper-direction paths/gaps/wallchecks retained inresult.json. No new controller orlivecomparison justified yet. Newstarts/wins/deaths/aborts0. Existingr60 A100sdeath/B77sdeath unchanged. Desktop150s/50%eachversiongoal unmet;mobile skipped. NoOCR4/publicstrategy/Libraryupload;previewnotstarted.

## Reproduce
Complete r61/r60 source,game/harness,numericalinputs andresults included withoutimages. Node24.22.1,Python3.12.14,Linuxcloud. Fromarchive root:
```
node r62/analyze.cjs
```
Cleanempty-directory result.json andinstrumented.js byte-identical. No third-party dependency. No livegame rerun orrandomtrajectory reproduction claim. Imageinspection relieson locallyretained originals excludedfromGitHubbyuserrequest. NextinspectAdeath geometry with availableimages before claiming branchcounts as safety;preserveBearlyexit hypotheses as model-only.
