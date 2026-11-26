# Grow 研究版來源

[Grow1–26 的原版提交、建置方法與 SHA-256](grow-1-26-source-index.md) · [Grow27–43 桌機實測彙總](grow-desktop-summary/README.md) · [桌機測試入口](grow-local-r4-20261126/README.md)

下表依正式編號排列。每個候選都有獨立提交，完整控制器與實驗時的凍結 HTML 逐位元相同。取該提交的來源時，先在含研究分支的本地 clone 查找完整提交標題，例如 `git log --all --format='%H %s' --grep='^OCR Grow 34:'`，再使用回傳的提交建立獨立 checkout。

| 版本 | 提交標題 | 完整控制器 SHA-256 |
|---|---|---|
| [Grow27](grow-27-public/README.md) | OCR Grow 27: 小地圖玩家與相機框定位 | `08e618fa6d05703a302f8cfc798aea6074c7ffe99805529b92149a4c8fc6e914` |
| [Grow28](grow-28-public/README.md) | OCR Grow 28: 第一段可見目標接近 | `8c684579c7fd54462c715dd50ee166ffa91f11efb3b1c8ccc248280fa14051f1` |
| [Grow29](grow-29-public/README.md) | OCR Grow 29: 淡白點偵察 | `c2be01577f298c43d994bb3d433bea7b5dcfeb9d4db4409469282996c7f47e5d` |
| [Grow30](grow-30-public/README.md) | OCR Grow 30: 近期捕獲評分 | `65c556bce0ccb518963279d60d80790be254144c330397fd12b1b49bde89d44f` |
| [Grow31](grow-31-public/README.md) | OCR Grow 31: 持續追獵 | `c7eea92bc8b1698b457d157c5f1d102b69293af3e724cadf312a1833b38461af` |
| [Grow32](grow-32-public/README.md) | OCR Grow 32: 小地圖獵物追蹤 | `d4ada6b01f42fd7791dabdf121441de81c96f59d276301d907e4f03ed495f8d4` |
| [Grow33](grow-33-public/README.md) | OCR Grow 33: 遮蔽追蹤與近距攔截 | `5caf1539b31686ca20f3169b8934fadd66708929011f9b040eca55c317536a44` |
| [Grow34](grow-34-public/README.md) | OCR Grow 34: 邊界獵物辨識 | `bd81bb39284b62762acce3d9c84562139dd44d71e16187134c95d2f43e14ef56` |
| [Grow35](grow-35-public/README.md) | OCR Grow 35: 分版本追獵 | `eeec42256fc85c4f56f63734c7d453280669da6080df8acdd164fc66e2733ddb` |
| [Grow36](grow-36-public/README.md) | OCR Grow 36: 小地圖邊緣白點與沿牆路徑預測 | `017cf13f29f941f8e7ac77ccd3e1e9103434cc2bb4bc764e215b148d3fc0885a` |
| [Grow37](grow-37-public/README.md) | OCR Grow 37: 裁切輪廓與側向觀察 | `1dc6c3f77fa54dfbe0ab73b3179ccc428aac149368abad3605ffdb245fda63aa` |
| [Grow38](grow-38-public/README.md) | OCR Grow 38: 桌機寬視野 | `befaf6a2c6ac1ff14596628753e509e5c15eb5bffd0e6f62f81e91b884f239ec` |
| [Grow39](grow-39-public/README.md) | OCR Grow 39: 跨視野追蹤 | `42e55f8e17819100b33f1d787673c61e612f49a89dd7c648c29d79e4d556181c` |
| [Grow40](grow-40-public/README.md) | OCR Grow 40: 新出現的小地圖白點偵察 | `27893e0d44a4b9d0aea54f73c38be16048bed47c78abe387d5845f09d22e179f` |
| [Grow41](grow-41-public/README.md) | OCR Grow 41: 玩家與獵物輪廓重疊時的近身追蹤 | `7a8aeb4d4bec0b79cf4194a374a1fb8cf5de6e91ad476f64e06ede1daf6f7f5c` |
| [Grow42](grow-42-public/README.md) | OCR Grow 42: 分版本選用 Grow36／39 | `1da5fc0d76d3de4a3c794776982a22c1c12249ab78943fd77f36240dc1be3763` |
| [Grow43](grow-43-public/README.md) | OCR Grow 43: 免疫期補食與搜尋 | `86e19c542d301da612bbfa1ec130afcac8c01ca9bfccd942d9d8c19f8274430c` |

[開發版本復原清單](grow-development/README.md) 涵蓋 Grow30–37、41、42 中可確認的程式與別名。此外，Grow27 同時保留兩份不同的玩家定位程序，[Grow39](grow-39-public/README.md) 有兩個已核對原型的獨立差異檔。[Grow40](grow-40-public/README.md) 說明已保存版本及較早失敗原型的來源缺口。

桌機測試使用同源 iframe 載入指定的 v2.13、v2.22 原遊戲。Grow38 的 FHD 與 QHD 分開啟動及判定。各候選當時的實測結果與開發回歸，請按測試類型分別查閱[彙總資料](grow-desktop-summary/results.json)。

### 策略辨識要點

| 版本 | 可從程式核對的機制 |
|---|---|
| [Grow28](grow-28-public/README.md) | 第一段接近分同時涵蓋可見食物與 NPC。 |
| [Grow29](grow-29-public/README.md) | 體型達 90 後只降低額外偵測淡點的偵察分；第二段的預測食物及 NPC 收益另行折算。 |
| [Grow35](grow-35-public/README.md) | v2.13 使用 Grow32，v2.22 使用 Grow31。 |
| [Grow36](grow-36-public/README.md) | 補讀小地圖邊界內外的白點像素，路徑預測將玩家中心限於牆內並保留沿牆移動；近牆且有威脅時加入風險。 |
| [Grow37](grow-37-public/README.md) | 裁切輪廓採保守幾何估計，並透過側移取得後續觀察。 |
| [Grow39](grow-39-public/README.md) | 短期軌跡結合可見體型量測，一條追獵路線最多選三個目標。 |
| [Grow40](grow-40-public/README.md) | v2.22 對有效期內累計觀測至少三次、目前仍可見且通過篩選的近期白點提高偵察優先度；v2.13 延用 Grow34。 |
| [Grow41](grow-41-public/README.md) | v2.13 短暫保留已確認獵物，處理獵物與玩家在主畫面合併為單一輪廓；v2.22 延用 Grow32。 |
| [Grow43](grow-43-public/README.md) | v2.22 體型達 186 且無原有目標時，補充決策可選食物或白點群；白點群的搜尋項不計成長增量。 |
