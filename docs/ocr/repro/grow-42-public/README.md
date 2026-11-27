# Grow42 分版本選用 Grow36／39

使用版本標籤在 v2.13 選用 Grow36、v2.22 選用 Grow39。兩套辨識與規劃各自封裝，使用同一個原生遊戲 iframe。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow42**。[完整控制器](ocr-grow42.html) 的 SHA-256 為 `1da5fc0d76d3de4a3c794776982a22c1c12249ab78943fd77f36240dc1be3763`。

固定回歸可在儲存庫根目錄執行：

```sh
node docs/ocr/repro/grow-42-public/check-routing.cjs
```

[可還原的開發來源](../grow-development/grow-42/prototype-sources.json) 列出程式名稱與雜湊。執行 `python3 docs/ocr/repro/grow-development/restore-grow-prototypes.py docs/ocr/repro` 可檢查此提交已包含的原型。
