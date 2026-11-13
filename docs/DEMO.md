# Demo v1

Published: 2026-11-13, Sites v136. URL: https://slime.gameson.cc/demo

## Scope
40-second silent gameplay introduction with burned-in Traditional Chinese captions. Actual v2.22 game canvas, keyboard inputs, local copy, scoreboard network writes disabled; deaths can restart. Not a complete victory demonstration or OCR benchmark. Game rules/leaderboards/OCR sources are unchanged.

## Reproduce
Run scripts/record-demo.py on the NUC with Python Selenium and Firefox/geckodriver; adjust its working directory and browser paths for another host. The recorder produces WebM and provenance JSON. It captures real-time game canvas, composites subtitles, and uses MediaRecorder. Then convert on a host with FFmpeg:

```sh
ffmpeg -i slime-demo-v1.webm -t 40 -vf 'fps=24,setsar=1' -c:v libx264 -preset fast -crf 31 -pix_fmt yuv420p -movflags +faststart -an media/slime-demo-v1.mp4
npm run build
```

## Validation
MP4: 40.000 seconds, 960x640, 24fps, H.264 yuv420p, 430748 bytes.
Node Worker route checks: /demo 200; video 200; byte range 206 (100 bytes); invalid range 416; /, /ocr-test, /ocr3 retain 200 responses.
Public NUC Firefox playback: duration 40, currentTime advanced to 3, paused false, error null, intrinsic 960x640. Desktop viewport 1280 and narrow viewport 500 both no horizontal overflow. Firefox constrained requested390 width to500; actual iPhone Safari not tested. Screenshots inspected. No claim of real-device mobile certification.

Sites source commit: 765706f008aeab16657949fdbac29be38c3d1b1d.
GitHub changes isolated to test/demo, based on test/ocr-test 4a015d3d87581fcafa9691da580c7951fc40c2db. No main/test/ocr-test pointer changes.
