# Slime OCR

`ocr` 分支集中維護遊戲實驗室、六個 OCR 系列的控制器、策略版本與公開測試彙總。可先開啟[策略與實驗索引](docs/ocr/STRATEGIES.md)查一個版本，再進入對應的來源、測試條件和結果。

| 要找的內容 | 入口 |
| --- | --- |
| 開啟實驗室 | [已發布的 /ocr-gui-design](https://slime.gameson.cc/ocr-gui-design) · [這個分支的路由程式](src/ocr-gui-design/routes.mjs) · [共用介面](src/ocr.html) |
| 修改 GUI、增加策略選項或診斷 | [GUI 設計與驗收指南](docs/ocr/GUI-GUIDELINE.md) · [即時判斷](src/ocr-console-runtime.js) · [策略目錄](src/ocr-console-catalog.js) |
| 查某個策略或測試輪次 | [178 筆策略與實驗紀錄](docs/ocr/STRATEGIES.md) · [封存原始碼及來源](strategies/README.md) |
| 查 Grow 與 Claude 各版的過關局數、分母、條件 | [策略比較與測試結果](docs/ocr/GROW-CLAUDE.md) · [分組彙總檔](docs/ocr/results/) |
| 接續 Claude 測試（凍結、QHD 桌機 4+4 探索、12+12 確認、手機搖桿組） | [Claude 續測流程](docs/ocr/CLAUDE-WORKFLOW.md) |
| 查 OCR1、OCR2、OCR3、OCR4 候選與測試版 | [舊版策略與驗證紀錄](docs/ocr/LEGACY-TESTS.md) · [test-008 至 test-020 的原始 patch](patches/) |

## 本機使用

在已安裝 Node.js 22 或更新版本的電腦執行以下命令。建置與預覽使用 Node 內建模組。

```sh
git clone --single-branch --branch ocr https://github.com/gg-dot1980/slime.git
cd slime
npm run build
node scripts/check-ocr-index.mjs
npm run dev
```

開啟 `http://localhost:4173/ocr-gui-design`，選擇遊戲、策略系列及策略版本，再按「開始實驗」。本機也保留 `/ocr`、四個原遊戲版本與各原生控制器。可執行版本依控制器選單提供；只有史料的版本可從索引查閱。

## 如何解讀成績

Grow 的桌機研究以 150 遊戲秒內達體型 200 為勝。每版先跑獨立的四局探索，v2.13 與 v2.22 都至少 2/4 且紀錄完整才各開十二局獨立確認，每版需達 6/12。歷史 OCR3 的 180 秒測試、Claude 的不同視野、固定種子、回放與 GUI 操作驗證各自列出。資料缺口及未開局另列於對應實驗。

## 來源與更新

此版整合固定的 [Grow 與 GUI](https://github.com/gg-dot1980/slime/tree/47d1495979dcf304e2d45c12f356f569040c9e94)、[Claude](https://github.com/gg-dot1980/slime/tree/80b1f7922aef468cfa131da23d22f87dc104d280) 與[歷代測試](https://github.com/gg-dot1980/slime/tree/46b8aa3f8207ed03bc89c84c6ed896a23bcd5601)，對照 Sites 第 198 版的獨立入口。各候選的原始 commit 與檔案路徑保留在索引。新增實驗彙總時請附策略、遊戲版、視野、階段、完整分母及證據連結。逐局原檔、影像和還原包保存在私人研究紀錄。
