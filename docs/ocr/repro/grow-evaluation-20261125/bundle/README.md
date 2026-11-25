# OCR Grow：2026-11-25 有界實戰探索與完整確認

本 repro 以原目標「在遊戲畫面顯示的 150 秒內達到體型 200，v2.13 與本輪開始時查得的最新版 v2.22 分別至少 50%」重新探索策略。[公開版本回應紀錄](results/live-version-verification.json) 保存本輪開始時對 `/api/versions` 的成功查核，`currentVersion=v2.22`；結束時的[再次讀取紀錄](results/final-version-read-attempt.json)為 HTTP 403，因此沒有完成末次即時版本複核。實測兩版始終由隨包來源與 manifest hash 固定，重跑不自動追隨後續改版。

**本輪全部既定測試已完成，原來的雙版本目標未達成。** grow-15 在 v2.13 的獨立確認為 **11/12（91.7%）**，達到本輪觀察比例要求；v2.22 的最高確認結果為 grow-15、grow-16 各 **5/12（41.7%）**，grow-17 為 **3/12（25.0%）**，都少於事前要求的 6/12。最後一批於 **2026-11-25 12:05:07.093 臺灣時間**正常結束。

五組探索共 **32 個 start**，三批獨立確認共 **48 個全新 start**，合計 **80 次開局**。證據為 **78 個原生 final、2 個保留分母的審查分類基礎設施失敗**；全部原定邏輯位置已開局，審查後沒有進行中或未知結果。兩次基礎設施失敗都來自 grow-14 探索，未補造原生 final；三批確認皆完整結束。以下結果可由 [evaluation-summary.json](results/evaluation-summary.json) 與逐局原始事件重算。

### 完整獨立確認結果

| 批次／候選 | 遊戲版本 | 成功／全部開局 | 觀察比例 | 死亡 | 到時停止 | Wilson 95% 區間 | 成功局時間中位數 | 本輪比例門檻 |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- |
| `confirm-03`／grow-15 | v2.13 | **11/12** | **91.7%** | 0 | 1 | 64.6%–98.5% | 130 秒 | 達到 ≥6/12 |
| `confirm-03`／grow-15 | v2.22 | **5/12** | **41.7%** | 4 | 3 | 19.3%–68.0% | 117 秒 | 未達到 |
| `confirm-04`／grow-16 | v2.22 | **5/12** | **41.7%** | 6 | 1 | 19.3%–68.0% | 125 秒 | 未達到 |
| `confirm-05`／grow-17 | v2.22 | **3/12** | **25.0%** | 6 | 3 | 8.9%–53.2% | 144 秒 | 未達到 |

探索資料未加入確認分母；grow-16／17 沒有新的 v2.13 樣本，v2.13 的 11/12 始終歸屬 grow-15 的 `confirm-03`。Wilson 區間呈現各批有限樣本的不確定性，沒有對連續候選選擇作多重比較校正；觀察到 50% 的門檻也不等於證明長期成功機率至少 50%。不同候選是自然隨機新局，這些比例不能單獨證明候選的因果優劣，兩個 5/12 也不證明策略等效。

### 五組探索與篩選去向

| 邏輯批次 | 候選 | v2.13 成功／開局 | v2.22 成功／開局 | 全批開局 | 後續 |
| --- | --- | --- | --- | ---: | --- |
| `screen-01` | grow-13；另含 grow-12 對照 | grow-13：1/2；grow-12：0/2 | grow-13：0/2；grow-12：0/2 | 8 | 未通過雙版本篩選，未開始確認。 |
| `screen-02`（含 recovery） | grow-14 | 2/4 | 1/4，包含 2 次基礎設施失敗 | 8 | 未通過雙版本篩選，未開始確認。 |
| `screen-03` | grow-15 | 4/4 | 3/4 | 8 | 通過篩選，完成各版 12 局確認。 |
| `screen-04` | grow-16 | 未新增樣本 | 2/4 | 4 | 通過篩選，完成 v2.22 的 12 局確認。 |
| `screen-05` | grow-17 | 未新增樣本 | 2/4 | 4 | 通過篩選，完成 v2.22 的 12 局確認。 |

### 確認階段的計算耗時

| 候選／版本 | 完整決策筆數 | median | p95 | p99 | max |
| --- | ---: | ---: | ---: | ---: | ---: |
| grow-15／v2.13 | 15,773 | 16.6 ms | 26.7 ms | 47.1 ms | 113.2 ms |
| grow-15／v2.22 | 14,634 | 17.6 ms | 28.2 ms | 49.1 ms | 99.7 ms |
| grow-16／v2.22 | 14,739 | 17.5 ms | 28.3 ms | 52.5 ms | 121.9 ms |
| grow-17／v2.22 | 13,651 | 17.4 ms | 29.2 ms | 51.2 ms | 128.0 ms |

耗時取自各原生 final 的完整 `computeMs`，不重複加入 progress 取樣；48 個確認 final 都完成釋鍵、沒有控制器事件，決策筆數與耗時陣列一致，所有值有限且低於 200 ms。這些是本機辨識／規劃的量測，成功時間仍採遊戲可見結算。本輪候選未部署至公開 `/ocr-grow`。

**交付形式為完整的私有可下載 repro 包，包含本機來源與測試結果；GitHub 同步待使用者明確授權。** 文件基準為 [`46b8aa3f8207ed03bc89c84c6ed896a23bcd5601`](https://github.com/gg-dot1980/slime/tree/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601)。策略與遊戲來自 Sites checkout 的來源 commit `14c1815351b32096b325e032331b90c1f7873159`；未確認該 commit 位於 GitHub，來源證據以本包 `source/` 檔案與 hash 為準。這些識別不表示本輪新資料已提交；本資料不修改公開 `/ocr-grow` 路由。

外部存放狀態：原擬使用 `feat/grow-evaluation-20261125` 向 `test/ocr-test` 提 Draft PR，但 GitHub 的自動核准審查拒絕了建立 `build-lab.mjs` blob 的操作，理由是測試授權尚未明確涵蓋向 GitHub 披露新的站點／控制器來源。因此已停止上傳，未改用其他工具繞過。該分支僅建立於文件基準 `46b8aa3…`，沒有本輪新來源或測試資料的 commit，也沒有 Draft PR；僅先前一個未被 commit 引用的 `package.json` blob 已建立。本輪測試已在本機完成，私有套件保留來源與結果。

## 1. 證據與檔案

| 檔案 | 用途與狀態 |
| --- | --- |
| [screen-01-events-noimages.jsonl](results/screen-01-events-noimages.jsonl) | 完整首批 240 筆事件；8 個 planned slots、8 個 start、8 個 final、正常 batch_end；含所有成功、死亡與到時停止。 |
| [screen-01-summary.json](results/screen-01-summary.json) | 由上述原始事件重新產生；獨立重算與封存 JSON 相同，`integrity.ok=true`。 |
| [screen-02-events-noimages.jsonl](results/screen-02-events-noimages.jsonl) | 原始 177 筆事件：6 個 start、5 個 final；沒有補造第 06 局 final。 |
| [screen-02-reviewer-sidecar.json](results/screen-02-reviewer-sidecar.json) | 獨立審查註記：原始 log 核對、第 06 局基礎設施失敗分類、原第 07／08 局續測對映。不是 harness 事件。 |
| [screen-02-recovery-events-noimages.jsonl](results/screen-02-recovery-events-noimages.jsonl) | 續測原第 07／08 局的 53 筆原始事件：2 個 start、1 個 final；第二局失去瀏覽器畫面後未保存 final。 |
| [screen-02-recovery-reviewer-sidecar.json](results/screen-02-recovery-reviewer-sidecar.json) | 第二次中斷的獨立註記；明確區分「preview 仍運行、瀏覽器視窗消失」與首次服務停止。 |
| [screen-03-events-noimages.jsonl](results/screen-03-events-noimages.jsonl) | grow-15 共 909 筆原始事件：探索完整 237 筆、確認完整 672 筆；確認 24 個 start、24 個 final、正常 batch_end。 |
| [screen-04-events-noimages.jsonl](results/screen-04-events-noimages.jsonl) | grow-16 共435筆原始事件：完整探索107筆、完整確認328筆；確認12個start、12個final、正常batch_end。 |
| [screen-05-events-noimages.jsonl](results/screen-05-events-noimages.jsonl) | grow-17 共 414 筆原始事件：完整探索 108 筆、完整確認 306 筆；確認 12 個 start、12 個 final、正常 batch_end。 |
| [evaluation-summary.json](results/evaluation-summary.json) | 完整候選／版本／phase 統計，含位置對映與全部 start 分母；共 80 個 start、78 個原生 final、2 個審查分類 infra，無進行中或未開局位置。三批確認都未達各自整批目標。 |
| [raw-native-summary.json](results/raw-native-summary.json) | 只讀原始事件、不套審查註記的統計；兩個歷史 grow-14 run 因缺少原生 final 保留為 in_progress。這是原始證據缺口，不表示現在仍有遊戲運行；審查後結果見前項與 sidecar。 |
| [summarize-evaluation.mjs](results/summarize-evaluation.mjs) | 可重跑的證據彙整器；核對 sidecar 綁定的原始 hash、全部 starts、唯一位置對映及確認門檻；按 manifest 的實際版本清單處理雙版本與單版本批次。 |
| [grow15-confirm-03-04-diagnostic.json](results/grow15-confirm-03-04-diagnostic.json) | 確認第 04 局死亡前最後 15 筆數值 sample 與有限推論；不識別真正吞食者或精確致死決策，不改變 death 分類。 |
| [grow15-late-v22-diagnostic.json](results/grow15-late-v22-diagnostic.json) | v2.22 後期到時停止與已完成成功局的描述性比較；資源／目標數量均為辨識結果，沒有因果證明。 |
| [grow13 manifest](source/experiments/grow13/manifest.json)、[grow14 manifest](source/experiments/grow14/manifest.json) | 開局前凍結的來源、遊戲、頁面、批次順序與確認條件。 |
| [grow15 manifest](source/experiments/grow15/manifest.json)、[grow16 manifest](source/experiments/grow16/manifest.json) | 已完成 grow-15 及後續 grow-16 的固定來源與 protocol；grow-16 明列僅測 v2.22。 |
| [grow16-activation-verification.json](results/grow16-activation-verification.json) | 操作者的啟用檢查；綁定完整 grow-15 原始檔 hash，核對 v2.22 已有 12 個 final 且僅 5 勝。不是遊戲 start 或 final。 |
| [grow16-confirmation-gate-verification.json](results/grow16-confirmation-gate-verification.json) | 綁定 grow-16 完整探索 hash，核對 4 個原生 final、2 勝、來源及釋鍵；不是確認階段 start。 |
| [grow16-clean-build-verification.json](results/grow16-clean-build-verification.json) | 乾淨副本重建證明；pageHash 完全相同，manifest 只有 createdAt／protocolHash 因重建更新。 |
| [grow17 manifest](source/experiments/grow17/manifest.json)、[啟用檢查](source/experiments/grow17/activation-verification.json) | 固定grow-17單版本計畫；啟用檢查綁定已完成grow-16原始檔，確認12個原生final且僅5勝。不是新遊戲事件。 |
| [grow17-clean-build-verification.json](results/grow17-clean-build-verification.json) | 乾淨副本重建及38個純planner案例；來源頁hash相同，沒有實跑遊戲。 |
| [grow17-confirmation-gate-verification.json](results/grow17-confirmation-gate-verification.json) | 綁定完整探索hash，核對4個唯一原生final、2勝、來源及釋鍵；不是確認start。 |
| [grow17-late-cutoff-diagnostic.json](results/grow17-late-cutoff-diagnostic.json) | 第04確認局HUD195停滯的有界數值診斷；來源前綴及final payload可核對，預測接觸／gain與可見成長的落差沒有被當成因果證明。 |
| [原頁面](source/src/ocr-grow.html)、[v2.13 遊戲](source/src/game-v2.13.html)、[v2.22 遊戲](source/src/game.html) | 重建測試頁面的完整固定來源。 |
| [遊戲隔離建置](source/scripts/grow-games.mjs) | 兩版本使用相同隔離方式；下文說明可見小地圖相容層。 |
| [grow13 planner](source/experiments/grow13/planner.js)、[grow14 planner](source/experiments/grow14/planner.js) | 候選策略。 |
| [grow13 harness](source/experiments/grow13/harness.js)、[grow14 harness](source/experiments/grow14/harness.js) | 頁內批次、可見開始／結算讀取、停止與數值紀錄。 |
| [統計器](source/experiments/grow13/summarize.mjs) | 本輪各批共用；按 batch、version、strategy 分組，保留全部 start 分母。 |
| [小地圖受控 fixture](source/experiments/grow13/check-minimap-next.cjs) | 純 Node 合成像素回歸；不是實戰過關證據。 |

適用規範固定連結：[SPEC](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/SPEC.md)、[TESTING](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/TESTING.md)、[GITHUB-STORAGE](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/GITHUB-STORAGE.md)、[TEST-HANDOFF](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/docs/ocr/TEST-HANDOFF.md)。本輪依目前任務縮小到兩個版本；其他版本、手機環境及正式發布驗收未涵蓋。

## 2. 可見輸入與實測環境

控制器只讀遊戲已繪製的 canvas 像素、可見 HUD 文字與可見按鈕／結算。物件位置、半徑區間、速度、白點／紅點、可吞食候選及目標收益都是由畫面推導的估計。版本選擇與固定遊戲規則常數可供規劃使用；沒有讀取本局 `player`、`slimes`、內部 elapsed、碰撞狀態或隱藏座標。未啟用 `OBSERVE`、`window.__dbg` 或 oracle。批次 harness 只切換可見版本／策略選單、按開始與停止、讀可見 HUD／結算，以及收集控制器的數值診斷；輸入仍由方向鍵與 Space 加速送入遊戲。

| 項目 | 本輪固定值／實測值 |
| --- | --- |
| 瀏覽器 | 有視窗 Chromium；user agent `Chrome/156.0.0.0`，Linux x86_64；以原生桌面介面啟動批次。 |
| 作業系統／重跑工具 | Linux kernel `6.18.57`；Node `v24.22.3`。 |
| 外層頁面 viewport | grow-12／13／14 與 grow-14 續測為 `1363 × 936`；恢復瀏覽器後的 grow-15／16／17 為 `1050 × 917`。紀錄的是 `innerWidth × innerHeight`。 |
| 遊戲 iframe／canvas | iframe、canvas backing store 與 canvas CSS 尺寸皆為 `2000 × 1163`；DPR `1`。 |
| 螢幕排版 | grow-12／13／14 的 iframe CSS scale 為 `0.479`；grow-15／16／17 為 `0.3225`。兩者遊戲 iframe／canvas／canvas CSS 尺寸仍為 `2000 × 1163`，DPR1；不能稱所有外層 viewport 相同。 |
| 排程 | 單局、單前景頁面、`concurrency=1`；不並行跑遊戲。每次 start 均記錄 `visibility`。 |
| 語言／時區 | `en-US`；瀏覽器時區 `UTC`。本文日期時間另標臺灣時間 UTC+8；原始事件為 UTC ISO 時間。 |
| 硬體提示 | `navigator.hardwareConcurrency=9`；此值不能替代完整實體 CPU 型號。 |
| 隨機性 | 自然 `Math.random`，seed 未知、未固定、未注入；不同局不能視為相同地圖／相同 RNG 的配對試驗。 |
| 控制頻率 | grow-12 約 200 ms 一次；grow-13／14／15／16／17 約 100 ms 一次；實際頻率含辨識、規劃與瀏覽器排程成本。 |
| 計算上限 | 單次辨識／規劃逾 200 ms 時停止並釋放按鍵，另記 `compute_overrun`；這類中止保留在分母。 |
| 單局牆鐘保護 | 300 秒；手動停止、失去控制器活動與基礎設施錯誤另有明確結果分類。 |

上述遊戲是 Grow 的隔離副本。隔離程式停用排行榜與網路持久化，並沿用 Grow 已有的小地圖可見相容層：鏡頭框改中性色、先畫鏡頭框再畫 NPC 標記。此層沒有新增不可見標記，也沒有改物理、成長、碰撞或過關判定。grow-12／13／14／15／16／17使用相同的隔離遊戲hash；grow-16／17本批僅實跑v2.22。因此不能把本測試環境直接等同於所有公開頁面或所有viewport。

## 3. 成功、時間、分母與停止規則

**主指標是每個遊戲版本分別計算的 `win_le150 / 所有已記錄 start 嘗試`。** 不能合併 v2.13 與 v2.22 來補足門檻；探索與確認也不混算。

1. 必須讀到可見的成功結算標題（本批為 `You win!`）及結算內的 `Play time MM:SS`，且顯示時間不超過 `02:30`，才算 `win_le150`。結算文字明示 reached size 200，才是該局達標的證據；HUD 四捨五入或最後一次更新不能單獨代替成功結算。
2. 可見 HUD 的剩餘時間換算為 `elapsedVisible = 300 - 剩餘秒數`。若尚未開始結算、讀到 `elapsedVisible > 150`，停止並記為 `deadline_cutoff`；目前這類 final 都讀到 151。其體型是「到時停止時觀察到的體型」，不能改稱精確第 150 秒的體型。
3. 若畫面已進入結算動畫，先等待可見結算內容，再按該結算的遊玩時間判定；等待仍受手動 halt 與 300 秒牆鐘上限限制。`wallMs` 包含結算動畫及編排開銷，不拿它代替遊戲顯示時間。
4. 畫面時間只有秒級解析度，HUD 與結算也可能有一秒差。`≤150` 指本凍結 protocol 的顯示秒級判定，不能推成精確毫秒 `≤150000` 的證明。若未來出現恰為 `02:30` 的結算，應保留這項邊界限制。
5. 死亡、到時停止、晚到成功、計算逾時、手動中止、基礎設施錯誤、未知結果與未完成局均不可刪除或用重跑取代。統計器以所有記錄到的 start 為分母，並分開列出可見開始確認、final 完成數與各失敗原因；進行中的比例只是 provisional。未開始的 planned slot 保留為未完成，不能虛構為已跑局數。
6. 若整批中止，尚未完成的 planned slots 不能被悄悄移除後宣稱整批通過；須同時交代 planned、started、finalized 及原因。無 start 的孤立 final 不計成成功，重複／衝突記錄與 hash 不一致列為 integrity 問題。
7. 每局停止後驗證控制器held keys為空並記錄`keysReleased`。本包 grow-12／13／14／15／16／17 的 78 個原生 final 皆為 `true`；兩個只有審查註記的歷史中斷局，不能補造 final 釋鍵證明。

`computeMs` 的 median、p95、p99、max 由完整決策耗時與另記的 overrun 統計；不重複加入 progress 的取樣值。成長節點採「第一個可見時間達到或超過指定秒數的實際 sample」，同時保留實際秒數，不插值、不把接近 60 秒的早期點改寫成 60 秒。

## 4. 開局前凍結的批次設計

| 批次 | 設計與分母 | 進入確認的條件 | 狀態 |
| --- | --- | --- | --- |
| `screen-01` | 每版 grow-12 兩局、grow-13 兩局；每版按 A–B–B–A，兩版本交錯，合計 8 局。 | grow-13 在兩版各至少 1/2；之後使用相同候選、兩版交錯，各 12 局新局。 | 8/8 完成；grow-13 的 v2.22 為 0/2，未觸發 `confirm-01`。 |
| `screen-02` | 僅 grow-14；v2.13、v2.22 交錯各 4 局，合計 8 局。 | 兩版各至少 2/4；之後使用完全相同候選、兩版交錯，各 12 局新局。 | 8 個邏輯位置全已開局：6 個原生 final、2 個審查註記的基礎設施失敗。v2.13 2/4、v2.22 1/4，未通過。 |
| `confirm-02` | 原擬每版 12 個全新 start，合計 24 局；不納入探索資料。 | 前述 grow-14 gate 必須先成立。 | **未啟動，0 局**；grow-14 探索門檻不成立。 |
| `screen-03` | 僅 grow-15；兩版交錯各 4 局，合計 8 局。 | 兩版各至少 2/4；候選開局前已凍結。 | 8/8 完成；v2.13 4/4、v2.22 3/4，gate 成立。 |
| `confirm-03` | 各 12 局全新確認，不混入探索；按原凍結候選執行。 | 每版至少 6/12 才達本輪觀察比例 50%。 | 24/24 完成；v2.13 為 11/12、v2.22 為 5/12，整體未達標。 |
| `screen-04` | grow-16 僅 v2.22，固定 4 個新 start；沒有新 v2.13 局。 | 完整 4 個原生 final 且至少 2 勝，才可開始確認。 | 4/4 完成；2 勝、2 死亡，gate 成立。 |
| `confirm-04` | grow-16僅v2.22，固定12個新start；不納入任何探索或grow-15局。 | `screen-04` gate成立後開始；至少6/12才達本輪觀察比例50%。 | 12/12完成；5勝、6死亡、1 cutoff，未達標。 |
| `screen-05` | grow-17僅v2.22，固定4個新start；沒有新v2.13局。 | 四個唯一、已知原生結果全部存在，且至少2勝。 | 4/4完成：2勝、2死亡，gate成立。 |
| `confirm-05` | gate成立後，固定12個新v2.22 start。 | 至少6/12；不納入探索或其他候選的局。 | 12/12 完成；3 勝、6 死亡、3 cutoff，未達標。 |

`screen-02` 沒有同期 grow-12 對照；與 `screen-01` 的差別可用於診斷，不能宣稱是隨機配對的因果比較。進入確認的門檻是在每批開始前固定；不能把探索中看到的成功挪入確認分母。即使確認觀察到 6/12，也不是「已證明長期成功機率至少 50%」：6/12 的 Wilson 95% 區間約為 25.4%–74.6%。本輪的有限探索與確認不代替正式發布驗收。

## 5. `screen-01` 完整結果

時間：**2026-11-25 08:42:02.441–09:00:35.968 臺灣時間**，即 UTC `00:42:02.441–01:00:35.968`。8 個 start 全部 `startedVisible=true`，8 個 final 全部保留；沒有補跑、計算逾時、未知結果或基礎設施錯誤。

| runId | 遊戲 | 策略 | 結果 | 結算遊玩秒數 | final HUD 體型 | HUD 換算經過秒數 | wall 秒 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `screen-01-01` | v2.13 | grow-12 | deadline_cutoff | — | 115 | 151 | 150.052 |
| `screen-01-02` | v2.22 | grow-12 | deadline_cutoff | — | 100 | 151 | 150.108 |
| `screen-01-03` | v2.13 | grow-13 | deadline_cutoff | — | 110 | 151 | 150.242 |
| `screen-01-04` | v2.22 | grow-13 | deadline_cutoff | — | 97 | 151 | 150.260 |
| `screen-01-05` | v2.13 | grow-13 | win_le150 | 148 | 200 | 149 | 150.850 |
| `screen-01-06` | v2.22 | grow-13 | death | 94 | 86 | 95 | 96.974 |
| `screen-01-07` | v2.13 | grow-12 | death | 108 | 100 | 109 | 110.470 |
| `screen-01-08` | v2.22 | grow-12 | deadline_cutoff | — | 114 | 151 | 150.115 |

「—」表示沒有遊戲結算時間，並非 0 秒。所有 cutoff 的 HUD 剩餘時間原文均為 `02:29`。死亡原文標題均為 `You were eaten!`；描述中的遊玩時間分別為 `01:34` 與 `01:48`，與分類一致。完整原字串見原始 JSONL。

| 遊戲／策略 | 成功／全部 start | 死亡 | 到時停止 | Wilson 95% 區間 | 決策耗時 median / p95 / max，ms |
| --- | ---: | ---: | ---: | --- | --- |
| v2.13／grow-12 | 0/2 | 1 | 1 | 0.0%–65.8% | 11.4 / 22.8 / 60.4 |
| v2.22／grow-12 | 0/2 | 0 | 2 | 0.0%–65.8% | 11.5 / 22.8 / 57.1 |
| v2.13／grow-13 | 1/2 | 0 | 1 | 9.5%–90.5% | 12.2 / 21.9 / 63.8 |
| v2.22／grow-13 | 0/2 | 1 | 1 | 0.0%–65.8% | 12.8 / 21.8 / 157.7 |

這些是每組兩局的探索觀察，不足以判定 grow-13 普遍優於 grow-12。可以確定的是：grow-13 有一局完成原目標，但未在兩個版本同時達到探索門檻，因此沒有進行 `confirm-01`。

### 首個成功的可見原始證據

`screen-01-05` 的 final：

```json
{
  "title": "You win!",
  "description": "You reached size 200 and survived!Play time 02:28 · Eaten 227Best eaten: 227.",
  "hudSize": 200,
  "hudTime": "02:31",
  "eaten": 226,
  "elapsedVisible": 149,
  "resultSeconds": 148
}
```

`wallMs=150850` 包含結算動畫，不會把顯示遊玩時間 148 秒的成功改判成超時。HUD 的 eaten=226 與結算文字 Eaten 227 是不同更新時點的可見值，原樣保留。

| 指定成長節點 | 實際 sample 經過秒數 | 可見 HUD 剩餘時間 | 體型 | wall ms |
| ---: | ---: | --- | ---: | ---: |
| 30 | 30 | 04:30 | 41 | 29138 |
| 60 | 60 | 04:00 | 51 | 59132 |
| 90 | 90 | 03:30 | 90 | 89164 |
| 120 | 120 | 03:00 | 134 | 119065 |

## 6. grow-13 → grow-14 的固定變更

grow-13 新候選將各體型統一交給可見目標的截獲收益與短期路徑規劃：以畫面估計的尺寸範圍、相對速度、牆與威脅，評估實際八方向按鍵的兩段移動路徑。這是針對原成長／時間目標的新候選；grow-12 在首批保留為現行對照。

名稱正規化後，兩份 planner 的決策邏輯逐位元相同：將 grow-14 的 `planGrow14`、`grow-14` 還原為 `planGrow13`、`grow-13` 即與 grow-13 檔案相等。grow-14 沒有重新調整追逐、收益、危險或路徑評分參數；有效行為變更來自以下兩項感知整合。

| 項目 | grow-13 | grow-14 |
| --- | --- | --- |
| 影像擷取最大寬度 | 1200，原 2000 寬畫面先縮小。 | B14 使用 2000，保留原畫面解析度；頁內 A12 仍為 1200。 |
| 嚴格小地圖標記 | B13 未接上 `growMarkers`，planner 可能使用寬鬆 `map.opportunities`。 | 明確為 B14 呼叫 `growMarkers`；有陣列時即使為空，也不退回寬鬆白點候選。 |
| 診斷紀錄 | 基本物件／目標／耗時數值。 | 加入 reason、eligibleNpc、neutralNpc、uncertainNpc、目標尺寸界限與可靠度、first／second 等純畫面派生數值。 |
| 其他測試設定 | 固定遊戲、輸入、視野、200 ms 計算上限、300 s 牆鐘上限。 | 相同；頁面說明與批次 ID／順序另更新，沒有改遊戲規則。 |

### 小地圖受控回歸

fixture 抽取實際建置頁面的 `detectMinimap()`、`growMarkers()`，在 Node 記憶體內產生綠色玩家、真白點、真紅點與中性灰色鏡頭框角落。它不使用實戰截圖，也不讀隱藏遊戲物件。結果：

| fixture pixelRatio | 寬鬆白點候選 | 加入灰框後多出的假候選 | 嚴格真白點 | 嚴格真紅點 | 嚴格灰框候選 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1.0 | 2 | 1 | 1 | 1 | 0 |
| 0.6 | 2 | 1 | 1 | 1 | 0 |

兩個 fixture 均 PASS，並驗證綠色玩家不會變成追逐目標。這支持「寬鬆辨識會接納該灰框碎片、嚴格辨識可排除」的具體修正；不能由此推導實戰成功率，或聲稱它解釋所有 grow-13 失敗。

## 7. grow-14：原定八局的完整審查

原批次開始於 **2026-11-25 09:01:42.835 臺灣時間**。首次中斷後，只把當時尚未開始的第 07、08 局映射到 `screen-02-recovery`；沒有重抽第 06 局。兩段合計 **8 個 start、6 個原生 final、2 個審查註記的基礎設施失敗**。所有 start 都有可見開局確認。下表的第 07、08 列是原定邏輯位置，實體 runId 對映見後文。

| runId | 遊戲 | 策略 | 結果 | 結算遊玩秒數 | final HUD 體型 | HUD 換算經過秒數 | wall 秒 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `screen-02-01` | v2.13 | grow-14 | deadline_cutoff | — | 163 | 151 | 150.861 |
| `screen-02-02` | v2.22 | grow-14 | win_le150 | 126 | 197 | 127 | 128.567 |
| `screen-02-03` | v2.13 | grow-14 | win_le150 | 132 | 200 | 133 | 134.678 |
| `screen-02-04` | v2.22 | grow-14 | deadline_cutoff | — | 171 | 151 | 150.262 |
| `screen-02-05` | v2.13 | grow-14 | deadline_cutoff | — | 166 | 151 | 150.549 |
| `screen-02-06` | v2.22 | grow-14 | infrastructure_error（審查） | — | — | — | — |
| `screen-02-07` | v2.13 | grow-14 | win_le150 | 125 | 182 | 126 | 128.006 |
| `screen-02-08` | v2.22 | grow-14 | infrastructure_error（審查） | — | — | — | — |

兩筆審查分類沒有原生 final；表格的「—」明確表示未知，沒有把最後 progress 或操作員回報的畫面數值填成 final。

`screen-02-02` 的 final 原字串為：

```json
{
  "title": "You win!",
  "description": "You reached size 200 and survived!Play time 02:06 · Eaten 230Best eaten: 230.",
  "hudSize": 197,
  "hudTime": "02:53",
  "eaten": 229,
  "elapsedVisible": 127,
  "resultSeconds": 126
}
```

此局在 UTC `01:06:22.941` 記下 final；`settled=true`、`keysReleased=true`、`controllerEvents=[]`。成功依據是可見成功結算與 `02:06`，不是要求最後一次 HUD 恰為 200。遊戲結束後 HUD 未再更新到終值，不能據 HUD197 把此局改判失敗。`screen-02-01` 沒有成功標題／結算描述，HUD 剩餘 `02:29`，因此維持 `deadline_cutoff`。

第 07 個邏輯位置（`screen-02-recovery-01`）的原生結算為 `You win!`，描述為 `You reached size 200 and survived!Play time 02:05 · Eaten 223Best eaten: 227.`。最後 HUD182、elapsed126 與 wall128.006 秒原樣保留；按預先固定的成功結算判定，這是 125 秒成功。

| 遊戲／策略 | 成功／全部 start | cutoff | 審查分類 infra | 原生 final | Wilson 95% 區間 |
| --- | ---: | ---: | ---: | ---: | --- |
| v2.13／grow-14 | **2/4（50%）** | 2 | 0 | 4/4 | 15.0%–85.0% |
| v2.22／grow-14 | **1/4（25%）** | 1 | 2 | 2/4 | 4.6%–69.9% |

**grow-14 未達兩版各至少 2/4 的 gate，`confirm-02` 未啟動，確認局數為 0。** 這是包含基礎設施失敗的事前固定操作目標；兩次中斷本身不能用來定位策略邏輯缺陷。沒有移除它們以縮小分母。

v2.13 的完整決策耗時覆蓋 4/4 局，pooled median／p95／max 為 16.4／30.4／151.7 ms；v2.22 只覆蓋有原生 final 的 2/4 局，為 16.2／29.1／94.5 ms。中斷局的完整決策陣列沒有保存，不能拿零補上，也不能把少量 progress 耗時當完整時間分布。

### 第一次中斷與開局前固定的續測補充條款

原批次共 177 筆，包括 1 筆 batch_start、6 筆 slot、6 筆 start、159 筆 progress、5 筆 final；沒有 batch_end 或 batch_error。原始檔與封存副本 SHA-256 完全相同，未改寫任何原始事件。

第 06 局 v2.22 於 UTC `01:13:40.565` 明確開局，`startedVisible=true`；最後成功保存的 progress 是 UTC `01:15:26.702`，可見體型 137、剩餘 `03:14`、換算經過 106 秒，當時 `wallMs=106137`。之後操作員以新原生畫面觀察到 `Failed to fetch`、批次中止、遊戲暫停、體型 138／經過 111 秒，並查到 preview service 為 stopped；服務停止的原因與精確時間未知。

審查者獨立核對的是保存的 JSONL；後述原生畫面與服務狀態由操作員回報，未冒稱審查者另看過同一畫面。因此在獨立 [reviewer sidecar](results/screen-02-reviewer-sidecar.json) 將第 06 局標為 `infrastructure_error`、保留為非成功與已開局分母；**沒有補造原生 final、結算時間、最終體型、wallMs 或 keysReleased**。原始統計器只見尚無 final／batch_end，仍會列此局為 in_progress，使用時須同時讀此審查註記。

第一次中斷時 v2.13 已開 3 局，為 1 次成功與 2 次 cutoff；v2.22 已開 3 局，為 1 次成功、1 次 cutoff、1 次審查註記的基礎設施失敗。原第 07、08 局當時連 slot 都尚未記錄，因此後續只執行這兩個原定未開局位置；第 06 局沒有重抽或替換。

續測採獨立目錄與事件檔，batch 為 `screen-02-recovery`。它在取得續測結果前固定以下對映：

| 新實體 runId | 原定邏輯位置 | 遊戲／策略 |
| --- | --- | --- |
| `screen-02-recovery-01` | `screen-02-07`，原 index 6 | v2.13／grow-14 |
| `screen-02-recovery-02` | `screen-02-08`，原 index 7 | v2.22／grow-14 |

已核對續測 planner、harness 位元、感知配置、遊戲／隔離 hash、viewport、輸入、自然未知 seed 與計算上限均相同；實際 start 的環境也與原批相同。只更新續測批次 metadata、說明文字與相應 page／build／protocol hash。服務重啟造成時間中斷，不能稱為連續無中斷的八局。最終統計以原 01–06 加上兩個對映後的新 start 建立八個邏輯位置的 union，各位置只計一次，原 06 保留失敗；沒有使用兩局續測的新分母取代原分母。

```text
recovery parentProtocolHash
e3237b940633b27e65685ad6ae8031aa878699c6dc4ce283679c0d8ea11836de
recovery protocolHash
4b19452b8acff749c477d755ab46588d04176e53ce270fb8172caf4f6b14755a
recovery pageHash
afde1d44993d4c71c544798bdeedb5e3cc9a4821e714407a12f1810c6ee50351
```

### 第二次中斷：服務仍運行，瀏覽器畫面消失

續測原始檔共 **53 筆**：1 筆 batch_start、2 筆 slot、2 筆 start、47 筆 progress、1 筆 final；沒有 batch_end／batch_error。第 07 局成功已保存原生 final。第 08 局（實體 `screen-02-recovery-02`）於 UTC `01:28:33.652` 開局；最後 progress 為 UTC `01:30:24.843`，HUD169、剩餘 `03:08`、elapsed112、wall111191 ms，沒有 final。

本次操作員回報連續兩次原生桌面截圖皆黑畫面，按 Shift 後未恢復；瀏覽器 tabs 清單及原生視窗清單均為空。**preview service 仍為 running，相關 exec session 也仍存活**，與第一次服務停止不同。瀏覽器消失的根本原因與精確時間未知，沒有據此推定特定 crash 原因。

第二份 [reviewer sidecar](results/screen-02-recovery-reviewer-sidecar.json) 只將此已開局標為基礎設施失敗並保留分母，沒有補造 final、遊戲暫停狀態或 held keys 證明。兩份 sidecar 綁定各自原始檔 hash，與 `raw-native-summary.json` 分開；首次 sidecar 內的「續測結果 pending」保留為當時的歷史快照，最終整合狀態以 `evaluation-summary.json` 為準。

## 8. grow-15／16 完整結果與 grow-17 後續候選

grow-15 保留 grow-14 的原尺寸 2000 寬擷取、嚴格小地圖與相同 planner。已獨立核對，將策略／函式名稱正規化後，planner 逐位元相同。新增的 [geometry.js](source/experiments/grow15/geometry.js) 僅處理已分類為 NPC 的畫面物件：亮斑形狀與本體顏色通過幾何一致性檢查時，同時採用估計中心與半徑，再依 capture ratio 轉換；拒判則保留原中心及半徑。食物分類與幾何不變，沒有讀取隱藏遊戲狀態。

新增數值診斷包括 geometryAccepted、confidence、originalRadius、每次取樣的接受數／NPC 數與平均接受分數。confidence 是幾何一致性分數，不是校準過的正確機率。凍結來源中的「備用／實戰尚未執行」文案記錄準備時狀態，未為更新報告而修改測試來源；實際執行情況以事件及本報告為準。

`screen-03` 第一局已於 UTC **2026-11-25 01:35:07.248**（臺灣09:35:07.248）開局。恢復瀏覽器後，外層 viewport 變為 **1050×917**、iframe CSS scale **0.3225**；實際 iframe、canvas backing store、canvas CSS 仍為 **2000×1163**、DPR1、前景 visible。這個外層排版與先前批次不同，不能宣稱環境完全相同。

### `screen-03` 八局結果

批次時間為 **2026-11-25 09:35:07.064–09:53:20.544 臺灣時間**，即 UTC `01:35:07.064–01:53:20.544`。原始資料共 237 筆：batch_start 1、slot 8、start 8、progress 211、final 8、batch_end 1；結尾 `halted=false`、`completed=8`、`planned=8`。沒有批次錯誤或缺失 final。

| runId | 遊戲 | 結果 | 可見結算時間 | 結算遊玩秒數 | final HUD 體型 | HUD 換算經過秒數 | wall 秒 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `screen-03-01` | v2.13 | win_le150 | 02:07 | 127 | 178 | 128 | 129.771 |
| `screen-03-02` | v2.22 | win_le150 | 02:24 | 144 | 189 | 145 | 146.346 |
| `screen-03-03` | v2.13 | win_le150 | 02:18 | 138 | 200 | 139 | 140.973 |
| `screen-03-04` | v2.22 | deadline_cutoff | — | — | 190 | 151 | 150.411 |
| `screen-03-05` | v2.13 | win_le150 | 01:48 | 108 | 185 | 109 | 111.061 |
| `screen-03-06` | v2.22 | win_le150 | 02:14 | 134 | 200 | 135 | 136.813 |
| `screen-03-07` | v2.13 | win_le150 | 02:08 | 128 | 200 | 129 | 130.982 |
| `screen-03-08` | v2.22 | win_le150 | 02:20 | 140 | 190 | 141 | 142.619 |

七筆成功均有原生 `settled=true`、標題 `You win!`，描述明示 `You reached size 200 and survived!` 及表列的 `Play time`；所有顯示結算秒數均小於 150。第 04 局沒有成功標題／結算描述，HUD 剩餘 `02:29`、elapsed151，維持 cutoff。第 04 與第 08 局的最後 HUD 都是 190，但只有後者有成功結算，不能單靠 HUD 體型分類。

| 版本／grow-15 | 成功／全部 start | cutoff | 死亡／infra／未知 | Wilson 95% 區間 | 成功結算秒數 | 成功時間 median |
| --- | ---: | ---: | --- | --- | --- | ---: |
| v2.13 | **4/4（100%）** | 0 | 0／0／0 | 51.0%–100.0% | 127、138、108、128 | 127.5 s |
| v2.22 | **3/4（75%）** | 1 | 0／0／0 | 30.1%–95.4% | 144、134、140 | 140 s |

**完整探索符合凍結的兩版各至少 2/4 gate，可以進入各 12 局的新確認。** 每版仍只有 4 局，且候選經前面探索後選出；這些探索區間與比例不代替獨立確認，也不構成長期勝率已達標的結論。

### 計算耗時與獨立核對

| 版本 | 有完整 compute 陣列的局數 | 決策筆數 | median ms | p95 ms | p99 ms | max ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| v2.13 | 4/4 | 5030 | 16.1 | 29.1 | 50.8 | 125.6 |
| v2.22 | 4/4 | 5683 | 17.0 | 31.4 | 50.8 | 91.3 |

這是各版全部已完成決策的 pooled 分布；8 局均沒有 compute_overrun，停止後 `keysReleased=true`。8 個 start 均 `startedVisible=true`，protocol／page／planner／geometry／game hash 與凍結來源一致；8 次 start 的環境紀錄相同，皆為前述外層1050×917、遊戲2000×1163、DPR1、前景 visible。摘要 `integrity.ok=true`，沒有去掉失敗局、重複開局、重複 final 或更換候選。

探索截止快照為前 237 筆、1,221,506 bytes，SHA-256 `c89a0b6f273a169d05d18d0734ee97a8c25b86206da0f44230713a974382a754`。已獨立驗證，目前含確認事件的同一 JSONL 前 1,221,506 bytes 與此探索快照完全相同；探索資料沒有被重寫。統計器按 `screen-03`／`confirm-03` 與 phase 分開統計，探索成功沒有算進確認。

### `confirm-03` 獨立確認：完整 24 局

完整探索 gate 成立後，在保留原頁狀態的情況下直接開始確認；沒有重建候選或改動來源。確認 batch_start 為 UTC `01:59:06.759`，第一局可見開局為 UTC **01:59:06.943**（臺灣09:59:06.943），正常 batch_end 為 UTC **02:50:52.877**（臺灣10:50:52.877）。順序為 v2.13、v2.22 交錯 12 次，共 24 個全新 start；不使用探索局填補分母，也沒有在看到中途結果後縮短或延長批次。

確認階段完整包含 batch_start 1、slot 24、start 24、progress 598、final 24、batch_end 1，共 **672 筆**；batch_end 的 `halted=false`、`completed=24`、`planned=24`，沒有 batch_error。與探索 237 筆相加為同檔 909 筆。前 3,803,422 bytes 與上一份確認快照完全相同，既有事件沒有重寫。

| 版本 | 原定確認局數 | 已開始 | 原生 final | 已成功 | 已死亡 | cutoff | 進行中 | 尚未開始 | 完整結論 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| v2.13 | 12 | 12 | 12 | 11 | 0 | 1 | 0 | 0 | 本版觀察比例達標 |
| v2.22 | 12 | 12 | 12 | 5 | 4 | 3 | 0 | 0 | 本版觀察比例未達標 |

| runId | 遊戲 | 快照狀態 | 可見結算時間 | 結算秒數 | final HUD 體型 | HUD 經過秒數 | wall 秒 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `confirm-03-01` | v2.13 | win_le150 | 02:27 | 147 | 200 | 148 | 149.701 |
| `confirm-03-02` | v2.22 | win_le150 | 01:52 | 112 | 185 | 113 | 115.115 |
| `confirm-03-03` | v2.13 | win_le150 | 02:17 | 137 | 200 | 138 | 140.373 |
| `confirm-03-04` | v2.22 | death | 00:52 | 52 | 81 | 53 | 55.029 |
| `confirm-03-05` | v2.13 | win_le150 | 02:10 | 130 | 183 | 131 | 132.489 |
| `confirm-03-06` | v2.22 | win_le150 | 02:24 | 144 | 200 | 145 | 146.565 |
| `confirm-03-07` | v2.13 | win_le150 | 02:14 | 134 | 194 | 135 | 136.891 |
| `confirm-03-08` | v2.22 | deadline_cutoff | — | — | 189 | 151 | 150.316 |
| `confirm-03-09` | v2.13 | win_le150 | 02:28 | 148 | 186 | 149 | 151.068 |
| `confirm-03-10` | v2.22 | death | 02:01 | 121 | 156 | 122 | 123.452 |
| `confirm-03-11` | v2.13 | win_le150 | 02:03 | 123 | 194 | 124 | 125.956 |
| `confirm-03-12` | v2.22 | win_le150 | 02:11 | 131 | 196 | 132 | 134.316 |
| `confirm-03-13` | v2.13 | win_le150 | 02:22 | 142 | 188 | 143 | 145.378 |
| `confirm-03-14` | v2.22 | win_le150 | 01:57 | 117 | 181 | 118 | 119.633 |
| `confirm-03-15` | v2.13 | win_le150 | 01:43 | 103 | 195 | 104 | 105.970 |
| `confirm-03-16` | v2.22 | death | 01:24 | 84 | 112 | 85 | 86.394 |
| `confirm-03-17` | v2.13 | win_le150 | 01:59 | 119 | 200 | 120 | 122.412 |
| `confirm-03-18` | v2.22 | deadline_cutoff | — | — | 156 | 151 | 150.389 |
| `confirm-03-19` | v2.13 | win_le150 | 02:05 | 125 | 191 | 126 | 127.904 |
| `confirm-03-20` | v2.22 | death | 02:18 | 138 | 167 | 139 | 141.115 |
| `confirm-03-21` | v2.13 | deadline_cutoff | — | — | 167 | 151 | 150.539 |
| `confirm-03-22` | v2.22 | win_le150 | 01:52 | 112 | 200 | 113 | 114.565 |
| `confirm-03-23` | v2.13 | win_le150 | 01:54 | 114 | 192 | 115 | 116.963 |
| `confirm-03-24` | v2.22 | deadline_cutoff | — | — | 164 | 151 | 150.607 |

| 版本 | 成功／全部 start | 觀察比例 | Wilson 95% 區間 | 成功局遊玩秒數中位數 | 成功時間範圍 |
| --- | ---: | ---: | --- | ---: | --- |
| v2.13 | 11/12 | 91.7% | 64.6%–98.5% | 130 | 103–148 秒 |
| v2.22 | 5/12 | 41.7% | 19.3%–68.0% | 117 | 112–144 秒 |

24 筆原生 final 已逐一核對原字串與分類。16 次成功均為 `You win!` 且描述明示 `You reached size 200 and survived!`，遊玩時間不超過 150 秒；4 次死亡標題均為 `You were eaten!`，遊玩時間依序為 `00:52`、`02:01`、`01:24`、`02:18`。第 08／18／21／24 局均未成功結算、elapsed151，HUD 分別為 189／156／167／164，保留 cutoff。第 09 局 wall151.068 秒包含動畫，成功仍依可見結算 148 秒判定。第 19、23 局 HUD 仍為 191、192，但結算明確成功，沒有改動原字串或要求 HUD 補到 200。

24 個 start 的 protocol／page／planner／geometry／source／game hashes 與凍結 grow-15 相符；已核對實際使用的 planner、harness、geometry、build 與建置頁 hash。環境維持 1050×917 外層、2000×1163 遊戲、DPR1、前景 visible。全部 24 筆 final 均 `keysReleased=true`、`controllerEvents=[]`，`computeMs` 長度等於 `decisions`，全部 30,407 筆已保存計算值有限且低於 200 ms，沒有已記錄的計算逾時或控制器中止。統計器 integrity 為 true、各 run flags 為空。

| 版本 | 完整決策筆數 | compute 中位數 | p95 | p99 | 最大值 |
| --- | ---: | ---: | ---: | ---: | ---: |
| v2.13 | 15,773 | 16.6 ms | 26.7 ms | 47.1 ms | 113.2 ms |
| v2.22 | 14,634 | 17.6 ms | 28.2 ms | 49.1 ms | 99.7 ms |

這些延遲分位數按每一筆完整決策資料計算，不是每局中位數再平均，也不是瀏覽器端到端輸入延遲。成功時間統計僅包含成功局；失敗局仍完整留在成功比例分母，因此不能用 117 秒的成功局中位數說 v2.22 整體表現較佳。

**完整確認為 `observed_target_not_met`：v2.13 已達本輪觀察比例門檻，但 v2.22 的 5/12 少於事前要求的 6/12。** 兩版本不能合併，探索成功也不能補足。本輪樣本與 Wilson 區間描述的是固定候選這次自然實戰；沒有據此聲稱長期成功機率已被證明，也不構成正式發布驗收。

#### 第 04 局死亡診斷的可知範圍

[數值診斷](results/grow15-confirm-03-04-diagnostic.json) 保留死亡前最後15筆 sample。最後6筆（HUD時間換算48–53秒）都選擇 food-and-exploration、eligibleNpc=0，記錄中仍有4–7個預測威脅，且模型的 clearance 為正。這些是模型輸出的已保存數值；它們與其後的死亡結算並存，不能當作真實場景安全距離。

此局527筆已保存決策均低於200 ms，最大約72.6 ms，沒有已記錄的 compute_overrun。資料沒有保存完整危險物件與穩定ID、所有100 ms決策畫面或致死那一幀，故不能定位吞食者，或把死亡歸因於某次接受／拒絕幾何估計、速度預測、物件合併、配對或威脅分類。geometry confidence 也不是整個場景安全的機率。本診斷不改變原生 death 結果，沒有修改實跑候選。

#### v2.22 後期診斷的描述性觀察

[後期比較](results/grow15-late-v22-diagnostic.json) 顯示，確認第08局最後35個保存樣本有27個選擇小地圖探索目標、23個預測 gain=0，HUD187→189；但另一個探索期 cutoff 並非同樣由小地圖目標占主導。兩個 cutoff 的末段可辨識食物／合格 NPC 較少，事後選取的5個成功對照局則辨識到較多食物。這是少量、事後選取樣本的描述性關聯；計數是每個 sample 的辨識輸出，不是真實世界資源密度或唯一 NPC 數，預測 gain 也不是實現收益。現有資料不能區分真實場景稀少、遮擋、分類／篩選、路徑選擇等原因，更不能證明近身 NPC 被錯誤刪除。該診斷不作因果結論，也不改動確認中的策略。

### grow-16：v2.22 探索與獨立確認完整結果

[grow-16 manifest](source/experiments/grow16/manifest.json) 在啟用前固定了先決條件：必須等 grow-15 的 v2.22 確認 12 個原生 final 全部完成，而且成功數少於 6。[啟用檢查](results/grow16-activation-verification.json) 記於 UTC `02:51:55.551997`，綁定完整 grow-15 原始事件 SHA-256，核對 12 個 start、12 個 final、5 勝，條件成立。這份檢查不是新遊戲事件。

唯一 planner 差異是：**在 v2.22、HUD 體型小於 186 時，已確認紅色 NPC 本體的半徑上界採 200**。確認方式為可見本體 `isRed` 或配對到小地圖紅點 `mapRed`；尚未配對的紅點原本就採 200。v2.13、已免疫分支、食物／NPC 分類、幾何辨識、速度預測、收益評分與其餘規劃邏輯保持原值。此假設可能提高對紅色 NPC 的保守距離，也可能減少追逐與成長；舊死亡紀錄沒有完整危險物件與致死畫面，不能聲稱這就是既有死亡原因或已證實有效的修正。

原函式名 `planGrow15` 與其內部診斷 `strategy` 值刻意保留，讓 planner 原碼僅有一個運算式差異；可見策略選擇、start／final、manifest 則記 `grow-16`。[純 planner 檢查](source/experiments/grow16/check-planner.cjs) 的 35 個受控案例通過，包括 v2.13 保持相同、v2.22 無紅點／未配對紅點／免疫分支保持相同，以及新上界符合原 planner 接收半徑 200 的保守對照。這是合成輸入的程式檢查，沒有讀取實戰隱藏狀態，也不是成功率證據。

| 項目 | 固定設計 | 本次包內證據狀態 |
| --- | --- | --- |
| `screen-04` | 僅 v2.22，4 個新 start；4 個原生 final 全部存在且至少 2 勝才成立 gate。 | 完整 2/4 成功、2 死亡；gate 成立。 |
| `confirm-04` | gate成立後，完全相同候選的12個新v2.22 start；至少6勝才達本輪觀察比例目標。 | 12個start與12個final完整；5/12，未達標。 |
| v2.13 | 沿用未改動的 grow-15 分支與原 `confirm-03` 11/12 證據。 | 保留原候選、原批次與 hash；沒有 grow-16 的新 v2.13 樣本。 |

統計器依 manifest 的 `versions`／`order` 判斷版本集合，不再固定要求兩個版本。grow-16 的探索 gate 同時檢查四個原生 final，不能用中斷後的審查註記充當 final。單版本的探索達標／未達標／進行中及確認 6/12／5/12／進行中六種受控統計案例已通過；合成事件只存在暫存測試副本，沒有加入任何實測檔或交付資料。`pendingEvidence` 表示尚未納入的事件，不表示新批次已完成或成功。

#### `screen-04` 四局完整結果

第一局可見開始於 UTC **02:56:37.663**（臺灣10:56:37.663），正常 batch_end 為 UTC **03:04:38.307**（臺灣11:04:38.307）。107 筆事件包括 batch_start 1、slot 4、start 4、progress 93、final 4、batch_end 1；`halted=false`，completed 與 planned 都為 4。

| runId | 版本 | 結果 | 結算原時間 | 結算秒數 | final HUD | HUD 經過秒數 | wall 秒 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `screen-04-01` | v2.22 | win_le150 | 02:21 | 141 | 191 | 142 | 143.876 |
| `screen-04-02` | v2.22 | death | 01:45 | 105 | 162 | 106 | 107.538 |
| `screen-04-03` | v2.22 | win_le150 | 02:06 | 126 | 200 | 127 | 128.932 |
| `screen-04-04` | v2.22 | death | 01:36 | 96 | 98 | 97 | 98.264 |

兩次成功都有 `You win!`、reached size 200 與不超過 150 秒的原始結算文字；兩次死亡均為 `You were eaten!`。第 01 局最後 HUD191，但結算明確成功，仍依結算判定。四個 start 與 final 的來源／protocol 相符，全部可見開局、前景 visible；環境為外層1050×917、遊戲及 canvas2000×1163、DPR1，與 grow-15 本輪相同。

探索觀察比例 **2/4＝50.0%**，Wilson 95% 區間 **15.0%–85.0%**；兩個成功時間的中位數為 **133.5 秒**。四局共 **4,686 筆**完整決策，compute 中位數 **17.0 ms**、p95 **28.3 ms**、p99 **53.6 ms**、最大 **114.9 ms**；筆數與 decisions 一致，無非有限值或超過200 ms的紀錄。四個 final 均 `keysReleased=true`、`controllerEvents=[]`。這些探索結果僅符合啟動確認的門檻，尚不能代表新候選通過 12 局確認。

[確認 gate 檢查](results/grow16-confirmation-gate-verification.json) 於 UTC `03:05:38.499338` 綁定完整探索 SHA-256，核對四個原生 final、兩勝、來源與釋鍵；機器摘要同樣判為 `met`。較早 91 筆、432,817 bytes 快照是探索完整檔案未變動的前綴，沒有在第四局結束前宣告整批完成。探索完整 107 筆、534,928 bytes 又是目前含確認事件檔案的相同前綴，gate 檢查綁定的探索 hash 沒有改變。

#### `confirm-04`：完整12局確認

原生batch_start為UTC **03:05:49.025**，第一個可見start為 **03:05:49.167**（臺灣11:05:49.167）；正常batch_end為 **03:30:58.664**（臺灣11:30:58.664）。批次按凍結順序跑完12個新的v2.22 start，使用相同grow-16候選、遊戲與150秒判定，沒有替換或增減局數。確認包含batch_start1、slot12、start12、progress290、final12、batch_end1，共328筆；`halted=false`、completed12、planned12，無batch_error。前1,763,353 bytes與上一份確認快照相同，既有事件沒有重寫。

| 原定確認局數 | 已開始 | 原生 final | 已成功 | 已死亡 | cutoff | 進行中 | 尚未開始 | 完整結論 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 12 | 12 | 12 | 5 | 6 | 1 | 0 | 0 | 未達6/12 |

| runId | 版本 | 結果 | 結算原時間 | 結算秒數 | final HUD | HUD 經過秒數 | wall 秒 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `confirm-04-01` | v2.22 | win_le150 | 02:03 | 123 | 200 | 124 | 125.987 |
| `confirm-04-02` | v2.22 | death | 01:50 | 110 | 95 | 111 | 113.063 |
| `confirm-04-03` | v2.22 | death | 01:37 | 97 | 109 | 98 | 100.361 |
| `confirm-04-04` | v2.22 | win_le150 | 02:05 | 125 | 198 | 126 | 128.102 |
| `confirm-04-05` | v2.22 | deadline_cutoff | — | — | 139 | 151 | 150.449 |
| `confirm-04-06` | v2.22 | death | 00:52 | 52 | 79 | 53 | 54.535 |
| `confirm-04-07` | v2.22 | death | 02:06 | 126 | 175 | 127 | 128.800 |
| `confirm-04-08` | v2.22 | death | 02:16 | 136 | 179 | 137 | 139.434 |
| `confirm-04-09` | v2.22 | win_le150 | 02:27 | 147 | 200 | 148 | 150.485 |
| `confirm-04-10` | v2.22 | win_le150 | 02:20 | 140 | 180 | 141 | 142.845 |
| `confirm-04-11` | v2.22 | win_le150 | 02:02 | 122 | 200 | 123 | 124.698 |
| `confirm-04-12` | v2.22 | death | 02:21 | 141 | 176 | 142 | 144.365 |

確認成功比例為 **5/12＝41.7%**，Wilson95%區間 **19.3%–68.0%**，成功局遊玩時間中位數 **125秒**，範圍 **122–147秒**。探索2勝和grow-15任何局都沒有填入分母。全12局均已結算，`provisional=false`、`confirmationAssessments.status=observed_target_not_met`。

12局原始結算與分類一致：5次`You win!`且描述明示reached size200，6次`You were eaten!`，第05局則無結算、elapsed151，保留cutoff。新增第10／11局成功原文時間02:20／02:02，第12局死亡時間02:21；第10局HUD180仍依明確成功結算判勝。第09局wall含動畫達150.485秒，仍依可見結算147秒判為成功。

12個start的protocol／page／planner／geometry／source／game hash及環境都與探索相同；packaged與實際候選檔hash也一致。12個final均`keysReleased=true`、`controllerEvents=[]`，compute筆數等於decisions、全部有限且小於200ms。完整決策共 **14,739筆**，compute中位數 **17.5ms**、p95 **28.3ms**、p99 **52.5ms**、最大 **121.9ms**；完整性檢查通過，沒有控制器中止、基礎設施錯誤或未完成局。

grow-15與grow-16在v2.22的確認都觀察到5/12；失敗組成分別是4死亡／3 cutoff與6死亡／1 cutoff。這是兩批不同自然隨機局的描述，不是相同seed配對比較，不能由相同成功數推定長期效能相等，也不能把死亡數差異當作單一策略改動的因果證明。兩個候選都未在各自固定確認批次達到6/12。

### grow-17：探索與獨立確認完整完成

[manifest](source/experiments/grow17/manifest.json)的啟用先決條件要求grow-16的固定`confirm-04`完整12個已知原生final，且成功少於6。[啟用檢查](source/experiments/grow17/activation-verification.json)於UTC **03:31:59.953132**記錄12個start、12個final、5勝，並綁定完整grow-16事件SHA-256；已與原始結果獨立核對相符。grow-17實測分母來自後續原生start，啟用檢查本身不增加局數。

grow-17直接從凍結grow-15建立。唯一planner差異是把小地圖scout產生條件由`if (mapOK)`改成`if (mapOK && !immune)`；現有immune條件為v2.22且HUD≥186。因此，免疫後不再建立`mapOnly`、`growth:0`、`pursuitOnly:true`的探索目標，仍保留可辨識食物、NPC目標及原本的備援探索。它沒有帶入grow-16的紅色本體上界200改動，紅色處理回到grow-15原值。v2.13分支、免疫前v2.22分支、幾何辨識、輸入、遊戲來源與其餘規劃邏輯維持父候選原值。

假設是減少後期對零預測成長scout的接近偏好可能改善過關時間；代價可能是較少發現遠處資源。純scout路徑在原、新planner中的預測gain都為0，改的是目標選擇，不是把原本的gain偽改為零。既有數值紀錄不能證明這是先前cutoff的原因，後續自然實戰也不是與grow-16相同seed的配對試驗。

| 批次／證據 | 固定要求 | 本包目前狀態 |
| --- | --- | --- |
| `screen-05` | 僅v2.22，4個新start；四個唯一runId都有已知原生final，且至少2個`win_le150`。允許的已知結果為win_le150、win_late、death、deadline_cutoff。 | 4個start、4個final，2勝2死亡；gate成立。 |
| `confirm-05` | gate成立後，同一候選的12個新v2.22 start；至少6/12才達本輪觀察比例目標。 | UTC 03:41:51.103 首次可見開局，04:05:07.093 正常結束；12 個 start、12 個 final，3 勝、6 死亡、3 cutoff，未達標。 |
| v2.13 | 保留grow-15原政策與原confirm-03的11/12。 | 沒有grow-17的新v2.13局，不更改原證據歸屬。 |

任何中斷仍保留在已開始分母，不能替換；中斷註記、infra或controller_abort不能充當上述gate要求的已知原生結果。統計器已讀取manifest的`nativeOutcomes`及實際版本清單，保留全局唯一start／final檢查。八個暫存受控案例驗證四個已知final達標、infra／abort不充數、第四局進行中、成功不足、單版本確認6/12／5/12及重複final拒絕，全部通過；合成事件沒有加入實測資料。

[乾淨重建紀錄](results/grow17-clean-build-verification.json)確認先刪除生成index與manifest後仍重建到相同pageHash，只有新manifest的createdAt／protocolHash更新；[38個純planner案例](source/experiments/grow17/check-planner.cjs)、建置檢查及server語法均通過。這些驗證證明來源與指定分支行為，沒有啟動遊戲或證明自然實戰效益。

#### `screen-05`：完整四局探索

原生batch_start為UTC **03:32:41.378**，首個可見start為 **03:32:41.648**（臺灣11:32:41.648），正常batch_end為 **03:40:45.798**（臺灣11:40:45.798）。完整108筆事件為batch_start1、slot4、start4、progress94、final4、batch_end1；`halted=false`、completed4、planned4，沒有batch_error。較早92筆、405,804bytes快照保持為未變動的完整前綴。

| runId | 版本 | 結果 | 結算原時間 | 結算秒數 | final HUD | HUD經過秒數 | wall秒 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `screen-05-01` | v2.22 | death | 01:48 | 108 | 182 | 109 | 111.283 |
| `screen-05-02` | v2.22 | win_le150 | 01:40 | 100 | 188 | 101 | 103.039 |
| `screen-05-03` | v2.22 | death | 02:07 | 127 | 148 | 128 | 130.021 |
| `screen-05-04` | v2.22 | win_le150 | 02:14 | 134 | 200 | 135 | 137.800 |

第02／04局原文均明示`You win!`、reached size200，Play time分別為01:40／02:14；第02局最後HUD188不改變依結算判勝的結果。第01／03局為`You were eaten!`，時間與分類一致。完整探索比例 **2/4＝50.0%**，Wilson95%區間 **15.0%–85.0%**；兩個成功時間中位數 **117秒**。這是探索篩選結果，不混入後續確認分母。

四個start全部`startedVisible=true`，source／planner／page／geometry／protocol／game hashes與凍結manifest相符；實際與packaged候選檔hash一致。環境為1050×917外層、2000×1163遊戲／canvas、DPR1、前景visible，與grow-15／16相同。四個final均`keysReleased=true`、`controllerEvents=[]`，compute筆數等於decisions、全部有限且小於200ms。完整決策共 **4,717筆**，compute中位數 **17.4ms**、p95 **31.2ms**、p99 **58.9ms**、最大 **115.8ms**。

**完整探索gate為met，eligibleForConfirmation=true。** [確認gate檢查](results/grow17-confirmation-gate-verification.json)於UTC03:41:39.999786綁定完整探索hash，核對四個唯一、已知原生final與兩勝。探索完整108筆、542,736bytes保持為目前含確認事件檔案的相同前綴，gate證明綁定的hash沒有改變。後續確認仍使用相同固定候選，探索兩勝不加入確認。

#### `confirm-05`：完整十二局獨立確認

原生 batch_start 為 UTC **03:41:50.942**，首個可見 start 為 **03:41:51.103**（臺灣 11:41:51.103），正常 batch_end 為 UTC **04:05:07.093**（臺灣 12:05:07.093）。固定 12 個新 v2.22 start 全部執行，始終使用相同 grow-17 來源、遊戲與 150 秒判定。完整確認包含 batch_start 1、slot 12、start 12、progress 268、final 12、batch_end 1，共 **306 筆**；`halted=false`、`completed=12`、`planned=12`，沒有 batch_error。與探索 108 筆相加為同檔 414 筆。上一份快照的前 1,614,426 bytes 與最終檔完全相同，既有事件沒有重寫。

| 原定確認局數 | 已開始 | 原生 final | 成功 | 死亡 | cutoff | 進行中 | 尚未開始 | 完整結論 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 12 | 12 | 12 | 3 | 6 | 3 | 0 | 0 | 未達 6/12 |

| runId | 版本 | 結果 | 結算原時間 | 結算秒數 | final HUD | HUD 經過秒數 | wall 秒 |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `confirm-05-01` | v2.22 | death | 01:39 | 99 | 118 | 100 | 102.221 |
| `confirm-05-02` | v2.22 | deadline_cutoff | — | — | 162 | 151 | 150.362 |
| `confirm-05-03` | v2.22 | death | 01:32 | 92 | 110 | 93 | 95.119 |
| `confirm-05-04` | v2.22 | deadline_cutoff | — | — | 195 | 151 | 150.675 |
| `confirm-05-05` | v2.22 | death | 01:10 | 70 | 73 | 71 | 72.345 |
| `confirm-05-06` | v2.22 | win_le150 | 01:18 | 78 | 183 | 79 | 81.040 |
| `confirm-05-07` | v2.22 | death | 01:53 | 113 | 161 | 114 | 115.958 |
| `confirm-05-08` | v2.22 | death | 01:20 | 80 | 114 | 81 | 82.758 |
| `confirm-05-09` | v2.22 | death | 01:32 | 92 | 92 | 93 | 94.887 |
| `confirm-05-10` | v2.22 | win_le150 | 02:24 | 144 | 191 | 145 | 146.333 |
| `confirm-05-11` | v2.22 | deadline_cutoff | — | — | 191 | 151 | 150.767 |
| `confirm-05-12` | v2.22 | win_le150 | 02:24 | 144 | 200 | 145 | 147.210 |

十二局原字串與分類一致。第 06／10／12 局均明示 `You win!`、`You reached size 200 and survived!`，可見 Play time 為 01:18／02:24／02:24；第 06／10 局最後 HUD 為 183／191，仍依明確成功結算判勝。六次死亡均有 `You were eaten!`。第 02／04／11 局 title／description 皆空、`settled=false`、`ending=false`，HUD 經過秒數為 151，保留到時停止；其體型分別為 162／195／191。所有成功與失敗均保留，沒有替換或延長截止。

完整確認為 **3/12＝25.0%**，Wilson 95% 區間 **8.9%–53.2%**；三次成功的時間為 **78、144、144 秒**，中位數 **144 秒**。觀察比例未達固定要求的 6/12，`confirmationAssessments.status=observed_target_not_met`；探索的兩勝沒有混入分母。

十二個確認 start 全部可見，source／planner／page／geometry／protocol／game hashes 及環境與探索相同；實際及 packaged 候選檔 hash 也符合固定 manifest。十二個 final 均 `keysReleased=true`、`controllerEvents=[]`，compute 筆數等於 decisions，全部有限且小於 200 ms。完整決策共 **13,651 筆**，compute 中位數 **17.4 ms**、p95 **29.2 ms**、p99 **51.2 ms**、最大 **128.0 ms**。新增第 10／11／12 局分別保存 1,438／1,500／1,445 筆決策，最大耗時 94.6／128.0／84.7 ms；沒有已記錄的 compute_overrun、控制器中止或基礎設施錯誤。

#### 第04局HUD195停滯的有界診斷

[數值診斷](results/grow17-late-cutoff-diagnostic.json)的來源前綴、canonical final payload與35列抽取樣本已獨立核對。凍結planner相對grow-15只有指定scout條件差異，頁內包含相同planner；HUD≥186的30個保存樣本（121–150秒）皆沒有mapOnly目標，與新guard一致。HUD195從124秒起的27個保存樣本及151秒final均未變；126／131／136／141／146秒progress與final的eaten皆為219。

該195區段的保存目標為18個本體NPC、7個食物、2個無目標、0個scout。18個本體目標的`geometryAccepted=0`、confidence為null、localReliable為false；140／141／146秒三個樣本在模型估計的接觸範圍內、ETA0.1且預測gain5，後續保存HUD仍為195。這顯示預測與可見結果不一致，不能據此證明NPC真的不可吞食、已物理接觸、持續追同一NPC或定位停滯原因。沒有逐幀像素、完整物件及穩定ID，半徑／分類、配對、移動及路徑模型等解釋尚無法區分。

`gain`是預測而非實現成長，不能累加重疊預測；`clearance=1000000`是無硬威脅的哨兵值，不是真實距離。每秒樣本21/26次方向變化也不等於每100ms控制切換率。與grow-15事後選取cutoff的對照僅描述不同自然局，不證明此改動的效益或因果；診斷未更改候選或原始結果。

凍結 `NOTES.md` 內的 prepared-only 文字描述的是候選準備時刻；啟用狀態以後續啟用檢查為準，實戰結果必須以實際 start／final 為準。沒有為更新文件而重寫凍結來源。

## 9. 乾淨重建、檢查與重跑

以下命令從「本 README 所在目錄」執行。只需 Node 24，沒有外部套件安裝；在新的暫存工作副本建置，不覆寫封存來源或原始事件。

```sh
GROW_REPRO_WORK="$(mktemp -d)"
cp -R source/. "$GROW_REPRO_WORK/"
cd "$GROW_REPRO_WORK"
cp experiments/grow13/manifest.json experiments/grow13/manifest.frozen.json
cp experiments/grow14/manifest.json experiments/grow14/manifest.frozen.json
cp experiments/grow15/manifest.json experiments/grow15/manifest.frozen.json
cp experiments/grow16/manifest.json experiments/grow16/manifest.frozen.json
cp experiments/grow17/manifest.json experiments/grow17/manifest.frozen.json
node experiments/grow13/build-lab.mjs
node experiments/grow14/build-lab.mjs
node experiments/grow15/build-lab.mjs
node experiments/grow16/build-lab.mjs
node experiments/grow17/build-lab.mjs
node experiments/grow13/check-minimap-next.cjs experiments/grow14/index.html
node experiments/grow15/geometry.synthetic.cjs
node experiments/grow15/check-build.cjs
node experiments/grow16/check-planner.cjs
node experiments/grow16/check-build.cjs
node experiments/grow17/check-planner.cjs
node experiments/grow17/check-build.cjs
```

建置會重新填入 `createdAt`，因而產生新的 `protocolHash`；這是新重跑的 metadata，不能冒用原始批次 hash。重建的 page、planner、harness、build、isolation 與 game hash 應與封存版相符。可用以下命令核對：

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sha = data => createHash('sha256').update(data).digest('hex');
for (const name of ['grow13', 'grow14', 'grow15', 'grow16', 'grow17']) {
  const dir = `experiments/${name}/`;
  const frozen = JSON.parse(await readFile(dir + 'manifest.frozen.json', 'utf8'));
  const rebuilt = JSON.parse(await readFile(dir + 'manifest.json', 'utf8'));
  assert.equal(sha(await readFile(dir + 'index.html')), frozen.pageHash);
  for (const key of ['sourceHash', 'plannerHash', 'harnessHash', 'buildHash', 'isolationHash']) {
    assert.equal(rebuilt[key], frozen[key], `${name}: ${key}`);
  }
  assert.deepEqual(rebuilt.games, frozen.games);
  console.log(`${name}: frozen source and rebuilt page hashes match`);
}
NODE
```

已在全新工作副本驗證grow13／14／15／16／17及續測頁面可重建至凍結pageHash。[grow-16](results/grow16-clean-build-verification.json)與[grow-17](results/grow17-clean-build-verification.json)乾淨重建都先刪除副本中的生成頁與manifest再建置，pageHash仍相同；各自35／38個純planner案例、建置檢查與server語法檢查通過，交付候選本身沒有改動。合成小地圖與幾何案例檢查處理固定輸入，不測自然實戰成功率；重建一致也不代表自然RNG會再次產生同一局。若要重建歷史續測頁面，其凍結父頁面與輸入放在`experiments/grow14/frozen/screen-02/`，執行`node experiments/grow14-recovery/build-recovery.mjs`即可。

啟動 grow-14 本機 server：

```sh
PORT=4173 node experiments/grow14/server.mjs
```

以有視窗的 Chromium 開啟 `http://127.0.0.1:4173/`，調整外層頁面 viewport 至 1363×936、DPR1，保持單局前景，確認遊戲 canvas 為 2000×1163，按「開始 grow-14 探索（8局）」。harness 會依 manifest 順序自動跑完並將數值事件 POST 到本機。若兩版各至少 2/4，保持同一頁的探索狀態，再按「開始獨立確認（24局）」；確認按鈕不會繞過該條件。重新整理會清除頁內的 gate 記憶，不能把既有 log 當作頁內成功狀態。

若要重跑 grow-13／grow-12 的原 ABBA 批次，停止上一個 server 後，使用另一個全新工作副本啟動：

```sh
PORT=4173 node experiments/grow13/server.mjs
```

不要同時在兩個視窗跑遊戲。server 會拒絕同一事件檔內重複的 `batch_start` ID；每次獨立重跑保留各自工作副本與 manifest，不清掉失敗局來重用批次，也不把不同副本同名 runId 的事件直接串接。重跑結果是新的自然實戰，不能替代本次封存的任何局。

在工作副本中重新統計新 grow-14 結果：

```sh
node experiments/grow13/summarize.mjs experiments/grow14/results/events.jsonl
```

從本 README 所在目錄重算首批封存結果：

```sh
node source/experiments/grow13/summarize.mjs results/screen-01-events-noimages.jsonl
```

統計器將 JSON 輸出到 stdout；有資料完整性問題時 exit code 為 2。既有 `screen-01-summary.json` 可供逐項核對，無須改寫原檔。

grow-15 的新重跑可在乾淨工作副本啟動 `PORT=4173 node experiments/grow15/server.mjs`，使用本輪 grow-15 記錄的外層 viewport 1050×917。與其他候選一樣，保持單局前景並保留所有開始事件。

grow-16／17的新重跑分別使用乾淨副本與`PORT=4173 node experiments/grow16/server.mjs`或`PORT=4173 node experiments/grow17/server.mjs`，不可同時啟動遊戲。兩者都只有v2.22的4局探索與條件式12局確認；grow-17另要求四個已知、唯一原生final。先核對該副本protocol，保存全部事件，不把新重跑或grow-15的v2.13證據改名成新候選實測。

從本 README 所在目錄重新產生整份數值摘要：

```sh
node results/summarize-evaluation.mjs --write
```

它只改寫兩個衍生檔案`evaluation-summary.json`、`raw-native-summary.json`，不更改原始事件或sidecar。前者保留每個邏輯／實體runId、來源檔hash、原生final或審查分類的證據類型；後者完全不套sidecar，讓缺少final的原始資料狀態可直接查閱。grow-15／16分別封存在`results/screen-03-events-noimages.jsonl`與`results/screen-04-events-noimages.jsonl`，各檔內探索與確認按batch分開。grow-17 的完整紀錄使用 `results/screen-05-events-noimages.jsonl`，同樣將 `screen-05`／`confirm-05` 分開統計；版本集合取自 protocol，不存在的新 v2.13 樣本不會被生成。

## 10. SHA-256 metadata

### 共用固定來源與遊戲

```text
source/src/ocr-grow.html
e9d818294509cca36ccc41826c8138008705d313c99ba4cc28e21bd427dc1a6b

source/scripts/grow-games.mjs
00908ab8787f32be3f732f98b56d0f6e432f2ebfef4ae64cecebb1697ca3122f

v2.13 source
94944ef137412e93817754791c64cf7803a94f25222a8922fe8aa6936ea46d97
v2.13 isolated
6b2cb0df57472c0a5064a6f6154eef22d9c3638affe9ace637a25e7414f4823a

v2.22 source
d0349b70c0be4666142f0ed880adb1b1636bcd6d7bf32a13d0d90246899c6d14
v2.22 isolated
df6904418ef921c6eb30bceb16008c2d03042716a18840a0604f1306df967cd8
```

### grow-13 凍結版本

```text
plannerHash  ed093720354b5798769777498bfd64ae429fe23fc64f77205b6a7025ec046e24
harnessHash  8d43cd9ff97c74fa1e8884caf5a14a4b205cdcdb65cfa92393a96d58f46ed422
buildHash    2509e38b38569aa5a033ea8d64df83facc2ea7dd597d3edd776309ae2b972153
pageHash     346a8b86b4b8117ec671b50525fa05d7ca6a24e783f2746be59a6833d4f3ed56
protocolHash dfce08af3a3392914f67d33234cfb3962a52f0ee5accfc39305448ae934d0f18
server.mjs   a99473635df2f743a41b89c32b6d1ff997b89cc84636cd4872226378e6052f3d
```

### grow-14 凍結版本

```text
plannerHash  59937f61bf7d8e820f8bdbc49863f088b72a04961a5c55611f9b43659e557e85
harnessHash  4f3563e92a5e69a27a56fce4794a5a35fd861ecb7dc9af474add0b37fa1a769c
buildHash    51b044afce4777a9d8c53bbbc51ae60817efcdd407aca8ef74a0cf0ba3163dbb
pageHash     409195550d29b471c1085b7e32a46d2ce36d725231dd82b1d973725d87e1ca58
protocolHash e3237b940633b27e65685ad6ae8031aa878699c6dc4ce283679c0d8ea11836de
server.mjs   82c821bb8a788e2c53eccc4c6b524118ed3c8474332fe74401522cde874701ab
```

### grow-15 凍結版本

```text
geometryHash f229b10be76816bdaec554b49a204dad8d77d4765d61dae168a5075d1d3033ec
plannerHash  e89d6a8cb0201a8caf0314c023e16f37f63396dd44615bf4dcdc823077e0fd0e
harnessHash  cfee3070ac5fe13f5b5d9c3b17bcfe3fcecc1c2c446e850d112a927e8c81f4ba
buildHash    d62a48bb5745babe545c94c63d4e0d658ed6afb744748a54e048e01a4a8e28ea
pageHash     bbb5ce95c2b80ee406c3b9256ac80134140dc54764a2643048b46a4f087895ba
protocolHash c380f2eab1f1f722273d8f04103681ac3dd90baa02e617b2065b8706dc1de346
```

### grow-16 凍結版本

```text
geometryHash f229b10be76816bdaec554b49a204dad8d77d4765d61dae168a5075d1d3033ec
plannerHash  a2f96a52c425eb188f7c880ab700fa3cf098d984672749115c23d64389bd8f34
harnessHash  1c38cd7a246d96291b565fa3530ce2cc55b9db23daad19d3fbbe43a91ce7f8db
buildHash    7845c99dd21516d5b07b6c97d22e703b088f7368b39dcaff04d5fe651cea4d3b
pageHash     60aa5a7174de315f0e73d5a8737f62fb52e7cafdf08a5c06ea31fba378fba72b
protocolHash 62ab303656b41620f370a5141fd3ba7783cbd37db2011f7b33b5eee98c8f5d37
```

### grow-17 凍結版本

```text
geometryHash f229b10be76816bdaec554b49a204dad8d77d4765d61dae168a5075d1d3033ec
plannerHash  f2c8f104324fa8fb616a1e783020fe456817742e94bc2d896aa803586fbd8df4
harnessHash  b4739a723f05f1981fab5d24829f3f19ab0fc8d2ca854faea74450b6d4f0c3c9
buildHash    c2d4d064e19069408203846a26b84962bc41d1f04fd95a8be32390ed382ca42e
pageHash     69a97b8eddd4f3fc3611e1c8738a523772b147e20208154fc15e5b145cc5fca4
protocolHash fa7d155b5504aeb98650f710f1944fe8d943a1dd5361672237df64ca3e293cb5
```

`protocolHash` 是 manifest 尚未加上 `protocolHash` 欄位時，以 `JSON.stringify(manifest)` 計算的 SHA-256；包含建立時間。它不是格式化後整個 manifest 檔案的 hash。每次 start 另記 pageHash、plannerHash 與該版 gameHashes，可與 batch_start 內的完整 protocol 交叉核對。

### 已封存證據與分析工具

```text
results/screen-01-events-noimages.jsonl
dd18b3fbd7b6bb54cc26e1a39b2500b4d6e2cfe0bc63022b9852c288c844f37c
results/screen-01-summary.json
77370be9defb562493a9b83c3949787ac3a1e4c1ad5e588f227cdb4ebc689614
source/experiments/grow13/summarize.mjs
feada3ce2d2d99ddeb10d93a281fd4027fc88b238331be39721a5ad5627eff21
source/experiments/grow13/check-minimap-next.cjs
734d557b599a3e13f7a0641ad571cad10150c76a14300472ae118678aec10138
```

grow-14 原始中斷快照與獨立審查註記：

```text
results/screen-02-events-noimages.jsonl
9f7c5032982a79ed7c8a9472237d2bf7cd20f9f0aee6971e947fa8ed84256b10
results/screen-02-reviewer-sidecar.json
fcdcf4f7221f9bc69439226aef7dc2495192632eb02887b384fbd850809b7838
results/screen-02-recovery-events-noimages.jsonl
902e33119dc87630771f7209097b3bd04e549a69c06e7a9f4d3f523612a59ab9
results/screen-02-recovery-reviewer-sidecar.json
f2270eabd7724a8da5faa1ecca9ec68f3baca9c13ca591267df31af26c4d39b6
```

grow-15 探索截止 checkpoint（目前完整檔案的前237筆、前1,221,506 bytes）：

```text
screen-03 exploration prefix
c89a0b6f273a169d05d18d0734ee97a8c25b86206da0f44230713a974382a754
```

grow-15 完整探索與確認原始檔（截至 UTC 2026-11-25 02:50:52.877，909 筆、4,697,408 bytes）：

```text
results/screen-03-events-noimages.jsonl
adc9cc99cb0a3278e99cb6aa4b52cb9ba7d1ab492e7ed5cbb455c9e349ecc3e9
results/grow15-confirm-03-04-diagnostic.json
266dcfa5fa14bf87dc61ebc819cb53baba19b6ea88bf2a98ded4d3d9f25d0a51
results/grow15-late-v22-diagnostic.json
0572f7c0e7338da60bc6533d168d9709dab7641b9fd754142be3545e26a6b69a
results/grow16-activation-verification.json
08fc1d60f5f6a9ef828326306acd825ab42532e9327e7e7a8d83d7aba915ca4a
screen-04 exploration prefix (107 records, 534928 bytes)
3be57347456be4c3799a7af441118253cf69a39f3d088af2d44c476f20c85c61
results/screen-04-events-noimages.jsonl (435 records, 2209669 bytes; through 2026-11-25T03:30:58.664Z)
33d617a8495245e8d1acdfc233e2efb65ec58997fc1996e612edc877de2fa398
results/grow16-confirmation-gate-verification.json
238fde9537be6160c45dba8a7fe87aa20394c2c6fb3dc772a1e595aaa92f7a75
results/grow16-clean-build-verification.json
539227ee43c2c767618e0ab049004e49154591ec6e32b8151e1c71f18c3795b3
source/experiments/grow17/activation-verification.json
bbe79cb910554458c7d515ba338b43b468de4f256d5ea47b6e91e67488beba8a
results/grow17-clean-build-verification.json
22b76a636c476a57e5bdf5edb6979c4b86eed56749cd1b342c6ed983626a4c77
screen-05 exploration prefix (108 records, 542736 bytes)
bb66fa91db54c57e4e2ee3c688733849d89f51de974ec27781d7e256b73a22c8
results/screen-05-events-noimages.jsonl (414 records, 2096396 bytes; through 2026-11-25T04:05:07.093Z)
44aa0bb950e956a7497fe1b92307d552b6a9a38ad6ad3147d019dbf790b2ad0d
results/grow17-late-cutoff-diagnostic.json
82215de3322fd6a1ac0f4e5364a751b2ffc1964442c274f5f56b4e4ab0363f81
results/grow17-confirmation-gate-verification.json
dc2737b05d9dfcb1f188850e5af963439e1e901d9ad0236234d845d085668955
results/summarize-evaluation.mjs
2484d6d91f4bc1216e14fcdfbac929cecad55b4291b45ca68a9ec69e53f137c3
```

所有五組邏輯探索與三批獨立確認均包含在 `evaluation-summary.json`，按候選、版本與 phase 分開。該檔 inputs 與 derivation 包含統計輸入及分析程式 SHA-256；最終為 80 個 start、78 個原生 final、2 個審查分類基礎設施失敗，`pendingEvidence=[]`、所有 groups 的 `provisional=false`，沒有未開始位置或審查後未解結果。三個 confirmationAssessments 都是 `observed_target_not_met`。六份原始 JSONL 共 2,228 筆事件；兩份歷史 sidecar 及原始檔未為更新結論而改寫。

grow-17停滯診斷內的`selectedFinalPayloadSha256`是把選定完整final物件以Python `json.dumps(sort_keys=True, separators=(',', ':'), ensure_ascii=False)`序列化後計算SHA-256；不是原始JSONL行的hash。該檔另存來源前綴bytes與hash，讓已追加的原始log仍可按固定前綴重驗。

## 11. 可重現範圍與解讀限制

本 repro 保存來源、固定 protocol、數值／文字事件、逐局結果與統計程式。**不保存實戰截圖、影片、base64、原始 RGBA 或逐幀像素**；因此可以重建相同頁面、重算既有數值統計、再跑新的自然局，不能逐幀重播本次遊戲，也不能只憑 logs 事後重新辨識每一個實際物件。合成 fixture 在記憶體內建立的像素只用於受控回歸。

未知自然 seed、有限樣本、秒級計時、固定寬視野、CSS 縮小顯示、單一硬體／瀏覽器環境與不同控制頻率，都是解讀結果時的邊界。完整保留失敗可以避免倖存者偏差，但不能消除這些限制。

本輪五組探索、三批確認均已結束。grow-14 原定八個邏輯位置已全部交代，第 06／08 局保留缺少原生 final 的基礎設施失敗；未進入確認。grow-15 的 v2.13 確認 11/12 達到本輪觀察比例目標，v2.22 為 5/12；grow-16、grow-17 的 v2.22 確認分別為 5/12、3/12，均未達 6/12。因此，本輪沒有取得能支持「兩版分別至少 50%」的完整策略結果，也沒有以探索、其他候選或其他版本的局數補足。v2.13 的證據仍屬 grow-15，不能改寫成 grow-16／17 的新樣本。
