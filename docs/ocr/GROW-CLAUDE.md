# Grow 與 Claude 的策略和測試結果

**要重跑有獨立確認資料的寬畫面策略，可從 Grow46 開始。** 它在 v2.13 的確認局限時過關 10/12，v2.22 為 4/12，距離兩版各 6/12 的預定門檻還差兩場 v2.22 勝局。最新的 Grow49 針對畫面邊緣的大型 NPC 修正中心位置，探索成績是 4/4、1/4，兩版確認均未啟動。Claude 分支最新測到 Claude26，研究基準仍是 Claude22。[Grow46 確認](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-46-public/results/README.md) · [Grow49 封帳](https://github.com/gg-dot1980/slime/blob/0ec23d98966f04e88aa9c54ec1c5a409597669e9/docs/ocr/repro/grow-49-public/results/natural.md) · [Claude26 判定](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/docs/ocr/repro/phase2-claude26/README.md)

## Grow 的原生 QHD 測試

每一格都是「150 遊戲秒內過關／有效結算」，以原遊戲顯示體型已達 200 的成功結算為準。死亡與截止都算有效局。各批使用 2560×1440 外窗、2250×1308 遊戲畫布、DPR 1。每版四次自然開局，兩版都至少兩勝才另開每版十二局確認。每個候選自行開新局，因此同列適合查兩版表現，跨列差額則包含開局隨機差異。[測試條件與分母](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-46-public/results/README.md)

| 策略與階段 | v2.13 | v2.22 | 調整與觀察 |
|---|---:|---:|---|
| Grow38 探索 | 4/4 | 0/4 | 桌機寬視野的比較基準 |
| Grow44 探索 | 2/4 | 0/4 | v2.22 提高兩秒內可接觸獵物的評分 |
| Grow45 探索 | 4/4 | 1/4 | v2.22 換用 Grow15 規劃器 |
| Grow46 探索 | 4/4 | 3/4 | v2.22 持續追逐卻沒有接近時，降低轉向後的預期成長 |
| **Grow46 獨立確認** | **10/12** | **4/12** | v2.22 其餘八局皆死亡 |
| Grow47 探索 | 4/4 | 1/4 | v2.22 納入預測牆距，其餘三局皆截止 |
| Grow48 探索 | 2/4 | 1/4 | v2.22 移除 1.5 秒終點的牆距扣分，其餘三局皆死亡 |
| Grow49 探索 | 4/4 | 1/4 | v2.22 用可見圓弧修正單邊裁切的大型 NPC 中心，其餘三局皆死亡 |

Grow49 兩版共八次開局全部有效，確定五勝、三死，逾時、中止、未決各零。另有四局短時間控制診斷，按計畫中止並完成釋鍵。Grow49 首頁保留了探索前的狀態，最終分母以 2026-11-27 10:07（臺北）封帳的自然探索報告為準。[Grow38／44／45／46 彙總](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-46-public/results/aggregates.json) · [Grow47](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-47-public/results/natural.json) · [Grow48](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-48-public/results/natural.json) · [Grow49 封帳報告](https://github.com/gg-dot1980/slime/blob/0ec23d98966f04e88aa9c54ec1c5a409597669e9/docs/ocr/repro/grow-49-public/results/natural.md)

## Claude 的實際速度對照

Claude22 使用 1.5 秒預測避牆。早先與 Claude20 同批實測時，v2.22 死亡由 11/20 降到 6/20，貼牆死亡由六局降到零局，成為後續研究基準。Claude26 在 Claude22 上過濾玩家邊緣的假物件、短暫保留消失的威脅，並合併大型 NPC 的碎片。兩者都略過小地圖白點。Claude 原始單頁的預設選項是 Grow6，重現本表時須明選 Claude22、Claude26。[避牆對照](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/docs/ocr/repro/phase2-wall/README.md) · [Claude26 事前協議](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/docs/ocr/repro/phase2-claude26/PROTOCOL.md) · [策略選單與實作](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/src/ocr-claude.html)

| 版本 | 策略 | 150 秒內過關／有效局 | 死亡 | 終場體型中位數 |
|---|---|---:|---:|---:|
| v2.13 | Claude22 | 0/20 | 0 | 118 |
| v2.13 | Claude26 | 0/20 | 0 | 121 |
| v2.22 | Claude22 | 0/20 | 3 | 111.5 |
| v2.22 | Claude26 | 0/20 | 4 | 138 |

本批以 Linux 無頭 Chrome、實際速度、2000×1163 外窗與 DPR 1 執行。兩策略逐局交錯，每個版本各開四十局，八十局均有效。Claude26 相對 Claude22 的體型中位數差為 v2.13 +3（95% 信賴區間 −10 至 +27）、v2.22 +26.5（−2 至 +41）。兩區間都含零，依事前決策規則保留 Claude22。歷史上 Claude11 在另一批 v2.22 曾於 141 秒過關，該批為 1/20。[Claude26 結果 JSON](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/docs/ocr/repro/phase2-claude26/comparison-noimages.json) · [Claude11／21 對照](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/docs/ocr/repro/phase1-minimap/README.md)

### Claude27 與畫面外白點

[資訊拆解](repro/claude-phase2-information/README.md)用參考機器人比較不同資訊：只看畫面與小地圖時，v2.13、v2.22 各過關 5/10、2/10；若另外知道畫面外白點的真實大小，升到 7/10、7/10。小地圖點的半徑只在 NPC 半徑 45.6～114 時看得出大小。機器人改成只追看得出大小的白點後為 7/10、5/10（3 倍速篩選）。

據此做成的 Claude27 在實速成對比較中兩版都顯著較差：

| 版本 | 策略 | 150 秒內過關／有效局 | 死亡 | 終場體型中位數 |
|---|---|---:|---:|---:|
| v2.13 | Claude22 | 0/20 | 0 | 123 |
| v2.13 | Claude27 | 0/20 | 1 | 92.5 |
| v2.22 | Claude22 | 0/20 | 6 | 110.5 |
| v2.22 | Claude27 | 0/20 | 1 | 88 |

Claude22 − Claude27 的中位數差：v2.13 +30.5（95% CI 12～48）、v2.22 +22.5（3～34）。混合工具顯示兩個原因：
- Claude27 會追 0.93～1.06R 吃不到的白點。改成只追 ≤0.909R 後，完美畫面下 v2.22 升到 3/8。
- 改用真實畫面辨識後，這個優勢就消失了。

[Claude27 紀錄](repro/claude-27/README.md) · [事前協議](repro/claude-27/PROTOCOL.md)

混合工具一次只加入一類辨識誤差時，「被畫面邊緣切掉的物件」單獨就抵銷了追白點的效果：v2.13 體型中位 104.5，v2.22 為 112.5。依此做的 Claude28 只做了篩選（v2.13 103、v2.22 130.5，每版 8 局），標準幾何下未進入實速比較。改用 Grow 的 QHD 幾何（畫布 2250×1308）後篩選較好，便依 [Claude 續測流程](CLAUDE-WORKFLOW.md)凍結並開自然局探索：

| 組 | v2.13 勝／局 | v2.22 勝／局 | 體型中位（v2.13／v2.22） |
|---|---:|---:|---|
| QHD 桌機 | 0/4 | 0/4 | 136.5／130 |
| 手機搖桿（384×467） | 0/4 | 0/4 | 63／95 |

兩版都未達 2/4，未開確認。[Claude28 紀錄](repro/claude-28/README.md)

## 同一起始條件下如何比較

公開對照使用相同原遊戲、初始種子與 2250×1308 畫布，各策略每版兩局。Grow38 在 v2.13、v2.22 分別為 **2/2、1/2**，明選的 Claude22 則為 **0/2、0/2**。兩者仍使用各自的取樣解析度，遊戲由虛擬時鐘驅動。這組測試適合重現同一開局下的路線差異。Grow46、Grow49 和 Claude22／26 的自然批次使用不同畫面設定與開局，仍缺這四個策略在相同原生條件下的直接比較。[同種子比較與重現方法](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-claude-comparison-20261126/README.md)

## 策略來源

| 找哪一版 | 可核對的固定來源 |
|---|---|
| Grow1–26 | 每版有來源提交、控制器或建置入口與成品雜湊。[Grow1–26 還原索引](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-1-26-source-index.md) |
| Grow27–47 | 版本表列凍結控制器 SHA-256，可沿各列進入候選頁與建置資料。[Grow 版本表](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-version-history.md) |
| Grow48、49 | 各有獨立凍結 HTML。Grow49 可由 Grow48 和建置程式重建。[Grow48 頁面](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-48-public/ocr-grow48.html) · [Grow49 頁面](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-49-public/ocr-grow49.html) · [Grow49 建置](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/docs/ocr/repro/grow-49-public/build.py) |
| Claude1–26 | 26 個策略集中在同一頁，以選單切換。建置程式讀入各版遊戲，輸出可由本機靜態網頁伺服器開啟的頁面。[Claude 策略來源](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/src/ocr-claude.html) · [靜態建置](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/scripts/build-ocr-claude.mjs) · [實速批次工具](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/scripts/ocr-claude-batch.mjs) |
