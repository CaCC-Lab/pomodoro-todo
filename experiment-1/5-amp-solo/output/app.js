(function() {
    'use strict';

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
        selectedTaskId: null,
        todayDate: new Date().toISOString().split('T')[0]
    };

    let timerIntervalId = null;

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

    function loadFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('LocalStorage読み込みエラー:', e);
            return defaultValue;
        }
    }

    function checkAndResetDaily() {
        const today = new Date().toISOString().split('T')[0];
        if (appState.todayDate !== today) {
            appState.todayDate = today;
            appState.timer.pomodoroCount = 0;
            saveToLocalStorage('pomotodo_timer', appState.timer);
            saveToLocalStorage('pomotodo_today', appState.todayDate);
        }
    }

    function initializeApp() {
        const savedTasks = loadFromLocalStorage('pomotodo_tasks', []);
        const savedTimer = loadFromLocalStorage('pomotodo_timer', appState.timer);
        const savedSettings = loadFromLocalStorage('pomotodo_settings', appState.settings);
        const savedDate = loadFromLocalStorage('pomotodo_today', appState.todayDate);

        appState.tasks = savedTasks;
        appState.settings = { ...appState.settings, ...savedSettings };
        appState.todayDate = savedDate;

        appState.timer = { ...appState.timer, ...savedTimer };
        appState.timer.isRunning = false;
        appState.timer.isPaused = false;

        checkAndResetDaily();
        renderTasks();
        updateTimerDisplay();
        updateStatistics();
        attachEventListeners();

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    function validateInput(input, type) {
        if (type === 'taskTitle') {
            if (!input || input.trim().length === 0) {
                return { valid: false, message: 'E001: タスク名を入力してください' };
            }
            if (input.length > 100) {
                return { valid: false, message: 'E002: タスク名は100文字以内で入力してください' };
            }
            return { valid: true };
        }

        if (type === 'pomodoros') {
            const num = parseInt(input);
            if (isNaN(num) || num < 1 || num > 20) {
                return { valid: false, message: '見積もりポモドーロ数は1-20の範囲で入力してください' };
            }
            return { valid: true };
        }

        return { valid: true };
    }

    function addTask(title, estimatedPomodoros) {
        const titleValidation = validateInput(title, 'taskTitle');
        if (!titleValidation.valid) {
            showNotification(titleValidation.message, 'error');
            return;
        }

        const pomodorosValidation = validateInput(estimatedPomodoros, 'pomodoros');
        if (!pomodorosValidation.valid) {
            showNotification(pomodorosValidation.message, 'error');
            return;
        }

        const newTask = {
            id: `task_${Date.now()}`,
            title: title.trim(),
            completed: false,
            estimatedPomodoros: parseInt(estimatedPomodoros),
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        appState.tasks.unshift(newTask);
        saveToLocalStorage('pomotodo_tasks', appState.tasks);
        renderTasks();
        showNotification('タスクを追加しました', 'success');
    }

    function editTask(taskId, newTitle) {
        const validation = validateInput(newTitle, 'taskTitle');
        if (!validation.valid) {
            showNotification(validation.message, 'error');
            return;
        }

        const task = appState.tasks.find(t => t.id === taskId);
        if (task) {
            task.title = newTitle.trim();
            saveToLocalStorage('pomotodo_tasks', appState.tasks);
            renderTasks();
            showNotification('タスクを更新しました', 'success');
        }
    }

    function deleteTask(taskId) {
        if (appState.timer.isRunning && appState.timer.currentTaskId === taskId) {
            showNotification('E004: タイマーを停止してから削除してください', 'error');
            return;
        }

        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            setTimeout(() => {
                appState.tasks = appState.tasks.filter(t => t.id !== taskId);
                if (appState.selectedTaskId === taskId) {
                    appState.selectedTaskId = null;
                }
                saveToLocalStorage('pomotodo_tasks', appState.tasks);
                renderTasks();
                updateStatistics();
            }, 300);
        }
    }

    function toggleTaskComplete(taskId) {
        const task = appState.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            saveToLocalStorage('pomotodo_tasks', appState.tasks);
            renderTasks();
            updateStatistics();
        }
    }

    function selectTask(taskId) {
        if (appState.timer.isRunning) {
            showNotification('タイマーを停止してから選択してください', 'warning');
            return;
        }
        appState.selectedTaskId = taskId;
        renderTasks();
        updateTimerDisplay();
    }

    function filterTasks(filterType) {
        appState.settings.filterState = filterType;
        saveToLocalStorage('pomotodo_settings', appState.settings);
        renderTasks();

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterType);
        });
    }

    function startTimer() {
        if (!appState.selectedTaskId) {
            showNotification('E003: タスクを選択してください', 'error');
            return;
        }

        appState.timer.isRunning = true;
        appState.timer.isPaused = false;
        appState.timer.currentTaskId = appState.selectedTaskId;
        appState.timer.startedAt = Date.now();

        if (appState.timer.mode === 'idle') {
            appState.timer.mode = 'work';
            appState.timer.duration = appState.settings.workDuration * 60;
            appState.timer.remainingTime = appState.timer.duration;
        }

        timerIntervalId = setInterval(updateTimer, 1000);
        saveToLocalStorage('pomotodo_timer', appState.timer);
        updateTimerDisplay();
        updateTimerButtons();
    }

    function pauseTimer() {
        if (!appState.timer.isRunning) return;

        clearInterval(timerIntervalId);
        appState.timer.isRunning = false;
        appState.timer.isPaused = true;
        saveToLocalStorage('pomotodo_timer', appState.timer);
        updateTimerDisplay();
        updateTimerButtons();
    }

    function resetTimer() {
        if (!confirm('E007: タイマーをリセットしますか?')) {
            return;
        }

        clearInterval(timerIntervalId);
        appState.timer.mode = 'idle';
        appState.timer.duration = appState.settings.workDuration * 60;
        appState.timer.remainingTime = appState.timer.duration;
        appState.timer.isRunning = false;
        appState.timer.isPaused = false;
        appState.timer.currentTaskId = null;
        appState.timer.startedAt = null;

        saveToLocalStorage('pomotodo_timer', appState.timer);
        updateTimerDisplay();
        updateTimerButtons();
    }

    function skipTimer() {
        clearInterval(timerIntervalId);
        if (appState.timer.mode === 'work') {
            switchToBreak();
        } else {
            switchToWork();
        }
    }

    function updateTimer() {
        if (!appState.timer.isRunning) return;

        const elapsed = Math.floor((Date.now() - appState.timer.startedAt) / 1000);
        appState.timer.remainingTime = Math.max(0, appState.timer.duration - elapsed);

        if (appState.timer.remainingTime <= 0) {
            onTimerComplete();
            return;
        }

        updateTimerDisplay();
    }

    function onTimerComplete() {
        clearInterval(timerIntervalId);
        playNotificationSound();
        showBrowserNotification('タイマーが終了しました');

        if (appState.timer.mode === 'work') {
            const task = appState.tasks.find(t => t.id === appState.timer.currentTaskId);
            if (task) {
                task.actualPomodoros++;
                saveToLocalStorage('pomotodo_tasks', appState.tasks);
            }

            appState.timer.pomodoroCount++;
            saveToLocalStorage('pomotodo_timer', appState.timer);

            if (appState.timer.pomodoroCount % appState.settings.longBreakInterval === 0) {
                switchToLongBreak();
            } else {
                switchToShortBreak();
            }
        } else {
            switchToWork();
        }

        renderTasks();
        updateStatistics();
    }

    function switchToWork() {
        appState.timer.mode = 'work';
        appState.timer.duration = appState.settings.workDuration * 60;
        appState.timer.remainingTime = appState.timer.duration;
        appState.timer.startedAt = Date.now();
        appState.timer.isRunning = true;
        timerIntervalId = setInterval(updateTimer, 1000);
        saveToLocalStorage('pomotodo_timer', appState.timer);
        updateTimerDisplay();
        updateTimerButtons();
    }

    function switchToShortBreak() {
        appState.timer.mode = 'shortBreak';
        appState.timer.duration = appState.settings.shortBreakDuration * 60;
        appState.timer.remainingTime = appState.timer.duration;
        appState.timer.startedAt = Date.now();
        appState.timer.isRunning = true;
        timerIntervalId = setInterval(updateTimer, 1000);
        saveToLocalStorage('pomotodo_timer', appState.timer);
        updateTimerDisplay();
        updateTimerButtons();
    }

    function switchToLongBreak() {
        appState.timer.mode = 'longBreak';
        appState.timer.duration = appState.settings.longBreakDuration * 60;
        appState.timer.remainingTime = appState.timer.duration;
        appState.timer.startedAt = Date.now();
        appState.timer.isRunning = true;
        timerIntervalId = setInterval(updateTimer, 1000);
        saveToLocalStorage('pomotodo_timer', appState.timer);
        updateTimerDisplay();
        updateTimerButtons();
    }

    function switchToBreak() {
        if (appState.timer.pomodoroCount % appState.settings.longBreakInterval === 0) {
            switchToLongBreak();
        } else {
            switchToShortBreak();
        }
    }

    function renderTasks() {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        const filterState = appState.settings.filterState;
        let filteredTasks = appState.tasks;

        if (filterState === 'active') {
            filteredTasks = appState.tasks.filter(t => !t.completed);
        } else if (filterState === 'completed') {
            filteredTasks = appState.tasks.filter(t => t.completed);
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.dataset.taskId = task.id;

            if (task.completed) {
                li.classList.add('completed');
            }
            if (task.id === appState.selectedTaskId) {
                li.classList.add('selected');
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTaskComplete(task.id);
            });

            const title = document.createElement('span');
            title.className = 'task-title';
            title.textContent = task.title;

            const pomodoroCount = document.createElement('span');
            pomodoroCount.className = 'pomodoro-count';
            pomodoroCount.textContent = `🍅 ${task.actualPomodoros}/${task.estimatedPomodoros}`;

            const actions = document.createElement('div');
            actions.className = 'task-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = '✏️';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newTitle = prompt('タスク名を編集', task.title);
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

            li.appendChild(checkbox);
            li.appendChild(title);
            li.appendChild(pomodoroCount);
            li.appendChild(actions);

            li.addEventListener('click', () => {
                selectTask(task.id);
            });

            taskList.appendChild(li);
        });
    }

    function updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        const timerMode = document.getElementById('timer-mode');
        const currentTaskEl = document.getElementById('current-task');
        const progressBar = document.getElementById('progress-bar');

        timerDisplay.textContent = formatTime(appState.timer.remainingTime);

        if (appState.timer.mode === 'idle') {
            timerMode.textContent = '待機中';
            timerMode.className = 'timer-mode';
        } else if (appState.timer.mode === 'work') {
            timerMode.textContent = '作業中';
            timerMode.className = 'timer-mode work';
        } else if (appState.timer.mode === 'shortBreak') {
            timerMode.textContent = '休憩中';
            timerMode.className = 'timer-mode break';
        } else if (appState.timer.mode === 'longBreak') {
            timerMode.textContent = '長休憩中';
            timerMode.className = 'timer-mode break';
        }

        if (appState.selectedTaskId) {
            const task = appState.tasks.find(t => t.id === appState.selectedTaskId);
            currentTaskEl.textContent = task ? `選択中: ${task.title}` : 'タスクを選択してください';
        } else {
            currentTaskEl.textContent = 'タスクを選択してください';
        }

        const progress = appState.timer.duration > 0 
            ? ((appState.timer.duration - appState.timer.remainingTime) / appState.timer.duration) * 100 
            : 0;
        progressBar.style.width = `${progress}%`;

        const timerContainer = document.querySelector('.timer-container');
        if (appState.timer.isRunning) {
            timerContainer.classList.add('timer', 'running');
        } else {
            timerContainer.classList.remove('timer', 'running');
        }
    }

    function updateStatistics() {
        const completedTasks = appState.tasks.filter(t => t.completed).length;
        const totalTasks = appState.tasks.length;
        const totalMinutes = appState.timer.pomodoroCount * appState.settings.workDuration;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        document.getElementById('stat-pomodoros').textContent = appState.timer.pomodoroCount;
        document.getElementById('stat-tasks').textContent = `${completedTasks}/${totalTasks}`;
        document.getElementById('stat-time').textContent = `${hours}h ${minutes}m`;

        document.getElementById('today-pomodoros').textContent = `🍅 ${appState.timer.pomodoroCount}`;
        document.getElementById('today-tasks').textContent = `✓ ${completedTasks}/${totalTasks}`;
        document.getElementById('today-time').textContent = `⏱ ${hours}h ${minutes}m`;
    }

    function updateTimerButtons() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const skipBtn = document.getElementById('skip-btn');

        if (appState.timer.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            resetBtn.disabled = false;
            skipBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = appState.timer.mode === 'idle';
            skipBtn.disabled = appState.timer.mode === 'idle';
        }
    }

    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    function playNotificationSound() {
        if (appState.settings.notificationSound === 'silent') return;

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
            console.error('音声再生エラー:', e);
        }
    }

    function showBrowserNotification(message) {
        if (Notification.permission === 'granted') {
            try {
                new Notification('🍅 PomoTodo', {
                    body: message,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🍅</text></svg>'
                });
            } catch (e) {
                console.error('ブラウザ通知エラー:', e);
            }
        }
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function attachEventListeners() {
        const taskForm = document.getElementById('task-form');
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const taskInput = document.getElementById('task-input');
            const pomodorosInput = document.getElementById('pomodoros-input');

            addTask(taskInput.value, pomodorosInput.value);

            taskInput.value = '';
            pomodorosInput.value = '1';
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filterTasks(btn.dataset.filter);
            });
        });

        document.getElementById('start-btn').addEventListener('click', startTimer);
        document.getElementById('pause-btn').addEventListener('click', pauseTimer);
        document.getElementById('reset-btn').addEventListener('click', resetTimer);
        document.getElementById('skip-btn').addEventListener('click', skipTimer);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (appState.timer.isRunning) {
                    pauseTimer();
                }
            }
        });

        setInterval(checkAndResetDaily, 60000);
    }

    document.addEventListener('DOMContentLoaded', initializeApp);

})();
