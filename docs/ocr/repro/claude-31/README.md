# claude-31：claude-29＋2000px 辨識＋Grow46 幾何修正（v2.13 與最新版 v2.22）

2026-11-28（台灣時間）。分支 `ocr`，依 [Claude 續測流程](../../CLAUDE-WORKFLOW.md)。凍結來源見 [freeze.json](freeze.json)。不是正式驗收。**桌機探索未達門檻，未開確認，沒有採用。**

## 依據

[校準與拆解](../claude-31-factorial/README.md)：
- Grow46 決策＋Grow 辨識：v2.13 3/4、v2.22 2/4。
- Grow46 決策＋Claude 層級辨識：1/4、1/4。

所以把 Claude 的辨識補到 Grow 的水準，決策照舊：
- QHD 讀圖從縮到 1200px 改為 2000px（同 Grow46）。
- NPC 加上 Grow46 的 `refineSlimeGeometry`（highlight 橢圓幾何修正），從 [0ec23d98 的 ocr-grow46.html](https://github.com/gg-dot1980/slime/blob/0ec23d98966f04e88aa9c54ec1c5a409597669e9/docs/ocr/repro/grow-46-public/ocr-grow46.html) 原樣複製。

決策和 claude-29 完全相同。QHD 每次決策計算時間（v2.22，60 秒，300 次）：中位 29ms、p90 34ms、p99 56ms、最大 74ms。

## 自然局探索（實際速度，[exploration.json](exploration.json)）

| 組 | 版本 | 勝／局 | 死亡 | 截止 | 終場體型 | 中位 | 吞 NPC 中位 | 食物成長中位 | NPC 成長中位 |
|---|---|---|---|---|---|---|---|---|---|
| QHD 桌機 | v2.13 | 0/4 | 1 | 3 | 132、129、82、133 | 130.5 | 14.0 | 33.1 | 70.7 |
| QHD 桌機 | v2.22 | 0/4 | 0 | 4 | 145、126、145、160 | 145.0 | 14.0 | 31.5 | 88.4 |
| 手機搖桿 | v2.13 | 0/4 | 0 | 4 | 82、84、91、113 | 87.5 | 5.5 | 40.8 | 24.2 |
| 手機搖桿 | v2.22 | 0/4 | 0 | 4 | 83、80、97、72 | 81.5 | 4.5 | 38.2 | 23.1 |

- 16 局都有有效結果，沒有中止或未知。
- 桌機體型中位：v2.13 130.5，v2.22 145。claude-29 是 137.5、140，差不多。
- 不開確認。

## 解讀

辨識補到 Grow 的水準後，Claude 的決策仍然 0 勝。對照拆解實驗：同樣的 Grow 辨識配上 Grow46 決策是 3/4、2/4。所以**現在的瓶頸主要在 Claude 的決策方法**：逐方向推演 1.5 秒，加上目標吸引。

下一步若繼續 Claude 線，應該改用 Grow46 的決策（`planGrow46` 及其依賴），也就是把 Grow46 的規劃器移到 Claude 頁面。
