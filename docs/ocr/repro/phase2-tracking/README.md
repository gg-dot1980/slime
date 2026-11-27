# Phase 2：多幀估計 NPC 大小與方向的效果，以及辨識的改善空間（v2.13 與最新版 v2.22）

2026-11-27（台灣時間）。分支 `ocr-claude`，接續 [phase2-perception](../phase2-perception/README.md)（8b09468）。只改本分支新增的檔案。全部是測試工具結果，不是 OCR 控制器驗收。策略沒有變更，仍為 claude-22。

## 方法

- **逐幀記錄**（`scripts/ocr-claude-hybrid.mjs`，`HYBRID_REC=1`）：
  - 設定：claude-22 決策、真實辨識（同 phase2-perception 的 H2b）、每 100ms（遊戲時間）一幀、2 倍速。
  - 每版 4 局，共 11,700 幀（`frames-noimages.jsonl.gz`）。
  - 每幀記錄：偵測到的 NPC、畫面附近的真實 NPC（固定編號），以及控制器自己估計的玩家速度。
- **離線分析**（`scripts/analyze-ocr-claude-tracking.py`）：
  - 每幀把偵測和真實 NPC 配對，配對是**理想的**（用真實編號）。所以結果是追蹤所能達到的**上限**。
  - 偵測位置換算成世界座標時，用控制器自己估計的玩家速度推算，不用真實位置。
  - 用 1～15 幀估計速度（最小平方法），以每秒 10 幀和 5 幀分別計算。
  - 評估方式：預測 1.5 秒後 NPC 的位移，和真實位移比較。1.5 秒是決策時預測的時間範圍。

## 結果

### 速度與方向（未切邊 NPC，`tracking-summary.json`）

| 估計方式 | 1.5 秒位移誤差中位／p90（px） | 方向誤差中位 | 方向誤差 >45° |
|---|---|---|---|
| 當作不動 | 68／113 | — | — |
| **控制器目前的估計**（平滑，約等於最近 3 幀） | **36.6／80** | 16.8° | 20% |
| 每秒 5 幀、4 幀（0.8 秒） | 38.2／77 | 15.8° | 19% |
| 每秒 5 幀、10 幀（2 秒） | 40.8／84 | 18.9° | 24% |
| 每秒 10 幀、6 幀（0.6 秒） | 41.5／92 | 18.2° | 23% |
| 每秒 10 幀、15 幀（1.5 秒） | 43.4／91 | 19.5° | 28% |

- 最好的範圍是 **0.6～1 秒**。超過之後，NPC 轉彎造成的落差比雜訊大。
- **控制器目前的估計已經在最好的範圍**，多幀回歸沒有更好。
- **每秒 10 幀沒有幫助**：同樣的時間範圍內，相鄰幀的位置雜訊反而更大。

### 大小

| | 單幀誤差中位／p90 | 威脅（≥1.08R）被看成 <1.08R |
|---|---|---|
| 未切邊（1,990 次） | 4.8%／15% | 0.3% |
| 未切邊，30 幀中位數 | 3.9%／14% | 0.3% |
| 切邊（8,110 次） | 15%／50% | 10.0% |
| 切邊，沿用 5 秒內完整露出時的尺寸 | 14.5%／50% | 8.7% |

- 配對到的 NPC 有 80% 是被切邊的，其中 88% 是一部分在畫面外的大型威脅。
- 這些大型威脅 5 秒內完整露出過的只有 8%，所以「記住完整時的尺寸」幾乎用不上。

### 漏偵測與多餘偵測

- **完整在畫面內的 NPC 漏偵測率 3.7%**（83/2,253 幀），大多只漏 1～2 幀（每秒 10 幀）。
- **多餘偵測 2,861 次**，配對成功的有 10,100 次：
  - 其中 1,818 次（64%）是半徑約 8px 的小塊，位在玩家自己的邊緣（0.95～1.13R），附近沒有真實 NPC。
  - 其餘多是大型 NPC 被切開的碎片。

## 改善篩選（`filter-screening-noimages.jsonl`，3 倍速，每版 8 局，真實辨識）

| | v2.13 體型中位 | v2.22 體型中位／死亡 |
|---|---|---|
| 基準（phase2-perception 的 H2b＋S0，16 局） | 111.5 | 106／6 |
| F1 濾掉玩家邊緣的小塊（`HYBRID_RIMFILTER=1`） | 124.5（+13，95% CI −4.5～47） | 120.5／2 |
| **F2 F1＋殘影記憶（memory）＋碎片合併（cluster）** | **129（+17.5，CI 2～45.5）** | 123.5（+17.5，CI −20～56）／1 |

信賴區間是非成對的拔靴法（固定種子 12345），只能看方向。

## 改善空間估計

用 claude-22 的決策，比較 phase2-perception 的完美畫面資訊（v2.13 197、v2.22 160）和真實辨識（約 112、106）：

1. **用多幀估計大小和方向：幾乎沒有空間。** 速度已經是最佳，未切邊的尺寸已經很準。
2. **濾除假物件、補上短暫漏偵測、合併碎片：有一些空間。** 篩選後約 +15～18。這是下一個候選 claude-26 的內容。
3. **剩下的差距大多無法靠辨識補上。** 一部分在畫面外的大型 NPC，只看畫面時真實大小本來就不確定（p90 誤差 50%）。完美資訊知道真實大小，所以這部分是完美資訊的優勢，不是辨識錯誤。
4. **就算辨識完美也不夠**：
   - claude-22 決策在 v2.13 過關 4/8，v2.22 是 0/8。
   - 參考機器人最好是 6/16。
   - 要讓每版都 ≥50%，決策規則也必須再改進，尤其是 v2.22。

## 重現

```bash
node scripts/build-ocr-claude.mjs && python3 -m http.server 8090 --directory site
PLAYWRIGHT_DIR=<dir> HYBRID_OPTS=claude-22 HYBRID_MAP=real HYBRID_NOWHITE=1 HYBRID_WARP=2 HYBRID_MS=100 HYBRID_SRC=detview HYBRID_STRAT=claude-22 HYBRID_REC=1 node scripts/ocr-claude-hybrid.mjs http://localhost:8090/ocr-claude/ R-v2.13.jsonl v2.13 4 R-v2.13
python3 -I scripts/analyze-ocr-claude-tracking.py docs/ocr/repro/phase2-tracking/frames-noimages.jsonl.gz   # = tracking-summary.json
# F2 篩選
PLAYWRIGHT_DIR=<dir> HYBRID_OPTS=claude-22 HYBRID_MAP=real HYBRID_NOWHITE=1 HYBRID_WARP=3 HYBRID_SRC=detview HYBRID_STRAT=claude-22 HYBRID_RIMFILTER=1 HYBRID_EXTRA='{"memory":true,"cluster":true}' node scripts/ocr-claude-hybrid.mjs http://localhost:8090/ocr-claude/ F2.jsonl v2.13,v2.22 8 F2
```

雲端 Linux、Chrome for Testing 153 無頭模式、視窗 2000×1163、DPR 1。只有數值座標，沒有影像。
