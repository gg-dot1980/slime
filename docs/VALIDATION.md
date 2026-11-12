# Import validation — 2026-11-12

- Node build: PASS (no installed runtime dependencies required).
- Built Worker SHA256 exactly matches saved v103 source artifact:
  `3648a050e33d5f5a594c7129511848f09562e137ddae222edad921480c8f0463`.
- OCR route/index regression: PASS, 12 aliases, links, original OCR1 hash, versions API.
- Result gate regression: PASS; 1:49 win accepted; exactly 1:50, defeat and missing
  clock rejected. This preserves existing stricter implementation behavior.
- Empty local SQLite: PASS; both migrations applied; four expected tables and
  runs.version verified; no production data copied.
- Source scan: no known credential patterns found; only public game URL/W3C SVG
  namespace/local preview URLs found in source; no external CDN assets.
- Not run: browser gameplay, real D1 CRUD, Wrangler deployment, optional canvas
  harnesses, dependency installation/regeneration. No new acceptance-rate claim.
- Live website, deployment settings, production D1 and original /ocr3 unchanged.
