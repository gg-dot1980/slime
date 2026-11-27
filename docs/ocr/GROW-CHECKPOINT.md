# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow50 策略來源 `36f3372ae12210f105911907ce24d3bcbfd6fe09`，HTML Git blob `a359264beaf19e571cd1f56bd9267d3af5b39b8f`。 |
| 候選／凍結來源 | Grow50（父版 Grow49），HTML SHA-256 `3f04d509d6bc0b8ad95865bf8f5a75f2282ad87cf2cd6737b6ed11e6e44ff8f6`。[凍結條件](repro/grow-50-public/freeze.json)。 |
| 環境分組 | 桌機 QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何 |
| 離線固定回歸 | Grow49 v2.22 三張死亡合併影格皆恢復硬威脅（3/3）；九張勝局免疫控制皆未誤恢復（0/9）。十二張 PNG 與十二份 sidecar 均逐檔核對雜湊，獨立覆核通過。此結果僅供候選開發，不算自然局。 |
| 已完成探索 | Grow50 兩版均已開 0／預定 4。上一候選 Grow49 封帳為 v2.13 4/4、v2.22 1/4。 |
| 確認狀態 | Grow50 尚未啟動獨立確認。Grow46 的歷史獨立確認為 v2.13 10/12、v2.22 4/12。 |
| 結果資料截止 | Grow50 自然局 0/8；最新自然結果仍為 [Grow49 自然探索](repro/grow-49-public/results/natural.md)，截至 2026-11-27T10:07:26+08:00。 |
| 唯一下一步 | 以凍結 Grow50 執行 QHD 預檢與控制診斷，再由同一 runner 連跑 v2.13、v2.22 各固定 4 局探索。雙版各達 2/4 且 ledger 完整才以同一凍結候選各另起 12 局確認。 |
| 回放紀錄 | Grow50 只增加 v2.22 的近身合併警告恢復；v2.13 沿用 Grow49 決策。固定回歸彙總見 [Grow50 驗證資料](repro/grow-50-public/validation/merged-warning-regression.json)。 |

來源：[Grow50 說明](repro/grow-50-public/README.md) · [Grow49 自然結果](repro/grow-49-public/results/natural.md) · [Grow49 近身威脅回放](repro/grow-49-public/results/close-threat-replay.md) · [Grow48 原生結果](repro/grow-48-public/results/natural.md) · [Grow46 確認結果](repro/grow-46-public/results/README.md) · [精簡續跑流程](GROW-WORKFLOW.md) · [既有 runner](repro/grow-local-r4-20261126/README.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
