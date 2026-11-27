# Grow49 裁切定位檢查

Grow49 以 Grow48 的完整 HTML 為輸入。建置程式核對母版 SHA-256，將單邊裁切輪廓估計加入 v2.22 的畫面辨識。對一個已標為裁切的大型物件，只在連通區確實接觸畫面單邊、主要填色一致、外緣足以擬合圓形，且遠離玩家與小地圖遮罩時，修正垂直於該邊的座標。切線方向座標、物件半徑與原有裁切分類仍由既有辨識流程輸出。

## 建置與版本檢查

從本資料夾的上一層執行。需要 Python 3 和 Node.js。第二行核對重新建置的位元組與待測檔完全相同，第三行編譯頁中所有腳本並分別檢查 v2.13、v2.22 的有效決策與停止紀錄。

```sh
python build.py /path/to/ocr-grow48.html ocr-grow49.html
python build.py /path/to/ocr-grow48.html ocr-grow49.html --check
node diagnostics/check.cjs ocr-grow49.html
```

## 原圖人工裁切對照

需要 Pillow、封存 PNG 與獨立準備的私有清單。測試程式用原圖中央可見名稱的亮色字芯作參照。把每個完整 NPC 的原始像素複製到四個畫面邊界，讓名稱中心距邊界為輪廓半徑的 0.8、0.5 或 0.15 倍。使用三像素網格執行候選的連通區分割與輪廓估計，分別計算原始質心、修正後中心至參照點的距離。輸出另外列出角落雙邊裁切、完整輪廓、遮罩、重疊、玩家區及食物樣本。

```sh
python diagnostics/crop-controls.py ocr-grow49.html /path/to/evidence.zip /path/to/private-inventory.json /path/to/private-results.json
```

清單為 JSON 陣列。每個項目提供唯一的 `key`、角色 `role`（`single`、`merged`、`player`、`food`）、ZIP 成員路徑 `member`、PNG 的 `sha256`、輪廓範圍 `extentRadius`、正方形擷取框 `tileBox` 與近似中心 `referenceSeed`。完整 NPC 還需提供名稱搜尋框 `nameSearchBox`。座標單位為原始畫布像素，框依序為左、上、右、下，右與下不含終點。PNG、物件選取座標與逐筆結果保留於私有封存。

| 項目 | 此次結果 |
| --- | ---: |
| 完整 NPC 來源與單邊裁切測例 | 5 個來源、60 個測例 |
| 中心修正啟用 | 32/60 |
| 誤差降低／增加／持平 | 32／0／28 |
| 全部測例的中位誤差，原始／修正後 | 20.17／4.03 像素 |
| 取得連通區的排除測例 | 21/21 |
| 排除測例誤啟用 | 0/21 |

同一來源的不同裁法共用原圖。這些數字衡量裁切後的中心定位。自然勝率需要另外以完整遊戲批次驗證。
