# Grow43 免疫期補食

[Grow43](ocr-grow43.html) 沿用 Grow39，在 v2.22 玩家體型達 186 且原規劃器沒有目標時，補選可到達的食物或多個可見白點之間的搜尋位置。這個補充策略只為沿途可接觸的食物估算增量；白點群提供搜尋方向，單一尺寸已飽和的白點無法啟動搜尋。v2.13 沿用 Grow39。

`endgame.js` 保存新增的規劃函式。執行 `node build-candidate.cjs --check` 可從相鄰目錄的 Grow39 比對完整程式。執行 `node check-finish.cjs` 可驗證固定的人工食物、重疊標記、邊界與逾時情境。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow43**。[完整控制器](ocr-grow43.html) 的 SHA-256 為 `86e19c542d301da612bbfa1ec130afcac8c01ca9bfccd942d9d8c19f8274430c`。
