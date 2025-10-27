document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    const appState = {
        tasks: [],
        timer: {
            mode: 'work', // 'work', 'shortBreak', 'longBreak'
            intervalId: null,
            isRunning: false,
            remainingTime: 1500, // in seconds
        },
        settings: {
            workDuration: 25 * 60,
            shortBreakDuration: 5 * 60,
            longBreakDuration: 15 * 60,
            longBreakInterval: 4,
        },
        stats: {
            pomodoroCount: 0,
        },
        selectedTaskId: null,
        filter: 'all',
    };

    // --- DOM ELEMENTS ---
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title-input');
    const taskPomodoroInput = document.getElementById('task-pomodoro-input');
    const taskList = document.getElementById('task-list');
    const filterButtons = document.querySelector('.filter-buttons');

    const timerDisplay = document.getElementById('timer-display');
    const timerModeDisplay = document.getElementById('timer-mode');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const skipBtn = document.getElementById('skip-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentTaskDisplay = document.getElementById('current-task-display');

    const todayPomodorosStat = document.getElementById('today-pomodoros');
    const completedTasksStat = document.getElementById('completed-tasks');
    const totalTimeStat = document.getElementById('total-time');
    const notification = document.getElementById('notification');

    // --- LOCALSTORAGE FUNCTIONS ---
    const saveState = () => {
        try {
            const stateToSave = {
                tasks: appState.tasks,
                stats: appState.stats,
                selectedTaskId: appState.selectedTaskId,
            };
            localStorage.setItem('pomoTodoState', JSON.stringify(stateToSave));
        } catch (e) {
            console.error("Error saving state to localStorage", e);
            showNotification('ローカルストレージへの保存に失敗しました', 'error');
        }
    };

    const loadState = () => {
        try {
            const savedState = localStorage.getItem('pomoTodoState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                appState.tasks = parsedState.tasks || [];
                appState.stats = parsedState.stats || { pomodoroCount: 0 };
                appState.selectedTaskId = parsedState.selectedTaskId || null;
            }
        } catch (e) {
            console.error("Error loading state from localStorage", e);
            showNotification('ローカルストレージからの読み込みに失敗しました', 'error');
        }
    };

    // --- UTILITY FUNCTIONS ---
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // --- NOTIFICATION FUNCTIONS ---
    const showNotification = (message, type = 'info') => {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    };

    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    };

    const showBrowserNotification = (message) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('PomoTodo', { body: message, icon: '🍅' });
        }
    };

    // --- RENDERING FUNCTIONS ---
    const renderTasks = () => {
        taskList.innerHTML = '';
        const filteredTasks = appState.tasks.filter(task => {
            if (appState.filter === 'all') return true;
            if (appState.filter === 'active') return !task.completed;
            if (appState.filter === 'completed') return task.completed;
        });

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `<li class="empty-message">タスクはありません。</li>`;
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''} ${task.id === appState.selectedTaskId ? 'selected' : ''}`;
            li.dataset.id = task.id;

            li.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-title">${task.title}</span>
                <span class="pomodoro-count">🍅 ${task.actualPomodoros} / ${task.estimatedPomodoros}</span>
                <div class="actions">
                    <button class="edit-btn">✏️</button>
                    <button class="delete-btn">✕</button>
                </div>
            `;

            li.addEventListener('click', () => selectTask(task.id));
            li.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTaskComplete(task.id));
            li.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteTask(task.id); });
            li.querySelector('.edit-btn').addEventListener('click', (e) => { e.stopPropagation(); editTask(task.id); });

            taskList.appendChild(li);
        });
        updateStats();
    };

    const updateTimerDisplay = () => {
        timerDisplay.textContent = formatTime(appState.timer.remainingTime);
        document.title = `${formatTime(appState.timer.remainingTime)} - PomoTodo`;
        
        const duration = appState.timer.mode === 'work' ? appState.settings.workDuration :
                         appState.timer.mode === 'shortBreak' ? appState.settings.shortBreakDuration :
                         appState.settings.longBreakDuration;
        const progress = (duration - appState.timer.remainingTime) / duration * 100;
        progressBar.style.width = `${progress}%`;

        if (appState.timer.mode === 'work') {
            timerModeDisplay.textContent = '作業中';
            timerModeDisplay.className = 'timer-mode work';
            progressBar.style.backgroundColor = 'var(--primary-red)';
        } else {
            timerModeDisplay.textContent = '休憩中';
            timerModeDisplay.className = 'timer-mode break';
            progressBar.style.backgroundColor = 'var(--primary-green)';
        }

        const selectedTask = appState.tasks.find(t => t.id === appState.selectedTaskId);
        currentTaskDisplay.textContent = selectedTask ? `選択中: ${selectedTask.title}` : 'タスクが選択されていません';
    };

    const updateStats = () => {
        const completedCount = appState.tasks.filter(t => t.completed).length;
        const totalTasks = appState.tasks.length;
        const totalWorkMinutes = appState.stats.pomodoroCount * (appState.settings.workDuration / 60);
        const hours = Math.floor(totalWorkMinutes / 60);
        const minutes = totalWorkMinutes % 60;

        todayPomodorosStat.textContent = `Today: 🍅 ${appState.stats.pomodoroCount}`;
        completedTasksStat.textContent = `Tasks: ✓ ${completedCount}/${totalTasks}`;
        totalTimeStat.textContent = `Time: ${hours}h ${minutes}m`;
    };

    // --- TASK MANAGEMENT ---
    const addTask = (title, estimatedPomodoros) => {
        if (!title.trim()) {
            showNotification('タスク名を入力してください', 'error');
            return;
        }
        const newTask = {
            id: `task_${Date.now()}`,
            title: title.trim(),
            completed: false,
            estimatedPomodoros: parseInt(estimatedPomodoros, 10),
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
        };
        appState.tasks.unshift(newTask);
        saveState();
        renderTasks();
        showNotification('タスクを追加しました', 'success');
    };

    const selectTask = (taskId) => {
        if (appState.timer.isRunning) {
            showNotification('タイマーを停止してからタスクを選択してください', 'warning');
            return;
        }
        appState.selectedTaskId = taskId;
        saveState();
        renderTasks();
        updateTimerDisplay();
    };

    const toggleTaskComplete = (taskId) => {
        const task = appState.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveState();
            renderTasks();
        }
    };

    const deleteTask = (taskId) => {
        if (appState.timer.isRunning && appState.selectedTaskId === taskId) {
            showNotification('タイマー実行中のタスクは削除できません', 'error');
            return;
        }
        appState.tasks = appState.tasks.filter(t => t.id !== taskId);
        if (appState.selectedTaskId === taskId) {
            appState.selectedTaskId = null;
        }
        saveState();
        renderTasks();
        showNotification('タスクを削除しました', 'info');
    };

    const editTask = (taskId) => {
        const task = appState.tasks.find(t => t.id === taskId);
        if (task) {
            const newTitle = prompt('新しいタスク名を入力してください:', task.title);
            if (newTitle && newTitle.trim()) {
                task.title = newTitle.trim();
                saveState();
                renderTasks();
                updateTimerDisplay();
            }
        }
    };

    // --- TIMER FUNCTIONS ---
    const startTimer = () => {
        if (!appState.selectedTaskId) {
            showNotification('タイマーを開始するタスクを選択してください', 'warning');
            return;
        }
        if (appState.timer.isRunning) return;

        appState.timer.isRunning = true;
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';

        appState.timer.intervalId = setInterval(() => {
            appState.timer.remainingTime--;
            updateTimerDisplay();

            if (appState.timer.remainingTime <= 0) {
                onTimerComplete();
            }
        }, 1000);
    };

    const pauseTimer = () => {
        if (!appState.timer.isRunning) return;

        clearInterval(appState.timer.intervalId);
        appState.timer.intervalId = null;
        appState.timer.isRunning = false;
        startBtn.textContent = '再開';
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
    };

    const resetTimer = () => {
        pauseTimer();
        appState.timer.remainingTime = appState.settings[appState.timer.mode + 'Duration'];
        startBtn.textContent = '開始';
        updateTimerDisplay();
    };

    const onTimerComplete = () => {
        clearInterval(appState.timer.intervalId);
        appState.timer.isRunning = false;

        showBrowserNotification(appState.timer.mode === 'work' ? '作業終了！休憩しましょう。' : '休憩終了！作業に戻りましょう。');

        if (appState.timer.mode === 'work') {
            appState.stats.pomodoroCount++;
            const task = appState.tasks.find(t => t.id === appState.selectedTaskId);
            if (task) {
                task.actualPomodoros++;
            }
            
            const isLongBreak = appState.stats.pomodoroCount % appState.settings.longBreakInterval === 0;
            switchToMode(isLongBreak ? 'longBreak' : 'shortBreak');
        } else {
            switchToMode('work');
        }
        saveState();
        renderTasks();
        startTimer(); // Auto-start next timer
    };

    const switchToMode = (mode) => {
        appState.timer.mode = mode;
        appState.timer.remainingTime = appState.settings[mode + 'Duration'];
        updateTimerDisplay();
    };

    const skipTimer = () => {
        if (confirm('現在のセッションをスキップしますか？')) {
            onTimerComplete();
        }
    };

    // --- EVENT LISTENERS ---
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(taskTitleInput.value, taskPomodoroInput.value);
        taskTitleInput.value = '';
        taskPomodoroInput.value = '1';
    });

    filterButtons.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            appState.filter = e.target.dataset.filter;
            document.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            renderTasks();
        }
    });

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    skipBtn.addEventListener('click', skipTimer);

    // --- INITIALIZATION ---
    const initializeApp = () => {
        loadState();
        switchToMode('work'); // Default to work mode on load
        renderTasks();
        updateTimerDisplay();
        updateStats();
        requestNotificationPermission();
    };

    initializeApp();
});
