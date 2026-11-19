# Slime OCR 測試交接索引

## visible-approach-1 — 頁內像素回放，策略未採用

[逐版入口](repro/visible-approach-1/README.md) · [固定條件](repro/visible-approach-1/protocol.md) · [無影像結果](repro/visible-approach-1/summary-noimages.json)。24張解碼，12張完整決策圖作粗略像素核對、12張裁切圖僅解碼；8筆新篩選命中中5筆重疊／裁切未知，成功接觸對照也有1筆命中。沒有足夠身分連續與安全替代證據，未改策略。新增開局0、過關0、死亡0、中止0；不算實戰驗收。可重跑程式已保存，原圖依政策僅留本機，公開checkout無原圖不能復現像素結果。測試頁同步與正式驗收分流見[SPEC v1.1](SPEC.md)。本輪僅補此入口，未補其他歷史缺漏。


現行驗收與測試範圍見 [SPEC.md](SPEC.md)；存放與重現要求見 [GITHUB-STORAGE.md](GITHUB-STORAGE.md)。本分支為唯一權威交接索引，歷史條目不代表目前規格已通過。接手請指定 repo、branch 與 base commit。

適用 [GitHub 存放規則 v1](GITHUB-STORAGE.md)。以下為存放狀態更新，並非新增測試或驗收。

## 2026-11-19：r228 固定末段策略假設

- [r228 固定入口與獨立數值回放](repro/r228/README.md)：18 幀／3 個既有診斷局，0 新開局。負間距時有現成正間距出口的假設命中 0/18；未改控制器。
- 本次僅補 r228 的無像素靜態來源、輸入、結果及限制；r221–r227 完整控制器與影像不在本次同步範圍，舊缺漏仍保留。不是驗收或發布。

## 2026-11-19：r219／r220 離線包入口與已知缺漏

- [r219 固定入口](repro/r219/README.md) · [r220 固定入口](repro/r220/README.md)。
- [既有 ZIP（保留原位置）](../../evidence/offline-r219-r220/offline-r219-r220-review.zip)，加入於 commit [706de21](https://github.com/gg-dot1980/slime/commit/706de21d6a2ccb078a23277d4308b8ce1c31cec2)；9,579,597 bytes，Git blob `68e57f010cdae5fce089f9854b9a754a4431ba3b`。本次不重傳、不重新解壓或執行。
- 原索引與 repro 最新輪次為 r85；r86–r218、r221 以後的固定入口／材料本次未補，不宣稱已同步。r219/r220 只補可讀入口，完整重現仍有未驗證項，見各入口。
- r43/r44 原始資料不可得的既有限制保留；不由摘要重造原件。舊資料未逐版重驗 v1，舊連結保持有效。
- 本次文件存放更新不代表策略改善、正式站更新或 OCR4 達標。

---

## r85 — danger-label source gap and saved-pixel misses (2026-11-18 Taipei)

0newgames. Currentmain15f077f sources4versions equalpriorpinnedfiles;localr80v2.20 snapshotexactmain. AlllabelNPC>player*1.10 vsdeathNPC>=player*1.08;1.08/1.09/1.10nolabelcanlethal. Actualdeploymentunverified:webopenroot inaccessible/InternalError,notpolicydenial orprovenbotblock. No bypass.

12hashverifiedframes,48manualtracklabels:45availableobjectdetectorreplays exact;21visiblewarningmisses(9green+12clippedgiant),3greenmissingobjectunknown,24negativecontrols0falsepositive. ExistingROIs only0–1matchingpinkpixels vs3required;location/scaling/predicate rootnotisolated.21/21stillthreatsbysize/clipping,notprooflabelmisscauseddeath. Duplicate names and219.3mslastgap retained;absence never safetyproof. No thresholdtuning/controlcandidate.

[Source and audit details](repro/r85/README.md) · [Complete no-image reproduction](repro/r85/r85-repro.zip), SHA256 39bf1be9bef7cd9ea577156029fd87be60dcfc25718ee66c4be7209bd8db2b79. Numeric/sourcecleanchecks pass;pixelreplayrequireslocalimages. Next separateoriginalresolution vsdownscale/ROI onfixedindependentcontrols. Previewstopped,mobileskipped,no publicstrategy/OCR4/Libraryupload;150s/>=50%perdesktopversion unmet.

## r84 — NPC name cue feasibility (2026-11-18 Taipei)

0newgames. Fourpinnedsourceversions show sixrandomnonuniquenames, noNPCsize text;namefont10–13CSSpx (6–7.8analysispixels),dangerlabelseparate. Existingdetectorcountsbrightpixels,doesnotreadname. Fixedthreeglyph developmenttemplates +24latercases:5correct,0wrongaccepted,19unknown;2unseennamecontrols bothunknown. Originalgeometry24/24previous-visibletrackmatches correct,so0associationgainhere;same-gamecorrelated/manual labels,not independenttruth. CachedROIcomparisonmedian.158ms/max.319ms excludes acquisition/browser. NoChineseTesseractmodel available; noinstallation. Preserveunknowns,duplicates/occlusion,notsoleID,sizeorchasetruth.

[Source/rules/measurement and limits](repro/r84/README.md) · [Complete no-image reproduction](repro/r84/r84-repro.zip), SHA256 c5bd3a17cf030b620c40ff324fcd15cbe1848c81c6f09cb8321d2e6549abbb2f. Clean numeric/source/trackreplay passed;pixelreplay requireslocalimages,templatesnotuploaded. Next optionalnameagreement/veto on independentambiguitycases alongsidecamera/color/spatialcontinuity;no controlcandidate orunchangedgame rerun. Previewstopped,mobileskipped,no publicstrategy/OCR4/Libraryupload;desktopper-version150s/>=50% unmet.

## r83 — shared wall trajectory audit; user observation rules (2026-11-18 Taipei)

0newgames. Gain/threat alreadyshare unboundedtrajectory;visiblewallclamp missing inboth. r47zeroesnormalvelocity butgame retainsit.347fixedbaselineoutputs exact;sharedclamp retain/zero chooseidentically:0/10development,2/2failure,1/335independentchanged. FailureNWstillnegative;independentA301modelgain improvesbutprojectedgrowth leaves−1.35wallmargin. No supportedlivecandidate;don't repeat r47 asnew. Keep alltradeoffs.

Four sourceversionsv2.13/20/21/22 verifiedatpriorcommit:chase selectedonlyNPC>player*1.08,retarget.55–.9s;apparentapproach canfood/hunt/drift/stalechase. Contact<.72sum,eat/deathratio1.08,neutralotherwise;40numericrulecasespass,notrealcollisionvalidation. User maintaining-distance orbit design savedwithtime/travelcaps,multi-frameidentity,exitwalls/otherthreats/shrinkinggap. No controlledorbitdata yet,no true-radius/chaseflags used or avoidance relaxation.

[Full audit and reproduction](repro/r83/README.md) · [Observation next protocol](repro/r83/OBSERVATION-NEXT.md) · [No-image source/results](repro/r83/r83-repro.zip), SHA256 ec591d12945205dd8a6b1852e7936c9dbb36261e39c497457799f7eec181401b. Clean-directoryreplaypasses;previewstopped,mobile skipped;no publicstrategy/OCR4/Libraryupload;desktopper-version150s/>=50% unmet.

## r82 — clipped-threat ranking sensitivity (2026-11-18 Taipei)

0new games.347exactbaseline states:10development+2failure+335independentA. Largestclipped radius±5.833(observedhalfspan,not confidencebound) changes no chosen direction. Motion-zero diagnostic changes only2failurestates SE→NW;original-model clearances worsen−4.143/−14.584,wallmargin improves,gain falls. Both originalstatesalreadynegative,not newnegative crossings. Independent335chosen directionsunchanged;no behavioralgeneralization evidence. Reject directzero-motion replacement;no liveA/B,no thresholdtuning. Full8directionmetrics saved,clean-directory exactreplay passed.

[Source, fixed controls and bounded next step](repro/r82/README.md) · [Complete no-image reproduction](repro/r82/r82-repro.zip), SHA256 8dd8a5280fda662312524f6741282a0d1b0b43b418abd9237e0c97107cae6d57. Next reuse priorwallcontact evidence to check commonwall-constrained trajectory semantics;neither modelscore nor unknown geometry proves survival. Previewstopped,mobile skipped,no newpublicstrategy/OCR4/Libraryupload;per-versiondesktop150s/>=50% unmet.

## r81 — terminal enclosure and intervention-image limits (2026-11-18 Taipei)

0new games.12/12lastBimages hash-verified and viewed. Rightwall, upper-rightgreen threat and lower-leftgiant visibly converge;219.3ms finalgap,killerunknown. FourSE/NWreversals;last2frames modelhasno safe direction. Correction of preliminarypartialread:3late radius corrections,not0;allochreprey remain edible and directions unchanged in same-frameablation. Earlierseq271N→NE keeps2NPCsedible;seq285SE→NW crossesedibility48.333→62.064/HUD60;bothlackexactimages,so true-threatvsfalsepreyblock unresolved. No directlate correction explanation or survivalclaim.14fixeddecision assertions+647plannerreplays passed clean samehost directory.

[Audit, source and bounded next step](repro/r81/README.md) · [Complete no-image reproduction](repro/r81/r81-repro.zip), SHA256 19254a0d85cab76416cc86b1d92a028e18abc7adae93f0d3221128ebc856a108. Includes unchangedr80completecode/results. Next fixedofflinecomparison: sensitivity of pre-enclosure exitranking to clipped-threatgeometry/motion, preserve A/near-prey controls;do not rerun unchangedradiuscandidate. Previewstopped,mobile skipped,no newstrategy/publication/Libraryupload. Per-versiondesktop150s/>=50% unmet.

## r80 — conservative radius integration / desktop A-B (2026-11-18 Taipei)

Predeclared A/B one random v2.20 desktop game each: A death64s,size83; B death61s,size67.2starts0wins2deaths0aborts; no replacements.70fixed cases exact(9corrections,52independent controls unchanged);647/647live planner replay exact. B67corrections in59frames,0provenance overflow;10cache frames without fresh estimate logs. Estimator sum median0.2ms/p951.4/max6.4;fullcompute max181.3ms.26retained images roundtrip exact,keys released,0missed;images local only. First correction shown on already-danger-labelled distant pinkNPC,not true-radius proof. Single-frame radius-only ablation:2direction changes/1edibility change;tracking/history retained,not causal game replay. No demonstrated growth/survival improvement; do not expand unchanged prototype.

[Full source, commands and limits](repro/r80/README.md) · [No-image reproduction](repro/r80/r80-repro.zip), SHA256 3ee3002478d4d9770c5a67c292b5c22131b24cd65a532121748ace61aa32561c. Clean-directory build,numeric replay,provenance and preview build passed samehost;pixel replay requires local images intentionally excluded. Next: inspect B last12frames and2changed directions with independent near-prey/threat controls. Preview stopped;mobile skipped;no public strategy/OCR4/Library upload. Desktop per-version150s/>=50% unmet.

## r79 — pooled highlight-area fallback identified (2026-11-18 Taipei)

0 new games.9NPCtarget frames have28–36bright pixels; all fail upper area gate (1.78–2.47xexpected vs1.6),not pixel scarcity. Splitting4connected bright regions yields exactlyone valid cluster each,estimated35.704–37.053worldradius vsfallback26.667–28.333. Text contamination consistent,not labelled truth/killer proof. Prototype only upgrades original fallback when unique cluster passes unchanged gates; accepted estimates/clipped objects retained.70/70component checks exact,9changed; independent13Aimages/52labelledobjects0changes. Corrected-value holdout coverage still missing; no live safety/benefit claim. Node median0.226ms/max3.519ms per component,not active-game overhead. Preview stopped,mobile skipped,no OCR4/Library/image upload.

[Source, evidence and limits](repro/r79/README.md) · [No-image reproduction](repro/r79/r79-repro.zip), SHA2560bb4a203f28c400b7c3250f6a56c33a9f6202e7701cb1af1b4bf3eee61228396. Next: integrate/provenance+active-load validation then bounded trial if supported, preserving uncertainty and upper-threat alternative.

## r78 — early-death image audit, simple calibration fix falsified (2026-11-18 Taipei)

0 new games. r77B candidate never intervened; death not attributed to it. Last12pixel hashes12/12match; final142.1ms gap. Saved frame/terminal show small selected NPC touching player and upper large threat nearby; killer/true radii unconfirmed. Static renderer scales visible NPC by0.8–1.15 while collision uses unscaled radius: possible ambiguity, not proof. Removing only highlightRadius small-component<18guard changes0/12target estimates, and0/6labelled NPC components across2other scenes. Rejected simple fix; no live expansion or release. Full source/numerical evidence preserved, pixels local only. Preview stopped/mobile skipped.

[Report and limits](repro/r78/README.md) · [No-image reproduction](repro/r78/r78-repro.zip), SHA2561742aaaed4d68441f2414be247e92cfe9c025dd35374be43a028aa050bb02792. Next: inspect highlight fallback reasons on same fixed images, retain upper-threat alternative; no unchanged gameplay rerun.

## r77 — fixed desktop A/B completed (2026-11-18 Taipei)

Predeclared A/B one random v2.20 game each,Chrome1562000x1163DPR1:2starts/0wins/2deaths/0aborts. A death74s,size102; B death10s,size31. A30s/60s sizes42/73; B died before first30s window, so no common predeclared growth comparison. B0retained/0suppressed overrides: no rule effect observed, early death cannot be attributed to candidate. No replacement or expansion. All425accepted outputs exact on replay,0rejected; keys released, image roundtrips all passed. A22interventions,first image pinned/21skipped; B none. Images local only. Preview stopped, mobile skipped, no publicstrategy/OCR4 release.

[Complete source/results and limits](repro/r77/README.md) · [No-image reproduction ZIP](repro/r77/r77-repro.zip), SHA256e19138eb929b481675a620dba449cbbcb6dd3a3b578e987e81d501a09e92fe16. Clean-directory build/check/replay/summary passed. Next: analyze B early-death retained12frames before more batches.

## r76 — target progress vs threat avoidance (2026-11-18 Taipei)

0 new games. Frozen risk-aware gate retains override if baseline existing risk>0 OR wall below existing margin.3169states,54prior overrides→35retained/19reverted.19/19 modeled0.2s target approach improves (median20.725px), but2s weighted gain drops14/19,unchanged5: no live-growth claim. r75r50index386 threat avoidance retained; no new negative prefix gap/wall vs prior. Separate r72A/B589states has0 changed cases, so no independent validation of new behavior. Clean-directory replay identical. Candidate offline only; no publication, images/Library uploads or preview. Mobile skipped.

[Source and limitations](repro/r76/README.md) · [Complete no-image reproduction](repro/r76/r76-repro.zip), SHA2569a007a215a7ff5cfe837eea5f947464cca9fe72c26bfabbbdbaf460befd1c850. Next: predeclared small actual growth comparison with bounded first-intervention recorder, without tuning on holdout.

## r75 — short-lived override attribution, rejected wall-only gate (2026-11-18 Taipei)

0 new starts/wins/deaths/aborts. Saved r74 seq304 image supports food below-left, distant visible wall, right/clipped-left NPCs. BaselineSW overriddenSE despite base wall450.118>margin322.25; next frameSW. This is90-degree direction change, not measured180-degree reversal. Seq306/322 images missing: no visual/causal attribution. Single existing-margin gate tested2580fixed states:35 changes; r50index386 counterexample lowers continuous no-prefix NPCgap2.340→0.684 despite adequate wall distance. Negative100/200ms prefix already exists in both;0 newly negative cases. Reject wall-only gate, no live expansion. Clean-directory replay identical, no images uploaded, preview stopped, mobile skipped, no OCR4 release.

[Source, counterexample and limits](repro/r75/README.md) · [Complete numerical reproduction](repro/r75/r75-repro.zip), SHA256f3c5a215aec4aefc5c41ec7a464bc959af61a2ee6de92b7da3a88688dc597fd6.

## r74 — bounded intervention capture verified (2026-11-18 Taipei)

Recorder-only, strategy unchanged. Fixed2235 directions + prior589 complete outputs exact; new345/345 outputs exact. Browser fixture13/13 PNG roundtrip and immutable first image passed. One declared desktop v2.20 Chrome1562000x1163DPR1 diagnostic:0wins/1death at68s,size90/0aborts,0rejected,keys released. Three interventions; first seq304 preserved outside final ring,2.5ms copy,43,555,200 raw bytes. Two later images deliberately skipped by one-slot cap; no causal strategy claim. Preview stopped; mobile skipped; no OCR4/public strategy release or Library upload.

[Complete source, test commands and limitations](repro/r74/README.md) · [No-image reproduction ZIP](repro/r74/r74-repro.zip), SHA25648a5ed73b4cb600739841f613d4ebcb23c29507d907de6ee55170157c8a37c70. Clean empty-directory build/check/replay passed on same host, not a new OS. Next: compare short-lived intervention reversals using saved exact case and independent controls.

## r73 — terminal surface audit (2026-11-18 Taipei)

No new games: 0 starts/0 wins/0 deaths/0 aborts. Analyzed B last12 same-source images plus terminal. Player-right purple ROI:12/12 zero, terminal100%; measured wall shift−21.849px and tested horizontal offsets do not explain it. Retrospective, not predictive: final181.1ms unobserved; spawn/growth/identity unknown. Sole intervention seq292 lacks exact image. Do not expand unchanged candidate. Local pixel check and clean-directory numerical replay passed; images excluded, hashes included. Prior full r72 sources pinned, no strategy change/OCR4 release; mobile skipped; preview stopped. Next: bounded exact intervention snapshot, verify unchanged outputs.

[r73 evidence and limits](repro/r73/README.md)

## r72 — recorded timing and completed desktop A/B (2026-11-18 Taipei)

v2.20 Chrome156 desktop2000x1163DPR1, fixed A/B one random game each: A death56s,size66; B death60s,size63.2starts/0wins/2deaths/0aborts; no replacements. B intervened once2.584s before stop; that intervention lacks same-source ring PNG (nearest periodic1.383s), so no causal claim. Both last12frames intact/distinct/roundtrip,keysreleased,logdrops0.589/589live decisions replay exactly;2235/2235fixed integration matches.9recorded callback tapes yield1.843–2.000simseconds per2wallseconds;450retained historical model comparisons pass, NOT live improvement. Preview stopped,publictest043 unchanged,OCR4unpublished,mobile skipped. [Full findings](repro/r72/README.md), [complete no-image source/config/scripts/results](repro/r72/r72-repro.zip), SHA256d060ec3428f1e5a0a811ac2d17bd868ee5e4366a702a418863eae14075bd6f71. Clean-directory generation/replays/build verified; random outcomes not reproducible exactly. No Library upload.

## r71 — prefix comparison and bounded real timing (2026-11-18 Taipei)

Same-prefix comparison rejects r50-130/131;25/27 historical holdout changes retained,150 intermediate-prefix/fine-grid model pairs without loss.300msstress still fails two r60 cases. One baseline v2.20 desktop2000x1163DPR1 diagnostic start,planned20s cutoff:0wins/0deaths/1abort,HUD04:40,size38.97/97planner outputs identical;1100game callbacks,287dispatch events,0logdrops. No game callback during97/97compute intervals; capture→dispatchmedian17.90/max104.60ms, dispatch→nextcallbackmedian2.30/max13.70ms. Entire compute walltime cannot simply be modeled as old-direction simulation.12/12distinct retained images and roundtrips,keys released,preview stopped. No candidate live deployment, no OCR4, mobile skipped. [Details](repro/r71/README.md), [complete no-image reproducible package](repro/r71/r71-repro.zip), SHA256bbefba4442ec3d255538655e0d02abeb9b5d043487d8fdff4f6464b49946b9f9. Three clean-directory checks exact; standalone harness build passed. No Library upload.

## r70 — same-direction delay hypothesis rejected (2026-11-18 Taipei)

B180/181 old/new direction both east; treating recordAt as switch does not reduce25.84/37.93px residual. Synchronous dispatch precedes recordAt; actual simulation response unmeasured. Frame dt cap40ms is static source evidence, not established cause. Fixed27 holdout changes under0/100/200ms prefix scenarios produce0/2/2 NPC-margin losses;200ms introduces one positive-to-negative candidate gap (r50-13010.156→−14.082px). Scenario is not actual measured delay. Preserve counterexample; no live test, starts/wins/deaths/aborts0; preview unused, mobile skipped, publictest043/OCR4 unchanged. [Findings](repro/r70/README.md), [no-image reproducible package](repro/r70/r70-repro.zip), SHA256a7e058ec2abc5ec23b0d3be81fa7761109e00de6dfe0440ad36fa109b5c437e2. Empty-directory numerical replay exact. No Library upload.

## r69 — six tradeoffs and corrected low-margin case (2026-11-18 Taipei)

Correction: r68 B2841.0465px remainder improves baseline negative margin; NOT among six decreases. All six are noncontact. Next-interval mixed displacement residual median7.81/max37.93px is not pure measurement error. Frozen min(wall-grid,NPC) comparison rejects A425 excessive tradeoff, changes B284 alternative; independent fixed1298 rows produce27 shadow changes. Known difficult r46 cases unresolved; no live safety/growth claim. No new games or preview, mobile skipped, test043 unchanged, OCR4 unpublished. [Full findings](repro/r69/README.md), [no-image source/inputs/results](repro/r69/r69-repro.zip), SHA2569d37d97dad0a4d3d06c4bc4c4b458460e98b73d124088e5511387cebe90a00aa. Both scripts reproduce byte-identical outputs in empty directory (same host). No Library upload.

## r68 — wall-constrained shadow alternatives (2026-11-18 Taipei)

Independent r60 A/B: 925 decisions, 152 with visible walls, 23 shadow changes. Six changes lower wall margin; minimum remainder1.0465 CSSpx with no calibrated error bound. Original model clearance/gain nondecrease is enforced, not independent safety proof. Development r65: 2/12 changes; first two r67 north alternatives rejected. No live integration, new starts/wins/deaths/aborts0; mobile skipped, publictest043 unchanged, OCR4 unpublished. [Reproduction and limitations](repro/r68/README.md), [complete no-image numerical package](repro/r68/r68-repro.zip), SHA2567021058737a4bf17ddf9d3d3948fbfb6e42c6ef209f74581c546dfe681e3ee1d. Fresh empty-directory results byte-identical; same host. No Library upload.

## r67 — pre-transition surface adjacency (2026-11-18 Taipei)

12 frames from one r65 game: orange/pink adjacency visible for six frames, confirmed warning for five. Shadow maximum-clearance selection changes four directions; first two point north across the visible upper wall, so candidate rejected for live integration. Later southeast alternatives remain counterfactual. Swallowing/growth/attacker identity unknown. No new starts/wins/deaths/aborts; public test-043 unchanged, mobile skipped, OCR4 not released. Clean-directory numerical replay byte-identical; images remain local, no Library upload. [Source, inputs, results and limitations](repro/r67/README.md).

## r66 — boundary/camera fixed counterexample audit (2026-11-18 Taipei)

12same-sourceframes+terminal: wall-compensated finalboundaryshift263.72analysispx in91.2ms, vs prior11closingrates45.14–64.87px/s. Wall moves9.83px; purecamera translation insufficient. Fixedone200msmargin12.97+4px fails; no tuning/deployment. Ninecolorchecks stable. Growth/identity/attacker stillunknown; bottomclippedextent not inferred. [Scripts, measurements, limits](repro/r66/README.md). Numericalclean-directory replayexact; imageslocalonly. No newgames; priorr65death retained. NoOCR4/Libraryupload; previewstopped,mobileskipped.

## r65 — bounded same-source terminal recording (2026-11-18 Taipei)

One v2.20 desktop diagnostic: 0wins/1death/0aborts, visible62s,size93.321accepted decisions/2rejections; originalplanner321/321exact. Final12same-sourceframes retainseq312–323,40,204,800bytes,12/12timestamps andPNGpixelroundtrip exact; lastcapture91.2ms beforeterminal.15periodic+terminalimages,0missed;keysreleased.16-call staticprobe outputs16/16exact. Large left/lower threat is already detected before ending; terminalboundary changes markedly, cause/identity stillunknown. No strategyclaim orOCR4release. [Report/source/settings/fullnumericresults](repro/r65/README.md), [complete noimage package](repro/r65/r65-repro.zip), SHA2562091bd43d7aa2fee91a678b0cdfcbd3fae7ae01fcd5cba2230e73701cde620ec. Imageslocalonly, noLibraryupload. Freshdirectorybuild/replaypassed. Previewstopped;mobileskipped.

## r64 — original ImageData stage audit (2026-11-18 11:04 Taipei)

Fixed A/B last periodic and terminal four PNGs replayed in Chrome156; instrumentation outputs identical4/4. A terminal giant is detected and survives containment/player filtering; cold-image terminal planner has0safe directions (A clearance -253.63, B -62.32). Filter relaxation unsupported. Missing final197ms still prevents establishing earlier visibility, identity, growth or attacker. No new games or controller change. [Complete source, results and reproduction limits](repro/r64/README.md). Images remain local; pinned r62 full package supplies baseline/game/numericalinputs. Fresh-directory numerical replay and portable fixture build verified. Preview stopped; mobile skipped; noOCR4/Libraryupload.

## r63 — A terminal geometry audit (2026-11-18 10:59 Taipei)

No new games. Same-geometry collision-threshold hypothesis unsupported: planner is more conservative than v2.20 contact formula. A last4 threats do not correspond to the giant overlapping the player in terminal image; final197ms missing synchronous image prevents assigning perception/growth/prediction cause. B negative-gap counterexample retained. Deterministic clean-directory audit passed. [Full report and reproducible script](repro/r63/README.md), with pinned complete r62 source/input package. Images remain local only. Next: original ImageData component/filter audit, not threshold tuning. test-043 unchanged; OCR4 not released; mobile skipped; preview stopped.

# r62 — crowding and two-stage exit audit

2026-11-18 Taipei. Fixed B417/A508states. Inlast15s B22/A21states have model alternatives with more followups andnonloweroriginalclearance;not realescape proof. Bthree-consecutive<=2safedirections begins396(4.072sbeforeending),onlineconfirmation398(3.672s);no qualifyingbetteralternate then. A counterexample:7/6model-safedirections397/197msbeforedeath,nonarrowingwarning. Hypothesis insufficient as generalprediction/policy;no newgame/controller.

[Full source,paths,gaps,conditions and no-image replay](repro/r62/README.md),archiveSHA25625cfb07bff57469cb2cd6976938251f01bdef1ae0b36c04ecaac28763688e00b. Cleanreplayidentical. Newstarts/wins/deaths/aborts0. NextauditAdeathgeometry beforebranch-countdeployment;retainBearlyexit model-only evidence. Previewstopped,no publicstrategy/OCR4/Libraryupload,mobileskipped,desktopper-version150s/50%unmet.

# r61 — intervention and terminal timing audit

2026-11-18 Taipei. Four r60 Bchanges were47.675/36.099/35.682/12.390s before ending;images not synchronous,consumption attributionunknown. Final5s25decisions,0rejections,capture median199.9ms/max203.6ms,capture-to-recordmax39ms,firstall-unsafe2.671s beforeending,13all-unsafe rows. Terminal stale-compute hypothesis unsupported;physical key effect/collision onset stillunknown. No new policy or gameplay;starts/wins/deaths/aborts0. Existingr60deaths retained.

[Complete source and no-image audit evidence](repro/r61/README.md),archiveSHA256ffef8822780a4cfe9aac87e3ffc0fbfdc885685b8c852416b43f2b8e3760d0a1;clean replay identical. Next audit earlier crowd geometry and availableescape trajectories;do not repeat same latency/foodconfirmation test. Previewstopped,no publicstrategy/OCR4/Libraryupload,mobileskipped,desktopper-version150s/50%notmet.

# r60 — food-target confirmation, bounded desktop A/B complete

2026-11-18 Taipei. Fixed v2.20 desktop Chrome156,2000x1163,DPR1,random unpaired A then B. A death100s,size104;B death77s,size79. Total2starts,0wins,2deaths,0aborts. Rejected decisionsA1/B2,images22/19,0missing,keysreleased. Bconfirmationactive323/417;actualdirectionchanges4/417. ReplayA508/508,B417/417 exact;no causal benefit/harmclaim. Bwall89.008s differsfrom77ssettlement;preserved. Do not expand unchanged candidate.

Existing r57B intermittent east detections not explained solely by camera delta;identity/occlusion/contour-fragment distinction remainsunknown at5simage cadence. Newtarget-only confirmation retains allthreats andoriginalpools;offline marginloss counterexamples retained. [Complete no-image source, conditions, inputs/results and replay instructions](repro/r60/README.md). ArchiveSHA256120bc365d8c758b27a082c5a9971fff709511ac58217a919816eab7e94459ac1;clean extraction outputs identical. Next inspect Bfourchanged decisions anddeathwithavailableimages. Previewstopped,publictest043unchanged,noOCR4/Libraryupload,mobileskipped,per-version150s/50%notmet.

# r59 — reversal score attribution

2026-11-18 Taipei. 2654 fixed inputs,0 instrumented direction/score/clearance differences. In122 eligible non-all-unsafe reversal states:alignment dominates113,gain6,risk3; alignment ablation changes69 choices.146 direction-vs-prior states include B0 initialization,not a measured adjacent reversal (145have prior record). Target identity/camera uncertainty prevents treating score attribution as proven bad-target cause.

Candidate screen(zero selected gain vs positive prior gain)covers14states but6 lose modeled clearance,max71.86px; no safe-policy claim or live test. New starts/wins/deaths/aborts0. Next verify existing B target/trajectory pairs before strategy change. [Complete source, inputs, per-state attribution and reproducibility](repro/r59/README.md); archive SHA2569b50d62495c72d2b416aa98abdb3e7377688d3917dcd634b8e362c17f31fdcb1. No image records, no Library upload, no OCR4 or publicstrategy deployment; mobile skipped.

# r58 — reversal hysteresis rejected (desktop offline)

2026-11-18 Taipei. Fixed r57 A/B941 observations plus1298 original historical and415 conditional separately. 146 r57 reversals,only3 changed; no final B stall coverage. Historical r14-191 modeled clearance143.68→103.06px; not actual safety proof. New starts/wins/deaths/aborts all0. No live batch or strategy deployment justified. Publictest043 unchanged, mobile skipped, all desktop150s/50%acceptance unmet.

[Complete no-image source, scripts, frozen numerical inputs/results and reproducibility](repro/r58/README.md). Archive SHA25658886ceef650491128a9ad97fe7f002f49d960fc3681892658d78b6c7f0c1550; clean-directory build/replay byte-identical. Original image evidence local only. Next decompose reversal score jumps, not threshold retuning. No Library upload.

# OCR 測試與交接摘要

更新時間（台灣）：2026-11-18T08:16:58.276798+08:00

## 目標與發布狀態
桌機各現有遊戲版本自 v2.13 起：每版 150 秒內過關率至少 50%。手機由使用者指示跳過，不能標為通過。尚未達標，不發布 OCR4。公開測試策略仍為 test-043；本文件只增加摘要，不修改控制器或部署網站。

分支：`test/ocr-test`，倉庫：`gg-dot1980/slime`。目前核對控制器 blob：`0d94fcb3b0619da4f4b0bb6b8e495cfd0a6db5f6`；對應已知來源 commit：`0d9f06cef4cca1fe12ab49e1c545456cca89618d`。

## 遊戲版本／桌機紀錄
目前可恢復版本表列 v2.13、v2.20、v2.21、v2.22（表內最新）。這是保存的版本表，尚未重新核實正式站是否增加其他版本；不能據此宣稱完整覆蓋目前正式站。

下表限已讀回逐局 JSON，不是所有歷史局數總計。歷史與新批次分列，不混合策略計算驗收。環境均為雲端 Linux、Chrome156、畫面及CSS 2000×1163、DPR1、正常隨機開局、前景瀏覽器，控制只用影像與可見HUD。此非實體手機。

| 遊戲版本 | 批次／策略 | 開局 | ≤150秒過關 | 死亡 | 逾時 | 中止 | 觀察過關比例 | 證據 |
|---|---|---:|---:|---:|---:|---:|---|---|
| v2.13 | r2／test026 | 1 | 0 | 0 | 1 | 0 | 0/1 | 已恢復JSON、影像 |
| v2.20 | r4–r14／多種策略及診斷 | 8 | 0 | 8 | 0 | 0 | 0/8，僅庫存統計，不合併驗收 | 已恢復JSON、影像 |
| v2.20 | r46／恢復test043 | 1 | 0 | 1 | 0 | 0 | 0/1，探索非驗收 | 新JSON、17PNG已校驗 |
| v2.21 | r2／test026 | 1 | 0 | 1 | 0 | 0 | 0/1 | 已恢復JSON、影像 |
| v2.22 | 恢復批次 | 0 | — | — | — | — | 未測 | 只有載入紀錄，非過關驗收 |
| 全部 | 手機模擬／真機 | — | — | — | — | — | 依指示跳過 | 不視為通過 |

## 可恢復的逐局摘要
每列一局，過關皆0、中止皆0；時間為結算時間，逾時沒有結算時間則保留未知。原圖／原JSON不提交此倉庫。

| 批次 | 版本 | 策略標記 | 結果 | 結算秒 | 終點體型 | 決策筆數 | PNG數 |
|---|---|---|---|---:|---:|---:|---:|
| r2-1-v2.13 | /v2.13/ | recovery-r2-instrumented-test026 | timeout | 未知／未結算 | 115 | 750 | 32 |
| r2-2-v2.21 | /v2.21/ | recovery-r2-instrumented-test026 | death | 46 | 63 | 241 | 11 |
| r4-1-v2.20 | /v2.20/ | recovery-r4-instrumented-test026 | death | 69 | 89 | 346 | 15 |
| r5-A-v2.20 | /v2.20/ | recovery-r5-fixed-AB | death | 63 | 84 | 322 | 14 |
| r5-B-v2.20 | /v2.20/ | recovery-r5-fixed-AB | death | 58 | 120 | 291 | 13 |
| r6-H-v2.20 | /v2.20/ | recovery-r5-fixed-AB | death | 72 | 84 | 362 | 16 |
| r8-1-v2.20 | /v2.20/ | recovery-r8-source-ring | death | 43 | 66 | 218 | 10 |
| r10-B-v2.20 | /v2.20/ | recovery-r10-wall-npc | death | 70 | 78 | 361 | 16 |
| r11-candidate | /v2.20/ | recovery-r11-labelled-threat | death | 68 | 75 | 343 | 15 |
| r14-game | /v2.20/ | recovery-r13-observer-diagnostic | death | 84 | 93 | 425 | 19 |
| r46-baseline | /v2.20/ | recovery-r46-restored-test043 | death | 76 | 83 | 383 | 17 |

`r6-H` 的原JSON策略標記仍寫 r5，保留此不一致，不能當作策略版本已完整確認；`r14-game`原JSON標記r13診斷，依實際檔名區分。

## 原始資料缺口
- r43：既有摘要報告 v2.20 死亡63秒、體型126；原始JSON、影像與本地候選未恢復，不能重新驗證或混入上表。
- r44 A：既有摘要為約17秒過期中止、體型38，不能算死亡或勝利；原件不可得。
- r44 B：協調端曾看到結算頁108秒死亡、體型102；原始下載未取回校驗，不標為原件已驗證。
- r17–r44其餘歷史未全部恢復。下方公開版本摘要有記錄，不代表原始證據仍可取得。
- 恢復備份實際截至 r16/test033；r43/r44不是由這兩份備份恢復。

## 影像上傳更正（2026-11-18）

依使用者最新要求，當前分支移除含影像的r46/r50兩段重現包，改存無影像版：排除75固定PNG及36個JSON內嵌PNG，保留原始碼、設定、腳本、數據結果與摘要。38檔雜湊通過；規劃重播383/383、414/414一致。影像保留本機；Git歷史仍可能包含先前影像包，未重寫歷史。過去113檔／含影像紀錄描述的是舊提交，不能視作目前包內容。今後GitHub不再上傳影像紀錄；像素回歸需要另行本機提供影像或重新採樣。

## r57：正間距移動替代的固定 A/B（2026-11-18）

假設：公開test043原方向碰牆且末1秒進度≤6.667px時，容許交換部分過剩間距，改選兩模型皆>3px且持續移動的方向。固定1298原狀態15觸發1改向；另415條件狀態2觸發1改向。r56反例源自離線候選，公開基線並非都停滯，適用範圍有限。

實際Chrome156 Linux桌機v2.20、2000×1163/DPR1，固定A後B各一正常隨機局：A96秒死亡/體型104/483決策；B90秒死亡/體型81/458決策。2開局0過關2死亡0中止，均無過期拒絕或缺圖，按鍵已釋放。B實際0觸發0介入，不能推論策略有效或有害，不原樣擴大。非配對小樣本不作勝率驗收；其他版本本批未測、手機跳過。

[完整無影像來源、腳本、固定輸入、數值結果與重現方式](./repro/r57/README.md)已保存，乾淨目錄重新生成A/B/控制器/離線結果逐位元一致。41張採樣影像只留本地。未見有效策略證據，公開/ocr-test仍test043，不發布OCR4；preview已停止，Library影像備份未上傳。下一步用本批B資料找覆蓋缺口或較早成長瓶頸，不單純降門檻促成觸發。

## r46/r50 portability-1：乾淨目錄與瀏覽器啟停（2026-11-18）

修正build.py舊cwd依賴，新增prepare.py與本地v2.20版本清單；手動停止會結束紀錄器並標aborted，策略不變。初版產生器引號SyntaxError保留在檢查記錄，修正後從/tmp及獨立解壓目錄建置成功，Telemetry.js與舊版逐位元一致；38+檔雜湊與383/383、414/414既有規劃重播通過。

受支援Browser實際檢查：r46啟動5.229秒，HUD04:55/體型32，25筆決策；r50啟動9.274秒，HUD04:50/體型35，45筆決策。兩者2000×1163/DPR1，停止後遊戲暫停、keysAfter空、無拒絕或缺圖記錄。新增2開局、0過關、0死亡、2手動中止；只屬啟停整合，不計勝率。這是原雲端主機的新目錄，非全新OS。r50影像fixture實測明確FIXTURE_UNAVAILABLE；r46像素fixture未重跑，75PNG依指示未上傳，不宣稱感知回歸通過。

[無影像可攜包及完整命令](./repro/r46-r50/README.md)已更新，另附PORTABILITY-CHECK.json。preview已停止；無正式策略/OCR4發布，Library上傳仍未執行。

## r56：雙模型不退步的持續出口（2026-11-18）

固定假設：停滯或兩牆模型在全不安全狀態分歧時，僅切換到兩模型間距均不下降、末1秒位移增加超過既有6.667px量化單位的方向。固定1298原狀態：40觸發、3改向、37未解；另415條件狀態11觸發1改向，分開計算。r46-376/382均無符合條件替代，依事前判準否證此規則可解主要反例，不放寬條件或啟動實戰。

重要區分：r46-382東北方向仍有模型正間距12.48/80.86及227.23px持續進度，只是較原向北72.58/99.69下降。無雙模型支配替代不等於無物理出口；下一步應明確評估短期風險與持續進度的交換，不重複支配過濾。模型不是真值，未宣稱安全或勝率改善。

[完整無影像程式、設定、固定輸入、結果與命令](./repro/r56/README.md)已保存；獨立解壓重跑結果逐位元一致。0開局/0過關/0死亡/0中止，手機跳過、preview stopped、公開test043及OCR4未修改。保留原150秒/各版本50%目標。同步曾中止，恢復後先核對遠端再提交，無重複遊戲。

## r55：持續沿牆進度與衰減慣性（2026-11-18）

僅對碰牆候選，以第1–2秒位移／速度取代總位移單位向量評分；不改安全、收益、軌跡或候選池。固定1298原狀態另415條件狀態，基線1713/1713重現r53方向，所有物理數值一致。原樣本11次改向（r46六、r14四、r50一），無無牆改向；三次模型間距小幅下降0.58–3.92px，未超預設5px；中心牆模型同樣沒有>5px下降，不代表真實安全。

r46-348向北→東北，末1秒位移0.39→227.32px，半徑模型間距22.22→76.83；但r46-382仍選末1秒僅0.48px的向北指令。r46-376跨模型反例保留（所選西南在中心模型−150.40，北−99.37，兩者皆負；不能宣稱北必能存活）。支持區分慣性，尚未普遍解除停滯及既有安全衝突；本輪不進實戰、不發布策略。

[完整程式、設定、固定輸入、輸出與重現限制](./repro/r55/README.md)及2.08MB壓縮包已保存。獨立解壓目錄重跑兩支Node腳本，結果及生成程式逐位元一致；不是新環境遊戲或影像感知回放。新增0開局／0過關／0死亡／0中止；公開test043不變、preview stopped、手機跳過、OCR4未發布、無Library上傳。下一步區分有意短暫等待與持續出口，核對下一步風險／進度，不重複調同一權重。

## Reproducibility archive：最近兩個可核實實戰建置

使用者授權保存完整重現檔案後，選取 recovery-r46-restored-test043 與 recovery-r50-telemetry-test043（兩者遊戲v2.20、公開策略test043；r50新增量測，不是test044；r51–r54不是新實戰版本）。[完整可得檔案、命令與限制](./repro/r46-r50/README.md)包含來源、腳本、75固定PNG、兩局原始JSON內全部36張PNG、輸入輸出、環境資料與逐檔雜湊。沒有憑證或其他專案檔案。

獨立臨時解壓目錄完成113檔雜湊及Node規劃重播：r46 383/383、r50 414/414；不是新OS/瀏覽器遊戲重測。歷史瀏覽器二進位／環境鎖檔、隨機種子、每局開局遊戲來源雜湊未保存，因此不能保證完整隨機軌跡或相同死亡時間；r43/r44原件仍缺失。未將缺失補造成完整可重現。未來每版須維護來源／環境／固定輸入／輸出／種子／執行命令／缺項／遠端commit的重現性清單。

## r54：沿牆持續位移與慣性（2026-11-18）

固定r50的13個相鄰接觸區間，13/13下牆距未變。前四段東南指令在0.801秒累積沿牆170px，支持持續切向移動。切向指令歸零後仍移動33.33px；另一連續兩段降為16.67、10px，反例表明短期位移不能當持續出口。使用上一筆實際指令而非本幀新指令比較，12個可計算區間的慣性模型位移絕對誤差中位數5.12px，立即達到指令速度模型18.36px；轉向時仍有17.95px誤差，不宣稱精確模型。既有PNG17/18獨立牆色定位1796→1759.5（36.5px／501.3ms）；r46最後8幀缺少正交牆，該段切向位移仍不可獨立辨識。

限制：一局13相鄰窗不是獨立試驗；牆距量化6.667px、控制生效偏移18.4–28.9ms、上一區間平均速度不等於瞬時速度。支持區分持續切向控制與慣性，不足以把r53向牆指令升格安全候選。下一步在排序中分開短暫慣性與持續切向進度，保留r47跨模型安全反例；本輪不增加實戰。0開局、0過關、0死亡、0中止；preview stopped，公開test043不變，手機跳過，OCR4未發布。

## r53：牆界可行軌跡與排序（2026-11-18）

R47已將可見牆與HUD半徑納入同一軌跡計算安全/收益，本輪不把重做該模型當新成果。新假設：排序由命令方向改用碰牆後實際可達位移，能消除不可達方向的加分。固定r46全部383、r14全部425、r50含拒絕415、單幀75，共1298狀態；另415個r51條件修正狀態分開檢查，不當獨立樣本。

第一原型在未碰牆時也按位移排序，導致無牆方向受慣性影響改變：r46 11、r14 5、r50 6筆，出現間距退步，已保留unscoped結果。依此實作缺陷收窄至該候選軌跡真正碰到可見牆時才使用位移排序，不調門檻；其餘保持原方向排序。

收窄版1298/1298狀態的各方向安全/收益/風險物理數值與r47半徑模型一致，僅r46-343、348、382三筆改向；相對同一半徑模型原選方向間距增加57.41、16.50、60.10，無無牆改向。r14、r50、75單幀及另415條件狀態均無改向。

限制：比較基線是尚未實戰驗證的r47半徑模型，不能稱整體策略安全回歸通過；r47跨模型反例（如r46-376）未被此排序修正消除。r50四筆問題狀態也沒有額外改向；向牆的指令可能仍只有短暫慣性位移，不能把模型間距較大稱為持續可逃離路徑。因此尚不升入實戰。下一步須確認碰牆後持續切向位移與碰撞幾何，而非再給被牆阻擋指令加分。

本輪0開局、0過關、0死亡、0中止；無公開策略修改、無OCR4發布、無Library上傳，手機跳過。證據r53/plan.json、analyze.cjs、result.json、unscoped.cjs、unscoped-result.json完整留本地。

## r52：四次改向的收益／牆界歸因（2026-11-18）

預先假設「r51改向由穿牆路徑上虛構的吞食收益驅動」。重建全部415觀測，1472/1472基線速度仍精確；固定檢查全部4次改向，不挑有利案例。

假設被否證：四筆選擇東南的gain全部0，兩筆有食物目標、兩筆target=null；兩種牆界模型同方向gain仍0。原因不能歸結為追求吞食收益。原模型安全池有2–3方向，東南分數較高而被選；四筆原clearance依序67.45、79.49、11.28、16.70。

四條未約束軌跡在2秒內的中心最大超出可見下牆約309.45 CSS像素。中心牆界模型仍選東南，但計入玩家半徑的牆界模型全部改選南；原東南方向間距變為-43.22、-66.42、-22.21、-42.57。這是路徑可行性與安全池判斷不一致的可重現模型反例，不能宣稱南方向能存活。

下一步以統一牆界軌跡重算安全池和排序，保留r47兩模型分歧及r48/r49/r51退步，不調收益權重來迎合結果。尚無支持實戰候選；本輪0開局、0過關、0死亡、0中止，未發布OCR4、未改公開策略、未Library上傳。證據r52/plan.json、analyze.cjs、full-result.json、four-directions.json留本地。

## r51：連續相機補償條件回放（2026-11-18）

固定假設：沿實際記錄的前幀配對與dt連續傳遞NPC濾波狀態，只在r50已固定13個貼牆時間窗以牆距變化替換法向相機分量，應減少下一幀殘差且不新增出口排序退步。全415觀測（含1拒絕幀）均納入，原基線1472/1472 NPC速度先精確重現，0重建未知。沒有改配對、篩選樣本或調門檻。

46個可比較的法向下一幀預測殘差：中位28.50→3.91 CSS像素，34改善、3變差、9相同；重疊時間窗不當作46次獨立實驗。3個退步完整保留，其中原3.75→43.02、0.42→27.12。這是保存配對下的條件比較，牆觀測不是精確真值，未驗證閉環改配對後結果。

4筆方向改變，接觸窗外0改變；其中3筆在至少一個r47牆界模型安全間距下降超過5，92539.9ms的南→東南在兩模型下降13.93／17.09，其餘兩筆在半徑模型下降19.04／34.51。因此不採用、不進實戰，不以中位誤差下降宣稱安全或勝率改善。

已查看r50最後週期圖與terminal原圖：玩家近下牆、畫面上方/右側大型輪廓；兩圖相距501.3ms，不能逐次確認13窗配對或歸因死亡。r48/r49的r46-353/361等反例繼續保留；缺同等telemetry，沒有假造對它們的精確連續重播。

下一步：將已改善的速度預測與實際可行的牆界路徑評估分開驗證，優先檢查4筆改向的收益來源及牆外假設；保留3筆殘差反例，不擴大同版測試。新增開局／過關／死亡／中止均0，手機跳過，無策略部署、無OCR4發布、無Library上傳。證據：r51/plan.json、analyze.cjs、result.json，完整資料留本地。

## r50：最小觀測量測與單局診斷（2026-11-18）

不改策略，新增有界影像timestamp/priorTimestamp/dt/cache-hit、預測/量測/混合相機、NPC相機分支、配對前幀索引/誤差、原始位移及限幅前速度；每幀最多256NPC、單局最多800決策，截斷另計。配對索引不是持續真實ID。

固定75連續影像加75重複快取呼叫：辨識150/150、規劃150/150完全一致，快取75、截斷0。辨識基線中位29.3ms、含觀測14.9ms，但固定先基線後觀測有順序偏差，不能宣稱加速；觀測計時區段最大0.2ms，未含全部配置及序列化成本。

預先限定v2.20桌機一局：Chrome156、2000×1163、DPR1，2026-11-18台灣08:25:43開始，結算80秒死亡、體型90；過關0、死亡1、中止0。414已施加決策及1筆310.6ms過期拒絕，拒絕後釋鍵並重新感知，未達連續3次中止條件。19PNG可讀、記錄器缺圖0、NPC截斷0、停止後無按鍵。不是正式勝率驗收。

觀測分支：food-measured371、camera-fallback44（含拒絕幀）。1472/1472個NPC速度可由記錄的preClamp限幅精確重現，未有配對查找未知；這證明記錄一致，不證明物件真實身分。每幀觀測JSON最大2773 bytes；實戰觀測計時區段最大0.4ms、顯示中位0受時鐘解析度限制，不能視為零成本。單次過期不能歸因於觀測或特定底層原因。

依既定規則取得13個貼牆時間窗；末段下牆距不變，但玩家與NPC相機回退分量同為約218–291px/s。與r46不同牆向，保留為新反例。下一步可使用實際分支/配對與完整拒絕幀，驗證連續相機補償及濾波狀態，不再猜測分支；沿用r48/r49退步反例。週期PNG非每個決策同源影像，仍不能確認每次輪廓配對真值。

本輪未改公開策略或部署/ocr-test，未發布OCR4；觀測patch及完整證據僅本地保留，GitHub更新摘要。手機跳過、Library上傳未嘗試、預覽已停止。證據：r50/plan.json、Telemetry.js、parity.json、game.json、summary.json、contact-observations.json、images/。

## r49：同時間窗玩家／NPC相機補償（2026-11-18）

假設：只在可重現原NPC速度的貼牆狀態，同步修正玩家與NPC相機補償，能否消除r48退步。固定r46全383筆及r14全425筆，共808連續狀態；沿用r48接觸規則，未調閾值。75單幀對照沒有連續時間資訊，本輪不作速度重建。

程式核對：玩家速度使用預測／食物位移混合後的camera；NPC速度在有食物位移時優先使用measuredCamera，否則用camera，之後0.65/0.35濾波並限幅±200。兩者不必相同；差異本身不能直接定為bug。

36貼牆狀態中34與保存camera回退公式相容，2筆（r46-346、349）無法重現，保留未知；34筆內另6筆沒有未飽和雙軸配對，不能唯一識別補償來源。重建採相鄰保存狀態，不能排除影像快取影響實際dt，也不證明物件真實身分。

單步聯合修正保持舊配對及前一筆速度，只替換本步法向相機分量；8筆改向，其中5筆在兩個r47牆界模型的檢查出現超過5單位退步。r46-353仍由東北改北，兩模型下降33.67／70.34；r46-361兩模型間距增加，但其配對速度已飽和，不能據此宣稱修正成立。其餘退步：371、372、376、382，全部保留。

結論：不採用這個單步修正，不進實戰。不以一筆反例改善宣稱安全。下一個可執行步驟是加入不改控制的有界欄位：實際影像timestamp／dt／cache-hit、predictedVelocity、measuredCamera、混合camera、配對索引與誤差、濾波前／限幅前NPC速度；固定保存影像確認記錄不改輸出後，才考慮最多一局必要量測。現有逐步JSON缺這些欄位，不能重建新配對與整段濾波歷史。不是工具或權限阻擋。

本輪開局／勝利／死亡／中止皆0；沒有網站策略改動、沒有OCR4發布或Library上傳。證據：r49/plan.json、analyze.cjs、result.json（本地保留，GitHub僅摘要）。

## r48：貼牆速度單項假設（2026-11-18）

固定資料：r46全383筆、獨立歷史r14全425筆，共808個連續決策狀態；另保留75個單幀負對照（無相鄰幀證據，不觸發修正）。總計883狀態，未排除失敗。

規則預先固定：同HUD半徑、連續可見牆距變化不超過一格掃描解析度（6.667 CSS px）、牆距不超過半徑加一格，僅將朝牆的玩家速度分量設0；NPC速度、目標、權重與門檻不變。

r46有36筆觸發、6筆改向；牆距變化速度中位數0，估計朝牆速度絕對值中位數235.28 px/s，最大317.50。這是區間影像觀測與模型估計的差異，非瞬時速度真值。r14的425筆及75單幀對照均不觸發，所有非觸發狀態不改向。

安全反例：r46-353由東北改北，在中心／半徑牆界模型的安全間距分別下降72.76／105.55；r46-361在半徑模型下降6.00、中心模型則增加22.02。結論：單獨修正玩家速度不支持升為候選，沒有新增遊戲，不宣稱安全或勝率改善。獨立r14樣本不含觸發，不能當成貼牆效果泛化證據。

下一步：檢查同一影像時間窗內玩家速度與NPC相機補償是否一致；保留r46-353及361，不能再原樣測試只歸零玩家速度。證據索引：r48/plan.json、analyze.cjs、result.json（本地保留，未上傳原始資料）。本輪開局／過關／死亡／中止皆0；手機跳過，未發布OCR4，Library上傳未嘗試。

## 最新固定回歸與假設
- r45：75張PNG來源雜湊核對；瀏覽器75張不同RGBA，test033與test043辨識75/75、方向75/75一致。每幀重設追蹤、固定輸入，非連續追蹤或實戰勝率。
- r46：v2.20單局76秒死亡、體型83；383決策、17PNG可讀、0記錄器缺圖、0過期拒絕、停止後按鍵清空；383/383決策可精確回放。週期圖間隔5秒；最後週期圖距停止1807.6ms，並非完整逐幀影像。
- r47：固定383個r46狀態+75影像分析，共458。可見牆界原型改向17／37筆，原安全變不安全13／24筆；383無牆對照改向0。兩種邊界模型有21筆方向分歧，交叉模型間距退步超過5的反例1／5筆。未升為候選、未開新遊戲。

## 下一步與交接規則
1. 以r46末段及已恢復安全/真獵物反例校驗牆接觸幾何與相機／速度補償。保留r46-370、r46-376交叉模型退步。
2. 裁切大型物件的偵測列表確有不連續；缺同步影像及可靠ID，不能宣稱已確認輪廓合併、分裂或同一NPC。
3. 每輪先固定一項可否證假設與批次，程式保留所有開局、死亡、逾時、中止；未知不當失敗，亦不當成功。有效性與策略勝率分開。
4. 通過必要回歸後才有界桌機對照；小樣本或離線數字不算正式50%驗收。適用的測試改版按批同步GitHub及/ocr-test；此摘要更新不需更改網站策略。
5. 每次更新本文件保留歷史並標示新增來源、環境、樣本數、限制。不得從摘要重造遺失原始證據。

## 證據識別（摘要，不含原始檔）
- 75幀備份SHA256：`932b53f84c6f1a687c060e81154df40082d5a827c1b9060eba221cfc5cccbfaf`。
- recovery備份SHA256：`ac75e7f67ac6e656403be4c2652349dbf8e5e6e07ceb1d8e59344fe9c2ec6046`。
- 本地證據索引：`RESTORE-MANIFEST.json`、`r45-fixed75-result.json`、`r46-summary.json`、`r46-replay-check.json`、`r47/results.json`、`r47/sensitivity.json`。這些原始檔未附在本提交；需向原執行者取得獲授權副本。
- 本地分析commit：r46 `9afbc59`、r47 `e9f29e2`，僅本地倉庫紀錄，不能當本GitHub遠端commit連結。

## 公開測試版歷史摘要（來源保留）
以下逐版摘錄自本分支test043的release-history，核對來源blob如上。這些是歷史聲明，不是本輪重驗；未寫出的環境、死亡或中止數一律未知，不能以總局數反推。舊門檻保留歷史語意，目前有效門檻仍為150秒／50%。

### test-043 · 有界連續畫布影像：取得死亡前新證據

2026-11-18 台灣時間：新增本機診斷記錄器，以12個預配置1200×698畫布保存最近影像，像素容量40.2MB，不含瀏覽器／GPU額外成本。運行中只drawImage，不讀回像素或PNG編碼；停止凍結後才轉檔，既有決策與按鍵記錄保留。非遊戲固定ABBA控制輸出一致，停止拒收通過；兩組各12張不同影像、24/24像素核對通過。短測不證明零干擾。 固定v2.20桌機Chrome156、2000×1163、DPR1，沿用r41控制只加記錄，一局結算63秒死亡、體型126：1開局、0過關、1死亡、0中止。332筆決策、0過期拒絕；控制最大173.7ms、決策間隔最大321.1ms，仍有排程長尾。畫布複製最大32.6ms。停止後按鍵清空，轉檔後HUD未前進。 共採1157張、淘汰1145張、保留12張不同畫面，跨度600.1ms、實際間隔27–90.3ms，非精確20Hz；另5張決策／結算圖，17/17像素核對通過。最後未結算圖到首次可見結算圖49.3ms。新片段可見大型輪廓由左側持續逼近、玩家在右牆旁，末兩次控制仍向右且模型間距為負；不能由此確認吞食者或可逃生路線。下一步只回放已保存決策的無安全方向回退與更早出口，不重跑相同診斷。 本頁僅同步紀錄，公開策略不變；診斷局不作勝率驗收。桌機各版本2:30／50%仍未達標，手機跳過，OCR4未發布。

### test-042 · 死亡轉換逐階段核對：未支持篩選漏判假設

2026-11-18 台灣時間：本版只更新診斷紀錄，公開策略不變。重播r41最後4張同源決策圖及結算圖，5/5原始像素雜湊符合，插樁後偵測輸出與原程式5/5一致。4張決策圖中的13個大型非玩家輪廓紀錄全部保留並對應到已保存決策物件；13筆包含跨幀重複物件，不是13個獨立NPC。no-surface只表示沒有符合補充低密度表面條件，不代表未偵測大型NPC。 覆蓋玩家的巨大連通區只在結算圖可見，距最後決策擷取200.8ms；該連通區也能通過偵測與篩選。固定右側區域的亮色占比從約0.33%變100%，確認畫面轉換，但無法區分生成、成長、遮擋或渲染時序原因，亦無法確認吞食者身分。結算圖其他被刪片段不能倒推為先前死亡原因。 本輪0新增開局、0過關、0死亡、0中止，r41原96秒死亡仍保留。不依此單例放寬門檻或重跑原策略；缺口是最後200.8ms內的同步可見前兆，未形成有證據的新控制候選。桌機各版本2:30／50%目標未達，手機跳過，OCR4未發布。

### test-041 · 候選路徑延後計算與單局實測

2026-11-18 台灣時間：本版補實驗紀錄，公開策略不變。本機候選先評估原方向，只有短程接觸需要替代時才計算其他方向；距離公式、安全門檻及排序不變。固定16樣本、ABBA共64次瀏覽器輸出一致。保留原方向案例耗時中位數21.6→3.8ms、最大57.6→8.4ms；實際改向案例也保留。首次瀏覽器比較因函式作用域錯誤無效，已另存，修正後才比較及實測。 固定v2.20桌機Chrome156、2000×1163、DPR1，候選一局：結算96秒死亡、體型154；488筆決策、0過期拒絕、候選計算最大14.5ms、0次改向。5張保留PNG逐像素核對通過，停止後按鍵清空。共1開局、0過關、1死亡、0中止，不據此宣稱勝率或安全改善。舊r40的8張拒絕影像已淘汰，不能重播原331.5ms當幀；固定樣本效果不代表所有長尾已消失。 候選尚未升公開預設；死亡前4幀皆無危險表面觸發，下一步檢查巨大輪廓偵測與包含過濾的覆蓋缺口，保留真獵物反例。桌機各版本2:30／50%仍未達標，手機跳過，OCR4未發布。

### test-040 · 拒絕時間補齊與有界重新感知

2026-11-18 台灣時間：本版補實驗紀錄，公開策略不變。新增獨立有界拒絕紀錄，保留捕獲、規劃、拒絕、按鍵釋放時間及generation。200ms過期後釋放，只允許釋放後的新影像恢復；連續最多2次、每局共8次重試，不重開遊戲、不套用過期方向。10項本機回歸、12項非遊戲瀏覽器按鍵檢查通過。 固定v2.20桌機Chrome156、2000×1163、DPR1，A/B各一局。A結算70秒死亡、體型79，361筆決策、0過期；B約53秒體型65時第9次過期達上限中止，286筆已施加決策、9筆拒絕。前8筆拒絕形成6次成功恢復，均使用釋放後的新影像，沒有在新決策前送出過期按鍵。B候選改向0次，5筆過期的候選計算168.8–331.5ms，其餘主要耗時在候選計算之前。 共2開局、1有效死亡、1中止、0過關；各5張PNG核對通過、停止後按鍵清空。不把中止當死亡或勝利，不以小樣本推論勝率。候選仍未升公開預設；接續針對已量測的可見表面路徑計算成本改善，保留拒絕及死亡反例。桌機各版本2:30／50%目標未達，手機跳過，OCR4未發布。

### test-039 · 前綴控制整合及有限 A/B：未完成驗收

2026-11-18 台灣時間：本版更新實驗紀錄，公開控制策略不變。新本機候選把感知後舊指令持續區間納入同一路徑的可見表面、NPC與牆界比較；不以未校準速度宣稱安全。非遊戲真實鍵盤事件8項檢查通過。 固定桌機Chrome156、2000×1163、DPR1、v2.20，A/B各一局，皆因控制器時效保護中止：A約59秒體型64、301筆決策；B約32秒體型51、160筆決策，B零次介入。各5張影像轉檔核對通過，停止後按鍵為空。2開局、0完成、0過關、0死亡、2中止；不計作策略勝率，不補跑。拒絕當幀缺精確耗時欄位，已保留影像與採樣metadata。候選未升為公開預設；接續修正拒絕紀錄缺口及有界重感知流程。桌機各版本2:30／50%驗收不變，手機跳過，OCR4未發布。

### test-038 · 保留合格原方向：固定A/B未過關

2026-11-18（台灣）：r28四組事件皆存活至短觀察窗結束、介入後HUD未成長；窗內大於90度轉向分別2／1／2／0次，不能將存活或停滯歸因介入。超額6組缺原圖保持未知，死亡轉換亦不猜測新輪廓來源。 單一候選：原方向已通過同一輪廓gap>0、NPC small>3、牆距>0與畫面已知條件時保留，否則沿用原避讓。固定32張原方向全部重現，候選改7幀且皆更朝向當時目標，8個歷史反例方向不變；不改安全門檻，不以模型當實戰安全。 預先固定v2.20桌機Chrome156、2000×1163、DPR1，A/B各一局、隨機開局、150秒上限、不補跑。A73秒死亡、體型78；B72秒死亡、體型116。合計2開局、0過關、2死亡、0中止。A372筆／17次輪廓檢查／3次改向；B391筆／55次檢查／13次改向，另25筆保留合格原方向。條件確實生效，但兩局非配對，不推論勝率或因果成長改善。 A21張、B33張PNG像素核對全符，按鍵清空、缺漏欄空；事件上限外仍明列，非全局影像。B最大控制427.5ms，長尾未消失。候選不升公開預設，本頁辨識test-033、規劃test-026維持；手機跳過，OCR4未達桌機各版本2:30／50%不發布。

### test-037 · 有界事件前後影像保存

2026-11-18（台灣）：r26的19次介入只有3次保留原圖；離線400ms重驗原型只改1/32幀、餘量1.08像素且下一幀轉負，8個反例不變，未據此開策略批次或升預設。 記錄器改為最近8張，加上最早4組介入起點各前2張／當下／後3張，另存終幀，RGBA總上限仍110,563,200 bytes。超額事件計數、停止前未補齊標缺漏，不替換早期事件。45項檢查及瀏覽器16張PNG核對通過；固定ABBA各200次複製最大17.2–26.3ms，僅非遊戲負載，不宣稱實戰性能提升。 限定v2.20桌機Chrome156、2000×1163、DPR1一局，原r24-B控制器不變：88秒死亡、體型138；1開局、0過關、1死亡、0中止。456筆決策、46次輪廓檢查、22次介入；四組事件起點31／354／363／371，各6張影像完整、時間及決策一致，另6次事件因上限未保存。最近8張加事件24張及終幀，共33張PNG像素雜湊一致；424張淘汰明列。 最大控制292.4ms、複製27.6ms，仍有長尾；停止及轉檔後按鍵清空、HUD未前進。只驗證事件保存，不推論勝率或策略改善。本頁公開辨識test-033、規劃test-026維持；手機跳過，OCR4未達桌機逐版2:30／50%不發布。

### test-036 · 有界記錄器完成單局，未證明策略改善

2026-11-18（台灣）：前輪B的125筆只有1筆窄通道、0筆匹配前態；額外擷取75.7ms觸發記錄器中止，不能算策略死亡。非遊戲ABBA共用影像短測未重現長尾，未宣稱根因修復。 本輪記錄器採32張控制同源影像環、1600筆metadata及獨立結算終幀，停止後才轉PNG。18項本機檢查與瀏覽器上限／回讀通過，控制器與r24-B逐位元相同。限定v2.20桌機Chrome156、2000×1163、DPR1一局：56秒死亡、體型75，1開局、0過關、1死亡、0中止；309筆決策、46次輪廓檢查、19次改向。這不是配對策略比較，不能推論勝率改善。 末段32張加1張終幀，33/33 PNG像素雜湊相符；277張環形淘汰明列，非全局逐幀影像。RGBA上限110,563,200 bytes，不含物件、PNG及轉檔暫存。最長控制240.8ms、複製61.0ms，仍有長尾。停止及轉檔後按鍵清空、HUD未前進，缺漏欄空。約200ms取樣不能解答50ms級死亡轉換。 本頁僅更新紀錄，辨識仍test-033、規劃test-026，候選未升預設。手機跳過，正式OCR4未達桌機逐版2:30內至少50%不發布。

### test-035 · 可見輪廓整合：候選尚無實戰效益證據

2026-11-18（台灣）：出框NPC的圓形估計可能假重疊，也不能統一縮小半徑。候選以可見大型前景及玩家掃掠圓檢查通道，畫面外與小地圖遮擋保留未知；只在持續縮窄時短步重算，保留原小型威脅與牆界檢查。8張固定圖在JavaScript及Chrome逐像素一致，共6,700,800像素；兩張已貼身反例仍阻擋、正常對照不改向。離線僅1張改向，不代表實戰安全。 限定v2.20桌機Chrome156、2000×1163、DPR1，A/B各一局：A於70秒死亡、體型96，354筆決策；B約25秒、體型38時採樣75.7ms超過既有75ms記錄器保護而中止，125筆決策、0次輪廓檢查與改向。共2開局、0過關、1死亡、1中止；不替換樣本，中止不算死亡或勝利。這是記錄器中止，不是策略已證明失敗或改善。 兩組各32張觀測及12張決策圖像素雜湊一致，停止後按鍵清空，預覽釋出。原始記錄器version字串沿用r17，實際A/B程式以批次路徑與SHA256核對，原檔不竄改。候選未升預設，本頁辨識仍test-033、規劃test-026。手機跳過，正式OCR4未達桌機各版本2:30／50%不發布。

### test-034 · 早期出口對照：尚無實戰效益證據

2026-11-18（台灣）：固定425筆決策，原方向後續出口不超過2、替代至少4且不降低即時模型間距時才改向，共4個介入點。28個固定正反例以相同1.7秒時窗比較，含20%尺寸擴張壓力情境；這是模型檢查，不是實際安全或勝率。 v2.20桌機Chrome156、2000×1163、DPR1，固定A/B各一局：A約40秒、體型69時因採樣119.1ms超過75ms記錄器保護中止，不算死亡或勝利；B24秒死亡、體型48，120筆決策中介入0次。共2開局、0過關、1死亡、1中止，不替換樣本，不能形成完整局效益比較。 兩組各32張觀測與12張決策影像像素核對通過，停止按鍵清空。候選不升預設；辨識維持test-033、路徑維持test-026。手機跳過，正式OCR4未達桌機各版本2:30／50%，不發布。

### test-033 · 重疊近身威脅辨識修正

2026-11-17：已重現紅色NPC輪廓及標籤辨識成功，卻被較大輪廓的中心距離包含過濾刪除。測試版僅豁免有標籤、與外層色相差超過22度、半徑達玩家0.98倍的輪廓；小碎片仍過濾，路徑規劃沿用test-026，不疊加提前退牆。 固定99張瀏覽器原圖回歸：1078個原始輪廓，保留數919→923；新增4個經原圖確認的紅色NPC，原保留物件刪除0，舊75張含Orange真獵物輸出不變。4張來自同一NPC軌跡，不能宣稱獨立準確率；無條件豁免標籤會多保留13項，故未採用。 限定v2.20桌機Chrome156、2000×1163、DPR1單局：68秒死亡、體型75，0/1過關、0逾時、0中止。343筆決策及時間核對一致，15張定期／結算圖與12張同源圖保存，像素雜湊12/12一致、按鍵清空。最後原圖到結算195.7ms間出現新青色大型威脅，來源未知；本修正解決特定漏判，尚未證明勝率改善。手機跳過，正式OCR4未達桌機逐版2:30／50%，不發布。

### test-032 · 退牆與 NPC 間距對照

2026-11-17：原提前退牆候選在固定1539筆中改向13筆、8筆降低預測NPC間距，未採用。修正版僅在不降低原方向預測NPC間距的替代方向中選最高收益，避免下一0.2秒跨入既有牆邊保留區；固定樣本改向8筆、0筆降低間距，但8筆降低預測收益。 事前限定v2.20桌機Chrome156、2000×1163、DPR1一局探索：70秒死亡、體型78，0/1過關、0逾時、0中止。361/361筆決策精確重播，5次實際介入，16張定期／結算PNG及最後12張同源圖保存，12/12像素雜湊一致，停止按鍵清空。可見牆距低於原保留門檻採樣0筆，但仍死亡，不能當作改善或安全證明。 最後圖中近身紅色NPC未列入兩個已保留NPC，需核對輪廓包含過濾；約100.8ms後結算圖新增橙色威脅，來源未知。單局及非配對歷史對照不能推論勝率，候選不升預設，控制仍為test-026。手機跳過，正式OCR4未達桌機各版本2:30／50%，不發布。

### test-031 · 決策同源影像診斷

2026-11-17：診斷工具保留最近 12 張實際辨識用 ImageData，停止後才轉 PNG；40.2 MB 固定像素上限，預檢及實戰各 12/12 張解碼像素雜湊一致。此記錄器只用於診斷，公開控制策略仍為 test-026。 桌機 v2.20 固定 1 局：43 秒死亡、體型 66，0 過關、0 中止；218 筆決策完整保存。最後同源影像未見近身巨型藍色 NPC，約 190.7 ms 後結算影像可見該威脅。中間沒有影像，不能確認生成或移動原因；不能據此宣稱辨識、安全或勝率改善。手機跳過，OCR4 尚未驗收。

### test-030 · 同幀輪廓漏判假設被否證

2026-11-17 · 固定兩張既存PNG，以Chrome156原瀏覽器辨識流程回放。死亡圖中的大型青色NPC有被保留，半徑估計923、裁切風險半徑973；輪廓與牆線連接導致包圍框偏大，不是該圖被過濾。前一張相隔2.289秒，未見此大型輪廓。 最後決策擷取至結算圖請求141.8ms；擷取至按鍵25.3ms，最後20筆計算最慢46.3ms。這不能證明最後畫面內容一致，也不能確認生成或瞬移原因；缺少最後決策的同步原圖。保留未知，不盲改避險策略。本輪新增遊戲0局，沒有新增勝負或驗收數；手機跳過。 下一步需在停止後保存有界的決策同源影像，核對死亡轉換。此更新僅補診斷紀錄，控制仍為test-026；桌機各版本2:30／50%未達，OCR4未發布。

### test-029 · 避險退出遲滯探索

2026-11-17 · 固定613筆影子比較：A軌跡0筆方向改變，B軌跡6筆改變，其中5筆預測收益降低、模型間距未降低。離線結果不代表實戰安全。 新候選維持原進入門檻，退出避險門檻改為1.5倍玩家半徑。v2.20桌機 Chrome156、2000×1163、DPR1，事前限定一局探索：0/1過關，72秒死亡、體型84，0逾時、0中止。362筆決策重播一致，16張PNG完整；11幀避險、5次進入。歷史對照不是配對試驗，尚無改善證據，不採用候選，預設仍為test-026。 末段模型間距仍為正卻死亡，下一步檢查威脅辨識／預測與死亡轉換，不盲目延長避險。每5秒及結算留圖無法定位每個200ms轉換。手機跳過；桌機2:30／50%未達，OCR4不發布。

### test-028 · 擁擠時優先間距：A/B 未達標

2026-11-17：單一假設為「當八個方向的預測間距都不足一個玩家半徑時，在原安全與牆界候選池內優先選最大間距」。固定346筆精確回放改向15筆，其中13筆降低預測收益；模型間距增加3.5–55.8，但不能當成實際安全改善。原75幀對照改向1筆。 預先固定v2.20桌機、Chrome156、2000×1163、DPR1，正常隨機A/B各一局，上限150秒，不替換失敗。原版A：63秒死亡、體型84；候選B：58秒死亡、體型120。各0/1過關，共0/2、2死亡、0到期、0中止。B有10/291筆方向不同，確實介入；未配對、小樣本，不能推論勝率提升或因果傷害。 613筆決策及27張原圖完整保留，停止後按鍵清空。候選不升為本頁預設策略；目前控制仍為test-026，加上test-027可選記錄。接續分析既有失敗，不原樣擴大此候選。手機跳過，/ocr4未達桌機驗收故不發布。

### test-027 · 可重播記錄與桌機測試狀態

2026-11-17：補記控制器實際使用的 HUD 速度估計、RGB、原方向、不可變規劃輸入與輸出、影像擷取起訖時間。速度不是隱藏真值，擷取時間不是渲染時間。可選擇啟用並匯出最多1600筆，超出筆數明列，不上傳。 991筆序列化回歸通過；v2.20桌機單局69秒死亡、體型89，346/346筆決策精確重播，15張實驗影像完整，0中止。先前恢復測試：v2.13在150秒到期、體型115；v2.21在46秒死亡、體型63。這些是恢復與診斷樣本，不是驗收或改善證明。手機依指示跳過，並非通過；v2.22桌機恢復實測待完成。 保留test-026策略；「預測成長不得消除現有威脅」候選在死亡局未改向，未採用。桌機各版本仍須2:30內至少50%；/ocr4未發布。GitHub測試分支test/ocr-test，發布另記Sites版本與來源commit。

### test-026 原遊戲96局結果 · 未達標

2026-11-15 13:59台灣時間完成。v2.13 A1/12 B1/12；v2.20 A0/12 B0/12；v2.21 A0/12 B0/12；v2.22 A2/12 B1/12。全部96局有效，B死亡依版2/12/12/6。固定種子診斷的4/4沒有外推至原遊戲，未達逐版50%門檻，不進獨立確認、不發布OCR4。正式OCR3保留。 已核對原遊戲測試只讀畫面與HUD，沒有診斷seed、邏輯時鐘或遊戲內部狀態。證據為PNG截圖與JSON，沒有影片。

### test-026 · 可吞食尺寸判斷校準

2026-11-14 · 單因子：可吞食半徑比例0.91→0.94；危險判斷0.98、邊界與距離不變。事後隔離校準發現部分可吞食NPC尺寸被高估而漏選，控制器仍只讀畫面與HUD。 固定種子診斷四版各A/B四局，v2.13 A1/4 B4/4；v2.20及v2.21各A0/4 B0/4；v2.22 A0/4 B1/4。這些改變時序的診斷不是正式驗收、不可稱原遊戲勝率。接續四版原遊戲96局篩選，各版A/B12局，再依原條件進獨立確認；全部達標才發布OCR4。

### test-025 完整96局結果 · 未達標

2026-11-14 00:41 台灣時間完成。v2.13 A3/12、B2/12；v2.20 A0/12、B0/12；v2.21 A0/12、B0/12；v2.22 A1/12、B1/12。全部96局有效，B死亡依版2/12/12/9局。小地圖威脅懲罰未改善，不進獨立確認、不發布OCR4，OCR3不變。接續以既有失敗影像與配對種子進行診斷，不以診斷取代原遊戲驗收。

### test-025 · 小地圖危險群聚評分

2026-11-13：只新增小地圖紅點群聚懲罰，範圍1600、權重20，評估原2秒路徑終點。基線回到test022；吞食0.91、威脅0.98、1.1秒風險時窗、距離及牆距均不變，不堆疊失敗修改。既有96局中minimap成功讀取約97–99%，v2.20/21近處紅點隨時間增多；此為關聯非因果。離線37–43%改向，未證明實際勝率。新固定四版本96局，每版A/B各12。

### test-024 · 四版本96局完成，未通過

2026-11-13 21:39台灣：v2.13 A3/12、B4/12；v2.20與v2.21各A0/12、B0/12；v2.22 A2/12、B1/12。B死亡依序0、12、12、5，無基礎設施失敗。未達逐版50%，不進獨立確認、不發布OCR4；原始結果與摘要保留。

### test-024 · 風險時窗與收益時窗一致

2026-11-13：只把風險預測由1.1秒延長到2秒，收益原已看2秒；恢復test022原0.98威脅閾值，吞食0.91、距離保護與牆距不變，不混入厚度或裁切輪廓修改。既有48個A局離線回放，四版本原選方向在後段預測碰撞的狀態各290、248、316、423筆；只是模型預測，不是實際勝率。新固定96局、每版本A/B各12；全部符合篩選才各40局獨立確認。未達標不發布OCR4。

### test-023 · 四版本96局完整結果，不採用

2026-11-13 18:33（台灣）：A為原0.98，B為1.04，各版本各12局。v2.13：A3/12、B2/12；v2.20：A0/12、B0/12；v2.21：A0/12、B0/12；v2.22：A0/12、B0/12。B死亡數依序2、12、12、6，A為0、12、12、3。固定96局完成，無無效樣本。B未見改善，不進獨立確認、不發布OCR4；不把樣本差異當因果傷害證明。 B的Wilson95%區間：v2.13為4.7%–44.8%；其餘各0%–24.3%。後續先分析裁切巨型NPC幾何與邊框厚度；維持現有OCR3與其他版本。

### test-023 · OCR4候選：2:30與威脅尺寸單因子

2026-11-13：新目標150秒內至少50%。舊20局重算僅5/20，不視為新測試。單一變更：NPC威脅半徑閾值0.98改1.04；吞食0.91、距離保護、紅標籤、裁切與牆距不變。實際版本v2.13、v2.20、v2.21、v2.22，各固定24局交錯A/B各12作篩選；候選必須逐版本改善並達樣本50%，再各獨立40局確認，分別報告95%區間。不以合併勝率替代，全部版本通過才發布。未達標不發布OCR4。現有OCR1–3不覆蓋；達標後新增/ocr4及/ocr索引說明與連結。

### test-022 · 3:00 完整驗收與正式升級

2026-11-13：NUC Firefox headless、正常隨機開局、1280×900視窗、v2.13遊戲。首批5/8成功；另預先固定12局確認完成8/12成功（66.7%），1死亡、3逾時，無基礎設施無效樣本；合計13/20（65%）。以本局You win與結算時間≤180秒判定，未改遊戲規則與策略安全閾值。固定種子、離線回放與PNG診斷均不算驗收。小樣本觀察率不保證未來勝率，僅支援本條件下至少50%的樣本驗收。

### test-022 · 驗收門檻更新為 3:00

2026-11-13：依使用者指示，驗收改為 180 秒內過關率至少 50%；僅修改計時判定與顯示，策略、安全門檻及遊戲規則不變。另開固定八局正常隨機開局測試；舊 110 秒到期資料不能推定 180 秒結果，固定種子診斷不列入正式過關率。此批完成前不宣稱達標，正式 OCR3 不變。

### test-022 · 食物目標牆邊可行性

2026-11-13：單一變更，以test021為對照，將接觸位置可行性檢查延伸至食物，沿用原食物接觸半徑。NPC安全與牆邊門檻不變。離線19筆阻止朝牆的改向中，18筆原軌跡兩秒內重返恢復；此非實際勝率。固定八局ABBAABBA完成：A 0/4、B 0/4，皆超時無死亡，平均末端大小120.5／117.75。未達標，維持低於1:50與至少50%門檻，正式版不變。

### test-021 · 目標牆邊可行性

2026-11-13：以test010為對照，只在選擇可見NPC前排除最近接觸位置仍落在原牆邊禁區的目標；不改方向、安全距離及食物策略。離線2590狀態回放有230次方向變更，未見安全退化，但不代表實際勝率。固定八局ABBAABBA：A 0/4、B 0/4，均超時無死亡；平均末端大小 A 82.75、B 118.5。未達標且樣本未配對，不能宣稱策略改善。保留低於1:50及至少50%門檻，正式版不變。

### test-020 · 牆邊雙門檻

2026-11-13：以test010為對照，進入恢復門檻不變，離開需多80距離；各牆獨立記錄、每局重置，NPC安全距離不變。固定軌跡曾反覆跨越門檻6次，雙門檻只是待驗證假設。固定八局ABBA完成：A 0/4、B 0/4，全部逾時；平均結束體型102／81.5，未達標。低於1:50過關率至少50%才更新正式版。

### test-019 · 有界短動作保持

2026-11-12：以test018為對照，替代捕食方向最多保持300ms，若新安全／牆邊條件不允許或體型變更則立即取消。逐次診斷549筆、28次介入中15次在預測接觸前轉向；這不是因果證明。固定八局ABBA完成：A 0/4、B 0/4，全部逾時；平均結束體型91.25／106.75，未達標，不宣稱改善。低於1:50過關率至少50%才更新正式版。

### test-018 · 合規接觸替代方向

2026-11-12：以test010為對照，只有原目標無兩秒內合規接觸、其他獵物有接觸時才改方向；保留原NPC安全與牆邊限制。離線74筆符合情境，不代表實際捕食。固定八局ABBA完成：A 0/4、B 0/4，全部逾時；平均結束體型93.5／117.5，未達標，不宣稱改善。低於1:50過關率至少50%才更新正式版。

### test-017 · 玩家輪廓誤判修正

2026-11-12：既有148張影像中，兩張14×2輪廓被誤判並選為NPC。以test010為對照，只排除玩家1.3倍半徑內、長寬比低於0.25的細長物件；保留正常近身獵物。固定八局ABBA完成：A 0/4、B 0/4，各1死3逾時；平均結束體型84.25／107.5，未達標，不宣稱改善。低於1:50過關率至少50%才更新正式版。

### test-016 · 牆邊切向移動

2026-11-12：以test010為對照，只允許牆邊切向移動，保留向內加分、距牆門檻與NPC安全過濾。離線130筆近獵物方向偏離中127筆處於牆邊恢復；此關聯不是因果證明。固定八局ABBA完成：A 0/4、B 0/4，全部逾時；平均結束體型95.25／97.25，未達標，不宣稱改善。低於1:50過關率至少50%才更新正式版。

### test-015 · 獨立位移共識

2026-11-12：以test010為對照，只改靜止食物相機位移的匹配方式。採不依賴速度預測的位移投票與一對一配對，至少6個一致點才採用，否則保留原方法。NPC補償、策略權重與門檻不變。 重要修正：先前大量估計目標切換混入身分配對誤差。離線1295段中，新配對695段可唯一匹配、633段保持同一獵物，近距離仍可吃卻切換僅6段。這仍非真實身分標註，也不是勝率證明。固定八局完成：A0/4（1局死亡、3局到期），B0/4（4局到期）；平均結束前HUD體型A88.5、B126.5。B的864個決策採樣中765個使用共識、99個回退，證實介入生效；仍未達50%，不能以小樣本末端體型差異宣稱穩定改善。正式OCR3不更新。

### test-014 · 邊界距離消融

2026-11-12：以test010為對照，只把距牆門檻260+0.75×體型恢復早期體型+90；保留牆線辨識、邊界方向過濾及NPC安全距離。未堆疊test011–013未獲支持的策略。 3449筆HUD速度離線回放中，296筆方向改變、234筆預測收益較高；截圖可見牆邊獵物。這不是實際過關率。固定八局完成：A0/4、B0/4，兩組各1局死亡、3局到期；平均結束前HUD體型A124、B134.5。未達50%，不能用末端體型差異宣稱穩定改善；正式OCR3不更新。

### test-013 · 有界資訊探查

2026-11-12：以test012為對照；體型至少60、8秒成長少於3、無2秒內可達的已確認獵物時，探查2秒內可進視野的小地圖點。探查最長2秒、之後冷卻6秒，108秒後不啟動。安全過濾保留；未知目標不計吞食收益。 離線11條軌跡0–4次可觸發，既有01:47成功局不觸發；這不代表已提高過關率。固定八局完成：A0/4（4局到期），B0/4（1局死亡、3局到期）；平均終點體型A108.75、B110.5。B四局皆有探查採樣，但未轉化為過關；小樣本不代表穩定性能或安全性改善。正式OCR3不更新。

### test-012 · 小地圖尺寸不確定性

2026-11-12：以test011為對照，移除小地圖NPC半徑強制限制為玩家0.85倍及虛構吞食收益。遠方點保持未知尺寸、預期成長0，只保留相當一份食物的探索價值並依旅行時間折減；進入視野後才用實際辨識判定可吞食。 原始規則核對：非紅點可達玩家1.12倍，並非都能吞食。安全門檻、探索啟用體型60與相機補償不變。固定八局完成：A0/4（1局死亡、3局到期），B0/4（4局到期）；平均終點體型A86.5、B88.75。B只有1個採樣選到小地圖目標，表示探索幾乎被壓制。修正未知尺寸的錯誤假設，尚未帶來性能改善；不得宣稱安全性或過關率提升。正式OCR3不更新。

### test-011 · 提前探索NPC

2026-11-12：以test010為對照，僅將本地目標為普通食物時的小地圖探索門檻，由體型140改為60。安全過濾、收益評分及相機補償不變。 test010失敗B局在體型60–139追食物有32/73/50個樣本，成功局僅5個，且幾乎都有小地圖機會點；這是相關證據，不是因果證明。有效八局結果：A 0/4、B 0/4，皆110秒到期；平均終點體型 A94.25、B98.25。原第3局在0.001秒無HUD且未啟動，保留為基礎設施無效樣本；加入載入就緒檢查後只補跑該B局。B局確實有16–49個小地圖目標樣本，但未轉成過關。小樣本不代表穩定勝率，正式OCR3不更新。

### test-010 · 區間相機補償

2026-11-12：NPC速度追蹤以靜止食物的影像區間平均位移補償，不再直接混入玩家終點預測速度；玩家速度、策略分數與安全門檻不變，無可靠匹配時保留原估計。 同步148張影像校準，147對獨立位移共識與原速度中位差32 px/s；區間平均與終點速度本就不同，不能把全部差異視為錯誤。固定八局 ABBA 已完成，以test007作對照：A 0/4、B 1/4（25%，成功局01:47），其餘七局到期，無死亡；未達50%門檻。成功以可見You win及結算時間判定，結束前HUD196並非最終體型。小樣本不代表穩定過關率，正式OCR3不更新。

### test-009 · 目標持續性

2026-11-12：以相機速度補償位置、半徑與分類匹配上一個目標，給予 2 倍分數。僅改目標選擇，安全過濾與方向慣性不變；以 test-007 作對照，不沿用未見效的追逐預測。 前輪八局有 101–150 次估計目標切換，且均未死亡但成長不足；匹配是啟發式，不是因果證明。固定八局 ABBA 完成：A 0/4、B 0/4，全部 110 秒到期，無死亡；平均終點體型 A 123.5、B 99。估計目標切換 A 511/863、B 508/861，未見明顯減少。此假設未獲支持，不升正式版；不得以小樣本推定母體過關率。

### test-008 · 追逐路徑預測

2026-11-12 · 單一假設：較大型、已追蹤的 NPC 會轉向追逐玩家；保留直線預測，採兩種路徑中較小的安全間距。食物收益、辨識與 200 ms 決策頻率不變。 固定既有資料 964 筆離線回放，30 筆決策改變，數值皆有效；這不是過關率驗證。2026-11-12 固定 ABBAABBA 八局完成：A 組 0/4、B 組 0/4，全部為 110 秒到期，沒有死亡；平均終點體型 A 132、B 105。這輪主要問題是成長速度，未證明追逐預測有改善，正式 OCR3 不更新。普通隨機開局、非配對種子的小樣本，不能推定母體過關率。

### test-007 · 邊界保護

2026-11-11 實驗紀錄 · 小地圖無法讀取時，以可見牆線補判邊界；危險邊界禁止追獵覆蓋逃離決策。 A 組 0/3；B 組 0/3。批次未完成，僅有 6/8 筆；未達驗收。

### test-006 · 多步路徑搜尋

2026-11-11 實驗紀錄 · 以多步路徑搜尋比較移動方案。 A 組 0/4；B 組 0/4。小樣本探索，未達驗收；不代表穩定過關率。

### test-005 · 分類追蹤

2026-11-11 實驗紀錄 · 對位置與半徑一致的既有 NPC 保留最長 0.8 秒分類。 A 組 0/4；B 組 0/4。小樣本探索，未達驗收；不代表穩定過關率。

### test-004 · 轉向慣性

2026-11-11 實驗紀錄 · 提高轉向慣性權重，減少急轉。 A 組 1/4；B 組 0/4。小樣本探索，未達驗收；不代表穩定過關率。

### test-003 · 辨識解析度

2026-11-11 實驗紀錄 · 提高辨識解析度至 2000，以檢查小 NPC 被誤判為食物的情況。 A 組 0/4；B 組 0/4。小樣本探索，未達驗收；不代表穩定過關率。

### test-002 · 決策頻率

2026-11-11 實驗紀錄 · 決策週期由 200 ms 改為 100 ms。 A 組 0/4；B 組 0/4。小樣本探索，未達驗收；不代表穩定過關率。

### test-001 · 基準

2026-11-11，NUC 基準測試 1/4 成功。小樣本，尚未證明至少 50% 達標。

