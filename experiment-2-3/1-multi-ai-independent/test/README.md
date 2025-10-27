# Pomodoro + Todo App - Test Suite

包括的なJestテストスイート（ユニットテスト + 統合テスト）

## 概要

このテストスイートは、ポモドーロタイマー + Todoアプリケーション（`../output/app.js`）の包括的なテストを提供します。

**目標:**
- **分岐網羅率**: 100%
- **失敗系/正常系の比率**: 1:1以上（失敗系を多く）
- **テストフレームワーク**: Jest 29.7.0

## セットアップ

### 1. 依存関係のインストール

```bash
cd test
npm install
```

### 2. テスト実行

```bash
# すべてのテストを実行
npm test

# Watch モードで実行（開発時推奨）
npm run test:watch

# 詳細表示モードで実行
npm run test:verbose

# ユニットテストのみ実行
npm run test:unit

# 統合テストのみ実行
npm run test:integration
```

### 3. カバレッジレポート生成

```bash
npm run test:coverage
```

カバレッジレポートは以下に生成されます:
- **テキスト形式**: コンソールに表示
- **HTML形式**: `coverage/lcov-report/index.html`
- **LCOV形式**: `coverage/lcov.info`

## テストファイル構造

```
test/
├── README.md                       # このファイル
├── package.json                    # npm設定
├── jest.config.js                  # Jest設定
├── setup.js                        # テスト環境セットアップ
├── TEST_COVERAGE_PLAN.md          # テスト観点の詳細表
│
├── unit/                           # ユニットテスト
│   ├── sanitize.test.js           # sanitize関数（31テスト）
│   ├── formatters.test.js         # formatTime, formatRelativeTime等（42テスト）
│   ├── validators.test.js         # normalizeTask, sanitizeTimer等（65テスト）
│   ├── helpers.test.js            # derivePomodoroStatus等（42テスト）
│   ├── task-operations.test.js    # タスク操作（30+テスト）
│   └── timer-operations.test.js   # タイマー操作（20+テスト）
│
└── integration/                    # 統合テスト
    ├── task-lifecycle.test.js     # タスクのライフサイクル
    ├── timer-lifecycle.test.js    # タイマーのライフサイクル
    └── storage.test.js            # localStorage統合
```

## テストカバレッジ

### ユニットテスト (Unit Tests)

| ファイル | テストケース数 | 主な観点 |
|---------|--------------|---------|
| `sanitize.test.js` | 31 | XSS防止、型チェック、境界値 |
| `formatters.test.js` | 42 | 時刻フォーマット、相対時刻、日付キー |
| `validators.test.js` | 65 | タスク正規化、タイマーサニタイズ、数値検証 |
| `helpers.test.js` | 42 | ステータス判定、期間計算、ストレージ解析 |
| `task-operations.test.js` | 30+ | タスク追加/編集/削除/完了 |
| `timer-operations.test.js` | 20+ | タイマー開始/停止/リセット |

### 統合テスト (Integration Tests)

| ファイル | 主な観点 |
|---------|---------|
| `task-lifecycle.test.js` | タスク作成→選択→タイマー実行→完了のフロー |
| `timer-lifecycle.test.js` | タイマー開始→一時停止→再開→完了のフロー |
| `storage.test.js` | localStorage保存/読み込み、エラーハンドリング |

## テスト観点の詳細

### 1. XSS防止（sanitize関数）
- HTMLタグの削除（`<script>`, `<img>`, etc.）
- 特殊文字のエスケープ（`<`, `>`, `&`, `"`, `'`）
- イベントハンドラの無効化（`onclick`, `onerror`, etc.）
- 不正な型の処理（null, undefined, 数値, オブジェクト, 配列）

### 2. タスク操作
- **正常系**: 有効なタスク名、見積もり付きタスク
- **異常系**: 空のタスク名、100文字超、見積もり範囲外（<1, >20）
- **境界値**: 1文字、100文字、見積もり1/20

### 3. タイマー操作
- **正常系**: 開始、一時停止、再開、リセット
- **異常系**: タスク未選択で開始、実行中に削除、編集中に開始
- **境界値**: 0秒、59秒、60秒（モード切り替え）

### 4. localStorage統合
- **正常系**: 保存、読み込み、複数データの管理
- **異常系**: QuotaExceededError、無効なJSON、getItem失敗
- **境界値**: 空データ、null、undefined

## Given/When/Then パターン

すべてのテストは以下のコメント形式に従っています：

```javascript
test('テストケース名', () => {
  // Given: 前提条件（入力データ、モックの設定等）
  const input = 'test data';

  // When: 実行内容（関数呼び出し等）
  const result = functionUnderTest(input);

  // Then: 期待結果（アサーション）
  expect(result).toBe('expected output');
});
```

## モッキング

### localStorage
- `setup.js`でモック化
- `getItem()`, `setItem()`, `removeItem()`, `clear()`をjest.fnでラップ
- QuotaExceededErrorのシミュレーション機能付き

### Notification API
- `Notification.permission` のモック
- `Notification.requestPermission()` のモック

### AudioContext
- `AudioContext` のモック
- `createOscillator()`, `createGain()` のチェーン可能なモック

### Timer API
- `jest.useFakeTimers()` でタイマーをモック化
- `jest.advanceTimersByTime()` で時間経過をシミュレート

### Global Functions
- `window.confirm()` → `jest.fn(() => true)`
- `window.prompt()` → `jest.fn(() => null)`
- `window.alert()` → `jest.fn()`

## トラブルシューティング

### テストが失敗する場合

1. **依存関係の再インストール**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **キャッシュのクリア**
   ```bash
   npm test -- --clearCache
   ```

3. **詳細ログの確認**
   ```bash
   npm run test:verbose
   ```

### カバレッジが100%に達しない場合

1. **カバレッジレポートの確認**
   ```bash
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

2. **未カバーの分岐を特定**
   - HTMLレポートでハイライトされた行を確認
   - 該当する条件分岐のテストケースを追加

3. **即時実行関数の問題**
   - `app.js`がIIFE（即時実行関数）でラップされている場合、一部の関数は直接テストできません
   - テストファイル内で関数を再定義することで対応しています

## CI/CD統合

### GitHub Actions の例

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
      - run: cd test && npm ci
      - run: cd test && npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./test/coverage/lcov.info
```

## 開発ワークフロー

### 新しいテストケースの追加

1. **テスト観点の表を確認**
   - `TEST_COVERAGE_PLAN.md` を参照
   - 未実装のテストケースを特定

2. **Given/When/Then形式で記述**
   ```javascript
   test('新しいテストケース', () => {
     // Given: 前提条件
     const input = ...;

     // When: 実行
     const result = functionUnderTest(input);

     // Then: 期待結果
     expect(result).toBe(...);
   });
   ```

3. **失敗系を優先的に追加**
   - 正常系：異常系 = 1:1以上を維持
   - 境界値テスト（0, 最小, 最大, ±1, 空, NULL）を必ず含める

4. **実行とカバレッジ確認**
   ```bash
   npm run test:watch  # 開発中はWatchモード
   npm run test:coverage  # 最終確認
   ```

## 参考資料

- [Jest公式ドキュメント](https://jestjs.io/docs/getting-started)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Given-When-Then](https://martinfowler.com/bliki/GivenWhenThen.html)

## ライセンス

このテストスイートは、元のアプリケーションと同じライセンスに従います。
