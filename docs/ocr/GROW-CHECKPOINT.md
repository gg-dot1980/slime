# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow50 策略來源 `36f3372ae12210f105911907ce24d3bcbfd6fe09`，HTML Git blob `a359264beaf19e571cd1f56bd9267d3af5b39b8f`。 |
| 候選／凍結來源 | Grow50（父版 Grow49），HTML SHA-256 `3f04d509d6bc0b8ad95865bf8f5a75f2282ad87cf2cd6737b6ed11e6e44ff8f6`。[凍結條件](repro/grow-50-public/freeze.json)。 |
| 環境分組 | 桌機 QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何 |
| 離線固定回歸 | Grow49 v2.22 三張死亡合併影格皆恢復硬威脅（3/3）；九張勝局免疫控制皆未誤恢復（0/9）。十二張 PNG 與十二份 sidecar 均逐檔核對雜湊，獨立覆核通過。此結果僅供候選開發，不算自然局。 |
| 已完成探索 | Grow50 封帳，v2.13 4/4、v2.22 1/4；八局均有有效結果及釋鍵紀錄。v2.22 為 1 勝、2 死亡、1 截止。 |
| 確認狀態 | Grow50 的 v2.22 未達 2/4，兩版獨立確認均開 0 局。Grow46 的歷史獨立確認為 v2.13 10/12、v2.22 4/12。 |
| 結果資料截止 | 2026-11-27T13:49:05+08:00 [Grow50 自然探索](repro/grow-50-public/results/natural.md)。完整 ledger SHA-256 `35af00760ead30a2cbfe39c38ca4d52b764a73d1ac92c81f37eba8034d78e396`。 |
| 唯一下一步 | 固定回放 Grow50 v2.22 的兩局死亡末段，對照同批勝局；只驗證一個假說：多個已辨識硬威脅包圍時，規劃器仍以 `food-and-exploration` 前進且 `escaping=false`。比較「至少一條路徑預測 `endGap<0` 且硬威脅密集」時強制選最大安全間隙，是否能提早脫離又不拖慢勝局。回放支持後才建立下一候選。 |
| 回放紀錄 | Grow50 的合併警告固定回歸仍為死亡畫面 3/3 恢復、勝局控制 0/9 誤報；新自然死亡末筆已有 5／8 個威脅，但都未啟動逃逸，顯示下一步應先查逃逸門檻，而非再次放寬合併辨識。 |

來源：[Grow50 自然結果](repro/grow-50-public/results/natural.md) · [Grow50 說明](repro/grow-50-public/README.md) · [Grow49 自然結果](repro/grow-49-public/results/natural.md) · [Grow49 近身威脅回放](repro/grow-49-public/results/close-threat-replay.md) · [Grow48 原生結果](repro/grow-48-public/results/natural.md) · [Grow46 確認結果](repro/grow-46-public/results/README.md) · [精簡續跑流程](GROW-WORKFLOW.md) · [既有 runner](repro/grow-local-r4-20261126/README.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
