# Grow30 近期捕獲評分

沿用 Grow29 的兩段路徑模型，將第一段方向的滿額接近分限於第一段預測可捕獲的目標。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow30**。[完整控制器](ocr-grow30.html) 的 SHA-256 為 `65c556bce0ccb518963279d60d80790be254144c330397fd12b1b49bde89d44f`。

固定回歸可在儲存庫根目錄執行：

```sh
node docs/ocr/repro/grow-30-public/check-prefix.cjs
```

[可還原的開發來源](../grow-development/grow-30/prototype-sources.json) 列出程式名稱與雜湊。執行 `python3 docs/ocr/repro/grow-development/restore-grow-prototypes.py docs/ocr/repro` 可檢查此提交已包含的原型。
