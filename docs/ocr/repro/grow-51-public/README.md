# OCR Grow51 · 切換路徑安全閘

Grow51 只修改 v2.22 的一個決策條件。Grow50 選出的新路徑若與上一個決策不同，且 2.2 秒預測終點間隙 `endGap` 為負，便在既有可行路徑中找終點間隙最大者；只有替代路徑能恢復正間隙時才改向。v2.13 維持 Grow38 決策。

## 開發證據

Grow50 v2.22 兩局死亡共有 5 個原選路徑負值事件，其中 4 個發生在路徑切換當幀。3 個切換事件存在 `wallOK`、`clearance > 4` 且 `endGap > 0` 的替代路徑，涵蓋兩局死亡；首次訊號距可見死亡結算分別約 2.56 秒與 6.46 秒。勝局原選路徑負值事件為 0。這些固定回放只用於候選開發，不計自然勝率。

## 重建與檢查

```bash
python3 build.py ../grow-50-public/ocr-grow50.html ocr-grow51.html
python3 build.py ../grow-50-public/ocr-grow50.html ocr-grow51.html --check
node check.cjs ocr-grow51.html
```

自然探索採既有 QHD 固定 4+4。Grow50 後的手機增項使用相同凍結 HTML，另以 384×467 搖桿組固定 4+4，兩種幾何分開統計。
