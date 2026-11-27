# OCR 舊版與公開測試證據

2026-11-27 核對 GitHub 分支與固定提交。下列數字均來自已保留的歷史測試，本次新增實戰 0 局。

## 已發布控制器與可追溯版本

| 版本 | 輸入與策略 | 可核對成果 |
|---|---|---|
| OCR1 v86 | 畫素色塊、輪廓、小地圖，依規則避開敵人與邊界，持續撤離敵群或追食。追蹤 20 張新影格，一局停止。 | [原始碼](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/src/ocr1.html)、[回歸程式](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/scripts/test-ocr.mjs)。現有資料未提供可認定為 v86 正式勝率的批次。 |
| OCR2 v3 | 本地固定種子、遊戲 v2.13 的 Canvas 繪圖幾何與可見 HUD 模擬。 | 三局有一局過關。僅作模擬結果，未核對瀏覽器排程或線上排名。[結果](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/scripts/ocr2-results.json) |
| OCR2 v5 | 從 Canvas 繪圖幾何與 HUD 估計位置、速度及體型，比較 3.2 秒內 64 條路線，共用加速與邊界脫困。 | [原始碼](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/src/ocr2.html)。v3 的數據不能代入 v5。 |
| OCR3 v1 | 舊索引描述為改以畫素辨識，沿用 OCR2 規劃器。 | 只查到[索引卡](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/src/ocr.html)，獨立執行頁缺。 |
| OCR3 v2 | 截圖及可見 HUD、八方向短期風險；早期目標低於 110 秒。 | [可核對的匯入版本](https://github.com/gg-dot1980/slime/blob/99234cd9f4024dd73e345335a68cd54cf09d06a9/src/ocr3.html)。 |
| OCR3 v3 / test-022 | 八方向評估成長量、抵達時間、短期碰撞風險與牆邊可行性。 | v2.13、180 秒：首批 5/8，獨立確認 8/12（1 死亡、3 逾時），合計 13/20。按 150 秒重算同批為 5/20。[正式來源](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/src/ocr3.html) · [三分鐘摘要](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/evidence/ocr-three-minute-acceptance-summary.json) · [150 秒重算](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/TEST-HANDOFF.md?plain=1#L472) |

## 公開測試與 OCR4

[權威交接索引](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/TEST-HANDOFF.md)完整列出 test-001–043。test-001–022 從基線、分群追蹤、相機補償到牆邊捕食，test-023–026 為 OCR4 全版本篩選，test-027–043 涵蓋決策記錄、輪廓漏判、避險與時序等對照。test-033 對已標記且重疊的特定威脅修正辨識。test-043 是記錄器實驗。測試分支的 [timing-2 頁面](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/src/ocr-test.html) 延用 test-033 辨識與 test-026 規劃。

| 150 秒篩選候選 | v2.13 | v2.20 | v2.21 | v2.22 |
|---|---:|---:|---:|---:|
| [test-023 威脅尺寸](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/evidence/ocr4-test023-summary.json) | 3／2 | 0／0 | 0／0 | 0／0 |
| [test-024 風險時窗](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/evidence/ocr4-test024-summary.json) | 3／4 | 0／0 | 0／0 | 2／1 |
| [test-025 小地圖威脅群聚](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/evidence/ocr4-test025-summary.json) | 3／2 | 0／0 | 0／0 | 1／1 |
| [test-026 可吞食尺寸](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/evidence/ocr4-test026-summary.json) | 1／1 | 0／0 | 0／0 | 2／1 |

各格為「A 基線／B 候選」的過關數，各組分母皆為 12。四批各 96 局，共 384 個篩選開局，皆未進入獨立確認。v2.20 與 v2.21 四批的 A、B 均各 0/12。[正式驗收規格](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/SPEC.md)要求各受支援桌機版本各自達到 150 秒內過關率至少 50%，手機跳過。四批數字不可合併認定版本達標。

## 補回測試版原始碼

下列版本在共用目錄的對應資料列缺 `sourceUrl`，可由 GitHub 的 `src/ocr-test.html` 變更歷史讀回。這些連結指向已核對的程式或診斷實作。另有多個僅補頁面實驗記錄的提交，原生頁的原始碼不等同未採用的本機候選。

| 版本 | 固定執行頁與變更 |
|---|---|
| test-023 | [威脅半徑係數 1.04](https://github.com/gg-dot1980/slime/blob/935b22ea176d3799dfb631c7df3157c2ad852270/src/ocr-test.html) |
| test-024 | [風險時窗延長至 2.0 秒](https://github.com/gg-dot1980/slime/blob/0a92cdb141de361851fba96ed797ba2ca3598ee9/src/ocr-test.html) |
| test-025 | [小地圖群聚懲罰 mapRisk](https://github.com/gg-dot1980/slime/blob/039fac1c4bf40ed99fcf3924223f722798d923b8/src/ocr-test.html) |
| test-026 | [可吞食半徑係數 0.94](https://github.com/gg-dot1980/slime/blob/277913d77a543f1943f1eb918816b7f4e000dc1e/src/ocr-test.html) |
| test-027 | [可重播決策記錄](https://github.com/gg-dot1980/slime/blob/309f5326d02991547f2dcab822b08dccb21b0ce8/src/ocr-test.html) |
| test-033 | [保留重疊且具可辨標籤的威脅](https://github.com/gg-dot1980/slime/blob/e37b734f9160d84440a4c548155b40a551234282/src/ocr-test.html) |

## 研究與資料邊界

- [共用目錄](https://github.com/gg-dot1980/slime/blob/47d1495979dcf304e2d45c12f356f569040c9e94/src/ocr-console-catalog.js)在此提交有 170 筆，含 Grow 49、Claude 26、test 90、OCR1 1、OCR2 1、OCR3 3。test 的 90 筆含 43 個公開版本，44 個研究輪次（r45–85、r219、r220、r228），以及 timing-2、visible-approach-1 和 contour-path-1 三個診斷。這些是條目數，有些條目引用同一批比賽。
- test 分支的 [repro 目錄](https://github.com/gg-dot1980/slime/tree/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/repro)現有 r46-r50 共用包、r54 的分析程式與結果、r55–85 各輪目錄。r219 和 r220 各有交接入口，指向同一份離線 ZIP，控制器原始提交、依賴及完整性未逐樣核實。[r228](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/repro/r228/README.md)由三局既有資料回放 18 幀，精確重播 18/18，指定末段逃生假說命中 0/18。
- r17–44 資料未全數恢復，r43/r44 原始 JSON 或完整候選不可得。r86–218 缺逐版固定入口，r221–227 完整來源亦未補齊。部分舊輪次仍以其他包的數值摘要或後設資訊留存。不能用索引重建每輪精確輸入或宣稱整段歷史均有完整快照。[缺口](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/TEST-HANDOFF.md?plain=1#L226) · [存放規則](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/GITHUB-STORAGE.md)
- visible-approach-1 使用 24 張已存圖，8 筆新篩選命中有 5 筆重疊／裁切不確定；contour-path-1 用 12 張、43 次跨幀配對，沒有三幀大型逼近警示。timing-2 記錄五項合成檢查。三者均新增 0 實戰，不計入勝率。[可見逼近](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/repro/visible-approach-1/README.md) · [輪廓連續性](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/repro/contour-path-1/README.md) · [時序](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/repro/timing-2/README.md)
- [可重現材料規範](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/GITHUB-STORAGE.md)允許代碼、參數、依賴、無像素摘要、固定雜湊。影像、影片、逐幀 RGBA、可還原畫面的編碼與含像素日誌留本機，憑證、私人資料和正式玩家紀錄不納入。歷史包曾移除 PNG 和內嵌影像，未重寫遠端歷史。只靠公開 checkout 無法還原這些像素測試。
- [匯入來源](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/docs/source-provenance.json)是單一清理過的 Sites v103 快照，另有 [103 筆舊提交元資料](https://github.com/gg-dot1980/slime/blob/7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a/docs/source-history.tsv)。main 路徑歷史中 OCR1、OCR2 各僅有匯入提交，OCR3 有匯入 v2 和升級 v3 兩次。test/demo 是宣傳示範，poc/ocr-workflow 是離線驗證工作流程提案，兩者不增加玩法效果試驗。[示範](https://github.com/gg-dot1980/slime/blob/db57cf913880a5293d38e519bd69997f24f5c45d/docs/DEMO.md) · [工作流程](https://github.com/gg-dot1980/slime/blob/d70ca2f278a76e44adbee78e9ad91bf6553cd8c3/docs/ocr/repro/workflow-poc/README.md)
