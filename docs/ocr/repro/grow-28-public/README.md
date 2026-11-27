# Grow28 可見目標的第一段接近

Grow28 從 Grow27 改變可見、尚未捕獲目標的路徑評分，以實際送出的第一段動作估算接近程度。捕獲判定、敵人避讓與只有小地圖標記的評分仍沿用父版。60 個人工數字案例涵蓋目標朝向、速度與牆界，另有兩個牆界與物件身體一致的補充案例。`fixtures.json` 是程式生成的人工測試輸入。

```sh
node docs/ocr/repro/grow-28-public/build-candidate.cjs
node --max-old-space-size=64 docs/ocr/repro/grow-28-public/check-visible-progress.cjs
node docs/ocr/repro/grow-28-public/check-wall-consistency.cjs
```

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow28**。[完整控制器](ocr-grow28.html) 的 SHA-256 為 `8c684579c7fd54462c715dd50ee166ffa91f11efb3b1c8ccc248280fa14051f1`。
