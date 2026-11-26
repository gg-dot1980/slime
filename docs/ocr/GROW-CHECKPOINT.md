# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow47 凍結來源 `daeb7d9a6d48a6b76de2e286731f5c70016cd589`；18 檔 GitHub 完整回讀一致 |
| 候選／凍結來源 | Grow47；HTML SHA-256 `a333fd5ba52c2cbb4c6eb17fde85f5e53c9a98924a61440fe606ccb8fca27fee`；直接父版 Grow46 |
| 環境分組 | 桌機 QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何 |
| 已完成探索 | v2.13 4/4、v2.22 1/4 |
| 確認狀態 | 兩版探索未同時達到各 2/4，獨立確認未啟動。 |
| 結果資料截止 | 自然探索於台灣時間 2026-11-26 17:21 封帳；另以三局截止的 435 筆可見決策完成離線回放。 |
| 唯一下一步 | 下一次僅建立一個 v2.22 候選，移除 1.5 秒終點距牆小於 600 的扣分，保留小於 150 與穿牆扣分。凍結後以同一 QHD 流程預檢、診斷及各版 4 局探索，觀察截止與死亡是否改善。 |
| 目前阻礙 | 本次原生 QHD 預檢、診斷與探索均完成。先前小視窗環境的零開局預檢已另存歷史結果。 |

來源：[Grow47 原生結果](repro/grow-47-public/results/natural.md) · [Grow47 實際預檢及阻礙](repro/grow-47-public/results/README.md) · [Grow47 來源與有限檢查](repro/grow-47-public/README.md) · [Grow46 確認結果](repro/grow-46-public/results/README.md) · [固定提交的 Grow46 探索彙總](https://github.com/gg-dot1980/slime/blob/25d668f620c72ca3f0e401ea87627859a1a8e75a/docs/ocr/repro/grow-46-public/results/README.md)。後續最新內容由 [Grow46 結果入口](repro/grow-46-public/results/README.md)及相應私人原始紀錄核對；[精簡續跑流程](GROW-WORKFLOW.md)、[既有 runner](repro/grow-local-r4-20261126/README.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
