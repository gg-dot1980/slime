# OCR Grow 原生視野本機測試 — 2026-11-26

研究目標：桌機 v2.13 與核實的目前來源 v2.22，分別在可見遊戲時間150秒內達到體型200。探索各4局且至少2勝、全部有效結果與釋鍵完整，才進入全新獨立確認各12局、各至少6勝。這是研究樣本門檻，不是長期勝率保證或四版本OCR4正式驗收。手機跳過。

## 固定來源與流程

- repo `gg-dot1980/slime`；工作分支 `feat/grow-evaluation-20261125`；本輪基底 `518833396d155a1f388d11c11f5d977739e76b5d`；既有Draft PR #2指向`test/ocr-test`。不使用GitHub Actions。
- 原遊戲v2.13 blob `16d41cdf2997baf0b3af33567b201d2dfb835427`，SHA256 `94944ef137412e93817754791c64cf7803a94f25222a8922fe8aa6936ea46d97`。
- 原遊戲v2.22 blob `30af12f7608da91514711ecdbc01b57654ab2eab`，SHA256 `d0349b70c0be4666142f0ed880adb1b1636bcd6d7bf32a13d0d90246899c6d14`。
- 2026-11-26 08:46–08:47臺灣時間，已與GitHub main `7889f40cd86dbffd56c5fe1bfddbd9f65d3b522a`的完整遊戲檔比對一致；main目前版本v2.22，另支援v2.20/v2.21。正式站`/api/versions`、`/v2.13`、`/v2.22`回HTTP403，本批正式部署逐byte一致性未驗證。
- 候選 [Grow24](../grow-24-public/ocr-grow24.html) SHA256 `f276dd1b6dd340c142f00027adf2ddeefc394c74db772edf814cd6f9445f6347`；[Grow25](../grow-25-public/ocr-grow25.html) SHA256 `2abdc689ee0e94bfc6e25170c3568dad90d0151e5e1499a7fe0b702584f348d2`。兩份HTML原件未修改；本目錄新增測試支援程式，沒有建立新策略版本。
- 本機同源服務提供原遊戲及版本API，原遊戲byte不變；所有遊戲API寫入回503，CSP限本機來源。每局重新載入候選iframe，清除測試origin中`slime`前綴的遊戲儲存，重設初始方向與影像歷史，不改原遊戲規則、種子或預設響應式尺寸。

## 測試程式修正

[ledger.cjs](ledger.cjs)獨立從可見結算文字與倒數重算結果，要求唯一批次／樣本ID、固定交錯順序、每個開始恰一個結果、唯一最後`batch-end`、與獨立凍結contract及planned一致。中止／未知保留分母且不放行確認；確認必須有同contract且通過的探索。

[server.cjs](server.cjs)於啟動時固定所有執行來源hash與回應bytes。每筆事件依序追加、fsync；相同內容重送不重複計數，批次結尾重送仍返回已保存報告。遊戲按開始前先確認start寫入成功。若取證中斷則保留未決，不補造結果。

[harness.js](harness.js)等待真正可見的原生overlay與時間；遊戲結算動畫期間控制器正常停止，不當成中止或額外活躍遊戲時間。停止後核對`active=false`、held keys為空。每秒保存有界數字摘要與末尾最多31次決策；不保存像素。Observer成本不包含在原控制器tickTotalMs，不能將它宣稱為完整端到端延遲。

[protocol.json](protocol.json)固定測試條件與停止規則。若瀏覽器整個卡住，前端240秒檢查並非獨立硬體watchdog；可能留下未決start，會阻擋通過，不會轉成成功。

## 本次已執行

2026-11-26 09:00臺灣時間完成兩版各1局、預定10秒後停止的控制診斷。兩局均有原生開局、manual-abort診斷結果、成功停止釋鍵；完整28筆事件，無未決。這兩局不計探索／確認勝率。

- Linux、Node v24.22.3、前景Chromium156.0.8078.108、DPR1。
- 外部viewport1363×936；候選iframe1363×848；原遊戲iframe958×814；Canvas與CSS實際958×557，沒有transform。這是原生CSS結果，不是強制2000×1163。
- 兩局wall時間10072／10081ms；最後可見倒數分別04:49／04:50，體型35／33。各98個完成決策，最大77.9／92.6ms，0overrun。牆鐘與可見遊戲倒數分別記錄，不能互換。
- 凍結runner hash `e4aef108cab49a2f38089675e9bc2ad7f5187f27e32c9782089fd968bc5d5cc5`；診斷原始事件SHA256 `b295eccdcebba2b8cb3c91749e38c41d3ad615fadd61fc6a90d7d440cce997e9`。
- Node帳本45項回歸、原結果分類10項、Grow25 planner26組49斷言均實際執行通過，皆不代表自然勝率。
- Grow24固定8局探索已於09:01開始；尚未完成，不在本提交預填成績。之後結果另追加保存。

## Grow25感知反例

[perception-check.cjs](perception-check.cjs)及[數值結果](perception-check.json)使用固定原遊戲minimap繪圖、原感知函式與兩個planner，在獨立`@napi-rs/canvas 0.1.100` renderer中重現1920個有限場景。1600個150–299世界距離近白點沒有通過原感知，nearScout啟用0；320個500距離對照有4個白點通過。這不是Chrome影像或遊戲勝率證據，也不能以4/320推論recall；它指出原49個planner斷言手工給map，未證明近點能從原遊戲畫面產生。先看Grow24實戰與實際觸發，不因合成planner成功就採用Grow25。

## 重現與安全停止

完整Git checkout後，純Node檢查無網路依賴：

```sh
node docs/ocr/repro/grow-local-20261126/check-ledger.cjs
node docs/ocr/repro/grow-25-public/check-scout.cjs
node docs/ocr/repro/grow-24-public/run-desktop.cjs --self-test
```

感知反例需已安裝指定canvas套件；程式不下載依賴：

```sh
node docs/ocr/repro/grow-local-20261126/perception-check.cjs
```

一般本機可從本目錄執行`node server.cjs --port 4173`，以前景桌機瀏覽器開啟同源根路徑。在受管Work環境必須使用支援的`sites-preview start <本目錄絕對路徑>`及其回傳URL，不自行另開伺服器或改網路權限；先確認共用預覽空閒。以頁面按鈕執行控制檢查、探索及符合gate後的確認。停止按「停止批次並釋鍵」，核對帳本與畫面，再以`sites-preview stop`關閉本次預覽。

`results-private/`不納入Git。公開提供程式、合成數值fixture及摘要；私人完整事件另保存，公開目錄不是完整實戰原始證據包。Grow23的既有12starts／11finals／1未決保持原樣，沒有由本批替換。未合併、未部署正式OCR4。

## 09:13 探索中斷 — 完整保留負面結果

[公開彙總](grow24-exploration-summary.json)：原定8次，已記6次start、6次result；其中5次原生遊戲、1次setup-abort，剩2次未開始。v2.13三次均在可見151秒截止，體型172／192／158；v2.22兩次死亡，111秒／體型88與130秒／體型127。沒有過關、未決或補局，不能進入確認。

第六次載入候選等待15006ms後逾時，沒有native-started事件或任何controller decision。r1 catch讀到上一局v2.13的暫停HUD（02:29／158），因此原validator另列abort_conflicts_with_outcome。這是舊document證據污染，不能當成本次已玩151秒。原始帳本、原summary與全部來源保持不變；獨立審計以事件身份核對此異常，27項檢查通過是對記錄一致性的核對，不是試驗通過。

原始JSONL SHA256 `db8e65686019cde42f8fbeacde8a923eb980c1b63c949fbf2095a2d4805f3391`；獨立審計SHA256 `3108acc0c69a87806c5437c7c3f3f0d43d5e96a85cb06bbd2a67d80d04fca9f1`。完整私人數字帳本與審計已保存，不在GitHub上公開。導覽未完成的底層原因仍未確認。

r1 snapshot省略visualR、labelSeen、dangerRadius、blocked及heading.target等實際planner欄位，所以不能完整重播原決策。下一個[r2 runner](../grow-local-r2-20261126/README.md)以新iframe和document身份核對修正取證，原r1凍結來源不被覆寫。
