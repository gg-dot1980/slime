# OCR Grow 本機 runner r2 — 2026-11-26

研究目標與門檻沿用[r1](../grow-local-20261126/README.md)：桌機v2.13、核實GitHub來源v2.22分別150秒內到體型200；探索各4至少2勝且全部有效，再獨立確認各12至少6勝。所有開始保留，中止／未知不補局、不放行；手機跳過，未涵蓋四版OCR4正式驗收。

## 修正原因與來源

r1第6次嘗試候選導覽逾時，catch讀到上一局HUD。r2保留r1原檔及帳本，以新目錄建立修正：每次prepare更換iframe元素，核對精確candidate document URL、可見遊戲版本與game URL；未開局的setup-abort只記空的本局結果，不拿舊HUD判定。本次修正處理已確認的取證缺陷；舊導覽逾時的底層原因未確定。

數字snapshot保留原planInput已產生的完整基本欄位，包括visualR、labelSeen、dangerRadius、blocked、heading.target、escaping、map.observedAt等。陣列上限120、物件100欄、深度8、文字400字，任何超限顯式diagnosticTruncated=true。拒絕像素／token類欄位；仍非遊戲隱藏狀態或影像保存。約1Hz樣本與最後最多31個決策不代表逐幀重播；末段另限400000 UTF8 bytes並記traceTailTrimmed，避免結果超過server的700000-byte接收上限。只有輸入完整且時鐘條件匹配，這些記錄才可作planner數值回放。

候選登錄Grow24／25／26，預設Grow26。兩原遊戲Git blob／SHA256與r1相同；目前main `7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a`原始碼v2.22已核實，正式站HTTP403、部署一致性未核實。GitHub feature基底 `7bd101aa616935edda6c1533d233577c463b2535`；所有完整來源在本目錄與候選固定入口，實際source/runner hashes於server啟動與每批header凍結。

## 執行

完整clone至本地，Node v24.22.3、只用標準庫。沒有GitHub Actions。受管預覽只能使用Sites既有啟動器；先確認目前預覽為本任務且已停止所有局，再切換：

```sh
sites-preview start /absolute/path/to/slime/docs/ocr/repro/grow-local-r2-20261126
```

開啟啟動器回傳URL，保持Chrome前景，不覆寫原響應式Canvas/CSS。先按「啟動兩局控制檢查」：事前固定12次交錯版本載入（不開局），再每版1局約10牆鐘秒後停止；診斷不算勝率。其後按固定探索8局，通過完整gate才允許獨立確認24局。

停止以頁面「停止批次並釋鍵」；確認全部結果寫入、active=false與held=[]後才能`sites-preview stop`。頁面整體卡住仍可能留下未決start；前端240秒不是獨立硬體watchdog，未決會阻擋驗收。

## 狀態

r2實際瀏覽器載入／啟停及新探索尚未執行，不能稱已修復所有載入失敗。Grow26合成回歸見[固定入口](../grow-26-public/README.md)。原Grow24失敗、Grow25感知反例、Grow23歷史未決均不被替換。

公開只放程式與彙總；完整私人數字帳本另保存，results-private被Git忽略。GitHub提交不等於部署或驗收。

## 固定程式檢查

`node docs/ocr/repro/grow-local-r2-20261126/check-ledger.cjs`：實際71項通過（既有45＋新26）。r2強制expected/event/result文件身分一致、固定origin與版本route、唯一候選load nonce、先開局後取樣、原生開局geometry一致；setup-abort保留空本局證據且不放行gate。原r1與raw hash再次核對不變。此檢查是合成帳本，不是自然遊戲。

`node docs/ocr/repro/grow-local-r2-20261126/check-harness.cjs`：擷取實際runner函式的51項assertions通過，涵蓋fresh iframe、錯URL／版本拒判、空setup-abort、snapshot完整性、UTF8 tail上限及開局後身份漂移。12次載入在這裡只驗流程，真實Browser仍待下一診斷。

## 09:34 真實preflight失敗，沒有自然開局

真實Chrome在12次不開局載入準備期間停止，錯誤為`Original game or visible version did not match`；沒有batch header、start或native game。最後可見原遊戲為v2.13、go已enabled。確切失敗輪次與當下事件順序未記錄，不能把它稱成兩局控制診斷已通過。

獨立小型async反例以實際candidate初始化程式重現：HTML select初始空且未disabled，parent提前選v2.22沒有生效，後續loadVersions重設v2.13。這是可重現來源缺陷，仍不證明該次現場的完整事件順序。r2來源及原51／71項檢查原樣保留；[r3](../grow-local-r3-20261126/README.md)增加初始化就緒與目標option檢查，再做新preflight，不補造任何遊戲結果。
