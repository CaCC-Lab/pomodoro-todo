# テスト観点表（等価分割・境界値）

| ID | 対象機能 | 条件/入力 | 期待結果 | 種別 |
|----|----------|-----------|----------|------|
| TC-01 | `validateTaskInput` | タイトル: "有効", estimate: `null` | `valid: true` | 正常系 |
| TC-02 | `validateTaskInput` | タイトル: 空文字 | `valid:false`, message: 必須 | 異常系(バリデーション) |
| TC-03 | `validateTaskInput` | タイトル: 101文字 | `valid:false`, message: 長さ超過 | 境界値(最大+1) |
| TC-04 | `validateTaskInput` | タイトル: "短", estimate: `1` | `valid:true` | 境界値(最小) |
| TC-05 | `validateTaskInput` | タイトル: "短", estimate: `20` | `valid:true` | 境界値(最大) |
| TC-06 | `validateTaskInput` | estimate: `0` | `valid:false`, message: 範囲外 | 境界値(最小-1) |
| TC-07 | `validateTaskInput` | estimate: `21` | `valid:false`, message: 範囲外 | 境界値(最大+1) |
| TC-08 | `validateTaskInput` | estimate: `"abc"` | `valid:false`, message: 範囲外 | 不正型 |
| TC-09 | `validateTaskInput` | estimate: `1.5` | `valid:false`, message: 範囲外 | 不正形式 |
| TC-10 | `normalizeEstimate` | 入力: `null` | `null` | 正常系 |
| TC-11 | `normalizeEstimate` | 入力: `1` | `1` | 境界値(最小) |
| TC-12 | `normalizeEstimate` | 入力: `20` | `20` | 境界値(最大) |
| TC-13 | `normalizeEstimate` | 入力: `0` | `1` | 境界値(最小-1→補正) |
| TC-14 | `normalizeEstimate` | 入力: `21` | `20` | 境界値(最大+1→補正) |
| TC-15 | `normalizeEstimate` | 入力: `"5"` | `5` | 等価分割(文字列数値) |
| TC-16 | `normalizeEstimate` | 入力: `"abc"` | `null` | 不正型 |
| TC-17 | `Storage.read` | localStorage 成功 | JSONパース結果 | 正常系 |
| TC-18 | `Storage.read` | localStorage 戻り値 `null` | fallbackのディープコピー | 境界値(空) |
| TC-19 | `Storage.read` | localStorage throws | console.error, fallback | 外部依存失敗 |
| TC-20 | `Storage.write` | setItem 成功 | `true` | 正常系 |
| TC-21 | `Storage.write` | setItem throws | console.error, notifyError 呼び出し, `false` | 外部依存失敗 |
| TC-22 | `Storage.remove` | removeItem throws | console.error | 外部依存失敗 |
| TC-23 | `State.setFilter` | `filter="active"` | filter更新、通知 | 正常系 |
| TC-24 | `State.setFilter` | `filter="unknown"` | 無視、変更なし | 異常系(入力値) |
| TC-25 | `State.setSelectedTask` | 有効ID | 選択保持、localStorage保存 | 正常系 |
| TC-26 | `State.setSelectedTask` | 無効ID | 選択解除、ストレージ削除 | 異常系(存在しないID) |
| TC-27 | `handleTaskSubmit` | 正常入力 | タスク追加・フォームリセット | 正常系 |
| TC-28 | `handleTaskSubmit` | タイトル空 | エラー表示、フォーカス維持 | 異常系 |
| TC-29 | `deleteTask` | 実行中タイマー対象タスク | エラートースト(コードE004) | 異常系(ビジネス) |
| TC-30 | `deleteTask` | 通常削除 | タスク削除 | 正常系 |
