// フェーズ2: Todoリスト機能の実装
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const taskFilters = document.getElementById('task-filters');

    // タイマー関連のDOM要素
    const timerMode = document.getElementById('timer-mode');
    const timerDisplay = document.getElementById('timer-display');
    const currentTaskDisplay = document.getElementById('current-task-display');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const skipBtn = document.getElementById('skip-btn');

    // アプリケーションの状態
    let tasks = [];
    let filter = 'all';
    let selectedTaskId = null;

    // タイマーの状態
    let timerInterval = null;
    let timerState = 'idle'; // idle, running, paused
    let currentMode = 'work'; // work, shortBreak, longBreak
    let pomodoroCycle = 0; // 4回で1サイクル
    let remainingTime = 25 * 60; // 秒単位
    const durations = {
        work: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
    };
    const notificationSound = new Audio(); // TODO: 音声ファイル指定
    const tasksStorageKey = 'pomotodo_tasks';

    // --- データ永続化 ---
    function saveTasks() {
        try {
            localStorage.setItem(tasksStorageKey, JSON.stringify(tasks));
        } catch (e) {
            console.error("Failed to save tasks:", e);
            alert("タスクの保存に失敗しました。LocalStorageが有効で、十分な空き容量があるか確認してください。");
        }
    }

    function loadTasks() {
        try {
            const storedTasks = localStorage.getItem(tasksStorageKey);
            if (storedTasks) {
                tasks = JSON.parse(storedTasks);
            }
        } catch (e) {
            console.error("Failed to load tasks:", e);
            alert("タスクの読み込みに失敗しました。");
        }
    }

    // --- タイマー関数 ---
    function updateTimerDisplay() {
        const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
        const seconds = (remainingTime % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
        document.title = `${minutes}:${seconds} - PomoTodo`;
    }

    function switchMode() {
        clearInterval(timerInterval);
        timerState = 'idle';

        if (currentMode === 'work') {
            pomodoroCycle++;
            // 選択中のタスクのポモドーロ数を増やす
            if (selectedTaskId) {
                const task = tasks.find(t => t.id === selectedTaskId);
                if (task) {
                    task.actualPomodoros++;
                }
            }

            if (pomodoroCycle % 4 === 0) {
                currentMode = 'longBreak';
            } else {
                currentMode = 'shortBreak';
            }
        } else {
            currentMode = 'work';
        }

        remainingTime = durations[currentMode];
        updateTimerDisplay();
        updateModeDisplay();
        playNotification();
        saveTasks();
        renderTasks(); // ポモドーロ数の更新を反映
    }

    function playNotification() {
        notificationSound.play().catch(e => console.error("Audio playback failed:", e));
        if (Notification.permission === 'granted') {
            new Notification('PomoTodo', {
                body: `${timerMode.textContent}が終了しました。`,
            });
        }
    }

    function updateModeDisplay() {
        const timerSection = document.getElementById('timer-section');
        timerSection.classList.remove('work-mode', 'short-break-mode', 'long-break-mode');
        switch (currentMode) {
            case 'work':
                timerMode.textContent = '作業中';
                timerSection.classList.add('work-mode');
                break;
            case 'shortBreak':
                timerMode.textContent = '短い休憩';
                timerSection.classList.add('short-break-mode');
                break;
            case 'longBreak':
                timerMode.textContent = '長い休憩';
                timerSection.classList.add('long-break-mode');
                break;
        }
    }

    function startTimer() {
        if (!selectedTaskId) {
            alert('タイマーを開始するタスクを選択してください。');
            return;
        }
        if (timerState === 'running') return;
        timerState = 'running';
        timerInterval = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            if (remainingTime <= 0) {
                switchMode();
            }
        }, 1000);
    }

    function pauseTimer() {
        if (timerState !== 'running') return;
        timerState = 'paused';
        clearInterval(timerInterval);
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerState = 'idle';
        remainingTime = durations[currentMode];
        updateTimerDisplay();
    }

    // --- レンダー関数 ---
    function renderTasks(isNew = false) {
        const lastSelectedId = selectedTaskId;
        taskList.innerHTML = '';
        const filteredTasks = tasks.filter(task => {
            if (filter === 'all') return true;
            if (filter === 'active') return !task.completed;
            if (filter === 'completed') return task.completed;
        });

        filteredTasks.forEach((task, index) => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            if (task.id === lastSelectedId) {
                taskItem.classList.add('selected');
            }
            // 新規追加された最初のタスクにアニメーションクラスを付与
            if (isNew && index === 0) {
                taskItem.classList.add('new');
            }
            taskItem.dataset.id = task.id;

            taskItem.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-title">${task.title}</span>
                <span class="pomo-count">🍅 ${task.actualPomodoros}</span>
                <button class="delete-btn">✕</button>
            `;
            taskList.appendChild(taskItem);
        });
    }

    // --- イベントリスナー ---
    taskForm.addEventListener('submit', e => {
        e.preventDefault();
        const title = taskInput.value.trim();

        if (!title) {
            alert('タスク名を入力してください');
            return;
        }
        if (title.length > 100) {
            alert('タスク名は100文字以内で入力してください');
            return;
        }

        const newTask = {
            id: `task_${Date.now()}`,
            title: title,
            completed: false,
            estimatedPomodoros: 0,
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        tasks.unshift(newTask); // 新しいタスクをリストの最上部に追加
        taskInput.value = '';
        saveTasks();
        renderTasks(true); // isNewフラグを立ててアニメーションをトリガー
    });

    taskList.addEventListener('click', e => {
        const target = e.target;
        const taskItem = target.closest('.task-item');
        if (!taskItem) return;

        const taskId = taskItem.dataset.id;

        // タスク完了/未完了の切り替え
        if (target.type === 'checkbox') {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                task.completedAt = task.completed ? new Date().toISOString() : null;
                saveTasks();
                renderTasks();
            }
        }

        // タスクの削除
        if (target.classList.contains('delete-btn')) {
            taskItem.classList.add('removing');
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== taskId);
                if (selectedTaskId === taskId) {
                    selectedTaskId = null;
                    currentTaskDisplay.textContent = 'タスクを選択してください';
                }
                saveTasks();
                renderTasks();
            }, 300); // アニメーションの時間
            return; // 他のクリックイベントを重複させない
        }

        // タスクの選択
        if (target.closest('.task-item')) {
            selectedTaskId = taskId;
            const selectedTask = tasks.find(t => t.id === selectedTaskId);
            currentTaskDisplay.textContent = `実行中: ${selectedTask.title}`;
            renderTasks(); // selectedクラスを反映させるため再描画
        }
    });

    taskList.addEventListener('dblclick', e => {
        const target = e.target;
        if (target.classList.contains('task-title')) {
            const taskItem = target.closest('.task-item');
            const taskId = taskItem.dataset.id;
            taskItem.classList.add('editing');

            const input = document.createElement('input');
            input.type = 'text';
            input.value = target.textContent;
            input.className = 'edit-input';

            taskItem.replaceChild(input, target);
            input.focus();

            function saveEdit() {
                const newTitle = input.value.trim();
                const task = tasks.find(t => t.id === taskId);
                if (task && newTitle) {
                    task.title = newTitle;
                    saveTasks();
                }
                taskItem.classList.remove('editing');
                renderTasks();
            }

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    saveEdit();
                } else if (e.key === 'Escape') {
                    taskItem.classList.remove('editing');
                    renderTasks(); // キャンセルして元に戻す
                }
            });
        }
    });

    taskFilters.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            const newFilter = e.target.dataset.filter;
            if (newFilter) {
                filter = newFilter;
                document.querySelectorAll('#task-filters .filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                renderTasks();
            }
        }
    });

    // タイマー操作
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    skipBtn.addEventListener('click', switchMode);

    // 初期化処理
    function init() {
        console.log('PomoTodo App Initialized');
        loadTasks();
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
        updateTimerDisplay();
        updateModeDisplay();
        renderTasks();
    }

    init();
});
