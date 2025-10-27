# PomoTodo 実装計画書 - Amp独立実装

**作成日**: 2025-10-27  
**AI**: Amp (Sourcegraph)  
**目標時間**: 10分以内  

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術構成](#技術構成)
3. [実装工程](#実装工程)
4. [詳細タスク](#詳細タスク)
5. [データ構造設計](#データ構造設計)
6. [コンポーネント設計](#コンポーネント設計)
7. [実装優先順位](#実装優先順位)
8. [テスト項目](#テスト項目)

---

## プロジェクト概要

### 目標
- **アプリ名**: PomoTodo
- **機能**: ポモドーロタイマー統合型タスク管理アプリ
- **技術**: HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- **制約**: フレームワーク/ライブラリ不使用、3ファイル構成、700行以内

### 成果物
- `index.html` - メインHTML
- `style.css` - スタイルシート
- `app.js` - アプリケーションロジック

---

## 技術構成

### 使用技術
- ✅ HTML5
- ✅ CSS3 (Flexbox/Grid)
- ✅ Vanilla JavaScript (ES6+)
- ✅ LocalStorage API
- ✅ Notification API (オプション)
- ✅ Web Audio API

### 禁止事項
- ❌ React/Vue/Angular
- ❌ jQuery/Lodash
- ❌ TypeScript
- ❌ webpack/Vite
- ❌ Bootstrap/Tailwind

---

## 実装工程

### フェーズ1: 基盤構築 (2分)
- ✅ プロジェクトファイル構成
- ✅ HTML基本構造
- ✅ CSS変数・リセット定義
- ✅ JavaScript基本クラス設計

### フェーズ2: Todoリスト機能 (3分)
- ✅ タスクCRUD機能
- ✅ フィルタリング機能
- ✅ LocalStorage連携

### フェーズ3: タイマー機能 (3分)
- ✅ タイマーロジック
- ✅ 通知機能
- ✅ タスク連携

### フェーズ4: 統合・UI調整 (2分)
- ✅ 統計表示
- ✅ アニメーション
- ✅ 動作確認

---

## 詳細タスク

## 1. HTML構造 (index.html)

### 1.1 基本構造
- [ ] DOCTYPE宣言、meta要素設定
- [ ] CSS/JSファイル読み込み
- [ ] ルートコンテナ作成

### 1.2 ヘッダーセクション
- [ ] アプリタイトル
- [ ] 今日の統計表示エリア
  - [ ] 総ポモドーロ数表示
  - [ ] 完了タスク数表示
  - [ ] 作業時間表示

### 1.3 タイマーセクション
- [ ] タイマー表示エリア
  - [ ] 残り時間表示 (MM:SS)
  - [ ] 進捗バー (円形または直線)
  - [ ] 現在のモード表示 (作業中/休憩中)
  - [ ] 選択中タスク名表示
- [ ] タイマー操作ボタン群
  - [ ] 開始ボタン
  - [ ] 一時停止ボタン
  - [ ] リセットボタン
  - [ ] スキップボタン

### 1.4 Todoリストセクション
- [ ] タスク入力フォーム
  - [ ] タスク名入力フィールド
  - [ ] 見積もりポモドーロ数入力
  - [ ] 追加ボタン
- [ ] フィルタボタン群
  - [ ] 全て表示
  - [ ] 未完了のみ
  - [ ] 完了済みのみ
- [ ] タスクリストコンテナ
  - [ ] スクロール可能エリア

### 1.5 モーダル/通知エリア
- [ ] エラーメッセージ表示エリア
- [ ] 確認ダイアログ用モーダル
- [ ] タイマー完了通知モーダル

---

## 2. CSS スタイリング (style.css)

### 2.1 CSS変数定義
- [ ] カラースキーム設定
  - [ ] プライマリカラー (--primary-red, --primary-green, --primary-blue)
  - [ ] 背景色 (--bg-main, --bg-secondary, --bg-hover)
  - [ ] テキストカラー (--text-primary, --text-secondary, --text-disabled)
  - [ ] ボーダーカラー (--border-color)
  - [ ] ステータスカラー (--success, --warning, --error)
- [ ] フォント定義
  - [ ] フォントファミリー
  - [ ] サイズ変数 (--font-size-xs ~ --font-size-timer)
  - [ ] ウェイト変数
- [ ] スペーシング変数

### 2.2 ダークモード対応
- [ ] `@media (prefers-color-scheme: dark)` 定義
- [ ] ダークモード用カラースキーム上書き

### 2.3 リセット/基本スタイル
- [ ] CSSリセット (*, box-sizing)
- [ ] body基本スタイル
- [ ] コンテナレイアウト (Flexbox/Grid)

### 2.4 コンポーネントスタイル
- [ ] ボタンスタイル
  - [ ] .btn-primary (開始ボタンなど)
  - [ ] .btn-secondary (リセットなど)
  - [ ] .btn-danger (削除ボタン)
  - [ ] ホバー/アクティブ状態
- [ ] 入力フィールドスタイル
  - [ ] input/textarea基本スタイル
  - [ ] フォーカス状態
  - [ ] エラー状態 (.error)
- [ ] タスクカードスタイル
  - [ ] .task-item 基本スタイル
  - [ ] .task-item:hover
  - [ ] .task-item.selected (選択状態)
  - [ ] .task-item.completed (完了状態)
  - [ ] チェックボックススタイル

### 2.5 タイマー表示スタイル
- [ ] タイマー数字 (64px以上)
- [ ] 進捗バー (円形/直線)
- [ ] モード別色分け (作業:赤、休憩:緑)

### 2.6 アニメーション
- [ ] @keyframes fadeIn (タスク追加)
- [ ] @keyframes fadeOut (タスク削除)
- [ ] @keyframes pulse (タイマー動作中)
- [ ] トランジション効果

### 2.7 レスポンシブデザイン
- [ ] モバイル対応 (@media max-width: 768px)
- [ ] タブレット対応 (@media max-width: 1024px)

---

## 3. JavaScript ロジック (app.js)

### 3.1 データモデル層

#### 3.1.1 Task クラス
- [ ] コンストラクタ
  - [ ] id (UUID生成)
  - [ ] title (タスク名)
  - [ ] completed (完了状態: boolean)
  - [ ] estimatedPomodoros (見積もり数: number)
  - [ ] actualPomodoros (実績数: number)
  - [ ] createdAt (作成日時: ISO 8601)
  - [ ] completedAt (完了日時: ISO 8601 | null)
- [ ] メソッド
  - [ ] toJSON() - シリアライズ
  - [ ] static fromJSON(data) - デシリアライズ
  - [ ] toggleComplete() - 完了状態切り替え
  - [ ] incrementPomodoros() - 実績+1

#### 3.1.2 Timer クラス
- [ ] プロパティ
  - [ ] mode (作業/休憩/停止)
  - [ ] remainingSeconds (残り秒数)
  - [ ] totalSeconds (合計秒数)
  - [ ] isRunning (実行中フラグ)
  - [ ] intervalId (setInterval ID)
  - [ ] startTime (開始時刻)
  - [ ] currentTaskId (実行中タスクID)
- [ ] メソッド
  - [ ] start() - 開始
  - [ ] pause() - 一時停止
  - [ ] reset() - リセット
  - [ ] skip() - スキップ
  - [ ] tick() - 1秒カウントダウン
  - [ ] onComplete() - 終了時コールバック
  - [ ] getFormattedTime() - MM:SS形式取得
  - [ ] getProgress() - 進捗率取得 (0-100)

#### 3.1.3 Statistics クラス
- [ ] プロパティ
  - [ ] todayPomodoros (今日の総ポモドーロ数)
  - [ ] todayCompletedTasks (今日の完了タスク数)
  - [ ] pomodoroTimestamps (完了タイムスタンプ配列)
- [ ] メソッド
  - [ ] addPomodoro() - ポモドーロ+1
  - [ ] getTotalWorkTime() - 総作業時間計算
  - [ ] getStreak() - 連続ポモドーロ数
  - [ ] resetDaily() - 日次リセット

### 3.2 ストレージ層

#### 3.2.1 StorageManager クラス
- [ ] メソッド
  - [ ] saveTasks(tasks) - タスク保存
  - [ ] loadTasks() - タスク読み込み
  - [ ] saveTimerState(timer) - タイマー状態保存
  - [ ] loadTimerState() - タイマー状態読み込み
  - [ ] saveStatistics(stats) - 統計保存
  - [ ] loadStatistics() - 統計読み込み
  - [ ] saveFilter(filter) - フィルタ保存
  - [ ] loadFilter() - フィルタ読み込み
  - [ ] clear() - 全データ削除
- [ ] エラーハンドリング
  - [ ] try-catch でLocalStorageエラー捕捉
  - [ ] 容量超過時のエラー処理
  - [ ] 無効化時のフォールバック

### 3.3 UI コントローラー層

#### 3.3.1 TodoController
- [ ] プロパティ
  - [ ] tasks (タスク配列)
  - [ ] currentFilter ('all' | 'active' | 'completed')
  - [ ] selectedTaskId (選択中タスクID)
- [ ] メソッド
  - [ ] addTask(title, estimatedPomodoros) - タスク追加
  - [ ] editTask(id, newTitle) - タスク編集
  - [ ] deleteTask(id) - タスク削除
  - [ ] toggleTaskComplete(id) - 完了切り替え
  - [ ] selectTask(id) - タスク選択
  - [ ] filterTasks(filter) - フィルタリング
  - [ ] getFilteredTasks() - フィルタ済みタスク取得
  - [ ] renderTasks() - タスクリスト描画
  - [ ] renderTaskItem(task) - タスク項目描画
  - [ ] showError(message) - エラー表示
  - [ ] clearInput() - 入力フォームクリア

#### 3.3.2 TimerController
- [ ] プロパティ
  - [ ] timer (Timerインスタンス)
  - [ ] settings (設定: 作業時間、休憩時間など)
- [ ] メソッド
  - [ ] startTimer() - タイマー開始
  - [ ] pauseTimer() - 一時停止
  - [ ] resetTimer() - リセット
  - [ ] skipTimer() - スキップ
  - [ ] updateDisplay() - 表示更新
  - [ ] updateProgress() - 進捗バー更新
  - [ ] onTimerComplete() - 終了時処理
  - [ ] playNotificationSound() - 通知音再生
  - [ ] showNotification() - ブラウザ通知
  - [ ] showCompletionModal() - 完了モーダル表示

#### 3.3.3 StatisticsController
- [ ] メソッド
  - [ ] updateStatistics() - 統計更新
  - [ ] renderStatistics() - 統計表示
  - [ ] resetDailyStats() - 日次リセット

### 3.4 イベントハンドラー

#### 3.4.1 Todoリストイベント
- [ ] タスク追加フォーム送信
  - [ ] Enterキー対応
  - [ ] 追加ボタンクリック
  - [ ] バリデーション (空文字、100文字制限)
- [ ] タスク編集
  - [ ] ダブルクリックで編集モード
  - [ ] Enterで確定
  - [ ] Escでキャンセル
  - [ ] 編集中の他操作制限
- [ ] タスク削除
  - [ ] 削除ボタンクリック
  - [ ] タイマー中は削除不可
  - [ ] フェードアウトアニメーション
- [ ] 完了チェック
  - [ ] チェックボックスクリック
  - [ ] 打ち消し線・色変更
- [ ] タスク選択
  - [ ] タスクカードクリック
  - [ ] ハイライト表示
- [ ] フィルタボタン
  - [ ] 全て/未完了/完了済み切り替え
  - [ ] アクティブ状態表示

#### 3.4.2 タイマーイベント
- [ ] 開始ボタン
  - [ ] タスク未選択チェック
  - [ ] タイマー開始処理
- [ ] 一時停止ボタン
  - [ ] 一時停止/再開切り替え
- [ ] リセットボタン
  - [ ] 確認ダイアログ表示
  - [ ] リセット実行
- [ ] スキップボタン
  - [ ] 作業↔休憩切り替え

#### 3.4.3 グローバルイベント
- [ ] ページ読み込み (DOMContentLoaded)
  - [ ] LocalStorageからデータ復元
  - [ ] タイマー状態復元
  - [ ] 初期表示
- [ ] ページアンロード (beforeunload)
  - [ ] 全データ保存
- [ ] キーボードイベント
  - [ ] Enter, Escape, Tab対応

### 3.5 ユーティリティ関数

- [ ] generateUUID() - UUID生成
- [ ] formatTime(seconds) - 秒をMM:SS形式に変換
- [ ] sanitizeHTML(text) - XSS対策 (textContent使用)
- [ ] debounce(func, wait) - 連続実行制御
- [ ] isToday(date) - 今日の日付判定
- [ ] clamp(value, min, max) - 値の範囲制限

### 3.6 初期化処理

- [ ] DOMContentLoaded イベント
  - [ ] コントローラー初期化
  - [ ] データ読み込み
  - [ ] イベントリスナー登録
  - [ ] 初期表示

---

## データ構造設計

### LocalStorage キー設計

```javascript
{
  "pomotodo_tasks": [ /* Task配列 */ ],
  "pomotodo_timer": { /* Timer状態 */ },
  "pomotodo_statistics": { /* Statistics */ },
  "pomotodo_filter": "all",
  "pomotodo_settings": { /* 設定 */ }
}
```

### Task データ構造

```javascript
{
  id: "uuid-v4",
  title: "タスク名",
  completed: false,
  estimatedPomodoros: 5,
  actualPomodoros: 0,
  createdAt: "2025-10-27T10:00:00Z",
  completedAt: null
}
```

### Timer 状態構造

```javascript
{
  mode: "work" | "break" | "stopped",
  remainingSeconds: 1500,
  isRunning: false,
  startTime: "2025-10-27T10:00:00Z",
  currentTaskId: "uuid-v4"
}
```

### Statistics 構造

```javascript
{
  todayPomodoros: 5,
  todayCompletedTasks: 2,
  pomodoroTimestamps: ["2025-10-27T10:25:00Z", ...],
  lastResetDate: "2025-10-27"
}
```

---

## コンポーネント設計

### HTML構造イメージ

```
#app
├── header
│   ├── h1 (タイトル)
│   └── .stats-summary (統計サマリー)
├── .timer-section
│   ├── .timer-display
│   │   ├── .timer-time (MM:SS)
│   │   ├── .timer-progress (進捗バー)
│   │   └── .timer-mode (作業中/休憩中)
│   ├── .current-task (選択中タスク名)
│   └── .timer-controls (ボタン群)
├── .todo-section
│   ├── .task-input-form
│   │   ├── input[type=text] (タスク名)
│   │   ├── input[type=number] (見積もり)
│   │   └── button (追加)
│   ├── .filter-buttons
│   └── .task-list (タスク一覧)
│       └── .task-item (x N個)
│           ├── input[type=checkbox]
│           ├── .task-title
│           ├── .task-pomodoros (🍅 3/5)
│           └── .task-delete (×)
└── .modal (エラー/通知)
```

---

## 実装優先順位

### 🔴 最優先 (必須機能)
1. [ ] HTML基本構造
2. [ ] CSS変数・基本スタイル
3. [ ] Task クラス実装
4. [ ] タスク追加・表示機能
5. [ ] LocalStorage保存・読み込み
6. [ ] Timer クラス実装
7. [ ] タイマー基本動作 (開始/停止)
8. [ ] タスク選択→タイマー連携
9. [ ] ポモドーロ数カウント

### 🟡 高優先度
10. [ ] タスク編集・削除
11. [ ] 完了チェック
12. [ ] フィルタリング
13. [ ] タイマー通知 (音・視覚)
14. [ ] 今日の統計表示
15. [ ] エラーハンドリング

### 🟢 中優先度
16. [ ] アニメーション
17. [ ] 進捗バー
18. [ ] レスポンシブ対応
19. [ ] キーボード操作
20. [ ] ダークモード

---

## テスト項目

### 機能テスト

#### Todoリスト
- [ ] タスク追加 - 正常系
- [ ] タスク追加 - 空文字エラー
- [ ] タスク追加 - 100文字超過エラー
- [ ] タスク編集 - ダブルクリック→Enter確定
- [ ] タスク編集 - Escキャンセル
- [ ] タスク削除 - 通常削除
- [ ] タスク削除 - タイマー中削除不可
- [ ] 完了チェック - ON/OFF切り替え
- [ ] フィルタ - 全て/未完了/完了済み
- [ ] LocalStorage保存 - リロード後復元

#### タイマー
- [ ] タイマー開始 - タスク選択済み
- [ ] タイマー開始 - タスク未選択エラー
- [ ] 一時停止・再開
- [ ] リセット - 確認ダイアログ
- [ ] スキップ - 作業↔休憩
- [ ] タイマー精度 - 25分で±1秒以内
- [ ] タイマー完了 - 通知表示
- [ ] タイマー完了 - ポモドーロ数+1
- [ ] リロード後タイマー復元

#### 統合
- [ ] タスク選択 - タイマー画面に表示
- [ ] ポモドーロ完了 - タスク実績更新
- [ ] 統計表示 - 今日の総数更新
- [ ] 進捗表示 - 実績/見積もり

### UI/UXテスト
- [ ] レスポンシブ - モバイル表示
- [ ] アニメーション - タスク追加/削除
- [ ] ホバー効果 - ボタン/タスク
- [ ] エラー表示 - わかりやすいメッセージ
- [ ] ローディング - 即座に反応

### パフォーマンステスト
- [ ] 100タスク - スムーズ動作
- [ ] メモリリーク - イベントリスナー削除
- [ ] LocalStorage容量 - エラーハンドリング

### セキュリティテスト
- [ ] XSS対策 - textContent使用確認
- [ ] 入力バリデーション - すべての入力

---

## 実装チェックリスト

### Phase 1: 基盤 (2分目標)
- ✅ 1.1 プロジェクトフォルダ作成
- ✅ 1.2 index.html 基本構造
- ✅ 1.3 style.css 変数定義・リセット
- ✅ 1.4 app.js 基本クラス宣言

### Phase 2: Todo (3分目標)
- ✅ 2.1 Task クラス完全実装
- ✅ 2.2 StorageManager 実装
- ✅ 2.3 TodoController 実装
- ✅ 2.4 タスク追加UI
- ✅ 2.5 タスク表示UI
- ✅ 2.6 完了・削除・編集機能
- ✅ 2.7 フィルタ機能

### Phase 3: Timer (3分目標)
- ✅ 3.1 Timer クラス実装
- ✅ 3.2 TimerController 実装
- ✅ 3.3 タイマーUI構築
- ✅ 3.4 開始/停止/リセット
- ✅ 3.5 通知機能実装
- ✅ 3.6 タスク連携

### Phase 4: 統合・調整 (2分目標)
- ✅ 4.1 Statistics 実装
- ✅ 4.2 進捗表示
- ✅ 4.3 アニメーション追加
- ✅ 4.4 エラーハンドリング強化
- ✅ 4.5 最終動作確認
- ✅ 4.6 コード最適化

---

## エラーメッセージ定義

| コード | メッセージ | トリガー |
|--------|-----------|---------|
| E001 | タスク名を入力してください | 空文字で追加 |
| E002 | タスク名は100文字以内で入力してください | 100文字超過 |
| E003 | タスクを選択してください | タスク未選択でタイマー開始 |
| E004 | タイマーを停止してから削除してください | タイマー中のタスク削除 |
| E005 | 保存容量が不足しています | LocalStorage満杯 |
| E006 | データの保存ができません | LocalStorage無効 |
| E007 | タイマーをリセットしますか？ | リセットボタン |
| E008 | 編集を完了してください | 編集中に他操作 |

---

## 設定値

### タイマー設定
```javascript
const DEFAULT_SETTINGS = {
  workDuration: 25 * 60,      // 25分
  shortBreak: 5 * 60,         // 5分
  longBreak: 15 * 60,         // 15分
  pomodorosUntilLongBreak: 4, // 長い休憩までの回数
  autoStartBreaks: true,       // 休憩自動開始
  autoStartPomodoros: false,   // 作業自動開始
  notificationSound: 'beep',   // 通知音
  volume: 0.5                  // 音量
};
```

### バリデーション
```javascript
const VALIDATION = {
  taskNameMaxLength: 100,
  taskNameMinLength: 1,
  estimatedPomodorosMin: 1,
  estimatedPomodorosMax: 20,
  maxTasks: 1000
};
```

---

## パフォーマンス目標

- [ ] タスク追加: < 100ms
- [ ] フィルタ切り替え: < 100ms
- [ ] タイマー精度: ±1秒
- [ ] メモリ使用量: < 5MB
- [ ] LocalStorage使用量: < 50KB (100タスク)

---

## 完成基準

### 必須機能 (50点)
- [ ] Todoリスト全機能 (20点)
- [ ] タイマー全機能 (20点)
- [ ] 統合機能 (10点)

### コード品質 (25点)
- [ ] 読みやすさ (8点)
- [ ] 保守性 (8点)
- [ ] バグの少なさ (9点)

### パフォーマンス (10点)
- [ ] 動作速度 (6点)
- [ ] メモリ効率 (4点)

### UX (15点)
- [ ] 使いやすさ (10点)
- [ ] デザイン (5点)

**合計: 100点満点**

---

## 最終確認項目

- [ ] 全ての必須機能が動作する
- [ ] エラーハンドリングが適切
- [ ] XSS対策が施されている
- [ ] LocalStorage保存・復元が正常
- [ ] タイマー精度が±1秒以内
- [ ] レスポンシブデザイン対応
- [ ] ブラウザ互換性確認 (Chrome, Firefox, Safari, Edge)
- [ ] 3ファイル構成を守っている
- [ ] 700行以内に収まっている
- [ ] フレームワーク/ライブラリ未使用

---

**この実装計画に従って、効率的かつ高品質なPomoTodoアプリを構築します。**
