
# テストの実行とカバレッジ測定

このディレクトリのテストはJestを利用して実行します。

## 1. 依存関係のインストール

まず、テストに必要なライブラリをインストールします。
プロジェクトのルートディレクトリ(`/home/ryu/projects/comparison-pomodoro-todo/experiment-2-independent-plans/4-gemini-independent/`)で以下のコマンドを実行してください。

```bash
npm install
```

## 2. テストの実行

依存関係のインストール後、以下のコマンドでテストスイート全体を実行できます。

```bash
npm test
```

## 3. テストカバレッジの測定

コードがテストによってどの程度カバーされているかを確認するには、以下のコマンドを実行します。

```bash
npm test -- --coverage
```

実行後、コンソールにカバレッジのサマリーが表示されます。また、`coverage/lcov-report/index.html`に詳細なHTMLレポートが生成されるので、ブラウザで開いて視覚的に確認できます。

### 目標

このテストスイートは、`app.js`のロジックに対して、文（Statements）、分岐（Branches）、関数（Functions）、行（Lines）のカバレッジ100%を目指すように設計されています。
