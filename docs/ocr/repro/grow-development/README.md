# OCR Grow 研究原型來源

這組材料保留 69 個原型名稱。66 個有各自的統一差異檔，另外 3 個與已凍結的正式頁面完全相同。每一個重建版本都已用 SHA-256 與 Git blob SHA-1 比對。來源範圍為 Grow30–37、41、42。

| 候選 | 已保存的原型名稱 | 對照 |
|---|---|---|
| Grow30 | 單一凍結頁 | 附前 0.6 秒捕獲評分檢查程式。 |
| Grow31 | v1 至 v19 | v13 與正式頁逐位元相同。 |
| Grow32 | alpha、beta、bounded、delta、eps、gamma、memory、semantic、zeta | 九個舊封存成員逐一解壓核對。bounded 的兩段執行腳本與正式頁相同，早期頁首不同。另附已淘汰的標籤偵測函式。 |
| Grow33 | a 至 h | e 與正式頁逐位元相同。a、c、d 由保存的規劃模組和相同組裝流程還原，其完整 HTML 雜湊均符合當時紀錄。工作中的最後草稿對應 h。 |
| Grow34 | v1 至 v10 | v7 與正式頁逐位元相同。 |
| Grow35 | 單一組合頁 | 附 Grow32、Grow31 兩個父版的組裝程式。 |
| Grow36 | early、finalWall、finish、route、steady、temporal、wall、wall32；另有 coast、stall、value、valueWall | 前八個是已測舊封存成員，逐一解壓核對。後四個僅有準備好的源碼，沒有已驗證的離線執行紀錄。wall32 的兩段執行腳本與正式頁相同。 |
| Grow37 | v1 至 v10、arc-certified | v8 與 v10 保留源碼，沒有找到雜湊相符的完整開發局紀錄。 |
| Grow41 | 單一凍結頁 | 附近身追蹤模組與從 Grow32 重建的組裝程式。 |
| Grow42 | 單一組合頁 | 附 Grow36、Grow39 兩套感知與規劃的組裝程式。 |

[候選清單](sources-grow30-37-41-42.json) 列出各系列原型數、差異檔數與相同別名。各候選目錄的 `prototype-sources.json` 列出名稱、來源類別、確認過的開發執行狀態、SHA-256、Git blob、套用順序和基底。凍結正式 HTML 位於候選來源樹提供的 `grow-N-public/ocr-growN.html`。少數差異檔以前一個已還原原型作基底，可依清單順序重建。組裝程式維持原有查找相鄰父版的目錄約定。

以下命令使用 Python 3 和 GNU patch。第一行在暫存目錄逐檔重建並驗證，第二行將重建結果留在新的輸出目錄。

```sh
python3 restore-grow-prototypes.py /path/to/docs/ocr/repro
python3 restore-grow-prototypes.py /path/to/docs/ocr/repro --output reconstructed-prototypes
```
