# OCR Claude 續測流程

版本 v1 · 2026-11-27（台灣時間）。依使用者指示，Claude 系列套用 Grow 研究分支的流程：
- [GROW-WORKFLOW](https://github.com/gg-dot1980/slime/blob/d283cb8510d4b4653b6704d7652b4b4943e80e58/docs/ocr/GROW-WORKFLOW.md)
- [模擬手機搖桿組](https://github.com/gg-dot1980/slime/blob/d283cb8510d4b4653b6704d7652b4b4943e80e58/docs/ocr/repro/grow-mobile-joystick/README.md)

兩份都是 d283cb8。Claude 的策略與紀錄都放在 `ocr` 分支。本文不修改正式 OCR4 規格與驗收。

## 目前狀態（2026-11-28）

**2026-11-28 重啟**：使用者要求從所有有潛力的做法產生 Claude 自己的版本；逐局原檔不保留，只更新彙總。claude-32（Grow46 決策移植）QHD 桌機 4/4、1/4。以下為暫停時的紀錄。

**Claude 線暫停**（使用者同意）。

- Claude27～31 依本流程凍結並探索，QHD 桌機與手機組都是 0 勝，都沒有開確認。
- 同一測試台的校準與拆解（[claude-31-factorial](repro/claude-31-factorial/README.md)、[claude-31](repro/claude-31/README.md)）顯示：Claude 的辨識補到 Grow46 的水準後仍 0 勝，所以瓶頸在 Claude 的決策方法。
- 目前最接近目標的是 Grow46：v2.13 已達門檻，弱點在 v2.22。後續研究交給 Grow 研究分支，分工先和 Grow 研究方協調。

若要重啟 Claude 線，下一個候選應該把 Grow46 的決策（`planGrow46` 及其依賴）移到 Claude 頁面，再沿用本流程。

## 固定研究條件

- **頁面**：本分支 `npm run build` 後由 `npm run dev` 提供的 `/ocr-gui-design/claude/`，載入原遊戲 v2.13 與 v2.22（Git blob 見 freeze.json）。
- **凍結**：每個要開自然局的候選，先在 `docs/ocr/repro/<候選>/freeze.json` 記下：
  - 原生選單值。
  - `src/ocr-claude.html` 的 SHA-256 與 Git blob。
  - 來源提交。
  - 各組幾何。
  凍結後不改來源；要改就是新候選。
- **桌機組**：沿用 Grow 研究的 QHD 幾何。視窗 2560×1440，遊戲畫布 2250×1308 CSS px，DPR 1，鍵盤輸入（`OCR_GEOMETRY=qhd`）。之前的 2000×1163／1050×610 批次另列為「標準」組，不和 QHD 混用。
- **探索**：
  - 先在桌機組跑 v2.13、v2.22 各 4 局。
  - 兩版各至少 2 勝且資料完整，才以同一凍結候選另起各 12 局獨立確認。
  - 確認時每版至少 6 勝才算通過。
  - 每勝須在 150 遊戲秒內達體型 200，並有可見的成功結算。
- **手機組**：
  - 每個新凍結的候選都另跑 v2.13、v2.22 各 4 局。桌機探索沒過門檻也要跑。
  - 設定：直向外窗 402×753，原生畫布 384×467，DPR 1，觸控（`OCR_GEOMETRY=mobile`）。
  - 控制器送出的方向鍵由 [touch bridge](../../scripts/ocr-claude-touch-bridge.js)（原樣取自 d283cb8）攔下，轉成可信的 CDP 觸控：第一觸點推畫面上的搖桿，第二觸點按住加速鍵。
  - 只統計探索勝率。
- **排程**：
  - 一次只開一個瀏覽器。
  - 已開始的桌機確認優先。
  - 所有開局、死亡、截止、中止與未知都保留，不補跑、不刪除。
- **篩選工具不算自然局**：參考機器人、混合工具、3 倍速的結果只用來決定要不要凍結候選。

## 報告

- 每組、每版列出：預定名額、已開局、有效、勝、死亡、截止、中止、未知。
- 勝率寫成「勝／局」與百分比。
- 逐局原檔、影像與私人路徑不上 GitHub。公開只放程式、凍結資料與各組彙總（[claude-results.json](results/claude-results.json)、各候選 README）。

## 命令

```bash
npm run build && npm run dev
OCR_GEOMETRY=qhd    STRATEGY=<候選> OBSERVE=1 PLAYWRIGHT_DIR=<dir> node scripts/ocr-claude-batch.mjs http://localhost:4173/ocr-gui-design/claude/ <私人>/qhd.jsonl v2.13,v2.22 4 <候選>-qhd-explore
OCR_GEOMETRY=mobile STRATEGY=<候選> OBSERVE=1 PLAYWRIGHT_DIR=<dir> node scripts/ocr-claude-batch.mjs http://localhost:4173/ocr-gui-design/claude/ <私人>/mobile.jsonl v2.13,v2.22 4 <候選>-mobile-explore
```

`OBSERVE=1` 只在測試端讀遊戲狀態做診斷（吞食分類、凶手），控制器不會讀到。

## 輸入驗證（2026-11-27）

- 以 claude-22 在手機組跑 1 局 v2.13 作診斷，不算樣本。
- 畫布 384×467。
- 觸控送出 touchStart 1、touchMove 197 次，結束時以 touchCancel 釋放。
- 遊戲收到可信觸控，最多同時 2 點（搖桿＋加速），沒有鍵盤事件漏進遊戲。
- 150 秒時體型 94。
