# r66 — visible boundary transition versus camera translation

Fixed local evidence: r65 final12same-source1200x698frames312–323 plus2000x1163terminalPNG. No new game or browser. Pixel measurements use native-resolution PNGs (no resampling), normalized to1200x698 coordinates. Fixed pink predicate R>G+15,B>G+8,R>B+4,R>100; firstrow with>=2.5%imagewidth suchpixels excludes tinylabels. Wall predicate uses original detector color ranges and >=25%rowcoverage. Region color is NOT identity/true radius. Bottomcut makes offscreen extentunknown.

Across12decisionframes, pink top relative towall decreases304.5→180analysispx;11transition closing rates45.14–64.87px/s. Last→terminal91.2ms:wall moves-9.83px, pinktop444→170.45px, relativewall boundaryshift263.72px. Gridphase moves-4px modulo96; wholeperiodambiguity means this is not a reliable complete horizontal cameravelocity. Visible wall subtraction directly rejects pure verticalcamera translation as explanation for the large finalchange. It does not establish growth,spawn,ID,collisionattacker oravoidability. Prior observed change is smooth while terminalboundary materiallychanges. VisibleorangeNPC is no longer separately distinguishable interminal; engulfment/occlusion/growth are possibilities,not confirmed events.

Fixed sensitivity9color settings (R-G12/15/18,B-G5/8/11,remainingrulesfixed) keeps last→terminaltopshift within reported sensitivity.json range. This checksmeasurementrobustness, not independentnewobservations. Manualvisualchecks seq312,318,323 andterminal agree on wall/boundary arrangement. Sourcehashes for all13images inmeasurements.json; images staylocal.

## One safety hypothesis checked and rejected
Hypothesis: add one200msdecision-cycle distance at maxprior11boundaryclosing rate. Margin12.97px+fixed4pxmeasurementallowance fails tocover263.72px transition. Do not retune toforcecoverage or deploy this as safetyfix. This is a deterministic counterexample check; terminal was already visuallyseeninr65,so not blinded/independent holdout or a winrateclaim. Ordinaryvelocityextrapolation is insufficient for this event under thismeasurement; exactcause remainsunidentified.

Next actionable approach: use existing frame323 and earlier fixedframes to assess overlap/occlusion interaction among visibleNPC surfaces beforeterminal, with normal/successcounterexamples; do not requiretrueoffscreenradii or assume growth. If no earlierobservable differentiator survivescounterexamples, state thatlatency-window event cannot be predicted fromcurrentobservations rather than wideningallradii. No newstrategy justified now.

## Reproduce
Complete r65 source/game/harness andnumericresults: pinnedcommit0fa022ce20daacbef130816a22248f9d946bbc16,docs/ocr/repro/r65/r65-repro.zip SHA2562091bd43d7aa2fee91a678b0cdfcbd3fae7ae01fcd5cba2230e73701cde620ec. Add this directory asr66. Python3.12.14,Pillow13.0.0,numpy2.3.5. No newdependencyinstallation performed.
```
python r66/check.py
```
Uses storednumericalmeasurements only,stdlib; cleanempty-directory outputexact. Forimage-based measurement with localr65/live-raw-local.json:
```
python r66/measure.py
python r66/sensitivity.py
```
NoimageGitHub reproductioncannot independentlyrecheck segmentation; localrawimages required. Code/settings/results/hashes preserved; no images,pixels,orLibraryupload. Measurementrule not controllerinput or deployedpatch. No RNG/hiddenstate supplied.

Newstarts/wins/deaths/aborts0; priorr65 remains1death62s,size93. Desktop eachversion150s/50% goalunmet; mobileskipped. test-043unchanged, noOCR4release;previewstopped.
