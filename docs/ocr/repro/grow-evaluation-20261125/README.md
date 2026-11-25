# OCR Grow 各版來源與 2026-11-25 測試歸檔

本次依使用者「繼續，把每個版本都放上 GitHub」的明確授權，保存 grow-12 基準及 grow-13～grow-17 的完整控制器、固定 protocol、重現程式與全部 80 次開局紀錄，並補齊歷史 grow-7～grow-12 的逐版來源入口。所有 grow-1～grow-17 的入口見 [版本索引](../../GROW-VERSIONS.md)。

這是測試材料歸檔。提交目標為 `test/ocr-test`，工作分支為 `feat/grow-evaluation-20261125`；實際同步狀態與核驗紀錄見 [publication.json](publication.json)。沒有以本次提交宣稱正式驗收、合併或網站部署。

## 本輪結果

原目標維持「可見遊戲結算顯示在 150 秒內達到體型 200，v2.13 與本輪開始時查得的最新版 v2.22 各自至少 50%」。本輪沒有候選同時達成兩版目標。

### 獨立確認

| 候選 | 遊戲 | 全部開局／原生 final | ≤150 秒過關 | 死亡 | 到時停止 | 成功／全部開局 | Wilson 95% 區間 |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| [grow-15](../grow-15/README.md) | v2.13 | 12／12 | 11 | 0 | 1 | 11/12（91.7%） | 64.6%–98.5% |
| [grow-15](../grow-15/README.md) | v2.22 | 12／12 | 5 | 4 | 3 | 5/12（41.7%） | 19.3%–68.0% |
| [grow-16](../grow-16/README.md) | v2.22 | 12／12 | 5 | 6 | 1 | 5/12（41.7%） | 19.3%–68.0% |
| [grow-17](../grow-17/README.md) | v2.22 | 12／12 | 3 | 6 | 3 | 3/12（25.0%） | 8.9%–53.2% |

確認 48 局均有原生 final；探索未加入確認分母。grow-16／17 沒有新 v2.13 實測，不把 grow-15 的 11/12 改名為後續候選的結果。

### 探索與基準

| 候選 | v2.13 過關／全部開局 | v2.22 過關／全部開局 | 主要變更與後續 |
| --- | --- | --- | --- |
| [grow-12](../grow-12/README.md) | 0/2 | 0/2 | 原對照；本輪 4 局與歷史合成測試分開。 |
| [grow-13](../grow-13/README.md) | 1/2 | 0/2 | 全尺寸使用成長／接觸時間規劃與兩段路徑；未進確認。 |
| [grow-14](../grow-14/README.md) | 2/4 | 1/4 | 原尺寸 2000 寬擷取、嚴格小地圖辨識；v2.22 含兩次基礎設施中斷，未進確認。 |
| [grow-15](../grow-15/README.md) | 4/4 | 3/4 | 通過幾何一致性檢查時，以 NPC 亮斑估計中心／半徑；完成雙版本確認。 |
| [grow-16](../grow-16/README.md) | 未新增 | 2/4 | v2.22 的已確認紅色本體採上界 200；完成單版本確認。 |
| [grow-17](../grow-17/README.md) | 未新增 | 2/4 | 直接以 grow-15 為父版，在 cap immunity 階段停用未見白點的探索效用；完成單版本確認。 |

總計 32 次探索＋48 次確認＝80 次開局；78 個原生 final，另有 2 個以獨立 sidecar 明確分類的基礎設施失敗。兩個原始缺失 final 沒有被補造、刪除或換局。完整機器可讀計數見 [evaluation-summary.json](bundle/results/evaluation-summary.json)；僅原生事件的結果見 [raw-native-summary.json](bundle/results/raw-native-summary.json)。

## 檔案與來源

| 入口 | 內容 |
| --- | --- |
| [原始完整報告](bundle/README.md) | 凍結時的方法、逐局結果、限制、原始 hash、所有建置與測試命令。 |
| [凍結檔案校驗表](bundle/CHECKSUMS.sha256) | 原包 111 個內容檔的 SHA-256；校驗表本身不列入自身校驗。 |
| [控制器與實驗來源](bundle/source/) | grow-12 基準、grow-13～17、grow-14 recovery、全部必要 planner／harness／合成檢查碼。 |
| [無像素原始證據與統計](bundle/results/) | 6 份完整 JSONL、兩份中斷 sidecar、診斷、彙整器與統計。 |
| [遊戲相依清單](game-source-dependencies.json) | 10 個重複來源位置對應至 repo 已有的兩個固定遊戲檔；含 Git blob、SHA-256 與長度。 |
| [本機相依還原程式](materialize-game-sources.mjs) | 先核對既有來源，再複製至原凍結路徑；不下載，不覆寫不同內容。 |

GitHub 發布基底為 [`46b8aa3f8207ed03bc89c84c6ed896a23bcd5601`](https://github.com/gg-dot1980/slime/tree/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601)。實測策略的 Sites checkout 來源 commit 是 `14c1815351b32096b325e032331b90c1f7873159`；此識別沒有被假定為 GitHub 可取得的 commit，所以候選控制器以完整檔案及 hash 保存。

兩個遊戲來源已存在於上述 GitHub 基底：

| 遊戲 | 固定公開來源 | SHA-256 |
| --- | --- | --- |
| v2.13 | [src/game-v2.13.html](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/src/game-v2.13.html) | `94944ef137412e93817754791c64cf7803a94f25222a8922fe8aa6936ea46d97` |
| v2.22 | [src/game.html](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/src/game.html) | `d0349b70c0be4666142f0ed880adb1b1636bcd6d7bf32a13d0d90246899c6d14` |

公開 `bundle/` 直接存放原包的 **102 檔**，每檔位元不變。另 10 個重複遊戲 HTML 帶有既有 favicon 資產，依存放規則不再次上傳；以既有公開來源作為明確依賴，在本機還原後取得完整 **112 檔**並通過原校驗表。不刪改遊戲規則、不清洗測試來源，也不更換凍結的遊戲／頁面／protocol hash。直接查看原報告中的相依路徑前，請先執行下方還原步驟。

原包 `bundle/README.md` 與 `bundle/EVALUATION_STATUS.txt` 保留上次封存當時「GitHub 尚未授權／未提交」的歷史狀態。使用者此次已明確授權上傳；本次遠端狀態以外層 [publication.json](publication.json) 及實際 commit／PR 為準。保留舊文是為了維持原檔 hash，不應解讀為此次仍待授權。

## 從完整 checkout 重現

使用 Node 24，原包實測為 v24.22.3，沒有外部 npm 依賴或套件安裝。從本 PR 分支的完整 repository checkout 開始：

```sh
git clone --branch feat/grow-evaluation-20261125 --single-branch https://github.com/gg-dot1980/slime.git
cd slime
node docs/ocr/repro/grow-evaluation-20261125/materialize-game-sources.mjs
cd docs/ocr/repro/grow-evaluation-20261125/bundle
sha256sum -c CHECKSUMS.sha256
GROW_SUMMARY_PATH="$(mktemp)"
node results/summarize-evaluation.mjs > "$GROW_SUMMARY_PATH"
cmp "$GROW_SUMMARY_PATH" results/evaluation-summary.json
```

還原程式先驗證 repo 內既有來源的長度、Git blob 與 SHA-256；不同就停止，不猜用最新版。可重複執行，相同目的檔保留、不同檔拒絕覆寫。完整 clone 已帶入指定依賴，無須啟動遊戲或連線到正式站。

若需要重建候選頁面，從已還原的 `bundle/` 複製 `source/` 到新的工作目錄，依 [原始報告第 9 節](bundle/README.md#9-乾淨重建檢查與重跑) 或逐版 README 執行。建置會產生新的 `createdAt`／`protocolHash`；重建頁面可核對原 `pageHash`，新的 batch metadata 不能冒充歷史 protocol。禁止在封存目錄直接重跑遊戲或覆寫原始事件。

安全停止與新實驗啟動方法見各版 README：先停止控制器並確認方向鍵／Space 釋放，再停止本機服務。此次上傳工作沒有新增實戰局。

## 證據範圍

本輪為 Linux x86_64、Node v24.22.3、有視窗 Chrome/156.0.0.0；單前景遊戲、canvas 2000×1163、DPR1。外層 viewport 在 grow-15 起有所變化，原報告逐批保留實際值；硬體完整型號未知。自然 Math.random 的 seed 未固定也未記錄，不能逐幀重播同一隨機局。

控制器讀可見畫面／HUD，以方向鍵與 Space 操作。遊戲副本停用排行榜及網路持久化，保留已記錄的小地圖相容層；測試不能直接外推到所有公開頁面、視野或裝置。v2.22 是開始時版本 API 的成功回應；結束時重查為 HTTP 403，這一限制保留在原結果中。

50% 是本輪事前固定的觀察比例門檻，不是長期機率保證。未涵蓋 v2.20、v2.21、手機或完整正式 OCR4 驗收；不合併不同候選、版本或 phase 的分母。歷史 grow-1～12 的合成／離線證據也未冒充本輪自然遊戲結果。

適用 [SPEC](../../SPEC.md)、[GITHUB-STORAGE v1](../../GITHUB-STORAGE.md)、[TESTING](../../TESTING.md) 與 [main 協作指南](https://github.com/gg-dot1980/slime/blob/main/CONTRIBUTING.md)。保存失敗與未知；未新增實戰影像、影片、像素／內嵌影像日誌、秘密或部署設定。

