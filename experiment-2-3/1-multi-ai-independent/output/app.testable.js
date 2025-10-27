"use strict";

// ============================================================================
// Constants
// ============================================================================

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

// ============================================================================
// Pure Functions (Testable)
// ============================================================================

/**
 * Enhanced sanitizer to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitize(str) {
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

/**
 * Format time in MM:SS format
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Formatted time string
 */
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

/**
 * Format relative time from ISO string
 * @param {string} isoString - ISO date string
 * @returns {string} Relative time string
 */
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

/**
 * Sanitize number with fallback
 * @param {*} value - Value to sanitize
 * @param {*} fallback - Fallback value
 * @returns {number|*} Sanitized number or fallback
 */
function sanitizeNumber(value, fallback) {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Get mode duration in seconds
 * @param {string} mode - Timer mode ("work" or "break")
 * @param {Object} settings - Settings object
 * @returns {number} Duration in seconds
 */
function getModeDuration(mode, settings) {
  if (mode === "break") {
    return clamp(settings.shortBreakDuration, 1, 30) * 60;
  }
  return clamp(settings.workDuration, 1, 60) * 60;
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(Math.max(num, min), max);
}

/**
 * Normalize task object
 * @param {Object} task - Task object
 * @returns {Object} Normalized task
 */
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

/**
 * Sanitize timer object
 * @param {Object} timer - Timer object
 * @param {Object} settings - Settings object
 * @returns {Object} Sanitized timer
 */
function sanitizeTimer(timer, settings) {
  const sanitized = { ...timer };
  sanitized.mode = timer.mode === "break" ? "break" : "work";
  sanitized.remainingTime = sanitizeNumber(timer.remainingTime, getModeDuration(sanitized.mode, settings));
  sanitized.isRunning = Boolean(timer.isRunning);
  sanitized.isPaused = Boolean(timer.isPaused);
  sanitized.currentTaskId = timer.currentTaskId || null;
  sanitized.startedAt = timer.startedAt || null;
  sanitized.targetTimestamp = timer.targetTimestamp || null;
  sanitized.pomodoroCount = sanitizeNumber(timer.pomodoroCount, 0);
  return sanitized;
}

/**
 * Derive pomodoro status from task
 * @param {Object} task - Task object
 * @returns {string} Status ("open", "achieved", "over")
 */
function derivePomodoroStatus(task) {
  if (typeof task.estimatedPomodoros !== "number") return "open";
  if (task.actualPomodoros === task.estimatedPomodoros) return "achieved";
  if (task.actualPomodoros > task.estimatedPomodoros) return "over";
  return "open";
}

/**
 * Get today's date key (YYYY-MM-DD)
 * @returns {string} Today's date key
 */
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Create today summary object
 * @param {string} date - Date key (YYYY-MM-DD)
 * @returns {Object} Today summary object
 */
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

/**
 * Recompute today's completed tasks count
 * @param {Object} state - State object
 * @returns {number} Count of completed tasks today
 */
function recomputeTodayCompletedTasks(state) {
  const todayKey = getTodayKey();
  const completedToday = state.tasks.filter(
    (task) => task.completedAt && task.completedAt.startsWith(todayKey)
  ).length;
  state.today.completedTasks = completedToday;
  return completedToday;
}

/**
 * Safe parse from localStorage
 * @param {string} key - Storage key
 * @param {*} fallback - Fallback value
 * @param {Function} errorHandler - Error handler function
 * @returns {*} Parsed value or fallback
 */
function safeParseStorage(key, fallback, errorHandler) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    }
    return fallback;
  }
}

/**
 * Handle storage error
 * @param {Error} error - Error object
 * @param {Object} elements - Elements object with alert element
 */
function handleStorageError(error, elements) {
  if (!elements || !elements.alert) return;

  let message = "";
  if (error && error.name === "QuotaExceededError") {
    message = ERROR_MESSAGES.E005;
  } else {
    message = ERROR_MESSAGES.E006;
  }

  elements.alert.textContent = message;
  elements.alert.classList.add("is-visible");
}

// ============================================================================
// Export for testing
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Constants
    STORAGE_KEYS,
    ERROR_MESSAGES,
    DEFAULT_SETTINGS,
    DEFAULT_TIMER,

    // Pure functions
    sanitize,
    formatTime,
    formatRelativeTime,
    sanitizeNumber,
    getModeDuration,
    clamp,
    normalizeTask,
    sanitizeTimer,
    derivePomodoroStatus,
    getTodayKey,
    createTodaySummary,
    recomputeTodayCompletedTasks,
    safeParseStorage,
    handleStorageError
  };
}
