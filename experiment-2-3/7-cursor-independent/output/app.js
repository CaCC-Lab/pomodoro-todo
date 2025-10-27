(() => {
  'use strict';

  const SELECTORS = {
    taskList: '#task-list',
    taskForm: '#task-form',
    taskTitleInput: '#new-task-title',
    taskEstimateInput: '#new-task-estimate',
    taskFormError: '#task-form-error',
    filterButtons: '.filter-button',
    timerStart: '#timer-start',
    timerPause: '#timer-pause',
    timerResume: '#timer-resume',
    timerReset: '#timer-reset',
    timerSkip: '#timer-skip',
    timerMode: '#timer-mode',
    timerRemaining: '#timer-remaining',
    timerProgressBar: '#timer-progress-bar',
    currentTaskName: '#current-task-name',
    todayPomodoroCount: '#today-pomodoro-count',
    statTodayPomodoros: '#stat-today-pomodoros',
    statTodayCompleted: '#stat-today-completed',
    statTodayDuration: '#stat-today-duration',
    statStreak: '#stat-streak',
    notificationArea: '#notification-area',
    settingsButton: '#open-settings',
    settingsDialog: '#settings-dialog',
    settingsForm: '#settings-form',
    settingsCancel: '#settings-cancel',
    audioBeep: '#audio-beep',
    audioBell: '#audio-bell',
    audioChime: '#audio-chime'
  };

  const STORAGE_KEYS = {
    tasks: 'pomotodo_tasks',
    timer: 'pomotodo_timer',
    settings: 'pomotodo_settings',
    today: 'pomotodo_today',
    history: 'pomotodo_history',
    selectedTask: 'pomotodo_selected_task'
  };

  const DEFAULTS = {
    task(title = '', estimate = null) {
      const now = new Date().toISOString();
      return {
        id: `task_${Date.now()}`,
        title: title.trim(),
        completed: false,
        estimatedPomodoros: normalizeEstimate(estimate),
        actualPomodoros: 0,
        createdAt: now,
        completedAt: null
      };
    },
    timer() {
      return {
        mode: 'idle',
        duration: 1500,
        remainingTime: 1500,
        isRunning: false,
        isPaused: false,
        currentTaskId: null,
        startedAt: null,
        pomodoroCount: 0,
        lastUpdatedAt: null
      };
    },
    settings() {
      return {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        notificationSound: 'beep',
        focusMode: false,
        filterState: 'all'
      };
    },
    todayStats(date) {
      return {
        date,
        pomodoros: 0,
        completedTasks: 0,
        workedSeconds: 0,
        streak: 0
      };
    }
  };

  const DOM = {};

  const Utils = {
    todayKey() {
      return new Date().toISOString().slice(0, 10);
    },
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    safeNumber(value, fallback = null) {
      if (value === null || value === undefined || value === '') return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    },
    deepClone(payload) {
      return JSON.parse(JSON.stringify(payload));
    }
  };

  const Storage = {
    read(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null || raw === undefined) return Utils.deepClone(fallback);
        return JSON.parse(raw);
      } catch (error) {
        console.error(`[Storage] Failed to read key: ${key}`, error);
        return Utils.deepClone(fallback);
      }
    },
    write(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`[Storage] Failed to write key: ${key}`, error);
        notifyError('E005', '保存容量が不足しています');
        return false;
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.error(`[Storage] Failed to remove key: ${key}`, error);
      }
    }
  };

  const Models = {
    createTask(payload) {
      const base = DEFAULTS.task(payload?.title, payload?.estimatedPomodoros);
      if (payload && typeof payload === 'object') {
        base.id = typeof payload.id === 'string' ? payload.id : base.id;
        base.title = typeof payload.title === 'string' ? payload.title.trim() : base.title;
        base.completed = Boolean(payload.completed);
        base.estimatedPomodoros = normalizeEstimate(payload.estimatedPomodoros);
        base.actualPomodoros = Math.max(0, Utils.safeNumber(payload.actualPomodoros, 0));
        base.createdAt = payload.createdAt || base.createdAt;
        base.completedAt = payload.completedAt || null;
      }
      return base;
    },
    createTimer(payload) {
      const base = DEFAULTS.timer();
      if (!payload || typeof payload !== 'object') return base;
      const duration = Utils.safeNumber(payload.duration, base.duration);
      const remaining = Utils.safeNumber(payload.remainingTime, duration);
      return {
        mode: ['work', 'shortBreak', 'longBreak', 'idle'].includes(payload.mode) ? payload.mode : base.mode,
        duration,
        remainingTime: Math.max(0, remaining),
        isRunning: Boolean(payload.isRunning),
        isPaused: Boolean(payload.isPaused),
        currentTaskId: typeof payload.currentTaskId === 'string' ? payload.currentTaskId : null,
        startedAt: payload.startedAt || null,
        pomodoroCount: Math.max(0, Utils.safeNumber(payload.pomodoroCount, 0)),
        lastUpdatedAt: payload.lastUpdatedAt || null
      };
    },
    createSettings(payload) {
      const base = DEFAULTS.settings();
      if (!payload || typeof payload !== 'object') return base;
      const workDuration = Utils.clamp(Utils.safeNumber(payload.workDuration, base.workDuration), 1, 60);
      const shortBreakDuration = Utils.clamp(Utils.safeNumber(payload.shortBreakDuration, base.shortBreakDuration), 1, 30);
      const longBreakDuration = Utils.clamp(Utils.safeNumber(payload.longBreakDuration, base.longBreakDuration), 5, 60);
      const longBreakInterval = Utils.clamp(Utils.safeNumber(payload.longBreakInterval, base.longBreakInterval), 1, 10);
      return {
        workDuration,
        shortBreakDuration,
        longBreakDuration,
        longBreakInterval,
        notificationSound: ['beep', 'bell', 'chime', 'silent'].includes(payload.notificationSound)
          ? payload.notificationSound
          : base.notificationSound,
        focusMode: Boolean(payload.focusMode),
        filterState: ['all', 'active', 'completed'].includes(payload.filterState)
          ? payload.filterState
          : base.filterState
      };
    },
    createTodayStats(payload) {
      const base = DEFAULTS.todayStats(Utils.todayKey());
      if (!payload || typeof payload !== 'object') return base;
      return {
        date: payload.date || base.date,
        pomodoros: Math.max(0, Utils.safeNumber(payload.pomodoros, base.pomodoros)),
        completedTasks: Math.max(0, Utils.safeNumber(payload.completedTasks, base.completedTasks)),
        workedSeconds: Math.max(0, Utils.safeNumber(payload.workedSeconds, base.workedSeconds)),
        streak: Math.max(0, Utils.safeNumber(payload.streak, base.streak))
      };
    }
  };

  const State = (() => {
    const subscribers = new Map();
    const data = {
      tasks: [],
      filter: 'all',
      selectedTaskId: null,
      settings: DEFAULTS.settings(),
      timer: DEFAULTS.timer(),
      today: DEFAULTS.todayStats(Utils.todayKey()),
      history: []
    };

    function init() {
      data.settings = Models.createSettings(Storage.read(STORAGE_KEYS.settings, DEFAULTS.settings()));
      data.filter = data.settings.filterState;

      const storedTasks = Storage.read(STORAGE_KEYS.tasks, []);
      data.tasks = Array.isArray(storedTasks) ? storedTasks.map(Models.createTask) : [];

      data.selectedTaskId = Storage.read(STORAGE_KEYS.selectedTask, null);
      if (!isValidTaskId(data.selectedTaskId, data.tasks)) {
        data.selectedTaskId = null;
      }

      data.timer = Models.createTimer(Storage.read(STORAGE_KEYS.timer, DEFAULTS.timer()));
      if (data.timer.currentTaskId && !isValidTaskId(data.timer.currentTaskId, data.tasks)) {
        data.timer.currentTaskId = null;
      }

      const storedHistory = Storage.read(STORAGE_KEYS.history, []);
      data.history = Array.isArray(storedHistory) ? storedHistory.map(Models.createTodayStats) : [];

      const todayObj = Storage.read(STORAGE_KEYS.today, null);
      data.today = Models.createTodayStats(todayObj);

      handleDayRollover();
      persistAll();
      notifySubscribers('init', getSnapshot());
    }

    function handleDayRollover() {
      const todayKey = Utils.todayKey();
      if (data.today.date === todayKey) return;

      if (data.today.date) {
        const previous = Models.createTodayStats(data.today);
        if (previous.date !== todayKey) {
          data.history.push(previous);
          data.history = data.history.slice(-30);
        }
      }

      const newToday = DEFAULTS.todayStats(todayKey);
      const lastEntry = data.history[data.history.length - 1];
      if (lastEntry && lastEntry.pomodoros > 0 && lastEntry.date) {
        newToday.streak = (lastEntry.streak || 0) + 1;
      } else {
        newToday.streak = 0;
      }

      data.today = newToday;
      Storage.write(STORAGE_KEYS.history, data.history);
      Storage.write(STORAGE_KEYS.today, data.today);
    }

    function persistAll() {
      Storage.write(STORAGE_KEYS.settings, { ...data.settings, filterState: data.filter });
      Storage.write(STORAGE_KEYS.tasks, data.tasks);
      Storage.write(STORAGE_KEYS.timer, data.timer);
      Storage.write(STORAGE_KEYS.history, data.history);
      Storage.write(STORAGE_KEYS.today, data.today);
      if (data.selectedTaskId) {
        Storage.write(STORAGE_KEYS.selectedTask, data.selectedTaskId);
      } else {
        Storage.remove(STORAGE_KEYS.selectedTask);
      }
    }

    function subscribe(topic, handler) {
      if (typeof handler !== 'function') return () => {};
      if (!subscribers.has(topic)) {
        subscribers.set(topic, new Set());
      }
      const bucket = subscribers.get(topic);
      bucket.add(handler);
      return () => bucket.delete(handler);
    }

    function notifySubscribers(topic, payload) {
      const bucket = subscribers.get(topic);
      if (!bucket) return;
      bucket.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error('[State] subscriber error', error);
        }
      });
    }

    function set(partial, options = {}) {
      Object.assign(data, partial);
      if (options.persist !== false) {
        persistAll();
      }
      if (options.notify !== false) {
        notifySubscribers(options.topic || 'state', getSnapshot());
      }
    }

    function updateTimer(updater, options = {}) {
      const nextTimer = { ...data.timer };
      updater(nextTimer);
      data.timer = Models.createTimer(nextTimer);
      if (options.persist !== false) {
        Storage.write(STORAGE_KEYS.timer, data.timer);
      }
      if (options.notify !== false) {
        notifySubscribers(options.topic || 'timer', getSnapshot());
      }
    }

    function updateSettings(updater, options = {}) {
      const nextSettings = { ...data.settings };
      updater(nextSettings);
      data.settings = Models.createSettings(nextSettings);
      data.filter = data.settings.filterState;
      if (options.persist !== false) {
        Storage.write(STORAGE_KEYS.settings, { ...data.settings });
      }
      if (options.notify !== false) {
        notifySubscribers(options.topic || 'settings', getSnapshot());
      }
    }

    function setFilter(filter) {
      if (!['all', 'active', 'completed'].includes(filter)) return;
      data.filter = filter;
      data.settings.filterState = filter;
      Storage.write(STORAGE_KEYS.settings, { ...data.settings });
      notifySubscribers('filter', getSnapshot());
    }

    function setSelectedTask(taskId) {
      data.selectedTaskId = isValidTaskId(taskId, data.tasks) ? taskId : null;
      if (data.selectedTaskId) {
        Storage.write(STORAGE_KEYS.selectedTask, data.selectedTaskId);
      } else {
        Storage.remove(STORAGE_KEYS.selectedTask);
      }
      notifySubscribers('selection', getSnapshot());
    }

    function replaceTasks(nextTasks, options = {}) {
      data.tasks = Array.isArray(nextTasks) ? nextTasks.map(Models.createTask) : [];
      if (!isValidTaskId(data.selectedTaskId, data.tasks)) {
        data.selectedTaskId = null;
      }
      if (!isValidTaskId(data.timer.currentTaskId, data.tasks)) {
        data.timer.currentTaskId = null;
      }
      if (options.persist !== false) {
        Storage.write(STORAGE_KEYS.tasks, data.tasks);
      }
      if (options.notify !== false) {
        notifySubscribers(options.topic || 'tasks', getSnapshot());
      }
    }

    function getSnapshot() {
      return {
        tasks: Utils.deepClone(data.tasks),
        filter: data.filter,
        selectedTaskId: data.selectedTaskId,
        settings: Utils.deepClone(data.settings),
        timer: Utils.deepClone(data.timer),
        today: Utils.deepClone(data.today),
        history: Utils.deepClone(data.history)
      };
    }

    return {
      init,
      subscribe,
      set,
      setFilter,
      setSelectedTask,
      replaceTasks,
      updateTimer,
      updateSettings,
      getSnapshot
    };
  })();

  function normalizeEstimate(value) {
    const num = Utils.safeNumber(value, null);
    if (num === null) return null;
    return Utils.clamp(Math.round(num), 1, 20);
  }

  function isValidTaskId(taskId, tasks) {
    if (typeof taskId !== 'string') return false;
    return tasks.some((task) => task.id === taskId);
  }

  function notifyError(code, message) {
    console.warn(`[${code}] ${message}`);
    View.showToast(message);
  }

  const App = {
    init() {
      cacheDom();
      State.init();
      bindEvents();
      View.renderAll(State.getSnapshot());
    }
  };

  function cacheDom() {
    Object.entries(SELECTORS).forEach(([key, selector]) => {
      DOM[key] = document.querySelector(selector);
    });
  }

  function bindEvents() {
    DOM.taskForm?.addEventListener('submit', handleTaskSubmit);
    DOM.taskList?.addEventListener('click', handleTaskListClick);
    DOM.taskList?.addEventListener('dblclick', handleTaskListDoubleClick);
    DOM.taskList?.addEventListener('keydown', handleTaskListKeyDown);

    document.querySelectorAll(SELECTORS.filterButtons).forEach((button) => {
      button.addEventListener('click', () => {
        State.setFilter(button.dataset.filter);
      });
    });

    State.subscribe('tasks', View.renderTasks.bind(View));
    State.subscribe('filter', View.updateFilterButtons.bind(View));
    State.subscribe('selection', View.updateTaskSelection.bind(View));

    window.addEventListener('storage', () => {
      // 後続フェーズでクロスタブ同期を実装
    });
  }

  const View = {
    renderAll(snapshot) {
      this.renderTasks(snapshot);
      this.updateFilterButtons(snapshot);
      this.updateTaskSelection(snapshot);
    },

    renderTasks(snapshot) {
      if (!DOM.taskList) return;
      DOM.taskList.innerHTML = '';
      const tasks = filterTasks(snapshot.tasks, snapshot.filter);
      if (tasks.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'task-empty';
        empty.textContent = 'タスクがありません';
        DOM.taskList.appendChild(empty);
        return;
      }
      const fragment = document.createDocumentFragment();
      tasks.forEach((task) => {
        fragment.appendChild(createTaskElement(task, snapshot.selectedTaskId));
      });
      DOM.taskList.appendChild(fragment);
    },

    updateFilterButtons(snapshot) {
      document.querySelectorAll(SELECTORS.filterButtons).forEach((button) => {
        const isActive = button.dataset.filter === snapshot.filter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
    },

    updateTaskSelection(snapshot) {
      if (!DOM.taskList) return;
      DOM.taskList.querySelectorAll('.task-item').forEach((item) => {
        const taskId = item.getAttribute('data-task-id');
        item.classList.toggle('selected', taskId === snapshot.selectedTaskId);
      });
    },

    showToast(message) {
      if (!DOM.notificationArea) return;
      const toast = document.createElement('div');
      toast.className = 'notification-card';
      toast.textContent = message;
      DOM.notificationArea.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }
  };

  function filterTasks(tasks, filter) {
    if (filter === 'active') return tasks.filter((task) => !task.completed);
    if (filter === 'completed') return tasks.filter((task) => task.completed);
    return tasks;
  }

  function createTaskElement(task, selectedTaskId) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.taskId = task.id;
    if (task.completed) li.classList.add('completed');
    if (task.id === selectedTaskId) li.classList.add('selected');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.dataset.action = 'toggle';
    checkbox.setAttribute('aria-label', `${task.title} を完了状態に切り替える`);
    li.appendChild(checkbox);

    const content = document.createElement('div');
    content.className = 'task-content';

    const title = document.createElement('p');
    title.className = 'task-title';
    if (task.completed) title.classList.add('completed');
    title.textContent = task.title;
    title.tabIndex = 0;
    title.dataset.action = 'select';
    content.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const estimate = task.estimatedPomodoros;
    const actual = task.actualPomodoros;
    meta.textContent = `🍅 ${estimate ? `${actual}/${estimate}` : actual}`;
    content.appendChild(meta);

    li.appendChild(content);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-icon';
    deleteButton.dataset.action = 'delete';
    deleteButton.setAttribute('aria-label', `${task.title} を削除`);
    deleteButton.textContent = '✕';
    actions.appendChild(deleteButton);
    li.appendChild(actions);

    return li;
  }

  function handleTaskSubmit(event) {
    event.preventDefault();
    const titleInput = DOM.taskTitleInput;
    const estimateInput = DOM.taskEstimateInput;
    const errorBox = DOM.taskFormError;
    if (!titleInput || !errorBox) return;

    const rawTitle = titleInput.value.trim();
    const estimateValue = estimateInput?.value ?? '';
    const estimate = estimateValue === '' ? null : Number(estimateValue);

    const validation = validateTaskInput(rawTitle, estimate);
    if (!validation.valid) {
      errorBox.textContent = validation.message;
      titleInput.focus();
      titleInput.classList.add('error');
      setTimeout(() => titleInput.classList.remove('error'), 200);
      return;
    }

    const snapshot = State.getSnapshot();
    const newTask = Models.createTask({ title: rawTitle, estimatedPomodoros: estimate });
    State.replaceTasks([newTask, ...snapshot.tasks]);
    State.setSelectedTask(newTask.id);

    titleInput.value = '';
    if (estimateInput) estimateInput.value = '';
    errorBox.textContent = '';
    titleInput.focus();
  }

  function validateTaskInput(title, estimate) {
    if (!title) return { valid: false, message: 'タスク名を入力してください' };
    if (title.length > 100) return { valid: false, message: 'タスク名は100文字以内で入力してください' };
    if (estimate !== null) {
      if (!Number.isInteger(estimate) || estimate < 1 || estimate > 20) {
        return { valid: false, message: '見積ポモドーロ数は1〜20の範囲で入力してください' };
      }
    }
    return { valid: true };
  }

  function resolveActionTarget(target) {
    if (!(target instanceof HTMLElement)) return null;
    if (target.dataset.action) return target;
    return target.closest('[data-action]');
  }

  function handleTaskListClick(event) {
    const trigger = resolveActionTarget(event.target);
    if (!trigger) return;
    const taskItem = trigger.closest('.task-item');
    if (!taskItem) return;
    const taskId = taskItem.dataset.taskId;
    if (!taskId) return;

    switch (trigger.dataset.action) {
      case 'toggle':
        toggleTaskCompletion(taskId);
        break;
      case 'delete':
        deleteTask(taskId);
        break;
      case 'select':
        State.setSelectedTask(taskId);
        break;
      default:
        break;
    }
  }

  function handleTaskListDoubleClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains('task-title')) return;
    const taskItem = target.closest('.task-item');
    if (!taskItem) return;
    const taskId = taskItem.dataset.taskId;
    if (!taskId) return;
    activateTaskEditMode(taskItem, taskId);
  }

  function handleTaskListKeyDown(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const taskItem = target.closest('.task-item');
    if (!taskItem) return;
    const taskId = taskItem.dataset.taskId;
    if (!taskId) return;

    if (target.dataset.action === 'select' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      State.setSelectedTask(taskId);
    }
    if (event.key === 'Delete') {
      event.preventDefault();
      deleteTask(taskId);
    }
  }

  function toggleTaskCompletion(taskId) {
    const snapshot = State.getSnapshot();
    const updated = snapshot.tasks.map((task) => {
      if (task.id !== taskId) return task;
      const completed = !task.completed;
      return {
        ...task,
        completed,
        completedAt: completed ? new Date().toISOString() : null
      };
    });
    State.replaceTasks(updated);
  }

  function deleteTask(taskId) {
    const snapshot = State.getSnapshot();
    if (snapshot.timer.isRunning && snapshot.timer.currentTaskId === taskId) {
      notifyError('E004', 'タイマーを停止してから削除してください');
      return;
    }
    const filtered = snapshot.tasks.filter((task) => task.id !== taskId);
    State.replaceTasks(filtered);
  }

  function activateTaskEditMode(taskItem, taskId) {
    if (taskItem.classList.contains('editing')) return;
    taskItem.classList.add('editing');

    clearInlineError(taskItem);

    const snapshot = State.getSnapshot();
    const task = snapshot.tasks.find((t) => t.id === taskId);
    if (!task) {
      taskItem.classList.remove('editing');
      return;
    }

    const titleElement = taskItem.querySelector('.task-title');
    if (!titleElement) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 100;
    input.value = task.title;
    input.className = 'task-edit-input';
    titleElement.replaceWith(input);
    input.focus();
    input.select();

    const cancelEdit = () => {
      taskItem.classList.remove('editing');
      if (!taskItem.isConnected) return;
      input.replaceWith(titleElement);
      titleElement.textContent = task.title;
      titleElement.classList.toggle('completed', task.completed);
      clearInlineError(taskItem);
    };

    const submitEdit = () => {
      const nextTitle = input.value.trim();
      if (!nextTitle) {
        showInlineError(taskItem, 'タスク名は必須です');
        input.focus();
        return;
      }
      if (nextTitle.length > 100) {
        showInlineError(taskItem, 'タスク名は100文字以内で入力してください');
        input.focus();
        return;
      }
      if (nextTitle === task.title) {
        cancelEdit();
        return;
      }
      const latest = State.getSnapshot();
      const updatedTasks = latest.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, title: nextTitle };
      });
      State.replaceTasks(updatedTasks);
      taskItem.classList.remove('editing');
      clearInlineError(taskItem);
    };

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitEdit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
      }
    });

    input.addEventListener('blur', () => {
      if (taskItem.classList.contains('editing')) {
        submitEdit();
      }
    });
  }

  function showInlineError(taskItem, message) {
    let error = taskItem.querySelector('.task-error');
    if (!error) {
      error = document.createElement('p');
      error.className = 'task-error';
      taskItem.appendChild(error);
    }
    error.textContent = message;
  }

  function clearInlineError(taskItem) {
    const error = taskItem.querySelector('.task-error');
    if (error) error.remove();
  }

  if (typeof window !== 'undefined') {
    window.__PomoTodoTest = {
      SELECTORS,
      STORAGE_KEYS,
      DEFAULTS,
      Utils,
      Storage,
      Models,
      State,
      View,
      App,
      normalizeEstimate,
      validateTaskInput,
      handleTaskSubmit,
      deleteTask,
      notifyError,
      filterTasks
    };
  }

  window.addEventListener('DOMContentLoaded', App.init);
})();
