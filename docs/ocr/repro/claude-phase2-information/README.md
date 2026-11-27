# Phase 2：決策規則篩選，以及哪些資訊決定能不能過關（v2.13 與最新版 v2.22）

2026-11-27（台灣時間）。原始實驗在分支 `ocr-claude` 的 31d076e 完成，接續 [phase2-claude26](https://github.com/gg-dot1980/slime/blob/80b1f7922aef468cfa131da23d22f87dc104d280/docs/ocr/repro/phase2-claude26/README.md)（80b1f79）。本目錄是移入 `ocr` 分支的彙總版：每組局數、過關、死亡與體型中位見 [screening-summary.txt](screening-summary.txt)；逐局原檔依本分支規則不收錄，可回讀 [ocr-claude 31d076e 的原目錄](https://github.com/gg-dot1980/slime/tree/31d076eb52f5997a05fc23c0e8a76c14d9942a9e/docs/ocr/repro/phase2-information)。全部是 3 倍速的測試工具結果，不是 OCR 控制器驗收。策略沒有變更，仍為 claude-22。

## 1. 完美畫面資訊下的決策規則（混合工具，每版 8 局）

設定：claude-22 決策、完美畫面內資訊、真實小地圖、沒有白點。

| 變更 | v2.13 過關／死亡／體型中位 | v2.22 過關／死亡／體型中位 |
|---|---|---|
| 基準 H1（[phase2-perception](https://github.com/gg-dot1980/slime/blob/31d076eb52f5997a05fc23c0e8a76c14d9942a9e/docs/ocr/repro/phase2-perception/README.md)） | 4／0／197 | 0／1／160 |
| D1 每 100ms 決策 | 3／0／177.5 | 1／1／132.5 |
| D2 吸引力 3 | 4／1／182 | 2／1／163 |
| D3 規則 v2（2.5 秒預測＋擁擠度） | 0／0／109.5 | 2／2／181 |
| D4 crowdLight＋fleeHold | 4／0／193.5 | 1／1／145 |

就算畫面資訊完美，也沒有一組讓兩個版本都 ≥50%。

## 2. 哪些資訊決定能不能過關（參考機器人，每版 10 局）

參考機器人設定：規則 v3，預測 1.5 秒、吸引力 3、擁擠度 2。

| 機器人看得到的資訊 | v2.13 過關 | v2.22 過關 |
|---|---|---|
| **全知**（直接讀全部遊戲狀態） | **8/10** | **6/10** |
| 只看畫面＋小地圖（Y0） | 5/10 | 2/10 |
| Y0＋畫面外 NPC 的**真實大小**（Y1） | **9/10** | **6/10** |
| Y0＋畫面外 NPC 的真實速度（Y2） | 3/10 | 2/10 |
| Y0＋只有**白點**（≤1.12R）的真實大小（Y5） | **7/10** | **7/10** |
| Y0＋只有紅點的真實大小（Y4） | 3/10 | 2/10 |
| Y0＋白點沿用最後一次在畫面內看到的大小，10 秒內（Y6） | 5/10 | 4/10 |
| 同上，60 秒內（Y7） | 7/10 | 3/10 |
| Y0，視野改「固定 2000」（Z0，畫面看到的世界面積 3.6 倍） | 4/10 | 2/10 |
| Z0，不追畫面外白點（Z1） | 5/10 | 4/10 |

結論：

1. **決定能不能過關的是「畫面外小 NPC 有多大」**。只要知道畫面外白點的真實大小，兩個版本都達到 ≥50%（Y5、Y1），和全知機器人同級。畫面外的速度、紅點大小幾乎沒有影響。
2. **小地圖沒有這個資訊**：
   - 白點只分「紅（>1.12R）／白」。
   - 點的半徑是 clamp(r/38, 1.2, 3)，只有 r 在 45.6～114 時才看得出大小。v3 規則已經使用了這段資訊。
   - 開局玩家還小時，獵物都小於 45.6；後期白點常大於 114。這兩段在小地圖上都看不出大小。
3. **追蹤記憶補不了**：畫面外白點中，曾在畫面內出現過的只有 6.5%（10 秒內）～10%（60 秒內），結果介於 Y0 和 Y5 之間。
4. **放大視野也沒有顯著幫助**：Z0、Z1 和 Y0 差不多。地圖 10400×7200，視野放大後仍只看得到一小部分。

所以只靠畫面和小地圖，不論是參考機器人還是控制器，目前最好都只有每版約 20～50% 過關。**要讓每版都 ≥50%，需要更好的策略來應付「不知道畫面外白點多大」的情況**，例如更好的大小預設值，或主動探索。光靠改進辨識不夠。

## 工具變更

- `scripts/ocr-claude-oracle.mjs`：
  - `ORACLE_PARAMS` 新增 `offR`（1、'red'、'white'）、`offV`、`offMem`（秒）。
  - 新增 `ORACLE_VIEWSCALE=wide`，選擇控制器頁既有的視野「固定 2000」。

## 重現

```bash
node scripts/build-ocr-claude.mjs && python3 -m http.server 8090 --directory site
PLAYWRIGHT_DIR=<dir> ORACLE_RULE=v3 ORACLE_WARP=3 ORACLE_PARAMS='{"horizon":15,"attract":3,"crowd":2}' node scripts/ocr-claude-oracle.mjs http://localhost:8090/ocr-claude/ full.jsonl v2.13 10 X-full
PLAYWRIGHT_DIR=<dir> ORACLE_VIEW=1 ORACLE_RULE=v3 ORACLE_WARP=3 ORACLE_PARAMS='{"horizon":15,"attract":3,"crowd":2,"offR":"white"}' node scripts/ocr-claude-oracle.mjs http://localhost:8090/ocr-claude/ y5.jsonl v2.13,v2.22 10 Y5
PLAYWRIGHT_DIR=<dir> HYBRID_OPTS=claude-22 HYBRID_MAP=real HYBRID_NOWHITE=1 HYBRID_WARP=3 HYBRID_EXTRA='{"attract":3}' node scripts/ocr-claude-hybrid.mjs http://localhost:8090/ocr-claude/ d2.jsonl v2.13,v2.22 8 D2
```

雲端 Linux、Chrome for Testing 153 無頭模式、視窗 2000×1163、DPR 1；未特別註明的局，遊戲畫面是 1050×610 CSS px。沒有影像。
