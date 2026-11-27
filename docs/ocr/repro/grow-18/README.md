# Grow18：名義致命尺寸納入硬性避碰

本目錄保存凍結 Grow18 的完整重建材料、測前檢查、完整screen-06原始數值及研究依據。**Grow18未通過篩選門檻：v2.13為4/4勝，v2.22為1/4勝。** 因v2.22未達事前2/4門檻，兩版的confirm-06均未啟動；其狀態為 `not_run_gate_failed`，不是0%勝率。原始8個開局及8個native finals全部保留，沒有排除、替換或補跑。

- Repository：`gg-dot1980/slime`；權威測試分支：`test/ocr-test`。
- 權威基底：`46b8aa3f8207ed03bc89c84c6ed896a23bcd5601`；本輪 publication parent：`0f450e7682c2ac97181e1dae9fd35f67c1454e1d`。
- 父策略：凍結 Grow15，planner SHA-256 `e89d6a8cb0201a8caf0314c023e16f37f63396dd44615bf4dcdc823077e0fd0e`。
- 批次 protocol hash：`e436c342e09d99758aec04da125d1913ae3bc7fdc754c0daef6f1b0780b8eabf`。
- 來源凍結時間：2026-11-25 14:22:18.037039（台北時間，原始UTC為06:22:18.037039）；[freeze.json](source/experiments/grow18/freeze.json) 記錄凍結時 starts=0。25項 harness 檢查於台北14:21:45.399完成（UTC06:21:45.399），首局於台北14:22:27.123開始（UTC06:22:27.123）；[preflight-review](checks/preflight-review.json) 的文件稍後落檔，保留了這個時序。

## 完整screen-06結果

[原始225筆numeric events](results/events.jsonl)、[逐局統計](results/evaluation-summary.json)、[獨立最終審查](checks/final-results-review.json) 及 [狀態](results/status.json) 保存原件與分母。批次於2026-11-25台北14:22:27.123開始，14:39:29.738正常batch_end（UTC06:22:27.123～06:39:29.738）。8 starts、8 native finals、0 unresolved、統計器0 anomalies；不能把未啟動的確認階段合併進篩選分母。

| 階段／版本 | Starts／native finals | 150秒內勝利 | 死亡 | 觀察勝率 | Wilson95%區間 | 判定 |
|---|---:|---:|---:|---:|---:|---|
| screen-06／v2.13 | 4／4 | 4 | 0 | 100% | 51.0%～100% | 達單版2/4門檻 |
| screen-06／v2.22 | 4／4 | 1 | 3 | 25% | 4.6%～69.9% | 未達單版2/4門檻 |
| confirm-06／v2.13 | 0／0 | 未執行 | 未執行 | — | — | not_run_gate_failed |
| confirm-06／v2.22 | 0／0 | 未執行 | 未執行 | — | — | not_run_gate_failed |

| Run ID | 版本 | 原生結果 | 結果時間（秒） | 最後HUD體型 |
|---|---|---|---:|---:|
| screen-06-01 | v2.13 | 勝利 | 132 | 199 |
| screen-06-02 | v2.22 | 死亡 | 124 | 171 |
| screen-06-03 | v2.13 | 勝利 | 141 | 179 |
| screen-06-04 | v2.22 | 死亡 | 119 | 157 |
| screen-06-05 | v2.13 | 勝利 | 121 | 185 |
| screen-06-06 | v2.22 | 死亡 | 89 | 105 |
| screen-06-07 | v2.13 | 勝利 | 120 | 186 |
| screen-06-08 | v2.22 | 勝利 | 149 | 199 |

勝利依可見結算與其結果時間判斷；結算時HUD可能仍為前一顯示值，表中179／185／186／199不代表把未達目標當勝利。v2.13勝利時間中位數126.5秒、範圍120～141秒；v2.22唯一勝利149秒。八局皆記錄keysReleased=true，9,959個decision均有compute紀錄，最大189.5ms，未超200ms限制；controllerEvents皆空。這些檢查支持記錄完整性，不足以把任何死亡歸因於單一辨識或避讓機制。

本次樣本未支持「同一策略在兩版均達預定≥50%」的確認目標。每版只有4局，自然隨機場次沒有共同seed，不能據此宣稱Grow18比Grow15更好或更差，也不能把合成檢查成功推成實戰效益。

## 單一策略差異

[planner.js](source/experiments/grow18/planner.js) 的函式名稱為 `planGrow18`。對照父版，唯一決策條件為：

```js
// Grow15
const hard = red || o.clipped || chance >= .45;
// Grow18
const hard = red || o.clipped || o.r >= playerLow * 1.08 || chance >= .45;
```

例如 v2.22 的 HUD182、NPC名義估計半徑200，既有尺寸誤差模型給區間186～200，致命門檻為181.5×1.08=196.02。舊 `chance=(200−196.02)/14≈.284`，使名義尺寸已超過致命門檻的本體仍成為 soft hazard；它只給風險扣分，沒有進入 hard clearance 與安全路徑篩選。Grow18 直接讓這類本體走原有 hard hazard 分支，使用既有硬性間距和權重。這不是新增一個經驗尺寸門檻，亦不是證明該尺寸估計是真值。

幾何辨識、geometry拒判後的fallback、紅點配對／尺寸界限、白點探索、HUD186免疫、路徑時長、成長收益、評分係數與追蹤都沿用 Grow15。更強避讓可能降低死亡，也可能繞遠、減少成長並增加截止；結果須由新批次衡量。名稱變更與以下數值診斷不參與選路：`hardThreats`、`softThreats`、`promotedLethalThreats`。三者計算的是現有範圍／數量篩選後的 local hazards。

本輪另完善記錄流程：選定目標的座標、速度、stalled/blocked、local hard/soft/promoted計數；啟動來源SHA核對；100ms獨立可見停止watchdog；2500ms保存逾時；未確認final保留待核對；server拒絕重複start/final。這些觀測和停止處理也在同一批次前凍結，沒有保存像素或讀取遊戲隱藏狀態。

## 事前實戰協議與判定

完整機器可讀協議：[manifest.json](source/experiments/grow18/manifest.json) 與 [protocol.json](source/experiments/grow18/protocol.json)，兩檔原byte相同。

| 階段 | v2.13 | v2.22 | 事前門檻 |
|---|---:|---:|---|
| `screen-06` | 4個新開局 | 4個新開局 | 每版須有完整4個唯一native finals，且各自至少2勝，才可進確認 |
| `confirm-06` | 12個新開局 | 12個新開局 | 同一凍結策略，各版各自至少6/12個150秒內可見勝利，並報樣本不確定度 |

兩階段均按v2.13、v2.22交錯順序，concurrency=1。階段、版本分開計分，不用screen混入confirmation，也不用跨版本合計掩蓋未達標版本。成功須本局可見 `You win` 結算與結果時間不大於02:30；結算期間HUD可能停在200以下，不能只憑最後HUD否定可見勝利。缺少可見結果時間的勝利標unknown。

到可見HUD elapsed>150（整數顯示通常151）時截止，先檢查結算；wall limit300000ms、單次compute上限200ms。控制器週期100ms。手動停止記controller_abort並釋放所有鍵。保存失敗或基礎設施中止保留紀錄與分母，不補跑、不替換、不靜默重啟同批次。已收到但回覆遺失的final不發第二個final；以runId核對原始與待確認紀錄。

每個開局都留在所屬版本／階段分母，勝利、死亡、截止、晚勝、基礎設施錯誤、中止及未知分別列出。確認的≥50%是這個預定樣本目標，須一併報Wilson95%區間；不代表長期保證或正式OCR4驗收。這個使用者指定批次只測v2.13與最新v2.22，沒有宣稱v2.20/v2.21已驗收。

執行環境依每個start的原生記錄為準。啟動核對為Linux桌機Chrome156、DPR1、outer viewport1363×936、遊戲canvas與iframe2000×1163，`navigator.hardwareConcurrency=9`。遊戲使用自然 `Math.random`，種子未知、未注入、未選擇；不同批次不是同seed配對試驗。手機未測。

## 來源與檔案

| 內容 | 入口 |
|---|---|
| 凍結的controller、perception、planner、遊戲隔離helper | [source/experiments/grow18](source/experiments/grow18/) |
| Grow15父planner（原byte） | [source/parent/grow15-planner.js](source/parent/grow15-planner.js) |
| 固定來源SHA-256、大小 | [source-checksums.json](source-checksums.json) |
| 整份封存SHA-256（自身除外） | [CHECKSUMS.sha256](CHECKSUMS.sha256) |
| 原兩版遊戲的既有repo依賴 | [game-source-dependencies.json](game-source-dependencies.json) |
| 70個純planner/釋鍵合約檢查 | [planner-regression-result.json](checks/planner-regression-result.json) |
| 25個停止、唯一final、保存故障合成檢查 | [harness-regression.json](checks/harness-regression.json) |
| 原建置核對與獨立review | [build-verification.json](checks/build-verification.json)、[preflight-review.json](checks/preflight-review.json) |
| 完整實戰結果的獨立唯讀審查 | [final-results-review.json](checks/final-results-review.json) |
| 乾淨還原與封存工具檢查 | [clean-reconstruction.json](checks/clean-reconstruction.json)、[publication-utilities.json](checks/publication-utilities.json) |
| 封存工具獨立唯讀review與資料範圍審查 | [publication-wrapper-review.json](checks/publication-wrapper-review.json)、[publication-audit.json](checks/publication-audit.json) |
| 本輪研究及完整舊80局數值背景 | [research-strategy.json](research/research-strategy.json)、[research-evidence.json](research/research-evidence.json) |
| 事後逐版／逐階段統計與獨立核對工具 | [summarize-round.mjs](tools/summarize-round.mjs)、[audit-round.py](tools/audit-round.py) |
| 完整本次實戰原件、統計與狀態 | [events.jsonl](results/events.jsonl)、[evaluation-summary.json](results/evaluation-summary.json)、[status.json](results/status.json) |

原始遊戲檔含既有SVG favicon，本目錄不重傳它們。兩檔與固定GitHub基底的 `src/game-v2.13.html` 和 `src/game.html` 完全相同；[materialize-game-sources.mjs](materialize-game-sources.mjs) 只讀現有repo檔，核對長度、SHA-256及Git blob後本地還原。來源錯誤或目的地已有不同內容會停止，不下載、不變更控制器。封存的 `index.html` 已由原isolation helper移除favicon，並檢查沒有實際圖片／影片payload。

原始來源、測試程式、研究JSON、manifest、freeze及舊檢查輸出均保持byte。`source/package.json` 與兩個根目錄重建工具是封存布局支援，不屬於planner策略改動。數值研究中的舊路徑是provenance；舊80局原始數值在同repo [Grow evaluation bundle](../grow-evaluation-20261125/bundle/results/)，不是Grow18的新結果。

## 從完整repo根目錄乾淨重建

需要Node24標準庫，無npm安裝。完整checkout必須包含本目錄及既有repo的兩個 `src/game*.html`。輸出目錄必須尚未存在：

```sh
node docs/ocr/repro/grow-18/rebuild-frozen.mjs --output /tmp/slime-grow18-repro --checks
```

[rebuild-frozen.mjs](rebuild-frozen.mjs) 先核對所有來源hash，再把原碼複製到新目錄、還原遊戲原件、執行原 `build-lab.mjs`，並核對所有freeze檔案和生成的page/manifest/protocol完全相同。它只在獨立Node**建置程序**固定manifest的 `createdAt`，因為原build會把此時間算入protocol hash。這個建置時鐘不會寫入遊戲或controller，不會傳給server或瀏覽器，也不會改遊戲計時、隨機種子或 `Math.random`。

`--checks` 在新目錄執行原70個planner檢查及25個harness檢查，將新檢查輸出保存在 `/tmp/slime-grow18-repro/reproduction-checks/`。`reconstruction-check.json` 記錄重建結果。省略 `--checks` 可只做來源與建置核對。這些命令不啟動瀏覽器、遊戲或server。

如要個別核對純檢查，從上面產生的新工作目錄執行：

```sh
cd /tmp/slime-grow18-repro
node experiments/grow18/planner.regression.mjs --baseline parent/grow15-planner.js --controller experiments/grow18/source-base.html
node experiments/grow18/harness-regression.mjs
```

後續另在允許的獨立環境進行新批次時，可從該新工作目錄啟動原server，再用瀏覽器開啟本機4173埠；不會自動按下開始：

```sh
node experiments/grow18/server.mjs
```

每次重驗須使用新輸出目錄，保留自己環境與批次紀錄，不能將新隨機結果覆寫這個凍結批次。原server會把numeric events寫到該工作目錄的 `experiments/grow18/results/events.jsonl`；不輸出影像。不要把本地生成輸出或還原遊戲原件加入這份封存。

產生原生數值log後，從repo根呼叫統計工具，明確傳入工作目錄與新的輸出檔：

```sh
node docs/ocr/repro/grow-18/tools/summarize-round.mjs /tmp/slime-grow18-repro/experiments/grow18 /tmp/grow18-summary.json
```

統計器只讀log、manifest與freeze，保留所有start，檢查來源、環境、按鍵釋放、重複身份及勝利時間；無結算資料時不會給出通過。它本身不是獨立的遊戲結果判定來源。這份封存保留完整結束後的raw log與統計；沒有從進行中log擷取部分勝局來填結果。

獨立審查工具另需Python3標準庫，完全不執行controller或主要統計器。完成上面的乾淨還原後，可直接對本封存原始log重新核對：

```sh
python3 docs/ocr/repro/grow-18/tools/audit-round.py /tmp/slime-grow18-repro/experiments/grow18 docs/ocr/repro/grow-18/results/events.jsonl --summary docs/ocr/repro/grow-18/results/evaluation-summary.json --out /tmp/grow18-independent-review.json
```

新review的產生時間與本機路徑會不同，原始raw hash、來源hash、逐局結果、分母與Wilson數值應一致；不得以新的產生時間改寫原封存證據。

## 已驗證與仍未知

70個純planner檢查證實名義半徑200/HUD180～185的hard分類與有限正clearance、門檻陰性／等號、免疫、舊版本對照及過期輸入釋鍵合約；18個promotion場景中10個第一段方向改變。25個harness檢查使用可控計時器、DOM替身與記憶體HTTP保存，沒有開啟網路socket。它們不等於真實瀏覽器排程、像素辨識或遊戲勝率。

現有geometry fallback和尺寸區間仍可能錯估；NPC外輪廓不是物理半徑，名義尺寸hard化不能修正所有漏辨識、遮擋或外框低估。後期反覆預測收益卻未成長的原因仍待驗證。舊80局只有部分每秒數值，沒有完整perception/planner state，不能用這份研究偽稱重播過自然局或確認致死NPC。來源相同及合成通過只支持可重建與所斷言的機制。

來源首次開局後不得修改；需要新程式時另建candidate與batch。本次完整實戰原件已追加到results，來源hash沒有隨結果改動。本目錄不包含圖片、影片、保存像素、私人影像或憑證，也不變更正式站、根目錄src、排行榜或資料庫。
