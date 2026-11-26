# 階段 0 協議：claude-11 vs claude-16 成對比較（開跑前固定）

2026-11-26（台灣時間）記錄，分支 `ocr-claude`，起點 c84b94d（已包含小地圖玩家點例外的修正）。

- **頁面**：`node scripts/build-ocr-claude.mjs site/ocr-claude` 建置的靜態頁，本機 `python3 -m http.server 8090` 提供。
- **版本**：v2.13、v2.22，一個版本一個 runner，兩個 runner 同時跑。
- **策略**：claude-11、claude-16，同一個 runner 內逐局交錯（`STRATEGIES=claude-11,claude-16`）。每個策略每版 **20 局**，共 80 局。
- **環境**：Linux 雲端，Chrome for Testing headless，Playwright，視窗 2000×1163，DPR1，視野「標準」，`OBSERVE=1`。
- **主要指標**：結束時的體型。過關記為 200，死亡記為死亡時的體型，150 秒截止記為當時的體型。報告中位數和 bootstrap 95% 信賴區間，以及兩個策略中位數差的 95% 信賴區間（`scripts/compare-ocr-claude.mjs`，固定亂數種子）。
- **次要指標**：150 秒內過關數、死亡數、每局吞 NPC 中位。
- **排除**：只有 `infra-error`、`controller-error`、`wall-timeout`、`unknown` 會排除，並在報告中列出。不補跑、不刪除。
- **決策規則**：
  - 某個策略在至少一個版本的中位數差 95% 信賴區間不含 0，而且在另一個版本沒有顯著較差，就選它當基礎版本。
  - 否則兩者視為無法區分，選死亡數較少的；死亡數也相同時，選 claude-16。
