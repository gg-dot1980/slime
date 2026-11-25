# grow-11 歷史來源補存說明

補存日期：2026-11-25 UTC。原 [README.md](README.md)、合成 fixture 與既有數值結果保持原始位元組；原文「本輪未推 GitHub」描述當時狀態。本檔補充可獨立讀取的來源、重建命令與限制。實際 GitHub commit／PR／讀回狀態以本次總發佈紀錄為準，這個檔案本身不宣稱遠端已完成。

## 固定來源

- 歷史 Sites source commit：`9a60e39a74eef32834b0602d089fc4d665337ae3`；這是已核對的本地 Git provenance，不假設相同 commit 物件存在公開 GitHub。
- 控制器 `src/ocr-grow.html` SHA-256：`56a6278133cdf153c88b64f98b3ba14e98031ac538070e23b01d53b813a40e31`。
- 四遊戲隔離 helper SHA-256：`00908ab8787f32be3f732f98b56d0f6e432f2ebfef4ae64cecebb1697ca3122f`。
- 最小完整來源清單：[source/manifest.json](source/manifest.json)，逐檔列原始路徑、commit、位元組數、Git blob 與 SHA-256。歷史控制器、獨立 planner／minimap、原始檢查程式均按原 byte 保存。
- 重複檔案引用同批 archive 或既有 repo 檔，不重複存放。特別是 Grow10–12 的 helper 與 Grow12 的 controller 復用 [evaluation bundle source](../grow-evaluation-20261125/bundle/source/) 的完全相同內容；重建時逐檔驗證。

四個遊戲檔均與 GitHub `test/ocr-test` 固定 commit `46b8aa3f8207ed03bc89c84c6ed896a23bcd5601` 的既有檔案 blob 完全相同。為避免新增既有內嵌 SVG favicon，不在本 capsule 重傳遊戲原件；從完整 GitHub checkout 的下列檔案本地複製，雜湊不符即停止：

| repo 既有遊戲來源 | SHA-256 |
|---|---|
| `src/game-v2.13.html` | `94944ef137412e93817754791c64cf7803a94f25222a8922fe8aa6936ea46d97` |
| `src/game-v2.20.html` | `b0138f16e42d83c16ab3c9ca2ed1ac37892a106cf54552d75bcc410b50cffeea` |
| `src/game-v2.21.html` | `a155543125b08fb3402143e7f8bfb2778d82b8892b36179c0536568592be81a7` |
| `src/game.html` | `d0349b70c0be4666142f0ed880adb1b1636bcd6d7bf32a13d0d90246899c6d14` |

## 乾淨目錄重建

需要包含這次六個歷史入口與 evaluation bundle 的完整 repo checkout；Node 24 標準庫即可，無 npm 安裝、外部網路、Git 歷史或私人影像依賴。輸出目錄必須尚未存在：

```sh
node docs/ocr/repro/grow-7/source/reproduce.mjs 11 /tmp/slime-grow-11-repro --synthetic
```

共同重建器 [grow-7/source/reproduce.mjs](../grow-7/source/reproduce.mjs) 僅是本次封存工具：先核對全部來源，再將原始程式複製到新目錄，使用原 `makeGrowBundle` 和原 build 中相同的 `__GROW_GAMES__` 替換方式產生 `ocr-grow.html`。生成頁保留原策略、感知、追蹤、按鍵控制、A/B 選擇與四個隔離遊戲。生成頁與本地複製的遊戲原件不屬於上傳檔案；不要把輸出目錄加入 Git。

`--synthetic` 執行 manifest 列出的原始 Node 檢查，斷言與控制器不改字。原檢查呼叫 `git show <固定commit>:<固定path>` 的部分，由明確 allowlist 讀取下面已固定的相同檔案。未列出的 shell／Git 呼叫直接拒絕，沒有隱藏遊戲狀態輸入或動態抓取來源。這項 adapter 改的是來源取得方式，不是測試案例。省略 `--synthetic` 只核對依賴、建置頁面與解析 inline JavaScript。

| 原歷史檢查的固定讀取 | snapshot SHA-256 |
|---|---|
| `d210b40504172b02bfe8ffe82696b0c70be6e9c7:src/ocr-grow.html` | `e3d30e948c5186c74dca56a89cfe9bbaad7e622282530679495dcc3c20a47b00` |

重建後的 `publication-check.json` 記來源、生成頁 hash 與命令結果；原檢查 stdout 在 `publication-checks/`。歷史 `browser-fixture.html` 本身是可讀的合成 Canvas 程式，不是保存像素；本次未啟動瀏覽器重跑它。原 fixture generator 如有提供，保留在 manifest 的 source 清單供查核，並未加入自動瀏覽器工作。

## 本次封存驗證與歷史證據的界線

[PUBLICATION-CHECK.json](PUBLICATION-CHECK.json) 記錄 Node v24.22.3／Linux 的新封存驗證：乾淨目錄能核對依賴、重建四版頁面、解析 inline scripts，原固定檢查分別通過 32 個斷言或情境。這些是同一批既有合成案例重跑，不能合計成獨立遊戲樣本，亦不是新勝率。歷史數值結果維持原內容；只有本次純檢查的 stdout 或其相同歷史檔案參照新增在這份驗證記錄中。

本次自然遊戲／瀏覽器／部署均為 0。原 README 的 Chrome156、Canvas 尺寸、舊延遲與舊通過數是歷史觀察，沒有在本次重新確認；其餘歷史硬體細節、未記錄種子仍未知。四個版本自然遊戲均未因補存而重測；不宣稱正式 OCR4 或各版 150 秒／50% 驗收通過。

原 README 的全站 `scripts/build.mjs` 與其他路由 parity 命令需要完整 Sites checkout、其他路由、媒體及歷史 worker，不在最小 capsule 的範圍。這裡完整重建的是該版 `/ocr-grow` 控制器和四個隔離遊戲，不能把新封存檢查當成重做所有歷史全站驗證。未覆寫 repo 根目錄 `src`，沒有圖片、影片、保存 RGBA、私人遊戲資料或生成 dist 上傳。
