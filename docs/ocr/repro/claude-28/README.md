# claude-28：只追 ≤0.909R 的白點、切邊物件配對看得出大小的白點、視野框記憶（v2.13 與最新版 v2.22）

2026-11-27（台灣時間）。分支 `ocr`，接續 [claude-27](../claude-27/README.md)。不是驗收。標準幾何的篩選沒有改善；QHD 幾何的篩選較好，因此凍結並開自然局探索（見下方）。

## 1. 真實辨識下，追白點為什麼失敗（[hybrid-screening-summary.txt](hybrid-screening-summary.txt)，每版 8 局）

設定：claude-27 決策＋`whiteEdible` 0.909（即 [claude-27 README](../claude-27/README.md) 的 K4）、模擬小地圖。每組只加入一類真實辨識誤差（`HYBRID_SRC=mix`）。

| 加入的誤差 | v2.13 過關／死亡／體型中位 | v2.22 過關／死亡／體型中位 |
|---|---|---|
| 無（K4，完美畫面） | 4／0／198 | 3／1／196.5 |
| 多餘偵測（W1） | 2／0／158.5 | 3／0／162 |
| 漏偵測（W2） | 2／0／155.5 | 1／2／146.5 |
| 尺寸（W3） | 2／1／157.5 | 0／4／121 |
| **切邊欄位**（W4：切邊旗標、弧形估計、危險半徑） | **0／0／104.5** | **0／3／112.5** |
| 全部（K5，真實辨識） | 0／2／107 | 0／2／96.5 |

**切邊處理單獨就把效果全部抵銷**：
- 往畫面外追白點時，目標進入畫面的那一刻是被切邊的，於是被當成危險。
- 這時它在小地圖上的點也被視野框蓋住，所以「切邊物件＋白點＝目標」的規則找不到對應的白點。

## 2. claude-28 候選

claude-27 加上：
- `whiteEdible` 0.909：畫面外白點只追估計 ≤0.909R 的。
- `clipWhiteSized`：切邊物件附近要有看得出大小、≤0.909R 的白點，才改判為目標，目標大小用該點的估計。
- 視野框記憶（`rememberStrokeDots`，同 claude-15）：被視野框蓋住的點保留 1.5 秒。

混合工具篩選（真實畫面辨識，模擬小地圖量化但保留視野框上的點，`HYBRID_MAP=quant`，近似視野框記憶）：

| | v2.13 過關／死亡／體型中位 | v2.22 過關／死亡／體型中位 |
|---|---|---|
| 基準：claude-22 決策、不追白點（[H2b＋S0](https://github.com/gg-dot1980/slime/blob/31d076eb52f5997a05fc23c0e8a76c14d9942a9e/docs/ocr/repro/phase2-perception/README.md)，16 局） | 0／0／111.5 | 0／6／106 |
| claude-27＋whiteEdible（K5） | 0／2／107 | 0／2／96.5 |
| **claude-28（L1）** | 1／1／103 | 0／2／130.5 |

v2.13 沒有改善，v2.22 只是方向上較好。依「篩選沒有改善就不做實速比較」的原則，claude-28 不進入實際速度測試，**沒有採用**。它仍留在選單，方便重現。

### QHD 幾何下的篩選（2026-11-27 追加）

改用 Grow 研究的 QHD 桌機幾何（視窗 2560×1440，畫布 2250×1308，`OCR_GEOMETRY=qhd`）。其餘同上，模擬小地圖去掉視野框上的點。

| | v2.13 過關／死亡／體型中位 | v2.22 過關／死亡／體型中位 |
|---|---|---|
| Q1 claude-22 決策、不追白點 | 0／0／124 | 0／3／127 |
| **Q2 claude-28** | **1／0／149** | **3／2／194.5** |

畫布變大後，目標在離得更遠時就完整出現在畫面上，切邊造成的問題減少。claude-28 在兩版都比 claude-22 好。所以依 [Claude 續測流程](../../CLAUDE-WORKFLOW.md) 凍結 claude-28（[freeze.json](freeze.json)），開自然局：
- QHD 桌機探索：每版 4 局。
- 手機搖桿組：每版 4 局。

## 結論與下一步

- 參考機器人只看畫面＋小地圖，就能讓兩個版本都 ≥50%（[claude-27](../claude-27/README.md) U1）。
- 控制器做不到，主要卡在**被畫面邊緣切掉的物件怎麼判斷**：追畫面外目標時，目標進畫面的那一刻幾乎都是切邊的。
- 下一個候選應該在白點進入畫面之前就追蹤它的身分：
  1. 白點的位置換算到畫面座標。
  2. 白點消失、同一位置出現切邊物件時，沿用白點的大小判斷。
  3. 不必等到它完全露出才決定能不能吃。

## 工具

- `scripts/ocr-claude-hybrid.mjs`：`HYBRID_MAP=quant`（位置量化，但保留視野框上的點）。
- `scripts/check-ocr-claude.cjs`：claude-28 的合成檢查（97 項通過）。

## 重現

```bash
npm run build && npm run dev
PLAYWRIGHT_DIR=<dir> HYBRID_OPTS=claude-22 HYBRID_MAP=real HYBRID_WARP=3 HYBRID_SRC=mix HYBRID_MIX=clip HYBRID_STRAT=claude-22 HYBRID_EXTRA='{"dotSize":true,"unkSkip":true,"whiteEdible":0.909}' node scripts/ocr-claude-hybrid.mjs http://localhost:4173/ocr-gui-design/claude/ w4.jsonl v2.13,v2.22 8 W4-clip
PLAYWRIGHT_DIR=<dir> HYBRID_OPTS=claude-22 HYBRID_MAP=quant HYBRID_WARP=3 HYBRID_SRC=detview HYBRID_STRAT=claude-22 HYBRID_EXTRA='{"dotSize":true,"unkSkip":true,"whiteEdible":0.909,"clipWhiteSized":true}' node scripts/ocr-claude-hybrid.mjs http://localhost:4173/ocr-gui-design/claude/ l1.jsonl v2.13 8 L1
```

雲端 Linux、Chrome for Testing 153 無頭模式、視窗 2000×1163、DPR 1。逐局原檔依本分支規則不收錄。

## 3. 自然局探索（實際速度，依 [Claude 續測流程](../../CLAUDE-WORKFLOW.md)，[exploration.json](exploration.json)）

凍結來源見 [freeze.json](freeze.json)。一次一個瀏覽器，`OBSERVE=1`。

| 組 | 版本 | 勝／局 | 死亡 | 截止 | 中止／未知 | 終場體型 | 中位 |
|---|---|---|---|---|---|---|---|
| QHD 桌機（2250×1308） | v2.13 | 0/4（0%） | 0 | 4 | 0 | 195、107、166、89 | 136.5 |
| QHD 桌機 | v2.22 | 0/4（0%） | 1 | 3 | 0 | 140、164、120、90（死） | 130 |
| 手機搖桿（384×467） | v2.13 | 0/4（0%） | 0 | 4 | 0 | 68、65、60、61 | 63 |
| 手機搖桿 | v2.22 | 0/4（0%） | 0 | 4 | 0 | 60、96、94、96 | 95 |

- 桌機探索兩版都沒達 2/4，所以**不開獨立確認**（各 0 局）。
- 手機組照流程跑完。
- 16 局都有有效結果；手機組 8 局都是可信觸控，搖桿命中失誤 0 次。

篩選時的 v2.22 中位 194.5，實戰只有 130。差在小地圖辨識：篩選用的是模擬小地圖（位置量化、點大小在 45.6～114 時為真實值），實戰要從畫面像素讀點的大小。下一步要先量真實點大小估計（`rEst`）的誤差。

手機畫布只有 384×467，畫面上看得到的範圍小得多，目前的辨識與決策都不適合，體型中位只有 63～95。
