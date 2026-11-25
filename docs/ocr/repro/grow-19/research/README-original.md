# 感知與跨幀記憶研究：Grow19 待測假說

這份研究只讀取已凍結的 Grow15／遊戲來源和既有數字診斷。**沒有啟用候選、重跑遊戲、改寫封存、操作瀏覽器／伺服器或發布 GitHub。** Grow18 的危險分類試驗是另一項獨立假說，本資料不修改或合併它。

建議下一項可實測改動是：在 v2.22 中，幾何拒判的 NPC 改用較寬的外徑不確定度下限。這個改動涵蓋 186 之前的成長／生存階段，不以免疫後收尾為唯一目的。

## 重跑與材料

從工作區根目錄執行：

```sh
node grow-next/research-perception/check-perception.cjs --write
```

只需要 Node 標準庫。沒有 `--write` 時輸出完整 JSON；有 `--write` 時只覆寫本目錄的 [research-perception.json](research-perception.json)。[check-perception.cjs](check-perception.cjs) 從原包讀函式，在獨立 VM 評估原 planner 和單語句提案，不寫候選程式。

本次實際執行為 **7 組像素演算法合成 fixture、98 組 planner 對照、105 個斷言全部通過**；約 0.3 秒的 Node 執行不是瀏覽器開銷測量。報告包含腳本／輸入／提案 hash、Node／OS、完整數字結果及限制。原讀取檔案前後 hash 相等。這些數字不含任何新實戰局。

來源身分分開記錄：

| 項目 | 固定身分 |
|---|---|
| 原 Sites 來源基底 | `14c1815351b32096b325e032331b90c1f7873159` |
| GitHub 歸檔基底 | `46b8aa3f8207ed03bc89c84c6ed896a23bcd5601` |
| 權威文件分支 | `gg-dot1980/slime` 的 `test/ocr-test` |
| 候選原始 GitHub commit | 未取得；使用凍結完整檔案與 SHA256 |
| 提案父版本 | 凍結 Grow15；不是 Grow16、17 或 18 |

## 已證實的程式缺口

Grow15 建置會讓 `refineSlimeGeometry(...)` 的 null 回退到 `highlightRadius`，再可能回退到連通色區外徑。planner 沒有使用 `geometryAccepted` 去調整大小不確定度；只要 `localReliable=true`，半徑誤差仍為 `max(1.4, 0.07*r)`。`localReliable` 只看標籤、長寬比和像素密度，不能證明完整身體或可靠的物理半徑。

固定反例為 NPC 物理半徑 96、外形倍率 0.8、玩家 HUD100：

| 合成輸入 | 幾何結果 | 舊半徑 | 舊 upper | 原15分類 | 提案分類 |
|---|---:|---:|---:|---|---|
| 無亮斑、有合成文字 | null | 76.5 | 81.855 | 可吞食 | 中性 |
| 半亮斑、有合成文字 | null | 76.5 | 81.855 | 可吞食 | 中性 |
| 完整亮斑、有合成文字 | 接受，r=95.8471 | 以接受值為準 | 不足以判可吃 | 中性 | 中性，完整輸出相同 |

前兩例同時滿足 `labelSeen=true`、`localReliable=true`、`clipped=false`。原15 預測增長 11.2296，但遊戲吞食規則是 `player.r >= npc.r*1.08`，100 小於 103.68，不能吞食。這證明程式對不確定輸入存在假獵物路徑；**沒有證明歷史某一幀就是這個圖樣**。

合成使用原包 `geometry.synthetic.cjs` 的圓體及文字生成器。缺失／半亮斑代表能見度不確定的輸入，沒有宣稱它等於瀏覽器的多邊形、字型、混色與抗鋸齒完整輸出。fixture 的物理半徑僅用於合成預期分類，不傳入控制器。

## 外徑關係能證明到哪裡

兩版遊戲 `blob` 在角度 0 與 π 的頂點都使用 `1.01*wobble`；兩點的 `sin(3a+phase)`、`cos(5a-phase*.8)` 項在左右跨度相消。因此，**完整、連續、未遮擋的多邊形**左右半跨度恰為 `1.01*wobble*R`，且 wobble 最小 0.8：

```text
完整輪廓 bbox 半徑 V >= 0.808 * 物理半徑 R
因此，在此前提下 R <= V / 0.808
```

原15 的 `visualR*.88` 不是這個物理上界。另一方面，現有 `components` 輸出是連通色區，`clipped` 只檢查畫布／UI 邊界；同色分裂、被其他 NPC 或玩家遮擋、文字／亮斑、取樣格點都可能讓色區不是完整輪廓。有中央標籤與高密度也不能排除緊密碎片。因此 **`V/.808` 不能無條件叫做真實上界**。

## 唯一建議的候選改動

在原15 planner 的 clipped 擴張與 v2.22 的 200 cap 之前，僅加入：

```js
if (cappedGame && o.geometryAccepted === 0 && finite(o.visualR) && o.visualR > 0)
  upper = Math.max(upper, (o.visualR + 6) / .808);
```

`6` 是凍結 2000 寬、ratio1、components step3 環境中選定的兩格餘量，**是待測的保守政策常數，不是遮擋／抗鋸齒的保證**。換捕捉比例時不能直接沿用。提案不改 r、中心、速度、追蹤、路徑收益、紅點規則、免疫門檻、hard／soft 公式或 v2.13。它只把幾何拒判的外徑資訊放進更寬的 upper。

幾個固定尺寸的結果：

| 合成物理半徑／輸入 | 玩家 HUD | 物理關係 | 原15 | 提案 |
|---|---:|---|---|---|
| 96／半亮斑、外形0.8 | 80 | NPC 可以吞玩家 | 中性 NPC | hard hazard |
| 96／半亮斑、外形0.8 | 100 | 雙方不可吞 | 可吞食 | 中性 NPC |
| 96／半亮斑、外形0.8 | 120、180、195 | 玩家可吞 | 可吞食 | 可吞食，預測增長不變 |
| 120／半亮斑、外形0.8 | 100 | NPC 可以吞玩家 | 中性 NPC | hard hazard |
| 120／半亮斑、外形0.8 | 120 | 雙方不可吞 | 可吞食 | 中性 NPC |
| 120／半亮斑、外形0.8 | 180、195 | 玩家可吞 | 可吞食 | 可吞食，預測增長不變 |
| 40／無亮斑、外形1.15 | 60 | 玩家可吞 | 可吞食 | **soft hazard：實際獵物被錯排** |
| 普通 r10 食物 | 25、60、100、180、195 | 可吃食物 | gain0.38 | 完整輸出相同 |

所有 v2.13 fixture 的完整 planner 輸出相同；已接受幾何的完整輸出也相同。這證實條件作用範圍，但不證實遊戲表現。最後一個 NPC 反例刻意保留新政策的成本：較大的外形倍率會放大不確定度，可能失去有效追擊、降低成長速度。

另外，原15 對精確 r200、HUD180／185 的 soft hazard 分類仍然存在；這裡沒有帶入 Grow18 的修正。提案不能當作 Grow18 的替代，也不能據此宣稱死亡原因已修好。

## 跨幀記憶：已測但本提案不改

直接抽取原 `readImage` 的追蹤語句，固定 dt0.1、玩家100、目標估計半徑80，接觸判定門檻為133.2：

- 距離132連續6幀產生 `stalled=.6`、`blocked=true`；下一幀距離134立刻變為 `stalled=0`、`blocked=false`。再回132只累積0.1。
- 每4幀距離132加1幀距離134，會反覆歸零而永不 blocked。
- HUD 100→101 的小成長會歸零，即使相同位置的目標仍在。
- 半徑96→fallback76.5差19.5，大於當幀配對容許15.3；即使位置不變，配對、stalled 和速度記憶也失去。

因此舊 `blocked` 只能保留連續接觸中的狀態。單加「blocked 的冷卻 TTL」不會解決半徑配對中斷或邊界反覆抖動。本輪沒有混入記憶改動，避免兩個不同假說無法分辨。

## 實戰證據與未解之處

既有 Grow17 `confirm-05-04` 的 HUD195 從124秒持續至最終151秒；其18個身體 target 樣本全部 `geometryAccepted=0`。140／141／146秒的 target 被預測為已在接觸距離、ETA0.1、gain5，但 HUD／eaten 沒有隨後增長。原數字診斷可見 [封存診斷](../../grow-repro-publish/results/grow17-late-cutoff-diagnostic.json)。

這是預測與可見結果不一致，不足以證明同一隻 NPC 被重複追擊或實際不可吃。log 缺少 target x/y、stalled／blocked、完整 object 陣列、穩定 ID 與當時像素，不能重播真實分類或推定致死者。

後續若測本候選，應另凍結 protocol，保留所有開局與原生結算；可加入低成本數字診斷記錄 `geometryAccepted`、`visualR`、`upper`、`stalled/blocked`、每幀配對是否延續及 target 相對位置，讓新的預測／結果差異可追查。實際過關率仍只依200體型／150秒與各版本完整分母，不以合成結果代替。

## 精確來源位置

| 文件 | 本次核對的位置 |
|---|---|
| `source/src/ocr-grow.html` | components 29–49；hasSlimeLabel 86–95；highlightRadius 103–110；readImage 118–132 |
| `source/experiments/grow15/build-lab.mjs` | 17–23：2000捕捉、幾何回退與 object 欄位整合 |
| `source/experiments/grow15/geometry.js` | 11–90：拒判／接受與回傳規則 |
| `source/experiments/grow15/planner.js` | 49–68：NPC上下界；94–109：可吃、免疫與威脅分類 |
| `source/src/game-v2.13.html` | 61：wobble範圍；89：吞食；93–94：輪廓及標籤 |
| `source/src/game.html` | 61：wobble範圍；91：吞食；95–96：輪廓及標籤 |

以上均相對於 `grow-repro-publish/`；腳本保留完整 hash，沒有把來源基底混作候選 commit。
