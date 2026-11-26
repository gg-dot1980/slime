# Grow-24 — 原遊戲 iframe／原生響應式視野

2026-11-26（Asia/Taipei）。候選程式 [ocr-grow24.html](ocr-grow24.html)，來源 commit 5c57270575a344a910243cf9238ab6a64e7683d0，blob c1ce72eb49faf4ccc8b58f3832b88addfc71edaa。父版 [Grow-23](../grow-23-public/README.md) 保留，不覆寫原測試。

- 依 test/ocr-test 的 src/ocr-test.html（blob b7dda77e9e14613accd85ebef768d935a6c8d919）使用同網域原遊戲 iframe、Canvas／可見 HUD、按鍵控制。預設 /v2.13；由 /api/versions 取得最新版與其他遊戲選項，載入後核對可見版本標籤及 Canvas，錯誤時不開始。
- 移除強制 2000×1163、CSS 廣視野及行內縮放，手機與桌機依原有響應式 CSS。控制器策略保留 Grow-23（內部策略 ID 不變），不是新的路徑演算法。
- 開發實戰範圍：桌機 v2.13 與測試當日最新版（目前 GitHub game.html 顯示 v2.22；尚未核對正式站）；每版體型 200、150秒內、目標至少50%。探索各4局，達門檻後獨立確認各12局。實際 viewport、Canvas、DPR、瀏覽器及版本逐批記錄。測試環境外部調整視窗，不修改預設頁面。手機不納入過關率測試。正式 OCR4 驗收另計。
- 原遊戲會使用排行榜 API，批次測試只能在隔離同源環境（提供原遊戲、版本 API，禁止外部寫入）進行，不以修改原遊戲畫面或規則替代隔離。公開遊戲 iframe 可能正常送榜。
- 本輪只做來源檢查：Grow-23 planner 函式文字一致、固定視野移除、iframe src 替代 srcdoc、版本 API 讀取。未執行瀏覽器、實機、語法解析或自然實戰；開局0、結果0。舊固定視野結果不可合併。未部署、未合併。尚無環境／依賴鎖定／新遊戲 hash／實際 viewport／seed／正式站一致性核實。

## 2026-11-26 — 接續測試工具

新增 [run-desktop.cjs](run-desktop.cjs)，固定原遊戲 Git blob（v2.13: 16d41cdf2997baf0b3af33567b201d2dfb835427；v2.22: 30af12f7608da91514711ecdbc01b57654ab2eab），以 localhost 同源服務載入原遊戲，封鎖其他網域，拒絕排行榜及其他寫入。前景 Chromium、桌機外部 viewport 預設1440×900、DPR1；不修改頁面／遊戲畫面。實際尺寸另記。每局使用全新 browser context，所有開局及結果追加寫入新 JSONL，核對釋鍵；中斷不補局。若目前正式最新版改變，必須先核對並更新固定遊戲來源，不宣稱 v2.22 永遠是最新版。

在完整 Git checkout（包含原遊戲 blobs）及具有前景桌面的環境：

```sh
npm install --no-save playwright
npx playwright install chromium
node docs/ocr/repro/grow-24-public/run-desktop.cjs --self-test
node docs/ocr/repro/grow-24-public/run-desktop.cjs --phase explore --output /tmp/grow24-explore.jsonl
# 只有兩版探索各至少2/4且完整核對後才執行：
node docs/ocr/repro/grow-24-public/run-desktop.cjs --phase confirm --explore /tmp/grow24-explore.jsonl --output /tmp/grow24-confirm.jsonl
```

本輪已在 JS 執行環境解析兩段控制器 script、執行五組合成 planner 案例（東／西食物、東方威脅、過期畫面、v2.22 190體型免疫末段），均得到預期方向／狀態；測試 runner 的10項結算分類斷言亦在 JS 環境以 mock assert 執行通過。未執行 Node／Playwright 瀏覽器端到端、沒有新自然開局。另檢查末段免疫候選變更，五組對照輸出完全一致（父版已排除免疫時的地圖紅點），因此不建立無效新策略。Git checkout 於當前容器 DNS 失敗，GitHub 連接器只可讀寫原始碼；尚未有可用完整本地測試來源。上述指令是待實機執行的可重現入口，非完成驗收。舊 Grow-23 未決局保持原紀錄。

## 2026-11-26 09:01 — 本機原生視野測試恢復

上方「未執行Node／瀏覽器、無完整本機來源」為先前狀態。現在完整clone、原遊戲hash及本機同源載入已核實；兩版各1局10秒控制診斷完成，均預定停止並釋鍵，不能計入過關率。固定各4局探索已開始，尚未完成。新的嚴格帳本／可見結算／記錄流程與原生視野尺寸見[本機測試入口](../grow-local-20261126/README.md)。舊run-desktop.cjs保留歷史原件；本輪不以其未修正gate判定達標。
