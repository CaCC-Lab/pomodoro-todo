// PomoTodo Application
// Vanilla JavaScript ES6+

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CONFIG = {
  workDuration: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  pomodorosUntilLongBreak: 4,
  autoStartBreaks: true,
  taskNameMaxLength: 100,
  estimatedPomodorosMax: 20,
};

const STORAGE_KEYS = {
  tasks: 'pomotodo_tasks',
  timer: 'pomotodo_timer',
  statistics: 'pomotodo_statistics',
  filter: 'pomotodo_filter',
};

const ERRORS = {
  E001: 'タスク名を入力してください',
  E002: 'タスク名は100文字以内で入力してください',
  E003: 'タスクを選択してください',
  E004: 'タイマーを停止してから削除してください',
  E005: '保存容量が不足しています',
  E006: 'データの保存ができません',
  E007: 'タイマーをリセットしますか？',
  E008: '編集を完了してください',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const Utils = {
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  isToday(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

// ============================================================================
// DATA MODELS
// ============================================================================

class Task {
  constructor(title, estimatedPomodoros = 0) {
    this.id = Utils.generateUUID();
    this.title = title;
    this.completed = false;
    this.estimatedPomodoros = estimatedPomodoros;
    this.actualPomodoros = 0;
    this.createdAt = new Date().toISOString();
    this.completedAt = null;
  }

  toggleComplete() {
    this.completed = !this.completed;
    this.completedAt = this.completed ? new Date().toISOString() : null;
  }

  incrementPomodoros() {
    this.actualPomodoros++;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      completed: this.completed,
      estimatedPomodoros: this.estimatedPomodoros,
      actualPomodoros: this.actualPomodoros,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
    };
  }

  static fromJSON(data) {
    const task = new Task(data.title, data.estimatedPomodoros);
    Object.assign(task, data);
    return task;
  }
}

class Timer {
  constructor() {
    this.mode = 'work';
    this.remainingSeconds = CONFIG.workDuration;
    this.totalSeconds = CONFIG.workDuration;
    this.isRunning = false;
    this.intervalId = null;
    this.startTime = null;
    this.currentTaskId = null;
    this.pomodoroCount = 0;
  }

  start(taskId) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentTaskId = taskId;
    this.startTime = Date.now();
    
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.totalSeconds;
    this.startTime = null;
  }

  skip() {
    this.pause();
    if (this.mode === 'work') {
      this.setMode('break');
    } else {
      this.setMode('work');
    }
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'work') {
      this.totalSeconds = CONFIG.workDuration;
    } else if (mode === 'break') {
      this.pomodoroCount++;
      const isLongBreak = this.pomodoroCount % CONFIG.pomodorosUntilLongBreak === 0;
      this.totalSeconds = isLongBreak ? CONFIG.longBreak : CONFIG.shortBreak;
    }
    this.remainingSeconds = this.totalSeconds;
  }

  tick() {
    if (!this.isRunning) return;

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.remainingSeconds = this.totalSeconds - elapsed;

    if (this.remainingSeconds <= 0) {
      this.onComplete();
    }
  }

  onComplete() {
    this.pause();
    this.remainingSeconds = 0;
    
    if (this.mode === 'work' && this.currentTaskId) {
      app.todoController.incrementTaskPomodoros(this.currentTaskId);
      app.statisticsController.addPomodoro();
    }
    
    app.timerController.handleTimerComplete();
  }

  getProgress() {
    return ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100;
  }

  toJSON() {
    return {
      mode: this.mode,
      remainingSeconds: this.remainingSeconds,
      totalSeconds: this.totalSeconds,
      isRunning: this.isRunning,
      currentTaskId: this.currentTaskId,
      pomodoroCount: this.pomodoroCount,
      startTime: this.startTime,
    };
  }

  static fromJSON(data) {
    const timer = new Timer();
    Object.assign(timer, data);
    return timer;
  }
}

class Statistics {
  constructor() {
    this.todayPomodoros = 0;
    this.todayCompletedTasks = 0;
    this.pomodoroTimestamps = [];
    this.lastResetDate = new Date().toDateString();
  }

  addPomodoro() {
    this.checkDailyReset();
    this.todayPomodoros++;
    this.pomodoroTimestamps.push(new Date().toISOString());
  }

  addCompletedTask() {
    this.checkDailyReset();
    this.todayCompletedTasks++;
  }

  getTotalWorkTime() {
    return this.todayPomodoros * 25;
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.todayPomodoros = 0;
      this.todayCompletedTasks = 0;
      this.pomodoroTimestamps = [];
      this.lastResetDate = today;
    }
  }

  toJSON() {
    return {
      todayPomodoros: this.todayPomodoros,
      todayCompletedTasks: this.todayCompletedTasks,
      pomodoroTimestamps: this.pomodoroTimestamps,
      lastResetDate: this.lastResetDate,
    };
  }

  static fromJSON(data) {
    const stats = new Statistics();
    Object.assign(stats, data);
    stats.checkDailyReset();
    return stats;
  }
}

// ============================================================================
// STORAGE MANAGER
// ============================================================================

class StorageManager {
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        app.showNotification(ERRORS.E005, 'error');
      } else {
        app.showNotification(ERRORS.E006, 'error');
      }
    }
  }

  static load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  static saveTasks(tasks) {
    this.save(STORAGE_KEYS.tasks, tasks.map(t => t.toJSON()));
  }

  static loadTasks() {
    const data = this.load(STORAGE_KEYS.tasks, []);
    return data.map(t => Task.fromJSON(t));
  }

  static saveTimer(timer) {
    this.save(STORAGE_KEYS.timer, timer.toJSON());
  }

  static loadTimer() {
    const data = this.load(STORAGE_KEYS.timer);
    return data ? Timer.fromJSON(data) : new Timer();
  }

  static saveStatistics(stats) {
    this.save(STORAGE_KEYS.statistics, stats.toJSON());
  }

  static loadStatistics() {
    const data = this.load(STORAGE_KEYS.statistics);
    return data ? Statistics.fromJSON(data) : new Statistics();
  }

  static saveFilter(filter) {
    this.save(STORAGE_KEYS.filter, filter);
  }

  static loadFilter() {
    return this.load(STORAGE_KEYS.filter, 'all');
  }
}

// ============================================================================
// CONTROLLERS
// ============================================================================

class TodoController {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'all';
    this.selectedTaskId = null;
    this.editingTaskId = null;
  }

  init() {
    this.tasks = StorageManager.loadTasks();
    this.currentFilter = StorageManager.loadFilter();
    this.render();
  }

  addTask(title, estimatedPomodoros) {
    if (!title.trim()) {
      app.showNotification(ERRORS.E001, 'error');
      return false;
    }
    if (title.length > CONFIG.taskNameMaxLength) {
      app.showNotification(ERRORS.E002, 'error');
      return false;
    }

    const task = new Task(title.trim(), estimatedPomodoros || 0);
    this.tasks.unshift(task);
    this.save();
    this.render();
    return true;
  }

  editTask(id, newTitle) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return false;
    
    if (!newTitle.trim()) {
      app.showNotification(ERRORS.E001, 'error');
      return false;
    }
    if (newTitle.length > CONFIG.taskNameMaxLength) {
      app.showNotification(ERRORS.E002, 'error');
      return false;
    }

    task.title = newTitle.trim();
    this.save();
    this.render();
    return true;
  }

  deleteTask(id) {
    if (app.timer.isRunning && app.timer.currentTaskId === id) {
      app.showNotification(ERRORS.E004, 'error');
      return false;
    }

    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      if (this.selectedTaskId === id) {
        this.selectedTaskId = null;
        app.timerController.updateCurrentTaskDisplay();
      }
      this.save();
      this.render();
    }
    return true;
  }

  toggleTaskComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      const wasCompleted = task.completed;
      task.toggleComplete();
      
      if (!wasCompleted && task.completed) {
        app.statisticsController.addCompletedTask();
      } else if (wasCompleted && !task.completed) {
        app.statistics.todayCompletedTasks = Math.max(0, app.statistics.todayCompletedTasks - 1);
      }
      
      this.save();
      this.render();
      app.statisticsController.render();
    }
  }

  selectTask(id) {
    if (app.timer.isRunning) {
      app.showNotification('タイマー実行中はタスクを変更できません', 'error');
      return;
    }
    this.selectedTaskId = id;
    this.render();
    app.timerController.updateCurrentTaskDisplay();
  }

  incrementTaskPomodoros(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.incrementPomodoros();
      this.save();
      this.render();
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;
    StorageManager.saveFilter(filter);
    this.render();
  }

  getFilteredTasks() {
    switch (this.currentFilter) {
      case 'active':
        return this.tasks.filter(t => !t.completed);
      case 'completed':
        return this.tasks.filter(t => t.completed);
      default:
        return this.tasks;
    }
  }

  save() {
    StorageManager.saveTasks(this.tasks);
  }

  render() {
    const taskList = document.getElementById('task-list');
    const filteredTasks = this.getFilteredTasks();
    
    taskList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
      taskList.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">タスクがありません</p>';
      return;
    }

    filteredTasks.forEach(task => {
      const taskEl = this.createTaskElement(task);
      taskList.appendChild(taskEl);
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
    });
  }

  createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-item';
    if (task.completed) div.classList.add('completed');
    if (task.id === this.selectedTaskId) div.classList.add('selected');
    div.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleTaskComplete(task.id);
    });

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.startEditing(task.id, title);
    });

    const pomodoros = document.createElement('span');
    pomodoros.className = 'task-pomodoros';
    const pomodoroText = task.estimatedPomodoros > 0 
      ? `🍅 ${task.actualPomodoros}/${task.estimatedPomodoros}`
      : `🍅 ${task.actualPomodoros}`;
    pomodoros.textContent = pomodoroText;
    
    if (task.estimatedPomodoros > 0) {
      if (task.actualPomodoros >= task.estimatedPomodoros) {
        pomodoros.classList.add('complete');
      }
      if (task.actualPomodoros > task.estimatedPomodoros) {
        pomodoros.classList.add('over');
      }
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteTask(task.id);
    });

    div.addEventListener('click', () => {
      if (!this.editingTaskId) {
        this.selectTask(task.id);
      }
    });

    div.appendChild(checkbox);
    div.appendChild(title);
    div.appendChild(pomodoros);
    div.appendChild(deleteBtn);

    return div;
  }

  startEditing(taskId, titleElement) {
    if (app.timer.isRunning) {
      app.showNotification(ERRORS.E008, 'error');
      return;
    }

    this.editingTaskId = taskId;
    const task = this.tasks.find(t => t.id === taskId);
    const originalTitle = task.title;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-title editing';
    input.value = originalTitle;
    input.maxLength = CONFIG.taskNameMaxLength;

    const finishEditing = (save) => {
      if (save && input.value.trim() !== originalTitle) {
        this.editTask(taskId, input.value);
      }
      this.editingTaskId = null;
      this.render();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        finishEditing(true);
      } else if (e.key === 'Escape') {
        finishEditing(false);
      }
    });

    input.addEventListener('blur', () => finishEditing(true));

    titleElement.replaceWith(input);
    input.focus();
    input.select();
  }
}

class TimerController {
  constructor() {
    this.elements = {
      time: document.getElementById('timer-time'),
      mode: document.getElementById('timer-mode'),
      progress: document.getElementById('progress-bar'),
      currentTask: document.getElementById('current-task'),
      btnStart: document.getElementById('btn-start'),
      btnPause: document.getElementById('btn-pause'),
      btnReset: document.getElementById('btn-reset'),
      btnSkip: document.getElementById('btn-skip'),
    };
    this.audioContext = null;
  }

  init() {
    this.updateDisplay();
    this.setupEventListeners();
    
    if (app.timer.isRunning) {
      app.timer.pause();
      this.updateDisplay();
    }
  }

  setupEventListeners() {
    this.elements.btnStart.addEventListener('click', () => this.handleStart());
    this.elements.btnPause.addEventListener('click', () => this.handlePause());
    this.elements.btnReset.addEventListener('click', () => this.handleReset());
    this.elements.btnSkip.addEventListener('click', () => this.handleSkip());
  }

  handleStart() {
    if (!app.todoController.selectedTaskId) {
      app.showNotification(ERRORS.E003, 'error');
      return;
    }

    app.timer.start(app.todoController.selectedTaskId);
    this.elements.btnStart.disabled = true;
    this.elements.btnPause.disabled = false;
    this.elements.time.classList.add('running');
    this.startDisplayUpdate();
  }

  handlePause() {
    app.timer.pause();
    this.elements.btnStart.disabled = false;
    this.elements.btnPause.disabled = true;
    this.elements.time.classList.remove('running');
    this.stopDisplayUpdate();
    this.saveTimerState();
  }

  handleReset() {
    app.showModal(ERRORS.E007, () => {
      app.timer.reset();
      this.updateDisplay();
      this.elements.btnStart.disabled = false;
      this.elements.btnPause.disabled = true;
      this.elements.time.classList.remove('running');
      this.stopDisplayUpdate();
      this.saveTimerState();
    });
  }

  handleSkip() {
    app.timer.skip();
    this.updateDisplay();
    this.saveTimerState();
  }

  handleTimerComplete() {
    this.playNotificationSound();
    this.showNotification();
    
    const wasWorkMode = app.timer.mode === 'work';
    
    if (wasWorkMode && CONFIG.autoStartBreaks) {
      app.timer.setMode('break');
      this.updateDisplay();
      this.saveTimerState();
    }
    
    this.elements.btnStart.disabled = false;
    this.elements.btnPause.disabled = true;
    this.elements.time.classList.remove('running');
    this.stopDisplayUpdate();
  }

  startDisplayUpdate() {
    this.displayUpdateInterval = setInterval(() => {
      this.updateDisplay();
      this.saveTimerState();
    }, 1000);
  }

  stopDisplayUpdate() {
    if (this.displayUpdateInterval) {
      clearInterval(this.displayUpdateInterval);
      this.displayUpdateInterval = null;
    }
  }

  updateDisplay() {
    this.elements.time.textContent = Utils.formatTime(Math.max(0, app.timer.remainingSeconds));
    
    const modeText = app.timer.mode === 'work' ? '作業時間' : '休憩時間';
    this.elements.mode.textContent = modeText;
    
    const isBreak = app.timer.mode === 'break';
    this.elements.time.classList.toggle('break', isBreak);
    this.elements.progress.classList.toggle('break', isBreak);
    
    const progress = app.timer.getProgress();
    this.elements.progress.style.width = `${progress}%`;
    
    this.updateCurrentTaskDisplay();
  }

  updateCurrentTaskDisplay() {
    const selectedTask = app.todoController.tasks.find(
      t => t.id === app.todoController.selectedTaskId
    );
    
    if (selectedTask) {
      this.elements.currentTask.textContent = selectedTask.title;
      this.elements.currentTask.style.fontStyle = 'normal';
    } else {
      this.elements.currentTask.textContent = 'タスクを選択してください';
      this.elements.currentTask.style.fontStyle = 'italic';
    }
  }

  playNotificationSound() {
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
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        }, i * 200);
      }
    } catch (e) {
      console.error('Audio playback failed:', e);
    }
  }

  showNotification() {
    const message = app.timer.mode === 'work' 
      ? '作業完了！休憩しましょう 🎉'
      : '休憩終了！次の作業を始めましょう 💪';
    
    app.showNotification(message, 'success');
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('PomoTodo', { body: message, icon: '🍅' });
    }
  }

  saveTimerState() {
    StorageManager.saveTimer(app.timer);
  }
}

class StatisticsController {
  constructor() {
    this.elements = {
      pomodoros: document.getElementById('today-pomodoros'),
      tasks: document.getElementById('today-tasks'),
      time: document.getElementById('today-time'),
    };
  }

  init() {
    this.render();
  }

  addPomodoro() {
    app.statistics.addPomodoro();
    this.save();
    this.render();
  }

  addCompletedTask() {
    app.statistics.addCompletedTask();
    this.save();
    this.render();
  }

  render() {
    this.elements.pomodoros.textContent = app.statistics.todayPomodoros;
    this.elements.tasks.textContent = app.statistics.todayCompletedTasks;
    this.elements.time.textContent = `${app.statistics.getTotalWorkTime()}分`;
  }

  save() {
    StorageManager.saveStatistics(app.statistics);
  }
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

class App {
  constructor() {
    this.timer = null;
    this.statistics = null;
    this.todoController = null;
    this.timerController = null;
    this.statisticsController = null;
  }

  init() {
    this.timer = StorageManager.loadTimer();
    this.statistics = StorageManager.loadStatistics();
    
    this.todoController = new TodoController();
    this.timerController = new TimerController();
    this.statisticsController = new StatisticsController();
    
    this.todoController.init();
    this.timerController.init();
    this.statisticsController.init();
    
    this.setupGlobalEventListeners();
    this.requestNotificationPermission();
  }

  setupGlobalEventListeners() {
    const taskInput = document.getElementById('task-input');
    const taskEstimate = document.getElementById('task-estimate');
    const btnAddTask = document.getElementById('btn-add-task');

    const addTask = () => {
      const title = taskInput.value;
      const estimate = parseInt(taskEstimate.value) || 0;
      
      if (this.todoController.addTask(title, estimate)) {
        taskInput.value = '';
        taskEstimate.value = '';
        taskInput.focus();
      }
    };

    btnAddTask.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.todoController.setFilter(btn.dataset.filter);
      });
    });

    window.addEventListener('beforeunload', () => {
      StorageManager.saveTimer(this.timer);
      StorageManager.saveStatistics(this.statistics);
    });
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show';
    if (type) notification.classList.add(type);

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  showModal(message, onConfirm) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    const btnOk = document.getElementById('modal-ok');
    const btnCancel = document.getElementById('modal-cancel');

    modalMessage.textContent = message;
    modal.classList.add('show');

    const cleanup = () => {
      modal.classList.remove('show');
      btnOk.removeEventListener('click', handleOk);
      btnCancel.removeEventListener('click', handleCancel);
    };

    const handleOk = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };

    const handleCancel = () => {
      cleanup();
    };

    btnOk.addEventListener('click', handleOk);
    btnCancel.addEventListener('click', handleCancel);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
