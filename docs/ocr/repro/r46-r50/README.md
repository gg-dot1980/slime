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

Serve this directory through the supported static preview for your environment. Open `/index.html` for the fixture harness, or `/r50.html` for telemetry parity. Original fixture PNGs are intentionally NOT included; those pixel tests need new user-supplied fixtures and cannot run directly from this package. Open `/r46-baseline.html` or `/r50-game.html` for the original live harness; it loads bundled `/v2.20/`. Match canvas/CSS2000x1163, DPR1, desktop Chrome156. Use the single-trial start/save controls; no automatic retries. Portability-1: both live harnesses were started and manually stopped in a newly prepared directory on the existing cloud host; see PORTABILITY-CHECK.json. This is not a fresh OS/browser image or complete game. Browser binary/OS image and random seed were not saved; do not promise exact random results.

Game JSON includes decision inputs/outputs, key events, image metadata, timestamps, rejection and missing-image records. All36 PNG data URLs removed;75 fixedPNG files excluded. Image manifests retain names/hashes only. Historical image tests cannot be reconstructed from this package; collect new frames to rerun those tests. `r50/build.py` now resolves source relative to __file__ and accepts --output; prepare.py builds all browser assets and the bundled-version endpoint from any working directory. Root recorder copies now finalize manual stop as an aborted trial; historical nested copies remain archived originals.

## Recorded results

r46:1start,0wins,1death76s,size83,0abort. r50:1start,0wins,1death80s,size90,0abort;1stale decision recovered. These are exploratory diagnostics, not acceptance. Desktop each game version v2.13 onward still requires <=150s and >=50%; mobile skipped. No OCR4 publication.

## Future reproducibility checklist

Before every batch freeze game version/hash, strategy version/hash, harness/config, fixture/seed availability, runtime/browser/viewport/DPR, dependencies/lock, commands, stopping rules and expected outputs. Save code/config/numerical outputs and missing records to GitHub; keep image records locally only, SHA256 manifest, clean-directory verification, result class and remote commit. Label deterministic replay, historical evidence integrity, browser fixture replay and stochastic live repeatability separately. Unknown remains unknown; never recreate lost originals from summaries.

## User correction: no image records on GitHub
This replacement omits75fixturePNG files and36embeddedPNG records. Original local evidence retained. Previous image-bearing Git blobs may remain in history; no history rewrite authorized or attempted. Static planner replay remains available; historical pixel regression is intentionally unavailable here.

## Portability-1 build and start/stop verification
Run `python /absolute/path/to/prepare.py --output /absolute/path/to/preview/dist` from any directory. Use supported static preview hosting pointed at that dist directory. No npm dependency. Bundled API lists only v2.20, not the complete public version inventory. Start with `Start single fixed trial`, finish with `停止並暫停`; manual stop is an abort and releases keys. Two bounded browser smoke starts ended manual-stop, zero wins/deaths,2aborts; not winrate evidence. HUD time advanced and stopped,2000x1163,DPR1. Historical75-image fixture cannot run without locally supplied images; r50 UI now explicitly reports FIXTURE_UNAVAILABLE. Do not upload images to GitHub.

[Download source-results-only.zip](./source-results-only.zip), SHA256 `44356e8c4f10c0656a7564886f711c7d38d6d436ec22d6cdc9fa55dcc7dea441`.
