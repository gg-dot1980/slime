# Phase 2：不追白點的參數搜尋與辨識誤差拆解（v2.13 與最新版 v2.22）

2026-11-27（台灣時間）。分支 `ocr-claude`，接續 [phase2-markers](../phase2-markers/README.md)（41fa3ca）。只改本分支新增的檔案。全部為測試工具結果（3 倍速篩選），不是 OCR 控制器驗收，也沒有新增可用策略。

## 工具變更（只改本分支新增的測試工具）

- `scripts/ocr-claude-oracle.mjs`：`ORACLE_PARAMS` 新增 `offWhite:0`，畫面外白點完全不看，和 claude-22 一樣。
- `scripts/ocr-claude-hybrid.mjs`：
  - `HYBRID_NOWHITE=1`：小地圖不提供白點。
  - `HYBRID_SRC=detnpc|detfood|mix`：只把一部分換成真實辨識。
  - `HYBRID_MIX=spur|miss|size|pos|clip|vel`：只打開一類辨識誤差。
  - `HYBRID_PROBE=1`：記錄 NPC 辨識和真實狀態的配對誤差。
  - `HYBRID_EXTRA`：額外的決策選項 JSON。
  - **修正**：真實辨識改用遊戲時間計算速度。之前用牆鐘時間，3 倍速下畫面內 NPC 速度會被放大 3 倍（誤差中位從約 15～50 變成 100～160 px/s）。修正前的 detview/detnpc 結果作廢，沒有收錄。之前的紀錄（claude-18/19）都是實際速度，不受影響。
- `src/ocr-claude.html`：`planClaude5` 新增兩個預設關閉的選項 `segPrey`、`segOnly`（見第 3 節）。沒有任何策略使用，既有策略行為不變（92 項檢查通過）。

## 1. 參考機器人不追畫面外白點（`bot-nowhite-sweep-noimages.jsonl`，每組每版 8 局）

| 設定（都是 offWhite:0、規則 v3、只看畫面） | v2.13 過關／死亡／體型中位 | v2.22 過關／死亡／體型中位 |
|---|---|---|
| **W0 G+C+F（預測 1.5 秒、吸引力 3、擁擠度 2）** | 2／0／165 | **4**／0／184.5 |
| W1 預測 2.5 秒 | 0／0／146.5 | 1／3／147.5 |
| W2 食物 2 | 1／0／143 | 1／0／187 |
| W3 獵物 16 | **5**／0／200 | 0／1／149 |
| W4 吸引力 6 | 0／0／139.5 | 3／0／172 |
| W5 擁擠度 6 | 3／0／179.5 | 1／0／118.5 |
| W6 W0＋決策間隔 200ms | 0／0／169.5 | 1／3／162 |

不追白點時，最好的仍是之前的 G+C+F（6/16 過關），所以**最佳參數不因白點改變**。claude-24（吸引力 3）已在實際速度下比較過，無顯著差異（[phase2-growth](../phase2-growth/README.md)）。

## 2. 差距在哪裡：同一決策、不同辨識（`hybrid-decomposition-noimages.jsonl`，claude-22 決策、真實小地圖、無白點，每版 8 局）

| 輸入 | v2.13 過關／死亡／體型中位 | v2.22 過關／死亡／體型中位 |
|---|---|---|
| H1 完美畫面內資訊 | **4**／0／197 | 0／1／160 |
| H2b 真實辨識（≈ 實際 claude-22 的 117／117.5） | 0／0／114.5 | 0／3／124 |
| H3b 真實 NPC＋完美食物 | 0／0／152 | 0／1／100 |
| H4 完美 NPC＋真實食物 | 2／0／175.5 | 1／1／162 |
| M1 只加多餘偵測 | 1／0／151 | 3／3／133 |
| M2 只加漏偵測 | 0／1／167.5 | 2／0／142 |
| M3 只加尺寸誤差 | 0／1／137.5 | 0／**4**／124.5 |
| M4 只加位置／速度／切邊欄位 | 0／0／117 | 0／2／141.5 |
| M5 只加切邊欄位 | 0／0／146.5 | 0／1／136.5 |
| M6 只加速度誤差 | 2／0／150 | 0／1／137.5 |

結論：

1. **控制器的決策本身夠好**：拿到完美的畫面內資訊時，claude-22 的決策在 v2.13 有 4/8 過關，和參考機器人同級。
2. **差距幾乎全在畫面內的 NPC 辨識**；食物辨識影響小。
3. **沒有單一主因**：多餘偵測、漏偵測、尺寸、切邊、速度，每一類單獨加入都會讓體型少約 20～60。尺寸誤差在 v2.22 最危險（8 局死 4 局），因為威脅被看小了。

`npc-probe-summary.txt`（修正後 4 局）：未切邊 NPC 的尺寸比值中位約 1.0；大於 1.3R 的大型 NPC 多半只露出一部分，p10 只有 0.59；15/159 個威脅被讀成小於 1.08R；多餘偵測多是被切邊的碎片。

## 3. 切邊處理篩選（`clip-screening-noimages.jsonl`，真實辨識，每版 8 局）

| 選項 | v2.13 體型中位 | v2.22 體型中位／死亡 |
|---|---|---|
| 基準（H2b＋S0 合併 16 局） | 111.5 | 106／6 |
| S1 `segPrey:0.86`（估計 ≤0.86R 就當目標） | 98 | 116／1 |
| S2 `segOnly`（只留估計圓的危險區） | 117.5 | 117／1 |
| S3 兩者 | 123 | 108／1 |

都在隨機變異範圍內，沒有做成新策略。**維持 claude-22。**

## 下一步

各類誤差都來自逐幀獨立辨識，所以下一個候選是**跨幀追蹤 NPC**：同一個 NPC 在多幀間配對，用多幀平滑尺寸（切邊時沿用完整露出時的尺寸），短暫消失時保留，只出現一幀的碎片不當威脅。先在混合工具用真實辨識（H2b 設定）篩選，再做實際速度成對比較。

## 重現

```bash
node scripts/build-ocr-claude.mjs
python3 -m http.server 8090 --directory site
# 機器人
PLAYWRIGHT_DIR=<dir> ORACLE_VIEW=1 ORACLE_RULE=v3 ORACLE_WARP=3 ORACLE_PARAMS='{"offWhite":0,"horizon":15,"attract":3,"crowd":2}' node scripts/ocr-claude-oracle.mjs http://localhost:8090/ocr-claude/ out.jsonl v2.13,v2.22 8 W0
# 混合工具（H2b；換 HYBRID_SRC / HYBRID_MIX / HYBRID_EXTRA 得到其他列）
PLAYWRIGHT_DIR=<dir> HYBRID_OPTS=claude-22 HYBRID_MAP=real HYBRID_NOWHITE=1 HYBRID_WARP=3 HYBRID_SRC=detview HYBRID_STRAT=claude-22 node scripts/ocr-claude-hybrid.mjs http://localhost:8090/ocr-claude/ out.jsonl v2.13,v2.22 8 H2b
```

雲端 Linux、Chrome for Testing 153 無頭模式、視窗 2000×1163、DPR 1。沒有影像。
