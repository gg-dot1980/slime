# r83 — shared wall trajectory audit and new observation hypotheses

0newgames/wins/deaths/aborts. No publicstrategy/OCR4/Libraryupload. Mobile skipped; preview stopped. Full desktop per-version150s/>=50% target remains unmet.

## Wall findings
Current gain and threat evaluation already use the SAME x/y trajectory; both lack position clamping. Not two separate paths. Prefix guard uses continuous integration vs main0.1sdiscrete step; threat horizon1.1s and gain2s differ. Earlier r47 clamp cleared normalvelocity; game source clamps position but retains normalvelocity. r54observed13contact intervals support tangential motion/inertia,not exactcalibration. Those findings reused,not repeated as new.

Frozen347r82states:10development,2failure,335independentA. Two diagnostics add shared visible-wall clamp to gain/threat andprefix, fixedinitialHUDradius, retaining versus zeroing wall-normalvelocity. All347baselineoutputs exact. Both variants choose same direction on everycase:0developmentchanges,2failurechanges,1independentchange. Thus retainedvelocitysemantic difference does not establish newexitbehavior here.

B311SE: constrainedclearance−40.213 vsold−13.502;B312SE−62.867 vsold−6.854;B312gain5.536→4.745. BothchooseNW, but NWstillnegative−17.645/−21.437; cannotclaimsafeescape. IndependentA301N→NW predicts gain1.001vs.627,clearance319.756vs312.311, butminWall−1.35 afterprojectedgrowth; originalNWwall−125.398. Fixedinitialradius clamp plus projectedgrowth causes remaining wall-margin inconsistency. Neither candidate is ready for live control. Developmentchosen-pathgain unchanged10/10; chosen-pathclearance changes1/10. No previouslysafechosenpathbecomesunsafe inthis347set; thatdoesnotvalidateallpaths orrealgame.

Do not rerun oldr47 asnewcandidate. Next wall correction must use one explicit trajectory/radius state consistently in prefix,gain,threat andwalls, preserve thesefailurecases and independentA301growthcounterexample; no thresholdtuning toforceexit. Source semantics support retaining velocity but browser timing/perception uncertainty remain.

## User observations incorporated
See OBSERVATION-NEXT.md for maintaining distance while tangentially observing, time/distancecaps, multi-frameidentity and immediateexit onwalls/otherthreats/shrinkinggap. Designonly,not implemented or livevalidated. Existingrecordingshave no controlledorbit; cannot measure its efficacy.

`rules-check.py` verifiedsourceatcommit5a1aca6442194b6348ed5554eb65f827026811c3 forv2.13,v2.20,v2.21,v2.22. AllrequireNPC>player*1.08 when choosingchase, reconsider targetevery.55–.9s; food/hunt/drift canapproachplayerandstaletargets canpersist. Apparentapproachdoesnotprovechase/currentlargersize. Sourcefiles andhashespreserved; not claimedcurrentdeployedsiteverification.

Allfourversions use strictcontactdistance<.72*(sumradii), player>=NPC*1.08 eats, NPC>=player*1.08 kills, otherwise neutral.40numericalrulecases pass,notactualcollisiontests. Neutralband(player/1.08,NPC,player*1.08) usestrue radii; outlineestimation/growth/split unknown. No avoidance relaxation or pursuittrue-state reads. Current.94preycutoff exceeds1/1.08, a concrete ambiguity forfuturefixedtests.

## Reproduction
`node r83/analyze.cjs` regenerates retain/zero prototypes andallcandidate metrics fromsaved347inputs;no dependencies. `python r83/rules-check.py` checks4sourceversions/40cases. Node24.22.1,Python3.12.14,host55a6111fa095. Clean-directory numeric replay verifiedsamehost;notindependentOS/browser. Fullr80originalcontroller/game/build/recorders bundledunchanged forrestart; see r80/README.md. Images intentionallyexcluded; pixeltruth cannot be recreated fromhashes. No randomgameexactreplay claim.
