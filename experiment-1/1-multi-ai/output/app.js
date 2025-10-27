(function () {
  "use strict";

  const STORAGE_KEYS = Object.freeze({
    TASKS: "pomotodo_tasks",
    TIMER: "pomotodo_timer",
    SETTINGS: "pomotodo_settings",
    TODAY: "pomotodo_today",
    HISTORY: "pomotodo_history"
  });

  const ERROR_MESSAGES = Object.freeze({
    E001: "タスク名を入力してください",
    E002: "タスク名は100文字以内で入力してください",
    E003: "タスクを選択してください",
    E004: "タイマーを停止してから削除してください",
    E005: "保存容量が不足しています",
    E006: "データの保存ができません",
    E007: "タイマーをリセットしますか？",
    E008: "編集を完了してください"
  });

  const DEFAULT_SETTINGS = Object.freeze({
    workDuration: 25,
    shortBreakDuration: 5,
    notificationSound: "beep",
    focusMode: false,
    filterState: "all"
  });

  const DEFAULT_TIMER = Object.freeze({
    mode: "work",
    remainingTime: DEFAULT_SETTINGS.workDuration * 60,
    isRunning: false,
    isPaused: false,
    currentTaskId: null,
    startedAt: null,
    targetTimestamp: null,
    pomodoroCount: 0
  });

  const state = {
    tasks: [],
    filter: DEFAULT_SETTINGS.filterState,
    selectedTaskId: null,
    editingTaskId: null,
    timer: { ...DEFAULT_TIMER },
    settings: { ...DEFAULT_SETTINGS },
    today: createTodaySummary(getTodayKey()),
    history: []
  };

  const elements = {};
  let timerInterval = null;
  let audioContext;

  function init() {
    cacheElements();
    loadState();
    recomputeTodayCompletedTasks();
    persistToday();
    bindEvents();
    renderTasks();
    updateFilterUI();
    updateSelectedTaskLabel();
    restoreTimerState();
    updateTimerDisplay();
    updateTimerDetails();
    updateStatsDisplay();
    updateTodaySummaryDisplay();
    checkDayRollover();
    setInterval(checkDayRollover, 60 * 1000);
  }

  function cacheElements() {
    elements.taskForm = document.querySelector("[data-task-form]");
    elements.taskTitle = document.getElementById("taskTitle");
    elements.taskEstimate = document.getElementById("taskEstimate");
    elements.alert = document.querySelector("[data-element='alert']");
    elements.taskList = document.querySelector("[data-element='taskList']");
    elements.filterButtons = document.querySelectorAll(".filter-button");
    elements.timer = document.querySelector("[data-element='timer']");
    elements.modeLabel = document.querySelector("[data-text='modeLabel']");
    elements.timeDisplay = document.querySelector("[data-text='timeDisplay']");
    elements.progress = document.querySelector("[data-element='progress']");
    elements.timerControls = document.querySelector(".timer-controls");
    elements.selectedTaskLabel = document.querySelector("[data-text='selectedTaskLabel']");
    elements.timerPomodoros = document.querySelector("[data-text='timerPomodoros']");
    elements.timerMode = document.querySelector("[data-text='timerMode']");
    elements.timerState = document.querySelector("[data-text='timerState']");
    elements.statsPomodoros = document.querySelector("[data-text='statsPomodoros']");
    elements.statsTasks = document.querySelector("[data-text='statsTasks']");
    elements.statsTime = document.querySelector("[data-text='statsTime']");
    elements.statsStreak = document.querySelector("[data-text='statsStreak']");
    elements.visualNotification = document.querySelector("[data-element='visualNotification']");
    elements.todayPomodoros = document.querySelector("[data-text='todayPomodoros']");
    elements.todayTasks = document.querySelector("[data-text='todayTasks']");
    elements.todayTime = document.querySelector("[data-text='todayTime']");
  }

  function bindEvents() {
    elements.taskForm.addEventListener("submit", handleTaskSubmit);
    elements.filterButtons.forEach((btn) =>
      btn.addEventListener("click", () => setFilter(btn.dataset.filter))
    );
    elements.taskList.addEventListener("change", handleTaskListChange);
    elements.taskList.addEventListener("click", handleTaskListClick);
    elements.taskList.addEventListener("keydown", handleTaskListKeydown);
    elements.timerControls.addEventListener("click", handleTimerControlClick);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", persistAll);
  }

  function sanitize(str) {
    // Enhanced sanitizer to prevent XSS attacks
    if (typeof str !== 'string') return '';
    // First, remove HTML tags
    let sanitized = str.replace(/<[^>]*>?/gm, '');
    // Then escape any potentially dangerous characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    return sanitized;
  }

  function handleTaskSubmit(event) {
    event.preventDefault();
    if (state.editingTaskId) {
      return showAlert("E008");
    }

    const title = sanitize(elements.taskTitle.value.trim());
    const estimateRaw = elements.taskEstimate.value.trim();

    if (!title) {
      showAlert("E001");
      return;
    }
    if (title.length > 100) {
      showAlert("E002");
      return;
    }

    let estimate = null;
    if (estimateRaw) {
      const parsed = Number.parseInt(estimateRaw, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 20) {
        showAlert(null, "見積もりは1〜20の範囲で入力してください");
        return;
      }
      estimate = parsed;
    }

    const newTask = {
      id: `task_${Date.now()}`,
      title,
      completed: false,
      estimatedPomodoros: estimate,
      actualPomodoros: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    state.tasks = [newTask, ...state.tasks];
    elements.taskTitle.value = "";
    elements.taskEstimate.value = "";
    showAlert(null, "");
    persistTasks();
    renderTasks(true);
  }

  function handleTaskListChange(event) {
    const checkbox = event.target;
    if (!checkbox.matches("[data-role='toggle']")) return;

    const taskId = checkbox.closest("[data-task-id]").dataset.taskId;
    toggleTaskCompletion(taskId, checkbox.checked);
  }

  function handleTaskListClick(event) {
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      const taskId = actionButton.closest("[data-task-id]").dataset.taskId;
      if (actionButton.dataset.action === "edit") {
        return requestEditTask(taskId);
      }
      if (actionButton.dataset.action === "delete") {
        return requestDeleteTask(taskId, actionButton);
      }
    }

    const selectable = event.target.closest("[data-role='select-task']");
    if (selectable) {
      const taskId = selectable.closest("[data-task-id]").dataset.taskId;
      selectTask(taskId);
    }
  }

  function handleTaskListKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const selectable = event.target.closest("[data-role='select-task']");
    if (!selectable) return;
    event.preventDefault();
    const taskId = selectable.closest("[data-task-id]").dataset.taskId;
    selectTask(taskId);
  }

  function handleTimerControlClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    switch (button.dataset.action) {
      case "start":
        startTimer();
        break;
      case "pause":
        pauseTimer();
        break;
      case "reset":
        resetTimer();
        break;
      default:
        break;
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== "visible" && state.timer.isRunning) {
      persistTimer();
    }
  }

  function renderTasks(withAnimation = false) {
    // Use DocumentFragment to batch DOM operations for better performance
    const fragment = document.createDocumentFragment();
    
    // Clear the list efficiently
    elements.taskList.textContent = '';
    
    // Create task items and append to fragment
    getTasksByFilter().forEach((task) => {
      const item = createTaskItem(task);
      if (withAnimation) {
        item.classList.add("entering");
        item.addEventListener(
          "animationend",
          () => item.classList.remove("entering"),
          { once: true }
        );
      }
      fragment.appendChild(item);
    });

    // Single DOM operation to append all items
    elements.taskList.appendChild(fragment);
  }

  function getTasksByFilter() {
    return state.tasks.filter((task) => {
      if (state.filter === "active") return !task.completed;
      if (state.filter === "completed") return task.completed;
      return true;
    });
  }

  function createTaskItem(task) {
    const item = document.createElement("li");
    item.className = "task-item";
    item.dataset.taskId = task.id;

    if (task.completed) item.classList.add("completed");
    if (task.id === state.selectedTaskId) item.classList.add("selected");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = Boolean(task.completed);
    checkbox.setAttribute("aria-label", `${task.title} を完了にする`);
    checkbox.dataset.role = "toggle";
    // Enhance accessibility with proper ARIA attributes
    checkbox.setAttribute("aria-checked", task.completed ? "true" : "false");
    checkbox.setAttribute("role", "checkbox");

    const content = document.createElement("div");
    content.className = "task-content";
    content.dataset.role = "select-task";
    content.tabIndex = 0;
    content.setAttribute("role", "button");
    content.setAttribute("aria-pressed", task.id === state.selectedTaskId ? "true" : "false");
    // Enhance accessibility with proper ARIA labels
    content.setAttribute("aria-label", `タスク: ${task.title}. ${task.completed ? '完了済み' : '未完了'}. ${task.id === state.selectedTaskId ? '選択中' : '未選択'}`);

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = sanitize(task.title);

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const pomodoroBadge = document.createElement("span");
    pomodoroBadge.className = "task-meta__badge";
    pomodoroBadge.dataset.status = derivePomodoroStatus(task);
    const estimateText =
      typeof task.estimatedPomodoros === "number"
        ? `${task.actualPomodoros}/${task.estimatedPomodoros}`
        : `${task.actualPomodoros}`;
    pomodoroBadge.textContent = `🍅 ${estimateText}`;

    const createdTime = document.createElement("span");
    createdTime.textContent = formatRelativeTime(task.createdAt);

    meta.append(pomodoroBadge, createdTime);
    content.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "task-action";
    editButton.dataset.action = "edit";
    editButton.setAttribute("aria-label", "タスクを編集");
    editButton.textContent = "編集";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "task-action";
    deleteButton.dataset.action = "delete";
    deleteButton.setAttribute("aria-label", "タスクを削除");
    deleteButton.textContent = "削除";

    actions.append(editButton, deleteButton);
    item.append(checkbox, content, actions);
    return item;
  }

  function derivePomodoroStatus(task) {
    if (typeof task.estimatedPomodoros !== "number") return "open";
    if (task.actualPomodoros === task.estimatedPomodoros) return "achieved";
    if (task.actualPomodoros > task.estimatedPomodoros) return "over";
    return "open";
  }

  function toggleTaskCompletion(taskId, completed) {
    if (state.timer.isRunning && state.timer.currentTaskId === taskId) {
      showAlert(null, "タイマーを停止してから操作してください");
      renderTasks();
      return;
    }

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.completed = completed;
    task.completedAt = completed ? new Date().toISOString() : null;
    persistTasks();
    recomputeTodayCompletedTasks();
    persistToday();
    renderTasks();
    updateStatsDisplay();
    updateTodaySummaryDisplay();
  }

  function requestEditTask(taskId) {
    if (state.timer.isRunning) {
      showAlert("E008");
      return;
    }
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    state.editingTaskId = taskId;
    const nextTitle = window.prompt("タスク名を編集", sanitize(task.title));
    if (nextTitle === null) {
      state.editingTaskId = null;
      return;
    }

    const trimmed = sanitize(nextTitle.trim());
    if (!trimmed) {
      showAlert("E001");
      state.editingTaskId = null;
      return;
    }
    if (trimmed.length > 100) {
      showAlert("E002");
      state.editingTaskId = null;
      return;
    }

    task.title = trimmed;
    task.updatedAt = new Date().toISOString();
    state.editingTaskId = null;
    persistTasks();
    renderTasks();
  }

  function requestDeleteTask(taskId, control) {
    if (state.timer.isRunning) {
      showAlert("E004");
      return;
    }
    const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const listItem = control.closest(".task-item");
    listItem.classList.add("removing");
    listItem.addEventListener(
      "animationend",
      () => {
        state.tasks.splice(taskIndex, 1);
        if (state.selectedTaskId === taskId) {
          state.selectedTaskId = null;
          state.timer.currentTaskId = null;
          updateSelectedTaskLabel();
        }
        persistTasks();
        recomputeTodayCompletedTasks();
        persistToday();
        renderTasks();
        updateStatsDisplay();
        updateTodaySummaryDisplay();
      },
      { once: true }
    );
  }

  function selectTask(taskId) {
    if (state.timer.isRunning) {
      showAlert(null, "タイマーを停止してから選択してください");
      return;
    }
    if (!state.tasks.some((task) => task.id === taskId)) return;
    state.selectedTaskId = taskId;
    state.timer.currentTaskId = taskId;
    updateSelectedTaskLabel();
    persistTimer();
    renderTasks();
  }

  function updateSelectedTaskLabel() {
    if (!state.selectedTaskId) {
      elements.selectedTaskLabel.textContent = "タスクを選択してください";
      return;
    }
    const task = state.tasks.find((t) => t.id === state.selectedTaskId);
    if (!task) {
      elements.selectedTaskLabel.textContent = "タスクを選択してください";
      return;
    }
    elements.selectedTaskLabel.textContent = `選択中: ${sanitize(task.title)}`;
  }

  function setFilter(filter) {
    state.filter = filter;
    state.settings.filterState = filter;
    persistSettings();
    updateFilterUI();
    renderTasks();
  }

  function updateFilterUI() {
    elements.filterButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.filter === state.filter);
    });
  }

  function startTimer() {
    if (state.timer.isRunning) return;
    if (state.editingTaskId) {
      showAlert("E008");
      return;
    }
    if (state.timer.mode === "work" && !state.selectedTaskId) {
      showAlert("E003");
      return;
    }

    if (state.timer.mode === "work") {
      state.timer.currentTaskId = state.selectedTaskId;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }

    state.timer.isRunning = true;
    state.timer.isPaused = false;
    const now = Date.now();
    state.timer.startedAt = new Date(now).toISOString();
    state.timer.targetTimestamp = now + state.timer.remainingTime * 1000;
    persistTimer();
    startTicking();
    updateTimerStateLabel();
    elements.timer.classList.add("running");
  }

  function startTicking() {
    clearInterval(timerInterval);
    timerInterval = window.setInterval(tick, 250);
    tick();
  }

  function tick() {
    if (!state.timer.isRunning || !state.timer.targetTimestamp) return;
    const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
    state.timer.remainingTime = remaining;
    updateTimerDisplay();

    if (remaining <= 0) {
      completeTimerCycle();
    }
  }

  function pauseTimer() {
    if (!state.timer.isRunning) return;
    state.timer.isRunning = false;
    state.timer.isPaused = true;
    if (state.timer.targetTimestamp) {
      const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
      state.timer.remainingTime = remaining;
    }
    state.timer.targetTimestamp = null;
    clearInterval(timerInterval);
    persistTimer();
    updateTimerStateLabel();
    elements.timer.classList.remove("running");
    updateTimerDisplay();
  }

  function resetTimer() {
    const confirmed = window.confirm(ERROR_MESSAGES.E007);
    if (!confirmed) return;
    clearInterval(timerInterval);
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.targetTimestamp = null;
    state.timer.remainingTime = getModeDuration(state.timer.mode);
    state.timer.startedAt = null;
    state.timer.currentTaskId = state.selectedTaskId;
    updateTimerStateLabel();
    persistTimer();
    updateTimerDisplay();
    elements.timer.classList.remove("running");
  }

  function completeTimerCycle() {
    clearInterval(timerInterval);
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.targetTimestamp = null;
    state.timer.remainingTime = 0;
    updateTimerDisplay();
    updateTimerStateLabel();
    elements.timer.classList.remove("running");
    handleTimerCompletionEffects();
    advanceTimerMode();
    persistAll();
  }

  function advanceTimerMode() {
    if (state.timer.mode === "work") {
      state.timer.mode = "break";
      state.timer.remainingTime = getModeDuration("break");
    } else {
      state.timer.mode = "work";
      state.timer.remainingTime = getModeDuration("work");
    }
    updateTimerDetails();
    updateTimerDisplay();
  }

  function handleTimerCompletionEffects() {
    triggerVisualNotification();
    playNotificationSound();
    dispatchBrowserNotification();

    if (state.timer.mode !== "work" || !state.timer.currentTaskId) {
      updateTimerDetails();
      return;
    }

    const task = state.tasks.find((t) => t.id === state.timer.currentTaskId);
    if (!task) {
      updateTimerDetails();
      return;
    }

    task.actualPomodoros += 1;
    state.today.pomodoros += 1;
    state.today.totalMinutes += state.settings.workDuration;
    recomputeTodayCompletedTasks();

    if (!state.today.lastTaskId || state.today.lastTaskId === task.id) {
      state.today.currentStreak = (state.today.currentStreak || 0) + 1;
    } else {
      state.today.currentStreak = 1;
    }
    state.today.lastTaskId = task.id;
    state.timer.pomodoroCount = state.today.pomodoros;

    persistTasks();
    persistToday();
    updateStatsDisplay();
    updateTodaySummaryDisplay();
    renderTasks();
  }

  function triggerVisualNotification() {
    elements.visualNotification.classList.remove("is-active");
    // Force reflow to restart animation
    void elements.visualNotification.offsetWidth;
    elements.visualNotification.classList.add("is-active");
    window.setTimeout(() => {
      elements.visualNotification.classList.remove("is-active");
    }, 1800);
  }

  function playNotificationSound() {
    if (state.settings.notificationSound === "silent") return;
    try {
      if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
      }
      const now = audioContext.currentTime;
      for (let i = 0; i < 3; i += 1) {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, now + i * 0.2);
        gain.gain.setValueAtTime(0, now + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.2 + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.18);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now + i * 0.2);
        oscillator.stop(now + i * 0.2 + 0.2);
      }
    } catch (error) {
      console.warn("Audio playback failed", error);
    }
  }

  function dispatchBrowserNotification() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const body = state.timer.mode === "work" ? "休憩を取りましょう" : "次のタスクに戻りましょう";
    const title = state.timer.mode === "work" ? "作業完了" : "休憩終了";
    try {
      new Notification(title, { body, silent: true });
    } catch (error) {
      console.warn("Notification failed", error);
    }
  }

  function updateTimerDisplay() {
    const formatted = formatTime(state.timer.remainingTime);
    elements.timeDisplay.textContent = formatted;

    const duration = getModeDuration(state.timer.mode);
    const progress = duration === 0 ? 0 : ((duration - state.timer.remainingTime) / duration) * 100;
    elements.progress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    elements.timer.querySelector(".timer__progress").setAttribute("aria-valuenow", String(Math.floor(progress)));

    if (state.timer.mode === "work") {
      elements.modeLabel.textContent = "作業モード";
      elements.timerMode.textContent = "作業";
    } else {
      elements.modeLabel.textContent = "休憩モード";
      elements.timerMode.textContent = "休憩";
    }

    elements.timerPomodoros.textContent = String(state.today.pomodoros);
  }

  function updateTimerDetails() {
    updateTimerStateLabel();
    updateTimerDisplay();
  }

  function updateTimerStateLabel() {
    if (state.timer.isRunning) {
      elements.timerState.textContent = "実行中";
      return;
    }
    if (state.timer.isPaused) {
      elements.timerState.textContent = "一時停止";
      return;
    }
    elements.timerState.textContent = "停止中";
  }

  function updateStatsDisplay() {
    const today = getTodayKey();
    const completedToday = state.tasks.filter(
      (task) => task.completedAt && task.completedAt.startsWith(today)
    ).length;

    elements.statsTasks.textContent = String(completedToday);
    elements.statsPomodoros.textContent = String(state.today.pomodoros);
    elements.statsTime.textContent = `${state.today.totalMinutes}分`;
    elements.statsStreak.textContent = String(state.today.currentStreak || 0);
  }

  function updateTodaySummaryDisplay() {
    elements.todayPomodoros.textContent = `🍅 ${state.today.pomodoros}`;
    elements.todayTasks.textContent = String(state.today.completedTasks);
    const hours = Math.floor(state.today.totalMinutes / 60);
    const minutes = state.today.totalMinutes % 60;
    elements.todayTime.textContent = `${hours}h ${minutes}m`;
  }

  function loadState() {
    state.settings = { ...DEFAULT_SETTINGS, ...safeParseStorage(STORAGE_KEYS.SETTINGS) };
    state.filter = state.settings.filterState || "all";

    const storedTasks = safeParseStorage(STORAGE_KEYS.TASKS, []);
    if (Array.isArray(storedTasks)) {
      state.tasks = storedTasks.map(normalizeTask);
    }

    const storedTimer = safeParseStorage(STORAGE_KEYS.TIMER, {});
    state.timer = { ...DEFAULT_TIMER, ...sanitizeTimer(storedTimer) };
    state.selectedTaskId = state.timer.currentTaskId;

    const storedHistory = safeParseStorage(STORAGE_KEYS.HISTORY, []);
    if (Array.isArray(storedHistory)) {
      state.history = storedHistory;
    }

    const todayKey = getTodayKey();
    const storedToday = safeParseStorage(STORAGE_KEYS.TODAY);
    if (storedToday && storedToday.date === todayKey) {
      state.today = { ...createTodaySummary(todayKey), ...storedToday };
    } else {
      state.today = createTodaySummary(todayKey);
    }
    state.timer.pomodoroCount = state.today.pomodoros;
  }

  function persistAll() {
    persistTasks();
    persistSettings();
    persistTimer();
    persistToday();
    persistHistory();
  }

  function persistTasks() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    } catch (error) {
      handleStorageError(error);
    }
  }

  function persistSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    } catch (error) {
      handleStorageError(error);
    }
  }

  function persistTimer() {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(state.timer));
    } catch (error) {
      handleStorageError(error);
    }
  }

  function persistToday() {
    try {
      localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify(state.today));
    } catch (error) {
      handleStorageError(error);
    }
  }

  function persistHistory() {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
    } catch (error) {
      handleStorageError(error);
    }
  }

  function handleStorageError(error) {
    if (error && error.name === "QuotaExceededError") {
      showAlert("E005");
    } else {
      showAlert("E006");
    }
  }

  function restoreTimerState() {
    if (!state.timer.isRunning || !state.timer.targetTimestamp) {
      if (!Number.isFinite(state.timer.remainingTime) || state.timer.remainingTime <= 0) {
        state.timer.remainingTime = getModeDuration(state.timer.mode);
      }
      updateTimerDisplay();
      updateTimerStateLabel();
      return;
    }

    const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
    state.timer.remainingTime = remaining;
    if (remaining <= 0) {
      completeTimerCycle();
    } else {
      startTicking();
      elements.timer.classList.add("running");
      updateTimerStateLabel();
    }
  }

  function checkDayRollover() {
    const todayKey = getTodayKey();
    if (state.today.date === todayKey) return;
    state.history = state.history.filter((entry) => entry && entry.date);
    state.history.push({ ...state.today });
    if (state.history.length > 30) {
      state.history = state.history.slice(-30);
    }
    state.today = createTodaySummary(todayKey);
    state.timer.pomodoroCount = 0;
    updateStatsDisplay();
    updateTodaySummaryDisplay();
    persistToday();
    persistHistory();
  }

  function showAlert(code, overrideMessage) {
    const message = overrideMessage !== undefined ? overrideMessage : ERROR_MESSAGES[code] || "";
    if (!elements.alert) return;
    elements.alert.textContent = message || "";
    if (!message) {
      elements.alert.classList.remove("is-visible");
    } else {
      elements.alert.classList.add("is-visible");
    }
  }

  function safeParseStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      handleStorageError(error);
      return fallback;
    }
  }

  function normalizeTask(task) {
    return {
      id: task.id || `task_${Date.now()}`,
      title: typeof task.title === "string" ? task.title : "名称未設定",
      completed: Boolean(task.completed),
      estimatedPomodoros: sanitizeNumber(task.estimatedPomodoros, null),
      actualPomodoros: sanitizeNumber(task.actualPomodoros, 0),
      createdAt: task.createdAt || new Date().toISOString(),
      completedAt: task.completedAt || null
    };
  }

  function sanitizeTimer(timer) {
    const sanitized = { ...timer };
    sanitized.mode = timer.mode === "break" ? "break" : "work";
    sanitized.remainingTime = sanitizeNumber(timer.remainingTime, getModeDuration(sanitized.mode));
    sanitized.isRunning = Boolean(timer.isRunning);
    sanitized.isPaused = Boolean(timer.isPaused);
    sanitized.currentTaskId = timer.currentTaskId || null;
    sanitized.startedAt = timer.startedAt || null;
    sanitized.targetTimestamp = timer.targetTimestamp || null;
    sanitized.pomodoroCount = sanitizeNumber(timer.pomodoroCount, 0);
    return sanitized;
  }

  function sanitizeNumber(value, fallback) {
    const num = Number.parseInt(value, 10);
    return Number.isFinite(num) ? num : fallback;
  }

  function getModeDuration(mode) {
    if (mode === "break") {
      return clamp(state.settings.shortBreakDuration, 1, 30) * 60;
    }
    return clamp(state.settings.workDuration, 1, 60) * 60;
  }

  function clamp(value, min, max) {
    const num = Number(value);
    if (!Number.isFinite(num)) return min;
    return Math.min(Math.max(num, min), max);
  }

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Number.parseInt(totalSeconds, 10) || 0);
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return "";
    const created = new Date(isoString);
    if (Number.isNaN(created.getTime())) return "";
    const diff = Date.now() - created.getTime();
    if (diff < 60 * 1000) return "たった今";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}時間前`;
    return created.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function createTodaySummary(date) {
    return {
      date,
      pomodoros: 0,
      completedTasks: 0,
      totalMinutes: 0,
      currentStreak: 0,
      lastTaskId: null
    };
  }

  function recomputeTodayCompletedTasks() {
    const todayKey = getTodayKey();
    const completedToday = state.tasks.filter(
      (task) => task.completedAt && task.completedAt.startsWith(todayKey)
    ).length;
    state.today.completedTasks = completedToday;
  }

  init();
})();
