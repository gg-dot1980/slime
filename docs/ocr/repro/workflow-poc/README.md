# OCR workflow POC v1 (proposed; not merged)

Dedicated branch `poc/ocr-workflow`, base `f70766043b1ccabf62ecd434a42e15258c516a30`; target Draft PR `test/ocr-test`. Explicit user authorization permits this isolated proposal branch; main, test/demo and test/ocr-test HEADs must remain unchanged. Read [SPEC](../../SPEC.md), [TESTING](../../TESTING.md), [storage v1](../../GITHUB-STORAGE.md). No images, controller change or live acceptance.

## Reproduce from the exact PR commit

Use a fresh clone/checkout of the PR head SHA; do not reuse a dirty worktree. Node **24.22.1**, Git, npm bundled with Node; no `npm install`, third-party runtime dependencies, browser, NUC or credentials required. Run from repo root:

```sh
npm run doctor
npm run smoke
npm run regression
npm run release:drill
```

Each command writes `.poc-output/<suite>.json` (ignored) and exits nonzero on failure. Check testedCommit matches the selected SHA and environment is recorded. Doctor rejects dirty/untracked source; ignored output is allowed. Source and every r228 file are pinned by SHA256 in `scripts/workflow-poc/fixture-lock.json`, originating at `586a84c3452178218f0fdc65765ec7f4f9c210df`. Full replay code, fixtures, expected results remain unchanged. `package-lock.json` is untouched because no dependencies change.

Doctor: runtime, checkout, pins and workflow guard checks. Smoke: pinned offline replay loads/exits and exact full expected output. Regression: all18 individual observations plus aggregate/error/empty/duplicate-input tests. This smoke is a CLI smoke, not browser start/key/release E2E. No live game is started. JSON reports only numerical sample IDs, hashes, results and generic OS/runtime, never host paths or pixels.

## Deliberate Fail then repair (fixed expectations)

First code commit intentionally groups IDs by round only (`r225`, `r227`), miscounting r225 A/B as one run: actual2 vs expected3. The same 18 samples and unchanged assertions must fail. Second code commit repairs the grouping key to round + A/B, expected3; it does NOT change fixture, threshold or skip tests. The injected fault affects only new POC reporting, not a game controller. CI must be observed for both exact SHAs on the same Draft PR; an absent/blocked run is not a pass. Do not merge the deliberately failing revision.

Workflow: pull_request only to test/ocr-test, ubuntu-24.04 GitHub-hosted, contents:read, no secrets, no private runner, no pull_request_target, SHA-pinned actions, no persisted checkout credentials. It checks exact PR head, not an implicit merge SHA. JSON-only artifacts retained14days. A fresh runner independently reruns scripts but is not a human approval. Workflow is proposed on this branch, not asserted enabled on base. Runtime download/runner availability can fail independently; preserve those results.

## Evidence and status

Actual local reports and CI artifact/check URLs are to be recorded in the Draft PR after execution, referencing tested SHAs. This source README does not predeclare results. Per run: command, environment, source pins, assertion denominator and outcomes; live starts/wins/deaths/timeouts/aborts all0. Fixture18frames represent3 historical diagnostic runs, not18 new games. No evidence of current OCR4 win rate.

## Proposed future live acceptance (not executed/adopted)

Known versions v2.13/v2.20/v2.21/v2.22, plus any newly supported version verified before start; mobile skipped. Proposal for maintainer decision: freeze20 independent normal random starts per desktop version and require at least10 wins within150s in each, followed by separately preregistered independent confirmation if desired. Report confidence intervals and avoid claims about guaranteed population rate. This number is a proposal, NOT an amendment of SPEC TBD or permission to declare acceptance now.

Still to freeze: final per-version sample/confirmation size, actual desktop OS/browser/runtime/viewport/DPR, exact game/controller commits, timing and result extraction, infrastructure classification and retry policy. Suggested rule: count deaths/timeouts as valid failures, retain all infrastructure aborts separately and do not replace them silently; any incomplete prescribed denominator blocks a pass. Natural random seed is unknown unless supported visible tooling provides one; no hidden game state in OCR control. Evidence access, browser resource availability and an independent verifier must be confirmed first. No live acceptance command is supplied.

## Other POC deliverables

- [Release and rollback rehearsal](../../RELEASE-RUNBOOK.md): isolated artifact only, no production.
- [Ruleset proposal](../../RULESET-PROPOSAL.md): settings not changed.
- [Provenance and ownership decisions](../../PROVENANCE-REVIEW.md): no license selected or promise made.

Limitations: exact byte replay relies on pinned Node/source/fixtures; local/hosted OS differ and are recorded. GitHub contains no images for visual reinspection. Fixed replay is not game safety or acceptance. POC changes remain a Draft proposal until independent human review; no self approval/merge.
