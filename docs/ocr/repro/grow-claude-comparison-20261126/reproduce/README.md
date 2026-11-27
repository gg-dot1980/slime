# 固定種子 Grow／Claude 配對重現

在完整 `gg-dot1980/slime` Git checkout 內執行。入口預設只核對兩個遊戲 blob、重建五份控制頁並核對 SHA-256，輸出 `starts: 0`。需 Git、Node.js 及 Skia 套件 `@napi-rs/canvas@0.1.100`。參考環境是 Linux x86_64、Node.js 24.22.3。以下範例將 npm 依賴放在暫存目錄。

```sh
cd docs/ocr/repro/grow-claude-comparison-20261126/reproduce
deps=$(mktemp -d)
npm install --prefix "$deps" --no-save --no-package-lock @napi-rs/canvas@0.1.100
export NODE_PATH="$deps/node_modules"
node compare.cjs --check
```

此 checkout 須有 Grow26、38、42 的研究提交和 `ocr-claude` 的歷史物件。若原先只取單一分支，先取得研究比較所在分支與 `git fetch origin refs/heads/ocr-claude:refs/remotes/origin/ocr-claude`；淺層複本需補足歷史。核對程式以 `git rev-parse --show-toplevel` 找尋根目錄，以固定 Git 物件讀取，兩個 Claude 建置在暫存目錄完成。

明確輸入模式才會開始新的開發測試。程序逐局使用獨立 Node 子行程，最後輸出分組統計。標準模式 24 局，QHD 模式 8 局。

```sh
node compare.cjs standard
node compare.cjs qhd
```

| 模式 | 原遊戲畫布 | 控制頁與實選策略 | 控制器實際取樣 |
|---|---|---|---|
| `standard` | 958×557 | Grow42 的 `grow-23`；研究 Claude 頁的 `claude-22` 與預設 `grow-6`；網站 Grow26 的 `grow-26`；網站 Claude21 頁的預設 `grow-6` 與 `claude-21` | 全部 958×557 |
| `qhd` | 2250×1308 | Grow38 的 `grow-23`；研究 Claude 頁的 `claude-22` | Grow38 為 2000×1163，Claude22 為 1200×698；各以 Skia `drawImage` 從同一原生尺寸縮圖 |

`Grow42`、`Grow38`、`LiveGrow26` 均來自比對過雜湊的 Git blob。研究 Claude22 在 `8f13c2062d8a3da9ec63a6a76b2577db029ca45d` 用該提交的官方建置程式組成。網站 Claude21 可由 `dcd55ddb251a94e087c1d0de56ef4c0e0f2b608e` 的官方建置產物替換兩段顯示文字後完整還原，頁面 SHA-256 為 `cb5f98560c76b1f773eb28af54532a7e91b9578ffdf3498b266f0072dd8e3dde`。`sources.cjs` 列出所有控制頁與遊戲的 Git 識別及 SHA-256。

兩個預先登記的遊戲種子為 `1944801795`、`4247134342`，各取 `ocr-grow-claude-review-pair-v1/1`、`/2` 的 SHA-256 前四個位元組作無號大端整數。各組分別執行相同的 v2.13、v2.22 原遊戲程式，以可見畫布和 HUD 控制。初始 HUD 為體型 25、05:00、吞食數 0。第一次控制決策在 300 ms，之後 Grow 每 100 ms、Claude 頁每 200 ms。程式核對實際規劃策略、原生按鍵釋放及成對的第一幀畫素。Claude 頁的 `grow-6` 在體型小於 90 時將其決策標作 `grow-1`。

有效過關需有原遊戲成功畫面，結算時間整秒不超過 02:30。虛擬時間第 151 秒仍未結算就記截止。`referenceRasterMatches` 核對四組起始畫面的合併指紋，`referenceCountsMatch` 核對各組的過關、死亡與截止，`referenceOutcomesMatch` 另依登記種子／版本／策略順序核對整組結算類別、原遊戲結算秒數和最終體型的合併指紋。三項皆為真才以退出碼 0 結束；產生可分類但不同的結果時仍列印分組計數並回傳 2。未識別的結算、輸入或來源出錯會中止批次。

此入口重建的是 Skia 開發對照。原遊戲使用 60 Hz 虛擬 RAF；簡化的介面執行原控制頁的時序與決策腳本。QHD 直接給定兩個原畫布尺寸，不執行整頁排版。Claude 頁面的隔離遊戲資料用於核對版本，共同比較環境實際執行同一份未改動的遊戲 Git blob。虛擬 `performance.now()` 排除真正瀏覽器的計算開銷與逾時效應。明選 `claude-21` 的 NPC 尺寸記憶仍按 `Date.now()` 的實際時間清除八秒舊資料，重跑結果可能受主機速度影響。

字型和原生繪圖平台也可能改變像素。`--check` 另輸出 `system-ui` 字型試繪指紋及 `fontProbeMatchesReference`，供重跑者查異；原始字型安裝與繪圖環境未隨包分發。固定來源與程式依賴可獨立核對，實際過關結果和首幀的一致性另由各模式的輸出檢查。
