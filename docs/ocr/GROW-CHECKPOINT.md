# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow48 `d0514d545a042ddf2d00c3e6942e97dc2e03085e`；Git tree 與候選 HTML 雜湊一致。 |
| 候選／凍結來源 | Grow48；HTML SHA-256 `c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253`；父版 Grow47 |
| 環境分組 | 桌機 QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何 |
| 已完成探索 | v2.13 2/4、v2.22 1/4 |
| 確認狀態 | 探索未通過兩版各 2/4 門檻，獨立確認未啟動。 |
| 結果資料截止 | 2026-11-26T19:23:33+08:00 核驗 |
| 唯一下一步 | v2.22 的 3 局死亡在最後一筆決策中，小地圖估計玩家中心距最近牆為 284–528 世界單位。唯一下一步是回放這 3 局死亡前與 Grow47 三局截止的可見決策，檢查只在可見大型 NPC 逼近時恢復終點牆距扣分，能否改善避險並保留捕食方向。 |
| 目前阻礙 | 本機 QHD 預檢、控制診斷與本階段獨立稽核均已完成。 |

來源：[Grow48 原生結果](repro/grow-48-public/results/natural.md) · [Grow47 原生結果](repro/grow-47-public/results/natural.md) · [Grow47 實際預檢及阻礙](repro/grow-47-public/results/README.md) · [Grow47 來源與有限檢查](repro/grow-47-public/README.md) · [Grow46 確認結果](repro/grow-46-public/results/README.md) · [固定提交的 Grow46 探索彙總](https://github.com/gg-dot1980/slime/blob/25d668f620c72ca3f0e401ea87627859a1a8e75a/docs/ocr/repro/grow-46-public/results/README.md)。後續最新內容由 [Grow46 結果入口](repro/grow-46-public/results/README.md)及相應私人原始紀錄核對；[精簡續跑流程](GROW-WORKFLOW.md)、[既有 runner](repro/grow-local-r4-20261126/README.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
