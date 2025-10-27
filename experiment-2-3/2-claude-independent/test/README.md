# PomoTodoアプリケーション テストスイート

## 概要

このディレクトリには、PomoTodoアプリケーションの包括的なテストスイートが含まれています。

**テスト観点:**
- 等価分割法と境界値分析に基づくテスト設計
- 正常系と同数以上の異常系テストケース
- Given/When/Then形式のテストコメント
- 目標: 分岐網羅率100%

## ファイル構成

```
test/
├── README.md                    # このファイル
├── TEST_PERSPECTIVE.md          # テスト観点表（等価分割・境界値分析）
├── package.json                 # 依存関係とテストスクリプト
├── .babelrc                     # Babel設定
├── app.testable.js              # テスト可能にリファクタリングしたソースコード
├── utils.test.js                # ユーティリティ関数のテスト
├── storage.test.js              # LocalStorage操作とデータモデルのテスト
├── tasks.test.js                # タスク管理機能のテスト
├── timer.test.js                # タイマー機能のテスト
└── stats.test.js                # 統計・日付管理機能のテスト
```

## セットアップ

### 1. 依存関係のインストール

```bash
cd /home/ryu/projects/comparison-pomodoro-todo/experiment-2-independent-plans/2-claude-independent/test
npm install
```

### 2. 必要なパッケージ

- **jest**: テストフレームワーク
- **jest-environment-jsdom**: DOM環境のシミュレーション
- **@babel/core** & **@babel/preset-env**: ES6+のトランスパイル
- **babel-jest**: JestとBabelの統合

## テストの実行

### 基本的なテスト実行

```bash
npm test
```

### ウォッチモード（変更を監視して自動実行）

```bash
npm run test:watch
```

### 詳細モード（詳細な出力）

```bash
npm run test:verbose
```

### カバレッジレポートの生成

```bash
npm run test:coverage
```

カバレッジレポートは以下に生成されます：
- **コンソール出力**: テーブル形式のサマリー
- **coverage/lcov-report/index.html**: HTML形式の詳細レポート（ブラウザで開く）
- **coverage/lcov.info**: LCOV形式（CI/CD統合用）

## テストファイル詳細

### 1. utils.test.js
**テスト対象:** ユーティリティ関数
- `sanitizeInput()`: XSS対策のHTML エスケープ（8テスト）
- `validateTaskTitle()`: タスク名のバリデーション（10テスト）
- `formatTime()`: 時間のフォーマット（13テスト）

**合計:** 31テストケース

### 2. storage.test.js
**テスト対象:** データ永続化とモデル
- `saveToStorage()`: LocalStorageへの保存（7テスト）
- `loadFromStorage()`: LocalStorageからの読み込み（6テスト）
- `createTask()`: タスクオブジェクトの生成（9テスト）

**合計:** 22テストケース

### 3. tasks.test.js
**テスト対象:** タスク管理機能
- `getFilteredTasks()`: フィルタリング機能（11テスト）

**合計:** 11テストケース

### 4. timer.test.js
**テスト対象:** タイマー機能
- `calculateTimerProgress()`: 進捗計算（8テスト）
- `determineNextMode()`: モード遷移決定（12テスト）
- `getModeDuration()`: モード別時間取得（7テスト）

**合計:** 27テストケース

### 5. stats.test.js
**テスト対象:** 統計・日付管理
- `calculateTotalTime()`: 総時間計算（8テスト）
- `calculateCompletedTasks()`: 完了タスク数計算（7テスト）
- `getTodayString()`: 今日の日付取得（4テスト）
- `isDateChanged()`: 日付変更検出（9テスト）

**合計:** 28テストケース

**全体合計:** 119テストケース

## テストカバレッジ目標

| メトリクス | 目標 |
|-----------|------|
| 分岐網羅率 (Branches) | 100% |
| 関数網羅率 (Functions) | 100% |
| 行網羅率 (Lines) | 100% |
| 文網羅率 (Statements) | 100% |

## テスト観点

詳細なテスト観点は `TEST_PERSPECTIVE.md` を参照してください。

**主要観点:**
- **正常系**: 主要シナリオと期待される動作
- **異常系**: バリデーションエラー、例外、エラーメッセージ検証
- **境界値**: 0, 最小値, 最大値, ±1, 空, NULL
- **不正な型**: null, undefined, 不正な文字列
- **外部依存**: localStorage のモック化とエラー処理
- **XSS対策**: HTMLタグ、特殊文字のエスケープ

## Given/When/Then形式

すべてのテストケースはGiven/When/Then形式でコメントが付けられています：

```javascript
test('通常の文字列をそのまま返す', () => {
    // Given: 通常の文字列
    const input = 'test';

    // When: sanitizeInputを呼び出す
    const result = sanitizeInput(input);

    // Then: 同じ文字列が返される
    expect(result).toBe('test');
});
```

## トラブルシューティング

### テストが失敗する場合

1. **依存関係の確認**
   ```bash
   npm install
   ```

2. **キャッシュのクリア**
   ```bash
   npx jest --clearCache
   ```

3. **詳細モードで実行**
   ```bash
   npm run test:verbose
   ```

### カバレッジが目標に達しない場合

1. **未テストの分岐を確認**
   ```bash
   npm run test:coverage
   # coverage/lcov-report/index.html を開く
   ```

2. **HTMLレポートで該当箇所を特定**
   - 赤色: カバーされていない行
   - 黄色: 部分的にカバーされている分岐
   - 緑色: カバーされている行

3. **追加テストケースの実装**

## CI/CD統合

### GitHub Actions例

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
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## 補足

### なぜapp.testable.jsを作成したのか？

元の `app.js` は即時実行関数式（IIFE）で囲まれており、関数が外部からアクセスできませんでした。テスト可能にするため、以下の変更を行いました：

1. **関数のエクスポート**: `module.exports` で関数を公開
2. **純粋関数の抽出**: 副作用のない純粋関数をテスト対象に
3. **DOM依存の分離**: DOM操作を伴わないロジック部分のみを抽出

### 元のapp.jsとの関係

- **app.testable.js**: テスト用のリファクタリング版（ロジックのみ）
- **app.js**: 実際のアプリケーションコード（DOM操作含む）

テストは `app.testable.js` に対して実行され、元の `app.js` の動作を検証します。

## ライセンス

MIT
