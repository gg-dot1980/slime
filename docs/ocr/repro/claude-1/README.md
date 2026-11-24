# claude-1 / claude-2：獨立靜態測試頁與三批實戰診斷

2026-11-25（台灣時間）。分支 `ocr-claude`，base `test/ocr-test` 46b8aa3f8207ed03bc89c84c6ed896a23bcd5601。**全部為新檔案，未修改任何既有檔案**（`/ocr-grow`、`build.mjs`、`worker.js`、遊戲原始碼皆未動）。不是 OCR4 驗收，不部署 Sites。

## 結論

三批共 36 局，**150 秒內過關 0/36**，各版本均未達 SPEC 的 150 秒／50%。兩個候選策略都沒有可支持的改善，所以測試頁預設維持 grow-6，claude-1、claude-2 只作為可選的實驗。

| 批次 | 局數 | 150 秒內過關 | 死亡 | 150 秒截止（存活） | 截止時體型 | 死亡秒數中位 | 60 秒體型中位 |
|---|---|---|---|---|---|---|---|
| baseline grow-6（未改） | 12 | 0 | 9 | 3 | 130, 102, 127 | 108 | 58 |
| claude-1 | 12 | 0 | 8 | 4 | 131, 123, 106, 113 | 92 | 59 |
| claude-2 | 12 | 0 | 8 | 4 | 85, 152, 77, 109 | 110 | 54 |

逐版本（死亡／截止）：

| 版本 | baseline | claude-1 | claude-2 |
|---|---|---|---|
| v2.13 | 1／2 | 0／3 | 2／1 |
| v2.20 | 3／0 | 3／0 | 3／0 |
| v2.21 | 3／0 | 3／0 | 3／0 |
| v2.22 | 2／1 | 2／1 | 0／3 |

v2.20、v2.21 三批 18 局全部死亡。每版每批只有 3 局，差異在隨機變異範圍內，不能據此判斷哪個策略比較好。

## 候選內容（`src/ocr-claude.html`）

- **claude-1**：各尺寸都用本體辨識規則（grow-1）；體型 ≥90 不再追小地圖白點；小地圖紅點一律加為危險。可吃門檻 0.85R → 0.88R（遊戲實際門檻約 0.926R）。假設是 grow-6 在 ≥90 追白點可能追到致命 NPC。結果：死亡秒數中位反而較早（92 秒），假設不成立。
- **claude-2**：claude-1 加上依可見色相偏好黃色食物。依據是遊戲的 `colorSpeed=.72+亮度×.58`，身體越亮越快，黃色食物最亮，HUD 也看得到 RGB。結果：HUD 顏色換算的速度係數從開局 1.15 降到 1.03～1.10，每局中位數的中位為 1.074，沒有往黃色的約 1.20 靠近，**提速機制在實戰中沒有發生**。可能原因是吞 NPC 時混入深色，或食物色相辨識不準，這次沒有影像可以區分。

## 測試條件

- Linux 6.18（雲端），Google Chrome for Testing 153.0.8010.12 headless，Playwright 1.63.0，Node 22.23.5。
- 視窗 2000×1163，DPR1，遊戲視野「標準」。這是 headless 環境，不等於正式桌機驗收設定（SPEC 標 TBD）。
- 每批固定順序 v2.13→v2.20→v2.21→v2.22 循環 3 次，每局開新分頁，不補跑、不刪除。無 seed（遊戲使用 `Math.random`），結果不可完全重現。
- 判定：只讀遊戲畫面上的結算標題和遊玩時間。遊戲時間超過 150 秒仍存活就按停止，記為 `cutoff150`（不是過關也不是死亡）。三批都沒有基礎設施錯誤、控制器逾時或未知。
- baseline 用的是 `src/ocr-grow.html`（46b8aa3）原樣複製後以 `build-ocr-claude.mjs` 建置，策略 grow-6。claude-1／claude-2 是最終 `src/ocr-claude.html` 的兩個選項；claude-1 執行時 `foodWeight` 恆為 1，與當時跑的版本等價。

## 重現

```sh
node scripts/check-ocr-claude.cjs          # 12 項合成檢查，非實戰
node scripts/build-ocr-claude.mjs site/ocr-claude
python3 -m http.server 8090 --directory site &
PLAYWRIGHT_DIR=<含 node_modules/playwright 的目錄> \
  node scripts/ocr-claude-batch.mjs http://localhost:8090/ocr-claude/ out.jsonl v2.13,v2.20,v2.21,v2.22 3 label
node scripts/summarize-ocr-claude.mjs out.jsonl
```

用 `STRATEGY=claude-1` 或 `STRATEGY=claude-2` 指定策略，不指定就用頁面預設的 grow-6。這次的 claude 批次是在當時把該策略設為頁面預設時跑的，選擇結果相同。

## 檔案

- `games-noimages.jsonl`：36 局逐局紀錄，包括每 10 秒的體型與速度係數，以及死亡前最後 15 次決策（方向、預測間距、威脅數、最近 3 個 NPC 的距離和半徑）。只有數值，沒有像素、影像或影格。
- `summary-noimages.json`：彙總。
- 靜態測試頁：發布為 Claude artifact（預設只有擁有者看得到）。它沒有後端，不寫排行榜；網址不寫進 repo。

## 限制與下一步

- 死亡前的決策顯示 v2.2x 常同時有 12～16 個威脅（大型 NPC 會隨玩家體型縮放），而且多是被裁切的巨型物件。死亡原因沒有影像，無法確認。
- 150 秒時存活的局體型只有 77～152，離 200 很遠。主要瓶頸是成長速度，不只是存活。
- 下一步建議：先記錄每次吞食的來源（食物或 NPC、增量），量化成長預算，再決定要針對獵食效率還是存活下手。不要直接重跑相同的候選。
- 未修改 `TEST-HANDOFF.md`（依使用者要求不改既有檔案）；要納入索引需另外決定。
