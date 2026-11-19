# OCR 獨立測試與驗收

## Workflow POC 分支增量（未合併）

本分支新增可執行 `npm run doctor`、`npm run smoke`、`npm run regression` 及 `npm run release:drill`，限定無像素r228數值回放／暫存產物演練；詳見[固定POC入口](repro/workflow-poc/README.md)。以下v1的「尚未實作」描述保留為導入前狀態：acceptance仍未實作，前三項只補此最小範圍，不是瀏覽器或正式驗收runner。PR的GitHub-hosted workflow已提出，須以實際check結果確認執行，不能僅以YAML宣稱啟用或通過。

文件版本 v1 · 2026-11-19（台灣時間）；唯一權威分支 `test/ocr-test`。配合 [SPEC](SPEC.md)、[GitHub 存放規則 v1](GITHUB-STORAGE.md)、[交接索引](TEST-HANDOFF.md) 與 [main 協作指南](https://github.com/gg-dot1980/slime/blob/main/CONTRIBUTING.md)。本文件建立流程與證據契約，**沒有新增 runner、CI、權限或正式驗收結果**。

## 人或 AI 都依相同證據

作者可用 AI 編寫／執行腳本及協助 review，但 Pass 必須來自固定腳本斷言、可稽核輸出和客觀結算結果，不能由 AI 口頭判定。作者不得改門檻、挑 seed、挑樣本或排除失敗來取得 Pass。必要的測試修正另列理由與 diff，重新固定 protocol，不沿用舊結果冒充新版本。

獨立 reviewer 或既有受信任 CI 從**同一固定 commit**、乾淨 checkout 核對命令、條件及結果；獨立人或 AI 測試者須記錄自己的環境與執行紀錄。測試者／reviewer 與作者、具合併權限的維護者分工；AI review 不取代人類批准。本文件不代表 CI 或 @codex review 已啟用。

## 分層 PR 檢查

先判定 diff 風險、列出適用層級；不適用要寫理由，未跑不能填通過。

| 層級 | 要核對的內容 |
|---|---|
| 乾淨來源與環境 | repo、branch、固定 commit、工作樹差異、依賴鎖定與 runtime／瀏覽器；清楚區分真實設備與模擬 |
| 環境檢查與 smoke | 必要檔案／設定可讀、最小建置或載入、測試入口可停止；不以 smoke 當過關 |
| 靜態檢查（適用時） | 語法、型別／lint（已有且適用才執行）、引用與禁止材料；文件 PR 檢查文字、連結及 Markdown diff |
| 單元 | 邊界、錯誤、缺值、重複／過期輸入及停止；依變更選必要案例，不以鏡像實作測試充數 |
| 整合 | 感知→追蹤→決策→輸入與紀錄的介面及時序；不可將未知當可吃或遺失錯誤紀錄 |
| 固定樣本回歸 | 保留成功、失敗、牆界、威脅、誤判與未知；開發／留出分開，凍結後不反覆調參求通過 |
| 少量端到端（改瀏覽器流程時） | 實際啟動→按鍵→結算或明確中止→釋放控制，驗證無卡鍵／過期派送；有界局數事前指定 |

純文件 PR 僅做適用的文件、連結、範圍檢查；不為文件重跑遊戲。改策略或發布時，依風險另加版本相容及基線／候選性能對照，保留延遲、缺幀、資源和安全回歸。性能預算依 batch protocol 固定，未訂為 TBD，不把歷史診斷門檻自行當成全域驗收。

## 正式 OCR4 驗收與批次凍結

以 SPEC 為準：桌機所有受支援版本（目前已核實 v2.13、v2.20、v2.21、v2.22）各自 150 秒內過關率至少 50%；手機跳過（不是通過）。新增版本須納入，不以跨版本平均代替。正式每版本樣本量、確認批次／統計準則及統一環境尚為 TBD，必須在正式批次開始前明定，樣本不足不得宣稱達標。

測前固定並保存：遊戲與策略 commit／hash、環境和視野/DPR、A/B 條件、開發／留出樣本、seed 或其未知、預定局數及順序、遊戲計時來源、150 秒判準、停止與重試／補跑規則、基礎設施錯誤分類與分母政策。不得局中換策略或依結果選 seed。隨機性未受控不能保證逐幀重現。

- 以本局可見結算勝負和遊戲時間判定；150 秒內明確過關才是合格成功。死亡與超時是**有效失敗**，不可排除；過期才過關仍不符合150秒要求。
- 基礎設施錯誤、頁面崩潰、取證或控制中止另列，不計為死亡或過關；保留每個開局、錯誤和缺失。不得悄悄刪除或換局；補跑只按事前 protocol，原失敗紀錄仍在。
- 分別列全部開局、有效完成局、合格過關、死亡、超時、基礎設施錯誤、中止、未知、排除理由；每個比例明列分母。正式分母／補跑政策未定時按 SPEC 標 TBD，不宣稱驗收完成。
- 靜態／合成／回放與診斷不替代實際遊戲。小批次成功只報觀察值與限制，不宣稱長期保證。完整正式驗收與部署授權均滿足後，才考慮獨立發布 PR。

## 測試入口：現況與規劃

以下是入口命名契約，**doctor / smoke / regression / acceptance 尚未實作為統一 CLI 或 npm scripts**；不得把它們當可執行命令。後續另有授權才新增 runner。

| 規劃入口 | 預期責任 | 目前狀態 |
|---|---|---|
| doctor | 固定 commit、環境／依賴／檔案／權限可用性；輸出 unknown 與 blocker | 規劃，未實作 |
| smoke | 最小載入、啟動／停止及釋放；不跑整批勝率 | 規劃，未實作 |
| regression | 選定固定樣本、單元與整合；斷言／差異及失敗證據 | 規劃，未實作；下方僅有個別既有腳本 |
| acceptance | 依凍結 protocol 跑逐版本實戰批次與完整分母 | 規劃，未實作；不得自行補出通過結論 |

### 已核對來源的個別指令

在 test/ocr-test 基底 `a6add5285fe3dfed04435424c95043efc0e5b47c` 核對下列程式。從該 commit 的 repo 根目錄執行；「來源已核對」不等於本文件階段已執行或可代表 OCR4。

| 指令 | 前提／作用 | 限制與本次狀態 |
|---|---|---|
| `node scripts/build.mjs` | Node，完整 repo 的 src 檔；建置本機 dist | package.json 的 build 指向它；本次未執行，不是部署 |
| `node scripts/check-ocr-index.mjs` | 先完成上方 build；Node 支援 Request/Response | 檢查舊 OCR 路由、索引與原邏輯 hash；本次未執行，不是 OCR4 相容或勝率 |
| `node docs/ocr/repro/r228/replay.cjs` | 完整 r228 目錄，Node24.22.1，僅標準庫 | [r228](repro/r228/README.md) 的18幀數值回放；歷史已跑，此文件階段未重跑；不是實戰 |
| `node scripts/check-ocr3-result.cjs` | Node，src/ocr3.html | **舊 OCR3 的110秒結果測試**，拒絕1:50；不能作現行OCR4的150秒 gate，本次未執行 |

目前 package.json 僅列 build、db:generate、dev，沒有通用 test/doctor/smoke/regression/acceptance script。不要猜 `npm test` 可用；也不要為 smoke 啟動未授權伺服器或讀正式站憑證。新的測試命令須先核對／實作並記錄依賴、版本與停止方式後，才列為可執行。

## 無像素證據 JSON 契約（規劃，不是已存在 validator）

以下是欄位範例，不是測試結果；null 代表未執行／未設定，不能被當成零或 Pass。未新增 schema validator。

```json
{
  "schemaVersion": 1,
  "status": "not_run",
  "kind": "live|replay|synthetic|documentation",
  "repo": "gg-dot1980/slime",
  "branch": "test/ocr-test",
  "baseCommit": null,
  "testedCommit": null,
  "gameVersion": null,
  "strategyVersion": null,
  "sourceHashes": {},
  "environment": {
    "os": null, "device": null, "browser": null,
    "runtime": null, "viewport": null, "dpr": null,
    "physicalOrSimulated": null
  },
  "commands": [],
  "protocol": {
    "id": null, "sampleIds": [], "seed": null,
    "seedStatus": "unknown", "plannedStarts": null,
    "timingSource": null, "deadlineSeconds": 150,
    "retryPolicy": null, "denominatorPolicy": null
  },
  "counts": {
    "starts": null, "validCompleted": null,
    "winsWithinDeadline": null, "deaths": null,
    "timeouts": null, "infrastructureErrors": null,
    "aborts": null, "unknown": null,
    "rateNumerator": null, "rateDenominator": null
  },
  "runs": [],
  "exclusions": [],
  "assertions": [],
  "artifactHashes": {},
  "limitations": [],
  "independentVerification": {
    "reviewerOrCi": null, "testedCommit": null,
    "status": "not_verified"
  }
}
```

每個 run 記樣本ID、結果分類、可見遊戲時間、停止原因及證據參照；exclusions 列樣本ID、事前規則、排除理由，原開局仍保留。計數避免死亡／超時／中止互相重複，若觀測衝突標 unknown。各版本／環境分表或分 JSON，不能只交合併數字。GitHub 僅保留無像素 JSON、程式、設定、摘要與 hash；影像及可還原影像的嵌入資料不上傳。

## 隔離與保存

外部 fork 的程式或 workflow 不在私人 NUC 執行，不取得正式站憑證、部署 token 或私人資料。僅在獲准隔離環境以受限權限測試；缺權限回報，不繞過。不得為此文件變更 CI、runner、ruleset 或合併權限。

按 GITHUB-STORAGE v1 保存逐版入口與交接索引；明列哪些需本機影像才能重驗。權威文件更新時同步各分支 AGENTS 的連結及 main 指南／PR 範本入口，不複製全文到其他分支。固定規格、客觀斷言、完整失敗與獨立核對缺一不可；未知就保留未知。
