(() => {
  "use strict";

  const CONFIG = Object.freeze({
    storageKeys: Object.freeze({
      tasks: "pomotodo_tasks",
      timer: "pomotodo_timer",
      settings: "pomotodo_settings",
      today: "pomotodo_today",
      history: "pomotodo_history",
      selection: "pomotodo_selection"
    }),
    limits: Object.freeze({
      titleMax: 100,
      estimate: Object.freeze({ min: 1, max: 20 }),
      durations: Object.freeze({
        work: Object.freeze({ min: 1, max: 60 }),
        shortBreak: Object.freeze({ min: 1, max: 30 }),
        longBreak: Object.freeze({ min: 5, max: 60 })
      })
    }),
    defaults: Object.freeze({
      settings: Object.freeze({
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        notificationSound: "beep",
        focusMode: false,
        filterState: "all"
      })
    }),
    historyLimit: 30
  });
  const ERRORS = {
    E001: "E001: タスク名を入力してください",
    E002: `E002: タスク名は${CONFIG.limits.titleMax}文字以内で入力してください`,
    E003: "E003: タスクを選択してください",
    E004: "E004: タイマーを停止してから削除してください",
    E005: "E005: 保存容量が不足しています",
    E006: "E006: 保存できませんでした",
    E007: "E007: タイマーをリセットしますか？",
    E008: "E008: 編集を完了してください",
    E009: `E009: 見積もりは${CONFIG.limits.estimate.min}〜${CONFIG.limits.estimate.max}の範囲で入力してください`,
    E010: "E010: タイマーを停止してから選択してください",
    E011: "E011: 集中モード中は操作できません"
  };
  const QA_MATRIX = Object.freeze([
    Object.freeze({ area: "Todo", scenario: "タスク追加/編集/削除", expectation: "100ms以内にDOMへ反映" }),
    Object.freeze({ area: "Timer", scenario: "開始→完了", expectation: "25分後に通知・休憩へ遷移" }),
    Object.freeze({ area: "Persistence", scenario: "リロード後の状態復元", expectation: "タスク・タイマー・設定が保持される" }),
    Object.freeze({ area: "Accessibility", scenario: "キーボード操作", expectation: "Tab/Space/Enterで全操作可能" })
  ]);
  const AUDIO_PROFILES = Object.freeze({
    beep: Object.freeze([
      Object.freeze({ frequency: 880, duration: 0.18, gain: 0.35, type: "sine" }),
      Object.freeze({ gap: 0.12 }),
      Object.freeze({ frequency: 880, duration: 0.18, gain: 0.35, type: "sine" }),
      Object.freeze({ gap: 0.12 }),
      Object.freeze({ frequency: 880, duration: 0.18, gain: 0.35, type: "sine" })
    ]),
    bell: Object.freeze([
      Object.freeze({ frequency: 660, duration: 0.45, gain: 0.4, type: "triangle", decay: 0.8 }),
      Object.freeze({ gap: 0.1 }),
      Object.freeze({ frequency: 880, duration: 0.3, gain: 0.25, type: "sine", decay: 0.7 })
    ]),
    chime: Object.freeze([
      Object.freeze({ frequency: 523.25, duration: 0.22, gain: 0.28, type: "sine" }),
      Object.freeze({ gap: 0.06 }),
      Object.freeze({ frequency: 659.25, duration: 0.22, gain: 0.28, type: "sine" }),
      Object.freeze({ gap: 0.06 }),
      Object.freeze({ frequency: 783.99, duration: 0.24, gain: 0.28, type: "sine" })
    ])
  });
  const AUDIO_FALLBACK_SRC = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
  const DEFAULT_SETTINGS = { ...CONFIG.defaults.settings };
  const state = {
    tasks: [],
    history: [],
    timer: createTimerState(),
    settings: { ...DEFAULT_SETTINGS },
    selectedTaskId: null,
    today: createToday(),
    ui: { searchTerm: "", editingTaskId: null, focusLocked: false, lastCreatedTaskId: null }
  };
  const dom = {};
  const bus = createEventBus();
  let timerId = null;
  let audioContext = null;
  let fallbackAudio = null;
  document.addEventListener("DOMContentLoaded", init);
  function init() {
    cacheDom();
    registerObservers();
    loadState();
    attachEvents();
    bus.emit("tasks:updated", state.tasks);
    bus.emit("timer:updated", state.timer);
    bus.emit("settings:updated", state.settings);
    bus.emit("history:updated", state.history);
    applyFocusState();
    requestNotificationPermission();
  }

  function cacheDom() {
    Object.assign(dom, {
      taskForm: document.getElementById("task-form"),
      taskFormError: document.getElementById("task-form-error"),
      taskTitle: document.getElementById("task-title"),
      taskEstimate: document.getElementById("task-estimate"),
      taskSearch: document.getElementById("task-search"),
      sortCreatedBtn: document.getElementById("sort-created-btn"),
      sortEstimateBtn: document.getElementById("sort-estimate-btn"),
      bulkDeleteBtn: document.getElementById("bulk-delete-btn"),
      taskList: document.getElementById("task-list"),
      taskEmptyState: document.getElementById("task-empty-state"),
      filterButtons: Array.from(document.querySelectorAll(".filter-btn")),
      notification: document.getElementById("notification"),
      timerMode: document.getElementById("timer-mode"),
      timerDisplay: document.getElementById("timer-display"),
      progressBar: document.getElementById("progress-bar"),
      currentTask: document.getElementById("current-task"),
      startBtn: document.getElementById("start-btn"),
      pauseBtn: document.getElementById("pause-btn"),
      resetBtn: document.getElementById("reset-btn"),
      skipBtn: document.getElementById("skip-btn"),
      weeklyChart: document.getElementById("weekly-chart"),
      statTodayPomodoros: document.getElementById("stat-today-pomodoros"),
      statTodayTasks: document.getElementById("stat-today-tasks"),
      statTodayTime: document.getElementById("stat-today-time"),
      statListPomodoros: document.getElementById("stat-list-pomodoros"),
      statListTasks: document.getElementById("stat-list-tasks"),
      statListTime: document.getElementById("stat-list-time"),
      statStreak: document.getElementById("stat-streak"),
      confirmDialog: document.getElementById("confirm-dialog"),
      confirmMessage: document.getElementById("confirm-message"),
      toggleFocusBtn: document.getElementById("toggle-focus-btn"),
      openSettingsBtn: document.getElementById("open-settings-btn"),
      exportBtn: document.getElementById("export-btn"),
      importInput: document.getElementById("import-input"),
      settingsDialog: document.getElementById("settings-dialog"),
      settingsForm: document.getElementById("settings-form"),
      settingsWorkDuration: document.getElementById("settings-work-duration"),
      settingsShortBreak: document.getElementById("settings-short-break"),
      settingsLongBreak: document.getElementById("settings-long-break"),
      settingsLongInterval: document.getElementById("settings-long-interval"),
      settingsSound: document.getElementById("settings-sound"),
      settingsFocusMode: document.getElementById("settings-focus-mode"),
      settingsFilterDefault: document.getElementById("settings-filter-default"),
      settingsResetBtn: document.getElementById("settings-reset-btn"),
      settingsSaveBtn: document.getElementById("settings-save-btn"),
      focusOverlay: document.getElementById("focus-overlay"),
    });
  }

  function registerObservers() {
    bus.on("tasks:updated", () => {
      renderTasks();
      updateStatistics();
    });
    bus.on("timer:updated", () => {
      updateTimerDisplay();
      applyFocusState();
    });
    bus.on("settings:updated", () => {
      updateFilterButtons();
      renderTasks();
      updateStatistics();
      applyFocusState();
    });
    bus.on("history:updated", () => {
      if (typeof renderWeeklyChart === "function") renderWeeklyChart();
    });
  }
  function loadState() {
    state.tasks = load(CONFIG.storageKeys.tasks, []).map(normalizeTask).filter(Boolean);
    state.settings = normalizeSettings({ ...DEFAULT_SETTINGS, ...load(CONFIG.storageKeys.settings, {}) });
    state.history = load(CONFIG.storageKeys.history, []).map(normalizeHistoryEntry).filter(Boolean);
    if (state.history.length > CONFIG.historyLimit) {
      state.history = state.history.slice(-CONFIG.historyLimit);
      persistHistory();
    }
    const storedSelection = load(CONFIG.storageKeys.selection, null);
    const timer = load(CONFIG.storageKeys.timer, null);
    state.timer = timer ? normalizeTimer(timer) : createTimerState();
    if (state.timer.isRunning) resumeFromPersisted(); else syncDuration(state.timer.mode || "work");
    const today = load(CONFIG.storageKeys.today, null);
    state.today = normalizeToday(today) ?? createToday();
    if (state.today.date !== formatDateKey(new Date())) ensureToday(); else persistToday();
    if (storedSelection && state.tasks.some((t) => t.id === storedSelection)) state.selectedTaskId = storedSelection; else state.selectedTaskId = null;
    const inferred = inferSelectedTask();
    if (inferred) state.selectedTaskId = inferred;
    if (state.selectedTaskId && !state.tasks.some((t) => t.id === state.selectedTaskId)) state.selectedTaskId = null;
    if (!state.timer.isRunning && (state.timer.mode === "idle" || state.timer.mode === "work")) {
      state.timer.currentTaskId = state.selectedTaskId;
    }
    persistSelection();
    updateFilterButtons();
  }

  function attachEvents() {
    dom.taskForm.addEventListener("submit", onTaskSubmit);
    dom.filterButtons.forEach((btn) => btn.addEventListener("click", () => setFilter(btn.dataset.filter)));
    dom.taskList.addEventListener("click", onTaskClick);
    dom.taskList.addEventListener("change", onTaskChange);
    dom.taskList.addEventListener("dblclick", onTaskDoubleClick);
    dom.taskSearch?.addEventListener("input", handleTaskSearch);
    dom.taskTitle.addEventListener("input", () => clearFormError());
    dom.taskEstimate.addEventListener("input", () => clearFormError());
    dom.startBtn.addEventListener("click", startTimer);
    dom.pauseBtn.addEventListener("click", pauseTimer);
    dom.resetBtn.addEventListener("click", () => resetTimer(true));
    dom.skipBtn.addEventListener("click", skipTimer);
    dom.toggleFocusBtn?.addEventListener("click", toggleFocusMode);
    dom.openSettingsBtn?.addEventListener("click", openSettingsDialog);
    dom.settingsForm?.addEventListener("submit", handleSettingsSubmit);
    dom.settingsResetBtn?.addEventListener("click", resetSettingsForm);
    dom.settingsDialog?.addEventListener("cancel", () => dom.settingsDialog.close("cancel"));
    dom.settingsDialog?.addEventListener("close", () => populateSettingsForm());
    dom.bulkDeleteBtn?.addEventListener("click", bulkDeleteCompleted);
    dom.exportBtn?.addEventListener("click", exportData);
    dom.importInput?.addEventListener("change", handleDataImport);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && state.timer.isRunning) updateTimer();
    });
    document.addEventListener("keydown", handleGlobalKeys);
  }

  function onTaskSubmit(event) {
    event.preventDefault();
    if (guardFocusMode()) return;
    if (state.ui.editingTaskId) {
      showNotification(ERRORS.E008, "warning");
      return;
    }
    const title = dom.taskTitle.value.trim();
    const estimate = Number(dom.taskEstimate.value);
    const { ok, message } = validateTask(title, estimate);
    if (!ok) {
      showFormError(message);
      dom.taskTitle.focus();
      return;
    }
    clearFormError();
    addTask(title, estimate);
    dom.taskTitle.value = "";
    dom.taskEstimate.value = "1";
  }

  function handleTaskSearch(event) {
    if (isFocusLocked()) {
      event.target.value = state.ui.searchTerm;
      showNotification(ERRORS.E011, "warning");
      return;
    }
    state.ui.searchTerm = event.target.value.trim().toLowerCase();
    bus.emit("tasks:updated", state.tasks);
  }

  function guardEditing(event) {
    if (!state.ui.editingTaskId) return false;
    if (event?.target?.closest?.(".task-edit-form")) return false;
    showNotification(ERRORS.E008, "warning");
    return true;
  }

  function getTaskProgress(task) {
    const estimate = Math.max(task.estimatedPomodoros || 1, 1);
    const ratio = task.actualPomodoros / estimate;
    let state = "not-started";
    if (ratio === 0) state = "not-started";
    else if (ratio < 1) state = "in-progress";
    else if (ratio === 1) state = "met";
    else state = "over";
    return { ratio, clampedRatio: Math.min(ratio, 1), state };
  }

  function isFocusLocked() {
    return Boolean(state.settings.focusMode && state.timer.isRunning);
  }

  function guardFocusMode() {
    if (!isFocusLocked()) return false;
    showNotification(ERRORS.E011, "warning");
    return true;
  }

  function onTaskClick(event) {
    if (guardFocusMode()) return;
    if (guardEditing(event)) return;
    const item = event.target.closest(".task-item");
    if (!item) return;
    const id = item.dataset.taskId;
    if (event.target.matches(".edit-btn")) {
      enterEditMode(id);
      return;
    }
    else if (event.target.matches(".delete-btn")) queueDelete(id, item);
    else if (!event.target.matches(".task-checkbox")) selectTask(id);
  }

  function onTaskChange(event) {
    if (isFocusLocked()) {
      event.preventDefault();
      showNotification(ERRORS.E011, "warning");
      return;
    }
    if (state.ui.editingTaskId) {
      event.preventDefault();
      showNotification(ERRORS.E008, "warning");
      return;
    }
    if (!event.target.matches(".task-checkbox")) return;
    const item = event.target.closest(".task-item");
    if (!item) return;
    toggleComplete(item.dataset.taskId, event.target.checked);
  }

  function onTaskDoubleClick(event) {
    if (state.ui.editingTaskId) {
      if (!event.target.closest(`[data-task-id="${state.ui.editingTaskId}"]`)) showNotification(ERRORS.E008, "warning");
      return;
    }
    const item = event.target.closest(".task-item");
    if (!item) return;
    event.preventDefault();
    enterEditMode(item.dataset.taskId);
  }

  function handleGlobalKeys(event) {
    if (isFocusLocked() && ["Delete", " "].includes(event.key)) {
      event.preventDefault();
      showNotification(ERRORS.E011, "warning");
      return;
    }
    if (state.ui.editingTaskId && event.key !== "Escape" && !event.target.closest?.(".task-edit-form")) {
      if (["Delete", " ", "Enter"].includes(event.key)) {
        showNotification(ERRORS.E008, "warning");
        event.preventDefault();
        return;
      }
    }
    if (event.key === "Escape" && state.ui.editingTaskId) {
      cancelEdit();
      return;
    }
    if (event.key === "Enter" && document.activeElement === dom.taskTitle) dom.taskForm.requestSubmit();
    else if (event.key === "Escape" && dom.confirmDialog?.open) dom.confirmDialog.close("cancel");
    else if (event.key === " " && document.activeElement?.closest(".task-item") && !event.target.matches("input,button")) {
      selectTask(document.activeElement.closest(".task-item").dataset.taskId);
      event.preventDefault();
    } else if (event.key === "Delete") {
      const focused = document.activeElement?.closest(".task-item");
      if (focused) queueDelete(focused.dataset.taskId, focused);
    } else if (event.key === "Enter" && state.timer.isPaused) startTimer();
  }

  function validateTask(title, estimate) {
    if (!title) return { ok: false, message: ERRORS.E001 };
    if (title.length > CONFIG.limits.titleMax) return { ok: false, message: ERRORS.E002 };
    if (!Number.isInteger(estimate) || estimate < CONFIG.limits.estimate.min || estimate > CONFIG.limits.estimate.max) return { ok: false, message: ERRORS.E009 };
    return { ok: true };
  }

  function showFormError(message) {
    if (!dom.taskFormError) return;
    dom.taskFormError.textContent = message;
    dom.taskFormError.hidden = false;
  }

  function clearFormError() {
    if (!dom.taskFormError) return;
    dom.taskFormError.textContent = "";
    dom.taskFormError.hidden = true;
  }

  function addTask(title, estimatedPomodoros) {
    const task = createTask({ title, estimatedPomodoros });
    state.tasks.unshift(task);
    state.ui.lastCreatedTaskId = task.id;
    commitTasks();
    showNotification("タスクを追加しました", "success");
  }

  function enterEditMode(taskId) {
    if (state.ui.editingTaskId === taskId) return;
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    state.ui.editingTaskId = taskId;
    bus.emit("tasks:updated", state.tasks);
    requestAnimationFrame(() => {
      const input = dom.taskList.querySelector(".task-edit-input");
      input?.focus();
      input?.select();
    });
  }

  function cancelEdit() {
    if (!state.ui.editingTaskId) return;
    state.ui.editingTaskId = null;
    bus.emit("tasks:updated", state.tasks);
  }

  function applyTaskEdit(taskId, title) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return cancelEdit();
    const { ok, message } = validateTask(title, task.estimatedPomodoros);
    if (!ok) {
      showNotification(message, "error");
      return;
    }
    if (title === task.title) {
      cancelEdit();
      return;
    }
    task.title = title;
    state.ui.editingTaskId = null;
    commitTasks();
    showNotification("タスクを更新しました", "success");
  }

  function queueDelete(taskId, element) {
    if (isFocusLocked()) return showNotification(ERRORS.E011, "warning");
    if (state.timer.isRunning && state.timer.currentTaskId === taskId) return showNotification(ERRORS.E004, "warning");
    element.classList.add("removing");
    setTimeout(() => deleteTask(taskId), 260);
  }

  function deleteTask(taskId) {
    const index = state.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return;
    const [removed] = state.tasks.splice(index, 1);
    if (state.selectedTaskId === removed.id) {
      state.selectedTaskId = null;
      if (!state.timer.isRunning) state.timer.currentTaskId = null;
    }
    if (state.ui.editingTaskId === removed.id) state.ui.editingTaskId = null;
    commitTasks();
    persistSelection();
    showNotification("タスクを削除しました", "info");
  }

  function toggleComplete(taskId, completed) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.completed = completed;
    task.completedAt = completed ? nowISO() : null;
    if (completed && state.timer.currentTaskId === taskId && !state.timer.isRunning) {
      state.selectedTaskId = null;
      state.timer.currentTaskId = null;
      persistSelection();
    }
    commitTasks();
  }

  function selectTask(taskId) {
    if (state.timer.isRunning && state.timer.currentTaskId !== taskId) return showNotification(ERRORS.E010, "warning");
    state.selectedTaskId = taskId;
    if (!state.timer.isRunning) state.timer.currentTaskId = taskId;
    bus.emit("tasks:updated", state.tasks);
    bus.emit("timer:updated", state.timer);
    persistSelection();
  }

  function setFilter(filter) {
    state.settings.filterState = filter;
    commitSettings();
    bus.emit("tasks:updated", state.tasks);
  }

  function updateFilterButtons() {
    dom.filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === state.settings.filterState));
  }

  function renderTasks() {
    const tasks = getTasksByFilter();
    const fragment = document.createDocumentFragment();
    dom.taskList.textContent = "";
    if (dom.taskEmptyState) {
      if (tasks.length === 0) {
        dom.taskEmptyState.textContent = state.ui.searchTerm ? "該当するタスクが見つかりません。" : "タスクがありません。最初のタスクを追加しましょう。";
        dom.taskEmptyState.hidden = false;
      } else dom.taskEmptyState.hidden = true;
    }
    tasks.forEach((task) => fragment.appendChild(buildTaskItem(task)));
    dom.taskList.appendChild(fragment);
    if (state.ui.lastCreatedTaskId) state.ui.lastCreatedTaskId = null;
  }

  function getTasksByFilter() {
    const { filterState } = state.settings;
    let tasks = state.tasks;
    if (filterState === "active") tasks = tasks.filter((t) => !t.completed);
    else if (filterState === "completed") tasks = tasks.filter((t) => t.completed);
    else tasks = tasks.slice();
    if (state.ui.searchTerm) {
      const query = state.ui.searchTerm;
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(query));
    }
    if (filterState === "all") {
      tasks = tasks.slice().sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    }
    return tasks;
  }

  function buildTaskItem(task) {
    const li = document.createElement("li");
    const isEditing = state.ui.editingTaskId === task.id;
    li.className = "task-item";
    li.dataset.taskId = task.id;
    li.tabIndex = 0;
    if (task.id === state.selectedTaskId) li.classList.add("selected");
    if (task.completed) li.classList.add("completed");
    if (isEditing) li.classList.add("editing");

    if (isEditing) {
      const progress = getTaskProgress(task);
      const form = document.createElement("form");
      form.className = "task-edit-form";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "task-edit-input";
      input.value = task.title;
      input.maxLength = CONFIG.limits.titleMax;
      input.setAttribute("aria-label", `${task.title} を編集`);
      input.required = true;
      input.addEventListener("keydown", (evt) => {
        if (evt.key === "Escape") {
          evt.preventDefault();
          cancelEdit();
        }
      });

      const meta = document.createElement("div");
      meta.className = `task-edit-meta task-meta-summary task-meta-summary--${progress.state}`;
      meta.textContent = `🍅 ${task.actualPomodoros}/${task.estimatedPomodoros}`;

      const progressBar = document.createElement("div");
      progressBar.className = `task-progress task-progress--${progress.state}`;
      progressBar.setAttribute("role", "progressbar");
      progressBar.setAttribute("aria-valuemin", "0");
      progressBar.setAttribute("aria-valuemax", `${task.estimatedPomodoros}`);
      progressBar.setAttribute("aria-valuenow", `${Math.min(task.actualPomodoros, task.estimatedPomodoros)}`);
      progressBar.setAttribute("aria-label", `${task.title} の進捗 ${task.actualPomodoros}/${task.estimatedPomodoros}`);
      const progressFill = document.createElement("div");
      progressFill.className = "task-progress__fill";
      progressFill.style.width = `${Math.round(progress.clampedRatio * 100)}%`;
      progressBar.append(progressFill);

      const actions = document.createElement("div");
      actions.className = "task-edit-actions";
      const saveBtn = document.createElement("button");
      saveBtn.type = "submit";
      saveBtn.className = "btn btn-primary task-edit-save";
      saveBtn.textContent = "保存";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn btn-secondary task-edit-cancel";
      cancelBtn.textContent = "キャンセル";
      cancelBtn.addEventListener("click", () => cancelEdit());
      actions.append(saveBtn, cancelBtn);

      form.append(input, meta, progressBar, actions);
      form.addEventListener("submit", (evt) => {
        evt.preventDefault();
        applyTaskEdit(task.id, input.value.trim());
      });

      li.append(form);
      return li;
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `${task.title} を完了にする`);

    const content = document.createElement("div");
    content.className = "task-content";
    const title = document.createElement("span");
    title.className = "task-title-text";
    title.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    const progress = getTaskProgress(task);
    const summary = document.createElement("span");
    summary.className = `task-meta-summary task-meta-summary--${progress.state}`;
    summary.textContent = `🍅 ${task.actualPomodoros}/${task.estimatedPomodoros}`;
    const created = document.createElement("span");
    created.textContent = new Date(task.createdAt).toLocaleString();
    meta.append(summary, created);
    content.append(title, meta);

    const progressBar = document.createElement("div");
    progressBar.className = `task-progress task-progress--${progress.state}`;
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", `${task.estimatedPomodoros}`);
    progressBar.setAttribute("aria-valuenow", `${Math.min(task.actualPomodoros, task.estimatedPomodoros)}`);
    progressBar.setAttribute("aria-label", `${task.title} の進捗 ${task.actualPomodoros}/${task.estimatedPomodoros}`);
    const progressFill = document.createElement("div");
    progressFill.className = "task-progress__fill";
    progressFill.style.width = `${Math.round(progress.clampedRatio * 100)}%`;
    progressBar.append(progressFill);
    content.append(progressBar);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-btn";
    edit.textContent = "✏️";
    edit.setAttribute("aria-label", `${task.title} を編集`);
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = "✕";
    del.setAttribute("aria-label", `${task.title} を削除`);
    actions.append(edit, del);

    li.append(checkbox, content, actions);
    if (task.id === state.ui.lastCreatedTaskId) {
      li.classList.add("new");
      setTimeout(() => li.classList.remove("new"), 400);
    }
    return li;
  }

  function startTimer() {
    if (state.ui.editingTaskId) return showNotification(ERRORS.E008, "warning");
    if (state.timer.isRunning && !state.timer.isPaused) return;
    const isWorkPhase = state.timer.mode === "work" || state.timer.mode === "idle";
    if (isWorkPhase && !state.selectedTaskId) return showNotification(ERRORS.E003, "warning");
    state.timer.currentTaskId = isWorkPhase ? state.selectedTaskId : null;
    if (state.timer.isPaused) {
      state.timer.isPaused = false;
      state.timer.startedAt = Date.now() - (state.timer.duration - state.timer.remainingTime) * 1000;
    } else {
      if (state.timer.mode === "idle") syncDuration("work");
      state.timer.startedAt = Date.now();
      state.timer.remainingTime = state.timer.duration;
    }
    state.timer.isRunning = true;
    clearInterval(timerId);
    timerId = setInterval(updateTimer, 1000);
    updateTimer();
    commitTimer();
    dom.timerMode.parentElement?.classList.add("running");
  }

  function pauseTimer() {
    if (!state.timer.isRunning) return;
    clearInterval(timerId);
    timerId = null;
    state.timer.isRunning = false;
    state.timer.isPaused = true;
    commitTimer();
    updateTimerDisplay();
    dom.timerMode.parentElement?.classList.remove("running");
  }

  async function resetTimer(ask) {
    if (ask && state.timer.remainingTime !== state.timer.duration) {
      const confirmed = await confirmAction(ERRORS.E007);
      if (!confirmed) return;
    }
    clearInterval(timerId);
    timerId = null;
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    syncDuration(state.timer.mode === "idle" ? "work" : state.timer.mode);
    state.timer.currentTaskId = state.selectedTaskId;
    commitTimer();
    updateTimerDisplay();
    dom.timerMode.parentElement?.classList.remove("running");
  }

  function skipTimer() {
    if (state.ui.editingTaskId) return showNotification(ERRORS.E008, "warning");
    if (state.timer.mode === "idle") return;
    clearInterval(timerId);
    timerId = null;
    dom.timerMode.parentElement?.classList.remove("running");
    if (state.timer.mode === "work") {
      const nextIsLongBreak = (state.timer.sessionCounter + 1) % state.settings.longBreakInterval === 0 && state.settings.longBreakInterval > 0;
      switchMode(nextIsLongBreak ? "longBreak" : "shortBreak");
      state.timer.currentTaskId = null;
      state.timer.isRunning = false;
      state.timer.isPaused = false;
      commitTimer();
      startTimer();
      showNotification("作業をスキップしました。休憩に切り替えます", "info");
    } else {
      switchToWork();
      showNotification("休憩をスキップしました。作業モードに戻ります", "info");
    }
  }

  function updateTimer() {
    if (!state.timer.isRunning) return;
    const elapsed = Math.floor((Date.now() - state.timer.startedAt) / 1000);
    const nextRemaining = Math.max(state.timer.duration - elapsed, 0);
    if (nextRemaining === state.timer.remainingTime) return;
    state.timer.remainingTime = nextRemaining;
    commitTimer();
    if (state.timer.remainingTime <= 0) completeSession();
  }

  function completeSession() {
    clearInterval(timerId);
    timerId = null;
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    dom.timerMode.parentElement?.classList.remove("running");
    playSound();
    notify("タイマーが終了しました");
    let tasksMutated = false;
    if (state.timer.mode === "work") {
      applyPomodoroResults();
      tasksMutated = true;
      proceedToBreak();
      showNotification("作業セッション完了！休憩に入りましょう", "success");
    } else {
      switchToWork();
      showNotification("休憩終了。次の作業を開始しましょう", "info");
    }
    commitTimer();
    if (tasksMutated) commitTasks(); else bus.emit("tasks:updated", state.tasks);
  }

  function proceedToBreak() {
    state.timer.pomodoroCount += 1;
    state.timer.sessionCounter += 1;
    const longBreak = state.timer.sessionCounter % state.settings.longBreakInterval === 0;
    switchMode(longBreak ? "longBreak" : "shortBreak");
    startTimer();
  }

  function switchToWork() {
    switchMode("work");
    if (state.selectedTaskId) startTimer();
  }

  function switchMode(mode) {
    state.timer.mode = mode;
    syncDuration(mode);
    state.timer.remainingTime = state.timer.duration;
    state.timer.startedAt = null;
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.currentTaskId = mode === "work" ? state.selectedTaskId : null;
  }

  function syncDuration(mode) {
    const minutes = mode === "shortBreak" ? state.settings.shortBreakDuration : mode === "longBreak" ? state.settings.longBreakDuration : state.settings.workDuration;
    state.timer.duration = minutes * 60;
    if (mode === "idle") state.timer.remainingTime = state.timer.duration;
  }

  function applyPomodoroResults() {
    const task = state.tasks.find((t) => t.id === state.timer.currentTaskId);
    if (!task) return;
    task.actualPomodoros += 1;
    if (task.actualPomodoros >= task.estimatedPomodoros && !task.completed) {
      task.completed = true;
      task.completedAt = nowISO();
    }
    const today = ensureToday();
    today.pomodoros += 1;
    today.streak += 1;
    today.completedTasks = state.tasks.filter((t) => t.completed).length;
    persistToday();
  }

  function updateTimerDisplay() {
    const { mode, remainingTime, duration, currentTaskId } = state.timer;
    dom.timerDisplay.textContent = formatTime(Math.max(remainingTime, 0));
    dom.timerMode.textContent = modeLabel(mode);
    dom.timerMode.style.color = modeColor(mode);
    dom.progressBar.style.width = `${Math.min(Math.max(1 - remainingTime / (duration || 1), 0), 1) * 100}%`;
    const task = state.tasks.find((t) => t.id === currentTaskId);
    if (mode === "work") dom.currentTask.textContent = task ? `選択中: ${task.title}` : "選択中: なし";
    else if (mode === "shortBreak") dom.currentTask.textContent = "短い休憩を取りましょう";
    else if (mode === "longBreak") dom.currentTask.textContent = "長めの休憩でリフレッシュ";
    else dom.currentTask.textContent = "待機中: タスクを選択してください";
  }

  function updateStatistics() {
    const today = ensureToday();
    const completed = state.tasks.filter((t) => t.completed).length;
    const total = state.tasks.length;
    const minutes = today.pomodoros * state.settings.workDuration;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    dom.statTodayPomodoros.textContent = `🍅 ${today.pomodoros}`;
    dom.statTodayTasks.textContent = `✓ ${completed}/${total}`;
    dom.statTodayTime.textContent = `${hours}h ${rest}m`;
    dom.statListPomodoros.textContent = `🍅 ${today.pomodoros}`;
    dom.statListTasks.textContent = `✓ ${completed}/${total}`;
    dom.statListTime.textContent = `${hours}h ${rest}m`;
    if (dom.statStreak) dom.statStreak.textContent = `${today.streak}`;
    if (today.completedTasks !== completed) {
      today.completedTasks = completed;
      persistToday();
    }
    renderWeeklyChart();
  }

  function renderWeeklyChart() {
    if (!dom.weeklyChart) return;
    dom.weeklyChart.textContent = "";
    const hasData = state.today.pomodoros > 0 || state.history.some((entry) => entry?.pomodoros);
    if (!hasData) {
      const placeholder = document.createElement("div");
      placeholder.className = "weekly-chart__placeholder";
      placeholder.textContent = "データが集まるとここに週間グラフが表示されます。";
      dom.weeklyChart.appendChild(placeholder);
    }
  }

  function applyFocusState() {
    const focusEnabled = Boolean(state.settings.focusMode);
    if (dom.toggleFocusBtn) {
      dom.toggleFocusBtn.setAttribute("aria-pressed", focusEnabled ? "true" : "false");
      dom.toggleFocusBtn.textContent = focusEnabled ? "集中モード: ON" : "集中モード: OFF";
    }
    const locked = isFocusLocked();
    if (dom.focusOverlay) dom.focusOverlay.classList.toggle("active", locked);
    if (dom.taskTitle) dom.taskTitle.disabled = locked;
    if (dom.taskEstimate) dom.taskEstimate.disabled = locked;
    if (dom.taskSearch) dom.taskSearch.disabled = locked;
    [dom.bulkDeleteBtn, dom.sortCreatedBtn, dom.sortEstimateBtn].forEach((btn) => {
      if (btn) btn.disabled = locked;
    });
    dom.taskForm?.classList.toggle("is-disabled", locked);
    document.body.classList.toggle("focus-locked", locked);
  }

  function populateSettingsForm() {
    if (!dom.settingsForm) return;
    dom.settingsWorkDuration.value = String(state.settings.workDuration);
    dom.settingsShortBreak.value = String(state.settings.shortBreakDuration);
    dom.settingsLongBreak.value = String(state.settings.longBreakDuration);
    dom.settingsLongInterval.value = String(state.settings.longBreakInterval);
    dom.settingsSound.value = state.settings.notificationSound;
    dom.settingsFocusMode.checked = Boolean(state.settings.focusMode);
    dom.settingsFilterDefault.value = state.settings.filterState;
  }

  function openSettingsDialog() {
    if (!dom.settingsDialog) return;
    populateSettingsForm();
    dom.settingsDialog.showModal();
  }

  function resetSettingsForm(event) {
    event?.preventDefault();
    if (!dom.settingsForm) return;
    dom.settingsWorkDuration.value = String(DEFAULT_SETTINGS.workDuration);
    dom.settingsShortBreak.value = String(DEFAULT_SETTINGS.shortBreakDuration);
    dom.settingsLongBreak.value = String(DEFAULT_SETTINGS.longBreakDuration);
    dom.settingsLongInterval.value = String(DEFAULT_SETTINGS.longBreakInterval);
    dom.settingsSound.value = DEFAULT_SETTINGS.notificationSound;
    dom.settingsFocusMode.checked = Boolean(DEFAULT_SETTINGS.focusMode);
    dom.settingsFilterDefault.value = DEFAULT_SETTINGS.filterState;
  }

  function handleSettingsSubmit(event) {
    event.preventDefault();
    if (!dom.settingsForm) return;
    const workDuration = Number(dom.settingsWorkDuration.value);
    const shortBreak = Number(dom.settingsShortBreak.value);
    const longBreak = Number(dom.settingsLongBreak.value);
    const longInterval = Number(dom.settingsLongInterval.value);
    const notificationSound = ["beep", "bell", "chime", "silent"].includes(dom.settingsSound.value) ? dom.settingsSound.value : DEFAULT_SETTINGS.notificationSound;
    const focusMode = Boolean(dom.settingsFocusMode.checked);
    const filterState = ["all", "active", "completed"].includes(dom.settingsFilterDefault.value) ? dom.settingsFilterDefault.value : state.settings.filterState;
    const constraints = [
      { value: workDuration, min: CONFIG.limits.durations.work.min, max: CONFIG.limits.durations.work.max, field: dom.settingsWorkDuration, message: `作業時間は${CONFIG.limits.durations.work.min}〜${CONFIG.limits.durations.work.max}分で設定してください` },
      { value: shortBreak, min: CONFIG.limits.durations.shortBreak.min, max: CONFIG.limits.durations.shortBreak.max, field: dom.settingsShortBreak, message: `短い休憩は${CONFIG.limits.durations.shortBreak.min}〜${CONFIG.limits.durations.shortBreak.max}分で設定してください` },
      { value: longBreak, min: CONFIG.limits.durations.longBreak.min, max: CONFIG.limits.durations.longBreak.max, field: dom.settingsLongBreak, message: `長い休憩は${CONFIG.limits.durations.longBreak.min}〜${CONFIG.limits.durations.longBreak.max}分で設定してください` },
      { value: longInterval, min: 2, max: 12, field: dom.settingsLongInterval, message: "長い休憩の間隔は2〜12回の範囲で設定してください" }
    ];
    for (const rule of constraints) {
      if (!Number.isFinite(rule.value) || rule.value < rule.min || rule.value > rule.max) {
        showNotification(rule.message, "error");
        rule.field?.focus();
        return;
      }
    }
    const nextSettings = normalizeSettings({
      ...state.settings,
      workDuration,
      shortBreakDuration: shortBreak,
      longBreakDuration: longBreak,
      longBreakInterval: longInterval,
      notificationSound,
      focusMode,
      filterState
    });
    state.settings = nextSettings;
    commitSettings();
    if (!state.timer.isRunning) {
      const activeMode = state.timer.mode === "idle" ? "work" : state.timer.mode;
      syncDuration(activeMode);
      if (!state.timer.isPaused) state.timer.remainingTime = state.timer.duration;
      commitTimer();
    }
    populateSettingsForm();
    dom.settingsDialog?.close("confirm");
    showNotification("設定を保存しました", "success");
  }

  function toggleFocusMode() {
    state.settings.focusMode = !state.settings.focusMode;
    commitSettings();
    showNotification(state.settings.focusMode ? "集中モードを有効にしました" : "集中モードを無効にしました", "info");
  }

  async function bulkDeleteCompleted(event) {
    event?.preventDefault();
    if (isFocusLocked()) return showNotification(ERRORS.E011, "warning");
    if (state.ui.editingTaskId) return showNotification(ERRORS.E008, "warning");
    const completedTasks = state.tasks.filter((task) => task.completed);
    if (!completedTasks.length) {
      showNotification("完了したタスクはありません", "info");
      return;
    }
    const confirmed = await confirmAction("完了したタスクをすべて削除しますか？");
    if (!confirmed) return;
    const completedIds = new Set(completedTasks.map((task) => task.id));
    const remaining = state.tasks.filter((task) => !completedIds.has(task.id));
    state.tasks.splice(0, state.tasks.length, ...remaining);
    if (state.selectedTaskId && completedIds.has(state.selectedTaskId)) {
      state.selectedTaskId = null;
      if (!state.timer.isRunning) state.timer.currentTaskId = null;
      persistSelection();
    }
    commitTasks();
    showNotification("完了したタスクを削除しました", "info");
  }

  function moveTask(taskId, direction) {
    if (state.settings.filterState !== "all" || state.ui.searchTerm) {
      showNotification("並び替えはフィルター無しの状態で利用できます", "warning");
      return;
    }
    if (isFocusLocked()) {
      showNotification(ERRORS.E011, "warning");
      return;
    }
    const index = state.tasks.findIndex((task) => task.id === taskId);
    if (index === -1) return;
    const offset = direction === "up" ? -1 : 1;
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= state.tasks.length) return;
    const [task] = state.tasks.splice(index, 1);
    state.tasks.splice(targetIndex, 0, task);
    commitTasks();
  }

  function exportData(event) {
    event?.preventDefault();
    const payload = {
      version: 1,
      exportedAt: nowISO(),
      tasks: state.tasks,
      timer: state.timer,
      settings: state.settings,
      today: state.today,
      history: state.history,
      selectedTaskId: state.selectedTaskId
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pomotodo-export-${formatDateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDataImport(event) {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        mergeImportedData(data);
        showNotification("データをインポートしました", "success");
      } catch (error) {
        console.error("import failed", error);
        showNotification("インポートに失敗しました", "error");
      } finally {
        event.target.value = "";
      }
    };
    reader.onerror = () => {
      showNotification("インポートに失敗しました", "error");
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function mergeImportedData(data) {
    if (!data || typeof data !== "object") throw new Error("Invalid import payload");

    let tasksMutated = false;
    if (Array.isArray(data.tasks)) {
      const importedTasks = data.tasks.map(normalizeTask).filter(Boolean);
      if (importedTasks.length) {
        const existingIds = new Set(state.tasks.map((task) => task.id));
        const merged = state.tasks.map((task) => {
          const replacementTask = importedTasks.find((item) => item.id === task.id);
          return replacementTask ?? task;
        });
        importedTasks.forEach((task) => {
          if (!existingIds.has(task.id)) merged.push(task);
        });
        state.tasks.splice(0, state.tasks.length, ...merged);
        tasksMutated = true;
        commitTasks();
      }
    }

    if (data.settings) {
      state.settings = normalizeSettings({ ...state.settings, ...data.settings });
      commitSettings();
    }

    if (data.timer) {
      state.timer = normalizeTimer({ ...state.timer, ...data.timer });
      commitTimer();
    }

    if (data.today) {
      const nextToday = normalizeToday(data.today);
      if (nextToday) {
        state.today = nextToday;
        persistToday();
        updateStatistics();
      }
    }

    if (Array.isArray(data.history)) {
      const historyByDate = new Map();
      state.history.forEach((entry) => {
        const normalized = normalizeHistoryEntry(entry);
        if (normalized) historyByDate.set(normalized.date, normalized);
      });
      data.history.forEach((entry) => {
        const normalized = normalizeHistoryEntry(entry);
        if (!normalized) return;
        const existing = historyByDate.get(normalized.date);
        if (!existing) {
          historyByDate.set(normalized.date, normalized);
          return;
        }
        historyByDate.set(normalized.date, {
          date: normalized.date,
          pomodoros: Math.max(existing.pomodoros, normalized.pomodoros),
          completedTasks: Math.max(existing.completedTasks, normalized.completedTasks),
          streak: Math.max(existing.streak, normalized.streak)
        });
      });
      state.history = Array.from(historyByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
      if (state.history.length > CONFIG.historyLimit) state.history = state.history.slice(-CONFIG.historyLimit);
      persistHistory();
    }

    if (typeof data.selectedTaskId === "string") {
      const exists = state.tasks.some((task) => task.id === data.selectedTaskId);
      state.selectedTaskId = exists ? data.selectedTaskId : null;
      if (!state.timer.isRunning) state.timer.currentTaskId = state.selectedTaskId;
      persistSelection();
      if (state.timer.currentTaskId !== (state.selectedTaskId ?? null)) commitTimer();
    } else if (state.selectedTaskId && !state.tasks.some((task) => task.id === state.selectedTaskId)) {
      state.selectedTaskId = null;
      if (!state.timer.isRunning) state.timer.currentTaskId = null;
      persistSelection();
      commitTimer();
    }

    if (state.timer.currentTaskId && !state.tasks.some((task) => task.id === state.timer.currentTaskId)) {
      state.timer.currentTaskId = null;
      commitTimer();
    }

    if (tasksMutated) bus.emit("tasks:updated", state.tasks);
  }


  function showNotification(message, type = "info") {
    if (!dom.notification) return;
    dom.notification.textContent = message;
    dom.notification.className = `notification ${type}`;
    dom.notification.style.display = "block";
    clearTimeout(dom.notification.timeoutId);
    dom.notification.timeoutId = setTimeout(() => (dom.notification.style.display = "none"), 3000);
  }

  function playSound() {
    const preference = state.settings.notificationSound || "beep";
    if (preference === "silent") return;
    const sequence = AUDIO_PROFILES[preference] ?? AUDIO_PROFILES.beep;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        if (!audioContext) audioContext = new AudioCtx();
        if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
        let cursor = audioContext.currentTime;
        sequence.forEach((step) => {
          if (step.gap) {
            cursor += step.gap;
            return;
          }
          const toneDuration = step.duration ?? 0.2;
          const oscillator = audioContext.createOscillator();
          oscillator.type = step.type || "sine";
          oscillator.frequency.setValueAtTime(step.frequency || 440, cursor);
          const gainNode = audioContext.createGain();
          const gainValue = step.gain ?? 0.25;
          gainNode.gain.setValueAtTime(gainValue, cursor);
          if (step.decay) {
            const decayTime = Math.max(toneDuration * step.decay, 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, cursor + decayTime);
          } else {
            gainNode.gain.setValueAtTime(gainValue, cursor + toneDuration);
          }
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.start(cursor);
          oscillator.stop(cursor + toneDuration);
          const toneEnd = cursor + toneDuration;
          setTimeout(() => {
            try {
              oscillator.disconnect();
              gainNode.disconnect();
            } catch (_) {}
          }, Math.max((toneEnd - audioContext.currentTime + 0.2) * 1000, 0));
          cursor = toneEnd;
        });
        return;
      } catch (error) {
        console.warn("audio context playback failed", error);
      }
    }
    if (!fallbackAudio) fallbackAudio = new Audio(AUDIO_FALLBACK_SRC);
    fallbackAudio.currentTime = 0;
    fallbackAudio.play().catch(() => {});
  }

  function notify(message) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") new Notification("PomoTodo", { body: message, icon: "🍅" });
  }

  function requestNotificationPermission() {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    Notification.requestPermission().catch(() => {});
  }

  function confirmAction(message) {
    if (!dom.confirmDialog) return Promise.resolve(window.confirm(message));
    dom.confirmMessage.textContent = message;
    dom.confirmDialog.showModal();
    return new Promise((resolve) => {
      const closeHandler = () => {
        dom.confirmDialog.removeEventListener("close", closeHandler);
        resolve(dom.confirmDialog.returnValue === "confirm");
      };
      dom.confirmDialog.addEventListener("close", closeHandler, { once: true });
    });
  }

  function load(key, fallback) {
    if (!storageAvailable()) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("storage load failed", error);
      showNotification(ERRORS.E006, "warning");
      return fallback;
    }
  }

  function save(key, value) {
    if (!storageAvailable()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("storage save failed", error);
      showNotification(error?.name === "QuotaExceededError" ? ERRORS.E005 : ERRORS.E006, "error");
    }
  }

  function storageAvailable() {
    try {
      localStorage.setItem("pomotodo__test", "1");
      localStorage.removeItem("pomotodo__test");
      return true;
    } catch {
      showNotification(ERRORS.E006, "error");
      return false;
    }
  }

  function persistTasks() { save(CONFIG.storageKeys.tasks, state.tasks); }
  function persistTimer() { save(CONFIG.storageKeys.timer, state.timer); }
  function persistSettings() { save(CONFIG.storageKeys.settings, state.settings); }
  function persistToday() { save(CONFIG.storageKeys.today, state.today); }
  function persistSelection() { save(CONFIG.storageKeys.selection, state.selectedTaskId); }

  function commitTasks() {
    persistTasks();
    bus.emit("tasks:updated", state.tasks);
  }

  function commitTimer() {
    persistTimer();
    bus.emit("timer:updated", state.timer);
  }

  function commitSettings() {
    persistSettings();
    bus.emit("settings:updated", state.settings);
  }

  function resumeFromPersisted() {
    const remaining = Math.max(state.timer.duration - Math.floor((Date.now() - state.timer.startedAt) / 1000), 0);
    state.timer.remainingTime = remaining;
    commitTimer();
    if (remaining <= 0) return completeSession();
    timerId = setInterval(updateTimer, 1000);
    dom.timerMode.parentElement?.classList.add("running");
  }

  function inferSelectedTask() {
    const id = state.timer.currentTaskId;
    return state.tasks.some((t) => t.id === id) ? id : null;
  }

  function ensureToday() {
    const todayKey = formatDateKey(new Date());
    if (state.today.date !== todayKey) {
      if (state.today.pomodoros || state.today.completedTasks) {
        state.history.push({ ...state.today });
        if (state.history.length > CONFIG.historyLimit) state.history.splice(0, state.history.length - CONFIG.historyLimit);
        persistHistory();
      }
      state.today = createToday();
      persistToday();
    }
    return state.today;
  }

  function modeLabel(mode) {
    if (mode === "work") return "作業中";
    if (mode === "shortBreak") return "休憩中";
    if (mode === "longBreak") return "長い休憩中";
    return "待機中";
  }

  function modeColor(mode) {
    if (mode === "work") return "var(--primary-red)";
    if (mode === "shortBreak") return "var(--primary-green)";
    if (mode === "longBreak") return "var(--primary-blue)";
    return "var(--text-secondary)";
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function formatDateKey(date) {
    return date.toISOString().slice(0, 10);
  }

  function createTimerState(initial = {}) {
    const baseDuration = Number(initial.duration ?? DEFAULT_SETTINGS.workDuration * 60);
    const startedAt = typeof initial.startedAt === "number" ? initial.startedAt : null;
    return {
      mode: initial.mode ?? "idle",
      duration: baseDuration,
      remainingTime: Number.isFinite(initial.remainingTime) ? Math.max(initial.remainingTime, 0) : baseDuration,
      isRunning: Boolean(initial.isRunning),
      isPaused: Boolean(initial.isPaused),
      currentTaskId: initial.currentTaskId ?? null,
      startedAt,
      pomodoroCount: Number.isInteger(initial.pomodoroCount) ? Math.max(initial.pomodoroCount, 0) : 0,
      sessionCounter: Number.isInteger(initial.sessionCounter) ? Math.max(initial.sessionCounter, 0) : 0
    };
  }

  function createToday(initial = {}) {
    return {
      date: initial.date ?? formatDateKey(new Date()),
      pomodoros: Number.isInteger(initial.pomodoros) ? Math.max(initial.pomodoros, 0) : 0,
      completedTasks: Number.isInteger(initial.completedTasks) ? Math.max(initial.completedTasks, 0) : 0,
      streak: Number.isInteger(initial.streak) ? Math.max(initial.streak, 0) : 0
    };
  }

  function normalizeToday(raw) {
    if (!raw || typeof raw !== "object") return null;
    const draft = createToday({ ...raw, date: typeof raw.date === "string" ? raw.date : formatDateKey(new Date()) });
    return draft;
  }

  function normalizeTimer(raw) {
    const base = createTimerState(raw ?? {});
    if (base.mode === "work") base.duration = clamp(base.duration, CONFIG.limits.durations.work.min * 60, CONFIG.limits.durations.work.max * 60);
    if (base.mode === "shortBreak") base.duration = clamp(base.duration, CONFIG.limits.durations.shortBreak.min * 60, CONFIG.limits.durations.shortBreak.max * 60);
    if (base.mode === "longBreak") base.duration = clamp(base.duration, CONFIG.limits.durations.longBreak.min * 60, CONFIG.limits.durations.longBreak.max * 60);
    base.remainingTime = Math.min(Math.max(base.remainingTime, 0), base.duration);
    return base;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function createTask({ title, estimatedPomodoros }) {
    return {
      id: generateTaskId(),
      title,
      completed: false,
      estimatedPomodoros,
      actualPomodoros: 0,
      createdAt: nowISO(),
      completedAt: null
    };
  }

  function normalizeTask(raw) {
    if (!raw) return null;
    const title = String(raw.title ?? "").trim().slice(0, CONFIG.limits.titleMax);
    if (!title) return null;
    const estimated = clamp(Number(raw.estimatedPomodoros) || 1, CONFIG.limits.estimate.min, CONFIG.limits.estimate.max);
    const actual = Math.max(Number(raw.actualPomodoros) || 0, 0);
    const completed = Boolean(raw.completed);
    const completedAt = completed ? raw.completedAt ?? nowISO() : null;
    return {
      id: raw.id ?? generateTaskId(),
      title,
      completed,
      estimatedPomodoros: estimated,
      actualPomodoros: clamp(actual, 0, 999),
      createdAt: raw.createdAt ?? nowISO(),
      completedAt
    };
  }

  function normalizeSettings(raw) {
    const draft = { ...raw };
    draft.workDuration = clamp(Number(draft.workDuration) || DEFAULT_SETTINGS.workDuration, CONFIG.limits.durations.work.min, CONFIG.limits.durations.work.max);
    draft.shortBreakDuration = clamp(Number(draft.shortBreakDuration) || DEFAULT_SETTINGS.shortBreakDuration, CONFIG.limits.durations.shortBreak.min, CONFIG.limits.durations.shortBreak.max);
    draft.longBreakDuration = clamp(Number(draft.longBreakDuration) || DEFAULT_SETTINGS.longBreakDuration, CONFIG.limits.durations.longBreak.min, CONFIG.limits.durations.longBreak.max);
    draft.longBreakInterval = clamp(Number(draft.longBreakInterval) || DEFAULT_SETTINGS.longBreakInterval, 2, 12);
    draft.notificationSound = ["beep", "bell", "chime", "silent"].includes(draft.notificationSound) ? draft.notificationSound : DEFAULT_SETTINGS.notificationSound;
    draft.focusMode = Boolean(draft.focusMode);
    draft.filterState = ["all", "active", "completed"].includes(draft.filterState) ? draft.filterState : DEFAULT_SETTINGS.filterState;
    return draft;
  }

  function normalizeHistoryEntry(raw) {
    if (!raw) return null;
    const date = typeof raw.date === "string" ? raw.date : null;
    if (!date) return null;
    return {
      date,
      pomodoros: Number.isInteger(raw.pomodoros) ? Math.max(raw.pomodoros, 0) : 0,
      completedTasks: Number.isInteger(raw.completedTasks) ? Math.max(raw.completedTasks, 0) : 0,
      streak: Number.isInteger(raw.streak) ? Math.max(raw.streak, 0) : 0
    };
  }

  function persistHistory() {
    save(CONFIG.storageKeys.history, state.history);
    bus.emit("history:updated", state.history);
  }

  function createEventBus() {
    const listeners = new Map();
    return {
      on(event, handler) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(handler);
      },
      off(event, handler) {
        listeners.get(event)?.delete(handler);
      },
      emit(event, payload) {
        listeners.get(event)?.forEach((handler) => handler(payload));
      }
    };
  }
})();
