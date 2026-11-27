# grow-13｜全體型截獲收益規劃與 grow-12 對照

固定入口更新：2026-11-25（台灣時間）。結果依據截至 **2026-11-25 12:05:07.093 UTC+8** 的封存證據；本次工作是歸檔已測材料。

本候選探索為 v2.13 **1/2**、v2.22 **0/2**；未通過兩版各至少 1/2 的篩選，`confirm-01` 沒有開局。相同探索批次另有 grow-12 對照各版 0/2，必須與候選分開。 正式 OCR4 驗收尚未完成。

共用完整材料：[原封存報告（歷史內容）](../grow-evaluation-20261125/bundle/README.md)、[完整審查摘要](../grow-evaluation-20261125/bundle/results/evaluation-summary.json)、[原生摘要](../grow-evaluation-20261125/bundle/results/raw-native-summary.json)、[整包檔案校驗表](../grow-evaluation-20261125/bundle/CHECKSUMS.sha256)。下列數字取自 evaluation-summary 的 groups／confirmationGates，沒有由成功案例推估總局數。

## 1. 版本、來源與交接範圍

| 項目 | 固定識別／狀態 |
| --- | --- |
| Repo／OCR 權威分支 | `gg-dot1980/slime`／`test/ocr-test` |
| 本入口策略 | `grow-13`；探索 `screen-01`；條件式確認 `confirm-01` |
| 父版本／起點 | grow-12 固定頁面／辨識基底；同批比較基線 |
| Sites 原始碼基底 | `14c1815351b32096b325e032331b90c1f7873159`；是當時 Sites checkout 識別，未確認可作 GitHub source commit 回讀 |
| GitHub 歸檔發布基底 | [46b8aa3f8207ed03bc89c84c6ed896a23bcd5601](https://github.com/gg-dot1980/slime/tree/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601)；與上列 Sites 基底分開 |
| 候選原始 GitHub commit | 建立／測試當時未有可回讀 commit；以完整 source、manifest、各檔 hash 保存，不把歸檔基底稱為候選 source commit |
| 網站／正式驗收 | 本次歸檔不部署網站；本輪候選沒有替換公開 `/ocr-grow`；未宣稱 OCR4 驗收通過 |

原 bundle README 內的「GitHub 待授權／先前拒絕」是封存當時的歷史狀態，保留原文。本入口依使用者後續「繼續，把每個版本都放上 GitHub」授權建立；遠端提交與回讀狀態以此次歸檔提交及[交接索引](../../TEST-HANDOFF.md)為準，本文件不虛構候選建立時的 GitHub commit。

適用規範：[SPEC](../../SPEC.md)、[TESTING](../../TESTING.md)、[GITHUB-STORAGE v1](../../GITHUB-STORAGE.md)。本輪實測範圍是 v2.13／當時查得最新版 v2.22；本候選實際版本以下表為準。v2.20、v2.21 未在本輪新增驗收，手機跳過。[開局前公開版本回應](../grow-evaluation-20261125/bundle/results/live-version-verification.json)記錄當時 currentVersion=v2.22；[末次讀取](../grow-evaluation-20261125/bundle/results/final-version-read-attempt.json)為 HTTP 403，沒有末次即時版本複核。

## 2. 策略差異

起點是固定 grow-12 頁面與辨識層，新增 `planGrow13`，不是沿用 grow-12 的體型 90 切換政策。比較基線為同批 grow-12。

- 以畫面估計的 NPC 半徑區間判定可吃、近體型及危險；用估計吞食增長與截獲時間形成收益，食物也進入沿途收益。
- 每次比較 64 條兩段八方向路徑，時間步長 0.1 秒、共 2.2 秒，在第 0.6 秒轉向；結合成長、接近、危險與牆界評分。
- v2.22 使用已知尺寸上限 200；HUD ≥186 時沿用該規則推導的免疫處理。這是原 grow-13 已有的版本分支。
- 候選約每 100 ms 決策；同批 grow-12 約每 200 ms。固定遊戲 canvas 寬 2000，但 grow-13 的辨識 capture 仍縮至最多 1200。
- 保存的實際整合沒有為 grow-13 填入嚴格 `growMarkers`，因而使用寬鬆 `map.opportunities`。後續合成案例顯示灰色鏡頭框碎片可成為假機會點；本入口保留這個已測實作，不把後續修正套回舊結果。

## 3. 精確來源、依賴與遊戲還原

| 用途 | 精確來源 |
| --- | --- |
| 凍結 manifest | [source/experiments/grow13/manifest.json](../grow-evaluation-20261125/bundle/source/experiments/grow13/manifest.json) |
| planner | [source/experiments/grow13/planner.js](../grow-evaluation-20261125/bundle/source/experiments/grow13/planner.js) |
| build | [source/experiments/grow13/build-lab.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow13/build-lab.mjs) |
| harness | [source/experiments/grow13/harness.js](../grow-evaluation-20261125/bundle/source/experiments/grow13/harness.js) |
| 本機 server | [source/experiments/grow13/server.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow13/server.mjs) |
| 共用 package / npm scripts | [source/package.json](../grow-evaluation-20261125/bundle/source/package.json) |
| 固定 grow-12 基底頁面 | [source/src/ocr-grow.html](../grow-evaluation-20261125/bundle/source/src/ocr-grow.html) |
| 遊戲隔離器 | [source/scripts/grow-games.mjs](../grow-evaluation-20261125/bundle/source/scripts/grow-games.mjs) |
| 受控小地圖案例 | [source/experiments/grow13/check-minimap-next.cjs](../grow-evaluation-20261125/bundle/source/experiments/grow13/check-minimap-next.cjs) |
| 原生數值統計器 | [source/experiments/grow13/summarize.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow13/summarize.mjs) |
| 審查註記／邏輯位置彙整器 | [results/summarize-evaluation.mjs](../grow-evaluation-20261125/bundle/results/summarize-evaluation.mjs) |

遊戲 HTML 與 GitHub 基底既有檔案 byte 相同。公開 bundle 不重傳這十份含既有 favicon 的重複遊戲檔；先在完整 repo 根目錄執行[固定 hash 還原器](../grow-evaluation-20261125/materialize-game-sources.mjs)，才進入 `bundle/source` 建置。還原器從既有 repo `src` 檔複製到各版需要的位置；原 bundle 報告及 CHECKSUMS 保留不變。不要只下載本版 planner，或在未還原時把缺少遊戲檔誤認為缺少測試紀錄。

| 遊戲／建置依賴 | 既有固定 GitHub 原檔 | sourceHash | isolatedHash |
| --- | --- | --- | --- |
| v2.13 | [src/game-v2.13.html](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/src/game-v2.13.html) | `94944ef137412e93817754791c64cf7803a94f25222a8922fe8aa6936ea46d97` | `6b2cb0df57472c0a5064a6f6154eef22d9c3638affe9ace637a25e7414f4823a` |
| v2.22 | [src/game.html](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/src/game.html) | `d0349b70c0be4666142f0ed880adb1b1636bcd6d7bf32a13d0d90246899c6d14` | `df6904418ef921c6eb30bceb16008c2d03042716a18840a0604f1306df967cd8` |


隔離器停用排行榜／網路持久化，沿用可見小地圖相容層（中性色鏡頭框、先框後 NPC）；物理、成長、吞食與過關規則沿用固定遊戲來源。這是隔離測試頁，不等於已驗證所有公開部署與視野。grow-16／17 的 v2.13 檔仍屬建置依賴，不能據檔案存在算成實跑樣本。

## 4. 批次與完整分母

`screen-01` 依 manifest 使用每版本 ABBA：grow-12、grow-13、grow-13、grow-12，兩個版本交錯，共 8 個 start，其中 grow-13 為 4 個。候選須兩版各至少 1/2 才能進入條件式 `confirm-01` 每版 12 個新局；該 gate 未達，確認實際 start=0，未執行不填成 0% 勝率。

主比例為 **本 phase／本遊戲版本的 win_le150 ÷ 全部已記錄 start**；死亡、到時停止和 reviewer 分類的 infra 均保留在該作業分母。native final 指 harness 原生 final 紀錄，包含死亡或截止，不能解讀成成功。成功依本局可見結算及遊戲耗時 ≤150 秒判定；最後 HUD 大小與牆鐘不替代結算。

| 策略／批次 | 遊戲 | 預定／已開局 | 原生 final | ≤150 秒勝 | 死亡 | 到時停止 | infra | 成功／全部 start；Wilson 95% |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| grow-12 / `screen-01` | v2.13 | 2/2 | 2 | 0 | 1 | 1 | 0 | 0/2 = 0.0%；0.0%–65.8% |
| grow-12 / `screen-01` | v2.22 | 2/2 | 2 | 0 | 0 | 2 | 0 | 0/2 = 0.0%；0.0%–65.8% |
| grow-13 / `screen-01` | v2.13 | 2/2 | 2 | 1 | 0 | 1 | 0 | 1/2 = 50.0%；9.5%–90.5% |
| grow-13 / `screen-01` | v2.22 | 2/2 | 2 | 0 | 1 | 1 | 0 | 0/2 = 0.0%；0.0%–65.8% |

本入口各已執行組的 late win、遊戲 300 秒 timeout、controller_abort、審查後 unknown／in_progress 均為 0。grow-13 自身共 **4 個 start、4 個原生 final**；上述比例不合併探索與確認。整個共用包另保存其他候選／grow-12 對照，總計 80 starts、78 native finals、2 reviewer infra，並非本候選的新樣本量。

- `screen-01`／v2.13：成功局 n=1；遊戲時間中位數 148 秒，最大 148 秒。
- `screen-01`／v2.22：成功局 n=0；遊戲時間中位數 — 秒，最大 — 秒。

Wilson 區間只表達有限樣本的不確定性，沒有對連續候選選擇作多重比較校正；它不證明長期成功機率 ≥50%。不同候選是未固定 seed 的自然新局，比例差異不能單獨建立因果優劣。完整 runId、logical／physical 對映與 counts 欄位在 [evaluation-summary.json](../grow-evaluation-20261125/bundle/results/evaluation-summary.json)，未把探索或其他版本填入確認分母。


## 5. 對應原始紀錄與結果

| 對應原始紀錄／結果／檢查 | 檔案 SHA-256 |
| --- | --- |
| [screen-01-events-noimages.jsonl](../grow-evaluation-20261125/bundle/results/screen-01-events-noimages.jsonl) | `dd18b3fbd7b6bb54cc26e1a39b2500b4d6e2cfe0bc63022b9852c288c844f37c` |
| [screen-01-summary.json](../grow-evaluation-20261125/bundle/results/screen-01-summary.json) | `77370be9defb562493a9b83c3949787ac3a1e4c1ad5e588f227cdb4ebc689614` |

每份 JSONL 可能同時含探索與確認，須按 `batch`、`version`、`strategy` 分組。診斷檔是數值取樣及有界推論，不提供完整 hazard 身分、逐幀圖像或真正致死物件；沒有用診斷取代原生結果。原始檔及 sidecar 保持原封不動。

## 6. 環境、控制與隨機性

| 項目 | 已記錄條件 |
| --- | --- |
| 桌機環境 | Linux x86_64，有視窗 Chromium，user agent `Chrome/156.0.0.0`；由原生桌面介面啟動批次；實體硬體型號未完整保存 |
| Runtime／套件 | Node `v24.22.3`；原報告記 Linux kernel `6.18.57`；這些 build／check 使用 Node 標準庫，沒有外部 npm 安裝依賴或依賴鎖定檔 |
| 外層 viewport | `1363×936`；iframe CSS scale `0.479`，不可混稱其他候選所有 viewport 都相同 |
| 遊戲尺寸／DPR | iframe、canvas backing store、canvas CSS 均 `2000×1163`，DPR `1`；本候選 capture 寬 最多 1200（原遊戲畫布仍為 2000） |
| 輸入 | 已繪製 canvas、可見 HUD／按鈕；方向鍵加 Space boost，不以本局隱藏 player/slimes/碰撞狀態控制 |
| 執行 | concurrency=1、單局單前景頁面；language `en-US`、timezone `UTC`、hardwareConcurrency=9（不是完整 CPU 型號） |
| 排程／停止 | 候選約 100 ms；辨識／規劃逾 200 ms 停止釋鍵，記 compute_overrun；單局牆鐘保護 300 秒 |
| Seed | 自然 `Math.random`，未知、未固定、未注入；無法逐幀重現相同隨機局 |

## 7. 乾淨命令與安全停止

以下是從完整 repo 的**全新工作副本**重建／檢查的方法。歸檔本次只核對文件與連結，沒有重跑遊戲；不要在原封存 bundle 上重建後覆蓋歷史 manifest／結果。

```sh
# 從完整 repo 的乾淨工作副本根目錄開始
node docs/ocr/repro/grow-evaluation-20261125/materialize-game-sources.mjs
# 還原完成後、任何重建之前，核對原封存清單
(cd docs/ocr/repro/grow-evaluation-20261125/bundle && sha256sum -c CHECKSUMS.sha256)
cd docs/ocr/repro/grow-evaluation-20261125/bundle/source
node --version  # 已記錄的 runtime 是 v24.22.3
cp experiments/grow13/manifest.json experiments/grow13/manifest.frozen.json
npm run build:grow13
node --check experiments/grow13/planner.js
node --check experiments/grow13/harness.js
node experiments/grow13/check-minimap-next.cjs experiments/grow13/index.html
node --check experiments/grow13/server.mjs
```

```sh
# cwd 仍為 bundle/source
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='experiments/grow13/';
const expected=JSON.parse(readFileSync(dir+'manifest.frozen.json','utf8'));
const rebuilt=JSON.parse(readFileSync(dir+'manifest.json','utf8'));
const hash=createHash('sha256').update(readFileSync(dir+'index.html')).digest('hex');
assert.equal(hash,expected.pageHash);
for(const key of ['sourceHash','plannerHash','harnessHash','buildHash','isolationHash','geometryHash'])
  if(expected[key])assert.equal(rebuilt[key],expected[key],key);
assert.deepEqual(rebuilt.games,expected.games);
console.log('frozen source and rebuilt page hashes match');
NODE
```

重建會更新 `createdAt` 與衍生的 protocolHash；pageHash 與來源 hash 應相同。新 protocol metadata 不能冒用成舊批次。原凍結報告保存此版乾淨建置與 pageHash 核對紀錄。小地圖腳本是在記憶體內生成受控像素，說明寬鬆／嚴格 detector 的差異；不是歷史遊戲畫面的重播，也不證明 grow-13 實際已接上嚴格 markers。

只讀重算本版原生事件，以及套用 sidecar 的整包摘要（不加 `--write`，只輸出到 stdout）：

```sh
# cwd: bundle/source
node experiments/grow13/summarize.mjs ../results/screen-01-events-noimages.jsonl
node ../results/summarize-evaluation.mjs
```

如另外安排新實戰，須在獨立工作副本、保留新的全部 start／manifest，先確認所用環境的預覽管理規則，再使用下列本機入口；歸檔本次沒有執行這個啟動命令：

```sh
# cwd: bundle/source；單一獨立本機服務
PORT=4173 npm run dev:grow13
```

以有視窗 Chromium 開啟 `http://127.0.0.1:4173/`，按本頁探索按鈕；確認只會依本頁 gate 開啟。先按「停止批次」／「停止並暫停」讓控制器釋鍵，再以 Ctrl+C 停止自己啟動的本機 server。受管共用環境使用其官方預覽生命週期，不另啟第二服務。重新整理會丟失頁內 gate 狀態；server 會拒絕同一事件檔重複 batch_start，不刪失敗記錄重用批次。新自然局不能替代本入口封存的任何局。

## 8. 凍結識別與限制

| 識別 | SHA-256 |
| --- | --- |
| sourceHash | `e9d818294509cca36ccc41826c8138008705d313c99ba4cc28e21bd427dc1a6b` |
| plannerHash | `ed093720354b5798769777498bfd64ae429fe23fc64f77205b6a7025ec046e24` |
| harnessHash | `8d43cd9ff97c74fa1e8884caf5a14a4b205cdcdb65cfa92393a96d58f46ed422` |
| buildHash | `2509e38b38569aa5a033ea8d64df83facc2ea7dd597d3edd776309ae2b972153` |
| pageHash | `346a8b86b4b8117ec671b50525fa05d7ca6a24e783f2746be59a6833d4f3ed56` |
| isolationHash | `00908ab8787f32be3f732f98b56d0f6e432f2ebfef4ae64cecebb1697ca3122f` |
| manifest 檔案 bytes | `329c3356d317cb8de5a6ae4ec4c73c9aaed839e86f56cc837f78b32867395d09` |
| protocolHash | `dfce08af3a3392914f67d33234cfb3962a52f0ee5accfc39305448ae934d0f18` |

`protocolHash` 是 manifest 尚未加上 protocolHash 欄位時，對 `JSON.stringify(manifest)` 的 SHA-256；它不是格式化 manifest 檔案 bytes 的 hash。其餘完整檔案與結果雜湊可用 [CHECKSUMS.sha256](../grow-evaluation-20261125/bundle/CHECKSUMS.sha256) 核對；先還原遊戲依賴，再核對原清單。

本入口保存／連結來源、設定、數值日誌、結果與檢查，沒有歷史截圖、影片、內嵌實戰影像或原始逐幀像素；合成 fixture 只在執行時建立測試輸入。因此可重建同一頁面並重算結果，不能僅憑 GitHub 重新辨識歷史畫面或完整重播本局。缺 seed、單一桌機環境、小樣本與候選選擇限制仍在。正式每版驗收樣本及全支援版本條件按 SPEC，這份歸檔不宣稱已完成。
