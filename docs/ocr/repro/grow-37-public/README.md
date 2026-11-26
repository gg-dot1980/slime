# Grow37 裁切輪廓與側向觀察

從 Grow34 延伸，利用可見圓弧估計被裁切身體的中心與半徑範圍。當玩家體型達 95、成長停滯且落後進度時，規劃器可移向目標側面以取得較完整視角。尚未確認可吞食的裁切身體仍受原有避險條件約束；對同一位置的側向觀察設有次數與冷卻限制。

從儲存庫根目錄依 [桌機測試說明](../grow-local-r4-20261126/README.md) 啟動本機伺服器，選擇 **Grow37**。[完整控制器](ocr-grow37.html) 的 SHA-256 為 `1dc6c3f77fa54dfbe0ab73b3179ccc428aac149368abad3605ffdb245fda63aa`。

固定回歸可在儲存庫根目錄執行：

```sh
node docs/ocr/repro/grow-37-public/check-arc.cjs
```

[可還原的開發來源](../grow-development/grow-37/prototype-sources.json) 列出程式名稱與雜湊。執行 `python3 docs/ocr/repro/grow-development/restore-grow-prototypes.py docs/ocr/repro` 可檢查此提交已包含的原型。
