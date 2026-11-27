# Grow49 單邊裁切定位

Grow49 從凍結的 Grow48 重建，只在 v2.22 的畫面辨識流程檢查單邊裁切的較大物件。可見圓弧通過品質檢查時，用它修正垂直畫面邊界的中心座標；沿邊的座標與半徑沿用原值。控制器繼續以原規劃器比較捕食與避險路徑。v2.13 沿用原決策。

此提交修正策略及頁面版本標記，並在既有 QHD runner 註冊完整 HTML。重建自 Grow48，父 HTML SHA-256 為 `c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253`，本版 SHA-256 為 `85071f2d68a8320b444aa643f5dffb61cbe2523f6de5caf8cb45ba542bd5a0b6`。

從本目錄重建並核對既有檔案：

```sh
python3 build.py ../grow-48-public/ocr-grow48.html ocr-grow49.html --check
node diagnostics/check.cjs ocr-grow49.html
```

已核對重建雜湊、內嵌 JavaScript 語法與版本分派。初版在一組舊局原圖的 60 個人工裁切位置中有 32 個觸發修正，32/32 定位改善。此提交時，完整原圖、速度傳遞與規劃器的複查仍在進行。Grow49 自然測試為 v2.13 及 v2.22 各 0 開局。本地測試環境須有可啟動的 Chromium。

原始問題與樣本來源見 [Grow48 原圖取證](../grow-48-public/results/close-body-audit.md)。
