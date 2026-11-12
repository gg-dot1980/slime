# Slime Arena + OCR

Source snapshot of https://slime.gameson.cc, Sites release **103**, source commit
`085fe894ec1c7de21b3cf842ed44ec4f121c640e` (2026-11-12 import).

## Run

Node.js 22+ is recommended. The game/Worker build needs only Node built-ins:

```sh
npm run build
npm run dev
# open http://localhost:4173
```

The lightweight preview deliberately disables score APIs. For a local D1-enabled
Worker use [database setup](docs/DATABASE.md). `npm ci` installs the pinned Drizzle
dependencies when schema generation is required. No production database is included.

## Routes

- `/`: current game v2.22; `/v2.13`, `/v2.20`, `/v2.21`, `/v2.22`: available versions.
- `/release`, `/controller.html`
- `/ocr`: controller index; `/ocr1`, `/ocr2`, `/ocr3`: existing controllers.
- `/ocr-test`: experimental controller test-007 wallguard, not accepted for promotion.
- `/api/versions`, `/api/profile`, `/api/runs`, `/api/scores`, `/api/leaderboard`.

The existing Worker also accepts documented trailing-slash / `.html` aliases and
returns the current game for unknown non-API paths. See `src/worker.js` for exact routing.

## Verification

```sh
node scripts/check-ocr-index.mjs
node scripts/check-ocr3-result.cjs
python3 scripts/init-local-db.py /tmp/slime-test.sqlite
```

Further regression/simulation scripts are retained under `scripts/`. Some require
`@napi-rs/canvas` and system fonts, which were not pinned in the original lockfile.
They are historical harnesses, not proof of the current browser win rate. Install
and pin those dependencies in a dedicated future testing patch before claiming
full reproducibility. See `docs/VALIDATION.md` for actual import checks.

## Patch tracking

Use one branch per change (`ocr/test-008-description`, `game/...`, `db/...`) and
one meaningful commit per independently testable patch. Record hypothesis,
parameters, fixed sample, results/failures and evidence in its PR/changelog.
OCR candidates go to `/ocr-test`; list changes newest first at the bottom of that
page. Promote to `/ocr3` only after the agreed fixed-batch result verifies at least
50% qualifying clears within 1:50. A single clear is not a win-rate claim.

GitHub is source tracking only: pushing here does **not** deploy the live Site.
No CI/auto-deploy is configured by this import. Future releases must record their
GitHub commit and Sites version explicitly. No new schedules were created.

## Provenance and boundaries

This is a sanitized baseline, not 103 recreated commits. `docs/source-history.tsv`
records the 103 real upstream source commit IDs/timestamps/subjects; their objects
are not imported. Source file hashes are in `docs/source-provenance.json`.
Existing HTML and Worker logic are unchanged. Hosting project identity is replaced
by a placeholder. Rebuild `dist/`; old tar archives, runtime state, raw evidence,
private machine paths and production player data are excluded.

All routes and public frontend assets present in the current source are included.
Earlier deleted files, NUC-only experiment artifacts, and screenshots referenced
by historical reports are not included. Public code does not imply a new open-source
license grant; see `THIRD_PARTY_NOTICES.md`.
