# r85 — danger-label threshold and saved-pixel audit

0newgames/wins/deaths/aborts; no controller/publicstrategy/OCR4 change. Preview stopped; mobile skipped; desktop per-version150s/>=50% unchanged. Images remain local, no Library upload.

## Source versus deployment
Currentmain commit15f077ff9b96bf98b45860ca6ad0cbfe9e7a30e9 verified withfourpinnedsourcefiles. v2.13/20/21/22 allshowdangertext onlyifNPC>player*1.10; collisiondeath ifNPC>=player*1.08 understrictcontactdistance<.72sum. Ratios1.08,1.09,1.10are explicit no-label/lethal-contact counterexamples. Sixrandomnamesnotunique andnotradius; priorr84findings unchanged. Fourfiles exactlyequal previouslycheckedtestbranchsources; localr80v2.20game snapshot exactlyequalscurrentmainfile. This establishes the codeused inrecordedtests,not currentdeployment.

Actualdeploymentcheck: web.open https://slime.gameson.cc/ returnedtoolInternalError/URLnotaccessible. No rendereddeployment source/version retrieved. Statusunverified,notdeniedauthorization,andnotclaimedsiteoutage or botblock. No browser/network bypass attempted. GitHubmain alone cannot establish hosting deploymenthash.

## Fixed visual-label regression
Useall12r80Bseq301–312verifiedRGBAframes, fourpreidentifiedvisibletracks perframe: upperrightgreenwithdangertext, clippedgiantwithdangertext, purpleand ochrewithouttext. Manualvisualannotations fromr81,notindependenthumantruth orcollisionradii. Original hasDangerLabel function replayedunchanged withrecordedcomponentcenter/visualradius,scale.6.45/45availableobjectdecisions reproduce recordedisRed exactly.3greenframeslackcorrespondingretainedobject/provenance,unknown ratherthan fabricated labeldecision.

Visiblepositives:green9/9missed(+3unknown),giant12/12missed. Negativecontrols purple12+ochre12:0falsepositives. PositiveROIs haveonly0–1pixels passingoriginalpinkpredicate vsrequired3. This identifies insufficientmatchingpixelsinexistingsearchROI,not independently whetherlocation,antialiasing,scaling orpredicate causes it. No thresholdrelaxation on thisonescene.21/21missedlabelobjects still qualifyasthreats bysize/clipping,so thisdoesnotprove omittedcollisionavoidance or identifykiller. First3greenobjectmissing remainsseparateperceptionquestion.

Names/repeatedlabels cannot associate warningtooneuniqueNPC; text maybeoutsideframeoroccluded; clippedROIbasedonestimatedcenter/radius isuncertain. Captureintervals199.6–527.9ms andlast219.3msgap retainedfromr81; no-labelobservation canbestale. Nativefuturelabelpositive shouldbe additive evidenceonly, never requireabsence toauthorizeeating. Reliablepositive beforebodycalibrationcouldhelp, butthisbatchdemonstrates noincrementaldecisionbenefit.

## Reproduction / next
`node r85/audit.cjs` needslocal seq-local.rgba(omittedfromGitHub); checks12pixelhashes andoriginaldetectoroutputs. `python r85/replay.py` repeats45numericchecks withoutimages; `python r85/source-check.py` checksfourpinnedsourcesandthresholdcounterexamples. Fullr80controller/game/harness plusr83rules retainedinarchive; command/environment notes there. Node24.22.1/Python3.12.14/Pillow13.0.0; samehostclean-directorynumericcheck,notnewBrowserexperiment.

Before anylabelcandidate, comparefixedpositive/negativeROIs atoriginalresolutionandanalysisresolution wherebothare available; separatelytestROIcoverage andpixelpredicate, preserveclipped/repeated/occludedcounterexamples andindependentgames. Do not merelylower3pixelgate onthisset. Deploymenthash verification remainsblockedbywebaccess; no newgame required forthissourceaudit. Continueboundedstandoff/multiframehypothesis withlabelsasoptionalwarning,nottrue-radiusoruniqueID.
