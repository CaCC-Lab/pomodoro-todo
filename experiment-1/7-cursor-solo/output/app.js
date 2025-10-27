// ========================================
// PomoTodo - Pomodoro Timer & Todo App
// ========================================

// ========================================
// State Management
// ========================================
const appState = {
    tasks: [],
    timer: {
        mode: 'idle', // 'idle' | 'work' | 'shortBreak' | 'longBreak'
        duration: 1500, // 秒数
        remainingTime: 1500,
        isRunning: false,
        isPaused: false,
        currentTaskId: null,
        startedAt: null,
        pomodoroCount: 0
    },
    settings: {
        workDuration: 25, // 分
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        notificationSound: 'beep',
        focusMode: false,
        filterState: 'all' // 'all' | 'active' | 'completed'
    },
    selectedTaskId: null
};

// タイマーインターバルID
let timerIntervalId = null;

// ========================================
// LocalStorage Functions
// ========================================

/**
 * LocalStorageにデータを保存
 * @param {string} key - 保存キー
 * @param {any} data - 保存データ
 */
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            showNotification('E005: 保存容量が不足しています', 'error');
        } else {
            showNotification('E006: データの保存に失敗しました', 'error');
        }
    }
}

/**
 * LocalStorageからデータを読み込み
 * @param {string} key - 読み込みキー
 * @returns {any} - 読み込みデータ（存在しない場合はnull）
 */
function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('LocalStorage読み込みエラー:', e);
        return null;
    }
}

// ========================================
// Initialization
// ========================================

/**
 * アプリケーション初期化
 */
function initializeApp() {
    // LocalStorageからデータ読み込み
    const savedTasks = loadFromLocalStorage('pomotodo_tasks');
    const savedTimer = loadFromLocalStorage('pomotodo_timer');
    const savedSettings = loadFromLocalStorage('pomotodo_settings');

    if (savedTasks) {
        appState.tasks = savedTasks;
    }

    if (savedTimer) {
        appState.timer = { ...appState.timer, ...savedTimer };
        // タイマーが実行中だった場合はリセット
        if (appState.timer.isRunning) {
            appState.timer.isRunning = false;
            appState.timer.isPaused = false;
        }
    }

    if (savedSettings) {
        appState.settings = { ...appState.settings, ...savedSettings };
    }

    // UI初期化
    renderTasks();
    updateTimerDisplay();
    updateStatistics();
    
    // イベントリスナー登録
    registerEventListeners();

    // ブラウザ通知の許可リクエスト
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// ========================================
// Task Management Functions
// ========================================

/**
 * タスクを追加
 * @param {string} title - タスク名
 * @param {number} estimatedPomodoros - 見積もりポモドーロ数
 */
function addTask(title, estimatedPomodoros) {
    // バリデーション
    if (!title || title.trim() === '') {
        showNotification('E001: タスク名を入力してください', 'error');
        return;
    }

    if (title.length > 100) {
        showNotification('E002: タスク名は100文字以内で入力してください', 'error');
        return;
    }

    const pomodoros = parseInt(estimatedPomodoros);
    if (isNaN(pomodoros) || pomodoros < 1 || pomodoros > 20) {
        showNotification('見積もりポモドーロ数は1〜20で入力してください', 'error');
        return;
    }

    // タスクオブジェクト生成
    const newTask = {
        id: `task_${Date.now()}`,
        title: title.trim(),
        completed: false,
        estimatedPomodoros: pomodoros,
        actualPomodoros: 0,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    // タスク追加（配列の先頭に追加）
    appState.tasks.unshift(newTask);

    // LocalStorage保存
    saveToLocalStorage('pomotodo_tasks', appState.tasks);

    // UI更新
    renderTasks();
    updateStatistics();

    showNotification('タスクを追加しました', 'success');
}

/**
 * タスクを編集
 * @param {string} taskId - タスクID
 * @param {string} newTitle - 新しいタスク名
 */
function editTask(taskId, newTitle) {
    // バリデーション
    if (!newTitle || newTitle.trim() === '') {
        showNotification('E001: タスク名を入力してください', 'error');
        return;
    }

    if (newTitle.length > 100) {
        showNotification('E002: タスク名は100文字以内で入力してください', 'error');
        return;
    }

    // タスク検索
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) {
        showNotification('タスクが見つかりません', 'error');
        return;
    }

    // タスク名更新
    task.title = newTitle.trim();

    // LocalStorage保存
    saveToLocalStorage('pomotodo_tasks', appState.tasks);

    // UI更新
    renderTasks();

    showNotification('タスクを更新しました', 'success');
}

/**
 * タスクを削除
 * @param {string} taskId - タスクID
 */
function deleteTask(taskId) {
    // タイマー実行中チェック
    if (appState.timer.isRunning && appState.timer.currentTaskId === taskId) {
        showNotification('E004: タイマーを停止してから削除してください', 'error');
        return;
    }

    // タスク要素取得
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        // フェードアウトアニメーション
        taskElement.classList.add('removing');

        setTimeout(() => {
            // タスク削除
            appState.tasks = appState.tasks.filter(t => t.id !== taskId);

            // 選択中のタスクだった場合は選択解除
            if (appState.selectedTaskId === taskId) {
                appState.selectedTaskId = null;
            }

            // LocalStorage保存
            saveToLocalStorage('pomotodo_tasks', appState.tasks);

            // UI更新
            renderTasks();
            updateStatistics();

            showNotification('タスクを削除しました', 'success');
        }, 300);
    }
}

/**
 * タスクの完了状態をトグル
 * @param {string} taskId - タスクID
 */
function toggleTaskComplete(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    // LocalStorage保存
    saveToLocalStorage('pomotodo_tasks', appState.tasks);

    // UI更新
    renderTasks();
    updateStatistics();
}

/**
 * タスクを選択
 * @param {string} taskId - タスクID
 */
function selectTask(taskId) {
    // タイマー実行中チェック
    if (appState.timer.isRunning) {
        showNotification('タイマーを停止してから選択してください', 'warning');
        return;
    }

    appState.selectedTaskId = taskId;

    // UI更新
    renderTasks();
    updateTimerDisplay();
}

/**
 * タスクをフィルタリング
 * @param {string} filterType - フィルタタイプ ('all' | 'active' | 'completed')
 */
function filterTasks(filterType) {
    appState.settings.filterState = filterType;

    // LocalStorage保存
    saveToLocalStorage('pomotodo_settings', appState.settings);

    // UI更新
    renderTasks();
}

// ========================================
// Timer Functions
// ========================================

/**
 * タイマーを開始
 */
function startTimer() {
    // タスク選択チェック
    if (!appState.selectedTaskId) {
        showNotification('E003: タスクを選択してください', 'error');
        return;
    }

    // タイマーモード設定（初回起動時）
    if (appState.timer.mode === 'idle') {
        appState.timer.mode = 'work';
        appState.timer.duration = appState.settings.workDuration * 60;
        appState.timer.remainingTime = appState.timer.duration;
    }

    appState.timer.isRunning = true;
    appState.timer.isPaused = false;
    appState.timer.currentTaskId = appState.selectedTaskId;
    appState.timer.startedAt = Date.now();

    // タイマーインターバル開始
    timerIntervalId = setInterval(updateTimer, 1000);

    // LocalStorage保存
    saveToLocalStorage('pomotodo_timer', appState.timer);

    // UI更新
    updateTimerDisplay();
    updateTimerButtons();
}

/**
 * タイマーを一時停止
 */
function pauseTimer() {
    clearInterval(timerIntervalId);
    timerIntervalId = null;

    appState.timer.isPaused = true;

    // LocalStorage保存
    saveToLocalStorage('pomotodo_timer', appState.timer);

    // UI更新
    updateTimerDisplay();
    updateTimerButtons();
}

/**
 * タイマーをリセット
 */
function resetTimer() {
    // 確認ダイアログ
    showModal(
        'タイマーをリセット',
        'E007: タイマーをリセットしますか？進行中の作業は記録されません。',
        () => {
            clearInterval(timerIntervalId);
            timerIntervalId = null;

            appState.timer.remainingTime = appState.timer.duration;
            appState.timer.isRunning = false;
            appState.timer.isPaused = false;

            // LocalStorage保存
            saveToLocalStorage('pomotodo_timer', appState.timer);

            // UI更新
            updateTimerDisplay();
            updateTimerButtons();

            showNotification('タイマーをリセットしました', 'info');
        }
    );
}

/**
 * タイマーをスキップ
 */
function skipTimer() {
    clearInterval(timerIntervalId);
    timerIntervalId = null;

    if (appState.timer.mode === 'work') {
        switchToBreak();
    } else {
        switchToWork();
    }

    showNotification('タイマーをスキップしました', 'info');
}

/**
 * タイマー更新（毎秒実行）
 */
function updateTimer() {
    // システム時刻ベース補正
    const elapsedTime = Math.floor((Date.now() - appState.timer.startedAt) / 1000);
    appState.timer.remainingTime = appState.timer.duration - elapsedTime;

    // タイマー終了チェック
    if (appState.timer.remainingTime <= 0) {
        onTimerComplete();
        return;
    }

    // UI更新
    updateTimerDisplay();
}

/**
 * タイマー完了時の処理
 */
function onTimerComplete() {
    clearInterval(timerIntervalId);
    timerIntervalId = null;

    // 通知
    playNotificationSound();
    showBrowserNotification('タイマーが終了しました');

    if (appState.timer.mode === 'work') {
        // 作業完了時の処理
        const task = appState.tasks.find(t => t.id === appState.timer.currentTaskId);
        if (task) {
            task.actualPomodoros++;
        }

        appState.timer.pomodoroCount++;

        // LocalStorage保存
        saveToLocalStorage('pomotodo_tasks', appState.tasks);

        // 休憩へ遷移
        if (appState.timer.pomodoroCount % appState.settings.longBreakInterval === 0) {
            switchToLongBreak();
        } else {
            switchToShortBreak();
        }
    } else {
        // 休憩完了時の処理
        switchToWork();
    }

    // LocalStorage保存
    saveToLocalStorage('pomotodo_timer', appState.timer);

    // UI更新
    renderTasks();
    updateStatistics();
}

/**
 * 作業モードに切り替え
 */
function switchToWork() {
    appState.timer.mode = 'work';
    appState.timer.duration = appState.settings.workDuration * 60;
    appState.timer.remainingTime = appState.timer.duration;
    appState.timer.isRunning = false;
    appState.timer.isPaused = false;

    updateTimerDisplay();
    updateTimerButtons();

    showNotification('作業を開始してください', 'info');
}

/**
 * 短休憩モードに切り替え
 */
function switchToShortBreak() {
    appState.timer.mode = 'shortBreak';
    appState.timer.duration = appState.settings.shortBreakDuration * 60;
    appState.timer.remainingTime = appState.timer.duration;
    appState.timer.isRunning = false;
    appState.timer.isPaused = false;

    updateTimerDisplay();
    updateTimerButtons();

    showNotification('短い休憩を取りましょう（5分）', 'success');
}

/**
 * 長休憩モードに切り替え
 */
function switchToLongBreak() {
    appState.timer.mode = 'longBreak';
    appState.timer.duration = appState.settings.longBreakDuration * 60;
    appState.timer.remainingTime = appState.timer.duration;
    appState.timer.isRunning = false;
    appState.timer.isPaused = false;

    updateTimerDisplay();
    updateTimerButtons();

    showNotification('長い休憩を取りましょう（15分）', 'success');
}

// ========================================
// Rendering Functions
// ========================================

/**
 * タスクリストをレンダリング
 */
function renderTasks() {
    const taskListContainer = document.getElementById('task-list');
    const emptyMessage = document.getElementById('task-list-empty');
    
    // フィルタ適用
    let filteredTasks = appState.tasks;
    if (appState.settings.filterState === 'active') {
        filteredTasks = appState.tasks.filter(t => !t.completed);
    } else if (appState.settings.filterState === 'completed') {
        filteredTasks = appState.tasks.filter(t => t.completed);
    }

    // 空メッセージ表示/非表示
    if (filteredTasks.length === 0) {
        taskListContainer.style.display = 'none';
        emptyMessage.style.display = 'block';
    } else {
        taskListContainer.style.display = 'block';
        emptyMessage.style.display = 'none';
    }

    // タスクリストクリア
    taskListContainer.innerHTML = '';

    // タスクアイテム生成
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.taskId = task.id;

        if (task.completed) {
            li.classList.add('completed');
        }

        if (appState.selectedTaskId === task.id) {
            li.classList.add('selected');
        }

        // チェックボックス
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
        });

        // タスク名
        const title = document.createElement('span');
        title.className = 'task-title';
        title.textContent = task.title;

        // ポモドーロ数
        const pomodoroCount = document.createElement('span');
        pomodoroCount.className = 'pomodoro-count';
        pomodoroCount.textContent = `🍅 ${task.actualPomodoros}/${task.estimatedPomodoros}`;

        // アクション
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '✏️';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newTitle = prompt('タスク名を編集:', task.title);
            if (newTitle !== null) {
                editTask(task.id, newTitle);
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '✕';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        // タスクアイテム組み立て
        li.appendChild(checkbox);
        li.appendChild(title);
        li.appendChild(pomodoroCount);
        li.appendChild(actions);

        // タスク選択イベント
        li.addEventListener('click', () => {
            selectTask(task.id);
        });

        taskListContainer.appendChild(li);

        // アニメーション
        setTimeout(() => {
            li.classList.add('new');
        }, 10);
    });

    // フィルタボタンの状態更新
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === appState.settings.filterState) {
            btn.classList.add('active');
        }
    });
}

/**
 * タイマー表示を更新
 */
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    const timerMode = document.getElementById('timer-mode');
    const progressBar = document.getElementById('progress-bar');
    const currentTaskEl = document.getElementById('current-task');

    // 残り時間表示
    timerDisplay.textContent = formatTime(appState.timer.remainingTime);

    // モード表示
    let modeText = '準備中';
    let modeClass = '';
    if (appState.timer.mode === 'work') {
        modeText = '作業中';
        modeClass = 'work';
    } else if (appState.timer.mode === 'shortBreak') {
        modeText = '休憩中（短）';
        modeClass = 'break';
    } else if (appState.timer.mode === 'longBreak') {
        modeText = '休憩中（長）';
        modeClass = 'break';
    }

    timerMode.textContent = modeText;
    timerMode.className = `timer-mode ${modeClass}`;

    // 進捗バー
    const progress = (1 - appState.timer.remainingTime / appState.timer.duration) * 100;
    progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    progressBar.className = `progress-bar ${modeClass}`;

    // 現在のタスク
    if (appState.selectedTaskId) {
        const task = appState.tasks.find(t => t.id === appState.selectedTaskId);
        if (task) {
            currentTaskEl.textContent = `選択中: ${task.title}`;
        }
    } else {
        currentTaskEl.textContent = 'タスクを選択してください';
    }

    // タイマー実行中のアニメーション
    const timerSection = document.querySelector('.timer-section');
    if (appState.timer.isRunning && !appState.timer.isPaused) {
        timerSection.classList.add('running');
    } else {
        timerSection.classList.remove('running');
    }
}

/**
 * タイマーボタンの状態を更新
 */
function updateTimerButtons() {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const skipBtn = document.getElementById('skip-btn');

    if (appState.timer.isRunning && !appState.timer.isPaused) {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        skipBtn.disabled = false;
    } else if (appState.timer.isPaused) {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = false;
        skipBtn.disabled = false;
    } else {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = true;
        skipBtn.disabled = true;
    }
}

/**
 * 統計を更新
 */
function updateStatistics() {
    const completedTasks = appState.tasks.filter(t => t.completed).length;
    const totalTasks = appState.tasks.length;
    const totalTime = appState.timer.pomodoroCount * appState.settings.workDuration;
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;

    // ヘッダー統計
    document.getElementById('today-pomodoros').textContent = `🍅 ${appState.timer.pomodoroCount}`;
    document.getElementById('today-tasks').textContent = `✓ ${completedTasks}/${totalTasks}`;
    document.getElementById('today-time').textContent = `${hours}h ${minutes}m`;

    // タイマーセクション統計
    document.getElementById('stat-pomodoros').textContent = appState.timer.pomodoroCount;
    document.getElementById('stat-tasks').textContent = `${completedTasks}/${totalTasks}`;
    document.getElementById('stat-time').textContent = `${hours}h ${minutes}m`;
}

// ========================================
// Notification Functions
// ========================================

/**
 * 通知を表示
 * @param {string} message - 通知メッセージ
 * @param {string} type - 通知タイプ ('success' | 'error' | 'warning' | 'info')
 */
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

/**
 * 通知音を再生
 */
function playNotificationSound() {
    if (appState.settings.notificationSound === 'silent') return;

    // シンプルなビープ音（Web Audio API）
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error('通知音再生エラー:', e);
    }
}

/**
 * ブラウザ通知を表示
 * @param {string} message - 通知メッセージ
 */
function showBrowserNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('PomoTodo', {
            body: message,
            icon: '🍅'
        });
    }
}

/**
 * モーダルダイアログを表示
 * @param {string} title - ダイアログタイトル
 * @param {string} message - ダイアログメッセージ
 * @param {Function} onConfirm - 確認時のコールバック
 */
function showModal(title, message, onConfirm) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'flex';

    const handleCancel = () => {
        modal.style.display = 'none';
        modalCancel.removeEventListener('click', handleCancel);
        modalConfirm.removeEventListener('click', handleConfirm);
    };

    const handleConfirm = () => {
        modal.style.display = 'none';
        onConfirm();
        modalCancel.removeEventListener('click', handleCancel);
        modalConfirm.removeEventListener('click', handleConfirm);
    };

    modalCancel.addEventListener('click', handleCancel);
    modalConfirm.addEventListener('click', handleConfirm);
}

// ========================================
// Utility Functions
// ========================================

/**
 * 秒数をMM:SS形式に変換
 * @param {number} seconds - 秒数
 * @returns {string} - MM:SS形式の文字列
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ========================================
// Event Listeners
// ========================================

/**
 * イベントリスナーを登録
 */
function registerEventListeners() {
    // タスク追加フォーム
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('task-title-input');
        const pomodorosInput = document.getElementById('task-pomodoros-input');

        addTask(titleInput.value, pomodorosInput.value);

        // フォームクリア
        titleInput.value = '';
        pomodorosInput.value = 1;
        titleInput.focus();
    });

    // フィルタボタン
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterTasks(btn.dataset.filter);
        });
    });

    // タイマーボタン
    document.getElementById('start-btn').addEventListener('click', startTimer);
    document.getElementById('pause-btn').addEventListener('click', pauseTimer);
    document.getElementById('reset-btn').addEventListener('click', resetTimer);
    document.getElementById('skip-btn').addEventListener('click', skipTimer);

    // キーボード操作
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal');
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        }
    });
}

// ========================================
// App Initialization
// ========================================

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', initializeApp);
