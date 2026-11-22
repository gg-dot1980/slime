# grow-1 — independent growth-first experiment

2026-11-22. Route `/ocr-grow`; not OCR4 acceptance. Desktop live gameplay unverified; mobile acceptance remains skipped. No original routes or leaderboard code changed.

Base GitHub `test/ocr-test`: cb3ee28cdd71e895b5f20cdfd7b6da98b02a57c9. Sites source base: 135d9db56ef98685ecf08061e3e016a7dd371f8c (v170). Source for this version is the commit containing this entry. Perception test-033 retained; A planner test-026 retained; B grow-1 separately selectable, default B on this new route only. No mask deduplication prototype.

B ranks modeled two-second intercepts by growth/time, emphasizes eligible NPCs, and rejects clipped, red, blocked, unknown-size or radius >=0.85×player prey. Threat assessment uses fixed observed player radius throughout; projected growth cannot erase threats. Known-wall paths cannot worsen current wall overlap. No safe direction chooses maximum-clearance retreat, not proof of survival. Unknown walls, occlusion, radius and velocity estimation errors remain limitations. No game-internal state is supplied to the controller.

The embedded v2.20 copy disables API, online runs, score persistence/flush and score recording. CSP denies all connections; local storage keys have a separate prefix. Source game rules and physics retained. Other game routes are byte-preserved. Start is manual and one game only; stop/hidden-page/stale calculation releases keys. The strategy selection is frozen at start. No winrate claim.

## Reproduce

Node 24.22.3 / Linux, built-ins only; no install needed:

- `node scripts/check-ocr-grow.cjs`
- `node scripts/build.mjs`
- `node scripts/check-ocr-grow-routes.mjs` requires the pinned Sites base in Git history; in a GitHub-only checkout use the unchanged base worker artifact at that source, otherwise mark this particular comparison unavailable.

11 synthetic checks passed: 9 stationary controls no direction change; 4 faster-retreating-prey scenarios change east to west toward the reachable alternative. Includes large/red/clipped/unknown prey refusal, unsafe retreat, wall constraint, fixed threat geometry, key release and script/CSP validation. These are synthetic numeric inputs, not private replay or game results. First single stationary scenario and initial nine-case direction-change expectation failed because A already chose NPCs; retained as negative controls, not hidden or counted as gameplay. No strategy threshold was tuned to these failures.

10 old route bodies/statuses matched pinned build; 2 new route aliases passed; DB access trap never fired. Results JSON is aggregate/route hashes only. No private inputs are needed for the contract tests. Real browser, real interception and gameplay results are separate checks. No random seed fixed, no valid gameplay acceptance denominator. Formal desktop per-version 150-second / 50% requirements unchanged.

Existing handoff index has an earlier blocked synchronization; this new entry does not resend its private historical material. Index linkage pending separate compliant synchronization if needed.
