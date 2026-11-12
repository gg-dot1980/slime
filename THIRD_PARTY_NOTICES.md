# Third-party and license notes

The source snapshot contains inline HTML/CSS/JavaScript, canvas/SVG rendering,
Worker code and migration/test code. No downloaded third-party image/font bundles
or vendored dependencies are included. The inspected current source has no
external CDN runtime assets. This review does not establish authorship of every
line or grant a new license for the application; no license has been invented.

Dependency declarations/lockfile retain upstream package metadata. Drizzle ORM,
Drizzle Kit and their transitive dependencies retain their respective licenses.
Optional historical native test harnesses require @napi-rs/canvas and fonts; those
are not bundled. Consult their installed LICENSE files before redistribution.

Production records, account credentials, cookies, API keys and environment files
are not part of this repository. Pattern scanning of the import found no known
credential patterns; this is not a guarantee that automated scanning detects all
possible secrets. Review future patches before publishing.
