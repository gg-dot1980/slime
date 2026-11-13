# OCR test branch

`test/ocr-test` tracks the experimental `/ocr-test` controller, test data summaries, and version/patch records.

Created 2026-11-13 (Asia/Taipei) from `main` at `f946d483d908b4b700529b8b1c7c896d441780e9` without rewriting history or changing the live Site.

## Acceptance and promotion

The current requested acceptance goal is at least 50% qualifying clears within **3:00** on the agreed game version v2.13. Complete the predefined batch before evaluating; invalid infrastructure runs must be recorded separately, not silently discarded. Fixed-seed diagnostic runs do not count as public-game acceptance.

- Record independently testable changes and results here before promotion.
- Publish candidates at `/ocr-test`, with newest-first change records at the bottom of the page.
- Do not update `/ocr3` until the acceptance gate is verified.
- GitHub pushes do not themselves deploy Sites. Record each GitHub commit and corresponding Sites version.
- Do not upload credentials or player database records.

## History boundary

Earlier test commits already exist in `main`; creating this branch does not remove or relabel that history as production-only. `main` is left unchanged by this branch setup. Future test-only changes go to this branch. The formal `/ocr3` source remains unchanged until verified promotion.
