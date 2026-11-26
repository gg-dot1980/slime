# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | 遠端基底 `2656aa027277090b16bb7eea62d155d0ab271114`；Grow47 新來源見本提交 |
| 候選／凍結來源 | Grow47；HTML SHA-256 `a333fd5ba52c2cbb4c6eb17fde85f5e53c9a98924a61440fe606ccb8fca27fee`；直接父版 Grow46 |
| 環境分組 | 桌機 QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何 |
| 已完成探索 | Grow47 尚未開局。Grow46 已結案探索 v2.13 4/4、v2.22 3/4，分母完整保留。 |
| 確認狀態 | Grow47 尚未開始。Grow46 獨立確認 v2.13 10/12、v2.22 4/12，未達雙版各 6/12；不追加舊批次。 |
| 結果資料截止 | Grow46 台灣時間 2026-11-26 15:22:46；Grow47 目前僅有限機制檢查及獨立來源 review |
| 唯一下一步 | 用既有獨立 Chromium 測試入口核對 Grow47 的 QHD 0 開局預檢與兩局短控制診斷，通過後由 runner 執行各版 4 局探索及合格後各 12 局獨立確認。 |

來源：[Grow47 來源與有限檢查](repro/grow-47-public/README.md) · [Grow46 確認結果](repro/grow-46-public/results/README.md) · [固定提交的 Grow46 探索彙總](https://github.com/gg-dot1980/slime/blob/25d668f620c72ca3f0e401ea87627859a1a8e75a/docs/ocr/repro/grow-46-public/results/README.md)。後續最新內容由 [Grow46 結果入口](repro/grow-46-public/results/README.md)及相應私人原始紀錄核對；[精簡續跑流程](GROW-WORKFLOW.md)、[既有 runner](repro/grow-local-r4-20261126/README.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
