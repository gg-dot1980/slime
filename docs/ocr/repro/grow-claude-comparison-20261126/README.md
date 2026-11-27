# OCR Grow 與 Claude 的過關紀錄

## Grow46 原生 QHD 更新

Grow46 的 QHD 自然探索為 v2.13 **4/4**、v2.22 **3/4**。探索通過雙版本門檻，獨立確認為 v2.13 10/12、v2.22 4/12。這組結果與 Grow45 的 4/4、1/4 各自計數。[Grow46 的分母、規劃器與測試條件](../grow-46-public/results/README.md)


## Grow45 原生 QHD 更新

Grow45 在 2250×1308 原生畫布上，v2.13 沿用 Grow38 規劃器，探索為 **4/4**。v2.22 改用 Grow15 規劃器，得到 **1/4**。這是 Grow38、Grow44、Grow45 三組相同 QHD 條件下，v2.22 首次觀察到勝局。每版只測四局，v2.22 尚未達到 2/4 的探索門檻，因此未啟動獨立確認。[Grow45 完整分母、規劃器與測試條件](../grow-45-public/results/README.md)

截至臺北時間 2026-11-26 13:29:31。達標指原遊戲顯示過關且遊戲時間不超過 150 秒；下表按 v2.13、v2.22 分列。正式站版本 193 發布於 12:35，兩個入口分別是 Grow26 和 Claude21。Claude21 頁預設選用 Grow6。[Grow 入口](https://slime.gameson.cc/ocr-grow) · [Claude 入口](https://slime.gameson.cc/ocr-claude)

**研究比較建議。** 用 Grow38 做原生寬畫面基線；它沿用 Grow24 的控制，桌機可展開遊戲區。958×557 用 Grow39 做對照，它將小地圖短期軌跡連到主畫面體型，在 v2.13 探索得 2/4、v2.22 得 0/4。Claude11 適合做 v2.22 既有過關參照，在 Claude11／21 當批有一局 141 秒。Claude22 從 Claude20 加上 1.5 秒避牆，適合檢查存活及靠牆行為，在下列窄畫布開發對照四局均活到截止。[Grow38](https://github.com/gg-dot1980/slime/blob/a05856d4540d11b1b7860ff50a06bac4d80762ca/docs/ocr/repro/grow-38-public/README.md) · [Grow39](https://github.com/gg-dot1980/slime/blob/a05856d4540d11b1b7860ff50a06bac4d80762ca/docs/ocr/repro/grow-39-public/README.md) · [Claude11／21](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/docs/ocr/repro/phase1-minimap/README.md) · [Claude22 協議](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/docs/ocr/repro/phase2-wall/PROTOCOL.md)

Claude11、21 會辨識畫面上的小地圖白點；Claude20、22 的選項分派略過白點偵測，可見主畫面的 NPC、紅色威脅以及牆仍可用。比較 Claude20／21 或 Claude11／20 時，路徑差異可能同時受白點資訊影響。歷史 Claude 的 2000×1163 是外窗，後三組實記遊戲視野為 1050×610；Grow15 的 2000×1163 是早期強制尺寸的遊戲畫布。[Claude 白點分派](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/src/ocr-claude.html#L138-L145) · [Grow15 畫布](https://github.com/gg-dot1980/slime/blob/a05856d4540d11b1b7860ff50a06bac4d80762ca/docs/ocr/repro/grow-evaluation-20261125/README.md)

**Grow44 測的是兩秒內可接觸的可食 NPC。** 它取自 Claude1–4 使用的 `planClaude`：對每個可接觸獵物，依預估成長量 `g`、到達時間 `t` 加上 `12 × g / (t + 0.35)`。同一頁的舊 Grow6 `planGrow` 也有相同權重。Grow44 在 Grow38 的 v2.22 安全路徑中加入這項評分，會轉向的路徑只計首次轉向前的接觸；v2.13 沿用父版。父子版在 v2.22 的兩個固定 QHD 開發種子均 0/2。同規格 QHD 自然探索，Grow44 的 v2.13、v2.22 分別為 2/4、0/4；先前父版分別為 4/4、0/4。兩組各自自然開新局；差額不能單獨歸因於策略。這次 v2.22 的過關數未優於父版。[Claude1–4 的評分](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/src/ocr-claude.html#L258-L280) · [Grow6 的評分](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/src/ocr-claude.html#L240-L253) · [策略分派](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/src/ocr-claude.html#L391) · [Grow44 凍結版本](https://github.com/gg-dot1980/slime/blob/e6130a4f3a850600d0d77362bbb0e04163dba199/docs/ocr/repro/grow-44-public/README.md)

Grow44 的 2 個勝局都由可見結算明文確認體型已達 200。其中 1 局的最後 HUD 亦達 200，其餘 1 局的最後 HUD 仍低於該值。固定原遊戲在吞食後先判斷玩家半徑是否至少 200，成立即結束該幀；畫面上的 HUD 更新在其後，因此最後 HUD 可能尚在 200 以下。[v2.13 原遊戲](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/src/game-v2.13.html#L76-L92) · [v2.22 原遊戲](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/src/game.html#L77-L94)

## 歷史自然局與獨立確認

下表為各自批次的過關數／有效遊戲結果數。各批的版號、畫布及是否完成確認會影響解讀。兩版皆滿足至少 6/12 是 Grow 獨立確認的樣本門檻。

| 候選及條件 | v2.13 | v2.22 |
|---|---:|---:|
| Grow15 · 舊相容層、固定畫布 2000×1163，獨立確認 | 11/12 | 5/12 |
| Grow16 · 舊固定畫布，僅測 v2.22，獨立確認 | — | 5/12 |
| Grow22 · 舊版隔離頁，獨立確認 | 5/12 | 1/12 |
| Grow23 · 舊版隔離頁，探索 | 4/4 | 3/4 |
| Grow23 · 舊版隔離頁，確認中斷 | 2/2 | 0/1，另 1 未決 |
| Grow26 · 958×557，探索中斷 | 0/2 | 0/2 |
| Grow34 · 958×557，自然探索 | 1/4 | 0/4 |
| Grow38 · 1631×948，桌機專注顯示 | 1/4 | 1/4 |
| Grow38 · 2250×1308，桌機專注顯示 | 4/4 | 0/4 |
| Grow39 · 958×557，自然探索 | 2/4 | 0/4 |
| Grow42 · 958×557，自然探索 | 0/4 | 0/4 |
| Grow44 · 2250×1308，桌機專注顯示 | 2/4 | 0/4 |

Grow26 的原定八次嘗試中，四局取得原生結果，另有一次中止、三局未開。Grow23 確認原定兩版各 12 局，以上是最後能核實的四次開局。可在資料檔查閱其餘候選、失敗類型與各自分母。[Grow15 測試條件](https://github.com/gg-dot1980/slime/blob/a05856d4540d11b1b7860ff50a06bac4d80762ca/docs/ocr/repro/grow-evaluation-20261125/README.md) · [Grow23 紀錄](https://github.com/gg-dot1980/slime/blob/a05856d4540d11b1b7860ff50a06bac4d80762ca/docs/ocr/repro/grow-23-public/README.md) · [桌機探索](https://github.com/gg-dot1980/slime/blob/a05856d4540d11b1b7860ff50a06bac4d80762ca/docs/ocr/repro/grow-desktop-summary/results.json) · [彙總資料](aggregates.json)

## 歷史上同一測試流程的 Grow 與 Claude

| 對照批次 | Grow6 | Claude 候選 |
|---|---:|---|
| Claude1、2 · 四個遊戲版本，每臂每版 3 局 | 0/12 | Claude1 0/12、Claude2 0/12 |
| Claude3、4 · 四個遊戲版本，Grow6 每版 2 局、候選每版 3 局 | 0/8 | Claude3 0/12、Claude4 0/12 |

兩批都涵蓋 v2.13、v2.20、v2.21、v2.22。測的是同規格 headless Chrome、2000×1163 外窗、DPR 1、標準視野。每局各自隨機，所記的外窗尺寸不能當成遊戲畫布尺寸。[Claude1、2](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/docs/ocr/repro/claude-1/README.md) · [Claude3、4](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/docs/ocr/repro/claude-3/README.md)

Claude 後續各批的外窗仍是 2000×1163，觀察紀錄內的遊戲視野為 1050×610。下表列相同批次內、逐局交錯但各自開新局的兩個策略。這些批次未測新版 Grow。

| 對照 | v2.13 · 前者／後者 | v2.22 · 前者／後者 |
|---|---|---|
| Claude11、16 | 0/20、0/20 | 0/20、0/20 |
| Claude11、20 | 0/20、0/20 | 0/20、0/19，另 1 次控制器中止 |
| Claude11、21 | 0/20、0/20 | 1/20、0/20 |

在 Claude11／21 的 v2.22 批次，Claude11 的一個成功局為 141 秒。Claude22 在讀取的遠端研究提交中只有 Claude20／22 的事前協議。研究候選 Grow43 的 v2.22 既有回歸為 2/2，使用既知種子，沒有原生自然探索結論。[Claude11／16](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/docs/ocr/repro/phase0/README.md) · [Claude11／20](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/docs/ocr/repro/phase1-fit/README.md) · [Claude11／21](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/docs/ocr/repro/phase1-minimap/README.md) · [Claude22 協議](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/docs/ocr/repro/phase2-wall/PROTOCOL.md) · [Grow 候選紀錄](https://github.com/gg-dot1980/slime/blob/a05856d4540d11b1b7860ff50a06bac4d80762ca/docs/ocr/repro/grow-version-history.md)

## 同一起始畫面的開發對照

同版本、同種子三臂的第一張競技場畫布雜湊一致。兩個新種子與已辨識的 28 個開發種子均無重疊。在 958×557、DPR 1 的 Skia 虛擬時間環境，用同一份原遊戲 JS、正式控制器和鍵盤事件運行。遊戲畫面更新 60 Hz；Grow42 每 100 毫秒、Claude 頁兩個選項每 200 毫秒決策。對照涵蓋每臂每版兩局。

| 控制器 | v2.13 過關 | 死亡／截止 | v2.22 過關 | 死亡／截止 |
|---|---:|---:|---:|---:|
| 研究 Grow42 | 0/2 | 1／1 | 0/2 | 1／1 |
| 明選 Claude22 | 0/2 | 0／2 | 0/2 | 0／2 |
| Claude 研究頁預設 Grow6 | 0/2 | 1／1 | 0/2 | 2／0 |

三臂各版皆為 0/2；Claude22 在這四局均活到截止。策略選擇會改變後續遊戲事件與隨機數消耗。虛擬時鐘略過真機計算耗時，這批結果只描述所列初始條件，無法據以推算自然過關率。[Grow42 程式](https://github.com/gg-dot1980/slime/blob/a05856d4540d11b1b7860ff50a06bac4d80762ca/docs/ocr/repro/grow-42-public/ocr-grow42.html) · [Claude 研究程式](https://github.com/gg-dot1980/slime/blob/8f13c2062d8a3da9ec63a6a76b2577db029ca45d/src/ocr-claude.html) · [對照彙總](aggregates.json)

### 同種子重跑正式站版本 193 的兩個頁面

以下使用正式站兩頁的控制器程式、相同兩個種子、遊戲版本、958×557 畫布與虛擬時間。Grow26 每 100 毫秒決策，Claude 頁每 200 毫秒決策。與上表逐格核對，起始競技場像素雜湊皆相同。

| 控制器 | v2.13 過關 | 死亡／截止 | v2.22 過關 | 死亡／截止 |
|---|---:|---:|---:|---:|
| 正式站 Grow26 | 0/2 | 0／2 | 0/2 | 2／0 |
| 正式站 Claude 頁預設 Grow6 | 0/2 | 1／1 | 0/2 | 2／0 |
| 正式站明選 Claude21 | 0/2 | 0／2 | 0/2 | 1／1 |

兩個正式站預設選項在這些開發種子中皆無過關。明選 Claude21，v2.22 兩局中有一局活到截止。正式站與研究頁的預設 Grow6 在相同四個起始條件下重現同樣結局與每十秒體型，兩組沿用同一對種子。Claude21 的白點尺寸記憶以實際牆鐘的八秒過期；測試只虛擬遊戲及決策排程，因此換機或改變負載後，Claude21 在相同種子仍可能走出不同結果。[正式站程式對照彙總](aggregates.json)

### 同種子、統一 QHD 遊戲畫布

Grow38 與明選的 Claude22 共用 2250×1308 原始畫布與先前相同的兩個種子。各控制器照自己的程式取樣：Grow38 為 2000×1163，Claude22 為 1200×698。這個對照統一外部畫布，用來觀察兩套策略；Claude 預設版面與原生瀏覽器效能需另外實測。

| 控制器 | v2.13 過關 | 死亡／截止 | v2.22 過關 | 死亡／截止 |
|:---|---:|---:|---:|---:|
| Grow38 | 2/2 | 0／0 | 1/2 | 0／1 |
| Claude22 | 0/2 | 1／1 | 0/2 | 1／1 |

Grow38 三個過關結算的遊戲時間介於 128–135 秒，三次都明文確認達到體型 200，其中一次的末筆 HUD 也顯示 200。Claude22 兩版各有一局死亡、一局截止。合計兩個死亡結算的遊戲時間介於 80–149 秒，最後記錄的 HUD 體型介於 65–73。這些固定種子的結果只支持在所列 QHD 初始條件下的觀察。

[固定種子重現方法](reproduce/README.md) · [各組分母及固定來源](aggregates.json)
