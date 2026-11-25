# Grow19：幾何拒判時提高外徑不確定度

本目錄保存凍結Grow19的完整重建材料、原始合成研究、測前檢查，以及已完成的screen-07全部8局原始數值紀錄與獨立審查。**v2.13為3/4勝；v2.22為2/4勝，另1局截止、1局因239.4ms計算逾時中止。** 雖然兩版觀察勝率皆至少50%，v2.22只有3個協議認可的遊戲結果，未滿每版4個native outcomes的事前門檻；screen gate未過，confirm-07未啟動。這份封存不構成確認通過或正式OCR4驗收。

- Repository：gg-dot1980/slime；權威測試分支：test/ocr-test。
- 權威基底：46b8aa3f8207ed03bc89c84c6ed896a23bcd5601；凍結manifest記錄的publication parent：0f450e7682c2ac97181e1dae9fd35f67c1454e1d。
- 策略父版本：凍結Grow15，planner SHA-256 e89d6a8cb0201a8caf0314c023e16f37f63396dd44615bf4dcdc823077e0fd0e。
- Grow19 planner SHA-256：b75c18be0d2444e3113bcd1fec302cca86ea7bc60844773b1a8511a19e7c4ee8。
- 固定protocol：6164d5b844b777019450774e81702f933817dce7a0c561da117ef47a0b7e3da1。
- [freeze.json](source/experiments/grow19/freeze.json) 記錄台北2026-11-25 14:42:23.897326凍結（原UTC06:42:23.897326），當時starts=0。該批次的來源身份之後不變。

## 唯一策略改動

[planner.js](source/experiments/grow19/planner.js) 使用planGrow19／grow-19命名。在父Grow15原有clipped擴張與v2.22的200 cap之前，只新增：

~~~js
if (cappedGame && o.geometryAccepted === 0 && finite(o.visualR) && o.visualR > 0)
  upper = Math.max(upper, (o.visualR + 6) / .808);
~~~

作用範圍是 **v2.22、geometry明確拒判為0的NPC、所有HUD階段**，包含HUD186之後。v2.13、接受geometry的NPC、普通食物不受此條件影響。它提高供既有吞食／風險判斷使用的尺寸上界；中心、名義半徑、速度、追蹤、路徑收益、白點探索、紅點配對、免疫條件與hard／soft公式沿用Grow15。

Grow19的策略父版是Grow15，**沒有加入Grow18的名義致命尺寸hard化條件**。原來的chance≥.45分類仍在；例如名義半徑200、HUD180～185時，原soft hazard限制仍可存在。新的尺寸餘裕不會自動解決每一種危險低估。

唯一額外數值診斷boundAdjustedCount不參與決策。它計算去重後NPC中，新增floor在原clipped擴張與200 cap之後仍實際提高upper的數量；計數在紅點配對／紅點擴張與local hazards範圍、數量篩選之前。後續紅點擴張可能抹平兩版upper差異，因此此計數不是最後hard hazards數、獨立NPC數、避免死亡數或收益。

## 幾何根據、合成反例與代價

遊戲的完整連續外輪廓中，角度0與π的兩個頂點都乘1.01×wobble；其左右跨度內的奇數諧波項互相抵消。完整外框的半寬因此至少為1.01×0.8×R=.808R。**這個關係以完整、未遮擋的連續輪廓為前提。**

目前components可能只看到遮擋後的一塊連通色區。clipped=false、看得到label或通過density／aspect檢查，皆不能證明外輪廓完整。+6取自固定2000寬、ratio1、step3感知的兩格餘量，是明列的政策heuristic，並非通用取樣誤差、抗鋸齒或遮擋保證。因此本版本把它當作不確定度政策，不宣稱是每個真實NPC的物理半徑上界。

原始合成研究及候選回歸都保留正例和代價：

| 固定合成條件 | 父Grow15 | 新floor | 可支持的結論 |
|---|---|---|---|
| 真R96、wobble .8、缺失／半個亮斑、HUD100 | geometry拒判後誤列可吃 | 改列中性 | 這組可見估計下可移除錯誤meal；100仍小於1.08×96 |
| 真R120、半個亮斑、HUD100 | 可錯列中性 | 改列hard hazard | 這組fixture的尺寸區間會改變分類 |
| 真R40、wobble1.15、缺亮斑、HUD60 | 合法可吃目標 | 改列soft hazard | 額外保守度也可能放棄有效食物，拖慢成長 |

這些是固定算法fixture，不是截取的真實遊戲畫面。合成真半徑只用來標示預期分類；planner只接收從fixture像素推得的數值與HUD。不能把合成改善推成實戰存活率或勝率改善。

原始研究用固定x=260隔離分類行為，其中真R200的案例不能當成可存活接近情境。候選的正式regression另以x=320／400／500驗證相同原有分類，並檢查起點在物理接觸距離之外。舊研究保持原byte，限制不因後來候選測試而抹去。

## 啟動證據與歷史快照

[activation-verification.json](source/experiments/grow19/activation-verification.json) 記錄：Grow18已完成8個原生screen finals，v2.13為4/4勝、v2.22為1/4勝，未達雙版各2/4的事前門檻，且未啟動confirm-06。這滿足19的事前啟動條件。Grow18完整原件另存於 [Grow18封存](../grow-18/)；不把它的場次算入Grow19。

root於台北14:37:54.590332核對最新支援版本仍為v2.22，兩個game source hash保持一致；原證據保存在 [deployed-game-verification.json](source/experiments/grow19/deployed-game-verification.json)。台北14:41:46.695388完成activation核對，之後才寫freeze。所有原UTC時間均保留於JSON。

獨立 [preflight-review.json](checks/preflight-review.json) 原始review時間為台北14:42:26.280，後續supporting review更新時間為14:44:17.633599。此文件最終SHA為2bbadb7ef6195398593d07246e3d0242885fa82caaae1e01c2121f5c83a5011f；不把後續落檔時間隱藏成更早。

[standby-inventory.json](history/standby-inventory.json)、[NOTES-standby.md](history/NOTES-standby.md)、研究與regression報告中的inactive／standby／未啟動描述，是**建立當時的歷史狀態**。它們保持原byte，不用來判斷現時是否啟動。manifest內的待核對條件也保持凍結內容，實際完成證據由activation和freeze另行記錄。

standby inventory於台北14:40:41建立，不是batch freeze。root在freeze前於14:41:46.348重跑verify-build，build-verification.json時間與hash因此更新。核對結果是原清單22檔相同、只有這份非core檢查輸出不同，見 [standby-history-comparison.json](checks/standby-history-comparison.json)。不能宣稱舊standby清單中每個非core輸出仍是現在的hash；目前來源身份以freeze及source-checksums為準。

## 事前實戰協議

完整固定協議：[manifest.json](source/experiments/grow19/manifest.json) 與 [protocol.json](source/experiments/grow19/protocol.json)，兩者byte相同。

| 階段 | v2.13 | v2.22 | 事前門檻 |
|---|---:|---:|---|
| screen-07 | 4個新開局 | 4個新開局 | 每版完整4個唯一native finals且各至少2勝，才進確認 |
| confirm-07 | 12個新開局 | 12個新開局 | 同一凍結來源，兩版各至少6/12個150秒內可見勝利，分別報Wilson95% |

兩階段均v2.13、v2.22交錯，concurrency=1。screen不混入confirmation，兩版本分開計分。成功須本局可見You win與結果Play time≤02:30；HUD在結算時可能停留在前次顯示值，勝利判定不能只看最後HUD。

可見HUD elapsed>150（整數顯示通常151）時截止，先查結算；wall limit300000ms，單次compute上限200ms，決策週期100ms。原100ms獨立停止watchdog、2500ms保存timeout、釋鍵、唯一start／final與保存未確認處理沿用已核對template。

所有start保留在所屬版本、階段分母；死亡、截止、晚勝、基礎設施錯誤、中止、未知分開列出，不補跑、不替換、不靜默重啟批次。≥50%是預定觀察樣本目標，並非長期保證，也不是正式OCR4或四版本驗收。

固定遊戲canvas／iframe2000×1163、DPR1；實際Chrome／Linux、outer viewport、hardwareConcurrency與foreground狀態依每個start的原生記錄為準。遊戲使用自然Math.random，種子未知、未注入或挑選，批次之間不是同seed配對試驗。本輪只評估v2.13與目前v2.22；v2.20、v2.21與手機沒有新增驗收結論。

## 完整screen-07結果與計算逾時

批次於台北2026-11-25 14:42:48.483開始、15:00:49.242結束；原JSON保留UTC。原始檔共235筆、1,394,519 bytes，SHA-256 `6917cac99395ae97690a3a634f171de656c884bcb932f6af499e4237b970331e`。全部8個start各有唯一final，全部確認釋鍵，沒有排除、替換、補跑或尚未結束的局。

| 版本 | 已開始／final rows | 協議認可遊戲結果 | 150秒內勝利 | 截止 | 控制器中止 | 全分母觀察勝率 | Wilson 95% | 勝利Play time |
|---|---:|---:|---:|---:|---:|---:|---|---|
| v2.13 | 4／4 | 4 | 3 | 1 | 0 | 75% | 30.1%–95.4% | 124、138、130秒；中位130秒 |
| v2.22 | 4／4 | 3 | 2 | 1 | 1 | 50% | 15.0%–85.0% | 144、109秒；中位126.5秒 |

final row表示harness已完成並記錄該次嘗試；native outcome在本協議中只計可見勝利、晚勝、死亡或可見截止。控制器中止有final row，但不符合screen gate所需的遊戲結果。該次仍留在v2.22的4局分母，不能改報2/3。

| Run ID | 版本 | 結果 | 結算Play time | 非結算停止時的HUD elapsed | 最後HUD size | 最大計算ms（含overrun） |
|---|---|---|---:|---:|---:|---:|
| screen-07-01 | v2.13 | win_le150 | 124秒 | — | 185 | 125.0 |
| screen-07-02 | v2.22 | win_le150 | 144秒 | — | 193 | 115.5 |
| screen-07-03 | v2.13 | win_le150 | 138秒 | — | 192 | 71.0 |
| screen-07-04 | v2.22 | deadline_cutoff | — | 151秒 | 184 | 88.0 |
| screen-07-05 | v2.13 | deadline_cutoff | — | 151秒 | 189 | 161.5 |
| screen-07-06 | v2.22 | controller_abort | — | 108秒 | 116 | **239.4** |
| screen-07-07 | v2.13 | win_le150 | 130秒 | — | 198 | 149.7 |
| screen-07-08 | v2.22 | win_le150 | 109秒 | — | 200 | 138.5 |

勝利的證據是可見You win、You reached size 200 and survived!及結算Play time；最後HUD可能停留在較早值，不用HUD低於200否定可見勝利。截止的151秒與中止的108秒都是當時可見HUD elapsed，沒有冒充結算時間。

screen-07-06的controllerEvents記錄elapsedCompute=239.39999999850988ms，超過固定200ms預算；harness記錄「計算逾時，已釋放控制並暫停」，keysReleased=true。凍結tick在發出compute_overrun後立即return，尚未執行ocrTestRecord，所以這次耗時不在一般computeMs陣列。只取正常陣列會把該局最大值誤當110.6ms、整批誤當161.5ms。

| 版本 | 正常完成計算數 | 額外overrun事件 | 含overrun的median／p95／p99／max（ms） | 200ms計算預算 |
|---|---:|---:|---|---|
| v2.13 | 5,433 | 0 | 17.4／30.3／63.7／161.5 | 觀測皆符合 |
| v2.22 | 5,121 | 1 | 17.6／29.4／62.6／239.4 | **未達** |

這次中止是完整保留的失敗結果；來源與紀錄完整性審查通過，不表示效能預算通過。全批共有10,555筆已記錄計算耗時（包含那1筆中止計算），最大239.4ms。

新診斷boundAdjustedCount在v2.13為0/544個保存sample，v2.22為70/514個保存sample（13.6%）。v2.22四局依序為29/145、12/151、16/108、13/110個sample有調整，單個sample最大2個去重NPC。這是約1Hz數值觀測，不能當成每次決策、獨立NPC、曝光秒數、死亡避免數或勝率改善。

兩版confirm-07皆為0/12個已開始，結果與勝率為null／未執行。screen觀察勝率碰到50%不覆寫事前完整性門檻，也不把screen局混入confirmation。每組僅4局、自然亂數未配對，沒有新策略優於父版或Grow18的因果結論。

[原摘要](results/evaluation-summary.json)保持root產出時的完整bytes。其maxComputeMs只摘要正常computeMs陣列，promotedSamples是沿用前輪的欄位，不代表Grow19的boundAdjustedCount。本節效能、boundAdjusted與原始結算文字核對以[獨立final review](checks/final-results-review.json)為準；該review與原摘要的全分母、結果分類、Wilson區間與gate沒有差異。

## 封存布局與完整依賴

| 內容 | 入口 |
|---|---|
| 凍結19來源、activation、freeze及原檢查程式 | [source/experiments/grow19](source/experiments/grow19/) |
| regression所需的15父planner／base／geometry | [source/experiments/grow15/frozen/screen-03](source/experiments/grow15/frozen/screen-03/) |
| 原固定fixture生成器 | [geometry.synthetic.cjs](source/experiments/grow15/geometry.synthetic.cjs) |
| 所有重建與測試輸入的hash | [source-checksums.json](source-checksums.json) |
| 原兩版game的既有repo依賴 | [game-source-dependencies.json](game-source-dependencies.json) |
| 研究script相對路徑的完整還原mapping | [research-inputs.json](research-inputs.json) |
| 候選115 cases／364 assertions | [regression-result.json](checks/regression-result.json)、[原六檔乾淨核對](checks/clean-regression-verification.json) |
| 原25個harness與46個建置核對 | [harness-regression.json](checks/harness-regression.json)、[build-verification.json](checks/build-verification.json) |
| 本封存的完整乾淨重建核對 | [clean-reconstruction.json](checks/clean-reconstruction.json) |
| 封存來源、資料範圍與媒體審查 | [publication-audit.json](checks/publication-audit.json) |
| 封存工具與研究依賴的獨立唯讀核對 | [publication-wrapper-review.json](checks/publication-wrapper-review.json) |
| 原研究script、98 cases／105 assertions與歷史說明 | [check-perception.cjs](research/check-perception.cjs)、[research-perception.json](research/research-perception.json)、[README-original.md](research/README-original.md) |
| 本輪實戰封存狀態 | [results/status.json](results/status.json) |
| 全部235筆原始數值事件 | [results/events.jsonl](results/events.jsonl) |
| 原8局完整摘要 | [results/evaluation-summary.json](results/evaluation-summary.json) |
| 獨立逐局、hash、釋鍵、分母與overrun核對 | [checks/final-results-review.json](checks/final-results-review.json) |
| 可重跑的獨立唯讀審查程式 | [tools/audit-round19.py](tools/audit-round19.py) |

regression只需另外四個15檔案，不帶15的game、index或server。原research script另讀8個檔案；mapping共用既有base／planner／geometry／fixture，僅額外保存15的build來源與17的既有數值診斷。該15 build檔在研究中只讀取與hash，不執行。研究內容與舊數值仍不是Grow19的新實戰結果。

兩個raw game含既有SVG favicon，本目錄不重傳；[materialize-game-sources.mjs](materialize-game-sources.mjs) 只從固定repo基底的src/game-v2.13.html、src/game.html核對長度、SHA-256及Git blob後在新工作目錄還原。來源不符或目的地有異檔即停止，不下載、不更改遊戲程式。凍結index由原isolation helper移除favicon，沒有圖片／影片payload。

## 從repo根目錄乾淨重建

需要Node24標準庫，無npm安裝。checkout須包含本目錄及既有repo的兩個game檔。輸出目錄必須尚未存在：

~~~sh
node docs/ocr/repro/grow-19/rebuild-frozen.mjs --output /tmp/slime-grow19-repro --checks
~~~

[rebuild-frozen.mjs](rebuild-frozen.mjs) 先核對26個來源與測試輸入，在新目錄還原兩版遊戲與research原相對layout，執行原19 build，再核對全部15個freeze檔。已驗證其page／manifest／protocol與凍結版本逐byte相同。

原build會把createdAt算入protocol hash。wrapper只對獨立Node **建置子程序**固定原時間2026-11-25T06:40:16.844Z；該preload不進入HTML、server、瀏覽器或controller，不改遊戲時鐘、輸入時間、隨機種子或Math.random。

--checks重新執行既有115個planner cases／364 assertions、25個harness案例、46個建置檢查，以及原研究98個planner cases／105 assertions。這些檢查彼此有共用fixture，不能把數目加總成獨立實驗樣本。新輸出放在/tmp/slime-grow19-repro/reproduction-checks/，原封存輸出不變；省略--checks可只核對來源與建置。

原verify-build.mjs專為standby時期設計，會拒絕同目錄存在freeze或event log。因此wrapper在新的獨立reproduction-checks/standby-build/副本執行它，不移除完整重建目錄的freeze，不觸碰活躍批次。新報告時間、Node／平台資訊及research的sourceRoot可不同；機制、數值輸出、input hashes與所有斷言必須一致，不要求歷史研究JSON整份byte相同。

重建之後，用Python 3標準庫重核這批已封存事件。auditor需要兩版raw game才能核對全部15個freeze檔，因此指向上面完整重建目錄；直接對省略raw game的staging source執行並不完整。

~~~sh
python3 docs/ocr/repro/grow-19/tools/audit-round19.py \
  /tmp/slime-grow19-repro/experiments/grow19 \
  docs/ocr/repro/grow-19/results/events.jsonl \
  --summary docs/ocr/repro/grow-19/results/evaluation-summary.json \
  --out /tmp/slime-grow19-audit.json
~~~

此審查只讀來源、freeze與完整raw，獨立重算可見結果、分母、Wilson、執行順序、釋鍵、boundAdjusted與含overrun計算分布；不import或執行候選、遊戲或原摘要工具。退出碼0表示證據完整性通過；screenGatePassed=false和performance.metByAllObservedComputations=false仍是本批次的失敗結果。新review的時間、路徑會不同，數值與source/raw hashes應相同。

上述命令不啟動遊戲、瀏覽器或server。若在另行允許的獨立環境進行新批次，可從新工作目錄手動啟動原server：

~~~sh
cd /tmp/slime-grow19-repro
node experiments/grow19/server.mjs
~~~

之後用瀏覽器開本機4173埠；server不會自動按開始。每次重驗使用新目錄，保留自己的來源、環境與原始數值，不把新的自然隨機結果覆寫本批次。不要上傳還原的raw game或本地生成輸出。

## 證據限制

合成fixture不包含真實瀏覽器的完整polygon／字型／抗鋸齒、遮擋組合與動態行為。原history沒有完整object frame、像素或穩定target identity，不能重播自然局、確認某個NPC不可吃，或定位致死物件。新的floor可能少選錯誤meal，也可能放棄真正可吃目標，甚至拖慢成長；存活與達標率都須看新批次完整結果。

這份封存不含圖片、影片、保存像素、私人影像或憑證，不修改正式站、root/src、排行榜或資料庫。來源首次開局後保持不變；這次只追加完整實戰原件、摘要及獨立review，26項source-checksums保持原byte。更新結果不能更改凍結來源。
