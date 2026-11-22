# Sitemap

Preferred public URL inventory: https://slime.gameson.cc/sitemap.xml

The inventory includes /, /release, /demo, /ocr, /ocr1, /ocr2, /ocr3, /v2.13, /v2.20 and /v2.21. /v2.22 duplicates the current root game and is omitted. Experimental /ocr-test and /ocr-grow, API routes, unknown-path fallback pages and aliases are excluded. No lastmod dates are inferred.

Existing pages have no explicit canonical tags. These preferred paths follow existing route definitions and navigation, not a claim about Google's selected canonical. Page SEO is unchanged. robots.txt previously returned game HTML; the new text contains only the Sitemap declaration, with no crawling rules added or removed. Sitemap exclusion is not a noindex instruction.

Run `node scripts/build.mjs && node scripts/check-sitemap.mjs` to validate the built routes. An optional source commit argument compares unchanged routes against that repository's earlier built Worker. The Sites baseline 2aef57357b61ccada74736e6816a18a52b5dafc9 yielded 10 valid URLs and 15 identical existing route responses, with zero runtime environment access. XML namespace parsing also passed.

Public browser verification is required after deployment. Some non-browser HTTP clients returned 403 during preflight; Googlebot accessibility and actual indexing remain unverified. No Google account or indexing submission is performed by this change.
