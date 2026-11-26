# 階段 1a 協議：claude-11 vs claude-20（裁切物件圓擬合）成對比較（開跑前固定）

2026-11-26（台灣時間）記錄，分支 `ocr-claude`。和[階段 0 協議](../phase0/PROTOCOL.md)相同，只有以下差異：

- **策略**：`STRATEGIES=claude-11,claude-20`，每個策略每版 20 局。
- **頁面**：`site/ocr-claude20`，建置自本次提交的 `src/ocr-claude.html`。
- **決策規則**：claude-20 在至少一個版本的中位數差 95% 信賴區間不含 0（較好），而且另一個版本沒有顯著較差，才採用；否則維持 claude-11。另外檢查死亡數，以及辨識量測中「致命看成安全」的次數。
