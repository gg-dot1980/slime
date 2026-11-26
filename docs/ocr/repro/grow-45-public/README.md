# Grow45 寬畫面分版規劃

Grow45 保留 Grow38 的桌機專注顯示、原生同源遊戲、可見畫布與 HUD 辨識。控制頁從遊戲頁可見版本標籤核對版本。選取候選策略時，v2.22 使用凍結的 Grow15 規劃函式，v2.13 及其他可載入版本沿用 Grow38 的規劃函式。兩者共用原先的按鍵、100 ms 決策間隔、逾時釋鍵與重新讀圖。頁面的 Grow12 舊基線仍可選取。

v2.22 換回 Grow15 的尺寸估計、可食與威脅分類、路線收益和牆界處理。Grow38 的可見畫面辨識提供亮斑幾何或原輪廓估計。Grow15 以這些量測與小地圖選擇八方向兩段路徑。與 Grow38 相比，Grow15 在幾何拒判時沿用其原有上界，對可見 NPC 也沿用原有體型預測及離牆距離公式。原遊戲畫面、小地圖和尺寸依原生 CSS 顯示。歷史 Grow15 的 v2.22 確認為 5/12，該批使用固定 2000×1163 畫布及調整過繪製順序的小地圖。Grow45 凍結時的遊戲開局數為 0。凍結後的成績及每組完整分母見[原生 QHD 驗證結果](results/README.md)。

| 程式 | Git blob | SHA-256 |
|---|---|---|
| [Grow38 原頁](../grow-38-public/ocr-grow38.html) | `35c58f4559ced251b2a52bf25078d8d640babe1b` | `befaf6a2c6ac1ff14596628753e509e5c15eb5bffd0e6f62f81e91b884f239ec` |
| [Grow15 凍結規劃器](../grow-evaluation-20261125/bundle/source/experiments/grow15/frozen/screen-03/planner.js) | `9d531499ad39a8a7054c3d451529723d407f1a7e` | `e89d6a8cb0201a8caf0314c023e16f37f63396dd44615bf4dcdc823077e0fd0e` |
| [Grow45 完整控制頁](ocr-grow45.html) | `b839f06e268a7b866e756b39c2df0ff8e33a0d94` | `7f2712f72d46b4bd8ec2a401c66a58f82db661eab5de33d26b355cd7edf8bdcc` |

建置器核對兩份固定原檔，將原生 Grow15 函式及其註解嵌入 Grow38 控制頁。候選選項保留識別碼 `grow-23`，以沿用 Grow38 的讀圖和時序。決策診斷中的 `strategy` 是實際函式回傳值，v2.22 為 `grow-15`，v2.13 為 `grow-23`。

## 重建與固定輸入

從完整研究分支的 checkout 根目錄執行。`build-candidate.cjs` 預設在記憶體重建並逐位元核對凍結 HTML，加上 `--write` 會重新寫出該檔。Node.js 標準函式庫即可執行這三項檢查。

```sh
node docs/ocr/repro/grow-45-public/build-candidate.cjs
node docs/ocr/repro/grow-45-public/check-planner.cjs
node docs/ocr/repro/grow-45-public/check-planner.cjs --bench
```

13 組人工可見輸入涵蓋食物、可食／紅色／裁切／未確認幾何的 NPC、兩隻移動 NPC、近牆、白點、HUD 184 至 186 的邊界，以及小地圖缺失和過期。兩個版本的完整決策物件各 13/13 與來源函式相符。其中一個辨識拒判案例在 HUD 80 時，Grow38 的可食數為 0，Grow45 的 v2.22 分支為 1。`--bench` 在暖身後各呼叫 130 次，分別顯示當次執行的規劃耗時中位數、95 百分位和最大值。這些檢查沒有遊戲勝率分母。

## 原生寬畫面測試入口

登錄入口支援 FHD（1920×1080 視窗、預期遊戲畫布 1631×948）及 QHD（2560×1440 視窗、預期遊戲畫布 2250×1308）；DPR 均為 1。Grow38 的控制器仍以寬 2000 像素為擷取上限。兩個幾何條件各自形成獨立批次。使用同一份完整 checkout 啟動當次伺服器，再於另一個終端執行同模式的預檢。所需工具有 Node.js、Python Playwright 與 Chromium。

```sh
# FHD
node docs/ocr/repro/grow-local-r4-20261126/server.cjs --port 4173
python docs/ocr/repro/grow-38-public/geometry/native.py fhd --candidate grow45 --port 4173 --through preflight

# QHD
node docs/ocr/repro/grow-local-r4-20261126/server.cjs --geometry-mode qhd --port 4173
python docs/ocr/repro/grow-38-public/geometry/native.py qhd --candidate grow45 --port 4173 --through preflight
```

`preflight` 核對實際畫布、DPR、縮放與零開局。`--through diagnostic` 另跑控制診斷，`--through explore` 依原有計畫兩版各四局。要使通過探索門檻的批次接續獨立確認，從起點使用 `--through confirm`，完整規則見[桌機測試說明](../grow-local-r4-20261126/README.md)。
