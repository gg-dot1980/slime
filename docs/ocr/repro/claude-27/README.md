# claude-27：只追看得出大小的畫面外白點（v2.13 與最新版 v2.22）

2026-11-27（台灣時間）。分支 `ocr`。事前協議見 [PROTOCOL.md](PROTOCOL.md)。不是正式驗收。

## 1. 參考機器人篩選（3 倍速，每版 10 局，[bot-screening-summary.txt](bot-screening-summary.txt)）

設定：只看畫面＋小地圖，規則 v3，預測 1.5 秒、吸引力 3、擁擠度 2，頁面為本分支 `/ocr-gui-design/claude/`。

| 畫面外白點的處理 | v2.13 過關／死亡／體型中位 | v2.22 過關／死亡／體型中位 |
|---|---|---|
| Y0 大小不明也追（[資訊拆解](../claude-phase2-information/README.md)） | 5／0／198 | 2／1／184.5 |
| **U1 1.2px 點和飽和 3px 點都不追（`unk:"skip"`）** | **7／0／202** | **5／1／197.5** |
| U2 只不追 1.2px 點 | 5／0／198.5 | 1／3／175.5 |
| U3 只不追飽和 3px 點 | 3／0／167 | 5／4／189.5 |
| U4 1.2px 點估計改成 0.4R | 3／1／192 | 3／0／195.5 |
| U5 U1＋畫面外位置量化到小地圖像素（`mapQ`） | 6／0／200.5 | 3／1／182 |

只用畫面＋小地圖的資訊，U1 第一次讓**兩個版本都達到 ≥50%**（3 倍速篩選，n=10，尚未確認）。這是讓兩版都過門檻的第一個可行方向，所以直接做成控制器候選 claude-27。

## 2. 控制器（實際速度，每策略每版 20 局，[comparison.json](comparison.json)，排除 0 局）

| | 過關 | 死亡 | 體型中位（95% CI） | 吞 NPC 中位 |
|---|---|---|---|---|
| v2.13 claude-22 | 0/20 | 0 | 123（112～132） | 11.5 |
| v2.13 claude-27 | 0/20 | 1 | 92.5（79～110） | 10.5 |
| v2.22 claude-22 | 0/20 | 6 | 110.5（96～120） | 6 |
| v2.22 claude-27 | 0/20 | 1 | 88（80～102） | 6 |

中位數差（claude-22 − claude-27）：
- v2.13：+30.5（95% CI 12～48）
- v2.22：+22.5（95% CI 3～34）

**claude-27 在兩個版本都顯著較差，依協議維持 claude-22。**

## 3. 為什麼機器人有效、控制器無效（混合工具，3 倍速，每版 8 局）

設定：claude-22 決策＋`dotSize`＋`unkSkip`，模擬小地圖（位置量化到小地圖像素、視野框上的點刪除，點大小 45.6～114 時給真實值）。

| | v2.13 過關／死亡／體型中位 | v2.22 過關／死亡／體型中位 |
|---|---|---|
| 參考：完美畫面、沒有白點（[H1](https://github.com/gg-dot1980/slime/blob/31d076eb52f5997a05fc23c0e8a76c14d9942a9e/docs/ocr/repro/phase2-perception/README.md)） | 4／0／197 | 0／1／160 |
| K1 claude-27 決策、完美畫面 | 0／0／109 | 0／3／125.5 |
| K2 K1＋吸引力 3 | 1／0／149.5 | 0／1／151.5 |
| **K4 K1＋白點只追 ≤0.909R（`whiteEdible`）** | **4／0／198** | **3／1／196.5** |
| K3 K4＋吸引力 3 | 4／0／199.5 | 2／3／163.5 |
| K5 K4，畫面改用真實辨識 | 0／2／107 | 0／2／96.5 |

結論：

1. **找到 claude-27 的錯誤**：
   - 決策函式把估計 <1.06R 的白點都當目標，所以會追 0.93～1.06R 這段根本吃不到的 NPC。吞食需要玩家 ≥1.08 倍。
   - 參考機器人只追 ≤1/1.1R 的。
   - 改成只追 ≤0.909R（`whiteEdible`，新增，預設關閉，沒有策略使用）後，完美畫面下 v2.22 從 0/8 變 3/8，體型 196.5。
2. **但真實畫面辨識下仍然無效**（K5）：
   - 107／96.5，不比不追白點好（[H2b＋S0](https://github.com/gg-dot1980/slime/blob/31d076eb52f5997a05fc23c0e8a76c14d9942a9e/docs/ocr/repro/phase2-perception/README.md)：111.5／106）。
   - 往畫面外追時，常遇到被畫面邊緣切掉的大型 NPC，這正是辨識最不準的情況。
   - 所以追畫面外白點和畫面辨識的誤差必須一起處理。

## 4. 下一步

把 K4 的設定用在真實辨識時會失敗，要先找出失敗在哪一類誤差。做法和 [phase2-perception](https://github.com/gg-dot1980/slime/blob/31d076eb52f5997a05fc23c0e8a76c14d9942a9e/docs/ocr/repro/phase2-perception/README.md) 一樣，一次只加一類誤差（`HYBRID_MIX`），再針對那一類改進。

## 工具

- `scripts/ocr-claude-oracle.mjs`：新增 `ORACLE_PARAMS` 的 `unk`（`skip`、`skipSmall`、`skipCap`、數字）。只使用小地圖看得到的資訊。
- `scripts/ocr-claude-oracle.mjs` 另新增 `mapQ`（畫面外位置量化）。
- `scripts/check-ocr-claude.cjs`：新增 claude-27 的合成檢查（95 項通過）。
- `src/ocr-claude.html`：新增 `whiteEdible` 選項，預設關閉，不改變任何既有策略。

## 重現

```bash
npm run build && npm run dev   # http://localhost:4173/ocr-gui-design/claude/
OBSERVE=1 STRATEGIES=claude-22,claude-27 PLAYWRIGHT_DIR=<dir> node scripts/ocr-claude-batch.mjs http://localhost:4173/ocr-gui-design/claude/ v2.13.jsonl v2.13 20 p27-v2.13   # v2.22 同時另開一個
node scripts/compare-ocr-claude.mjs v2.13.jsonl v2.22.jsonl
PLAYWRIGHT_DIR=<dir> ORACLE_VIEW=1 ORACLE_RULE=v3 ORACLE_WARP=3 ORACLE_PARAMS='{"horizon":15,"attract":3,"crowd":2,"unk":"skip"}' node scripts/ocr-claude-oracle.mjs http://localhost:4173/ocr-gui-design/claude/ u1.jsonl v2.13,v2.22 10 U1
PLAYWRIGHT_DIR=<dir> HYBRID_OPTS=claude-22 HYBRID_MAP=real HYBRID_WARP=3 HYBRID_EXTRA='{"dotSize":true,"unkSkip":true,"whiteEdible":0.909}' node scripts/ocr-claude-hybrid.mjs http://localhost:4173/ocr-gui-design/claude/ k4.jsonl v2.13,v2.22 8 K4
```

雲端 Linux、Chrome for Testing 153 無頭模式、視窗 2000×1163、DPR 1。逐局原檔依本分支規則不收錄，只收錄各組彙總。
