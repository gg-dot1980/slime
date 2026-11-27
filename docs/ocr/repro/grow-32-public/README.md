# Grow32 小地圖獵物追蹤

從 Grow28 延伸。依完整白點的可見面積估計大小；當相機邊緣的裁切輪廓與可靠記號可唯一配對時，繼續追逐。飽和、重疊與遮蔽會造成估計不確定。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow32**。[完整控制器](ocr-grow32.html) 的 SHA-256 為 `d4ada6b01f42fd7791dabdf121441de81c96f59d276301d907e4f03ed495f8d4`。

[可還原的開發來源](../grow-development/grow-32/prototype-sources.json) 列出程式名稱與雜湊。執行 `python3 docs/ocr/repro/grow-development/restore-grow-prototypes.py docs/ocr/repro` 可檢查此提交已包含的原型。
