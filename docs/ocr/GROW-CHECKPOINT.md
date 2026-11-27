# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow53 策略來源 `0dcffd2b4dbf6c4b3266c419f459c572c209eae3`，HTML Git blob `6062af55a49d85e72efe99c4373b777a02486c80`。 |
| 候選／凍結來源 | Grow53（父版 Grow52），HTML SHA-256 `2ee212a3be69555a9b04b39bc7b8f45f932f79154e075d41da37ebc18cca794c`；凍結提交 `ba1c0ecc67e8350575bb4e50889810bdd10b5260`。[凍結條件](repro/grow-53-public/freeze.json)。 |
| 桌機環境 | QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何。 |
| 模擬手機搖桿 | 本次未另開手機組；既定一次性手機增項已由 Grow51 完成：v2.13 0/4、v2.22 0/4。手機組不混入桌機驗收。 |
| 離線固定回歸 | Grow53 候選實際狀態回放重現 Grow52 基準 553/553；失敗局改路 3 次、2 次提高預測成長，沒有引入安全間隙低於 14 的路徑；Grow51 六個勝局只有 1 次改路且沒有收益或安全退化。僅供開發，不算自然局。 |
| 已完成探索 | Grow53 桌機固定 4+4：v2.13 4/4；v2.22 0/4（2 死亡、2 截止）；八局完整有效。 |
| 獨立確認 | Grow53 的 v2.22 未達 2/4，未啟動確認。最近有效確認仍為 Grow51：v2.13 10/12（通過），v2.22 4/12（未通過）。 |
| 結果資料截止 | 自然結果截至 2026-11-28T03:36:26+08:00。[Grow53 自然結果](repro/grow-53-public/results/README.md)；探索 ledger SHA-256 `a0ee2901fdc09b2df87ae25b8806fad51e78e6ed8fac1bd2d8c51df203fa2b03`。 |
| 唯一下一步 | 只回放 Grow53 兩個死亡局的緊急逃逸片段及 Grow51 勝局相反例：既有規劃器在安全間隙小於等於 0 時已進入逃逸後，不固定方向，但後續候選須維持逃逸，直到連續兩個可見畫面的安全間隙均至少 14。須延長死亡前退路，且不降低勝局收益或造成牆邊卡住，才建立新候選。 |
| 診斷依據 | Grow53 的三畫面速度中位數在 v2.22 四局實際套用 5、9、3、12 次，共 29 次仍為 0/4。兩個死亡局均出現安全間隙為負的 `escape`，下一個可見決策卻立刻回到 `escaping=false`，因此下一步改查緊急逃逸過早解除，而非再調速度平滑。 |

來源：[Grow53 自然結果](repro/grow-53-public/results/README.md) · [Grow53 彙總](repro/grow-53-public/results/aggregates.json) · [Grow53 回放摘要](repro/grow-53-public/validation/replay-summary.json) · [Grow53 說明](repro/grow-53-public/README.md) · [Grow53 凍結條件](repro/grow-53-public/freeze.json) · [Grow51 自然結果](repro/grow-51-public/results/README.md) · [精簡續跑流程](GROW-WORKFLOW.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
