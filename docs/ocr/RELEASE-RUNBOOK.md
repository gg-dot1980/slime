# Release / rollback runbook — POC v1

This is an executable **isolated filesystem artifact** rehearsal, not a game-site deployment. Actual release remains blocked on SPEC acceptance and separately confirmed approvers, target and credentials. Never use shared preview, production, databases or private NUC for this rehearsal.

## Actual rehearsal

From clean exact PR commit with Node24.22.1 run `npm run release:drill`. Script builds two deterministic r228 replay bundles in a new OS temporary directory, promotes v1→v2, rejects an intentionally corrupted candidate without changing current, rolls back to v1 and removes its own temporary directory in finally. It never starts a server or calls a network/deployment API. Output `.poc-output/release-drill.json` contains tested commit, release IDs, artifact manifest SHA256, health results, corruption rejection and cleanup.

Artifacts are `poc-v1` and `poc-v2`; payload is the SAME pinned numerical replay, version manifest differs. Each manifest identifies commit, fixture provenance and sorted per-file SHA256. Building v1 twice must give the same manifest hash. Health checks every file hash and executes the replay, requiring exact expected output18/18. Promotion validates health BEFORE atomically replacing a `current` pointer file; corruption must leave v2 selected. Rollback must restore the exact v1 hash and healthy result. This demonstrates version/hash/health and reversal mechanics only, not browser/HTTP/database compatibility. Temporary cleanup is asserted; reports stay outside temp.

## Future real release checklist (not executed)

1. Release owner (maintainer TBD) selects immutable source commit and artifact digest; independently reviewed per-version desktop acceptance must satisfy SPEC. Candidate and previous known-good artifact/hash must both be retained. No whole-test-branch merge.
2. Independent reviewer (TBD) verifies same commit, dependency/provenance decisions, risk and health plan. Authorized production approver (TBD) approves concrete target and artifact. This user-authorized POC is NOT production approval.
3. Operator with existing authorized deployment rights verifies target, previous release ID/hash and rollback procedure before any mutation. Use existing supported deployment tooling and native approvals; no new credentials or permissions from this document.
4. Stage in an approved isolated environment. Define service-specific health URL/status, version reporting, key-release/stop behavior and data/schema compatibility. These production checks and environment are TBD; local replay health cannot substitute.
5. Deploy only the approved immutable artifact. Observe required health window (TBD) and actual release status. On failure stop rollout and restore previous approved artifact; verify version, hash, health and controls. Database rollback needs separate approved plan; this POC does not migrate data.
6. Record approver/operator, source/artifact IDs, timestamps, health evidence, previous release and actual rollback result. Publish outcome without secrets or images. Cleanup only rehearsal resources; preserve evidence and previous artifact per agreed retention.

No actual site, index, database, workflow permissions or branch protection is changed by this runbook. Proposed maintainers must confirm roles before a production run.
