# OCR Grow 版本索引

[Grow1–47 逐版來源、提交標題及程式雜湊](repro/grow-version-history.md) · [桌機自然批次與固定種子彙總](repro/grow-desktop-summary/README.md) · [Grow／Claude 比較及 Grow44 結果](repro/grow-claude-comparison-20261126/README.md)

更新：2026-11-26（臺灣時間）。本索引列出 grow-1～grow-26 的固定來源、重現入口與證據範圍。測試交接權威目標為 `test/ocr-test`；Grow1～17 先前提交與回讀狀態見 [publication.json](repro/grow-evaluation-20261125/publication.json)。

[Grow12～17的80局結果與重現方法](repro/grow-evaluation-20261125/README.md) · [交接索引](TEST-HANDOFF.md) · [歷史來源稽核](repro/grow-evaluation-20261125/historical-inventory.json)

## 2026-11-26：Grow47 凍結，原生測試待啟動

[Grow47 完整來源、有限檢查與限制](repro/grow-47-public/README.md) · [短檢查點](GROW-CHECKPOINT.md)。只在 v2.22 原安全路徑加入 1.5 秒預測牆距扣分；v2.13 與緊急逃生來源保留。8 個公式邊界、15 個人工場景、896 條原路徑資料及 45 個其他版本完整決策已由獨立 reviewer 核對，三個降低預測捕食收益的案例保留。此刻自然遊戲 0 局；QHD 實際預檢後才啟動固定批次。Grow46 已完整確認為 v2.13 10/12、v2.22 4/12，原研究目標尚未完成。

## 歷史：2026-11-26 本機接續

Grow24原生視野探索已中斷：6次嘗試、5次實際遊戲、0勝、3截止、2死亡、1載入中止；剩2次未開始，不補局、不確認。完整結果及記錄限制見[本機r1](repro/grow-local-20261126/README.md)。新[r2 runner](repro/grow-local-r2-20261126/README.md)修正document身份與數字snapshot，但真實preflight遇到初始化時序問題、0自然開局；[r3](repro/grow-local-r3-20261126/README.md)再補完整就緒檢查；[Grow26](repro/grow-26-public/README.md)只修白點第一段接近評分，合成40組242斷言通過，實戰待執行。Grow25仍未採用，舊Grow23未決保留。沒有GitHub Actions。

## 全部版本

| 版本 | 逐版入口 | 固定來源 | 本次保存與證據範圍 |
| --- | --- | --- | --- |
| grow-1 | [既有紀錄](repro/grow-1/README.md) | [1957d3b](https://github.com/gg-dot1980/slime/tree/1957d3b04a1c523afafff5a78f757bee1c759319) | 原公開 commit 的控制器已回讀核對；保留既有歷史，不重寫來源。 |
| grow-2 | [既有紀錄](repro/grow-2/README.md) | [3cca7d0](https://github.com/gg-dot1980/slime/tree/3cca7d0c1925edaf3edce758274c911b48097075) | 原公開 commit 的控制器已回讀核對；保留既有歷史，不重寫來源。 |
| grow-3 | [既有紀錄](repro/grow-3/README.md) | [b6afc96](https://github.com/gg-dot1980/slime/tree/b6afc96a0be8734af3d803bde7a63799eec9ead0) | 原公開 commit 的控制器已回讀核對；保留既有歷史，不重寫來源。 |
| grow-4 | [既有紀錄](repro/grow-4/README.md) | [fd8681b](https://github.com/gg-dot1980/slime/tree/fd8681b7cff905836019d3b6bfdb109fd5c92ad4) | 原公開 commit 的控制器已回讀核對；保留既有歷史，不重寫來源。 |
| grow-5 | [既有紀錄](repro/grow-5/README.md) | [54771b5](https://github.com/gg-dot1980/slime/tree/54771b595069550caf11c7c962683de3ffae4979) | 原公開 commit 的控制器已回讀核對；保留既有歷史，不重寫來源。 |
| grow-6 | [既有紀錄](repro/grow-6/README.md) | [46b8aa3](https://github.com/gg-dot1980/slime/tree/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601) | 原公開 commit 的控制器已回讀核對；保留既有歷史，不重寫來源。 |
| grow-7 | [來源與重現](repro/grow-7/PUBLICATION.md) · [歷史紀錄](repro/grow-7/README.md) | [固定來源清單](repro/grow-7/source/manifest.json) | 補存歷史來源、必要依賴、fixture 與結果；乾淨重建及原合成檢查通過。 |
| grow-8 | [來源與重現](repro/grow-8/PUBLICATION.md) · [歷史紀錄](repro/grow-8/README.md) | [固定來源清單](repro/grow-8/source/manifest.json) | 補存歷史來源、必要依賴、fixture 與結果；乾淨重建及原合成檢查通過。 |
| grow-9 | [來源與重現](repro/grow-9/PUBLICATION.md) · [歷史紀錄](repro/grow-9/README.md) | [固定來源清單](repro/grow-9/source/manifest.json) | 補存歷史來源、必要依賴、fixture 與結果；乾淨重建及原合成檢查通過。 |
| grow-10 | [來源與重現](repro/grow-10/PUBLICATION.md) · [歷史紀錄](repro/grow-10/README.md) | [固定來源清單](repro/grow-10/source/manifest.json) | 補存歷史來源、必要依賴、fixture 與結果；乾淨重建及原合成檢查通過。 |
| grow-11 | [來源與重現](repro/grow-11/PUBLICATION.md) · [歷史紀錄](repro/grow-11/README.md) | [固定來源清單](repro/grow-11/source/manifest.json) | 補存歷史來源、必要依賴、fixture 與結果；乾淨重建及原合成檢查通過。 |
| grow-12 | [來源與重現](repro/grow-12/PUBLICATION.md) · [歷史紀錄](repro/grow-12/README.md) | [固定來源清單](repro/grow-12/source/manifest.json) | 補存歷史來源、必要依賴、fixture 與結果；乾淨重建及原合成檢查通過。 本輪另外有 v2.13 0/2、v2.22 0/2 對照實戰。 |
| grow-13 | [來源／結果／重現](repro/grow-13/README.md) | [凍結 manifest](repro/grow-evaluation-20261125/bundle/source/experiments/grow13/manifest.json) | 全尺寸成長／接觸時間規劃；探索 v2.13 1/2、v2.22 0/2，未開始確認。 |
| grow-14 | [來源／結果／重現](repro/grow-14/README.md) | [凍結 manifest](repro/grow-evaluation-20261125/bundle/source/experiments/grow14/manifest.json) | 原尺寸擷取／嚴格小地圖；探索 2/4、1/4，後者含 2 次基礎設施中斷；未開始確認。 |
| grow-15 | [來源／結果／重現](repro/grow-15/README.md) | [凍結 manifest](repro/grow-evaluation-20261125/bundle/source/experiments/grow15/manifest.json) | 亮斑幾何估計中心與半徑；確認 v2.13 11/12、v2.22 5/12。 |
| grow-16 | [來源／結果／重現](repro/grow-16/README.md) | [凍結 manifest](repro/grow-evaluation-20261125/bundle/source/experiments/grow16/manifest.json) | v2.22 已確認紅色本體採上界 200；確認 5/12，沒有新的 v2.13 實測。 |
| grow-17 | [來源／結果／重現](repro/grow-17/README.md) | [凍結 manifest](repro/grow-evaluation-20261125/bundle/source/experiments/grow17/manifest.json) | 直接以 grow-15 為父版，cap immunity 時停止未見白點探索效用；v2.22 確認 3/12，沒有新的 v2.13 實測。 |
| grow-18 | [來源／結果／重現](repro/grow-18/README.md) | [凍結 manifest](repro/grow-18/source/experiments/grow18/manifest.json) | 直接以 Grow15 為父版，名義致命尺寸加入硬性避碰；新探索 v2.13 4/4、v2.22 1/4（3死亡），未過探索門檻，確認未開始。 |
| grow-19 | [來源／結果／重現](repro/grow-19/README.md) | [凍結 manifest](repro/grow-19/source/experiments/grow19/manifest.json) | 直接以 Grow15 為父版，v2.22 幾何拒判提高尺寸上界；探索 v2.13 3/4、v2.22 2/4（含1次239.4ms計算中止）。未通過完整結算門檻，確認未開始。 |
| grow-20 | [來源與結果摘要](repro/grow-20-public/README.md) | [完整單檔來源](repro/grow-20-public/ocr-grow20.html) | Grow19 策略加控制延遲修復；固定前景探索 v2.13 2/4、v2.22 0/4，確認未開始。另保留 1 個環境中斷，合計 9 個嘗試、2 勝。 |
| grow-21 | [原型狀態](repro/grow-21-public/README.md) | [完整單檔來源](repro/grow-21-public/ocr-grow21.html) | Grow20 加有界白點偵查記憶；12 組合成案例、91 斷言通過，自然實戰 0 局。未採用於 Grow22。 |
| grow-22 | [來源與測試狀態](repro/grow-22-public/README.md) | [完整單檔來源](repro/grow-22-public/ocr-grow22.html) | 直接以 Grow20 為父版，預估可見 NPC 一次互吃後的致命尺寸；15 組合成案例、53 斷言通過。探索 v2.13 2/4（2截止）、v2.22 3/4（1死亡）；獨立確認 v2.13 5/12（5截止、2死亡、0中止），v2.22 1/12（4截止、7死亡、0中止）。未達雙版各至少6/12的確認樣本目標；32開局／32結果，未補局。全部計算含丟棄最大219.6ms，1次逾時恢復；完整時序上限見逐版摘要。 |
| grow-23 | [原型與限制](repro/grow-23-public/README.md) | [完整單檔來源](repro/grow-23-public/ocr-grow23.html) | 直接繼承 Grow22，加有條件的離牆空間偏好；13 組合成案例、64 斷言通過。探索 v2.13 4/4（0 截止、0 死亡、0 中止）、v2.22 3/4（1 截止、0 死亡、0 中止），8 個開局全部保留。探索門檻通過；原定各 12 局的獨立確認因執行環境不可用而無法繼續核對，尚未完成，不能判定達標。最後確認快照為 v2.13 2 開局／2 勝，v2.22 2 開局／1 截止／1 未決；未決保留，後續未知。探索已完成決策最大 129.0 ms；含丟棄計算最大 129.0 ms，0 次逾時。 |
| grow-24 | [原生視野與桌機測試入口](repro/grow-24-public/README.md) | [5c572705](https://github.com/gg-dot1980/slime/commit/5c57270575a344a910243cf9238ab6a64e7683d0) | 原遊戲 iframe、移除固定視野；保留 Grow23 策略。五組合成規劃與10項分類斷言通過，實戰0局，未部署。 |
| grow-25 | [窄視野偵察與回歸](repro/grow-25-public/README.md) | [981954a](https://github.com/gg-dot1980/slime/commit/981954a95a3a7e2245974e3475b4dbf70812b46b) | 近距離畫面外白點偵察、第一段接近評分；26組／49斷言，實戰0局。Grow24原生視野基線尚缺，未採用或部署。 |
| grow-26 | [來源與回歸](repro/grow-26-public/README.md) | [完整單檔來源](repro/grow-26-public/ocr-grow26.html) | 直接父版Grow24；白點用0.6秒第一段接近評分，40組242斷言通過，反向取捨保留；自然實戰待新批次。 |

grow-14 的 recovery 是原第 07／08 個未開局位置的續測，仍歸 grow-14，原兩個中斷保留分母；不是另起一個策略版本。Grow-17 的直接父版是 grow-15，沒有繼承 grow-16 的紅色本體上界改動。

## 判讀方式

先前 Grow1～17 歸檔沒有因上傳而新增遊戲。Grow-7～12 的歷史自然遊戲數仍按原紀錄為 0；封存驗證是純 Node 合成／建置檢查。本輪 grow-12～17 的 80 個實際開局另存完整原始事件，探索與確認、不同策略及遊戲版本分開統計。

新增 Grow18、Grow19 各8局與原80局分開保存。Grow19為v2.13 3/4（1次截止）、v2.22 2/4（1次截止、1次控制器中止）；雖然樣本比例75%與50%，因v2.22只有3個native遊戲結果，未通過事前各4個完整結算門檻，沒有開始確認。Grow18的v2.13 為4/4，v2.22 為1/4，兩版0個確認開局。線上API於2026-11-25臺灣時間14:10及14:37核實目前版本v2.22，兩版遊戲HTML與固定副本逐byte相同；不覆寫原80局結束時403的歷史限制。

原目標為體型 200、可見遊戲時間 150 秒內、每個指定版本至少 50%。本輪 v2.22 的最高獨立確認為 5/12，因此雙版本目標沒有達成。這些材料不是 OCR4 正式驗收或網站部署證據。

歷史 README、原包 README、凍結程式中的「未實跑／未上傳」字樣保留為當時紀錄；當前逐版狀態見新 PUBLICATION 入口、原生事件及本批 publication.json。不存在的歷史資料沒有由摘要補造。

## 重現入口

- Grow-1～6：以表列完整公開 commit checkout，按各版原 README 重現。
- Grow-7～12：以本 PR 完整 checkout 執行 `node docs/ocr/repro/grow-7/source/reproduce.mjs 7 /tmp/slime-grow-7-repro --synthetic`；改版本數與新的輸出目錄可處理其他版。詳見各版 PUBLICATION。
- Grow-13～17／本輪 Grow-12 對照：先執行 `node docs/ocr/repro/grow-evaluation-20261125/materialize-game-sources.mjs`，再按逐版命令重建或核對統計。完整 repo 的既有遊戲來源以固定 hash 引用，不重傳重複圖像資產。

- Grow18：從完整repo根目錄執行 `node docs/ocr/repro/grow-18/rebuild-frozen.mjs --output /tmp/slime-grow18-repro --checks`。原8局事件、獨立結果核對及限制見逐版入口。

- Grow19：從完整repo根目錄執行 `node docs/ocr/repro/grow-19/rebuild-frozen.mjs --output /tmp/slime-grow19-repro --checks`，完整8局及239.4ms異常見逐版入口。

適用 [SPEC](SPEC.md)、[GITHUB-STORAGE](GITHUB-STORAGE.md)、[TESTING](TESTING.md)；完整未知、失敗與限制見各版入口。

## Grow20～23 公開來源範圍

每版保留可直接開啟的完整 HTML，內含控制器及 v2.13／v2.22 隔離遊戲；同目錄 README 記錄測試結果與未驗證範圍。這四版公開的是可執行來源與摘要，不包含原始執行環境資料、逐幀數字紀錄或影像。Grow20 的原始中斷與前景批次仍分別保留，並未刪除失敗或以新局替換。Grow21 只有合成驗證，不把它計入自然過關率。


Grow23 直接繼承 Grow22；在父版完整確認未達雙版目標後才啟用。固定 8 局探索完成：v2.13 4/4、v2.22 3/4。探索門檻通過；原定各 12 局的獨立確認因執行環境不可用而無法繼續核對，尚未完成，不能判定達標。探索與確認各自保留分母，也不併入 Grow22 結果。


## 最新交接限制：確認取證中斷

2026-11-25 18:22:35（臺灣時間）後執行環境不可用。Grow23 最後可核實為探索 8 局完整、確認 4 個開局中 3 個結果與 1 個未決；不是完整 24 局確認。未決開局保留在分母，停止／釋鍵與後續結果未知，不得補造、替換或與探索合併。程式與已公開摘要已保存於 GitHub；私人完整證據 ZIP 尚未建立且另存失敗，不能宣稱可下載完整原始紀錄。詳見 [Grow23 說明](repro/grow-23-public/README.md) 及 [交接索引](TEST-HANDOFF.md)。

## Grow24 原生視野接續

使用原遊戲同源 iframe、原生響應式視野。開發測試限桌機 v2.13 及核對後的最新版；測試環境設定外部 viewport，不覆寫頁面。固定源碼、執行器及未驗證項目見 [Grow24](repro/grow-24-public/README.md)。舊固定視野結果不與新批次合併。

## Grow27–46 各版固定提交

每個提交都保存該版本的完整控制器。可用表中的 GitHub 提交檢視當版所有變更，或開啟固定的 HTML 原始碼。

| 版本 | 提交 | 當版原始碼 |
|---|---|---|
| Grow27 | [e73f4e357](https://github.com/gg-dot1980/slime/commit/e73f4e35716762b58c6fbf7c316cdfbe2fc25feb) | [ocr-grow27.html](https://github.com/gg-dot1980/slime/blob/e73f4e35716762b58c6fbf7c316cdfbe2fc25feb/docs/ocr/repro/grow-27-public/ocr-grow27.html) |
| Grow28 | [b90281768](https://github.com/gg-dot1980/slime/commit/b902817680fc3c585b3e4ffc9918a08a03c2077b) | [ocr-grow28.html](https://github.com/gg-dot1980/slime/blob/b902817680fc3c585b3e4ffc9918a08a03c2077b/docs/ocr/repro/grow-28-public/ocr-grow28.html) |
| Grow29 | [702d8c4ed](https://github.com/gg-dot1980/slime/commit/702d8c4ed33fb5919d99110048c91229abb90696) | [ocr-grow29.html](https://github.com/gg-dot1980/slime/blob/702d8c4ed33fb5919d99110048c91229abb90696/docs/ocr/repro/grow-29-public/ocr-grow29.html) |
| Grow30 | [672f28630](https://github.com/gg-dot1980/slime/commit/672f28630fedfbbc39e44600e52930cd1e5b4249) | [ocr-grow30.html](https://github.com/gg-dot1980/slime/blob/672f28630fedfbbc39e44600e52930cd1e5b4249/docs/ocr/repro/grow-30-public/ocr-grow30.html) |
| Grow31 | [9cf5ef0cb](https://github.com/gg-dot1980/slime/commit/9cf5ef0cb8d4ae100b633d8d870f32002aea71d4) | [ocr-grow31.html](https://github.com/gg-dot1980/slime/blob/9cf5ef0cb8d4ae100b633d8d870f32002aea71d4/docs/ocr/repro/grow-31-public/ocr-grow31.html) |
| Grow32 | [123811aaf](https://github.com/gg-dot1980/slime/commit/123811aafb82a167ae074143a85f2d00265c2a46) | [ocr-grow32.html](https://github.com/gg-dot1980/slime/blob/123811aafb82a167ae074143a85f2d00265c2a46/docs/ocr/repro/grow-32-public/ocr-grow32.html) |
| Grow33 | [7c4d8e845](https://github.com/gg-dot1980/slime/commit/7c4d8e845e565a95b88c685e0539888831e87342) | [ocr-grow33.html](https://github.com/gg-dot1980/slime/blob/7c4d8e845e565a95b88c685e0539888831e87342/docs/ocr/repro/grow-33-public/ocr-grow33.html) |
| Grow34 | [30f04beac](https://github.com/gg-dot1980/slime/commit/30f04beac361fdee69f51fd9cf64957221c1de60) | [ocr-grow34.html](https://github.com/gg-dot1980/slime/blob/30f04beac361fdee69f51fd9cf64957221c1de60/docs/ocr/repro/grow-34-public/ocr-grow34.html) |
| Grow35 | [83102d8d5](https://github.com/gg-dot1980/slime/commit/83102d8d5fa23d2cf9b891ddf25a9739d2832e78) | [ocr-grow35.html](https://github.com/gg-dot1980/slime/blob/83102d8d5fa23d2cf9b891ddf25a9739d2832e78/docs/ocr/repro/grow-35-public/ocr-grow35.html) |
| Grow36 | [1fb0ae0fd](https://github.com/gg-dot1980/slime/commit/1fb0ae0fd6b31367ab124de3ad70c0017887cd66) | [ocr-grow36.html](https://github.com/gg-dot1980/slime/blob/1fb0ae0fd6b31367ab124de3ad70c0017887cd66/docs/ocr/repro/grow-36-public/ocr-grow36.html) |
| Grow37 | [ac805530a](https://github.com/gg-dot1980/slime/commit/ac805530a79f634bbc673e2b29a75db95d1496b7) | [ocr-grow37.html](https://github.com/gg-dot1980/slime/blob/ac805530a79f634bbc673e2b29a75db95d1496b7/docs/ocr/repro/grow-37-public/ocr-grow37.html) |
| Grow38 | [08b090de4](https://github.com/gg-dot1980/slime/commit/08b090de49bc3cae87e2ba0e3fddfc4b9982111c) | [ocr-grow38.html](https://github.com/gg-dot1980/slime/blob/08b090de49bc3cae87e2ba0e3fddfc4b9982111c/docs/ocr/repro/grow-38-public/ocr-grow38.html) |
| Grow39 | [2161552fc](https://github.com/gg-dot1980/slime/commit/2161552fc8f51cb3122eda089403e9715e54d864) | [ocr-grow39.html](https://github.com/gg-dot1980/slime/blob/2161552fc8f51cb3122eda089403e9715e54d864/docs/ocr/repro/grow-39-public/ocr-grow39.html) |
| Grow40 | [45a55b000](https://github.com/gg-dot1980/slime/commit/45a55b000dbcee93cb79376ceef9302daf79f177) | [ocr-grow40.html](https://github.com/gg-dot1980/slime/blob/45a55b000dbcee93cb79376ceef9302daf79f177/docs/ocr/repro/grow-40-public/ocr-grow40.html) |
| Grow41 | [cee82a42f](https://github.com/gg-dot1980/slime/commit/cee82a42f8e856d0ba9971f55874291ec38d9f50) | [ocr-grow41.html](https://github.com/gg-dot1980/slime/blob/cee82a42f8e856d0ba9971f55874291ec38d9f50/docs/ocr/repro/grow-41-public/ocr-grow41.html) |
| Grow42 | [90b755836](https://github.com/gg-dot1980/slime/commit/90b7558366f2c823e0c398106705bdde4e0c2ad9) | [ocr-grow42.html](https://github.com/gg-dot1980/slime/blob/90b7558366f2c823e0c398106705bdde4e0c2ad9/docs/ocr/repro/grow-42-public/ocr-grow42.html) |
| Grow43 | [2874bae90](https://github.com/gg-dot1980/slime/commit/2874bae90d3f938a94c56db7a2808950fa39df01) | [ocr-grow43.html](https://github.com/gg-dot1980/slime/blob/2874bae90d3f938a94c56db7a2808950fa39df01/docs/ocr/repro/grow-43-public/ocr-grow43.html) |
| Grow44 | [e6130a4f3](https://github.com/gg-dot1980/slime/commit/e6130a4f3a850600d0d77362bbb0e04163dba199) | [ocr-grow44.html](https://github.com/gg-dot1980/slime/blob/e6130a4f3a850600d0d77362bbb0e04163dba199/docs/ocr/repro/grow-44-public/ocr-grow44.html) |
| Grow45 | [f84eca615](https://github.com/gg-dot1980/slime/commit/f84eca61576479f6c1d9f0e31fc5a6f53f3a82c5) | [ocr-grow45.html](https://github.com/gg-dot1980/slime/blob/f84eca61576479f6c1d9f0e31fc5a6f53f3a82c5/docs/ocr/repro/grow-45-public/ocr-grow45.html) |
| Grow46 | [818ffad5f](https://github.com/gg-dot1980/slime/commit/818ffad5f986182ba5b1a950432eb281ccc6e0cd) | [ocr-grow46.html](https://github.com/gg-dot1980/slime/blob/818ffad5f986182ba5b1a950432eb281ccc6e0cd/docs/ocr/repro/grow-46-public/ocr-grow46.html) |
