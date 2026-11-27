# 校準與拆解：Grow46 決策＋Claude 層級辨識（v2.13 與最新版 v2.22）

2026-11-27（台灣時間）。分支 `ocr`。測試平台用 Grow 研究分支 d283cb8 的原生 QHD 測試台，不修改研究分支：
- 伺服器與 ledger：`grow-local-r4-20261126/server.cjs --geometry-mode qhd`。
- 執行器：`grow-38-public/geometry/native.py`。

條件：視窗 2560×1440，畫布 2250×1308，DPR 1，Chrome for Testing 153，一次一個瀏覽器，實際速度。只列出各組彙總（[summary.json](summary.json)）；逐局 ledger 存在私人紀錄（含 rawSha256）。不是正式驗收。

## 為什麼做

Claude27～30 實戰都是 0 勝。要分清楚瓶頸在決策還是辨識：
1. 先在本環境重跑 Grow46，確認 Grow 在這裡仍然會過關（校準）。
2. 再讓 Grow46 的決策改吃 Claude 層級的辨識。

## 兩組設定

| 組 | 來源 | 辨識 | 決策 |
|---|---|---|---|
| grow46 | [0ec23d98 的 ocr-grow46.html](https://github.com/gg-dot1980/slime/blob/0ec23d98966f04e88aa9c54ec1c5a409597669e9/docs/ocr/repro/grow-46-public/ocr-grow46.html)，未改 | Grow：讀圖縮到 2000px 寬＋`refineSlimeGeometry` 幾何修正 | Grow46 |
| grow91（本機研究候選） | 同上，只改兩處 | Claude 層級：讀圖縮到 1200px 寬（和 `src/ocr-claude.html` 相同），不做幾何修正 | Grow46 |

grow91 的 SHA-256 見 summary.json。它只在本機測試台註冊，沒有上傳到研究分支。

## 探索結果（每版 4 局）

| 組 | v2.13 勝／局 | v2.22 勝／局 | 死亡（v2.13／v2.22） | 過關秒數 |
|---|---|---|---|---|
| grow46 | **3/4** | **2/4** | 0／2 | v2.13：122、140、112；v2.22：96、131 |
| grow91 | 1/4 | 1/4 | 0／2 | v2.13：128；v2.22：128 |
| 參考：claude-29（[紀錄](../claude-29/README.md)，自己的執行器） | 0/4 | 0/4 | 0／0 | — |

16 局全部有效，沒有中止或未知，ledger 完整性檢查通過。

## 解讀

- **校準成功**：Grow46 在本環境兩版都達到探索門檻（≥2/4）。所以 Claude 的 0 勝不是環境或計分造成的。
- **辨識和決策都有影響**（每格只有 4 局，只能看方向）：
  - Grow46 決策吃 Claude 層級辨識後，從 3/4、2/4 降到 1/4、1/4，辨識的解析度與幾何修正約占一半效果。
  - 辨識同為 Claude 層級時，Grow46 決策仍有 1/4、1/4，而 claude-29 是 0/4、0/4，決策也有差。
- **Claude 一個明顯可修的地方**：`readImage` 在 QHD 下把 2250px 畫布縮到 1200px 才辨識。Grow46 縮到 2000px，並對 NPC 做幾何修正。

## 下一步

claude-31 = claude-29 加上：
- 讀圖解析度 2000px（先量計算時間，要確定 <200ms）。
- Grow46 的 `refineSlimeGeometry`。

先用這個候選把辨識補到 Grow 的水準，再看還剩多少決策差距。
