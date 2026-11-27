# claude-27：只追看得出大小的畫面外白點（v2.13 與最新版 v2.22）

2026-11-27（台灣時間）。分支 `ocr`。事前協議見 [PROTOCOL.md](PROTOCOL.md)。不是正式驗收。

## 1. 參考機器人篩選（3 倍速，每版 10 局，[bot-screening-summary.txt](bot-screening-summary.txt)）

設定：只看畫面＋小地圖，規則 v3，預測 1.5 秒、吸引力 3、擁擠度 2，頁面為本分支 `/ocr-gui-design/claude/`。

| 畫面外白點的處理 | v2.13 過關／死亡／體型中位 | v2.22 過關／死亡／體型中位 |
|---|---|---|
| Y0 大小不明也追（[資訊拆解](../claude-phase2-information/README.md)） | 5／0／198 | 2／1／184.5 |
| **U1 1.2px 點和飽和 3px 點都不追（`unk:"skip"`）** | **7／0／202** | **5／1／197.5** |
| U2 只不追 1.2px 點 | 5／0／198.5 | 1／3／175.5 |
| U3 只不追飽和 3px 點 | 3／0／167 | 5／4／189.5 |
| U4 1.2px 點估計改成 0.4R | 3／1／192 | 3／0／195.5 |

只用畫面＋小地圖的資訊，U1 第一次讓**兩個版本都達到 ≥50%**（3 倍速篩選，n=10，尚未確認）。這是讓兩版都過門檻的第一個可行方向，所以直接做成控制器候選 claude-27。

## 2. 控制器（實際速度，成對比較）

待補（依 PROTOCOL.md）。

## 工具

- `scripts/ocr-claude-oracle.mjs`：新增 `ORACLE_PARAMS` 的 `unk`（`skip`、`skipSmall`、`skipCap`、數字）。只使用小地圖看得到的資訊。
- `scripts/check-ocr-claude.cjs`：新增 claude-27 的合成檢查（95 項通過）。
