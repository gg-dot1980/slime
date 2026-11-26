# OCR Grow 桌機研究批次

從本提交的 repository 根目錄執行下列命令。需要 Node.js 20 或更新版本與桌機 Chromium，相依套件使用 Node 內建模組。

```sh
node docs/ocr/repro/grow-local-r4-20261126/server.cjs --check
node docs/ocr/repro/grow-local-r4-20261126/server.cjs --port 4173
```

在桌機瀏覽器開啟終端輸出的本機網址，選擇候選。先按「載入預檢」，完成後可按「啟動兩局控制檢查」，然後開始固定 8 局探索。每版本獨立 4 局中至少 2 局在 150 遊戲秒內達體型 200，且資料完整，才會開放獨立 24 局確認，每版本門檻為 6/12。預設選本提交編號最大的候選。每批記錄實際視窗、DPR、原遊戲、候選及 runner 雜湊。

`candidates.json` 是本提交的候選清單。預檢會核對每個 HTML 的 SHA-256 與兩版原始遊戲的 Git blob 身分。Grow24–26 依其原來規則固定實際 responsive 幾何。其他 native 候選使用自然產生的 958×557 畫布、DPR 1。FHD 使用 1920×1080 外層可視區、DPR 1，保留實際量得的寬畫布。為 Grow38 執行獨立 QHD 批次時，啟動命令加上 `--geometry-mode qhd`，使用 2560×1440 可視區和 2250×1308 畫布。設定視窗後可用載入預檢核對實際幾何。

每局私有輸出寫入本目錄的 `results-private/`。每秒 sample 與結束時的 result 可含 `visibleIntake`，記錄可見 HUD 的吞食總數、遊戲秒及期間可讀的食物／NPC 提示與顯示的體型增量。相同提示持續顯示只記一次。同一幀中被覆寫的提示無法逐個還原，分類數是觀察下限。

離線測試可在本目錄執行 `node check-harness.cjs`、`node check-ledger.cjs`、`node check-visible-intake.cjs`。測試使用合成資料。
