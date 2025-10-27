# ポモドーロタイマー + Todo アプリ - テストドキュメント

## 概要

このプロジェクトは、ポモドーロタイマーとTodoリストを統合したWebアプリケーションの包括的なテストスイートです。

## テストカバレッジ

- **総テストケース数**: 約250+ ケース
  - 正常系: 約100ケース
  - 異常系: 約150ケース
- **カバレッジ目標**: 分岐網羅95%以上

## テスト構成

### テストファイル

| ファイル | 対象機能 | テストケース数 |
|---------|---------|--------------|
| `helpers.test.js` | ヘルパー関数（sanitize, formatTime等） | 80+ |
| `normalization.test.js` | データ正規化・サニタイズ | 54 |
| `storage.test.js` | localStorage連携・エラー処理 | 34 |
| `task-management.test.js` | タスク管理操作 | 45 |
| `timer.test.js` | タイマー操作 | 36 |

### テスト観点

詳細なテスト観点表は [TEST_COVERAGE_PLAN.md](test/TEST_COVERAGE_PLAN.md) を参照してください。

- ✅ 正常系（主要シナリオ）
- ✅ 異常系（バリデーションエラー、例外）
- ✅ 境界値（0, 最小, 最大, ±1, 空, NULL）
- ✅ 不正な型・形式の入力
- ✅ 外部依存の失敗（localStorage等）
- ✅ 例外種別・エラーメッセージの検証
- ✅ XSS攻撃対策

## セットアップ

### 前提条件

- Node.js 18.x 以上
- npm または yarn

### インストール

```bash
npm install
```

または

```bash
yarn install
```

## テスト実行

### 基本実行

すべてのテストを実行：

```bash
npm test
```

### カバレッジ取得

カバレッジレポート付きでテストを実行：

```bash
npm run test:coverage
```

カバレッジレポートは以下に出力されます：
- コンソール: テキスト形式のサマリー
- `coverage/index.html`: HTML形式の詳細レポート
- `coverage/lcov.info`: CI/CD統合用

### 監視モード

ファイル変更を監視して自動テスト実行：

```bash
npm run test:watch
```

### 詳細ログ

詳細なテスト結果を表示：

```bash
npm run test:verbose
```

### CI環境での実行

CI/CD環境向けの最適化実行：

```bash
npm run test:ci
```

## テストコマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm test` | 全テスト実行 |
| `npm run test:coverage` | カバレッジレポート生成 |
| `npm run test:watch` | 監視モード（開発時推奨） |
| `npm run test:verbose` | 詳細ログ出力 |
| `npm run test:ci` | CI環境向け実行 |

## カバレッジレポートの見方

### コンソール出力

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   95.23 |    96.45 |   97.12 |   95.67 |
 output/app.js      |   95.23 |    96.45 |   97.12 |   95.67 | 123,456
--------------------|---------|----------|---------|---------|-------------------
```

### HTML レポート

詳細なカバレッジレポートを確認：

```bash
open coverage/index.html
```

または

```bash
xdg-open coverage/index.html  # Linux
```

## テストの書き方

各テストは以下の形式で記述されています：

```javascript
test('テストケースの説明', () => {
  // Given: 前提条件
  const input = '...';
  
  // When: 実行
  const result = functionToTest(input);
  
  // Then: 検証
  expect(result).toBe(expected);
});
```

## 主要テスト対象関数

### セキュリティ
- `sanitize()` - XSS防止

### タスク管理
- `handleTaskSubmit()` - タスク追加
- `toggleTaskCompletion()` - タスク完了切り替え
- `requestEditTask()` - タスク編集
- `requestDeleteTask()` - タスク削除
- `selectTask()` - タスク選択

### タイマー
- `startTimer()` - タイマー開始
- `pauseTimer()` - タイマー一時停止
- `resetTimer()` - タイマーリセット
- `completeTimerCycle()` - タイマー完了処理

### ユーティリティ
- `formatTime()` - 時間フォーマット
- `formatRelativeTime()` - 相対時間フォーマット
- `sanitizeNumber()` - 数値サニタイズ
- `clamp()` - 値の範囲制限
- `normalizeTask()` - タスク正規化
- `sanitizeTimer()` - タイマーサニタイズ

### ストレージ
- `safeParseStorage()` - 安全なストレージパース
- `persistTasks()` - タスク保存
- `persistTimer()` - タイマー保存
- `handleStorageError()` - ストレージエラー処理

## トラブルシューティング

### テストが失敗する場合

1. 依存関係の再インストール
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. キャッシュのクリア
   ```bash
   npm test -- --clearCache
   ```

3. 詳細ログで原因確認
   ```bash
   npm run test:verbose
   ```

### カバレッジが目標に達しない場合

未カバーの行を確認：

```bash
npm run test:coverage
open coverage/index.html
```

HTMLレポートで赤くハイライトされた行が未カバー箇所です。

## CI/CD統合

### GitHub Actions 例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## 品質基準

### カバレッジ閾値

- **分岐網羅**: 95%以上
- **関数カバレッジ**: 95%以上
- **行カバレッジ**: 95%以上
- **ステートメント**: 95%以上

閾値を下回ると自動的にテストが失敗します。

## ライセンス

MIT

## 参考資料

- [Jest公式ドキュメント](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [テスト観点表](test/TEST_COVERAGE_PLAN.md)
