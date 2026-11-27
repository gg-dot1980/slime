# Grow35 分版本追獵

載入時核對原遊戲畫面顯示的版本。v2.13 採用 Grow32 的小地圖量測與八方向追獵，v2.22 採用 Grow31 的白點偵察與目標記憶。兩個版本共用同一個原遊戲 iframe、HUD 讀取和鍵盤控制。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow35**。[完整控制器](ocr-grow35.html) 的 SHA-256 為 `eeec42256fc85c4f56f63734c7d453280669da6080df8acdd164fc66e2733ddb`。

[可還原的開發來源](../grow-development/grow-35/prototype-sources.json) 列出程式名稱與雜湊。執行 `python3 docs/ocr/repro/grow-development/restore-grow-prototypes.py docs/ocr/repro` 可檢查此提交已包含的原型。
