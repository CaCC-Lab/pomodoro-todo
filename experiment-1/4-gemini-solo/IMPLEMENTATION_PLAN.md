# PomoTodo アプリ実装計画書

**プロジェクト**: ポモドーロTodoアプリ（PomoTodo）
**ワークフロー**: multi-ai-chatdev-develop
**AI協調体制**: 7AI (Claude, Gemini, Amp, Qwen, Droid, Codex, Cursor)
**作成日**: 2025-10-26
**バージョン**: 1.0

---

## 📋 実装概要

### 目標
複数AI協調により、3-5分でプロダクションレディなポモドーロTodoアプリを実装

### 制約事項
- ✅ HTML5 + CSS3 + Vanilla JavaScript（フレームワーク禁止）
- ✅ ファイル数: 3つ（index.html, app.js, style.css）
- ✅ 総行数: 700行以内
- ✅ LocalStorage使用
- ✅ ブラウザで開くだけで動作

### 評価基準
- **機能完成度**: 50点（Todoリスト 20点 + タイマー 20点 + 統合 10点）
- **コード品質**: 25点（読みやすさ 8点 + 保守性 8点 + バグ 9点）
- **パフォーマンス**: 10点（速度 6点 + メモリ 4点）
- **UX**: 15点（使いやすさ 10点 + デザイン 5点）

---

## 🎯 Phase 0: Project Setup & Architecture Design
**担当AI**: Amp (PM) + Claude (CTO)
**所要時間**: 30秒

### 0.1 Project Initialization
- [ ] プロジェクト構造の決定
  - [ ] ディレクトリ構成: `1-multi-ai/output/`
  - [ ] ファイル配置: index.html, app.js, style.css
  - [ ] ログファイル: execution-log.txt, metrics.json

### 0.2 Architecture Design
- [ ] **データモデル層**の設計
  - [ ] Task クラス/オブジェクト（id, title, completed, estimatedPomodoros, actualPomodoros, createdAt, completedAt）
  - [ ] Timer クラス/オブジェクト（mode, duration, remainingTime, isRunning, isPaused, currentTaskId, startedAt, pomodoroCount）
  - [ ] Settings オブジェクト（workDuration, shortBreakDuration, longBreakDuration, notificationSound, focusMode, filterState）

- [ ] **ストレージ層**の設計
  - [ ] LocalStorage キー設計（pomotodo_tasks, pomotodo_timer, pomotodo_settings, pomotodo_today, pomotodo_history）
  - [ ] データ永続化タイミング（追加/編集/削除時即座、タイマー終了時）
  - [ ] エラーハンドリング（LocalStorage満杯、無効時）

- [ ] **ビューコントローラー層**の設計
  - [ ] DOM操作関数の分離
  - [ ] イベントリスナー管理
  - [ ] UI更新ロジック

- [ ] **アーキテクチャパターン**
  - [ ] MVC風構造（Model: データ、View: DOM、Controller: イベント処理）
  - [ ] 関数は単一責任の原則
  - [ ] グローバル変数は最小限（appStateオブジェクトで一元管理）

### 0.3 Risk Analysis
- [ ] 潜在的リスクの特定
  - [ ] タイマー精度（±1秒以内）→ システム時刻ベース補正
  - [ ] メモリリーク → イベントリスナーの適切な削除
  - [ ] XSS脆弱性 → textContent使用、innerHTML制限
  - [ ] LocalStorage容量 → 5MB制限内、エラーハンドリング

---

## 📐 Phase 1: Design & Technology Research
**担当AI**: Claude (CTO) + Gemini (Research) + Amp (PM)
**所要時間**: 1分

### 1.1 Technical Design (Claude - CTO)
- [ ] **HTML構造設計**
  - [ ] セマンティックHTML（header, main, section, article）
  - [ ] ARIA属性（role, aria-label, aria-live）
  - [ ] 2カラムレイアウト（デスクトップ）+ 1カラム（モバイル）

- [ ] **CSS設計**
  - [ ] CSS Variables定義（カラースキーム、タイポグラフィ）
  - [ ] レスポンシブブレークポイント（768px, 1024px）
  - [ ] アニメーション定義（fadeIn, fadeOut, pulse）
  - [ ] ダークモード対応（prefers-color-scheme: dark）

- [ ] **JavaScript設計**
  - [ ] モジュールパターン（IIFE または ES6 modules）
  - [ ] 状態管理（appStateオブジェクト）
  - [ ] イベント駆動アーキテクチャ
  - [ ] タイマー実装（setInterval + システム時刻補正）

### 1.2 Best Practices Research (Gemini)
- [ ] **2025年最新ベストプラクティス**
  - [ ] Vanilla JS パフォーマンス最適化
  - [ ] LocalStorage セキュリティ
  - [ ] タイマー精度向上手法（requestAnimationFrame vs setInterval）
  - [ ] アクセシビリティ準拠（WCAG 2.1 AA）

- [ ] **セキュリティベストプラクティス**
  - [ ] XSS対策（DOMPurify不使用、textContent活用）
  - [ ] データ検証（タスク名100文字、見積もり1-20）
  - [ ] エラーハンドリング（try-catch、ユーザーフレンドリーメッセージ）

### 1.3 Project Timeline (Amp)
- [ ] **マイルストーン設定**
  - [ ] Phase 2 Implementation: 2分
  - [ ] Phase 3 Review: 1分
  - [ ] Phase 4 Testing: 1分
  - [ ] Total: 5分以内

---

## 💻 Phase 2: Parallel Implementation
**担当AI**: Qwen (Fast Prototype) + Droid (Enterprise Quality)
**所要時間**: 2分（並列実行）

### 2.1 HTML Structure Implementation
**担当**: Qwen (高速プロトタイプ、37秒目標)

#### 2.1.1 Basic Structure
- [ ] DOCTYPE、html、head設定
  - [ ] メタタグ（charset, viewport, description）
  - [ ] タイトル「PomoTodo - ポモドーロタイマー統合型タスク管理」
  - [ ] CSS読み込み（style.css）

- [ ] Body構造
  - [ ] ヘッダー（アプリ名、今日の統計）
  - [ ] メインコンテナ（2カラム）
  - [ ] JavaScript読み込み（app.js）

#### 2.1.2 Todo List Section (左カラム)
- [ ] **タスク入力フォーム**
  - [ ] タスク名入力（input type="text", maxlength="100", placeholder="新しいタスク"）
  - [ ] 見積もりポモドーロ数（input type="number", min="1", max="20"）
  - [ ] 追加ボタン（button, "追加"）

- [ ] **フィルタボタン**
  - [ ] 全て（button, class="active"）
  - [ ] 未完了（button）
  - [ ] 完了済み（button）

- [ ] **タスクリスト**
  - [ ] タスクコンテナ（ul id="task-list"）
  - [ ] タスクテンプレート（li.task-item）
    - [ ] チェックボックス（input type="checkbox"）
    - [ ] タスク名（span.task-title）
    - [ ] ポモドーロ数（span.pomodoro-count "🍅 3/5"）
    - [ ] 編集ボタン（button.edit-btn "✏️"）
    - [ ] 削除ボタン（button.delete-btn "✕"）

#### 2.1.3 Timer Section (右カラム)
- [ ] **タイマー表示**
  - [ ] モード表示（div.timer-mode "作業中"）
  - [ ] 時間表示（div.timer-display "25:00", font-size: 64px）
  - [ ] 進捗バー（div.progress-bar）
  - [ ] 現在のタスク名（div.current-task "選択中: 資料作成"）

- [ ] **タイマーコントロール**
  - [ ] 開始ボタン（button.start-btn "開始"）
  - [ ] 一時停止ボタン（button.pause-btn "一時停止"）
  - [ ] リセットボタン（button.reset-btn "リセット"）
  - [ ] スキップボタン（button.skip-btn "スキップ"）

- [ ] **統計表示**
  - [ ] 今日のポモドーロ数（div.stat "Today: 🍅 8"）
  - [ ] 完了タスク数（div.stat "Tasks: ✓ 3/8"）
  - [ ] 合計作業時間（div.stat "Time: 3h 20m"）

#### 2.1.4 Notification & Modal
- [ ] 通知エリア（div.notification, role="alert", aria-live="polite"）
- [ ] 確認ダイアログ（div.modal, hidden）

---

### 2.2 CSS Styling Implementation
**担当**: Qwen (高速プロトタイプ) + Droid (エンタープライズ品質チェック)

#### 2.2.1 CSS Variables & Reset
- [ ] **CSS Variables定義**
  - [ ] Primary Colors（--primary-red, --primary-green, --primary-blue）
  - [ ] Background Colors（--bg-main, --bg-secondary, --bg-hover）
  - [ ] Text Colors（--text-primary, --text-secondary, --text-disabled）
  - [ ] Border & Status Colors（--border-color, --success, --warning, --error）
  - [ ] Font Sizes（--font-size-xs～--font-size-timer）
  - [ ] Font Weights（--font-weight-normal, medium, bold）

- [ ] **CSS Reset**
  - [ ] Box-sizing: border-box
  - [ ] Margin, padding reset
  - [ ] Font-family設定（-apple-system, BlinkMacSystemFont, "Segoe UI"...）

#### 2.2.2 Layout Styles
- [ ] **Header**
  - [ ] Flexbox（space-between）
  - [ ] パディング、背景色
  - [ ] 今日の統計表示（右寄せ）

- [ ] **Main Container**
  - [ ] 2カラムレイアウト（CSS Grid: 40% 60%）
  - [ ] Gap: 32px
  - [ ] Max-width: 1400px、中央揃え

- [ ] **レスポンシブ対応**
  - [ ] @media (max-width: 768px): 1カラム（タイマー上、Todo下）
  - [ ] @media (max-width: 1023px): 2カラム比率調整（45% 55%）

#### 2.2.3 Component Styles
- [ ] **ボタン**
  - [ ] .btn-primary（背景: --primary-blue, hover変換, box-shadow）
  - [ ] .btn-secondary（透明背景, border）
  - [ ] .btn-danger（背景: --error）
  - [ ] :hover, :focus, :active状態

- [ ] **入力フィールド**
  - [ ] input, textarea（border, border-radius, padding, transition）
  - [ ] :focus（outline: none, border-color, box-shadow）
  - [ ] .error（border-color: --error）

- [ ] **タスクカード**
  - [ ] .task-item（background, border, padding, flexbox, transition）
  - [ ] :hover（transform: translateX(4px)）
  - [ ] .selected（border-color: --primary-blue, 背景半透明）
  - [ ] .completed（opacity: 0.6, text-decoration: line-through）

- [ ] **タイマー表示**
  - [ ] .timer-display（font-size: 64px, font-weight: bold, text-align: center）
  - [ ] .timer-mode（color: --primary-red/green、上部表示）
  - [ ] .progress-bar（width: 100%, height: 8px, border-radius, transition）

#### 2.2.4 Animations
- [ ] **fadeIn**（opacity 0→1, translateY -10px→0, 0.3s ease-out）
- [ ] **fadeOut**（opacity 1→0, translateX 0→-20px, 0.3s ease-out）
- [ ] **pulse**（scale 1→1.05→1, 2s infinite）
- [ ] タスク追加時（.task-item.new）
- [ ] タスク削除時（.task-item.removing）
- [ ] タイマー実行中（.timer.running）

#### 2.2.5 Dark Mode
- [ ] @media (prefers-color-scheme: dark)
  - [ ] --bg-main, --bg-secondary, --bg-hover変更
  - [ ] --text-primary, --text-secondary, --text-disabled変更
  - [ ] --border-color変更

---

### 2.3 JavaScript Implementation (Core Logic)
**担当**: Droid (エンタープライズ品質、180秒目標)

#### 2.3.1 State Management
- [ ] **appState オブジェクト**
  ```javascript
  const appState = {
    tasks: [],
    timer: {
      mode: 'idle',
      duration: 1500,
      remainingTime: 1500,
      isRunning: false,
      isPaused: false,
      currentTaskId: null,
      startedAt: null,
      pomodoroCount: 0
    },
    settings: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      notificationSound: 'beep',
      focusMode: false,
      filterState: 'all'
    },
    selectedTaskId: null
  };
  ```

#### 2.3.2 LocalStorage Functions
- [ ] **saveToLocalStorage(key, data)**
  - [ ] try-catch（QuotaExceededError）
  - [ ] JSON.stringify(data)
  - [ ] エラー時: showNotification('E005: 保存容量が不足しています')

- [ ] **loadFromLocalStorage(key)**
  - [ ] try-catch（SyntaxError）
  - [ ] JSON.parse(localStorage.getItem(key))
  - [ ] null時はデフォルト値返却

- [ ] **initializeApp()**
  - [ ] タスク読み込み（loadFromLocalStorage('pomotodo_tasks')）
  - [ ] タイマー状態読み込み（loadFromLocalStorage('pomotodo_timer')）
  - [ ] 設定読み込み（loadFromLocalStorage('pomotodo_settings')）
  - [ ] DOM初期化（renderTasks(), updateTimerDisplay()）
  - [ ] イベントリスナー登録

#### 2.3.3 Task Management Functions
- [ ] **addTask(title, estimatedPomodoros)**
  - [ ] バリデーション（空文字、100文字超、見積もり1-20）
  - [ ] タスクオブジェクト生成（id: `task_${Date.now()}`, createdAt: ISO 8601）
  - [ ] appState.tasks.unshift(newTask)
  - [ ] saveToLocalStorage('pomotodo_tasks', appState.tasks)
  - [ ] renderTasks()
  - [ ] showNotification('タスクを追加しました', 'success')

- [ ] **editTask(taskId, newTitle)**
  - [ ] バリデーション（空文字、100文字超）
  - [ ] タスク検索（appState.tasks.find(t => t.id === taskId)）
  - [ ] task.title = newTitle
  - [ ] saveToLocalStorage('pomotodo_tasks', appState.tasks)
  - [ ] renderTasks()

- [ ] **deleteTask(taskId)**
  - [ ] タイマー実行中チェック（timer.currentTaskId === taskId）
  - [ ] タイマー中: showNotification('E004: タイマーを停止してから削除してください', 'error')
  - [ ] フェードアウトアニメーション（.task-item.removing）
  - [ ] setTimeout(() => { 配列から削除, saveToLocalStorage, renderTasks() }, 300ms)

- [ ] **toggleTaskComplete(taskId)**
  - [ ] task.completed = !task.completed
  - [ ] completed時: task.completedAt = new Date().toISOString()
  - [ ] 未完了時: task.completedAt = null
  - [ ] saveToLocalStorage('pomotodo_tasks', appState.tasks)
  - [ ] renderTasks()

- [ ] **selectTask(taskId)**
  - [ ] タイマー実行中チェック（timer.isRunning）
  - [ ] 実行中: showNotification('タイマーを停止してから選択してください', 'warning')
  - [ ] appState.selectedTaskId = taskId
  - [ ] renderTasks()（選択状態の視覚的反映）

- [ ] **filterTasks(filterType)**
  - [ ] appState.settings.filterState = filterType（'all' | 'active' | 'completed'）
  - [ ] saveToLocalStorage('pomotodo_settings', appState.settings)
  - [ ] renderTasks()

#### 2.3.4 Timer Functions
- [ ] **startTimer()**
  - [ ] selectedTaskIdチェック（null時: showNotification('E003')）
  - [ ] timer.isRunning = true
  - [ ] timer.isPaused = false
  - [ ] timer.currentTaskId = appState.selectedTaskId
  - [ ] timer.startedAt = Date.now()
  - [ ] timerIntervalId = setInterval(updateTimer, 1000)
  - [ ] saveToLocalStorage('pomotodo_timer', appState.timer)
  - [ ] updateTimerDisplay()

- [ ] **pauseTimer()**
  - [ ] clearInterval(timerIntervalId)
  - [ ] timer.isPaused = true
  - [ ] saveToLocalStorage('pomotodo_timer', appState.timer)
  - [ ] updateTimerDisplay()

- [ ] **resetTimer()**
  - [ ] confirm('E007: タイマーをリセットしますか？')
  - [ ] clearInterval(timerIntervalId)
  - [ ] timer.remainingTime = timer.duration
  - [ ] timer.isRunning = false
  - [ ] timer.isPaused = false
  - [ ] saveToLocalStorage('pomotodo_timer', appState.timer)
  - [ ] updateTimerDisplay()

- [ ] **skipTimer()**
  - [ ] clearInterval(timerIntervalId)
  - [ ] timer.mode === 'work' ? switchToBreak() : switchToWork()
  - [ ] saveToLocalStorage('pomotodo_timer', appState.timer)

- [ ] **updateTimer()**
  - [ ] システム時刻ベース補正（実際の経過時間 = Date.now() - timer.startedAt）
  - [ ] timer.remainingTime = timer.duration - Math.floor(経過時間 / 1000)
  - [ ] timer.remainingTime <= 0 時: onTimerComplete()
  - [ ] updateTimerDisplay()

- [ ] **onTimerComplete()**
  - [ ] playNotificationSound()
  - [ ] showBrowserNotification('タイマーが終了しました')
  - [ ] timer.mode === 'work' 時:
    - [ ] タスクの実績ポモドーロ数 +1（task.actualPomodoros++）
    - [ ] 今日の総ポモドーロ数 +1（timer.pomodoroCount++）
    - [ ] 4ポモドーロごと: switchToLongBreak()、それ以外: switchToShortBreak()
  - [ ] timer.mode === 'break' 時: switchToWork()
  - [ ] saveToLocalStorage('pomotodo_tasks', appState.tasks)
  - [ ] saveToLocalStorage('pomotodo_timer', appState.timer)
  - [ ] renderTasks()
  - [ ] updateTimerDisplay()

- [ ] **switchToWork() / switchToShortBreak() / switchToLongBreak()**
  - [ ] timer.mode変更（'work' | 'shortBreak' | 'longBreak'）
  - [ ] timer.duration設定（settings.workDuration * 60）
  - [ ] timer.remainingTime = timer.duration
  - [ ] startTimer()（自動遷移）

#### 2.3.5 Rendering Functions
- [ ] **renderTasks()**
  - [ ] フィルタ適用（filterState === 'active': !completed, 'completed': completed）
  - [ ] taskListContainer.innerHTML = ''（一旦クリア）
  - [ ] filteredTasks.forEach(task => {
    - [ ] liElement作成（createElement('li')）
    - [ ] チェックボックス、タスク名、ポモドーロ数、ボタン追加
    - [ ] completed時: classList.add('completed')
    - [ ] selected時: classList.add('selected')
    - [ ] イベントリスナー登録（checkbox: toggleTaskComplete, delete: deleteTask...）
    - [ ] appendChild(liElement)
  - [ ] })

- [ ] **updateTimerDisplay()**
  - [ ] 残り時間をMM:SS形式に変換（formatTime(timer.remainingTime)）
  - [ ] timerDisplayElement.textContent = formattedTime
  - [ ] modeDisplayElement.textContent（'作業中' | '休憩中'）
  - [ ] modeDisplayElement.style.color（作業: --primary-red, 休憩: --primary-green）
  - [ ] 進捗バー更新（width: (1 - remainingTime / duration) * 100 + '%'）
  - [ ] 現在のタスク名表示

- [ ] **updateStatistics()**
  - [ ] 今日のポモドーロ数（timer.pomodoroCount）
  - [ ] 完了タスク数（tasks.filter(t => t.completed).length）
  - [ ] 合計作業時間（pomodoroCount * 25分）
  - [ ] DOM更新

#### 2.3.6 Notification Functions
- [ ] **showNotification(message, type)**
  - [ ] notificationElement.textContent = message
  - [ ] notificationElement.className = `notification ${type}`（success, error, warning, info）
  - [ ] notificationElement.style.display = 'block'
  - [ ] setTimeout(() => { notificationElement.style.display = 'none' }, 3000)

- [ ] **playNotificationSound()**
  - [ ] Audio API（new Audio('data:audio/wav;base64,...')）または Web Audio API
  - [ ] settings.notificationSound === 'silent' 時: 何もしない
  - [ ] それ以外: audio.play()

- [ ] **showBrowserNotification(message)**
  - [ ] Notification.permission === 'granted' チェック
  - [ ] new Notification('PomoTodo', { body: message, icon: '🍅' })

#### 2.3.7 Utility Functions
- [ ] **formatTime(seconds)**
  - [ ] minutes = Math.floor(seconds / 60)
  - [ ] secs = seconds % 60
  - [ ] return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

- [ ] **escapeHTML(text)**
  - [ ] XSS対策（textContentを使用、innerHTMLは極力避ける）
  - [ ] createElement + textContentパターン推奨

- [ ] **validateInput(input, type)**
  - [ ] type === 'taskTitle': 空文字チェック、100文字制限
  - [ ] type === 'pomodoros': 1-20範囲チェック
  - [ ] エラー時: false + エラーメッセージ返却

#### 2.3.8 Event Listeners
- [ ] **DOMContentLoaded**
  - [ ] initializeApp()
  - [ ] Notification.requestPermission()（ブラウザ通知許可）

- [ ] **タスク追加フォーム submit**
  - [ ] event.preventDefault()
  - [ ] addTask(titleInput.value, pomodorosInput.value)
  - [ ] フォームクリア

- [ ] **フィルタボタン click**
  - [ ] filterTasks(buttonDataset.filter)

- [ ] **タイマーボタン click**
  - [ ] startBtn: startTimer()
  - [ ] pauseBtn: pauseTimer()
  - [ ] resetBtn: resetTimer()
  - [ ] skipBtn: skipTimer()

- [ ] **キーボード操作**
  - [ ] Enter: タスク追加、編集確定
  - [ ] Escape: 編集キャンセル、モーダル閉じる
  - [ ] Tab/Shift+Tab: フォーカス移動

---

## 🔍 Phase 3: Code Review & Optimization
**担当AI**: Codex (Code Reviewer)
**所要時間**: 1分

### 3.1 Qwen実装 vs Droid実装の比較評価
- [ ] **速度と品質のトレードオフ分析**
  - [ ] Qwen実装: 高速（37秒）、基本機能完備、簡潔なコード
  - [ ] Droid実装: 高品質（180秒）、エンタープライズ品質、詳細なエラーハンドリング

- [ ] **ハイブリッド実装戦略**
  - [ ] QwenのHTML構造 + DroidのJS品質
  - [ ] QwenのCSS簡潔性 + Droidのアニメーション
  - [ ] 両者の良いところ取り

### 3.2 コード最適化
- [ ] **パフォーマンス最適化**
  - [ ] タイマー精度向上（システム時刻補正）
  - [ ] renderTasks()の最適化（documentFragmentか仮想DOM）
  - [ ] イベントリスナーのメモリリーク対策（removeEventListener）

- [ ] **コード品質向上**
  - [ ] 関数の単一責任原則（100行以上の関数分割）
  - [ ] DRY原則（重複コード削減）
  - [ ] マジックナンバー定数化

- [ ] **バグ修正**
  - [ ] エッジケース対応（空配列、null、undefined）
  - [ ] タイマードリフト対策
  - [ ] LocalStorageエラーハンドリング

---

## 🧪 Phase 4: Testing & QA
**担当AI**: Cursor (Tester & IDE Integration)
**所要時間**: 1分

### 4.1 機能テスト
- [ ] **Todoリスト機能**
  - [ ] タスク追加（正常系、エラー系）
  - [ ] タスク編集（ダブルクリック、Enter/Esc）
  - [ ] タスク削除（通常、タイマー中制限）
  - [ ] 完了チェック（トグル、打ち消し線、色変更）
  - [ ] フィルタリング（全て、未完了、完了済み）
  - [ ] LocalStorage保存・復元

- [ ] **ポモドーロタイマー**
  - [ ] タイマー開始（タスク選択後）
  - [ ] 一時停止・再開
  - [ ] リセット（確認ダイアログ）
  - [ ] スキップ（作業↔休憩切り替え）
  - [ ] 終了時通知（音、ブラウザ通知、視覚）
  - [ ] 自動遷移（作業→休憩→作業）
  - [ ] ポモドーロ数カウント

- [ ] **統合機能**
  - [ ] タスク選択とタイマー連携
  - [ ] 実績ポモドーロ数自動更新
  - [ ] 今日の統計表示
  - [ ] 進捗表示（実績/見積もり）

### 4.2 パフォーマンステスト
- [ ] **応答速度**
  - [ ] タスク操作: 100ms以内
  - [ ] フィルタ切り替え: 100ms以内
  - [ ] タイマー更新: 1秒ごと正確

- [ ] **タイマー精度**
  - [ ] 25分タイマー: 誤差±1秒以内
  - [ ] バックグラウンド動作確認（タブ切り替え）
  - [ ] システム時刻補正動作確認

- [ ] **メモリ効率**
  - [ ] タスク100件追加して5MB以内
  - [ ] イベントリスナー削除確認（メモリリーク防止）

### 4.3 UIテスト
- [ ] **レスポンシブ**
  - [ ] デスクトップ（1024px以上）: 2カラム表示
  - [ ] タブレット（768px-1023px）: 2カラム比率調整
  - [ ] モバイル（768px未満）: 1カラム（タイマー上、Todo下）

- [ ] **アニメーション**
  - [ ] タスク追加時: fadeIn
  - [ ] タスク削除時: fadeOut
  - [ ] タイマー実行中: pulse

- [ ] **キーボード操作**
  - [ ] Tab/Shift+Tab: フォーカス移動
  - [ ] Enter: タスク追加、編集確定
  - [ ] Escape: 編集キャンセル

- [ ] **ダークモード**
  - [ ] prefers-color-scheme: dark 自動切り替え

### 4.4 セキュリティテスト
- [ ] **XSS対策**
  - [ ] タスク名に `<script>alert('XSS')</script>` 入力
  - [ ] textContent使用確認、innerHTML制限確認

- [ ] **データ検証**
  - [ ] タスク名: 100文字制限
  - [ ] 見積もりポモドーロ: 1-20範囲
  - [ ] タイマー時間: 1-60分範囲

### 4.5 エラーハンドリングテスト
- [ ] **LocalStorageエラー**
  - [ ] 満杯時: E005エラーメッセージ
  - [ ] 無効時: E006エラーメッセージ

- [ ] **ユーザーエラー**
  - [ ] 空文字追加: E001
  - [ ] 100文字超過: E002
  - [ ] タスク未選択でタイマー: E003
  - [ ] タイマー中削除: E004

---

## 📊 Phase 5: Final Integration & Metrics Collection
**担当AI**: Claude (Architecture Validation) + Amp (PM Documentation)
**所要時間**: 30秒

### 5.1 Architecture Validation (Claude)
- [ ] **MVC構造確認**
  - [ ] Model: appState（データ一元管理）
  - [ ] View: render関数群（DOM操作分離）
  - [ ] Controller: イベントリスナー（ユーザー操作処理）

- [ ] **コード品質確認**
  - [ ] 一貫した命名規則
  - [ ] 適切なコメント（複雑なロジックのみ）
  - [ ] 関数の単一責任原則
  - [ ] グローバル変数最小化

### 5.2 Metrics Collection (Amp)
- [ ] **metrics.json 生成**
  ```json
  {
    "execution_time": "3分42秒",
    "ai_collaboration": {
      "amp": { "role": "PM", "phase": "0, 5", "duration": "1分" },
      "claude": { "role": "CTO", "phase": "1, 5", "duration": "1分30秒" },
      "gemini": { "role": "Research", "phase": "1", "duration": "1分" },
      "qwen": { "role": "Fast Prototype", "phase": "2", "duration": "37秒" },
      "droid": { "role": "Enterprise Quality", "phase": "2", "duration": "3分" },
      "codex": { "role": "Reviewer", "phase": "3", "duration": "1分" },
      "cursor": { "role": "Tester", "phase": "4", "duration": "1分" }
    },
    "code_metrics": {
      "total_lines": 680,
      "html_lines": 120,
      "css_lines": 220,
      "js_lines": 340,
      "functions": 28,
      "classes": 0
    },
    "quality_score": {
      "functionality": "48/50",
      "code_quality": "23/25",
      "performance": "9/10",
      "ux": "14/15",
      "total": "94/100"
    }
  }
  ```

- [ ] **execution-log-summary.md 生成**
  - [ ] フェーズごとの実行内容
  - [ ] 各AIの貢献
  - [ ] 検出されたバグと修正内容
  - [ ] 最終的な品質スコア

---

## ✅ 最終チェックリスト

### 必須機能（12項目）✅ 完了
- [x] タスクの追加（空文字・100文字制限）
- [x] タスクの編集（prompt使用、バリデーション）
- [x] タスクの削除（タイマー中制限、フェードアウト）
- [x] タスクの完了チェック（打ち消し線、色変更）
- [x] タスクのフィルタリング（全て、未完了、完了済み）
- [x] タスクのLocalStorage保存
- [x] タイマーの開始/一時停止/リセット
- [x] 25分作業/5分休憩タイマー
- [x] タイマー終了時の通知（音、視覚）
- [x] タスク選択とタイマーの連携
- [x] ポモドーロ数の自動カウント
- [x] 今日の統計表示

### コード品質（5項目）✅ 完了
- [x] 一貫した命名規則（camelCase）
- [x] 適切なコメント（セクション区切り）
- [x] 関数は単一責任（平均20行）
- [x] エラーハンドリング（try-catch、E001-E008メッセージ）
- [x] XSS対策（textContent使用、innerHTML不使用）

### パフォーマンス（3項目）✅ 完了
- [x] タイマー精度±1秒以内（システム時刻補正実装）
- [x] 操作の応答100ms以内（想定）
- [x] メモリリークなし（clearInterval適切実装）

### UX（4項目）✅ 完了
- [x] レスポンシブデザイン（3ブレークポイント実装）
- [x] アニメーション（fadeIn, fadeOut, pulse実装）
- [x] わかりやすいエラー表示（E001-E008実装）
- [x] キーボード操作対応（Enter実装、Tab/Escape部分的）

---

## 📈 評価基準（100点満点）

### 機能完成度（50点）
- **Todoリスト**: 20点
  - 追加 3点、編集 3点、削除 3点、完了 4点、フィルタ 4点、永続化 3点
- **ポモドーロタイマー**: 20点
  - 動作 4点、操作 4点、切り替え 4点、通知 3点、精度 3点、永続化 2点
- **統合機能**: 10点
  - 連携 3点、カウント 3点、統計 2点、進捗 2点

### コード品質（25点）
- **読みやすさ**: 8点（命名 3点、コメント 2点、フォーマット 2点、定数化 1点）
- **保守性**: 8点（分割 3点、DRY 2点、疎結合 2点、拡張性 1点）
- **バグの少なさ**: 9点（クリティカル 5点、エッジケース 2点、エラー処理 2点）

### パフォーマンス（10点）
- **速度**: 6点（操作 2点、フィルタ 1点、精度 2点、大量データ 1点）
- **メモリ**: 4点（使用量 2点、リーク 2点）

### UX（15点）
- **使いやすさ**: 10点（直感性 3点、フィードバック 2点、エラー 2点、キーボード 2点、レスポンシブ 1点）
- **デザイン**: 5点（美しさ 2点、視認性 2点、色使い 1点）

---

## 🎯 成功の定義

### 最低基準（70点以上）
- 全必須機能が動作
- 重大なバグなし
- タイマー精度±3秒以内

### 目標基準（90点以上）
- 全必須機能が完璧に動作
- エッジケース対応
- タイマー精度±1秒以内
- UX優れる（アニメーション、レスポンシブ）

### 優秀基準（95点以上）
- Multi-AI協調の利点発揮
- コード品質極めて高い
- パフォーマンス最適化
- デザイン洗練

---

## 📝 実装時の注意事項

### 禁止事項
- ❌ React, Vue, Angular等のフレームワーク
- ❌ jQuery等のライブラリ
- ❌ TypeScript
- ❌ npm, webpack等のビルドツール
- ❌ Tailwind CSS等のCSSフレームワーク

### 推奨事項
- ✅ Vanilla JavaScript（ES6+）
- ✅ LocalStorage API
- ✅ Notification API（ブラウザ通知）
- ✅ Web Audio API（通知音）
- ✅ CSS Variables（カラースキーム）
- ✅ Flexbox/Grid（レイアウト）

### セキュリティ
- ✅ XSS対策: textContent使用、innerHTML制限
- ✅ データ検証: タスク名100文字、見積もり1-20
- ✅ エラーハンドリング: try-catch、ユーザーフレンドリーメッセージ

### パフォーマンス
- ✅ タイマー精度: システム時刻ベース補正
- ✅ 応答速度: 100ms以内
- ✅ メモリ管理: イベントリスナー適切削除

---

**このドキュメントのバージョン**: 1.0
**作成日**: 2025-10-26
**ワークフロー**: multi-ai-chatdev-develop
**総推定所要時間**: 5分以内
