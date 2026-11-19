# Proposed review gates — not applied

Target decision owner: repository maintainer; independent reviewer and release operator remain TBD. No settings/security/permission changes are made in this POC.

After observing the Draft PR's intentional failure and repaired success, consider protecting test/ocr-test and main with PR-only changes, at least one non-author human approval, resolved conversations and no force-push/deletion. Candidate required check: actual observed `OCR workflow POC / fixed-replay` context (confirm exact check name and event behavior before configuring). Do not require a check that does not yet run on the protected target or that is bypassed by path/draft filters. Decide stale-approval dismissal, admin bypass and emergency procedure explicitly. Do not enable these from this proposal.

The fixed replay check covers only18 numerical observations, not OCR4 live acceptance, browser safety or production health. Formal release requires separate version-specific evidence and authorized deployment approval. External fork code may run only on isolated GitHub-hosted, minimal read permissions, no repository/environment secrets or private NUC. Never use pull_request_target to run untrusted head code. SHA-pin actions and review updates; generated GitHub service tokens are still scoped by permissions, not a grant to production.

Security reference: https://docs.github.com/en/actions/tutorials/authenticate-with-github_token (minimum permissions); workflow runs must be independently checked rather than assumed from YAML. No collaborators invited, reviews approved, PR merged or policies enabled by this document.
