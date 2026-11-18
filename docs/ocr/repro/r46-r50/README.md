# OCR latest two verifiable live builds

Selected: recovery-r46-restored-test043 and recovery-r50-telemetry-test043. Both use public strategy test-043 and game v2.20; r50 adds bounded telemetry, not a new strategy. r51–r54 are offline analyses, not new live builds. r43/r44 original evidence remains missing.

## Download and restore

Download both `archive.zip.part0` and `archive.zip.part1` from this directory, then concatenate in numeric order:

```sh
cat archive.zip.part0 archive.zip.part1 > repro-r46-r50.zip
sha256sum repro-r46-r50.zip
unzip repro-r46-r50.zip -d restored
cd restored
```

Expected ZIP SHA256: `315f2183a8007cd29954d0c73b65b69ee77414ee3b38d92872080fc8004f0447`. Two parts are required because the transfer API has a16MiB request limit; this is one complete archive. See manifest.json for per-part hashes.

## Clean directory replay

Requires Node v24.22.1 and Python3.12.14 (tested current versions, not historical dependency lock). No npm packages.

```sh
python verify.py
node replay.cjs
```

Expected saved-input planner equality: r46 383/383; r50 414/414. PNG signatures17/19. These reproduce saved calculations and inspect recorded outcomes, NOT the random game trajectory or image-recognition output.

## Browser fixture and actual game harness

Serve this directory through the supported static preview for your environment. Open `/index.html` for fixed75 original images or `/r50.html` for 150-call telemetry parity. Open `/r46-baseline.html` or `/r50-game.html` for the original live harness; it loads bundled `/v2.20/`. Match canvas/CSS2000x1163, DPR1, desktop Chrome156. Use the single-trial start/save controls; no automatic retries. Browser fixture/live replay has NOT been rerun in a new environment for this archival task. Browser binary/OS image and random seed were not saved; do not promise exact random results.

Raw game JSON includes decision inputs/outputs, key events, all sampled PNG data URLs, timestamps, rejection and missing-image records. PNG files can be recreated by decoding `images[].png`; no images omitted from these two game outputs. Fixed75 PNGs and source manifest included. `r50/build.py` retains original generation script and original path assumptions; browser-ready generated outputs are included so rebuilding is not required.

## Recorded results

r46:1start,0wins,1death76s,size83,0abort. r50:1start,0wins,1death80s,size90,0abort;1stale decision recovered. These are exploratory diagnostics, not acceptance. Desktop each game version v2.13 onward still requires <=150s and >=50%; mobile skipped. No OCR4 publication.

## Future reproducibility checklist

Before every batch freeze game version/hash, strategy version/hash, harness/config, fixture/seed availability, runtime/browser/viewport/DPR, dependencies/lock, commands, stopping rules and expected outputs. Save raw outputs/images and missing records, SHA256 manifest, clean-directory verification, result class and remote commit. Label deterministic replay, historical evidence integrity, browser fixture replay and stochastic live repeatability separately. Unknown remains unknown; never recreate lost originals from summaries.
