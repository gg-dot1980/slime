# Grow48 近牆避讓

Grow47 的 v2.22 探索為 1/4，另三局截止。三局共 435 筆決策的回放中，移除終點牆距扣分使 103 筆預測成長增加、13 筆減少。140 筆改路徑的預測最小牆距均至少 150。[回放與限制](../grow-47-public/results/natural.md)

本候選只移除 v2.22 在第 1.5 秒終點距牆小於 600 的扣分，保留沿途距牆小於 150、穿牆及緊急逃生規則。v2.13 沿用既有規劃器。預期能減少截止；以自然探索的死亡、截止與勝場評估取捨。

凍結 HTML SHA-256 為 `c1127a2fef754be13639f5fe96821080d4707a69b27c4dd7763b2145624b5253`。從 Grow47 凍結來源 `daeb7d9` 的 HTML 以 `node build-candidate.cjs --write` 重建，再用 `node build-candidate.cjs` 比對所有位元組。啟動方式沿用[同源 runner](../grow-local-r4-20261126/README.md)，選擇 grow48 與 QHD。

[自然測試彙總](results/natural.md)
