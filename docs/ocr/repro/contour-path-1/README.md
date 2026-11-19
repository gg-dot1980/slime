# contour-path-1 — offline visible-surface continuity

Base test/ocr-test `651ce8918080f1a693b9adcf6b3fd6e427606986`, Sites166. Diagnostic only, not adopted. Public executing controller remains perception test-033 / planner test-026; test-043 was the previous public diagnostic label, not a new planner. No hidden game-state input, external screenshot, Playwright, new game, or shared browser/preview use in this analysis.

## Fixed evidence and result

See protocol.md frozen before execution. Twelve decision-source Canvas PNGs from three saved runs: new447–451, success209229–232 and success161143–145. All57 recorded NPC observations retained. Twelve additional cropped images from the prior round were not reused because they lack aligned object association. This is offline lossless-PNG replay, NOT a fresh browser ImageData test.

Node's PNG decoder RGBA hashes independently matched Pillow for12/12 inputs. The pure JavaScript surface core supports ImageData-shaped input. Fixed hue connectivity generated 43 temporal association checks:31 unmatched,6 unknown pairs,6 provisional pairs. Unknown reasons overlap:33 no surface,22 clipped,8 player overlap,4 multiple surfaces,4 shared components. These are method outcomes, NOT missing real NPC counts.

Only1 provisional pair was large in both frames:success161144→145, path-gap proxy increased16.18source pixels, with heading change. The other5 pairs were smaller. No3-frame large approaching chain,0warning runs,0independent actionable alternatives. Every provisional pair lacked all four known wall distances. The candidate gate failed; no controller modification or live A/B. New starts0 / wins0 / deaths0 / timeouts0 / aborts0. No victory percentage is defined.

## Interpretation and limits

This extraction often cannot map a center/quarter-radius sample to a unique hue-connected body; color gradients, outline geometry and merged surfaces remain unresolved. It does not establish the true collision NPC or that no early avoidance was possible. Relative surface motion includes camera motion. The0.4s straight segment is a stationary-surface path proxy, not validated inertial prediction; no safety proof or improvement claim. Heading-change and success-contact counterexamples are retained. There is no basis to lower thresholds, force retreat, or count repeated frames as independent support.

Next useful hypothesis: associate visible outer arcs to tracked instances rather than seed body centers, while preserving merged/clipped unknowns and successful-contact controls. First determine whether available pixels provide stable arc correspondences; if not, stop this identification route rather than repeat terminal capture. No optional candidate is enabled.

## Reproduce

Linux cloud executor, Node24.22.1, Python3.12.14; precise model/reasoning strength not displayed. No new browser or device performance measurement. Existing source game records: v2.20 diagnostic and historical success-contact controls; this round does not revalidate historical deployments or random seeds.

1. Obtain the three authorized local files listed in prepare.py. They contain images and are intentionally absent from GitHub. A public-only checkout cannot reproduce pixel results.
2. `python3 prepare.py --root /path/to/local-evidence --output input-local.json`
3. `node --check surface.mjs` and `node --check replay.mjs`
4. `node replay.mjs input-local.json result-noimages.json`

No npm dependency or install, no server, no key dispatch. First execution failed from a missing function closing brace; fixed before any result, no sample/threshold change. Source and numeric output retained. Decoder supports8-bit RGB/RGBA noninterlaced PNG only, rejects other formats. Independent RGBA comparison checks these specific saved images, not browser color-space equivalence generally. Full numeric output contains no image/contour pixel arrays.

## Publication

Only test-branch documentation, replay source/numeric results and /ocr-test summary are eligible. Formal /ocr,/ocr3,/ocr4 and database/leaderboard code remain unchanged. See publication.json for verified synchronization and remaining visible-behavior checks; no formal acceptance claim.

Independent decoder command (Pillow13.0.0 in this environment): `python3 verify_rgba.py input-local.json result-noimages.json` produced12/12 hash matches. No installation performed. Current publication: Sites167 succeeded; live basic-load/visible-behavior verification pending shared-browser coordination. See publication.json; deployment success is not a claim of browser QA.
