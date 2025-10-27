(function () {
  "use strict";

  const STORAGE_KEYS = Object.freeze({
    TASKS: "pomotodo_tasks",
    TASKS_BACKUP: "pomotodo_tasks_backup",
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
    E008: "編集を完了してください",
    SELECT_LOCK: "タイマーを停止してから選択してください"
  });

  const DEFAULT_SETTINGS = Object.freeze({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    notificationSound: "beep",
    focusMode: false,
    filterState: "all"
  });

  const DEFAULT_TIMER = Object.freeze({
    mode: "idle",
    remainingTime: DEFAULT_SETTINGS.workDuration * 60,
    isRunning: false,
    isPaused: false,
    currentTaskId: null,
    startedAt: null,
    targetTimestamp: null,
    pomodoroCount: 0,
    completedWorkSessions: 0
  });

  const DEBUG = false;

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
  let toastTimeout = null;
  let audioCache = null;
  let storageRecoveryPrompted = false;
  const devLog = (...args) => {
    if (!DEBUG) return;
    console.log("[PomoTodo]", ...args);
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();
    loadState();
    renderTasks();
    updateFilterUI();
    updateSelectedTaskLabel();
    restoreTimerState();
    updateTimerDisplay();
    updateTimerMeta();
    updateStats();
    updateSummary();
    syncSettingsForm();
    syncFocusOverlay();
    requestNotificationPermission();
    setInterval(checkDayRollover, 60 * 1000);
  }

  function cacheElements() {
    elements.taskForm = qs("[data-task-form]");
    elements.taskTitle = document.getElementById("taskTitle");
    elements.taskEstimate = document.getElementById("taskEstimate");
    elements.formHint = qs("[data-text='formHint']");
    elements.taskList = qs("[data-element='taskList']");
    elements.filterButtons = qsa(".filter");
    elements.selectedTaskLabel = qs("[data-text='selectedTaskLabel']");
    elements.timerModeLabel = qs("[data-text='timerModeLabel']");
    elements.timerDisplay = qs("[data-text='timerDisplay']");
    elements.timerProgress = qs("[data-element='timerProgress']");
    elements.timerTask = qs("[data-text='timerTask']");
    elements.timerControls = qs(".timer-controls");
    elements.timerPomodoros = qs("[data-text='timerPomodoros']");
    elements.timerState = qs("[data-text='timerState']");
    elements.timerMode = qs("[data-text='timerMode']");
    elements.statsTasks = qs("[data-text='statsTasks']");
    elements.statsPomodoros = qs("[data-text='statsPomodoros']");
    elements.statsTime = qs("[data-text='statsTime']");
    elements.statsUntilLong = qs("[data-text='statsUntilLong']");
    elements.statsUpdated = qs("[data-text='statsUpdated']");
    elements.summaryPomodoros = qs("[data-text='summaryPomodoros']");
    elements.summaryTasks = qs("[data-text='summaryTasks']");
    elements.summaryTime = qs("[data-text='summaryTime']");
    elements.toast = qs("[data-element='toast']");
    elements.timerPanel = qs("[data-element='timer']");
    elements.settingsModal = qs("[data-element='settingsModal']");
    elements.settingsForm = qs("[data-settings-form]");
    elements.focusOverlay = qs("[data-element='focusOverlay']");
    elements.openSettingsBtn = qs("[data-action='open-settings']");
    elements.closeSettingsBtns = qsa("[data-action='close-settings']");
    elements.resetSettingsBtn = qs("[data-action='reset-settings']");
    elements.focusToggleBtn = qs("[data-action='focus-mode-toggle']");
    elements.exitFocusBtn = qs("[data-action='exit-focus']");
  }

  function bindEvents() {
    if (elements.taskForm) {
      elements.taskForm.addEventListener("submit", handleTaskSubmit);
      elements.taskTitle.addEventListener("input", () => elements.formHint.textContent = "");
    }
    elements.filterButtons.forEach((btn) => btn.addEventListener("click", () => setFilter(btn.dataset.filter)));
    if (elements.taskList) {
      elements.taskList.addEventListener("click", handleTaskListClick);
      elements.taskList.addEventListener("change", handleTaskListChange);
      elements.taskList.addEventListener("keydown", handleTaskListKeydown);
      elements.taskList.addEventListener("dblclick", handleTaskListDblClick);
    }
    if (elements.timerControls) {
      elements.timerControls.addEventListener("click", handleTimerControlClick);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", persistAll);
    if (elements.openSettingsBtn) {
      elements.openSettingsBtn.addEventListener("click", openSettings);
    }
    elements.closeSettingsBtns.forEach((btn) => btn.addEventListener("click", closeSettings));
    if (elements.settingsForm) {
      elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
    }
    if (elements.resetSettingsBtn) {
      elements.resetSettingsBtn.addEventListener("click", resetSettingsToDefault);
    }
    if (elements.focusToggleBtn) {
      elements.focusToggleBtn.addEventListener("click", toggleFocusModeFromButton);
    }
    if (elements.exitFocusBtn) {
      elements.exitFocusBtn.addEventListener("click", exitFocusMode);
    }
  }

  // ---------- Data loading & persistence ----------
  function loadState() {
    state.settings = { ...DEFAULT_SETTINGS, ...safeParse(STORAGE_KEYS.SETTINGS, {}) };
    state.filter = state.settings.filterState || "all";
    const storedTasks = safeParse(STORAGE_KEYS.TASKS, []);
    if (Array.isArray(storedTasks)) {
      state.tasks = storedTasks.map(normalizeTask);
    }
    const storedTimer = safeParse(STORAGE_KEYS.TIMER, {});
    state.timer = { ...DEFAULT_TIMER, ...sanitizeTimer(storedTimer) };
    state.selectedTaskId = state.timer.currentTaskId;
    const storedToday = safeParse(STORAGE_KEYS.TODAY, null);
    const todayKey = getTodayKey();
    if (storedToday && storedToday.date === todayKey) {
      state.today = { ...createTodaySummary(todayKey), ...storedToday };
    } else {
      state.today = createTodaySummary(todayKey);
    }
    const history = safeParse(STORAGE_KEYS.HISTORY, []);
    if (Array.isArray(history)) {
      state.history = history.slice(-30);
    }
    recomputeTodayTasks();
  }

  function persistAll() {
    persistTasks();
    persistTimer();
    persistSettings();
    persistToday();
    persistHistory();
  }

  function persistTasks() {
    try {
      const previous = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (previous) {
        localStorage.setItem(STORAGE_KEYS.TASKS_BACKUP, previous);
      }
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
      devLog("persistTasks", state.tasks.length);
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

  function persistSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
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
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history.slice(-30)));
    } catch (error) {
      handleStorageError(error);
    }
  }

  function handleStorageError(error) {
    if (error && error.name === "QuotaExceededError") {
      showToast(ERROR_MESSAGES.E005, "error");
    } else {
      showToast(ERROR_MESSAGES.E006, "error");
    }
  }

  function safeParse(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      handleStorageError(error);
      if (!storageRecoveryPrompted && typeof window !== "undefined" && window.confirm("保存データが破損しています。初期化しますか？")) {
        localStorage.removeItem(key);
        storageRecoveryPrompted = true;
      }
      return fallback;
    }
  }

  // ---------- Task management ----------
  function handleTaskSubmit(event) {
    event.preventDefault();
    if (state.editingTaskId) {
      showHint(ERROR_MESSAGES.E008);
      return;
    }
    const title = sanitize(elements.taskTitle.value.trim());
    const estimateValue = elements.taskEstimate.value.trim();
    if (!title) {
      showHint(ERROR_MESSAGES.E001);
      return;
    }
    if (title.length > 100) {
      showHint(ERROR_MESSAGES.E002);
      return;
    }
    let estimatedPomodoros = null;
    if (estimateValue) {
      const parsed = Number.parseInt(estimateValue, 10);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 20) {
        showHint("見積もりは1〜20で入力してください");
        return;
      }
      estimatedPomodoros = parsed;
    }
    const task = {
      id: `task_${Date.now()}`,
      title,
      completed: false,
      estimatedPomodoros,
      actualPomodoros: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    state.tasks = [task, ...state.tasks];
    elements.taskTitle.value = "";
    elements.taskEstimate.value = "";
    showHint("");
    persistTasks();
    renderTasks(true);
  }

  function handleTaskListClick(event) {
    const action = event.target.closest("[data-action]");
    if (action) {
      const taskEl = action.closest("[data-task-id]");
      if (!taskEl) return;
      const taskId = taskEl.dataset.taskId;
      if (action.dataset.action === "delete") {
        requestDeleteTask(taskId);
        return;
      }
      if (action.dataset.action === "edit") {
        requestEditTask(taskId);
        return;
      }
    }
    const selectable = event.target.closest("[data-role='select-task']");
    if (selectable) {
      const taskId = selectable.closest("[data-task-id]").dataset.taskId;
      selectTask(taskId);
    }
  }

  function handleTaskListChange(event) {
    if (!event.target.matches("[data-role='toggle']")) return;
    const taskId = event.target.closest("[data-task-id]").dataset.taskId;
    toggleTaskCompletion(taskId, event.target.checked);
  }

  function handleTaskListKeydown(event) {
    if (event.key === "Enter" && event.target.matches("[data-role='select-task']")) {
      event.preventDefault();
      const taskId = event.target.closest("[data-task-id]").dataset.taskId;
      selectTask(taskId);
    }
  }

  function handleTaskListDblClick(event) {
    const item = event.target.closest("[data-task-id]");
    if (!item) return;
    requestEditTask(item.dataset.taskId);
  }

  function selectTask(taskId) {
    if (state.timer.isRunning && state.timer.mode === "work" && state.timer.currentTaskId !== taskId) {
      showToast(ERROR_MESSAGES.SELECT_LOCK, "warning");
      return;
    }
    state.selectedTaskId = taskId;
    state.timer.currentTaskId = taskId;
    persistTimer();
    updateSelectedTaskLabel();
    renderTasks();
  }

  function toggleTaskCompletion(taskId, completed) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.completed = completed;
    task.completedAt = completed ? new Date().toISOString() : null;
    persistTasks();
    renderTasks();
    recomputeTodayTasks();
    updateStats();
    updateSummary();
  }

  function requestDeleteTask(taskId) {
    if (state.timer.isRunning && state.timer.currentTaskId === taskId) {
      showToast(ERROR_MESSAGES.E004, "error");
      return;
    }
    const animateRemoval = elements.taskList?.querySelector(`[data-task-id='${taskId}']`);
    const finalize = () => {
      state.tasks = state.tasks.filter((task) => task.id !== taskId);
      if (state.selectedTaskId === taskId) {
        state.selectedTaskId = null;
        state.timer.currentTaskId = null;
      }
      persistTasks();
      renderTasks();
      updateSelectedTaskLabel();
    };
    if (animateRemoval) {
      animateRemoval.classList.add("task-item--removing");
      animateRemoval.addEventListener("animationend", finalize, { once: true });
    } else {
      finalize();
    }
  }

  function requestEditTask(taskId) {
    if (state.timer.isRunning) {
      showToast(ERROR_MESSAGES.E008, "warning");
      return;
    }
    if (state.editingTaskId && state.editingTaskId !== taskId) {
      showToast(ERROR_MESSAGES.E008, "warning");
      return;
    }
    state.editingTaskId = taskId;
    renderTasks();
  }

  function submitTaskEdit(taskId, newTitle) {
    const sanitized = sanitize(newTitle.trim());
    if (!sanitized) {
      showToast(ERROR_MESSAGES.E001, "error");
      return;
    }
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.title = sanitized.slice(0, 100);
    state.editingTaskId = null;
    persistTasks();
    renderTasks();
  }

  function renderTasks(animate = false) {
    if (!elements.taskList) return;
    const fragment = document.createDocumentFragment();
    const filtered = getFilteredTasks();
    filtered.forEach((task) => {
      fragment.appendChild(createTaskElement(task, animate));
    });
    elements.taskList.innerHTML = "";
    elements.taskList.appendChild(fragment);
    if (animate) {
      animateListChange();
    }
  }

  function createTaskElement(task, animate) {
    const li = ce("li");
    li.className = "task-item";
    if (state.selectedTaskId === task.id) li.classList.add("selected");
    if (task.completed) li.classList.add("completed");
    if (animate) li.classList.add("task-item--new");
    li.dataset.taskId = task.id;

    const checkbox = ce("input", { type: "checkbox" });
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `${task.title}の完了状態`);
    checkbox.dataset.role = "toggle";

    const content = ce("div", { className: "task-content" });

    if (state.editingTaskId === task.id) {
      const input = ce("input", { type: "text", value: task.title, maxLength: 100 });
      input.dataset.role = "edit-input";
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          submitTaskEdit(task.id, event.target.value);
        }
        if (event.key === "Escape") {
          state.editingTaskId = null;
          renderTasks();
        }
      });
      input.addEventListener("blur", (event) => {
        if (state.editingTaskId === task.id) {
          submitTaskEdit(task.id, event.target.value);
        }
      });
      content.appendChild(input);
    } else {
      const title = ce("button", { type: "button", className: "task-title" });
      if (task.completed) title.classList.add("completed");
      title.dataset.role = "select-task";
      title.textContent = task.title;
      content.appendChild(title);
    }

    const meta = ce("div", { className: "task-meta" });
    const pomodoroLabel = ce("span");
    const estimate = task.estimatedPomodoros || "-";
    pomodoroLabel.textContent = `🍅 ${task.actualPomodoros}/${estimate}`;
    if (task.estimatedPomodoros) {
      if (task.actualPomodoros < task.estimatedPomodoros) {
        pomodoroLabel.style.color = "var(--text-secondary)";
      } else if (task.actualPomodoros === task.estimatedPomodoros) {
        pomodoroLabel.style.color = "var(--success)";
      } else {
        pomodoroLabel.style.color = "var(--warning)";
      }
    }
    meta.appendChild(pomodoroLabel);

    if (task.estimatedPomodoros) {
      const progress = ce("div", { className: "task-progress" });
      const progressBar = ce("div", { className: "task-progress__bar" });
      const percentage = Math.min(100, (task.actualPomodoros / task.estimatedPomodoros) * 100);
      progressBar.style.width = `${percentage}%`;
      progress.appendChild(progressBar);
      meta.appendChild(progress);
    }

    content.appendChild(meta);

    const actions = ce("div", { className: "task-actions" });
    const editBtn = ce("button", { type: "button", className: "btn btn--ghost" });
    editBtn.textContent = "編集";
    editBtn.dataset.action = "edit";
    const deleteBtn = ce("button", { type: "button", className: "btn btn--ghost" });
    deleteBtn.textContent = "✕";
    deleteBtn.dataset.action = "delete";
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);
    return li;
  }

  function getFilteredTasks() {
    const tasks = [...state.tasks];
    tasks.sort((a, b) => Number(a.completed) - Number(b.completed));
    if (state.filter === "active") {
      return tasks.filter((task) => !task.completed);
    }
    if (state.filter === "completed") {
      return tasks.filter((task) => task.completed);
    }
    return tasks;
  }

  function updateSelectedTaskLabel() {
    if (!elements.selectedTaskLabel) return;
    const task = state.tasks.find((t) => t.id === state.selectedTaskId);
    elements.selectedTaskLabel.textContent = task ? `選択中: ${task.title}` : "タスクを選択してください";
    elements.timerTask.textContent = task ? task.title : "-";
  }

  function setFilter(filter) {
    state.filter = filter;
    state.settings.filterState = filter;
    persistSettings();
    renderTasks();
    animateListChange();
    updateFilterUI();
  }

  function updateFilterUI() {
    elements.filterButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.filter === state.filter);
    });
  }

  function animateListChange() {
    if (!elements.taskList) return;
    elements.taskList.classList.add("is-filtering");
    setTimeout(() => elements.taskList?.classList.remove("is-filtering"), 180);
  }

  function showHint(message) {
    if (!elements.formHint) return;
    elements.formHint.textContent = message || "";
  }

  // ---------- Timer ----------
  function handleTimerControlClick(event) {
    const action = event.target.closest("[data-action^='timer-']");
    if (!action) return;
    const type = action.dataset.action;
    if (type === "timer-start") return startTimer();
    if (type === "timer-pause") return pauseTimer();
    if (type === "timer-resume") return resumeTimer();
    if (type === "timer-reset") return resetTimer();
    if (type === "timer-skip") return skipTimer();
  }

  function startTimer() {
    if (state.timer.isRunning) return;
    if (state.timer.mode === "idle") {
      state.timer.mode = "work";
      state.timer.remainingTime = getModeDuration("work");
    }
    if (state.timer.mode === "work" && !state.selectedTaskId) {
      showToast(ERROR_MESSAGES.E003, "error");
      return;
    }
    state.timer.currentTaskId = state.selectedTaskId;
    state.timer.isRunning = true;
    state.timer.isPaused = false;
    state.timer.startedAt = new Date().toISOString();
    state.timer.targetTimestamp = Date.now() + state.timer.remainingTime * 1000;
    devLog("startTimer", state.timer.mode, state.timer.remainingTime);
    startTicking();
    updateTimerMeta();
    persistTimer();
  }

  function startTicking() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      updateRemainingTime();
    }, 1000);
  }

  function updateRemainingTime() {
    if (!state.timer.isRunning || !state.timer.targetTimestamp) return;
    const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
    state.timer.remainingTime = remaining;
    updateTimerDisplay();
    if (remaining <= 0) {
      completeCycle();
    }
  }

  function pauseTimer() {
    if (!state.timer.isRunning) return;
    state.timer.isRunning = false;
    state.timer.isPaused = true;
    state.timer.remainingTime = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
    state.timer.targetTimestamp = null;
    clearInterval(timerInterval);
    updateTimerMeta();
    persistTimer();
  }

  function resumeTimer() {
    if (!state.timer.isPaused || state.timer.isRunning) return;
    state.timer.isRunning = true;
    state.timer.isPaused = false;
    state.timer.targetTimestamp = Date.now() + state.timer.remainingTime * 1000;
    startTicking();
    updateTimerMeta();
    persistTimer();
  }

  function resetTimer() {
    if (!window.confirm(ERROR_MESSAGES.E007)) return;
    clearInterval(timerInterval);
    state.timer = { ...DEFAULT_TIMER, remainingTime: getModeDuration("work") };
    state.timer.mode = "idle";
    state.selectedTaskId = null;
    updateSelectedTaskLabel();
    updateTimerDisplay();
    updateTimerMeta();
    persistTimer();
  }

  function skipTimer() {
    if (state.timer.mode === "work" && state.timer.isRunning) {
      pauseTimer();
    }
    transitionToNextMode(true);
  }

  function completeCycle() {
    clearInterval(timerInterval);
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.remainingTime = 0;
    updateTimerDisplay();
    if (state.timer.mode === "work") {
      handleWorkSessionComplete();
    } else {
      showToast("休憩が終了しました", "info");
    }
    transitionToNextMode(true);
  }

  function handleWorkSessionComplete() {
    const task = state.tasks.find((t) => t.id === state.timer.currentTaskId);
    if (task) {
      task.actualPomodoros += 1;
      persistTasks();
    }
    state.timer.pomodoroCount += 1;
    state.timer.completedWorkSessions += 1;
    devLog("workSessionComplete", state.timer.completedWorkSessions);
    recordTodayPomodoro();
    renderTasks();
    updateStats();
    updateSummary();
    fireNotifications(task?.title || "ポモドーロ");
  }

  function transitionToNextMode(autoStart = false) {
    if (state.timer.mode === "work") {
      state.timer.mode = shouldTakeLongBreak() ? "longBreak" : "shortBreak";
    } else {
      state.timer.mode = "work";
    }
    state.timer.remainingTime = getModeDuration(state.timer.mode);
    state.timer.currentTaskId = state.timer.mode === "work" ? state.selectedTaskId : null;
    devLog("transitionToMode", state.timer.mode);
    updateTimerDisplay();
    updateTimerMeta();
    persistTimer();
    if (autoStart) {
      startTimer();
    }
  }

  function shouldTakeLongBreak() {
    if (!state.settings.longBreakInterval) return false;
    return state.timer.completedWorkSessions % state.settings.longBreakInterval === 0;
  }

  function getModeDuration(mode) {
    switch (mode) {
      case "shortBreak":
        return clamp(state.settings.shortBreakDuration, 1, 30) * 60;
      case "longBreak":
        return clamp(state.settings.longBreakDuration, 5, 60) * 60;
      case "work":
        return clamp(state.settings.workDuration, 1, 60) * 60;
      default:
        return clamp(state.settings.workDuration, 1, 60) * 60;
    }
  }

  function updateTimerDisplay() {
    elements.timerDisplay.textContent = formatTime(state.timer.remainingTime);
    const duration = getModeDuration(state.timer.mode === "idle" ? "work" : state.timer.mode);
    const progress = 100 - Math.min(100, (state.timer.remainingTime / duration) * 100);
    elements.timerProgress.style.width = `${progress}%`;
    elements.timerModeLabel.textContent = modeLabel(state.timer.mode);
  }

  function updateTimerMeta() {
    elements.timerState.textContent = state.timer.isRunning
      ? "実行中"
      : state.timer.isPaused
        ? "一時停止"
        : "停止中";
    elements.timerMode.textContent = modeLabel(state.timer.mode);
    elements.timerPomodoros.textContent = String(state.timer.pomodoroCount);
    elements.timerPanel?.classList.toggle("running", state.timer.isRunning);
  }

  function modeLabel(mode) {
    if (mode === "work") return "作業中";
    if (mode === "shortBreak") return "短い休憩";
    if (mode === "longBreak") return "長い休憩";
    return "待機中";
  }

  function restoreTimerState() {
    if (!state.timer.isRunning || !state.timer.targetTimestamp) {
      if (!Number.isFinite(state.timer.remainingTime) || state.timer.remainingTime <= 0) {
        state.timer.remainingTime = getModeDuration(state.timer.mode === "idle" ? "work" : state.timer.mode);
      }
      return;
    }
    const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
    state.timer.remainingTime = remaining;
    if (remaining <= 0) {
      completeCycle();
    } else {
      startTicking();
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      updateRemainingTime();
    }
  }

  function recordTodayPomodoro() {
    state.today.pomodoros += 1;
    state.today.totalMinutes += state.settings.workDuration;
    recomputeTodayTasks();
    persistToday();
    persistHistoryEntry();
  }

  function recomputeTodayTasks() {
    const todayKey = getTodayKey();
    const completedToday = state.tasks.filter((task) => task.completedAt && task.completedAt.startsWith(todayKey)).length;
    state.today.completedTasks = completedToday;
    persistToday();
  }

  function persistHistoryEntry() {
    const todayKey = getTodayKey();
    const entry = { date: todayKey, ...state.today };
    const index = state.history.findIndex((item) => item.date === todayKey);
    if (index >= 0) {
      state.history[index] = entry;
    } else {
      state.history.push(entry);
    }
    state.history = state.history.slice(-30);
    persistHistory();
  }

  function checkDayRollover() {
    const todayKey = getTodayKey();
    if (state.today.date === todayKey) return;
    state.history.push({ ...state.today });
    state.history = state.history.slice(-30);
    state.today = createTodaySummary(todayKey);
    state.timer.pomodoroCount = 0;
    state.timer.completedWorkSessions = 0;
    persistToday();
    persistHistory();
    updateStats();
    updateSummary();
  }

  function updateStats() {
    elements.statsTasks.textContent = String(state.today.completedTasks || 0);
    elements.statsPomodoros.textContent = String(state.today.pomodoros || 0);
    elements.statsTime.textContent = `${state.today.totalMinutes}分`;
    const cycleMod = state.settings.longBreakInterval
      ? state.timer.completedWorkSessions % state.settings.longBreakInterval
      : 0;
    const remaining = cycleMod === 0 ? 0 : state.settings.longBreakInterval - cycleMod;
    elements.statsUntilLong.textContent = state.timer.mode.includes("Break")
      ? "0"
      : String(remaining);
    elements.statsUpdated.textContent = `更新: ${new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;
  }

  function updateSummary() {
    elements.summaryPomodoros.textContent = `🍅 ${state.today.pomodoros}`;
    elements.summaryTasks.textContent = String(state.today.completedTasks || 0);
    const hours = Math.floor((state.today.totalMinutes || 0) / 60);
    const minutes = (state.today.totalMinutes || 0) % 60;
    elements.summaryTime.textContent = `${hours}h ${minutes}m`;
  }

  // ---------- Settings & focus mode ----------
  function openSettings() {
    populateSettingsForm();
    elements.settingsModal?.classList.add("is-open");
    elements.settingsModal?.setAttribute("aria-hidden", "false");
  }

  function closeSettings() {
    elements.settingsModal?.classList.remove("is-open");
    elements.settingsModal?.setAttribute("aria-hidden", "true");
  }

  function populateSettingsForm() {
    if (!elements.settingsForm) return;
    elements.settingsForm.workDuration.value = state.settings.workDuration;
    elements.settingsForm.shortBreakDuration.value = state.settings.shortBreakDuration;
    elements.settingsForm.longBreakDuration.value = state.settings.longBreakDuration;
    elements.settingsForm.longBreakInterval.value = state.settings.longBreakInterval;
    elements.settingsForm.notificationSound.value = state.settings.notificationSound;
    elements.settingsForm.focusMode.checked = state.settings.focusMode;
  }

  function syncSettingsForm() {
    populateSettingsForm();
  }

  function handleSettingsSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const nextSettings = {
      workDuration: clamp(Number(formData.get("workDuration")), 1, 60),
      shortBreakDuration: clamp(Number(formData.get("shortBreakDuration")), 1, 30),
      longBreakDuration: clamp(Number(formData.get("longBreakDuration")), 5, 60),
      longBreakInterval: clamp(Number(formData.get("longBreakInterval")), 1, 10),
      notificationSound: formData.get("notificationSound") || "beep",
      focusMode: formData.get("focusMode") === "on",
      filterState: state.filter
    };
    state.settings = nextSettings;
    state.timer.remainingTime = getModeDuration(state.timer.mode === "idle" ? "work" : state.timer.mode);
    persistSettings();
    updateTimerDisplay();
    syncFocusOverlay();
    closeSettings();
    showToast("設定を保存しました", "success");
  }

  function resetSettingsToDefault() {
    state.settings = { ...DEFAULT_SETTINGS };
    state.filter = state.settings.filterState;
    persistSettings();
    syncSettingsForm();
    updateFilterUI();
    updateTimerDisplay();
    showToast("設定を初期化しました", "info");
  }

  function toggleFocusModeFromButton() {
    state.settings.focusMode = !state.settings.focusMode;
    persistSettings();
    syncFocusOverlay();
  }

  function exitFocusMode() {
    state.settings.focusMode = false;
    persistSettings();
    syncFocusOverlay();
  }

  function syncFocusOverlay() {
    if (!elements.focusOverlay) return;
    if (state.settings.focusMode) {
      elements.focusOverlay.classList.add("is-active");
    } else {
      elements.focusOverlay.classList.remove("is-active");
    }
  }

  // ---------- Notifications ----------
  function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  function fireNotifications(taskTitle) {
    showToast(`${taskTitle} が完了しました`, "success");
    if (state.settings.focusMode) {
      return;
    }
    playSound();
    showVisualNotification();
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("ポモドーロ完了", { body: `${taskTitle} のポモドーロが完了しました` });
    }
  }

  function playSound() {
    const sound = state.settings.notificationSound;
    if (sound === "silent") return;
    if (!audioCache) {
      audioCache = new AudioContext();
    }
    const ctx = audioCache;
    const duration = 0.25;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = sound === "chime" ? "sine" : "triangle";
    oscillator.frequency.value = sound === "bell" ? 600 : sound === "chime" ? 420 : 820;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  function showVisualNotification() {
    if (!elements.timerPanel) return;
    elements.timerPanel.classList.add("pulse");
    setTimeout(() => elements.timerPanel?.classList.remove("pulse"), 1000);
  }

  // ---------- Utilities ----------
  function sanitize(value) {
    const str = typeof value === "string" ? value : "";
    return str.replace(/[<>"'`]/g, "");
  }

  function normalizeTask(task) {
    return {
      id: task.id || `task_${Date.now()}`,
      title: typeof task.title === "string" ? task.title : "無題",
      completed: Boolean(task.completed),
      estimatedPomodoros: sanitizeNumber(task.estimatedPomodoros, null),
      actualPomodoros: sanitizeNumber(task.actualPomodoros, 0),
      createdAt: task.createdAt || new Date().toISOString(),
      completedAt: task.completedAt || null
    };
  }

  function sanitizeTimer(timer) {
    const mode = ["work", "shortBreak", "longBreak", "idle"].includes(timer.mode) ? timer.mode : "idle";
    return {
      mode,
      remainingTime: sanitizeNumber(timer.remainingTime, getModeDuration(mode === "idle" ? "work" : mode)),
      isRunning: Boolean(timer.isRunning),
      isPaused: Boolean(timer.isPaused),
      currentTaskId: timer.currentTaskId || null,
      startedAt: timer.startedAt || null,
      targetTimestamp: timer.targetTimestamp || null,
      pomodoroCount: sanitizeNumber(timer.pomodoroCount, 0),
      completedWorkSessions: sanitizeNumber(timer.completedWorkSessions, 0)
    };
  }

  function sanitizeNumber(value, fallback) {
    const num = Number.parseInt(value, 10);
    return Number.isFinite(num) ? num : fallback;
  }

  function clamp(value, min, max) {
    const num = Number(value);
    if (!Number.isFinite(num)) return min;
    return Math.min(Math.max(num, min), max);
  }

  function createTodaySummary(date) {
    return {
      date,
      pomodoros: 0,
      completedTasks: 0,
      totalMinutes: 0
    };
  }

  function getTodayKey() {
    return new Date().toISOString().split("T")[0];
  }

  function showToast(message, variant = "info") {
    if (!elements.toast || !message) return;
    elements.toast.textContent = message;
    elements.toast.dataset.variant = variant;
    elements.toast.classList.add("is-visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      elements.toast?.classList.remove("is-visible");
    }, 2800);
  }

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function ce(tag, props = {}) {
    const el = document.createElement(tag);
    Object.assign(el, props);
    return el;
  }

  function formatTime(totalSeconds) {
    const safe = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
    const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
    const seconds = String(Math.floor(safe % 60)).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }
})();
