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
    E003: "作業モードではタスク選択が必須です",
    E004: "タイマー稼働中は削除できません",
    E005: "保存容量が不足しています",
    E006: "保存に失敗しました",
    E007: "タイマーをリセットしますか？",
    E008: "編集中のタスクを先に完了してください"
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
    mode: "work",
    duration: DEFAULT_SETTINGS.workDuration * 60,
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
    selectedTaskId: null,
    filter: DEFAULT_SETTINGS.filterState,
    settings: { ...DEFAULT_SETTINGS },
    timer: { ...DEFAULT_TIMER },
    today: createTodaySummary(getTodayKey()),
    history: [],
    editingTaskId: null
  };

  const elements = {};
  let timerInterval = null;
  let audioContext = null;
  let pendingConfirmAction = null;

  init();

  /* -------------------- Initialisation -------------------- */

  function init() {
    cacheElements();
    bindEvents();
    loadState();
    renderTasks();
    updateFilterUI();
    updateSelectedTaskLabel();
    restoreTimerState();
    updateTimerUI();
    updateStatsDisplay();
    updateTodaySummaryDisplay();
    checkDayRollover();
    window.setInterval(checkDayRollover, 60 * 1000);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  function cacheElements() {
    elements.taskForm = document.querySelector("[data-task-form]");
    elements.taskTitle = document.getElementById("taskTitle");
    elements.taskEstimate = document.getElementById("taskEstimate");
    elements.alert = document.querySelector("[data-element='alert']");
    elements.taskList = document.querySelector("[data-element='taskList']");
    elements.filterButtons = document.querySelectorAll(".chip[data-filter]");
    elements.selectedTaskLabel = document.querySelector("[data-text='selectedTaskLabel']");
    elements.timer = document.querySelector("[data-element='timer']");
    elements.modeBadge = document.querySelector("[data-text='modeLabel']");
    elements.timerDisplay = document.querySelector("[data-text='timeDisplay']");
    elements.progressBar = document.querySelector("[data-element='progress']");
    elements.timerControls = document.querySelector(".timer-controls");
    elements.timerPomodoros = document.querySelector("[data-text='timerPomodoros']");
    elements.timerMode = document.querySelector("[data-text='timerMode']");
    elements.timerState = document.querySelector("[data-text='timerState']");
    elements.statsTasks = document.querySelector("[data-text='statsTasks']");
    elements.statsPomodoros = document.querySelector("[data-text='statsPomodoros']");
    elements.statsTime = document.querySelector("[data-text='statsTime']");
    elements.statsStreak = document.querySelector("[data-text='statsStreak']");
    elements.todayPomodoros = document.querySelector("[data-text='todayPomodoros']");
    elements.todayTasks = document.querySelector("[data-text='todayTasks']");
    elements.todayTime = document.querySelector("[data-text='todayTime']");
    elements.visualNotification = document.querySelector("[data-element='visualNotification']");
    elements.confirmDialog = document.querySelector("[data-element='confirmDialog']");
    elements.confirmMessage = document.querySelector("[data-text='confirmMessage']");
  }

  function bindEvents() {
    elements.taskForm.addEventListener("submit", handleSubmitTask);
    elements.filterButtons.forEach((button) =>
      button.addEventListener("click", () => setFilter(button.dataset.filter))
    );
    elements.taskList.addEventListener("change", handleTaskListChange);
    elements.taskList.addEventListener("click", handleTaskListClick);
    elements.taskList.addEventListener("keydown", handleTaskListKeydown);
    elements.timerControls.addEventListener("click", handleTimerControlClick);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", persistAll);
    elements.confirmDialog.querySelector("[data-action='cancelConfirm']").addEventListener("click", () => {
      pendingConfirmAction = null;
      elements.confirmDialog.close();
    });
    elements.confirmDialog.querySelector("[data-action='acceptConfirm']").addEventListener("click", () => {
      const action = pendingConfirmAction;
      pendingConfirmAction = null;
      elements.confirmDialog.close();
      if (typeof action === "function") action();
    });
  }

  /* -------------------- Task Management -------------------- */

  function handleSubmitTask(event) {
    event.preventDefault();
    if (state.editingTaskId) {
      showAlert("E008");
      return;
    }

    const title = elements.taskTitle.value.trim();
    const estimateValue = elements.taskEstimate.value.trim();

    if (!title) return showAlert("E001");
    if (title.length > 100) return showAlert("E002");

    let estimate = null;
    if (estimateValue) {
      const parsed = Number.parseInt(estimateValue, 10);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 20) {
        showAlert(null, "見積は1〜20の範囲で入力してください");
        return;
      }
      estimate = parsed;
    }

    const task = {
      id: `task_${Date.now()}`,
      title,
      completed: false,
      estimatedPomodoros: estimate,
      actualPomodoros: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    state.tasks = [task, ...state.tasks];
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
    const actionBtn = event.target.closest("[data-action]");
    if (actionBtn) {
      const taskId = actionBtn.closest("[data-task-id]").dataset.taskId;
      if (actionBtn.dataset.action === "edit") {
        requestEditTask(taskId);
      } else if (actionBtn.dataset.action === "delete") {
        requestDeleteTask(taskId);
      }
      return;
    }

    const selectTarget = event.target.closest("[data-role='select-task']");
    if (selectTarget) {
      const taskId = selectTarget.closest("[data-task-id]").dataset.taskId;
      selectTask(taskId);
    }
  }

  function handleTaskListKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const selectTarget = event.target.closest("[data-role='select-task']");
    if (!selectTarget) return;
    event.preventDefault();
    const taskId = selectTarget.closest("[data-task-id]").dataset.taskId;
    selectTask(taskId);
  }

  function toggleTaskCompletion(taskId, completed) {
    if (state.timer.isRunning && state.timer.currentTaskId === taskId) {
      showAlert(null, "タイマー中のタスクは操作できません");
      renderTasks();
      return;
    }

    const task = state.tasks.find((item) => item.id === taskId);
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
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    state.editingTaskId = taskId;
    const nextTitle = window.prompt("タスク名を編集", task.title);
    if (nextTitle === null) {
      state.editingTaskId = null;
      return;
    }
    const trimmed = nextTitle.trim();
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
    state.editingTaskId = null;
    persistTasks();
    renderTasks();
  }

  function requestDeleteTask(taskId) {
    if (state.timer.isRunning) {
      showAlert("E004");
      return;
    }
    const taskIndex = state.tasks.findIndex((item) => item.id === taskId);
    if (taskIndex === -1) return;
    openConfirmDialog("このタスクを削除しますか？", () => {
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
    });
  }

  function selectTask(taskId) {
    if (!state.tasks.some((task) => task.id === taskId)) return;
    if (state.timer.isRunning) {
      showAlert(null, "タイマーを停止してから選択してください");
      return;
    }
    state.selectedTaskId = taskId;
    state.timer.currentTaskId = taskId;
    persistTimer();
    updateSelectedTaskLabel();
    renderTasks();
  }

  function setFilter(filter) {
    state.filter = filter;
    state.settings.filterState = filter;
    updateFilterUI();
    renderTasks();
    persistSettings();
  }

  function renderTasks(withAnimation = false) {
    const container = elements.taskList;
    container.replaceChildren();

    const filtered = state.tasks.filter((task) => {
      if (state.filter === "active") return !task.completed;
      if (state.filter === "completed") return task.completed;
      return true;
    });

    const fragment = document.createDocumentFragment();
    filtered.forEach((task) => {
      fragment.appendChild(buildTaskItem(task, withAnimation));
    });
    container.append(fragment);
  }

  function buildTaskItem(task, withAnimation) {
    const item = document.createElement("li");
    item.className = "task-item";
    if (task.completed) item.classList.add("completed");
    if (task.id === state.selectedTaskId) item.classList.add("selected");
    if (withAnimation) item.classList.add("entering");
    item.dataset.taskId = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.dataset.role = "toggle";
    checkbox.setAttribute("aria-label", "完了切り替え");

    const content = document.createElement("div");
    content.className = "task-content";
    content.dataset.role = "select-task";
    content.setAttribute("role", "button");
    content.tabIndex = 0;
    content.setAttribute("aria-pressed", task.id === state.selectedTaskId ? "true" : "false");

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const badge = document.createElement("span");
    badge.className = "task-meta__badge";
    badge.dataset.status = derivePomodoroStatus(task);
    const estimateText =
      typeof task.estimatedPomodoros === "number"
        ? `${task.actualPomodoros}/${task.estimatedPomodoros}`
        : `${task.actualPomodoros}`;
    badge.textContent = `🍅 ${estimateText}`;

    const created = document.createElement("span");
    created.textContent = formatRelativeTime(task.createdAt);

    meta.append(badge, created);
    content.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "task-action";
    edit.dataset.action = "edit";
    edit.textContent = "編集";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "task-action";
    del.dataset.action = "delete";
    del.textContent = "削除";

    actions.append(edit, del);
    item.append(checkbox, content, actions);
    return item;
  }

  function derivePomodoroStatus(task) {
    if (typeof task.estimatedPomodoros !== "number") return "open";
    if (task.actualPomodoros === task.estimatedPomodoros) return "achieved";
    if (task.actualPomodoros > task.estimatedPomodoros) return "over";
    return "open";
  }

  function updateFilterUI() {
    elements.filterButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.filter === state.filter);
    });
  }

  function updateSelectedTaskLabel() {
    if (!state.selectedTaskId) {
      elements.selectedTaskLabel.textContent = "タスクを選択してください";
      return;
    }
    const task = state.tasks.find((item) => item.id === state.selectedTaskId);
    elements.selectedTaskLabel.textContent = task ? `選択中: ${task.title}` : "タスクを選択してください";
  }

  /* -------------------- Timer -------------------- */

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
        requestResetTimer();
        break;
      case "skip":
        skipTimerPhase();
        break;
      default:
        break;
    }
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
    }

    state.timer.isRunning = true;
    state.timer.isPaused = false;
    const now = Date.now();
    state.timer.startedAt = now;
    state.timer.targetTimestamp = now + state.timer.remainingTime * 1000;
    persistTimer();
    startTicking();
    elements.timer.classList.add("running");
    updateTimerStateLabel();
  }

  function pauseTimer() {
    if (!state.timer.isRunning) return;
    state.timer.isRunning = false;
    state.timer.isPaused = true;
    clearInterval(timerInterval);
    timerInterval = null;
    const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
    state.timer.remainingTime = remaining;
    state.timer.targetTimestamp = null;
    persistTimer();
    elements.timer.classList.remove("running");
    updateTimerUI();
  }

  function requestResetTimer() {
    openConfirmDialog(ERROR_MESSAGES.E007, () => resetTimer());
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.targetTimestamp = null;
    state.timer.remainingTime = getModeDuration(state.timer.mode);
    state.timer.duration = state.timer.remainingTime;
    state.timer.startedAt = null;
    persistTimer();
    elements.timer.classList.remove("running");
    updateTimerUI();
  }

  function skipTimerPhase() {
    clearInterval(timerInterval);
    timerInterval = null;
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.targetTimestamp = null;
    handlePhaseCompletion({ skip: true });
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
      state.timer.remainingTime = 0;
      handlePhaseCompletion({ skip: false });
    }
  }

  function handlePhaseCompletion({ skip }) {
    clearInterval(timerInterval);
    timerInterval = null;
    elements.timer.classList.remove("running");
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.targetTimestamp = null;
    updateTimerStateLabel();
    updateTimerDisplay();

    if (!skip) {
      triggerVisualNotification();
      playNotificationSound();
      dispatchBrowserNotification();
    }

    if (state.timer.mode === "work" && !skip) {
      registerPomodoroCompletion();
    }

    advanceTimerMode();
    persistTimer();
    updateTimerUI();
  }

  function registerPomodoroCompletion() {
    const task = state.tasks.find((item) => item.id === state.timer.currentTaskId);
    if (task) {
      task.actualPomodoros += 1;
      persistTasks();
      renderTasks();
    }
    state.timer.pomodoroCount += 1;
    state.today.pomodoros += 1;
    state.today.totalMinutes += state.settings.workDuration;
    const previousTaskId = state.today.lastTaskId;
    if (task) {
      state.today.lastTaskId = task.id;
    }
    state.today.currentStreak =
      previousTaskId && task && previousTaskId === task.id ? (state.today.currentStreak || 0) + 1 : 1;
    recomputeTodayCompletedTasks();
    persistToday();
    updateStatsDisplay();
    updateTodaySummaryDisplay();
  }

  function advanceTimerMode() {
    if (state.timer.mode === "work") {
      const interval = clamp(state.settings.longBreakInterval, 2, 8);
      const takeLongBreak = state.timer.pomodoroCount > 0 && state.timer.pomodoroCount % interval === 0;
      if (takeLongBreak) {
        setTimerMode("longBreak");
      } else {
        setTimerMode("shortBreak");
      }
    } else {
      setTimerMode("work");
    }
  }

  function setTimerMode(mode) {
    state.timer.mode = mode;
    state.timer.remainingTime = getModeDuration(mode);
    state.timer.duration = state.timer.remainingTime;
    state.timer.currentTaskId = mode === "work" ? state.selectedTaskId : state.timer.currentTaskId;
  }

  function updateTimerUI() {
    updateTimerDisplay();
    updateTimerStateLabel();
    elements.timerPomodoros.textContent = String(state.today.pomodoros);
    elements.timerMode.textContent = modeLabel(state.timer.mode);
    elements.modeBadge.textContent = `${modeLabel(state.timer.mode)}モード`;
  }

  function updateTimerDisplay() {
    elements.timerDisplay.textContent = formatTime(state.timer.remainingTime);
    const duration = getModeDuration(state.timer.mode) || 1;
    const progress = Math.min(100, Math.max(0, ((duration - state.timer.remainingTime) / duration) * 100));
    elements.progressBar.style.width = `${progress}%`;
    const progressElem = elements.timer.querySelector(".timer__progress");
    progressElem.setAttribute("aria-valuenow", String(Math.floor(progress)));
  }

  function updateTimerStateLabel() {
    if (state.timer.isRunning) {
      elements.timerState.textContent = "実行中";
    } else if (state.timer.isPaused) {
      elements.timerState.textContent = "一時停止";
    } else {
      elements.timerState.textContent = "停止中";
    }
  }

  function modeLabel(mode) {
    if (mode === "shortBreak") return "休憩";
    if (mode === "longBreak") return "長い休憩";
    return "作業";
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== "visible" && state.timer.isRunning) {
      persistTimer();
    }
  }

  function restoreTimerState() {
    if (!state.timer.isRunning || !state.timer.targetTimestamp) {
      state.timer.remainingTime = sanitizeNumber(state.timer.remainingTime, getModeDuration(state.timer.mode));
      updateTimerUI();
      return;
    }
    const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
    state.timer.remainingTime = remaining;
    if (remaining <= 0) {
      handlePhaseCompletion({ skip: false });
    } else {
      startTicking();
    }
  }

  /* -------------------- Stats & Alerts -------------------- */

  function updateStatsDisplay() {
    const todayKey = getTodayKey();
    const completedToday = state.tasks.filter(
      (task) => task.completedAt && task.completedAt.startsWith(todayKey)
    ).length;
    elements.statsTasks.textContent = String(completedToday);
    elements.statsPomodoros.textContent = String(state.today.pomodoros);
    elements.statsTime.textContent = `${state.today.totalMinutes}分`;
    elements.statsStreak.textContent = String(state.today.currentStreak || 0);
  }

  function updateTodaySummaryDisplay() {
    elements.todayPomodoros.textContent = `🍅 ${state.today.pomodoros}`;
    elements.todayTasks.textContent = String(state.today.completedTasks || 0);
    const hours = Math.floor(state.today.totalMinutes / 60);
    const minutes = state.today.totalMinutes % 60;
    elements.todayTime.textContent = `${hours}h ${minutes}m`;
  }

  function showAlert(code, overrideMessage) {
    const message = overrideMessage !== undefined ? overrideMessage : ERROR_MESSAGES[code] || "";
    if (!elements.alert) return;
    elements.alert.textContent = message;
    elements.alert.classList.toggle("is-visible", Boolean(message));
  }

  function openConfirmDialog(message, onConfirm) {
    elements.confirmMessage.textContent = message;
    pendingConfirmAction = onConfirm;
    elements.confirmDialog.showModal();
  }

  function triggerVisualNotification() {
    elements.visualNotification.classList.remove("is-active");
    void elements.visualNotification.offsetWidth;
    elements.visualNotification.classList.add("is-active");
    window.setTimeout(() => {
      elements.visualNotification.classList.remove("is-active");
    }, 1500);
  }

  function playNotificationSound() {
    if (state.settings.notificationSound === "silent") return;
    try {
      if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
      }
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (error) {
      console.warn("Audio playback failed", error);
    }
  }

  function dispatchBrowserNotification() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const title = state.timer.mode === "work" ? "作業完了！" : "休憩完了！";
    const body = state.timer.mode === "work" ? "休憩に入ります" : "次のタスクを始めましょう";
    try {
      new Notification(title, { body, icon: "🍅", silent: true });
    } catch (error) {
      console.warn("Notification failed", error);
    }
  }

  /* -------------------- Persistence -------------------- */

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

    const storedHistory = safeParse(STORAGE_KEYS.HISTORY, []);
    state.history = Array.isArray(storedHistory) ? storedHistory : [];

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
    safeStore(STORAGE_KEYS.TASKS, state.tasks);
  }

  function persistSettings() {
    safeStore(STORAGE_KEYS.SETTINGS, state.settings);
  }

  function persistTimer() {
    safeStore(STORAGE_KEYS.TIMER, state.timer);
  }

  function persistToday() {
    safeStore(STORAGE_KEYS.TODAY, state.today);
  }

  function persistHistory() {
    safeStore(STORAGE_KEYS.HISTORY, state.history.slice(-30));
  }

  function safeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error && error.name === "QuotaExceededError") {
        showAlert("E005");
      } else {
        showAlert("E006");
      }
    }
  }

  function safeParse(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      showAlert("E006");
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
    const mode = ["work", "shortBreak", "longBreak"].includes(timer.mode) ? timer.mode : "work";
    const remaining = sanitizeNumber(timer.remainingTime, getModeDuration(mode));
    const duration = sanitizeNumber(timer.duration, getModeDuration(mode));
    return {
      mode,
      remainingTime: remaining,
      duration,
      isRunning: Boolean(timer.isRunning),
      isPaused: Boolean(timer.isPaused),
      currentTaskId: timer.currentTaskId || null,
      startedAt: timer.startedAt || null,
      targetTimestamp: timer.targetTimestamp || null,
      pomodoroCount: sanitizeNumber(timer.pomodoroCount, 0)
    };
  }

  /* -------------------- Utils & Day rollover -------------------- */

  function sanitizeNumber(value, fallback) {
    const num = Number.parseInt(value, 10);
    return Number.isFinite(num) ? num : fallback;
  }

  function getModeDuration(mode) {
    if (mode === "shortBreak") return clamp(state.settings.shortBreakDuration, 1, 15) * 60;
    if (mode === "longBreak") return clamp(state.settings.longBreakDuration, 5, 30) * 60;
    return clamp(state.settings.workDuration, 10, 60) * 60;
  }

  function clamp(value, min, max) {
    const num = Number(value);
    if (!Number.isFinite(num)) return min;
    return Math.min(Math.max(num, min), max);
  }

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Number.parseInt(totalSeconds, 10) || 0);
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${secs}`;
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
    state.today.completedTasks = state.tasks.filter(
      (task) => task.completedAt && task.completedAt.startsWith(todayKey)
    ).length;
  }

  function checkDayRollover() {
    const todayKey = getTodayKey();
    if (state.today.date === todayKey) return;
    state.history.push({ ...state.today });
    state.history = state.history.slice(-30);
    state.today = createTodaySummary(todayKey);
    state.timer.pomodoroCount = 0;
    persistHistory();
    persistToday();
    updateTodaySummaryDisplay();
    updateStatsDisplay();
  }
})();
