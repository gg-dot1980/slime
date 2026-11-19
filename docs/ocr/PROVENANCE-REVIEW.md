# Provenance inventory and pending decisions — POC v1

Base f70766043b1ccabf62ecd434a42e15258c516a30. [Existing THIRD_PARTY_NOTICES](../../THIRD_PARTY_NOTICES.md) retained unchanged. [Machine inventory](repro/workflow-poc/provenance-inventory.json) records hashes/metadata without images.

Observed: no root LICENSE file; notices explicitly do not grant a new application license or establish authorship of every line. src consists of inline HTML/CSS/JavaScript, Canvas/SVG and Worker code; system fonts and inline data-SVG references appear. The inventory scans external script/style URLs; it is not proof that every asset is original. No new image/font/assets are added in this POC. Historical archive interiors, original author permissions and all external inspirations remain unverified.

Lockfile v3 has63 non-root package entries:60 MIT,2 Apache-2.0,1 BSD-3-Clause in recorded metadata. Direct dependencies: drizzle-kit0.31.4 metadata MIT; drizzle-orm0.44.5 metadata Apache-2.0. This is metadata, not legal advice or a determination of redistribution compliance. Installed upstream LICENSE/NOTICE texts and transitive obligations still need verification before redistribution. POC executes Node standard-library-only scripts and installs none of those packages. Historical optional native canvas/font harnesses are not used. New workflow pins checkout v4.2.2, setup-node v4.4.0, upload-artifact v4.6.2 by verified upstream commit; their code is not vendored, action license/security review remains a maintainer responsibility.

| Pending decision / work | Suggested accountable role (unassigned) | Evidence needed |
|---|---|---|
| Application license choice and contributor permissions | Repo owner with qualified advice as needed | Authorship/source records and desired distribution terms; no license selected here |
| Source/inline SVG/canvas/font provenance | Original authors + provenance maintainer | Origin/permission record for each non-original component; missing remains unknown |
| Dependency license/NOTICE compliance | Dependency maintainer + independent reviewer | Exact installed versions/license texts, transitive notices and distribution bundle audit |
| AI-assisted contribution provenance | Contribution author + human reviewer | Source attribution, copied material review, unresolved provenance flagged |
| Test evidence integrity and independent reproduction | Test maintainer + separate reviewer/CI | Fixed commits, objective assertions, full denominators; no self-approval |
| Release/rollback authority | Release approver + operator | Explicit assignments and target-specific approval, prior artifact and health plan |
| CI/runner security and rulesets | Security/repo maintainer | Separate approval of proposed settings; no private NUC/secrets for external forks |

Roles are recommendations, not invitations, assignments of permissions or legal commitments. Do not publish a new license or guarantee rights from this inventory. No credentials or internal personal paths belong in evidence.
