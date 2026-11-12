# Database setup

The live Site uses **Cloudflare D1**, binding `DB`, verified through Sites database
overview on 2026-11-12. Source manifest declares `d1: "DB"`.

Tables: `devices` (anonymous device hash/nickname), `runs` (start/completion),
`daily_scores` (legacy daily ranking), `daily_version_scores` (per-version ranking).
`src/worker.js` implements profile, run, score submission and leaderboard APIs.
Browser device cookies and real database rows are intentionally not exported.

## Schema generation

```sh
npm ci
npm run db:generate
```

`db/schema.ts` is Drizzle's schema, `drizzle.config.ts` its configuration. Existing
ordered migrations are `0000_easy_mentallo.sql` then `0001_shallow_brood.sql`.
The second adds the version column and version-specific scores table. Do not
regenerate or reapply historical migrations to production casually.

## Empty local SQLite validation (no Cloudflare account)

```sh
python3 scripts/init-local-db.py /tmp/slime-test.sqlite
```

Creates a NEW empty SQLite database and applies both existing SQL migrations in
one transaction. Refuses an existing file. This verifies schema SQL, not D1 network
behavior or production data. No seed user or leaderboard data is required.

## Independent Cloudflare D1 deployment

Install the official Wrangler CLI separately, authenticate with your own account,
then create a NEW database; these commands were documented, not run against a cloud
account during this import:

```sh
npx wrangler d1 create slime-local-or-staging
cp wrangler.example.jsonc wrangler.jsonc
# Set the returned database_id in wrangler.jsonc (do not reuse production).
npm run build
npx wrangler d1 migrations apply slime-local-or-staging --local
npx wrangler dev
```

After testing and explicit release approval, `--remote` applies migrations to the
configured cloud database. Creating a database and deploying may incur provider
charges. Never point this example at the existing live DB by accident. The
example leaves credentials out and uses binding `DB` as the Worker expects.

For Sites hosting, use your own Site identity in `.openai/hosting.json`; Sites
provisions the declared D1 binding through its supported publishing workflow.
A placeholder manifest alone is not a deployable existing Site identity.
