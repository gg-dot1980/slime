# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow55 策略來源 `f471ad478cea50a27119c97f68bf83b405dc53f5`，HTML Git blob `03b4cd98ce1b581d62efaa602a71d909ba91b2cb`。 |
| 候選／凍結來源 | Grow55（父版 Grow54），HTML SHA-256 `089f8b8e1dad3b1a7696c5b941d3783154c1b680c2f53eeaf3c114024b4327a4`；凍結提交 `75c2d3ebb4b768116c571cee3a1ac69f69bbb5a3`。[凍結條件](repro/grow-55-public/freeze.json)。 |
| 桌機環境 | QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何。 |
| 模擬手機搖桿 | 本次未另開手機組；既定一次性手機增項已由 Grow51 完成：v2.13 0/4、v2.22 0/4。手機組不混入桌機驗收。 |
| 離線固定回歸 | Grow55 回放 1,077 個快照，1,076 個精確重現基準路徑／模式；兩個 Grow54 死亡尾端共 8 個合格決策、6 個改路，6/6 均改善立即間隙，沒有降低預測收益或新增牆邊卡住；相反例未觸發。僅供開發，不算自然局。 |
| 已完成探索 | Grow55 桌機固定 4+4：v2.13 3/4（3 勝、1 截止）；v2.22 2/4（2 勝、1 死亡、1 截止）；8/8 完整有效，兩版均達 2/4。 |
| 獨立確認 | 同一凍結 Grow55 另起 12+12：v2.13 10/12（10 勝、2 截止）；v2.22 6/12（6 勝、3 死亡、3 截止）；24/24 完整有效，雙版均達 6/12。 |
| 結果資料截止 | 自然結果截至 2026-11-28T08:25:36+08:00。[Grow55 自然結果](repro/grow-55-public/results/README.md)；探索 ledger SHA-256 `ac908d6f0cc5bfdcd5d32bf10f20877a42cabbe9a59d6724907e2eda62a9d847`；確認 ledger SHA-256 `33c32fa36ea1ad0b4e667f1ba51d99a3b1b8500abd713df1e1f647eda1aed4e0`。 |
| 唯一下一步 | 已達雙版桌機目標；完成私人保存與遠端結果核對後停用續跑。不得再建立候選或新開正式局。 |
| 診斷依據 | Grow55 的立即間隙優先排序通過兩組離線死亡尾端與相反例，並於自然探索通過雙版門檻；獨立確認實得 v2.13 10/12、v2.22 6/12，完成原驗收。 |

來源：[Grow55 自然結果](repro/grow-55-public/results/README.md) · [Grow55 彙總](repro/grow-55-public/results/aggregates.json) · [Grow55 回放摘要](repro/grow-55-public/validation/replay-summary.json) · [Grow55 說明](repro/grow-55-public/README.md) · [Grow55 凍結條件](repro/grow-55-public/freeze.json) · [Grow51 手機與自然結果](repro/grow-51-public/results/README.md) · [精簡續跑流程](GROW-WORKFLOW.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
