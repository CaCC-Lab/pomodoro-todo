# テストファイル分類レポート

## サマリー

| AI | 生成されたテストコード数 | ドキュメント数 | 設定ファイル数 | インフラ有無 |
|----|---------------------|------------|------------|----------|
| 1. Multi-AI | 9 | 4 | 3 | ✅ (full) |
| 2. Claude | 6 | 4 | 1 | ✅ (full) |
| 3. Codex | 1 | 1 | 0 | ❌ |
| 4. Gemini | 1 | 2 | 1 | ❌ |
| 5. Amp | 6 | 3 | 0 | ❌ |
| 6. Droid | 2 | 1 | 1 | ✅ (full) |
| 7. Cursor | 1 | 1 | 0 | ❌ |
| 8. Qwen | 2 | 2 | 1 | ❌ |

**インフラ定義**: node_modules/ + package-lock.json + coverage/

---

## 詳細分類

### 1. Multi-AI Independent

**生成されたテストコード (9ファイル)**
- `integration/storage.test.js`
- `integration/task-lifecycle.test.js`
- `integration/timer-lifecycle.test.js`
- `unit/formatters.test.js`
- `unit/helpers.test.js`
- `unit/sanitize.test.js`
- `unit/task-operations.test.js`
- `unit/timer-operations.test.js`
- `unit/validators.test.js`

**テスト関連ドキュメント (4ファイル)**
- `QUICK_START.md`
- `README.md`
- `TEST_COVERAGE_PLAN.md`
- `TEST_EXECUTION_SUMMARY.md`

**設定ファイル (3ファイル)**
- `jest.config.js`
- `package.json`
- `setup.js`

**インフラ（除外対象）**
- ✅ node_modules/
- ✅ package-lock.json
- ✅ coverage/

**特徴**: 最も包括的。Unit + Integration テストの明確な分離。

---

### 2. Claude Independent

**生成されたテストコード (6ファイル)**
- `app.testable.js` ⚠️ テスタブル版アプリコード
- `stats.test.js`
- `storage.test.js`
- `tasks.test.js`
- `timer.test.js`
- `utils.test.js`

**テスト関連ドキュメント (4ファイル)**
- `IMPLEMENTATION_NOTES.md`
- `QUICK_START.md`
- `README.md`
- `TEST_PERSPECTIVE.md`

**設定ファイル (1ファイル)**
- `package.json`

**インフラ（除外対象）**
- ✅ node_modules/
- ✅ package-lock.json
- ✅ coverage/

**特徴**: モジュール分割が明確。app.testable.js はテストコードではなく、テスト用にリファクタリングされたアプリコード。

---

### 3. Codex Independent

**生成されたテストコード (1ファイル)**
- `app.test.js`

**テスト関連ドキュメント (1ファイル)**
- `test-plan.md`

**設定ファイル (0ファイル)**

**インフラ（除外対象）**
- ❌ なし

**特徴**: 最もミニマル。単一ファイルのみ。

---

### 4. Gemini Independent

**生成されたテストコード (1ファイル)**
- `app.test.js`

**テスト関連ドキュメント (2ファイル)**
- `README.md`
- `test-plan.md`

**設定ファイル (1ファイル)**
- `setup.js`

**インフラ（除外対象）**
- ❌ なし

**特徴**: シンプル。setup.js で追加設定を提供。

---

### 5. Amp Independent

**生成されたテストコード (6ファイル)**
- `statistics.test.js`
- `storage-manager.test.js`
- `task.test.js`
- `timer.test.js`
- `todo-controller.test.js`
- `utils.test.js`

**テスト関連ドキュメント (3ファイル)**
- `README.md`
- `TEST_STRATEGY.md`
- `TEST_SUMMARY.md`

**設定ファイル (0ファイル)**

**インフラ（除外対象）**
- ❌ なし

**特徴**: モジュール分割が詳細。戦略・サマリードキュメントが充実。

---

### 6. Droid Independent

**生成されたテストコード (2ファイル)**
- `app.integration.test.js`
- `app.testable.js` ⚠️ テスタブル版アプリコード

**テスト関連ドキュメント (1ファイル)**
- `TEST_PLAN.md`

**設定ファイル (1ファイル)**
- `package.json`

**インフラ（除外対象）**
- ✅ node_modules/
- ✅ package-lock.json
- ✅ coverage/

**特徴**: 統合テスト中心。Claude同様にapp.testable.jsでリファクタリング。

---

### 7. Cursor Independent

**生成されたテストコード (1ファイル)**
- `app.test.js`

**テスト関連ドキュメント (1ファイル)**
- `test_plan.md`

**設定ファイル (0ファイル)**

**インフラ（除外対象）**
- ❌ なし

**特徴**: ミニマルなアプローチ。

---

### 8. Qwen Independent

**生成されたテストコード (2ファイル)**
- `node-tests.js`
- `tests.js`
- ⚠️ `test-runner.html` (HTMLテストランナー)

**テスト関連ドキュメント (2ファイル)**
- `README.md`
- `test_perspective_table.md`

**設定ファイル (1ファイル)**
- `package.json`

**インフラ（除外対象）**
- ❌ なし

**特徴**: Node.js + ブラウザ両対応。独自のtest-runner.html。

---

## ファイルタイプ別統計

### 生成されたテストコード

| タイプ | AI | ファイル数 | 備考 |
|--------|-----|---------|------|
| 包括的Unit+Integration | Multi-AI | 9 | 最多 |
| モジュール分割 | Claude, Amp | 6 | 各機能ごと |
| 統合テスト中心 | Droid | 2 | Integration + Testable |
| ブラウザ+Node対応 | Qwen | 2 | HTMLランナー付き |
| 単一ファイル | Codex, Gemini, Cursor | 1 | 最もシンプル |

### ドキュメント充実度

| ランク | AI | ドキュメント数 | 種類 |
|--------|-----|------------|------|
| 🥇 1位 | Multi-AI, Claude | 4 | QUICK_START, README, テスト戦略, 実行サマリー |
| 🥈 2位 | Amp | 3 | README, 戦略, サマリー |
| 🥉 3位 | Gemini, Qwen | 2 | README + プラン/テーブル |
| 4位 | Codex, Droid, Cursor | 1 | プランのみ |

### インフラ整備度

| ランク | AI | インフラ | 備考 |
|--------|-----|---------|------|
| 完全 | Multi-AI, Claude, Droid | node_modules + lock + coverage | テスト実行済み |
| なし | Codex, Gemini, Amp, Cursor, Qwen | なし | 未実行またはClean |

---

## 抽出対象ファイル推奨リスト

実験結果の比較・評価のため、**以下のファイルのみ**を抽出することを推奨します：

### コアテストコード（必須）

```
1-multi-ai-independent/test/
  - integration/*.test.js (3ファイル)
  - unit/*.test.js (6ファイル)

2-claude-independent/test/
  - stats.test.js
  - storage.test.js
  - tasks.test.js
  - timer.test.js
  - utils.test.js
  ⚠️ app.testable.js は除外（テストコードではない）

3-codex-independent/test/
  - app.test.js

4-gemini-independent/test/
  - app.test.js

5-amp-independent/test/
  - statistics.test.js
  - storage-manager.test.js
  - task.test.js
  - timer.test.js
  - todo-controller.test.js
  - utils.test.js

6-droid-independent/test/
  - app.integration.test.js
  ⚠️ app.testable.js は除外（テストコードではない）

7-cursor-independent/test/
  - app.test.js

8-qwen-independent/test/
  - node-tests.js
  - tests.js
  - test-runner.html
```

### ドキュメント（オプション）

```
各AIディレクトリの:
  - README.md
  - TEST_*.md
  - *-plan.md
```

### 除外対象（重要）

```
全AIディレクトリで除外:
  - node_modules/ (ライブラリ)
  - package-lock.json (依存関係ロック)
  - coverage/ (カバレッジレポート)
  - *.testable.js (テスト用にリファクタリングされた元コード)
```

---

## 比較評価のポイント

1. **テスト数**: Multi-AI (9) > Claude, Amp (6) > Droid, Qwen (2) > Codex, Gemini, Cursor (1)
2. **テスト戦略**:
   - Unit + Integration分離: Multi-AI のみ
   - モジュール分割: Claude, Amp
   - 統合テスト中心: Droid
   - シンプル単一ファイル: Codex, Gemini, Cursor
3. **ドキュメント**: Multi-AI, Claude > Amp > Gemini, Qwen > その他
4. **実行済み**: Multi-AI, Claude, Droid のみ（coverage/存在）

---

生成日時: 2025-10-27
分類対象: experiment-2-independent-plans/ 配下8AIディレクトリ
