# r84 — visible NPC names as a supplementary tracking cue

0newgames/wins/deaths/aborts. No controller/publicstrategy/OCR4 change. Preview remains stopped; mobile skipped. Desktop per-version150s/>=50% requirement unchanged.

## Source and uncertainty
Verified pinnedGitHubsourcev2.13/20/21/22 at5a1aca6442194b6348ed5554eb65f827026811c3,not a new deployedsiteaudit. AllNPCnames selectedrandomly fromsix names 泡泡/啵啵/果凍/QQ/藍莓/小橘,independent ofradius. Rendering emitsnameanddangerlabel only,noNPCsize number. Fontclamp10–13CSSpx saturates forradius>=40.625; atcurrent0.6analysisdownscale lettersare6–7.8pixels. Fontsize/namewidthcannot supply reliable largeNPCsize. Repeatednames areallowed; r80terminal visiblyhas two green小橘bodies. Namescannotbe uniqueIDs or prove continuity throughsplit/occlusion.

CurrenthasSlimeLabel onlycountsbrightpixels,nottextrecognition. LocalTesseract haseng/osd only,no Chinese model; no toolinstalled. Used an explicitlylimited saved-glyph template prototype,not generalOCR or hiddenname reads. Labels assigned byassistant visualreview ofexistingimages,not independenthuman truth. Templatepixels neverexported.

## Fixed comparison
Predeclared developmentr80B304three labels, heldout305–312same3tracks (24correlated cases), independent-in-time unknown-namecontrolsB25QQ/果凍(2cases,not independentgame). Crops41x15around recordedvisiblecomponent centers; originalbrightpredicate; bboxnormalize32x16; Dice>=.75 andmargin>=.10 elseunknown. Thresholdsnotretuned.

Heldout5correct/0wrongaccepted/19unknown;coverage5/24=20.8%. Two unseenlabels bothunknown. Thisdoesnotestablish generalaccuracy or5/5futureprecision. Originalsavedgeometrytracker matches24/24manualpreviousvisibletracks inthiseasyset; nameprototypeadds0correctedassociations. Hardcrossing/repeated-name/occlusioncases unavailable for accuracyvalidation. No basis to replacegeometry,forceunknownnames,orclaim pursuit recognition improved.

Cached-imagePython/Pillow/numpy extraction+3templatecomparison median0.1584ms,max0.3185ms perROI; excludes imageacquisition,decode,detector,templatecollectionandBrowseroverhead. A UIliveperformanceclaim would be false. Differentfonts/languages/DPRscales and sparsepixels remain unknown.

## Reproduce / next bounded step
`python r84/replay.py` rechecks all26savednumericalclassification decisions withoutimages. `python r84/source-check.py` checksfourpinnedsources. `python r84/track-check.py` usesbundledr80numericmatchesandannotations toverify24associations. `python r84/name-test.py` needs localr81PNGimages andr80BfirstcorrectionPNG; images/templatesexcludedfromGitHub, so fullpixeltestnotreproduciblefromthisarchivealone. Alloriginalcontroller/game/recorders remain inincludedr80source; r83rulesincluded. Node24.22.1/Python3.12.14/Pillow13.0.0/numpy2.3.5; timinghost55a6111fa095.

Next integrate name onlyas optionalagreement/veto when readable, neversoleidentity: combine spatialmotion withcamera correction, bodycolor/shape andname; same-name collision remainsunknown. Needfixed independent ambiguouscrossing/occlusionandduplicate-name scenes before claiming associationgain. Preserve19unknownand2unseennegativecases. Userstandofforbit remainsseparate boundedhypothesis: multipleviews could helpreading,not proven here. Do not open unchangedgame just to improve thisbenchmark or blindlylowerconfidence. No newcontrolcandidate fromthese results.
