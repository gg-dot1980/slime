# Grow27 綠色玩家定位

Grow27 從 Grow24 的小地圖綠色相機框和玩家圓點共同估計位置。規劃器沿用父版。以像素模型的 1,275 個合成案例測量，在 912 個正例中返回 816 次；336 個應拒判的負例均被拒判。667 個父版與新版均能定位的正例有 29 個誤差變大。自然驗證採 958×557 畫布、DPR 1；小數地圖原點時玩家與標記座標仍可能錯開。

`locate-player.cjs` 是已凍結的辨識程式；`prototype-locate-player.cjs` 保留第一版實質不同的定位算法。可用 Node 內建模組重建並檢查正式控制器。測量程式需 `@napi-rs/canvas@0.1.100` 可由 Node 查找到；可用 `--resource-smoke` 先做小樣本檢查，再執行完整矩陣或 `--prototype` 比對第一版。

```sh
node docs/ocr/repro/grow-27-public/build-candidate.cjs
node docs/ocr/repro/grow-27-public/check-perception.cjs --resource-smoke
```

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow27**。[完整控制器](ocr-grow27.html) 的 SHA-256 為 `08e618fa6d05703a302f8cfc798aea6074c7ffe99805529b92149a4c8fc6e914`。
