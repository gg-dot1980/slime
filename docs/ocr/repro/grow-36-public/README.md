# Grow36 小地圖邊緣白點與沿牆路徑預測

從 Grow32 延伸，在小地圖四周補讀延伸到邊線外的白點像素。比較八個方向時，每一步都將預測的玩家中心限制在遊戲牆界內，保留沿牆方向的移動；近牆且附近有威脅時，額外計入風險。人工影像檢查涵蓋五種 NPC 體型在四邊及兩個角落的 30 個案例，另測空圖和邊緣紅點。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow36**。[完整控制器](ocr-grow36.html) 的 SHA-256 為 `017cf13f29f941f8e7ac77ccd3e1e9103434cc2bb4bc764e215b148d3fc0885a`。

固定回歸可在儲存庫根目錄執行：

```sh
node docs/ocr/repro/grow-36-public/check-edge.cjs
```

[可還原的開發來源](../grow-development/grow-36/prototype-sources.json) 列出程式名稱與雜湊。執行 `python3 docs/ocr/repro/grow-development/restore-grow-prototypes.py docs/ocr/repro` 可檢查此提交已包含的原型。
