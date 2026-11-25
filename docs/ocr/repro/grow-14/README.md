# grow-14｜原尺寸辨識與嚴格小地圖標記

固定入口更新：2026-11-25（台灣時間）。結果依據截至 **2026-11-25 12:05:07.093 UTC+8** 的封存證據；本次工作是歸檔已測材料。

本候選探索為 v2.13 **2/4**、v2.22 **1/4**。v2.22 的分母保留兩次基礎設施失敗；兩局原始事件都缺少 native final。未通過兩版各至少 2/4 的篩選，`confirm-02` 沒有開局。 正式 OCR4 驗收尚未完成。

共用完整材料：[原封存報告（歷史內容）](../grow-evaluation-20261125/bundle/README.md)、[完整審查摘要](../grow-evaluation-20261125/bundle/results/evaluation-summary.json)、[原生摘要](../grow-evaluation-20261125/bundle/results/raw-native-summary.json)、[整包檔案校驗表](../grow-evaluation-20261125/bundle/CHECKSUMS.sha256)。下列數字取自 evaluation-summary 的 groups／confirmationGates，沒有由成功案例推估總局數。

## 1. 版本、來源與交接範圍

| 項目 | 固定識別／狀態 |
| --- | --- |
| Repo／OCR 權威分支 | `gg-dot1980/slime`／`test/ocr-test` |
| 本入口策略 | `grow-14`；探索 `screen-02`；條件式確認 `confirm-02` |
| 父版本／起點 | grow-13 |
| Sites 原始碼基底 | `14c1815351b32096b325e032331b90c1f7873159`；是當時 Sites checkout 識別，未確認可作 GitHub source commit 回讀 |
| GitHub 歸檔發布基底 | [46b8aa3f8207ed03bc89c84c6ed896a23bcd5601](https://github.com/gg-dot1980/slime/tree/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601)；與上列 Sites 基底分開 |
| 候選原始 GitHub commit | 建立／測試當時未有可回讀 commit；以完整 source、manifest、各檔 hash 保存，不把歸檔基底稱為候選 source commit |
| 網站／正式驗收 | 本次歸檔不部署網站；本輪候選沒有替換公開 `/ocr-grow`；未宣稱 OCR4 驗收通過 |

原 bundle README 內的「GitHub 待授權／先前拒絕」是封存當時的歷史狀態，保留原文。本入口依使用者後續「繼續，把每個版本都放上 GitHub」授權建立；遠端提交與回讀狀態以此次歸檔提交及[交接索引](../../TEST-HANDOFF.md)為準，本文件不虛構候選建立時的 GitHub commit。

適用規範：[SPEC](../../SPEC.md)、[TESTING](../../TESTING.md)、[GITHUB-STORAGE v1](../../GITHUB-STORAGE.md)。本輪實測範圍是 v2.13／當時查得最新版 v2.22；本候選實際版本以下表為準。v2.20、v2.21 未在本輪新增驗收，手機跳過。[開局前公開版本回應](../grow-evaluation-20261125/bundle/results/live-version-verification.json)記錄當時 currentVersion=v2.22；[末次讀取](../grow-evaluation-20261125/bundle/results/final-version-read-attempt.json)為 HTTP 403，沒有末次即時版本複核。

## 2. 策略差異

父版本為 [grow-13](../grow-13/README.md)。planner 除候選／函式命名外維持相同邏輯，實際改動在感知整合：

- 候選 capture 上限由 1200 提高至原尺寸 2000，遊戲 canvas 仍是 2000×1163。
- 為候選提供嚴格 `growMarkers`；即使沒有合格白點也提供空陣列，避免退回寬鬆機會點。目的是減少灰色鏡頭框碎片被選中。
- 保留 `visualR`、原半徑／標籤判斷、100 ms 排程及 200 ms 計算停止限制。這版未加入 grow-15 的幾何 refiner，也沒有另做近身 filter 修改。
- recovery 只續做原本未開局的第 07／08 邏輯位置，沒有重抽已中斷的第 06 局；planner、感知、遊戲、harness 與視野保持同一凍結版本。

## 3. 精確來源、依賴與遊戲還原

| 用途 | 精確來源 |
| --- | --- |
| 凍結 manifest | [source/experiments/grow14/manifest.json](../grow-evaluation-20261125/bundle/source/experiments/grow14/manifest.json) |
| planner | [source/experiments/grow14/planner.js](../grow-evaluation-20261125/bundle/source/experiments/grow14/planner.js) |
| build | [source/experiments/grow14/build-lab.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow14/build-lab.mjs) |
| harness | [source/experiments/grow14/harness.js](../grow-evaluation-20261125/bundle/source/experiments/grow14/harness.js) |
| 本機 server | [source/experiments/grow14/server.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow14/server.mjs) |
| 共用 package / npm scripts | [source/package.json](../grow-evaluation-20261125/bundle/source/package.json) |
| 固定 grow-12 基底頁面 | [source/src/ocr-grow.html](../grow-evaluation-20261125/bundle/source/src/ocr-grow.html) |
| 遊戲隔離器 | [source/scripts/grow-games.mjs](../grow-evaluation-20261125/bundle/source/scripts/grow-games.mjs) |
| 父 planner | [source/experiments/grow13/planner.js](../grow-evaluation-20261125/bundle/source/experiments/grow13/planner.js) |
| 完整凍結頁面 | [source/experiments/grow14/frozen/screen-02/index.html](../grow-evaluation-20261125/bundle/source/experiments/grow14/frozen/screen-02/index.html) |
| recovery manifest | [source/experiments/grow14-recovery/manifest.json](../grow-evaluation-20261125/bundle/source/experiments/grow14-recovery/manifest.json) |
| recovery build | [source/experiments/grow14-recovery/build-recovery.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow14-recovery/build-recovery.mjs) |
| recovery harness | [source/experiments/grow14-recovery/harness.js](../grow-evaluation-20261125/bundle/source/experiments/grow14-recovery/harness.js) |
| recovery 所需父 manifest | [source/experiments/grow14/frozen/screen-02/manifest.json](../grow-evaluation-20261125/bundle/source/experiments/grow14/frozen/screen-02/manifest.json) |
| recovery 所需父 server | [source/experiments/grow14/frozen/screen-02/server.mjs](../grow-evaluation-20261125/bundle/source/experiments/grow14/frozen/screen-02/server.mjs) |
| recovery 所需父 planner | [source/experiments/grow14/frozen/screen-02/planner.js](../grow-evaluation-20261125/bundle/source/experiments/grow14/frozen/screen-02/planner.js) |
| recovery 所需父 harness | [source/experiments/grow14/frozen/screen-02/harness.js](../grow-evaluation-20261125/bundle/source/experiments/grow14/frozen/screen-02/harness.js) |
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

`screen-02` 原定兩版各 4 個 start；原檔開始 6 局，recovery 另開始原第 07／08 局，共同覆蓋 8 個唯一邏輯位置。兩版各至少 2/4 才可進入條件式 `confirm-02` 每版 12 個新局；該 gate 未達，確認實際 start=0。recovery 本身的確認入口停用。

主比例為 **本 phase／本遊戲版本的 win_le150 ÷ 全部已記錄 start**；死亡、到時停止和 reviewer 分類的 infra 均保留在該作業分母。native final 指 harness 原生 final 紀錄，包含死亡或截止，不能解讀成成功。成功依本局可見結算及遊戲耗時 ≤150 秒判定；最後 HUD 大小與牆鐘不替代結算。

| 策略／批次 | 遊戲 | 預定／已開局 | 原生 final | ≤150 秒勝 | 死亡 | 到時停止 | infra | 成功／全部 start；Wilson 95% |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| grow-14 / `screen-02` | v2.13 | 4/4 | 4 | 2 | 0 | 2 | 0 | 2/4 = 50.0%；15.0%–85.0% |
| grow-14 / `screen-02` | v2.22 | 4/4 | 2 | 1 | 0 | 1 | 2 | 1/4 = 25.0%；4.6%–69.9% |

本入口各已執行組的 late win、遊戲 300 秒 timeout、controller_abort、審查後 unknown／in_progress 均為 0。grow-14 自身共 **8 個 start、6 個原生 final**；上述比例不合併探索與確認。整個共用包另保存其他候選／grow-12 對照，總計 80 starts、78 native finals、2 reviewer infra，並非本候選的新樣本量。

- `screen-02`／v2.13：成功局 n=2；遊戲時間中位數 128.5 秒，最大 132 秒。
- `screen-02`／v2.22：成功局 n=1；遊戲時間中位數 126 秒，最大 126 秒。

Wilson 區間只表達有限樣本的不確定性，沒有對連續候選選擇作多重比較校正；它不證明長期成功機率 ≥50%。不同候選是未固定 seed 的自然新局，比例差異不能單獨建立因果優劣。完整 runId、logical／physical 對映與 counts 欄位在 [evaluation-summary.json](../grow-evaluation-20261125/bundle/results/evaluation-summary.json)，未把探索或其他版本填入確認分母。

### 兩個缺少原生 final 的位置

| 邏輯位置 | 原始 runId／檔案 | 原始證據 | 審查分類與限制 |
| --- | --- | --- | --- |
| `screen-02-06` | `screen-02-06`；原 screen-02 log | 最後 progress 為 UTC 01:15:26.702、HUD 137、elapsedVisible 106；沒有 final、batch_end 或 batch_error | 操作者後續看到 Failed to fetch、preview stopped。sidecar 分類 infrastructure_error；停止原因未知。保留 start，不重抽。 |
| `screen-02-08` | `screen-02-recovery-02`；recovery log | 最後 progress 為 UTC 01:30:24.843、HUD 169、elapsedVisible 112；沒有 final | 操作者回報黑畫面、瀏覽器／視窗消失，但 preview 仍運行。sidecar 分類 infrastructure_error；瀏覽器消失原因未知。保留 start，不重抽。 |

`screen-02-recovery-01` 對應原第 07 局，`screen-02-recovery-02` 對應原第 08 局。兩份 sidecar 是獨立審查註記，不是 harness 原生事件；當時的觀察部分來自操作者轉述。最後 progress 不是截止大小／最終時間，缺少的完整 computeMs、final 大小／時間與釋鍵狀態均不可補造。

原始 raw-native-summary 因缺 final 仍保留兩個 in_progress；這表示歷史證據缺口，不表示目前有兩局仍在運行。套用有 hash 綁定的 sidecar 後，邏輯八個位置已全部交代、無審查後未知；v2.22 仍為 1/4，不能改成只看兩個原生 final 的 1/2 以通過 gate。

## 5. 對應原始紀錄與結果

| 對應原始紀錄／結果／檢查 | 檔案 SHA-256 |
| --- | --- |
| [screen-02-events-noimages.jsonl](../grow-evaluation-20261125/bundle/results/screen-02-events-noimages.jsonl) | `9f7c5032982a79ed7c8a9472237d2bf7cd20f9f0aee6971e947fa8ed84256b10` |
| [screen-02-recovery-events-noimages.jsonl](../grow-evaluation-20261125/bundle/results/screen-02-recovery-events-noimages.jsonl) | `902e33119dc87630771f7209097b3bd04e549a69c06e7a9f4d3f523612a59ab9` |
| [screen-02-reviewer-sidecar.json](../grow-evaluation-20261125/bundle/results/screen-02-reviewer-sidecar.json) | `fcdcf4f7221f9bc69439226aef7dc2495192632eb02887b384fbd850809b7838` |
| [screen-02-recovery-reviewer-sidecar.json](../grow-evaluation-20261125/bundle/results/screen-02-recovery-reviewer-sidecar.json) | `f2270eabd7724a8da5faa1ecca9ec68f3baca9c13ca591267df31af26c4d39b6` |
| [grow14-diagnostics-20261125.json](../grow-evaluation-20261125/bundle/results/grow14-diagnostics-20261125.json) | `ffe459c00f1d512bc73c67d47cd6bb5454f7ab06a95d2a8bc473947bd3ff1cda` |

每份 JSONL 可能同時含探索與確認，須按 `batch`、`version`、`strategy` 分組。診斷檔是數值取樣及有界推論，不提供完整 hazard 身分、逐幀圖像或真正致死物件；沒有用診斷取代原生結果。原始檔及 sidecar 保持原封不動。

## 6. 環境、控制與隨機性

| 項目 | 已記錄條件 |
| --- | --- |
| 桌機環境 | Linux x86_64，有視窗 Chromium，user agent `Chrome/156.0.0.0`；由原生桌面介面啟動批次；實體硬體型號未完整保存 |
| Runtime／套件 | Node `v24.22.3`；原報告記 Linux kernel `6.18.57`；這些 build／check 使用 Node 標準庫，沒有外部 npm 安裝依賴或依賴鎖定檔 |
| 外層 viewport | `1363×936`；iframe CSS scale `0.479`，不可混稱其他候選所有 viewport 都相同 |
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
cp experiments/grow14/manifest.json experiments/grow14/manifest.frozen.json
npm run build:grow14
node --check experiments/grow14/planner.js
node --check experiments/grow14/harness.js
node experiments/grow13/check-minimap-next.cjs experiments/grow14/index.html
node --check experiments/grow14/server.mjs
```

```sh
# cwd 仍為 bundle/source
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='experiments/grow14/';
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

重建會更新 `createdAt` 與衍生的 protocolHash；pageHash 與來源 hash 應相同。新 protocol metadata 不能冒用成舊批次。原凍結報告保存此版及 recovery 的乾淨建置／pageHash 核對。小地圖受控案例支持灰色鏡頭框與真白／紅／綠點的特定區分，不能推廣為所有畫面辨識正確。

歷史 recovery 的必要父檔已另列在來源表。若只重建該頁面，在同一乾淨副本的 `bundle/source` 執行：

```sh
cp experiments/grow14-recovery/manifest.json experiments/grow14-recovery/manifest.frozen.json
node experiments/grow14-recovery/build-recovery.mjs
```

它的 pageHash 應為 `afde1d44993d4c71c544798bdeedb5e3cc9a4821e714407a12f1810c6ee50351`，原 protocolHash 為 `4b19452b8acff749c477d755ab46588d04176e53ce270fb8172caf4f6b14755a`。重建不會補出兩個缺失 final；recovery 的探索與確認按鈕狀態也不能取代完整八位置的審查 gate。

只讀重算本版原生事件，以及套用 sidecar 的整包摘要（不加 `--write`，只輸出到 stdout）：

```sh
# cwd: bundle/source
node experiments/grow13/summarize.mjs ../results/screen-02-events-noimages.jsonl ../results/screen-02-recovery-events-noimages.jsonl
node ../results/summarize-evaluation.mjs
```

如另外安排新實戰，須在獨立工作副本、保留新的全部 start／manifest，先確認所用環境的預覽管理規則，再使用下列本機入口；歸檔本次沒有執行這個啟動命令：

```sh
# cwd: bundle/source；單一獨立本機服務
PORT=4173 npm run dev:grow14
```

以有視窗 Chromium 開啟 `http://127.0.0.1:4173/`，按本頁探索按鈕；確認只會依本頁 gate 開啟。先按「停止批次」／「停止並暫停」讓控制器釋鍵，再以 Ctrl+C 停止自己啟動的本機 server。受管共用環境使用其官方預覽生命週期，不另啟第二服務。重新整理會丟失頁內 gate 狀態；server 會拒絕同一事件檔重複 batch_start，不刪失敗記錄重用批次。新自然局不能替代本入口封存的任何局。

## 8. 凍結識別與限制

| 識別 | SHA-256 |
| --- | --- |
| sourceHash | `e9d818294509cca36ccc41826c8138008705d313c99ba4cc28e21bd427dc1a6b` |
| plannerHash | `59937f61bf7d8e820f8bdbc49863f088b72a04961a5c55611f9b43659e557e85` |
| harnessHash | `4f3563e92a5e69a27a56fce4794a5a35fd861ecb7dc9af474add0b37fa1a769c` |
| buildHash | `51b044afce4777a9d8c53bbbc51ae60817efcdd407aca8ef74a0cf0ba3163dbb` |
| pageHash | `409195550d29b471c1085b7e32a46d2ce36d725231dd82b1d973725d87e1ca58` |
| isolationHash | `00908ab8787f32be3f732f98b56d0f6e432f2ebfef4ae64cecebb1697ca3122f` |
| manifest 檔案 bytes | `2b8043c65ef57b6449ee34771c709982460371cbb21a2f431ac4dc535c7155d2` |
| protocolHash | `e3237b940633b27e65685ad6ae8031aa878699c6dc4ce283679c0d8ea11836de` |

`protocolHash` 是 manifest 尚未加上 protocolHash 欄位時，對 `JSON.stringify(manifest)` 的 SHA-256；它不是格式化 manifest 檔案 bytes 的 hash。其餘完整檔案與結果雜湊可用 [CHECKSUMS.sha256](../grow-evaluation-20261125/bundle/CHECKSUMS.sha256) 核對；先還原遊戲依賴，再核對原清單。

本入口保存／連結來源、設定、數值日誌、結果與檢查，沒有歷史截圖、影片、內嵌實戰影像或原始逐幀像素；合成 fixture 只在執行時建立測試輸入。因此可重建同一頁面並重算結果，不能僅憑 GitHub 重新辨識歷史畫面或完整重播本局。缺 seed、單一桌機環境、小樣本與候選選擇限制仍在。正式每版驗收樣本及全支援版本條件按 SPEC，這份歸檔不宣稱已完成。
