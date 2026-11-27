# Grow21 — bounded scout memory, untested prototype

Self-contained `ocr-grow21.html`, based on Grow20. v2.22 only: temporarily defer a white-dot scouting target after a uniquely matched reliable body was confirmed too large to eat. Fixed2.5s maximum; player growth, ambiguous matching, missing/red marker, new edible evidence or a stale frame clears it. At most two remembered locations.

Status:12 synthetic cases /91 assertions passed; **zero natural gameplay starts**. No win-rate or survival claim. This candidate is preserved for reproducibility and was not selected for the next live batch because Grow20's observed failures called for threat-model work.

No captured images, replay, telemetry, credentials or private project identifiers are included.

Source SHA256: `cf6da13db2383a7e014d8cac3c4f39b4feaacffca08feef3bbb3be9d9b217409`
