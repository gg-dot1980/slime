# Grow45 寬畫面自然探索

Grow45 在 QHD 桌機自然探索的 v2.13 為 **4/4**、v2.22 為 **1/4**。v2.22 未達探索門檻。本次未啟動獨立確認。 資料截止臺北時間 2026-11-26 13:49:28。

Grow45 沿用 Grow38 的桌機專注顯示與畫面辨識，v2.13 使用 Grow38 的規劃器，v2.22 改用凍結的 Grow15 完整規劃函式，兩版皆以 100 毫秒為決策間隔。桌機外窗 2560×1440、DPR 1，原遊戲自行繪製 2250×1308 畫布，控制器以 2000×1163 取樣。診斷的可見決策標籤分別是 `grow-23` 和 `grow-15`。[候選與固定來源](https://github.com/gg-dot1980/slime/blob/f84eca61576479f6c1d9f0e31fc5a6f53f3a82c5/docs/ocr/repro/grow-45-public/README.md) · [凍結的 Grow15 規劃器](https://github.com/gg-dot1980/slime/blob/f84eca61576479f6c1d9f0e31fc5a6f53f3a82c5/docs/ocr/repro/grow-evaluation-20261125/bundle/source/experiments/grow15/frozen/screen-03/planner.js)

凍結前另用每版 13 組人工可見輸入比對完整決策，兩版的 13 組皆與各自來源函式一致。這些輸入包含只有小地圖白點、幾何拒判的 NPC、近牆及威脅；該檢查沒有自然開局。[固定輸入檢查](https://github.com/gg-dot1980/slime/blob/f84eca61576479f6c1d9f0e31fc5a6f53f3a82c5/docs/ocr/repro/grow-45-public/check-planner.cjs)

## 遊戲結果

下表為過關數／有效原生遊戲結果數。通過須取得原遊戲可見成功結算，且遊戲時間不超過 150 秒。死亡或到期均計入有效結果。兩版各一次的短控制診斷按計畫停止並核對釋鍵，另計。

| 階段及遊戲版本 | 過關／有效 | 死亡／到期 | 已開局／原定 |
|---|---:|---:|---:|
| 探索 · v2.13 | 4/4 | 0／0 | 4/4 |
| 探索 · v2.22 | 1/4 | 1／2 | 4/4 |

自然組共 8 個原生開局，中止 0，已開局未決 0，計畫中未開局 0，釋鍵未核實 0。全部 5 勝的可見結算均明文顯示體型已達 200，其中 2 勝的最後 HUD 數值亦至少 200。[桌機批次規則](https://github.com/gg-dot1980/slime/blob/f84eca61576479f6c1d9f0e31fc5a6f53f3a82c5/docs/ocr/repro/grow-local-r4-20261126/README.md)

## 相同 QHD 自然探索條件

三個候選各自開新局，沒有共用種子。Grow45 的 v2.13 沿用 Grow38 規劃，兩批在該版的勝數差異不能歸因於更換規劃器。各批按遊戲版本獨立計數。

| 候選 | v2.13 | v2.22 |
|---|---:|---:|
| Grow38 | 4/4 | 0/4 |
| Grow44 | 2/4 | 0/4 |
| Grow45 | 4/4 | 1/4 |

在 v2.22，Grow45 本批觀察到 1 勝，先前 Grow38 與 Grow44 各為零勝。每版四局只能描述本批觀察。歷史 Grow15 的 v2.22 獨立確認為 5/12，當時使用固定 2000×1163 遊戲畫布與改變小地圖繪製順序的相容層；此次的原生畫布、辨識輸入和探索分母都不同。[QHD 對照來源](https://github.com/gg-dot1980/slime/blob/f64f0332fb2bc16bd3ab0b7bc4a1f563c9aee057/docs/ocr/repro/grow-claude-comparison-20261126/aggregates.json) · [Grow15 來源](https://github.com/gg-dot1980/slime/blob/f84eca61576479f6c1d9f0e31fc5a6f53f3a82c5/docs/ocr/repro/grow-15/README.md) · [歷史測試條件](https://github.com/gg-dot1980/slime/blob/f84eca61576479f6c1d9f0e31fc5a6f53f3a82c5/docs/ocr/repro/grow-evaluation-20261125/README.md) · [機器可讀彙總](aggregates.json)

後續以 Grow45 作為 QHD v2.22 的研究基線。下一項試驗只在同一段可見追逐反覆未接觸、而且第一段也未拉近距離時，折減第二段的預期收益，並以曾成功的第二段攔截作對照。
