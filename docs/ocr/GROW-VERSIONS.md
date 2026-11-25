# OCR Grow 版本索引

更新：2026-11-25（臺灣時間）。本索引列出 grow-1～grow-23 的固定來源、重現入口與證據範圍。測試交接權威目標為 `test/ocr-test`；Grow1～17 先前提交與回讀狀態見 [publication.json](repro/grow-evaluation-20261125/publication.json)。

[Grow12～17的80局結果與重現方法](repro/grow-evaluation-20261125/README.md) · [交接索引](TEST-HANDOFF.md) · [歷史來源稽核](repro/grow-evaluation-20261125/historical-inventory.json)

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
| grow-22 | [來源與測試狀態](repro/grow-22-public/README.md) | [完整單檔來源](repro/grow-22-public/ocr-grow22.html) | 直接以 Grow20 為父版，預估可見 NPC 一次互吃後的致命尺寸；15 組合成案例、53 斷言通過。固定新 8 局探索完成：v2.13 2/4、v2.22 3/4；門檻通過，各 12 局獨立確認進行中，尚未宣稱達標。 |
| grow-23 | [原型與限制](repro/grow-23-public/README.md) | [完整單檔來源](repro/grow-23-public/ocr-grow23.html) | Grow22 加有條件的離牆空間偏好，降低出生位置被邊界夾回的風險；13 組合成案例、64 斷言通過，自然實戰 0 局。 |

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


Grow23 為未啟用研究原型，直接繼承 Grow22；實戰數為 0，不併入 Grow22 的探索或確認分母。
