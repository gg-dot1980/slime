# grow-2 — isolated game version selection

2026-11-22. Scope: /ocr-grow only; grow-1 B and test-026 A planning unchanged, test-033 recognition unchanged. Sites source base 1240edd6e9d72f00c08c081f1d18e16b9047c113; GitHub base 1957d3b04a1c523afafff5a78f757bee1c759319. Source is this commit's src/ocr-grow.html, scripts/grow-games.mjs and build integration; original per-version src/game*.html remain unchanged.

Options match OCR-test's version labels: current v2.22, v2.22 (current), v2.21, v2.20, v2.13. Default v2.13. Arbitrary URL input is intentionally omitted: only bundled, isolated game sources can load. Current and explicit v2.22 resolve to the same game. No fetch of /api/versions is needed; both menus derive from the same original source/version manifest at build time.

Each version keeps original physics and rendering. A build-only transform replaces the six online/pending-score functions, namespaces local records, hides leaderboard UI and adds connect-src none. No DB binding is accessed by this route. Switch first releases old keys and invalidates controller callbacks, resets tracking/HUD, then replaces srcdoc. Generation and visible metadata must match before Start is enabled. Run results use the game version captured at start.

Reproduce using Node 24 (tested 24.22.3, Linux):

```
node scripts/build.mjs
node scripts/check-ocr-grow.cjs
node scripts/check-grow-versions.mjs
```

Automated results: 11 existing strategy checks passed; 4 isolated versions; 5 selection/switch cases; stale and mismatched loads rejected. Against the Sites base, 17 existing routes had identical body/headers/status including sitemap, robots, Google verification and OCR-test. The optional comparison argument requires the specified base's built Worker in that checkout, not a GitHub-only commit. No private inputs or images are required.

These are synthetic/lifecycle/source regression checks, not live game outcomes. No seed or formal batch is assigned. Browser smoke is reported separately; formal completed/winning games remain zero for this change. Desktop per-version 150-second / 50% acceptance is unchanged. Mobile acceptance remains skipped. Model/effort setting is not displayed. No claim of independent review or CI completion.

Public Chrome smoke on Sites v174: default v2.13 and all five options loaded corresponding visible version labels. One v2.13 B start was stopped by switching to v2.20 (about 1 game second); new game showed 25 / 05:00 and attempt 0. Final Stop displayed stopped. A selection tool timed out twice; A live start/stop was not performed. Complete games/wins/deaths: 0/0/0; one operator-interrupted smoke, not acceptance. Tab title corrected in the final patch.
