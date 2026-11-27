# Grow49 單邊裁切定位

Grow49 已凍結供 QHD 桌機自然測試。v2.22 會在大型 NPC 被畫面單邊裁切、可見圓弧仍可可靠擬合時修正中心。此改動沿用原有物件半徑及捕食、避險規則。v2.13 沿用既有辨識與策略。

來自同一場既有自然局的 16 張完整名稱原圖，定位誤差中位數從 30.45 降至 4.45 像素。Grow49 已通過桌機 QHD 預檢。首次控制診斷兩版各開一局、完成釋鍵並封帳，各保留 0 張影像。探索兩版各已開 0／預定 4 局。[診斷彙總](results/diagnostic.md) · [驗證彙總](validation/visible-centers.md) · [凍結條件](freeze.json)

## 重建與測試

從本目錄執行以下兩行，可核對完整頁面與版本分派。若需由父頁重建，將第一行的 `--check` 移除。父 HTML SHA-256 為 `c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253`。Grow49 的 SHA-256 為 `85071f2d68a8320b444aa643f5dffb61cbe2523f6de5caf8cb45ba542bd5a0b6`。

```sh
python3 build.py ../grow-48-public/ocr-grow48.html ocr-grow49.html --check
node diagnostics/check.cjs ocr-grow49.html
```

[自然實測與同步留圖操作](diagnostics/README.md) · [裁切畫面重算](diagnostics/crop-replay.md) · [Grow48 原圖取證](../grow-48-public/results/close-body-audit.md)
