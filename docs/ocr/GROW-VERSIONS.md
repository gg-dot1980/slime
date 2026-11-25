# OCR Grow 版本索引

更新：2026-11-25（臺灣時間）。本索引列出 grow-1～grow-17 的固定來源、重現入口與證據範圍。測試交接權威目標為 `test/ocr-test`；本次提交與回讀狀態見 [publication.json](repro/grow-evaluation-20261125/publication.json)。

[本輪完整結果與重現方法](repro/grow-evaluation-20261125/README.md) · [交接索引](TEST-HANDOFF.md) · [歷史來源稽核](repro/grow-evaluation-20261125/historical-inventory.json)

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

grow-14 的 recovery 是原第 07／08 個未開局位置的續測，仍歸 grow-14，原兩個中斷保留分母；不是另起一個策略版本。Grow-17 的直接父版是 grow-15，沒有繼承 grow-16 的紅色本體上界改動。

## 判讀方式

本次沒有因上傳而新增遊戲。Grow-7～12 的歷史自然遊戲數仍按原紀錄為 0；封存驗證是純 Node 合成／建置檢查。本輪 grow-12～17 的 80 個實際開局另存完整原始事件，探索與確認、不同策略及遊戲版本分開統計。

原目標為體型 200、可見遊戲時間 150 秒內、每個指定版本至少 50%。本輪 v2.22 的最高獨立確認為 5/12，因此雙版本目標沒有達成。這些材料不是 OCR4 正式驗收或網站部署證據。

歷史 README、原包 README、凍結程式中的「未實跑／未上傳」字樣保留為當時紀錄；當前逐版狀態見新 PUBLICATION 入口、原生事件及本批 publication.json。不存在的歷史資料沒有由摘要補造。

## 重現入口

- Grow-1～6：以表列完整公開 commit checkout，按各版原 README 重現。
- Grow-7～12：以本 PR 完整 checkout 執行 `node docs/ocr/repro/grow-7/source/reproduce.mjs 7 /tmp/slime-grow-7-repro --synthetic`；改版本數與新的輸出目錄可處理其他版。詳見各版 PUBLICATION。
- Grow-13～17／本輪 Grow-12 對照：先執行 `node docs/ocr/repro/grow-evaluation-20261125/materialize-game-sources.mjs`，再按逐版命令重建或核對統計。完整 repo 的既有遊戲來源以固定 hash 引用，不重傳重複圖像資產。

適用 [SPEC](SPEC.md)、[GITHUB-STORAGE](GITHUB-STORAGE.md)、[TESTING](TESTING.md)；完整未知、失敗與限制見各版入口。
