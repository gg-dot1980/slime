# Grow34 邊界獵物辨識

從 Grow31 延伸。對在畫布邊緣被裁切的輪廓，嘗試以可見反光形狀估計目標半徑，並以幾何條件拒絕不確定的估計。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow34**。[完整控制器](ocr-grow34.html) 的 SHA-256 為 `bd81bb39284b62762acce3d9c84562139dd44d71e16187134c95d2f43e14ef56`。

固定回歸可在儲存庫根目錄執行：

```sh
node docs/ocr/repro/grow-34-public/check-clipped.cjs
```

[可還原的開發來源](../grow-development/grow-34/prototype-sources.json) 列出程式名稱與雜湊。執行 `python3 docs/ocr/repro/grow-development/restore-grow-prototypes.py docs/ocr/repro` 可檢查此提交已包含的原型。
