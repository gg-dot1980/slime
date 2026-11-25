# Grow20 source snapshot

Self-contained OCR Grow experiment page; open `ocr-grow20.html` in a foreground desktop browser. It embeds the isolated public v2.13/v2.22 game, uses visible canvas pixels and HUD, and keeps the Grow19 pursuit/risk policy.

Changes: retain the captured image buffer without a second copy; reject decisions older than200ms and release controls before a fresh read; stop on three consecutive overruns or one above1000ms. Game time continues during recovery.

Validation so far:18 control regression cases,25 recording/stop cases and12 fixed pixel-sequence comparisons passed. Natural-game evaluation is in progress; no win-rate acceptance is claimed yet.

This public snapshot contains executable source and this summary. It contains no captured image, replay, user telemetry, credentials, private project identifiers, or raw experiment log.

Source SHA256: `8b9560cffb5b86b1e320aaccc7839d8ed28b3b9b344e8543de3dc35bf003430e`
