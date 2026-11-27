# grow-16｜v2.22 紅色本體尺寸上界 200

固定入口更新：2026-11-25（台灣時間）。結果依據截至 **2026-11-25 12:05:07.093 UTC+8** 的封存證據；本次工作是歸檔已測材料。

只新增 v2.22 實戰：探索 **2/4**，獨立確認 **5/12（41.7%）**，少於要求的 6/12。v2.13 沒有新樣本；可復用的不變政策證據仍歸屬 grow-15 `confirm-03` 的 11/12。 正式 OCR4 驗收尚未完成。

共用完整材料：[原封存報告（歷史內容）](../grow-evaluation-20261125/bundle/README.md)、[完整審查摘要](../grow-evaluation-20261125/bundle/results/evaluation-summary.json)、[原生摘要](../grow-evaluation-20261125/bundle/results/raw-native-summary.json)、[整包檔案校驗表](../grow-evaluation-20261125/bundle/CHECKSUMS.sha256)。下列數字取自 evaluation-summary 的 groups／confirmationGates，沒有由成功案例推估總局數。

## 1. 版本、來源與交接範圍

| 項目 | 固定識別／狀態 |
| --- | --- |
| Repo／OCR 權威分支 | `gg-dot1980/slime`／`test/ocr-test` |
| 本入口策略 | `grow-16`；探索 `screen-04`；條件式確認 `confirm-04` |
| 父版本／起點 | grow-15 |
| Sites 原始碼基底 | `14c1815351b32096b325e032331b90c1f7873159`；是當時 Sites checkout 識別，未確認可作 GitHub source commit 回讀 |
| GitHub 歸檔發布基底 | [46b8aa3f8207ed03bc89c84c6ed896a23bcd5601](https://github.com/gg-dot1980/slime/tree/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601)；與上列 Sites 基底分開 |
| 候選原始 GitHub commit | 建立／測試當時未有可回讀 commit；以完整 source、manifest、各檔 hash 保存，不把歸檔基底稱為候選 source commit |
| 網站／正式驗收 | 本次歸檔不部署網站；本輪候選沒有替換公開 `/ocr-grow`；未宣稱 OCR4 驗收通過 |

原 bundle README 內的「GitHub 待授權／先前拒絕」是封存當時的歷史狀態，保留原文。本入口依使用者後續「繼續，把每個版本都放上 GitHub」授權建立；遠端提交與回讀狀態以此次歸檔提交及[交接索引](../../TEST-HANDOFF.md)為準，本文件不虛構候選建立時的 GitHub commit。

適用規範：[SPEC](../../SPEC.md)、[TESTING](../../TESTING.md)、[GITHUB-STORAGE v1](../../GITHUB-STORAGE.md)。本輪實測範圍是 v2.13／當時查得最新版 v2.22；本候選實際版本以下表為準。v2.20、v2.21 未在本輪新增驗收，手機跳過。[開局前公開版本回應](../grow-evaluation-20261125/bundle/results/live-version-verification.json)記錄當時 currentVersion=v2.22；[末次讀取](../grow-evaluation-20261125/bundle/results/final-version-read-attempt.json)為 HTTP 403，沒有末次即時版本複核。

## 2. 策略差異

父版本為 [grow-15](../grow-15/README.md)。planner 只有一行 expression 改動：

```diff
- if (red && !immune) o.upper = Math.max(o.upper, Math.min(cappedGame ? 200 : Infinity, playerHigh * 1.12));
+ if (red && !immune) o.upper = cappedGame ? 200 : Math.max(o.upper, Math.min(cappedGame ? 200 : Infinity, playerHigh * 1.12));
```

`red` 是 `o.isRed || o.mapRed`。效果限於 v2.22、HUD <186、已確認紅色本體；未配對紅點原本已用 200。其他來源、幾何、分類、速度預測、neutral 處理、路徑與收益維持 grow-15。內部函式及輸出仍保留 `planGrow15`／`grow-15`，以便精確比較；harness 的候選與批次紀錄為 grow-16。

這是在危險範圍與成長速度間作保守取捨的可否證假說。先前死亡紀錄沒有保存所有 hazard 的配對、位置、尺寸與速度，不能把這項改動當成已證實的死因修復。35 個純 planner 案例支持預期程式差異，實戰確認仍為 5/12。

## 3. 精確來源、依賴與遊戲還原

| 用途 | 精確來源 |
| --- | --- |
| 凍結 manifest | [source/experiments/grow16/manifest.json](../grow-evaluation-20261125/bundle/source/experiments/grow16/manifest.json) |
| planner | [source/experiments/grow16/planner.js](../grow-evaluation-20261125/bundle/source/experiments/grow16/planner.js) |
| build | [source/experiments/grow16/build-lab.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow16/build-lab.mjs) |
| harness | [source/experiments/grow16/harness.js](../grow-evaluation-20261125/bundle/source/experiments/grow16/harness.js) |
| 本機 server | [source/experiments/grow16/server.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow16/server.mjs) |
| 共用 package / npm scripts | [source/package.json](../grow-evaluation-20261125/bundle/source/package.json) |
| 固定基底頁面 | [source/experiments/grow16/source-base.html](../grow-evaluation-20261125/bundle/source/experiments/grow16/source-base.html) |
| 幾何 refiner | [source/experiments/grow16/geometry.js](../grow-evaluation-20261125/bundle/source/experiments/grow16/geometry.js) |
| 遊戲隔離器 | [source/experiments/grow16/game-isolation.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow16/game-isolation.mjs) |
| 完整頁面 | [source/experiments/grow16/index.html](../grow-evaluation-20261125/bundle/source/experiments/grow16/index.html) |
| 凍結父 manifest | [source/experiments/grow16/parent-manifest.json](../grow-evaluation-20261125/bundle/source/experiments/grow16/parent-manifest.json) |
| 純 planner 回歸 | [source/experiments/grow16/check-planner.cjs](../grow-evaluation-20261125/bundle/source/experiments/grow16/check-planner.cjs) |
| 來源整合檢查 | [source/experiments/grow16/check-build.cjs](../grow-evaluation-20261125/bundle/source/experiments/grow16/check-build.cjs) |
| 檢查所需原 grow-15 planner | [source/experiments/grow15/frozen/screen-03/planner.js](../grow-evaluation-20261125/bundle/source/experiments/grow15/frozen/screen-03/planner.js) |
| 檢查所需原 grow-15 頁面 | [source/experiments/grow15/frozen/screen-03/index.html](../grow-evaluation-20261125/bundle/source/experiments/grow15/frozen/screen-03/index.html) |
| 原生數值統計器 | [source/experiments/grow13/summarize.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow13/summarize.mjs) |
| 審查註記／邏輯位置彙整器 | [results/summarize-evaluation.mjs](../grow-evaluation-20261125/bundle/results/summarize-evaluation.mjs) |

遊戲 HTML 與 GitHub 基底既有檔案 byte 相同。公開 bundle 不重傳這十份含既有 favicon 的重複遊戲檔；先在完整 repo 根目錄執行[固定 hash 還原器](../grow-evaluation-20261125/materialize-game-sources.mjs)，才進入 `bundle/source` 建置。還原器從既有 repo `src` 檔複製到各版需要的位置；原 bundle 報告及 CHECKSUMS 保留不變。不要只下載本版 planner，或在未還原時把缺少遊戲檔誤認為缺少測試紀錄。

| 遊戲／建置依賴 | 既有固定 GitHub 原檔 | sourceHash | isolatedHash |
| --- | --- | --- | --- |
| v2.13 | [src/game-v2.13.html](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/src/game-v2.13.html) | `94944ef137412e93817754791c64cf7803a94f25222a8922fe8aa6936ea46d97` | `6b2cb0df57472c0a5064a6f6154eef22d9c3638affe9ace637a25e7414f4823a` |
| v2.22 | [src/game.html](https://github.com/gg-dot1980/slime/blob/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601/src/game.html) | `d0349b70c0be4666142f0ed880adb1b1636bcd6d7bf32a13d0d90246899c6d14` | `df6904418ef921c6eb30bceb16008c2d03042716a18840a0604f1306df967cd8` |


隔離器停用排行榜／網路持久化，沿用可見小地圖相容層（中性色鏡頭框、先框後 NPC）；物理、成長、吞食與過關規則沿用固定遊戲來源。這是隔離測試頁，不等於已驗證所有公開部署與視野。grow-16／17 的 v2.13 檔仍屬建置依賴，不能據檔案存在算成實跑樣本。

## 4. 批次與完整分母

啟用前核對 grow-15 `confirm-03` 的 v2.22 已完成 12 個 final、只有 5 勝。`screen-04` 固定 4 個 v2.22 新局；4 個 final 且至少 2 勝才進入 `confirm-04` 的 12 個新局。本批四個探索 final 都有原生證據，門檻核對另附。沒有新 v2.13 批次。

主比例為 **本 phase／本遊戲版本的 win_le150 ÷ 全部已記錄 start**；死亡、到時停止和 reviewer 分類的 infra 均保留在該作業分母。native final 指 harness 原生 final 紀錄，包含死亡或截止，不能解讀成成功。成功依本局可見結算及遊戲耗時 ≤150 秒判定；最後 HUD 大小與牆鐘不替代結算。

| 策略／批次 | 遊戲 | 預定／已開局 | 原生 final | ≤150 秒勝 | 死亡 | 到時停止 | infra | 成功／全部 start；Wilson 95% |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| grow-16 / `screen-04` | v2.22 | 4/4 | 4 | 2 | 2 | 0 | 0 | 2/4 = 50.0%；15.0%–85.0% |
| grow-16 / `confirm-04` | v2.22 | 12/12 | 12 | 5 | 6 | 1 | 0 | 5/12 = 41.7%；19.3%–68.0% |

本入口各已執行組的 late win、遊戲 300 秒 timeout、controller_abort、審查後 unknown／in_progress 均為 0。grow-16 自身共 **16 個 start、16 個原生 final**；上述比例不合併探索與確認。整個共用包另保存其他候選／grow-12 對照，總計 80 starts、78 native finals、2 reviewer infra，並非本候選的新樣本量。

- `screen-04`／v2.22：成功局 n=2；遊戲時間中位數 133.5 秒，最大 141 秒。
- `confirm-04`／v2.22：成功局 n=5；遊戲時間中位數 125 秒，最大 147 秒。

Wilson 區間只表達有限樣本的不確定性，沒有對連續候選選擇作多重比較校正；它不證明長期成功機率 ≥50%。不同候選是未固定 seed 的自然新局，比例差異不能單獨建立因果優劣。完整 runId、logical／physical 對映與 counts 欄位在 [evaluation-summary.json](../grow-evaluation-20261125/bundle/results/evaluation-summary.json)，未把探索或其他版本填入確認分母。

### v2.13 證據的歸屬

這版沒有新的 v2.13 start、final 或確認樣本。來源／純函式對照支持該分支與 grow-15 一致；可引用的 11/12 必須標為 **grow-15／confirm-03／v2.13**，不能改名為本版的新實戰，也不能補入本版 v2.22 分母。

## 5. 對應原始紀錄與結果

| 對應原始紀錄／結果／檢查 | 檔案 SHA-256 |
| --- | --- |
| [screen-04-events-noimages.jsonl](../grow-evaluation-20261125/bundle/results/screen-04-events-noimages.jsonl) | `33d617a8495245e8d1acdfc233e2efb65ec58997fc1996e612edc877de2fa398` |
| [grow16-activation-verification.json](../grow-evaluation-20261125/bundle/results/grow16-activation-verification.json) | `08fc1d60f5f6a9ef828326306acd825ab42532e9327e7e7a8d83d7aba915ca4a` |
| [grow16-confirmation-gate-verification.json](../grow-evaluation-20261125/bundle/results/grow16-confirmation-gate-verification.json) | `238fde9537be6160c45dba8a7fe87aa20394c2c6fb3dc772a1e595aaa92f7a75` |
| [grow16-clean-build-verification.json](../grow-evaluation-20261125/bundle/results/grow16-clean-build-verification.json) | `539227ee43c2c767618e0ab049004e49154591ec6e32b8151e1c71f18c3795b3` |

每份 JSONL 可能同時含探索與確認，須按 `batch`、`version`、`strategy` 分組。診斷檔是數值取樣及有界推論，不提供完整 hazard 身分、逐幀圖像或真正致死物件；沒有用診斷取代原生結果。原始檔及 sidecar 保持原封不動。

## 6. 環境、控制與隨機性

| 項目 | 已記錄條件 |
| --- | --- |
| 桌機環境 | Linux x86_64，有視窗 Chromium，user agent `Chrome/156.0.0.0`；由原生桌面介面啟動批次；實體硬體型號未完整保存 |
| Runtime／套件 | Node `v24.22.3`；原報告記 Linux kernel `6.18.57`；這些 build／check 使用 Node 標準庫，沒有外部 npm 安裝依賴或依賴鎖定檔 |
| 外層 viewport | `1050×917`；iframe CSS scale `0.3225`，不可混稱其他候選所有 viewport 都相同 |
| 遊戲尺寸／DPR | iframe、canvas backing store、canvas CSS 均 `2000×1163`，DPR `1`；本候選 capture 寬 2000 |
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
cp experiments/grow16/manifest.json experiments/grow16/manifest.frozen.json
npm run build:grow16
node experiments/grow16/check-planner.cjs
node experiments/grow16/check-build.cjs
node --check experiments/grow16/server.mjs
```

```sh
# cwd 仍為 bundle/source
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='experiments/grow16/';
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

重建會更新 `createdAt` 與衍生的 protocolHash；pageHash 與來源 hash 應相同。新 protocol metadata 不能冒用成舊批次。另有 grow16-clean-build-verification.json：乾淨副本先移除 index／manifest 再重建，頁面 bytes 與凍結 hash 相同；35 個純 planner 案例、來源整合及 server 語法檢查通過。這份證明沒有執行遊戲。

只讀重算本版原生事件，以及套用 sidecar 的整包摘要（不加 `--write`，只輸出到 stdout）：

```sh
# cwd: bundle/source
node experiments/grow13/summarize.mjs ../results/screen-04-events-noimages.jsonl
node ../results/summarize-evaluation.mjs
```

如另外安排新實戰，須在獨立工作副本、保留新的全部 start／manifest，先確認所用環境的預覽管理規則，再使用下列本機入口；歸檔本次沒有執行這個啟動命令：

```sh
# cwd: bundle/source；單一獨立本機服務
PORT=4173 npm run dev:grow16
```

以有視窗 Chromium 開啟 `http://127.0.0.1:4173/`，按本頁探索按鈕；確認只會依本頁 gate 開啟。先按「停止批次」／「停止並暫停」讓控制器釋鍵，再以 Ctrl+C 停止自己啟動的本機 server。受管共用環境使用其官方預覽生命週期，不另啟第二服務。重新整理會丟失頁內 gate 狀態；server 會拒絕同一事件檔重複 batch_start，不刪失敗記錄重用批次。新自然局不能替代本入口封存的任何局。

## 8. 凍結識別與限制

| 識別 | SHA-256 |
| --- | --- |
| sourceHash | `e9d818294509cca36ccc41826c8138008705d313c99ba4cc28e21bd427dc1a6b` |
| geometryHash | `f229b10be76816bdaec554b49a204dad8d77d4765d61dae168a5075d1d3033ec` |
| plannerHash | `a2f96a52c425eb188f7c880ab700fa3cf098d984672749115c23d64389bd8f34` |
| harnessHash | `1c38cd7a246d96291b565fa3530ce2cc55b9db23daad19d3fbbe43a91ce7f8db` |
| buildHash | `7845c99dd21516d5b07b6c97d22e703b088f7368b39dcaff04d5fe651cea4d3b` |
| pageHash | `60aa5a7174de315f0e73d5a8737f62fb52e7cafdf08a5c06ea31fba378fba72b` |
| isolationHash | `00908ab8787f32be3f732f98b56d0f6e432f2ebfef4ae64cecebb1697ca3122f` |
| manifest 檔案 bytes | `32083e89c958b6187f4a222c4f0d510f6c97da5aba5e905aa169684534922707` |
| protocolHash | `62ab303656b41620f370a5141fd3ba7783cbd37db2011f7b33b5eee98c8f5d37` |

`protocolHash` 是 manifest 尚未加上 protocolHash 欄位時，對 `JSON.stringify(manifest)` 的 SHA-256；它不是格式化 manifest 檔案 bytes 的 hash。其餘完整檔案與結果雜湊可用 [CHECKSUMS.sha256](../grow-evaluation-20261125/bundle/CHECKSUMS.sha256) 核對；先還原遊戲依賴，再核對原清單。

本入口保存／連結來源、設定、數值日誌、結果與檢查，沒有歷史截圖、影片、內嵌實戰影像或原始逐幀像素；合成 fixture 只在執行時建立測試輸入。因此可重建同一頁面並重算結果，不能僅憑 GitHub 重新辨識歷史畫面或完整重播本局。缺 seed、單一桌機環境、小樣本與候選選擇限制仍在。正式每版驗收樣本及全支援版本條件按 SPEC，這份歸檔不宣稱已完成。
