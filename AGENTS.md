# Slime / OCR project instructions

OCR 文件權威分支是 `gg-dot1980/slime` 的 `test/ocr-test`。開始工作先記錄 repo、目前 branch、base commit；檢查適用的更近層指示。使用者本次明確授權優先於本文件。

| 文件 | 何時讀 | 何時更新 |
|---|---|---|
| [OCR 規格](docs/ocr/SPEC.md) | 改策略、設計測試、判定驗收或考慮發布前 | 使用者確認目標／範圍／條件變更，或核實受支援遊戲版本變更時；未知標 TBD |
| [GitHub 存放規則](docs/ocr/GITHUB-STORAGE.md) | 保存／上傳測試材料或交接前 | 規則改動時，同一提交更新版本、理由、生效點及目錄／索引／遷移；遵循權威文件 |
| [測試交接索引](docs/ocr/TEST-HANDOFF.md) | 接手、續跑、查最新結果或失敗證據前 | 每個可交接版本完成時，連結逐版入口並記錄已驗證結果、缺口與下一步；保留歷史 |

只在 `test/ocr-test` 更新 OCR 規格、存放規則與測試成果。main 為正式來源分支、test/demo 為示範分支；這兩支的三份文件僅為導引，勿在此寫入測試成果或複製權威全文。變更入口時同步必要導引，避免連結失效。

影像、影片、影格、像素／內嵌影像日誌及秘密不上 GitHub。測試紀錄提交不等於網站部署或正式驗收；OCR4 未通過規格不得發布。純文件任務不修改程式、站點、部署設定或已保存測試資料；不合併整個測試分支、不強制推送。遭拒停止該操作、保存精確待同步範圍，不繞過核准。

## 人／AI 協作導引

開分支、PR 或 review 前讀 [main 的 CONTRIBUTING.md](https://github.com/gg-dot1980/slime/blob/main/CONTRIBUTING.md) 及 [main 的 Code Review Rules](https://github.com/gg-dot1980/slime/blob/main/AGENTS.md#code-review-rules)。此處只連結權威指南，不複製全文；保留上方 OCR 三文件入口。流程修改在 main 維護，這些連結必要時同步。建議關卡不表示權限／CI 已啟用。
