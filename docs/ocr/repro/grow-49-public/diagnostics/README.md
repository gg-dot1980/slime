# Grow49 原生 QHD 取證

從已提交 Grow49 的研究 checkout 根目錄執行。需要 Python 3.11 以上、Playwright、Node.js、Git 與可由 Playwright 單獨啟動的 Chromium。先核對先前的逐局帳本，使用所有原生測試共用的同一把檔案鎖。輸出目錄須尚未存在，放在私人路徑中。每次只執行下列其中一條。

零開局預檢會載入原頁、驗證來源及原生幾何。將環境變數設為本機實際路徑。

```sh
python docs/ocr/repro/grow-49-public/diagnostics/observed.py \
  --chromium "$CHROMIUM_BIN" --lock "$NATURAL_LOCK" --out "$PRIVATE_PREFLIGHT" --through preflight
```

正式執行使用同一個頁面依序完成零開局預檢、兩版各一局 10 牆鐘秒診斷、交錯各四局探索，符合門檻才接續各十二局獨立確認。

```sh
python docs/ocr/repro/grow-49-public/diagnostics/observed.py \
  --chromium "$CHROMIUM_BIN" --lock "$NATURAL_LOCK" --out "$PRIVATE_COHORT" --through confirm
```

每版探索至少 2/4，才可進入確認。每版確認至少 6/12。每個合格勝局均須在 150 遊戲秒內，由原版可見結算顯示體型已達 200。預檢及 10 秒診斷均另行記帳。開局、中止、未結與未開名額均依原生帳本保存。若提前只做 `--through diagnostic`，於同一 checkout 續行時會核對已封帳的診斷並跳過它。已封帳的確認或未過門檻的探索會回報既有結果；已達門檻的探索須由保有該探索的原頁面及伺服器接續確認。已有未結帳本或缺少帳本的契約時，程序會回報其檔名並停止。

## 畫面與決策

外層視窗固定 2560×1440、原畫布 2250×1308、DPR 1。瀏覽器在每次原規劃器完成回報後，同步複製原畫布，讀取可見體型與倒數，並保存同一時點 r4 已收下的數值快照。兩版均收集。原生結尾及結算觸發時另存遊戲畫布與當時 DOM 可見文字。PNG 只包含遊戲畫布；覆蓋在畫布外的結算標題與描述列在同號 JSON 中。

每局保留首次、每 15 秒時段的首張，以及最後五秒和結算畫面。正在編碼的決策影像會使下一張略過；結尾與結算各有單獨的編碼名額。同步複製畫布會增加當次瀏覽器工作量。比對實測時須一併查看每局決策數、超時事件、影像筆數和遺漏。原始 r4 工作目錄與新輸出中的 `ledger/` 保存自然分母。若程序遭強制終止導致拷貝未完成，以原工作目錄中的資料優先核對。

輸出中的 `freeze.json` 保存實際來源與觀察器雜湊，逐階段的 `*-capture-stats.json` 保存忙碌、失敗與未完成計數。`capture-index.jsonl` 記錄每次保留、淘汰和容量限制，`retention.json` 列出最後保留的索引。每局預設上限 96 MiB，預留結尾與結算影像空間。剩餘磁碟低於 128 MiB 時，略過新畫面並記帳。核對自然成績使用原 r4 的完整帳本、可見結算與釋鍵證據。

離線檢查回呼、掉幀、時間窗保留及續跑判定。

```sh
node docs/ocr/repro/grow-49-public/diagnostics/test-observer.cjs
python docs/ocr/repro/grow-49-public/diagnostics/test-observed.py
```
