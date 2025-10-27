# クイックスタートガイド

## セットアップ（初回のみ）

```bash
cd /home/ryu/projects/comparison-pomodoro-todo/experiment-2-independent-plans/1-multi-ai-independent/test
npm install
```

## テスト実行

### すべてのテストを実行
```bash
npm test
```

### カバレッジレポート生成
```bash
npm run test:coverage
```

カバレッジレポートは `coverage/lcov-report/index.html` に生成されます。

### Watch モード（開発時推奨）
```bash
npm run test:watch
```

ファイルの変更を監視し、自動的にテストを再実行します。

### ユニットテストのみ実行
```bash
npm run test:unit
```

### 統合テストのみ実行
```bash
npm run test:integration
```

## テストファイル構成

```
test/
├── unit/                           # ユニットテスト（247テスト）
│   ├── sanitize.test.js           # XSS防止（31テスト）
│   ├── formatters.test.js         # フォーマット関数（42テスト）
│   ├── validators.test.js         # バリデーション（65テスト）
│   ├── helpers.test.js            # ヘルパー関数（42テスト）
│   ├── task-operations.test.js    # タスク操作（39テスト）
│   └── timer-operations.test.js   # タイマー操作（28テスト）
│
└── integration/                    # 統合テスト（69テスト）
    ├── storage.test.js            # localStorage統合（29テスト）
    ├── task-lifecycle.test.js    # タスクライフサイクル（16テスト）
    └── timer-lifecycle.test.js   # タイマーライフサイクル（24テスト）
```

**総テストケース数**: 316テスト  
**総コード行数**: 5,172行

## 目標カバレッジ

- **分岐網羅率 (Branch Coverage)**: 100%
- **関数網羅率 (Function Coverage)**: 100%
- **行網羅率 (Line Coverage)**: 100%
- **文網羅率 (Statement Coverage)**: 100%

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

3. 詳細ログの確認
   ```bash
   npm run test:verbose
   ```

## 詳細ドキュメント

より詳しい情報は `README.md` を参照してください。
