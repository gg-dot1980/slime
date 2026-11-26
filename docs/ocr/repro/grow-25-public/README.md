# Grow-25 — 原生窄視野近點偵察（合成驗證候選）

2026-11-26（Asia/Taipei）。父版 [Grow-24](../grow-24-public/README.md) 保留；完整候選 [ocr-grow25.html](ocr-grow25.html)，source commit 981954a95a3a7e2245974e3475b4dbf70812b46b，blob fe153621b07531229723d323ea2a6f4d80010e5a；固定回歸 [check-scout.cjs](check-scout.cjs)，blob ae3e022edeceafe963812dcc3b1a4ed6e007d638。

## 觀察及修正
Grow24 在任何視野一律排除300世界座標單位內的白點。對660×384原生 Canvas，距離275的南／北白點可能已在畫面之外；兩版的合成案例中父版均向東（沿舊方向），沒有偵察目標。
首次只放寬距離的原型遭拒：路徑終點接近分數會因超越目標而偏好先朝反方向（北點先南、南點先北）。正式候選僅對150≤距離<300且已知視野、白點超過半視野＋0.65小地圖定位誤差的近點，採第一段0.6秒接近分數。150及0.65為待實測的政策值，不是精確誤差上界。白點仍只代表偵察，無預測吞食收益；已有主畫面物件、紅點、模糊邊界、遠點、過期畫面、牆界及既有避敵維持父版規則。

## 回歸結果
共26組（兩遊戲版本各13組）、49個斷言在 JavaScript 執行環境透過 mock assert 通過。兩版南北案例由父版向東改為直接接近；8組方向／偵察數有變化，18組維持全部規劃輸出（策略識別除外）。白紅同方向案例仍不選近白點、間距及移動不變。v2.13近牆案例改為向北，但模型硬牆限制通過；v2.22近牆維持原方向與生成保留區。上述是數字模型檢查，並非影像辨識驗證，也不保證真實避敵或成長速度提升。

```sh
node docs/ocr/repro/grow-25-public/check-scout.cjs
```

## 實戰入口
仍使用原遊戲 iframe、原生響應式尺寸、Canvas及可見HUD、原鍵盤控制；不改原遊戲規則。原始 v2.13/v2.22 固定 Git blobs、隔離同源測試方式同 Grow24。測試預設外部1440×900/DPR1，可另設1024×768驗證窄視野；兩種視野各自保留結果，不混算。

Grow24尚未取得原生視野基線，先實測Grow24，Grow25另立批次，不替換父版或未決局。先核對測試當日最新遊戲來源；目前固定來源v2.22，不代表已核對正式站。探索各4局通過後才獨立確認各12局，體型200、150秒內、每版至少6/12；手機不計。正式OCR4另驗收。

```sh
npm install --no-save playwright
npx playwright install chromium
node docs/ocr/repro/grow-25-public/run-desktop.cjs --self-test
node docs/ocr/repro/grow-25-public/run-desktop.cjs --phase explore --width 1024 --height 768 --output /tmp/grow25-explore-1024.jsonl
# 對照必須使用同一外部viewport及DPR的Grow24獨立批次；確認需同設定已完成探索。
```

本輪兩段候選script及執行器語法解析通過；未執行Node/Playwright端到端。容器 Chromium、Node、Xvfb 可用，但 git ls-remote 因DNS失敗；原始URL下載也無法取得，完整同源遊戲源未能載入。新增自然開局0，過關0，死亡0；不得當勝率。無部署、無合併、無背景實戰。OS/瀏覽器實戰版本/seed/viewport實測值及時間分布缺漏。所有舊實驗保留。
