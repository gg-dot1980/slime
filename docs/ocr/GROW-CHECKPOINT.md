# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow52 策略來源 `b32d3ea7d2a6c7346485c01600d2d8aca50d0263`，HTML Git blob `5c53b0096fb749402aa04403f56046aa031f542d`。 |
| 候選／凍結來源 | Grow52（父版 Grow51），HTML SHA-256 `6a0562b8bd74c38e9d49a666d870fd5e33314dfab8df1b09b4d4633ac96875b6`；凍結提交 `5be6f2c8e4e6e736197521f0227393aa9278c5bf`。[凍結條件](repro/grow-52-public/freeze.json)。 |
| 桌機環境 | QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何。 |
| 模擬手機搖桿 | 本次未另開手機組；既定一次性手機增項已由 Grow51 完成：v2.13 0/4、v2.22 0/4。手機組不混入桌機驗收。 |
| 離線固定回歸 | Grow52 的 1.5 秒可吃 NPC 目標鎖定已否決：四個失敗局總改路由 484 增至 486，4 個決策降低安全間隙、6 個降低收益；Grow51 六個勝局也有 12 個決策被改動。詳見[目標鎖定回放](repro/grow-52-public/results/target-lock-replay.md)。僅供開發，不算自然局。 |
| 已完成探索 | Grow52 桌機固定 4+4：v2.13 1/4（1 死亡、2 截止）、v2.22 0/4（1 死亡、3 截止）；八局完整有效。 |
| 獨立確認 | Grow52 未達雙版 2/4，未啟動確認。最近有效確認仍為 Grow51：v2.13 10/12（通過），v2.22 4/12（未通過）。 |
| 結果資料截止 | 自然結果仍截至 2026-11-27T21:36:49+08:00；目標鎖定回放截至 2026-11-27T23:03:10+08:00。[Grow52 自然結果](repro/grow-52-public/results/README.md)；探索 ledger SHA-256 `94a806c96bd53086f666aeec8cdf21b390c8a62e8a750b1448a150de5f077566`。 |
| 唯一下一步 | 只回放 Grow52 v2.22 中「HUD 已停滯至少 4 秒、攔截模式、第一段背離可吃 NPC 而第二段朝向、安全間隙高於 80」的取樣，把第一段模擬時間由 0.6 秒縮至 0.3 秒；不全域套用。須提高預測吞食或縮短停滯、維持安全間隙 14，且不改壞 Grow51 勝局，才建立新候選。 |
| 診斷依據 | 體型 146 停滯的 10 個攔截取樣中，7 個第一段背離目標，但第二段 10/10 朝向目標；1.5 秒目標鎖定未降低抖動且破壞勝局相反例，因此下一步改查固定 0.6 秒第一段是否造成過度煞車／反向。 |

來源：[Grow52 自然結果](repro/grow-52-public/results/README.md) · [目標鎖定回放](repro/grow-52-public/results/target-lock-replay.md) · [Grow52 彙總](repro/grow-52-public/results/aggregates.json) · [Grow52 說明](repro/grow-52-public/README.md) · [Grow52 凍結條件](repro/grow-52-public/freeze.json) · [Grow51 自然結果](repro/grow-51-public/results/README.md) · [精簡續跑流程](GROW-WORKFLOW.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
