# Grow-24 — 原遊戲 iframe／原生響應式視野

2026-11-26（Asia/Taipei）。候選程式 [ocr-grow24.html](ocr-grow24.html)，來源 commit 5c57270575a344a910243cf9238ab6a64e7683d0，blob c1ce72eb49faf4ccc8b58f3832b88addfc71edaa。父版 [Grow-23](../grow-23-public/README.md) 保留，不覆寫原測試。

- 依 test/ocr-test 的 src/ocr-test.html（blob b7dda77e9e14613accd85ebef768d935a6c8d919）使用同網域原遊戲 iframe、Canvas／可見 HUD、按鍵控制。預設 /v2.13；由 /api/versions 取得最新版與其他遊戲選項，載入後核對可見版本標籤及 Canvas，錯誤時不開始。
- 移除強制 2000×1163、CSS 廣視野及行內縮放，手機與桌機依原有響應式 CSS。控制器策略保留 Grow-23（內部策略 ID 不變），不是新的路徑演算法。
- 開發實戰範圍：桌機 v2.13 與測試當日最新版（目前 GitHub game.html 顯示 v2.22；尚未核對正式站）；每版體型 200、150秒內、目標至少50%。探索各4局，達門檻後獨立確認各12局。實際 viewport、Canvas、DPR、瀏覽器及版本逐批記錄。測試環境外部調整視窗，不修改預設頁面。手機不納入過關率測試。正式 OCR4 驗收另計。
- 原遊戲會使用排行榜 API，批次測試只能在隔離同源環境（提供原遊戲、版本 API，禁止外部寫入）進行，不以修改原遊戲畫面或規則替代隔離。公開遊戲 iframe 可能正常送榜。
- 本輪只做來源檢查：Grow-23 planner 函式文字一致、固定視野移除、iframe src 替代 srcdoc、版本 API 讀取。未執行瀏覽器、實機、語法解析或自然實戰；開局0、結果0。舊固定視野結果不可合併。未部署、未合併。尚無環境／依賴鎖定／新遊戲 hash／實際 viewport／seed／正式站一致性核實。
