# Grow44 可接觸獵物優先

Grow44 延續 Grow38 的桌機專注顯示及可見畫面辨識。v2.13 使用原來的規劃。v2.22 對通過原有牆界與威脅檢查的路徑，另計目前方向可接觸的 NPC。出生時若有路徑也符合出生保留距離，優先在該組中評分；若沒有，仍在通過牆界與威脅檢查的路徑中選取。原有緊急逃離流程維持父版計算。估計成長量為 `g`、預測接觸時間為 `t` 秒時，加分為 `12 × g / (t + 0.35)`。只計兩秒內的接觸。兩段方向相異時只計首次轉向前可碰到的 NPC。小地圖白點只提供探索位置，食物保留原有估分。

額外收益取自 Claude 分支的可見輸入規劃函式 `planClaude`。Grow38 自有的尺寸判定、接觸距離及兩段路徑維持原有計算。[Claude 來源](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/src/ocr-claude.html)

父版 QHD 自然探索的 v2.22 有四場到期。579 個約每秒樣點中，388 個選了食物與探索，當中 62 個也有被父版判定為可食的 NPC。有 2 個樣點選擇逃離。按 Claude22 的牆距模型把同一個已選方向延伸 1.5 秒，未有樣點預測穿牆，有 3 個進入距牆 150 的範圍。因此這次採用短時捕食收益。這些逐秒觀察無法判定個別吞食事件。

## 重建及固定輸入檢查

從儲存庫根目錄執行下列命令。第一行在記憶體中重建並核對完整 HTML；加上 `--write` 可從父版寫出候選。

```sh
node docs/ocr/repro/grow-44-public/build-candidate.cjs
node docs/ocr/repro/grow-44-public/check-contact.cjs
```

九種人工可見輸入涵蓋可吃獵物、食物、紅色／裁切／阻擋／過遠的身體、只有白點、附近威脅及牆。v2.13 的九個完整決策都與父版相同。離線 QHD 的兩個 v2.22 固定種子對照中，Grow38 與 Grow44 均為 0/2 在 150 秒內達標，觀察到的體型與存活時間也未顯示改善。

獨立桌機自然探索設定為 2560×1440 視窗、2250×1308 原生畫布、DPR 1，每版本固定四局。測試使用同源原遊戲與其可見結算。[桌機測試入口](../grow-local-r4-20261126/README.md)

[完整候選](ocr-grow44.html) 的 SHA-256 為 `3c2f5b5a82d3276f0f512255fcc336910e398f27b895fc0334a55b263a8b7a6d`，父版 Grow38 為 `befaf6a2c6ac1ff14596628753e509e5c15eb5bffd0e6f62f81e91b884f239ec`。

## QHD 原生探索重現

在這個版本的完整 Git checkout 根目錄執行。先安裝 Node 20 以上、Python 的 Playwright 與 Chromium。此次登錄的桌面環境為 Chromium Headless Shell 156.0.8078.79、語系 zh-TW、DPR 1。候選在 2560×1440 可視區的原生遊戲畫布為 2250×1308，控制器以 2000×1163 取樣。

```sh
node docs/ocr/repro/grow-local-r4-20261126/server.cjs --geometry-mode qhd --port 4173
```

另開終端機，在同一份 checkout 執行下列指令。可附加 `--chromium /path/to/chromium-headless-shell` 指定可執行檔。

```sh
python docs/ocr/repro/grow-38-public/geometry/native.py qhd --candidate grow44 --port 4173 --through preflight
```

預檢會量測實際幾何且不開始遊戲。要在同一執行中進行預檢、兩版各 10 秒控制診斷及交錯探索，改用 `--through explore`。若要在探索通過後接著完成獨立確認，從一開始用 `--through confirm`。v2.13 和 v2.22 各 4 局探索均須至少 2 勝、完整性合格，才接著跑每版 12 局確認，各版需至少 6 勝。一勝須於 150 遊戲秒內達體型 200。保存中斷時已完成的局與未決數，不在原分母補局。不同執行會產生新的批次。
