# Grow38 桌機視野重現

使用相同的 Grow38 控制器，在 Chromium 桌機視窗、DPR 1 與原遊戲 CSS 下比較專注模式。兩種視窗分開凍結探索與獨立確認。

| 瀏覽器內容區 | 單獨控制頁的專注畫布 | r4 工具列下的專注畫布 | 策略實際讀取的點陣 |
|---|---:|---:|---:|
| Full HD 1920×1080 | 1782×1036 | 1631×948 | 1631×948 |
| QHD 2560×1440 | 2401×1396 | 2250×1308 | 2000×1163 |

原遊戲畫布維持原始解析度。控制器以 `drawImage` 將超過 2000 像素寬的來源縮至擷取上限。兩個桌機尺寸在單獨控制頁切回側欄時都是 1050×610。

## 原生遊戲

安裝 Node.js 及 Python Playwright 與 Chromium。從原始碼庫根目錄啟動其中一個模式的 r4 測試服務。保留服務使用的本機埠與測試目錄，每次選一個模式執行。

```sh
cd docs/ocr/repro/grow-local-r4-20261126
node server.cjs --port 4173                       # Full HD
```

QHD 的服務命令為 `node server.cjs --port 4173 --geometry-mode qhd`。在另一個終端機切到這份說明所在目錄，執行對應的零開局預檢。

```sh
python -m pip install playwright
python -m playwright install chromium
python native.py fhd
```

QHD 改用 `python native.py qhd`。預檢核對候選雜湊、畫布像素與 CSS 尺寸、兩層 DPR、縮放與零開局證據。`--through diagnostic` 會執行兩局控制診斷，`--through explore` 會繼續執行每版各四局探索。`--through confirm` 要求雙版本探索完整且各自至少兩勝，才使用新的每版十二局獨立確認。終端機僅列每一階段的彙總。

## 固定種子開發對照

Node.js 及 `@napi-rs/canvas@0.1.100` 可離線重現固定種子。以下在這份說明所在目錄執行。

```sh
npm install --no-save --package-lock=false @napi-rs/canvas@0.1.100
node fixed-seeds.cjs qhd
```

程式依序測試兩版本與兩個固定種子，輸出按版本彙總的過關、死亡與到期局數。`standard` 使用 958×557、`intermediate` 使用舊實驗的 1740×1012，`fhd` 與 `qhd` 則使用表列的實測 r4 畫布。固定種子使用虛擬時鐘與 Skia，原生探索使用 Chromium 與自然隨機數。

| 實驗 | 原生畫布或固定點陣 | v2.13 過關 | v2.22 過關 |
|---|---:|---:|---:|
| 固定種子，標準 | 958×557 | 0/2 | 0/2 |
| 固定種子，中間尺寸 | 1740×1012 | 1/2 | 0/2 |
| 固定種子，QHD 對應尺寸 | 2250×1308 | 2/2 | 0/2 |
| Chromium 自然探索，Full HD | 1631×948 | 1/4 | 1/4 |
| Chromium 自然探索，QHD | 2250×1308 | 4/4 | 0/4 |

分母只包含該列固定批次。兩種自然探索的雙版本門檻皆未達成。Full HD 另有較早中斷的探索，與上表已完整結案的批次分開保存。
