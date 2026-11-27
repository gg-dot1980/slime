# Grow40 新出現的白點

[Grow40](ocr-grow40.html) 以 Grow34 為父版，在 v2.22 追蹤小地圖上近期出現的白點。新點須離主視野、地圖邊緣及舊軌跡有一段距離。點位在有效期內累計觀測至少三次、當前仍可見且符合體型條件時，規劃器才提高其偵察優先度。v2.13 沿用 Grow34。

`fresh.js` 保存辨識函式。執行 `node check-fresh.cjs` 可核對新出現、穩定、近身及轉紅的點。從本目錄執行 `python3 build-candidate.py` 會用相鄰目錄的 Grow34 重建並比對現有 Grow40；加上 `--write` 可寫出候選頁面。

開發版 B 與公開頁面的 SHA-256 同為 `27893e0d44a4b9d0aea54f73c38be16048bed47c78abe387d5845f09d22e179f`。較早的 A 在讀取座標時遇到空值而中止；當時的 HTML、修改檔及頁面雜湊均未在保存的來源中找到，無法驗證 A 的確切程式。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow40**。[完整控制器](ocr-grow40.html) 的 SHA-256 為 `27893e0d44a4b9d0aea54f73c38be16048bed47c78abe387d5845f09d22e179f`。
