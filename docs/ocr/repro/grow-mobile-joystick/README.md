# OCR Grow 手機直向搖桿測試

此組測量 Grow50 之後第一個新凍結候選在桌機 Chromium 模擬手機上的過關率。每個遊戲版本固定 4 個探索名額。測試同時改變視野、介面與輸入方式，因此與桌機的差異反映整組條件。用同一份候選 HTML 與相同過關規則執行。

| 項目 | 手機模擬組設定 |
|---|---|
| 瀏覽器 | Linux Chrome Headless Shell，手機直向、觸控、DPR 1 |
| 視野 | 外窗 402 × 753，遊戲原生 CSS 畫布 384 × 467 |
| 方向 | 依候選方向推動可見的螢幕搖桿，轉向時移動同一觸點，停止時放開 |
| 加速 | 策略要求加速時，第二觸點按住可見的加速鍵，與方向觸點分別釋放 |
| 遊戲 | v2.13 和 v2.22 的原版 Git blobs，在本機同源 iframe 內執行 |
| 勝利 | 可見成功結算，體型達 200，遊戲耗時最多 150 秒 |
| 排程 | 每次一個瀏覽器。已開始的桌機獨立確認優先。桌機探索失敗的候選仍須完成本次手機組 |

## 執行

需要 Python、Playwright 與研究使用的 Linux Chrome Headless Shell。從同一個已提交的凍結版本取得候選 HTML、凍結記錄中的 SHA-256 及原版遊戲目錄。把下列變數設為該候選 HTML 的絕對路徑、已核對的 SHA-256、含兩版遊戲原檔的 `src` 目錄、瀏覽器執行檔，以及本組唯一的私人工作目錄。

私人還原根目錄下，這個批次固定使用 `grow-mobile-joystick/batches/<候選完整 SHA-256>/` 作為 `MOBILE_BATCH_DIR`。首次啟動前，把候選、批次路徑與執行端登記在私人檢查點。同一執行端以檔案鎖保護批次；若要換機，先查原執行端與最後一份持久 ledger，確認原程序已停止並還原原帳。若已登記批次卻缺少最新帳本，先找回開局紀錄再續跑。

```bash
cd docs/ocr/repro/grow-mobile-joystick
python3 run.py preflight --candidate "$CANDIDATE_HTML" --sha256 "$FROZEN_SHA256" --game-root "$GAME_SRC" --chromium "$BROWSER_BIN"
python3 run.py run --candidate "$CANDIDATE_HTML" --sha256 "$FROZEN_SHA256" --game-root "$GAME_SRC" --chromium "$BROWSER_BIN" --state-dir "$MOBILE_BATCH_DIR"
python3 run.py summary --sha256 "$FROZEN_SHA256" --state-dir "$MOBILE_BATCH_DIR"
```

續跑時先讀該私人目錄的摘要，確認批次持有者與已占名額。遇中斷沿用原目錄與來源。環境遺失時先從配對私人記錄還原該批次狀態。每版列出預定名額、已開局、取得有效結果、勝、死亡、截止、中止與未知。完整 4 局時以「勝數 / 4」及百分比報告。若因中斷而無法確認是否已開局，保留占用名額並標示不完整；兩版各列自己的分母。實際遊戲輸出與逐局證據留在私人紀錄。公開彙總記載來源、條件、實際分母與結果。

## 輸入驗證

2026-11-27 使用 Linux Chrome Headless Shell 151.0.7922.34 與 Playwright 1.62.0，在兩版原遊戲各進行一次雙指診斷。測試從可見小地圖量測向右移動速度。相對於只推搖桿，同時按住加速鍵時，v2.13 量得 1.39 倍，v2.22 量得 1.38 倍。兩版均驗證持續轉向、先放開任一觸點及中止釋放，遊戲接收到的方向與加速皆為可信的觸控事件。這兩次測試達成操作斷言即停止。下一個凍結候選的探索勝率待實測。

```bash
python3 test_touch.py --chromium "$BROWSER_BIN"
python3 smoke.py --src "$GAME_SRC" --chromium "$BROWSER_BIN" --private-log "$NEW_PRIVATE_DIAGNOSTIC_LOG"
python3 test_batch.py
```
