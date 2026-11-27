# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow50 策略來源 `36f3372ae12210f105911907ce24d3bcbfd6fe09`，HTML Git blob `a359264beaf19e571cd1f56bd9267d3af5b39b8f`。 |
| 候選／凍結來源 | Grow50（父版 Grow49），HTML SHA-256 `3f04d509d6bc0b8ad95865bf8f5a75f2282ad87cf2cd6737b6ed11e6e44ff8f6`。[凍結條件](repro/grow-50-public/freeze.json)。 |
| 環境分組 | 桌機 QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何 |
| 下一版追加測試 | Grow50 之後第一個新凍結候選另跑[模擬手機搖桿組](repro/grow-mobile-joystick/README.md)，v2.13 和 v2.22 各 4 局。兩個版本分列勝率與分母。狀態為待候選凍結。 |
| 離線固定回歸 | Grow49 v2.22 三張死亡合併影格皆恢復硬威脅（3/3）；九張勝局免疫控制皆未誤恢復（0/9）。十二張 PNG 與十二份 sidecar 均逐檔核對雜湊，獨立覆核通過。此結果僅供候選開發，不算自然局。 |
| 已完成探索 | Grow50 封帳，v2.13 4/4、v2.22 1/4；八局均有有效結果及釋鍵紀錄。v2.22 為 1 勝、2 死亡、1 截止。 |
| 確認狀態 | Grow50 的 v2.22 未達 2/4，兩版獨立確認均開 0 局。Grow46 的歷史獨立確認為 v2.13 10/12、v2.22 4/12。 |
| 結果資料截止 | 2026-11-27T17:10:27+08:00 [Grow50 選中路徑終點間隙趨勢回放](repro/grow-50-public/results/end-gap-trend-replay.md)。自然探索完整 ledger SHA-256 `35af00760ead30a2cbfe39c38ca4d52b764a73d1ac92c81f37eba8034d78e396`。 |
| 唯一下一步 | 固定回放 Grow50 v2.22 的 5 個原選路徑負值事件，只驗證「選中路徑剛切換且 `endGap<0`」時改走最大安全間隙是否仍有足夠反應時間。逐幀核對替代路徑 `wallOK`、`clearance`、首次觸發到死亡的時間，並以第 2 局勝局作相反例；兩個死亡組與勝局都支持後才建立候選。 |
| 回放紀錄 | Grow50 規劃器 144/144 幀精確重現。先前廣義條件會改變勝局 8 幀，故已排除。此次連續下降假說在 5 個原選負值事件前命中 0/5；其中 4/5 於事件當幀切換路徑，3/5 在約 100–113 ms 由正值跳為負值。勝局原選路徑負值為 0，但缺少等密度的成功前趨勢樣本，因此不建立新候選。 |

來源：[Grow50 選中路徑終點間隙趨勢回放](repro/grow-50-public/results/end-gap-trend-replay.md) · [Grow50 密集威脅／終點間隙回放](repro/grow-50-public/results/dense-gap-replay.md) · [Grow50 自然結果](repro/grow-50-public/results/natural.md) · [Grow50 說明](repro/grow-50-public/README.md) · [Grow49 自然結果](repro/grow-49-public/results/natural.md) · [Grow49 近身威脅回放](repro/grow-49-public/results/close-threat-replay.md) · [Grow48 原生結果](repro/grow-48-public/results/natural.md) · [Grow46 確認結果](repro/grow-46-public/results/README.md) · [精簡續跑流程](GROW-WORKFLOW.md) · [既有 runner](repro/grow-local-r4-20261126/README.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
