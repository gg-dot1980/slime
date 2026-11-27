# claude-26 vs claude-22（實際速度，每策略每版 20 局）

2026-11-27（台灣時間）。分支 `ocr-claude`，候選與協議見 [PROTOCOL.md](PROTOCOL.md)（開跑前固定，8b905f6）。只改本分支新增的檔案。不是驗收。

## 結果（`comparison-noimages.json`，排除 0 局）

| | 過關 | 死亡 | 體型中位（95% CI） | 吞 NPC 中位 |
|---|---|---|---|---|
| v2.13 claude-22 | 0/20 | 0 | 118（108～128） | 10.5 |
| v2.13 claude-26 | 0/20 | 0 | 121（114～142） | 10 |
| v2.22 claude-22 | 0/20 | 3 | 111.5（99～127） | 6.5 |
| v2.22 claude-26 | 0/20 | 4 | 138（111～144） | 7 |

中位數差（claude-26 − claude-22）：
- v2.13：+3，95% CI −10～27
- v2.22：+26.5，95% CI −2～41

## 判定

兩個版本的 CI 都含 0，依協議**維持 claude-22**。

v2.22 的差距接近顯著，方向和 3 倍速篩選一致（約 +17）。但效果最多只是讓體型多二十幾，而目標是 200，兩個策略都還是 0 過關。這和 [phase2-tracking](../phase2-tracking/README.md) 的估計一致：辨識修正的空間有限，主要的差距要靠決策規則改進。

## 重現

```bash
node scripts/build-ocr-claude.mjs site/ocr-claude26 && python3 -m http.server 8090 --directory site
OBSERVE=1 STRATEGIES=claude-22,claude-26 PLAYWRIGHT_DIR=<dir> node scripts/ocr-claude-batch.mjs http://localhost:8090/ocr-claude26/ v2.13.jsonl v2.13 20 p26-v2.13   # v2.22 同時另開一個
node scripts/compare-ocr-claude.mjs v2.13.jsonl v2.22.jsonl
```

雲端 Linux、Chrome for Testing 153 無頭模式、視窗 2000×1163、DPR 1。沒有影像。
