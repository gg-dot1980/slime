# grow-7: conservative near-size white marker exception

Base Sites v179 / source 8ef14bf2d4bc7ed602204bc5150d1a6fbfe36df1. GitHub grow-6 separately synchronized at 46b8aa3f8207ed03bc89c84c6ed896a23bcd5601. This draft is not a GitHub grow-7 publication.

All four bundled source versions v2.13, v2.20, v2.21, v2.22 render player green radius3; NPC radius clamp(r/38,1.2,3); red above player*1.12; HUD floor(player radius). Thus equal green/white pixel diameter is NOT an edible-size test. Runtime uses visible pixels/HUD only.

B at HUD>=90: compact unmixed white component exact pale core area produces conservative size estimate 38*sqrt(core*.98/pi)/pixelRatio. The .98 rounding allowance is empirical, not a mathematical or cross-browser guarantee. Minimum-clamped size<=45.6 is unusable. If estimate>=.9*(HUD+1), exclude that white from pursuit, retain hazard padding and penalize approaching it. Otherwise preserve grow-6 pursuit; unknown is not a new size assurance. No main-body pairing/fallback, hidden state or altered game physics. Saturation, camera tint, AA and overlap sharply limit coverage. A/below90/red/walls/missing-map and near-green small markers retained.

Commands from full checkout:
```
node scripts/check-grow-size-bound.cjs
node scripts/check-grow-close-dot.cjs
node scripts/check-grow-map-authority.cjs
node scripts/check-ocr-grow.cjs
node scripts/build.mjs
node scripts/check-grow-versions.mjs 8ef14bf2d4bc7ed602204bc5150d1a6fbfe36df1
```

Browser-fixture.html is standalone synthetic test code, not routed in deployment. It embeds actual current marker/planner/tick/key functions and original four-version minimap drawing snippets. ReadImage is a controlled adapter with synthetic hostile body hypotheses: this does NOT test full natural-game perception. Canvas cases: 4 versions * 4 scales (1/1.5/2/3) * 3 subpixel offsets * 4 HUD values (90/96/120/180) * 4 ratios (.5/.75/1/1.1)=768. Chrome156 on Linux:364 resolved small pursued,20 small unresolved,68 near-size avoided,316 near-size unknown; dispatched keys matched direction and missing-map release passed. None of the tested estimates exceeded their known synthetic radius. At scale1 all tested near-size examples remained unknown; no claim that all similar dots are detected. 390 CSS px content and simulated backing scales are not an iPhone test. Source clamp bounds imply high HUD saturation cannot identify near size.

Node regressions:16 new rule/source checks,19 close-dot checks,31 map-authority,11 original planner. Map-authority white test radius changed98 to60 because the new requested exception intentionally avoids near-sized white; hostile main-body hypotheses retained. Prior grow-6 test is preserved in git. This is not quietly unchanged acceptance.

Observed fixture failure: near-size hazard could continue east due old-heading bonus when predicted gap97.7; new nearApproach penalty resolves it without changing other threats. Subpixel tiny markers can be rejected:20 cases retained unresolved, not invented targets.

Natural games0; no wins/deaths/acceptance inference. No private images, object measurements, personal links or fixture hooks in deployment. Only /ocr-grow public response changes; all other routes and no-score copies must match baseline before deployment. grow-7 GitHub scope awaits separate confirmation.
