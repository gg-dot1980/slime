# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow54 策略來源 `bd6af4f2b6c47ecac7c105fbe9c872cf98552545`，HTML Git blob `ff6b83242a640610154286e9f5d8cce12e097271`。 |
| 候選／凍結來源 | Grow54（父版 Grow53），HTML SHA-256 `3372fbb4c9d1e42e14d2f88a1f980a68477b7856f55f58ba32e53610e77338f4`；凍結提交 `991fbbc9f4afafd1eccaf6db25ec097e3a975f56`。[凍結條件](repro/grow-54-public/freeze.json)。 |
| 桌機環境 | QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何。 |
| 模擬手機搖桿 | 本次未另開手機組；既定一次性手機增項已由 Grow51 完成：v2.13 0/4、v2.22 0/4。手機組不混入桌機驗收。 |
| 離線固定回歸 | Grow54 回放重現 Grow53 兩個死亡局基準 211/211；兩局均延長退路，Grow51 六個勝局只有 1 次改路且預測收益、安全間隙均未下降。僅供開發，不算自然局。 |
| 已完成探索 | Grow54 桌機固定 4+4：v2.13 4/4；v2.22 1/4（1 勝、2 死亡、1 截止）；八局完整有效。 |
| 獨立確認 | Grow54 的 v2.22 未達 2/4，未啟動確認。最近有效確認仍為 Grow51：v2.13 10/12（通過），v2.22 4/12（未通過）。 |
| 結果資料截止 | 自然結果截至 2026-11-28T05:27:06+08:00。[Grow54 自然結果](repro/grow-54-public/results/README.md)；探索 ledger SHA-256 `9e3a55d225833a3252f68523614378031d69bd83cc6a93dd6c93f6268a0c7560`。 |
| 唯一下一步 | 只回放 Grow54 兩個死亡局最後的逃逸片段，並以 Grow54 勝局、體型 194 截止局及 Grow51 六個勝局作相反例。當逃逸保持中且所有路徑立即間隙仍為負時，比較先最大化 0.6 秒立即間隙、再比較 2.2 秒終點間隙；須改善兩個死亡尾端、不新增牆邊卡住且不降低勝局預測收益，才建立新候選。 |
| 診斷依據 | Grow54 兩個死亡局結束時仍維持逃逸，已排除過早解除；但最後四個可見決策的立即間隙分別由 −51.2 惡化至 −84.6、由 −56.9 惡化至 −149.3，而終點間隙仍為正，下一步改查緊急排序是否過度重視遠端終點。 |

來源：[Grow54 自然結果](repro/grow-54-public/results/README.md) · [Grow54 彙總](repro/grow-54-public/results/aggregates.json) · [Grow54 回放摘要](repro/grow-54-public/validation/replay-summary.json) · [Grow54 說明](repro/grow-54-public/README.md) · [Grow54 凍結條件](repro/grow-54-public/freeze.json) · [Grow51 自然結果](repro/grow-51-public/results/README.md) · [精簡續跑流程](GROW-WORKFLOW.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
