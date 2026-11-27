# 協議：claude-22 vs claude-27 成對比較（開跑前固定）

2026-11-27（台灣時間）記錄，分支 `ocr`。

## 依據

[資訊拆解](../claude-phase2-information/README.md)發現：決定能否過關的是畫面外白點的大小，而小地圖只在 45.6 ≤ r ≤ 114 時看得出大小。

參考機器人改成只追看得出大小的白點（3 倍速，每版 10 局）：
- 規則 `unk:"skip"`：1.2px 的點（r<45.6）和飽和的 3px 點（r>114）都不追。
- v2.13 過關 7/10，v2.22 過關 5/10。
- 原本 Y0（大小不明也追）是 5/10、2/10。

其他設定見 [README](README.md)。

## 候選

claude-27 = claude-25（claude-22＋小地圖白點標記）＋ `dotSize`（點的面積換算大小，claude-14 的估計）＋ `unkSkip`：
- 點的大小讀不出（1.2px 點或點相連）或飽和（估計 114）的白點，不當追獵目標。
- 讀得出大小時：
  - 估計 ≥1.06R 的白點視為危險。
  - 其餘白點才當目標。

## 協議

和[階段 0 協議](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/docs/ocr/repro/phase0/PROTOCOL.md)相同：
- `STRATEGIES=claude-22,claude-27`，每個策略每版 20 局，實際速度。
- v2.13 與 v2.22 同時跑，`OBSERVE=1`。
- 頁面為本分支 `npm run build` 後 `npm run dev` 提供的 `/ocr-gui-design/claude/`。
- 視窗 2000×1163，DPR 1，視野「標準」。

**決策規則**：claude-27 在至少一個版本的體型中位數差 95% CI 不含 0（較好），而且另一個版本沒有顯著較差，就採用；否則維持 claude-22。
