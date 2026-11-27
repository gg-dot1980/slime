# OCR Grow 接續檢查點

此檔為短索引，不是即時狀態或獨立驗收證據。接續時先比對遠端變更及現有 ledger；較新的有效資料優先。公開只保存可公開彙總及來源，不放私人證據連結。

| 欄位 | 最近已核對的紀錄 |
|---|---|
| 研究分支 | `feat/grow-evaluation-20261125` |
| 已核對來源提交 | Grow49 策略來源 `18e8ee62f411a0bc388dc858ee08b1cfe51ad4b3`，HTML Git blob `8de3a9e34f196e5ffac279270da4009f5c9d9d4c`。 |
| 候選／凍結來源 | Grow49（父版 Grow48），HTML SHA-256 `85071f2d68a8320b444aa643f5dffb61cbe2523f6de5caf8cb45ba542bd5a0b6`。[凍結條件](repro/grow-49-public/freeze.json)。 |
| 環境分組 | 桌機 QHD，視窗 2560×1440、原畫布 2250×1308、DPR 1；不混用其他幾何 |
| 已完成探索 | Grow49 封帳，v2.13 4/4、v2.22 1/4。Grow48 為 v2.13 2/4、v2.22 1/4。 |
| 確認狀態 | Grow49 在 v2.22 未達 2/4，兩版獨立確認均開 0 局。Grow46 歷史獨立確認為 v2.13 10/12、v2.22 4/12。 |
| 結果資料截止 | 2026-11-27T10:07:26+08:00 [Grow49 自然探索](repro/grow-49-public/results/natural.md)。8 局均有結算及釋鍵紀錄，4 局控制診斷另計。 |
| 唯一下一步 | 離線回放 v2.22 三局死亡前的連續主畫面、小地圖及規劃器輸入，核對近身或重疊的大型 NPC 是否漏辨或低估，並檢查較早是否存在安全轉向。 |
| 目前阻礙 | v2.22 三局死亡前最後一筆決策均回報威脅但未啟動逃生。吞食者身分、預測間距是否高估及當時可行退路仍待核對。 |

來源：[Grow48 原生結果](repro/grow-48-public/results/natural.md) · [Grow47 原生結果](repro/grow-47-public/results/natural.md) · [Grow47 實際預檢及阻礙](repro/grow-47-public/results/README.md) · [Grow47 來源與有限檢查](repro/grow-47-public/README.md) · [Grow46 確認結果](repro/grow-46-public/results/README.md) · [Grow46 進度門檻](repro/grow-46-public/results/progress-timing.md) · [Grow46 成長實現率](repro/grow-46-public/results/gain-realization.md) · [Grow46 目標連續性](repro/grow-46-public/results/target-continuity.md) · [Grow46 45° 轉向回放](repro/grow-46-public/results/turn-limit-replay.md) · [Grow46 擺盪核對](repro/grow-46-public/results/oscillation-audit.md) · [固定提交的 Grow46 探索彙總](https://github.com/gg-dot1980/slime/blob/25d668f620c72ca3f0e401ea87627859a1a8e75a/docs/ocr/repro/grow-46-public/results/README.md)。後續最新內容由 [Grow46 結果入口](repro/grow-46-public/results/README.md)及相應私人原始紀錄核對；[精簡續跑流程](GROW-WORKFLOW.md)、[既有 runner](repro/grow-local-r4-20261126/README.md)。

每階段完成後只更新本表與下一步，附當次來源；舊成績仍保留在逐版結果中。若目前候選或批次已前進，先更新索引，不照過時的下一步重新開局。
