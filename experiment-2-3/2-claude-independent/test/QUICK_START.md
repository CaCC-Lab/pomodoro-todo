# PomoTodoアプリケーション テスト - クイックスタートガイド

## テストの実行（最速手順）

### 1. 依存関係のインストール（初回のみ）

```bash
cd /home/ryu/projects/comparison-pomodoro-todo/experiment-2-independent-plans/2-claude-independent/test
npm install
```

### 2. テストの実行

```bash
npm test
```

**期待される出力:**
```
Test Suites: 5 passed, 5 total
Tests:       118 passed, 118 total
```

### 3. カバレッジレポートの生成

```bash
npm run test:coverage
```

**期待されるカバレッジ:**
```
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|----------|---------|---------|-------------------
All files        |     100 |    96.15 |     100 |     100 |
 app.testable.js |     100 |    96.15 |     100 |     100 | 178
-----------------|---------|----------|---------|---------|-------------------
```

**カバレッジ達成率:**
- ✅ **Statements**: 100%
- ✅ **Branches**: 96.15% (未カバー: 環境チェックコードのみ)
- ✅ **Functions**: 100%
- ✅ **Lines**: 100%

### 4. HTMLカバレッジレポートの表示

```bash
# ブラウザで開く
xdg-open coverage/index.html

# または
open coverage/index.html  # macOS
start coverage/index.html  # Windows
```

**レポートの場所:**
```
test/coverage/
├── index.html              # メインレポート
├── app.testable.js.html    # ソースコード詳細
└── lcov-report/            # 追加の詳細レポート
```

---

## テストファイル概要

| ファイル | テスト対象 | テスト数 | 主要観点 |
|---------|----------|---------|---------|
| `utils.test.js` | ユーティリティ関数 | 31 | XSS対策、バリデーション、時間フォーマット |
| `storage.test.js` | LocalStorage & データモデル | 22 | 保存/読み込み、エラーハンドリング、タスク生成 |
| `tasks.test.js` | タスク管理 | 11 | フィルタリング、境界値 |
| `timer.test.js` | タイマー機能 | 27 | 進捗計算、モード遷移、時間取得 |
| `stats.test.js` | 統計・日付管理 | 27 | 時間計算、完了タスク数、日付変更検出 |
| **合計** | | **118** | |

---

## テスト観点の詳細

詳細は `TEST_PERSPECTIVE.md` を参照してください。

**主要テスト観点:**
1. ✅ **正常系**: 主要シナリオ
2. ✅ **異常系**: バリデーションエラー、例外（正常系と同数以上）
3. ✅ **境界値**: 0, 最小値, 最大値, ±1, 空, NULL
4. ✅ **不正な型**: null, undefined, 不正な文字列
5. ✅ **外部依存**: localStorageのモック化とエラー処理
6. ✅ **XSS対策**: HTMLタグ、特殊文字のエスケープ

**Given/When/Then形式のコメント:**
すべてのテストケースに明確なコメントが付けられています。

---

## カバレッジ未達成部分の説明

**Line 178 (未カバー):**
```javascript
if (typeof module !== 'undefined' && module.exports) {
```

**理由:**
- Node.js環境チェックコード
- ブラウザ環境では実行されない
- 実際のロジックではないため問題なし

**実質的なロジックカバレッジ:** **100%達成**

---

## よく使うコマンド

```bash
# 通常のテスト実行
npm test

# ウォッチモード（自動再実行）
npm run test:watch

# 詳細出力
npm run test:verbose

# カバレッジレポート生成
npm run test:coverage

# 特定のテストファイルのみ実行
npx jest utils.test.js

# 特定のテストケースのみ実行
npx jest -t "通常の文字列をそのまま返す"
```

---

## トラブルシューティング

### テストが失敗する場合

```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# Jestキャッシュのクリア
npx jest --clearCache

# 詳細モードで実行
npm run test:verbose
```

### カバレッジが表示されない場合

```bash
# package.jsonの設定確認
cat package.json | grep -A 5 collectCoverageFrom

# 手動でカバレッジ生成
npx jest --coverage --collectCoverageFrom='app.testable.js'
```

---

## CI/CD統合例

### GitHub Actions

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd experiment-2-independent-plans/2-claude-independent/test
          npm ci
      - name: Run tests with coverage
        run: |
          cd experiment-2-independent-plans/2-claude-independent/test
          npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./experiment-2-independent-plans/2-claude-independent/test/coverage/lcov.info
```

---

## 成果サマリー

✅ **テストケース数**: 118
✅ **テストファイル数**: 5
✅ **カバレッジ**:
  - Statements: 100%
  - Branches: 96.15%
  - Functions: 100%
  - Lines: 100%

✅ **テスト観点**: 等価分割・境界値分析に基づく包括的なテスト
✅ **失敗系テスト**: 正常系と同数以上を実装
✅ **Given/When/Then形式**: 全テストケースに適用
✅ **目標達成**: 分岐網羅率ほぼ100%達成

---

## 参考リンク

- **詳細なテスト観点**: `TEST_PERSPECTIVE.md`
- **完全な使用方法**: `README.md`
- **カバレッジレポート**: `coverage/index.html`
