# OCR latest two verifiable live builds

Selected: recovery-r46-restored-test043 and recovery-r50-telemetry-test043. Both use public strategy test-043 and game v2.20; r50 adds bounded telemetry, not a new strategy. r51–r54 are offline analyses, not new live builds. r43/r44 original evidence remains missing.

## Clean directory replay

Requires Node v24.22.1 and Python3.12.14 (tested current versions, not historical dependency lock). No npm packages.

```sh
python verify.py
node replay.cjs
```

Expected saved-input planner equality: r46 383/383; r50 414/414. Image metadata17/19; image bytes intentionally excluded. These reproduce saved calculations and inspect recorded outcomes, NOT the random game trajectory or image-recognition output.

## Browser fixture and actual game harness

Serve this directory through the supported static preview for your environment. Open `/index.html` for the fixture harness, or `/r50.html` for telemetry parity. Original fixture PNGs are intentionally NOT included; those pixel tests need new user-supplied fixtures and cannot run directly from this package. Open `/r46-baseline.html` or `/r50-game.html` for the original live harness; it loads bundled `/v2.20/`. Match canvas/CSS2000x1163, DPR1, desktop Chrome156. Use the single-trial start/save controls; no automatic retries. Browser fixture/live replay has NOT been rerun in a new environment for this archival task. Browser binary/OS image and random seed were not saved; do not promise exact random results.

Game JSON includes decision inputs/outputs, key events, image metadata, timestamps, rejection and missing-image records. All36 PNG data URLs removed;75 fixedPNG files excluded. Image manifests retain names/hashes only. Historical image tests cannot be reconstructed from this package; collect new frames to rerun those tests. `r50/build.py` retains original generation script and original path assumptions; browser-ready generated outputs are included so rebuilding is not required.

## Recorded results

r46:1start,0wins,1death76s,size83,0abort. r50:1start,0wins,1death80s,size90,0abort;1stale decision recovered. These are exploratory diagnostics, not acceptance. Desktop each game version v2.13 onward still requires <=150s and >=50%; mobile skipped. No OCR4 publication.

## Future reproducibility checklist

Before every batch freeze game version/hash, strategy version/hash, harness/config, fixture/seed availability, runtime/browser/viewport/DPR, dependencies/lock, commands, stopping rules and expected outputs. Save code/config/numerical outputs and missing records to GitHub; keep image records locally only, SHA256 manifest, clean-directory verification, result class and remote commit. Label deterministic replay, historical evidence integrity, browser fixture replay and stochastic live repeatability separately. Unknown remains unknown; never recreate lost originals from summaries.

## User correction: no image records on GitHub
This replacement omits75fixturePNG files and36embeddedPNG records. Original local evidence retained. Previous image-bearing Git blobs may remain in history; no history rewrite authorized or attempted. Static planner replay remains available; historical pixel regression is intentionally unavailable here.

[Download source-results-only.zip](./source-results-only.zip). SHA256 `7c750c98b4121a07db30fff44582552f40cace1b1233019a1e40d66ee2f19fb7`.
