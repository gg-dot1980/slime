# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow47 凍結來源 `daeb7d9a6d48a6b76de2e286731f5c70016cd589`；18 檔 GitHub 完整回讀一致 |
| 候選／凍結來源 | Grow48；HTML SHA-256 `c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253`；父版 Grow47 |
| 環境分組 | 桌機 QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何 |
| 已完成探索 | Grow48 v2.13、v2.22 各 0 次開局，預定各 4 局。 |
| 確認狀態 | 尚待探索。 |
| 結果資料截止 | Grow48 來源建立時；Grow47 的封帳與回放見下方。 |
| 唯一下一步 | 使用 Grow48 凍結來源執行 QHD 同源預檢、控制診斷與固定探索。 |
| 目前阻礙 | 待 Grow48 原生預檢。 |

來源：[Grow48 原生結果](repro/grow-48-public/results/natural.md) · [Grow47 原生結果](repro/grow-47-public/results/natural.md) · [Grow47 實際預檢及阻礙](repro/grow-47-public/results/README.md) · [Grow47 來源與有限檢查](repro/grow-47-public/README.md) · [Grow46 確認結果](repro/grow-46-public/results/README.md) · [固定提交的 Grow46 探索彙總](https://github.com/gg-dot1980/slime/blob/25d668f620c72ca3f0e401ea87627859a1a8e75a/docs/ocr/repro/grow-46-public/results/README.md)。後續最新內容由 [Grow46 結果入口](repro/grow-46-public/results/README.md)及相應私人原始紀錄核對；[精簡續跑流程](GROW-WORKFLOW.md)、[既有 runner](repro/grow-local-r4-20261126/README.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
