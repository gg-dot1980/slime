# timing-2 — optional timing instrumentation

2026-11-22. Diagnostic only; perception test-033 / planner test-026 unchanged. Game target v2.20. No new live games, wins, deaths or acceptance trials. Desktop150s/50% per supported version unchanged; mobile skipped.

Source: gg-dot1980/slime test/ocr-test at09fee9d4ab62d19e9fb5af8cb9f07a2109069567. Sites starting source fe6abf5d543a45f11d51d9d4a4f3ed6f5d554767 already contains a later diagnostic history. Only new timing code is shared; this change does not republish missing historical records.

Reproduce from the fixed checkout using existing Python3 and Node24 (no dependencies):

    node docs/ocr/repro/timing-2/test.cjs
    python3 docs/ocr/repro/timing-2/integrate.py src/ocr-test.html
    node scripts/build.mjs

Integration must run once on the unmodified pinned base. It fails on mismatched anchors. The committed src/ocr-test.html is already integrated; do not apply twice. Five synthetic-contract checks pass: clean reversal and same-axis opposite-key overlap for nominal100/250ms conditions, plus identical/changed image markers and bounded disabled recorder. Simulated clock jitter is explicit; these checks do not measure actual movement or browser overhead.

Opt-in checkbox, default off. Access local in-memory records with window.ocrTiming.snapshot(); no network/export added. One parent performance.now clock records capture bounds, independent decision completion immediately after plan returns, keydown/keyup before and after synchronous dispatch, and pixel-signature change. Dispatch completion is not game-loop acknowledgement. Hash change is not proof of a new render; identical pixels cannot prove no update. Requested heading and signed screen displacement are distinct; displacement stays null until independently measured from visible background. Full pixel hash is computed only while enabled and retains no pixels, but real overhead remains unmeasured.512-event cap drops oldest records and counts drops.

Private live diagnostic NOT RUN: no newly approved writable private browser entry; existing preview denial and NUC read-only restriction unchanged. No retry or alternate route used. Do not run experimental reversal/overlap controls against a public game. The test uses a virtual receiver only. No private replay, screenshots, object measurements, private paths or links included. Public source cannot reproduce private historical measurements.

Next: authorized isolated v2.20 private fixture, verify no leaderboard/network writes, then one bounded live window with actual dispatch and capture clocks; retain nulls for ambiguous motion. Do not infer actuation latency from nominal100/250ms.
