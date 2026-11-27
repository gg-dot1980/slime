# Grow39 跨視野追蹤

[Grow39](ocr-grow39.html) 從 Grow34 延伸，將小地圖的紅白點與主畫面的體型量測連成短期軌跡。規劃器從符合量測條件的候選中比較路程、尺寸上界與成長收益，一條路線最多包含三個獵物。配對有歧義或尺寸與顏色矛盾時會清除舊量測。

執行 `node check-tracking.cjs` 可重現固定合成檢查，包含點面積、體型上界、身分歧義、暫時遮蔽及多站路線。執行 `patch --output=prototype-1.html ocr-grow39.html prototype-1.patch` 可重建只使用原有小地圖點與主畫面幾何的早期原型。原型 SHA-256 為 `673e35124ae9d7f884f06f633300658ae37ea520851e6eb94ebdddb334461c91`。

第二個實測原型和公開 Grow39 的控制程式完全相同，三處介面文案不同。執行 `patch --output=prototype-2.html ocr-grow39.html prototype-2.patch` 可重建當時的頁面，SHA-256 為 `a231a38cef43b81a364daf8692c9713561fb494f2d00a906e18c77265280f1b0`。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow39**。[完整控制器](ocr-grow39.html) 的 SHA-256 為 `42e55f8e17819100b33f1d787673c61e612f49a89dd7c648c29d79e4d556181c`。
