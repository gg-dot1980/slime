# Grow50 重疊警告復原

Grow50 是待測 QHD 桌機候選。v2.13 完全沿用 Grow38 的既有分派；v2.22 沿用 Grow49，僅在可見的大型 NPC 名稱與「危險」文字成對、而相應輪廓已與玩家連成同一個被濾除的 component 時，補回一個硬威脅。一般捕食、近牆保護與其他 NPC 判斷不變。

固定私人畫面回歸共 12 張：死亡局最後三張合併畫面為 3/3 補回威脅；既有勝局的九張免疫重疊畫面為 0/9 誤報。這個回歸只證明辨識路徑修正，不能推估勝率。獨立離線 QHD 重算中，新增像素檢查中位約 17.1 ms、最大約 22.6 ms；自然探索仍為兩版各 0/4。

候選 HTML SHA-256 為 `3f04d509d6bc0b8ad95865bf8f5a75f2282ad87cf2cd6737b6ed11e6e44ff8f6`，父版 Grow49 SHA-256 為 `85071f2d68a8320b444aa643f5dffb61cbe2523f6de5caf8cb45ba542bd5a0b6`。

## 重建與靜態檢查

```sh
python3 build.py ../grow-49-public/ocr-grow49.html ocr-grow50.html --check
node check.cjs ocr-grow50.html
```

固定畫面及逐張雜湊只存私人證據。自然驗收仍須依 QHD 固定條件，兩版各完成 4 局且各至少 2 勝，才另起兩版各 12 局確認。
