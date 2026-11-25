# Grow19：幾何拒判的外徑不確定度

建立時狀態：**備用、未啟動**。只在 root 判定 Grow18 的固定探索／確認未達事前目標後，才由 root 決定是否啟動。此目錄的合成結果不構成啟動、部署或勝率驗收。

## 父版本與唯一政策差異

父版本是 `../grow15/frozen/screen-03/planner.js`，SHA256：

```text
e89d6a8cb0201a8caf0314c023e16f37f63396dd44615bf4dcdc823077e0fd0e
```

除了函式／策略命名改為 `planGrow19`／`grow-19`、純數字診斷，唯一政策新增如下，位置在原 clipped 擴張及 v2.22 的 200 cap 前：

```js
if (cappedGame && o.geometryAccepted === 0 && finite(o.visualR) && o.visualR > 0)
  upper = Math.max(upper, (o.visualR + 6) / .808);
```

作用於 **v2.22 的所有 HUD 階段**。v2.13、接受幾何、普通食物、r／中心／速度估計、追蹤、路徑收益、紅點規則、免疫門檻與原 hard／soft 公式均不改。沒有帶入 Grow18 的「名義尺寸已致命就 hard」條件。

候選 planner SHA256：

```text
b75c18be0d2444e3113bcd1fec302cca86ea7bc60844773b1a8511a19e7c4ee8
```

去除命名與計數診斷後的政策 SHA256 與先前研究提案完全相同：

```text
516ae8cab03c6f0a8efd8615826a61a87645898adc15ca45b2f0dc6252398dac
```

## 數字診斷的計數基準

`boundAdjustedCount` 只讀取已計算的上下界，不影響分數或動作：

1. 先使用原 planner 的 NPC 去重；同一位置的重複描述只算一次。
2. 比較「有新 floor」及「無新 floor」的 upper，兩者均套原 clipped 擴張及 200 cap。
3. 若新 upper 嚴格較大，計數加一。

這個數量在小地圖紅點配對／red 擴張**之前**，也在本地威脅距離／36 個上限過濾之前。因此它是當次感知輸入中受新大小規則影響的身體數；稍後 red 擴張可能令兩版 upper 相同。它不是本地威脅數、排除獵物數或避免死亡次數。等待／無效輸入回傳0。

Grow19 harness 已把此欄位接入逐秒數字樣本。保存與停止流程沿用已審查的 Grow18 template；除原 hard／soft／promoted 診斷替換為此欄位外，harness 其餘內容保持相同。Grow18 原檔沒有改動。

## 乾淨 source 目錄重跑

在含 `experiments/` 的 source 根目錄執行：

```sh
node experiments/grow19/regression.cjs --write
```

只需要 Node 標準庫。沒有 `--write` 時輸出完整數字 JSON；有 `--write` 時只寫本目錄的 `regression-result.json`。

乾淨副本所需的六個檔案如下，不需要原工作區絕對路徑、package 安裝、遊戲 HTML、瀏覽器或服務：

| 相對 source 路徑 | 用途 |
|---|---|
| `experiments/grow19/planner.js` | 待測候選 |
| `experiments/grow19/regression.cjs` | 固定回歸 |
| `experiments/grow15/frozen/screen-03/planner.js` | 父版及既有 rUpper 介面的對照 |
| `experiments/grow15/frozen/screen-03/source-base.html` | 原 components、label、highlightRadius 函式 |
| `experiments/grow15/frozen/screen-03/geometry.js` | 凍結幾何函式 |
| `experiments/grow15/geometry.synthetic.cjs` | 已凍結的合成圓體／文字生成函式 |

已將這六檔複製到新的暫存 `source/`，執行相同命令：exit0；**除 createdAt 外，完整回歸 JSON 相同**。證據為 [clean-regression-verification.json](clean-regression-verification.json)，檔案 hash、命令、條件均在內。暫存目錄已移除。這是乾淨來源的純回歸驗證，未執行網站建置或遊戲。

## 已執行結果

[regression-result.json](regression-result.json) 保存7組像素演算法 fixture、115組 planner 對照、364個斷言，全部通過。實測 live games 為0。

回歸核對了以下契約：

- 原始碼去掉命名／診斷後，只有一條凍結政策新增，且 hash 與研究提案相同。
- 所有 v2.13 合成輸出、接受幾何的輸出、普通食物的輸出保持完整政策結果相同。
- 候選完整政策輸出等同於「舊 planner 透過既有 `rUpper` 介面收到新下限」，只排除 oracle 自行增加的輸入欄位。
- geometry 欄位缺失／null、visualR 缺失、既有 upper 已達200、clipped 擴張已主導時不提高計數；重複 NPC 描述只計一次。
- 原有無效／過期畫面停止行為保持相同。
- 精確 r200／HUD180與185仍使用原 soft hazard 行為，確認沒有混入 Grow18。這組案例使用距離320／400／500，起點皆在真實接觸門檻外。

主要分類對照：

| 固定合成案例 | 父版 | Grow19 |
|---|---|---|
| 真R96、外形0.8、無／半亮斑、HUD100 | 假可吞食，gain11.2296 | 中性 NPC |
| 真R96、外形0.8、完整亮斑、HUD100 | 中性 NPC | 完整政策輸出相同 |
| 真R96、半亮斑、HUD80 | 錯判中性 | hard hazard |
| 真R120、半亮斑、HUD100 | 錯判中性 | hard hazard |
| 真R96／120、半亮斑、HUD180／195 | 可吞食 | 可吞食、預測增長不變 |
| 真R40、外形1.15、無亮斑、HUD60 | 正確可吞食，gain6.9032 | **錯排 soft hazard，gain0** |
| 普通r10食物，HUD25／60／100／180／195 | gain0.38 | 完整政策輸出相同 |

完整固定矩陣保留在結果中；`negativeGrowthTradeoffs` 收錄本矩陣所有「原判可吃且合成物理規則確實可吃、新規則排除」案例。目前有上表 R40／HUD60 一例，沒有因結果不利刪除它。

## 可證明範圍與限制

兩個遊戲版本的理想完整多邊形，在0／π頂點的形變項會相消，所以左右半跨度為 `1.01*wobble*R >= .808R`。這提供完整、未遮擋、連續外輪廓的大小關係；現有連通色區不能證明這些前提。

`+6` 是固定2000寬、ratio1、components step3設定下的兩格餘量。它不是遮擋、同色分裂、抗鋸齒或其他取樣比例的保證。`labelSeen`／`localReliable` 也不能認證完整輪廓。因此本政策是待驗的不確定度擴張，不能稱通用物理上界。

合成圖樣沿用原圓體／文字生成器，沒有主張精確重現真實多邊形、字型或瀏覽器混色。fixture真半徑只用來標記合成預期關係，不傳給控制器。未讀取任何本局隱藏狀態／座標／RNG，也未保存或使用歷史影像。

策略可能失去有效獵物、過度避讓或降低成長速度；原本追蹤／blocked失憶及 soft hazard 缺口仍保留。這批結果只建立行為與作用範圍，不代表實戰精度、存活率、200體型／150秒過關率或正式OCR4驗收。


## 完整備用實驗頁與啟用前提

已建立獨立 `build-lab.mjs`、`harness.js`、`server.mjs`、`index.html`、`manifest.json`、`protocol.json`。source-base、geometry、game-isolation、兩版遊戲與父manifest皆與凍結15逐byte相同。server沿用原template，只改目錄；沒有啟動服務或更改source根package。

協定是 `screen-07`：兩版交錯，各4局、各至少2勝；通過後 `confirm-07`：兩版各12個新局交錯，各至少6勝。所有開局保留，死亡／截止有效失敗，基礎設施或未知另列，不補局或覆蓋。記錄、100ms獨立停止watchdog、2500ms寫入timeout、重複身分拒絕和未確認資料顯示均沿用已審查template。

`activationPrerequisite` 明列：Grow18必須完成固定screen且任一版少於2/4，或完成固定confirmation全部24個原生結果且任一版少於6/12。未完成／中斷的批次不授權提早啟動19。這是root操作前須核對的條件，不是候選會自行啟動的機制；本頁沒有服務，`freeze.json`和`activation-verification.json`均留給root。

最新部署來源使用root於 **2026-11-25T06:37:54.590332Z** 為Grow19取得的新核對：latest仍v2.22，兩版遊戲byte/hash與凍結來源相同。完整原文保存在 `deployed-game-verification.json`；manifest記錄該時間與hash，未把先前18的核對冒充這次新核對。

以下命令只在首次freeze／開局之前或獨立source副本執行；build會重算manifest的createdAt與protocolHash：

```sh
node experiments/grow19/build-lab.mjs
node experiments/grow19/verify-build.mjs
node experiments/grow19/harness-regression.mjs
```

build不需要其他候選：本目錄的source-base、planner、geometry、harness、server、game-isolation、兩版game、parent-manifest、deployed-game-verification，以及build腳本即足夠。verify另需 `template-provenance.json` 和 `harness-regression.mjs`；planner regression的六檔需求見前節。

`build-verification.json`核對manifest／protocol／實際檔hash、source/game/geometry父15一致、readImage/tick/move/stop/hudSpeed在名稱正規化後一致、19 planner接線、兩phase順序與門檻、未寫freeze或事件log。`harness-regression.json`保留原25個合成案例，全數通過；沒有增加大型測試或實戰局。

以上是備用交付，尚未完成Grow19實戰驗證。額外尺寸餘裕可能漏掉有效獵物的風險已同時寫入頁面、policyChange與固定合成負例。
