# r60 — temporal food-target confirmation

Fixed r57 B analysis:rows257/259/261/263/265 retain nearby west-food detections after camera compensation (residuals0.2–35.7px depending camera model). East-target disappearance at258/260/262/264 has nearest compatible residual244–288px under either model; camera-estimate difference5.9–18.2px cannot explain it alone. This is detection continuity,not physical identity truth. Source matching category and radius preserved. No color or true IDs available. Periodic images roughly5s apart cannot resolve those individual decisions. Local image51.218s shows player beside a largeNPC,not exact52.582s evidence. Occlusion/consumption/contourfragment unresolved. HUD62 unchanged52.381–54.185s; cannot attribute counterfactual gain to actual eating.

Geometric hypothesis(food contact disk fully inside visible nonclipped threat unsafe disk)false for every focused food target. No such filter added.

Candidate: require a food target to have a preceding compatible detection under BOTH existing camera estimates; use existing100px association bound and max(6,r*.2)radius tolerance. Only when >=3 measured food shifts,dt<=.4,and previous observation timestamp exactlymatches. Missing/uncertain context retains baseline. NPCtarget eligibility,allobjects,threat model,predictedpathgain,safe/boundedpool andall-unsafe fallback unchanged. This is an exploration policy,not classifier truth or proof of safety.

Frozen r57 replay: A436/483contexts,24directionchanges;B406/458,12changes; focusB257/259/261changed. Noall-unsafe changes ornewmodel-unsafechoice, butmaxmodeledmarginlossA92.54px/B23.09px preserved. Non-context regression2654observations unchanged. One fixed A then B v2.20 desktop trial each;150HUDseconds/210wallseconds/3stale/800rows,unpaired random seedsunknown,no replacement. Formalper-version150s/50%acceptance unchanged,mobileskipped.

## Reproduce
Python3.12.14,Node24.22.1,Linux cloud;no third-party dependencies. Extract archive toemptydirectory,fromroot:
```
python r60/analyze.py
node r60/replay.cjs
python r60/build.py
node r60/check.cjs
```
Source includes original controller, completegame/harness assets in portable-r46-r50, fixed numericalinputs/results. Browser boot: run portable-r46-r50/prepare.py --output ABS_PREVIEW/dist,copy r60/r60-*.html andr60/r60-*-record.js intodist,use supportedSites previewthenopenr60-A.html followedbyr60-B.html. OneStartsinglefixedtrial each,saveeachoutput. No random trajectory reproduction promised. Image records excluded;localrawhashevidence in live-summary.json. Publictest043 unchanged;noOCR4 orLibraryupload.

## Fixed live results
A death100s,size104,508decisions,1rejecteddecision,22images,0missing;B death77s,size79,417decisions,2rejecteddecisions,19images,0missing. Bothkeysreleased. Noaborts. B context323/417,unconfirmedfood273/417;only4directions differ from frozen baseline. Live replay A508/508 andB417/417 direction/clearance exact. This is frozen counterfactual coverage,not alternate game trajectory. Bwall89.008s vssettlement77s;Awall104.025s vs100s retained,not interchanged. Compute medianA17.5ms/B21.1ms,accepted maxima156.6/200.7ms;rejected preserved separately. Unpaired two-game sample does not establish benefit or harm;0wins/2deaths,notacceptance. Do not expand unchanged candidate. Next inspect B4 changed decisions and death with availableimages;do not infer details in5simage gaps. Previewstopped,no publicstrategy/OCR4deployment.
