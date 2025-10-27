// ============================================
// State Management
// ============================================
const appState = {
  tasks: [],
  timer: {
    mode: 'idle', // 'idle' | 'work' | 'shortBreak' | 'longBreak'
    duration: 1500, // 25 minutes in seconds
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

let timerIntervalId = null;

// ============================================
// LocalStorage Functions
// ============================================
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      showNotification('E005: 保存容量が不足しています', 'error');
    } else {
      showNotification('E006: データの保存ができません', 'error');
    }
  }
}

function loadFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('LocalStorage load error:', e);
    return null;
  }
}

function initializeApp() {
  // Load data
  const savedTasks = loadFromLocalStorage('pomotodo_tasks');
  const savedTimer = loadFromLocalStorage('pomotodo_timer');
  const savedSettings = loadFromLocalStorage('pomotodo_settings');

  if (savedTasks) appState.tasks = savedTasks;
  if (savedTimer) appState.timer = { ...appState.timer, ...savedTimer };
  if (savedSettings) appState.settings = { ...appState.settings, ...savedSettings };

  // Reset daily counter if new day
  const today = new Date().toISOString().split('T')[0];
  const savedToday = loadFromLocalStorage('pomotodo_today');
  if (savedToday !== today) {
    appState.timer.pomodoroCount = 0;
    saveToLocalStorage('pomotodo_today', today);
  }

  // Render UI
  renderTasks();
  updateTimerDisplay();
  updateStatistics();
  attachEventListeners();

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ============================================
// Task Management Functions
// ============================================
function addTask(title, estimatedPomodoros) {
  // Validation
  if (!title.trim()) {
    showNotification('E001: タスク名を入力してください', 'error');
    return false;
  }
  if (title.length > 100) {
    showNotification('E002: タスク名は100文字以内で入力してください', 'error');
    return false;
  }

  const newTask = {
    id: `task_${Date.now()}`,
    title: title.trim(),
    completed: false,
    estimatedPomodoros: estimatedPomodoros || null,
    actualPomodoros: 0,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  appState.tasks.unshift(newTask);
  saveToLocalStorage('pomotodo_tasks', appState.tasks);
  renderTasks();
  showNotification('タスクを追加しました', 'success');
  return true;
}

function editTask(taskId, newTitle) {
  if (!newTitle.trim()) {
    showNotification('E001: タスク名は必須です', 'error');
    return false;
  }
  if (newTitle.length > 100) {
    showNotification('E002: タスク名は100文字以内で入力してください', 'error');
    return false;
  }

  const task = appState.tasks.find(t => t.id === taskId);
  if (task) {
    task.title = newTitle.trim();
    saveToLocalStorage('pomotodo_tasks', appState.tasks);
    renderTasks();
    return true;
  }
  return false;
}

function deleteTask(taskId) {
  if (appState.timer.currentTaskId === taskId && appState.timer.isRunning) {
    showNotification('E004: タイマーを停止してから削除してください', 'error');
    return false;
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
    }, 300);
  }
  return true;
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
    return false;
  }
  appState.selectedTaskId = taskId;
  renderTasks();
  updateTimerDisplay();
  return true;
}

function filterTasks(filterType) {
  appState.settings.filterState = filterType;
  saveToLocalStorage('pomotodo_settings', appState.settings);

  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filterType);
  });

  renderTasks();
}

// ============================================
// Timer Functions
// ============================================
function startTimer() {
  if (!appState.selectedTaskId) {
    showNotification('E003: タスクを選択してください', 'error');
    return false;
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

  document.getElementById('start-btn').disabled = true;
  document.getElementById('pause-btn').disabled = false;
  return true;
}

function pauseTimer() {
  clearInterval(timerIntervalId);
  appState.timer.isPaused = true;
  appState.timer.isRunning = false;
  saveToLocalStorage('pomotodo_timer', appState.timer);
  updateTimerDisplay();

  document.getElementById('start-btn').disabled = false;
  document.getElementById('pause-btn').disabled = true;
}

function resetTimer() {
  if (!confirm('E007: タイマーをリセットしますか？')) {
    return false;
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

  document.getElementById('start-btn').disabled = false;
  document.getElementById('pause-btn').disabled = true;
  return true;
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
  // System time-based correction to prevent drift
  const elapsed = Math.floor((Date.now() - appState.timer.startedAt) / 1000);
  appState.timer.remainingTime = appState.timer.duration - elapsed;

  if (appState.timer.remainingTime <= 0) {
    onTimerComplete();
  } else {
    updateTimerDisplay();
  }
}

function onTimerComplete() {
  clearInterval(timerIntervalId);
  playNotificationSound();
  showBrowserNotification('タイマーが終了しました');

  if (appState.timer.mode === 'work') {
    // Increment pomodoro count
    const task = appState.tasks.find(t => t.id === appState.timer.currentTaskId);
    if (task) {
      task.actualPomodoros++;
    }
    appState.timer.pomodoroCount++;

    saveToLocalStorage('pomotodo_tasks', appState.tasks);
    renderTasks();
    updateStatistics();

    // Switch to break
    if (appState.timer.pomodoroCount % appState.settings.longBreakInterval === 0) {
      switchToLongBreak();
    } else {
      switchToShortBreak();
    }
  } else {
    switchToWork();
  }

  saveToLocalStorage('pomotodo_timer', appState.timer);
}

function switchToWork() {
  appState.timer.mode = 'work';
  appState.timer.duration = appState.settings.workDuration * 60;
  appState.timer.remainingTime = appState.timer.duration;
  appState.timer.isRunning = false;
  appState.timer.isPaused = false;
  updateTimerDisplay();

  document.getElementById('start-btn').disabled = false;
  document.getElementById('pause-btn').disabled = true;
}

function switchToShortBreak() {
  appState.timer.mode = 'shortBreak';
  appState.timer.duration = appState.settings.shortBreakDuration * 60;
  appState.timer.remainingTime = appState.timer.duration;
  appState.timer.isRunning = false;
  appState.timer.isPaused = false;
  updateTimerDisplay();
  showNotification('休憩時間です！', 'success');

  document.getElementById('start-btn').disabled = false;
  document.getElementById('pause-btn').disabled = true;
}

function switchToLongBreak() {
  appState.timer.mode = 'longBreak';
  appState.timer.duration = appState.settings.longBreakDuration * 60;
  appState.timer.remainingTime = appState.timer.duration;
  appState.timer.isRunning = false;
  appState.timer.isPaused = false;
  updateTimerDisplay();
  showNotification('長い休憩時間です！お疲れ様でした！', 'success');

  document.getElementById('start-btn').disabled = false;
  document.getElementById('pause-btn').disabled = true;
}

// ============================================
// Rendering Functions
// ============================================
function renderTasks() {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';

  const filtered = appState.tasks.filter(task => {
    if (appState.settings.filterState === 'active') return !task.completed;
    if (appState.settings.filterState === 'completed') return task.completed;
    return true;
  });

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.taskId = task.id;

    if (task.completed) li.classList.add('completed');
    if (task.id === appState.selectedTaskId) li.classList.add('selected');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTaskComplete(task.id);
    });

    // Title
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    // Pomodoro count
    const count = document.createElement('span');
    count.className = 'pomodoro-count';
    if (task.estimatedPomodoros) {
      count.textContent = `🍅 ${task.actualPomodoros}/${task.estimatedPomodoros}`;
    } else {
      count.textContent = `🍅 ${task.actualPomodoros}`;
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✏️';
    editBtn.title = '編集';
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
    deleteBtn.title = '削除';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(title);
    li.appendChild(count);
    li.appendChild(actions);

    li.addEventListener('click', () => selectTask(task.id));

    li.classList.add('new');
    taskList.appendChild(li);
  });
}

function updateTimerDisplay() {
  const modeElement = document.getElementById('timer-mode');
  const displayElement = document.getElementById('timer-display');
  const progressBar = document.getElementById('progress-bar');
  const currentTask = document.getElementById('current-task');

  // Mode
  let modeText = '待機中';
  let modeClass = '';
  if (appState.timer.mode === 'work') {
    modeText = '作業中';
    modeClass = '';
  } else if (appState.timer.mode === 'shortBreak') {
    modeText = '休憩中（短）';
    modeClass = 'break';
  } else if (appState.timer.mode === 'longBreak') {
    modeText = '休憩中（長）';
    modeClass = 'break';
  }
  modeElement.textContent = modeText;
  modeElement.className = `timer-mode ${modeClass}`;

  // Time display
  displayElement.textContent = formatTime(appState.timer.remainingTime);

  // Progress bar
  const progress = appState.timer.duration > 0
    ? ((appState.timer.duration - appState.timer.remainingTime) / appState.timer.duration) * 100
    : 0;
  progressBar.style.width = `${progress}%`;

  // Current task
  if (appState.selectedTaskId) {
    const task = appState.tasks.find(t => t.id === appState.selectedTaskId);
    currentTask.textContent = task ? `選択中: ${task.title}` : 'タスクを選択してください';
  } else {
    currentTask.textContent = 'タスクを選択してください';
  }

  // Update pomodoro count in header
  document.getElementById('pomodoro-count').textContent = appState.timer.pomodoroCount;
}

function updateStatistics() {
  const completedTasks = appState.tasks.filter(t => t.completed).length;
  const totalTasks = appState.tasks.length;
  const totalTime = appState.timer.pomodoroCount * 25; // minutes
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;

  document.getElementById('stat-pomodoros').textContent = `🍅 ${appState.timer.pomodoroCount}`;
  document.getElementById('stat-tasks').textContent = `✓ ${completedTasks}/${totalTasks}`;
  document.getElementById('stat-time').textContent = `${hours}h ${minutes}m`;
}

// ============================================
// Notification Functions
// ============================================
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

  // Simple beep using Web Audio API
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
}

function showBrowserNotification(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('PomoTodo', {
      body: message,
      icon: '🍅'
    });
  }
}

// ============================================
// Utility Functions
// ============================================
function formatTime(seconds) {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// Event Listeners
// ============================================
function attachEventListeners() {
  // Task form
  const taskForm = document.getElementById('task-form');
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('task-input');
    const estimateInput = document.getElementById('pomodoro-estimate');

    if (addTask(titleInput.value, parseInt(estimateInput.value) || null)) {
      titleInput.value = '';
      estimateInput.value = '';
    }
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterTasks(btn.dataset.filter);
    });
  });

  // Timer controls
  document.getElementById('start-btn').addEventListener('click', startTimer);
  document.getElementById('pause-btn').addEventListener('click', pauseTimer);
  document.getElementById('reset-btn').addEventListener('click', resetTimer);
  document.getElementById('skip-btn').addEventListener('click', skipTimer);

  // Initialize pause button as disabled
  document.getElementById('pause-btn').disabled = true;
}

// ============================================
// Initialize App on Load
// ============================================
document.addEventListener('DOMContentLoaded', initializeApp);
