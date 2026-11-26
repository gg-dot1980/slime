# Grow41 玩家與獵物輪廓重疊時的近身追蹤

從 Grow32 延伸，只在 v2.13 處理玩家與獵物短暫合成單一輪廓的情形。先前至少三次觀察到同一獵物的標籤，並可靠量得其尺寸與位置，且原規劃朝向該獵物時，才檢查新出現的無標籤輪廓是否符合兩者合併後的中心與大小。附近出現紅點或其他威脅即中止，暫時推估的位置最多沿用至最後一次可靠辨識後 900 毫秒。v2.22 沿用 Grow32。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow41**。[完整控制器](ocr-grow41.html) 的 SHA-256 為 `7a8aeb4d4bec0b79cf4194a374a1fb8cf5de6e91ad476f64e06ede1daf6f7f5c`。

固定回歸可在儲存庫根目錄執行：

```sh
node docs/ocr/repro/grow-41-public/check-overlap.cjs
```

[可還原的開發來源](../grow-development/grow-41/prototype-sources.json) 列出程式名稱與雜湊。執行 `python3 docs/ocr/repro/grow-development/restore-grow-prototypes.py docs/ocr/repro` 可檢查此提交已包含的原型。
