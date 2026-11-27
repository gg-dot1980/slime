# 協議：claude-22 vs claude-26 成對比較（開跑前固定）

2026-11-27（台灣時間）記錄，分支 `ocr-claude`。

## 候選

claude-26 = claude-22 加上三項辨識修正（依據 [phase2-tracking](../phase2-tracking/README.md)）：

- **濾邊緣假物件**（`rim`）：在玩家自己邊緣（0.88～1.20R）、半徑 ≤ min(16, 0.2R)、未切邊的「NPC」不使用。
- **殘影記憶**（`memory`，同 claude-12）：消失的威脅保留 0.6 秒。
- **碎片合併**（`cluster`，同 claude-18）：合併同一個大型 NPC 被切成的多塊危險區。

不計算小地圖白點標記，和 claude-22 相同。3 倍速篩選（混合工具，非成對）：v2.13 體型中位 +17.5（CI 2～45.5），v2.22 +17.5（CI −20～56）。

## 協議

和[階段 0 協議](../phase0/PROTOCOL.md)相同：
- `STRATEGIES=claude-22,claude-26`，每個策略每版 20 局，實際速度。
- v2.13 與 v2.22 同時跑，頁面為 `site/ocr-claude26`，`OBSERVE=1`。

**決策規則**：claude-26 在至少一個版本的體型中位數差 95% CI 不含 0（較好），而且另一個版本沒有顯著較差，就採用；否則維持 claude-22。
