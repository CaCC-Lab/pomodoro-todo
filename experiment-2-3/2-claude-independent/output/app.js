// PomoTodo Application
'use strict';

(function() {
    // ========================================
    // 定数定義
    // ========================================

    const STORAGE_KEYS = {
        TASKS: 'pomotodo_tasks',
        TIMER: 'pomotodo_timer',
        SETTINGS: 'pomotodo_settings',
        TODAY: 'pomotodo_today',
        HISTORY: 'pomotodo_history'
    };

    const TIMER_DEFAULTS = {
        WORK_DURATION: 25 * 60, // 25分（秒）
        SHORT_BREAK: 5 * 60,    // 5分（秒）
        LONG_BREAK: 15 * 60,    // 15分（秒）
        LONG_BREAK_INTERVAL: 4
    };

    const VALIDATION = {
        MAX_TASK_LENGTH: 100,
        MAX_POMODOROS: 20,
        MIN_TIMER_DURATION: 1,
        MAX_TIMER_DURATION: 60
    };

    // ========================================
    // アプリケーション状態
    // ========================================

    let state = {
        tasks: [],
        selectedTaskId: null,
        filterState: 'all',
        timer: {
            mode: 'idle',
            duration: TIMER_DEFAULTS.WORK_DURATION,
            remainingTime: TIMER_DEFAULTS.WORK_DURATION,
            isRunning: false,
            isPaused: false,
            currentTaskId: null,
            startedAt: null,
            pomodoroCount: 0
        },
        timerInterval: null
    };

    // ========================================
    // DOM要素の取得
    // ========================================

    const elements = {
        taskForm: document.getElementById('taskForm'),
        taskInput: document.getElementById('taskInput'),
        estimateInput: document.getElementById('estimateInput'),
        taskList: document.getElementById('taskList'),
        errorMessage: document.getElementById('errorMessage'),
        filterButtons: document.querySelectorAll('.filter-btn'),

        timerMode: document.getElementById('timerMode'),
        timerTime: document.getElementById('timerTime'),
        progressBar: document.getElementById('progressBar'),
        currentTask: document.getElementById('currentTask'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        resetBtn: document.getElementById('resetBtn'),
        skipBtn: document.getElementById('skipBtn'),

        todayPomodoros: document.getElementById('todayPomodoros'),
        statPomodoros: document.getElementById('statPomodoros'),
        statTasks: document.getElementById('statTasks'),
        statTime: document.getElementById('statTime')
    };

    // ========================================
    // ユーティリティ関数
    // ========================================

    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    function validateTaskTitle(title) {
        if (!title.trim()) {
            return 'タスク名を入力してください';
        }
        if (title.length > VALIDATION.MAX_TASK_LENGTH) {
            return 'タスク名は100文字以内で入力してください';
        }
        return null;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.classList.add('show');
        setTimeout(() => {
            elements.errorMessage.classList.remove('show');
        }, 3000);
    }

    // ========================================
    // LocalStorage操作
    // ========================================

    function saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                showError('保存容量が不足しています');
            } else {
                showError('データの保存ができません');
            }
        }
    }

    function loadFromStorage(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    // ========================================
    // データモデル
    // ========================================

    function createTask(title, estimatedPomodoros = null) {
        return {
            id: `task_${Date.now()}`,
            title: sanitizeInput(title),
            completed: false,
            estimatedPomodoros: estimatedPomodoros,
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
    }

    // ========================================
    // タスク管理
    // ========================================

    function addTask(title, estimate) {
        const error = validateTaskTitle(title);
        if (error) {
            showError(error);
            return;
        }

        const task = createTask(title, estimate);
        state.tasks.unshift(task);
        saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
        renderTasks();

        elements.taskInput.value = '';
        elements.estimateInput.value = '';
        elements.taskInput.focus();
    }

    function deleteTask(taskId) {
        if (state.timer.isRunning && state.timer.currentTaskId === taskId) {
            showError('タイマーを停止してから削除してください');
            return;
        }

        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            setTimeout(() => {
                state.tasks = state.tasks.filter(t => t.id !== taskId);
                saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
                renderTasks();
            }, 300);
        }
    }

    function toggleTaskComplete(taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
            renderTasks();
            updateStats();
        }
    }

    function selectTask(taskId) {
        if (state.timer.isRunning) {
            showError('タイマーを停止してから選択してください');
            return;
        }

        state.selectedTaskId = taskId;
        saveToStorage(STORAGE_KEYS.SETTINGS, { selectedTaskId: state.selectedTaskId });
        renderTasks();
        updateTimerDisplay();
    }

    function getFilteredTasks() {
        switch (state.filterState) {
            case 'active':
                return state.tasks.filter(t => !t.completed);
            case 'completed':
                return state.tasks.filter(t => t.completed);
            default:
                return state.tasks;
        }
    }

    function setFilter(filter) {
        state.filterState = filter;
        saveToStorage(STORAGE_KEYS.SETTINGS, { filterState: state.filterState });

        elements.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        renderTasks();
    }

    // ========================================
    // タスク表示
    // ========================================

    function renderTasks() {
        const filteredTasks = getFilteredTasks();
        elements.taskList.innerHTML = '';

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.dataset.taskId = task.id;

            if (task.completed) li.classList.add('completed');
            if (task.id === state.selectedTaskId) li.classList.add('selected');

            // チェックボックス
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                toggleTaskComplete(task.id);
            });

            // タスク内容
            const content = document.createElement('div');
            content.className = 'task-content';

            const title = document.createElement('div');
            title.className = 'task-title';
            title.textContent = task.title;

            const pomodoros = document.createElement('div');
            pomodoros.className = 'task-pomodoros';

            if (task.estimatedPomodoros) {
                pomodoros.textContent = `🍅 ${task.actualPomodoros}/${task.estimatedPomodoros}`;
                if (task.actualPomodoros >= task.estimatedPomodoros) {
                    pomodoros.classList.add(task.actualPomodoros === task.estimatedPomodoros ? 'completed-goal' : 'exceeded-goal');
                }
            } else {
                pomodoros.textContent = `🍅 ${task.actualPomodoros}`;
            }

            content.appendChild(title);
            content.appendChild(pomodoros);

            // 削除ボタン
            const actions = document.createElement('div');
            actions.className = 'task-actions';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-delete';
            deleteBtn.textContent = '✕';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            actions.appendChild(deleteBtn);

            // 要素の組み立て
            li.appendChild(checkbox);
            li.appendChild(content);
            li.appendChild(actions);

            li.addEventListener('click', () => selectTask(task.id));

            elements.taskList.appendChild(li);
        });
    }

    // ========================================
    // タイマー機能
    // ========================================

    function startTimer() {
        if (!state.selectedTaskId) {
            showError('タスクを選択してください');
            return;
        }

        if (state.timer.isPaused) {
            // 一時停止から再開
            state.timer.isPaused = false;
            state.timer.isRunning = true;
        } else {
            // 新規開始
            state.timer.mode = 'work';
            state.timer.duration = TIMER_DEFAULTS.WORK_DURATION;
            state.timer.remainingTime = TIMER_DEFAULTS.WORK_DURATION;
            state.timer.isRunning = true;
            state.timer.isPaused = false;
            state.timer.currentTaskId = state.selectedTaskId;
        }

        state.timer.startedAt = Date.now();
        saveTimerState();

        state.timerInterval = setInterval(tick, 1000);
        updateTimerControls();
        updateTimerDisplay();
    }

    function pauseTimer() {
        state.timer.isPaused = true;
        state.timer.isRunning = false;
        clearInterval(state.timerInterval);
        saveTimerState();
        updateTimerControls();
    }

    function resetTimer() {
        if (state.timer.isRunning || state.timer.isPaused) {
            if (!confirm('タイマーをリセットしますか？')) {
                return;
            }
        }

        clearInterval(state.timerInterval);
        state.timer.mode = 'idle';
        state.timer.duration = TIMER_DEFAULTS.WORK_DURATION;
        state.timer.remainingTime = TIMER_DEFAULTS.WORK_DURATION;
        state.timer.isRunning = false;
        state.timer.isPaused = false;
        state.timer.startedAt = null;

        saveTimerState();
        updateTimerControls();
        updateTimerDisplay();
    }

    function skipTimer() {
        clearInterval(state.timerInterval);

        if (state.timer.mode === 'work') {
            state.timer.mode = 'shortBreak';
            state.timer.duration = TIMER_DEFAULTS.SHORT_BREAK;
            state.timer.remainingTime = TIMER_DEFAULTS.SHORT_BREAK;
        } else {
            state.timer.mode = 'work';
            state.timer.duration = TIMER_DEFAULTS.WORK_DURATION;
            state.timer.remainingTime = TIMER_DEFAULTS.WORK_DURATION;
        }

        state.timer.isRunning = false;
        state.timer.isPaused = false;
        saveTimerState();
        updateTimerControls();
        updateTimerDisplay();
    }

    function tick() {
        if (!state.timer.isRunning) return;

        state.timer.remainingTime--;

        if (state.timer.remainingTime <= 0) {
            onTimerComplete();
        } else {
            saveTimerState();
            updateTimerDisplay();
        }
    }

    function onTimerComplete() {
        clearInterval(state.timerInterval);

        playNotificationSound();
        showNotification();

        // ポモドーロ完了時のカウント更新（作業時のみ）
        if (state.timer.mode === 'work') {
            const task = state.tasks.find(t => t.id === state.timer.currentTaskId);
            if (task) {
                task.actualPomodoros++;
                saveToStorage(STORAGE_KEYS.TASKS, state.tasks);
            }

            state.timer.pomodoroCount++;
            saveTimerState();
            updateStats();
            renderTasks();
        }

        // 自動遷移
        if (state.timer.mode === 'work') {
            // 長い休憩の判定
            if (state.timer.pomodoroCount % TIMER_DEFAULTS.LONG_BREAK_INTERVAL === 0) {
                state.timer.mode = 'longBreak';
                state.timer.duration = TIMER_DEFAULTS.LONG_BREAK;
            } else {
                state.timer.mode = 'shortBreak';
                state.timer.duration = TIMER_DEFAULTS.SHORT_BREAK;
            }
        } else {
            state.timer.mode = 'work';
            state.timer.duration = TIMER_DEFAULTS.WORK_DURATION;
        }

        state.timer.remainingTime = state.timer.duration;
        state.timer.isRunning = false;
        state.timer.isPaused = false;

        saveTimerState();
        updateTimerControls();
        updateTimerDisplay();
    }

    function playNotificationSound() {
        // Web Audio APIで簡単なビープ音を生成
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                }, i * 300);
            }
        } catch (e) {
            console.error('Audio notification failed:', e);
        }
    }

    function showNotification() {
        const title = state.timer.mode === 'work' ? 'ポモドーロ完了！' : '休憩終了！';
        const message = state.timer.mode === 'work' ? '休憩時間です' : '作業に戻りましょう';

        // ブラウザ通知
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: '🍅' });
        }

        // 視覚的な通知（簡易的なアラート）
        alert(`${title}\n${message}`);
    }

    function updateTimerDisplay() {
        // モード表示
        let modeText = '作業時間';
        elements.timerMode.className = 'timer-mode work';

        if (state.timer.mode === 'shortBreak') {
            modeText = '短い休憩';
            elements.timerMode.className = 'timer-mode break';
        } else if (state.timer.mode === 'longBreak') {
            modeText = '長い休憩';
            elements.timerMode.className = 'timer-mode break';
        } else if (state.timer.mode === 'idle') {
            modeText = '待機中';
            elements.timerMode.className = 'timer-mode';
        }

        elements.timerMode.textContent = modeText;

        // 時間表示
        elements.timerTime.textContent = formatTime(state.timer.remainingTime);

        // 実行中のアニメーション
        if (state.timer.isRunning) {
            elements.timerTime.classList.add('running');
        } else {
            elements.timerTime.classList.remove('running');
        }

        // 進捗バー
        const progress = ((state.timer.duration - state.timer.remainingTime) / state.timer.duration) * 100;
        elements.progressBar.style.width = `${progress}%`;

        // 現在のタスク表示
        if (state.selectedTaskId) {
            const task = state.tasks.find(t => t.id === state.selectedTaskId);
            elements.currentTask.textContent = task ? task.title : 'タスクを選択してください';
        } else {
            elements.currentTask.textContent = 'タスクを選択してください';
        }
    }

    function updateTimerControls() {
        elements.startBtn.disabled = state.timer.isRunning;
        elements.pauseBtn.disabled = !state.timer.isRunning;
    }

    function saveTimerState() {
        saveToStorage(STORAGE_KEYS.TIMER, state.timer);
        checkDateChange();
    }

    // ========================================
    // 統計表示
    // ========================================

    function updateStats() {
        const completedTasks = state.tasks.filter(t => t.completed).length;
        const totalTime = state.timer.pomodoroCount * 25;
        const hours = Math.floor(totalTime / 60);
        const minutes = totalTime % 60;

        elements.todayPomodoros.textContent = `Today: 🍅 ${state.timer.pomodoroCount}`;
        elements.statPomodoros.textContent = state.timer.pomodoroCount;
        elements.statTasks.textContent = completedTasks;
        elements.statTime.textContent = `${hours}h ${minutes}m`;
    }

    // ========================================
    // 日付管理
    // ========================================

    function checkDateChange() {
        const today = new Date().toISOString().split('T')[0];
        const savedDate = loadFromStorage(STORAGE_KEYS.TODAY, today);

        if (savedDate !== today) {
            // 日付が変わったらポモドーロ数をリセット
            state.timer.pomodoroCount = 0;
            saveToStorage(STORAGE_KEYS.TODAY, today);
            updateStats();
        }
    }

    // ========================================
    // イベントリスナー
    // ========================================

    function setupEventListeners() {
        // タスク追加フォーム
        elements.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = elements.taskInput.value.trim();
            const estimate = elements.estimateInput.value ? parseInt(elements.estimateInput.value) : null;
            addTask(title, estimate);
        });

        // フィルタボタン
        elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => setFilter(btn.dataset.filter));
        });

        // タイマーコントロール
        elements.startBtn.addEventListener('click', startTimer);
        elements.pauseBtn.addEventListener('click', pauseTimer);
        elements.resetBtn.addEventListener('click', resetTimer);
        elements.skipBtn.addEventListener('click', skipTimer);

        // 通知の許可をリクエスト
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // ========================================
    // 初期化
    // ========================================

    function init() {
        // データの読み込み
        state.tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
        const savedTimer = loadFromStorage(STORAGE_KEYS.TIMER, null);
        if (savedTimer) {
            state.timer = { ...state.timer, ...savedTimer };
            // タイマー実行中だった場合は停止状態で復元
            state.timer.isRunning = false;
            state.timer.isPaused = false;
        }

        const savedSettings = loadFromStorage(STORAGE_KEYS.SETTINGS, {});
        if (savedSettings.selectedTaskId) {
            state.selectedTaskId = savedSettings.selectedTaskId;
        }
        if (savedSettings.filterState) {
            state.filterState = savedSettings.filterState;
        }

        // イベントリスナーの設定
        setupEventListeners();

        // 初期表示
        renderTasks();
        updateTimerDisplay();
        updateTimerControls();
        updateStats();
        checkDateChange();

        // フィルタボタンの初期状態
        elements.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === state.filterState);
        });
    }

    // アプリケーション起動
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
