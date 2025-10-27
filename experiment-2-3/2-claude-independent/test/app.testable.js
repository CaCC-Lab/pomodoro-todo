// PomoTodo Application - Testable Version
'use strict';

// ========================================
// 定数定義
// ========================================

const STORAGE_KEYS = {
    TASKS: 'pomotodo_tasks',
    TIMER: 'pomotodo_timer',
    SETTINGS: 'pomotodo_settings',
    TODAY: 'pomotodo_today',
    HISTORY: 'pomotodo_history'
};

const TIMER_DEFAULTS = {
    WORK_DURATION: 25 * 60, // 25分（秒）
    SHORT_BREAK: 5 * 60,    // 5分（秒）
    LONG_BREAK: 15 * 60,    // 15分（秒）
    LONG_BREAK_INTERVAL: 4
};

const VALIDATION = {
    MAX_TASK_LENGTH: 100,
    MAX_POMODOROS: 20,
    MIN_TIMER_DURATION: 1,
    MAX_TIMER_DURATION: 60
};

// ========================================
// ユーティリティ関数
// ========================================

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function validateTaskTitle(title) {
    if (!title || !title.trim()) {
        return 'タスク名を入力してください';
    }
    if (title.length > VALIDATION.MAX_TASK_LENGTH) {
        return 'タスク名は100文字以内で入力してください';
    }
    return null;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ========================================
// LocalStorage操作
// ========================================

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            throw new Error('保存容量が不足しています');
        } else {
            throw new Error('データの保存ができません');
        }
    }
}

function loadFromStorage(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

// ========================================
// データモデル
// ========================================

function createTask(title, estimatedPomodoros = null) {
    return {
        id: `task_${Date.now()}`,
        title: sanitizeInput(title),
        completed: false,
        estimatedPomodoros: estimatedPomodoros,
        actualPomodoros: 0,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
}

// ========================================
// タスク管理
// ========================================

function getFilteredTasks(tasks, filterState) {
    switch (filterState) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

// ========================================
// タイマー機能
// ========================================

function calculateTimerProgress(duration, remainingTime) {
    return ((duration - remainingTime) / duration) * 100;
}

function determineNextMode(currentMode, pomodoroCount) {
    if (currentMode === 'work') {
        // 長い休憩の判定
        if (pomodoroCount % TIMER_DEFAULTS.LONG_BREAK_INTERVAL === 0) {
            return 'longBreak';
        } else {
            return 'shortBreak';
        }
    } else {
        return 'work';
    }
}

function getModeDuration(mode) {
    switch (mode) {
        case 'work':
            return TIMER_DEFAULTS.WORK_DURATION;
        case 'shortBreak':
            return TIMER_DEFAULTS.SHORT_BREAK;
        case 'longBreak':
            return TIMER_DEFAULTS.LONG_BREAK;
        default:
            return TIMER_DEFAULTS.WORK_DURATION;
    }
}

// ========================================
// 統計計算
// ========================================

function calculateTotalTime(pomodoroCount) {
    const totalMinutes = pomodoroCount * 25;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
}

function calculateCompletedTasks(tasks) {
    return tasks.filter(t => t.completed).length;
}

// ========================================
// 日付管理
// ========================================

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function isDateChanged(savedDate, currentDate) {
    return savedDate !== currentDate;
}

// ========================================
// エクスポート（テスト用）
// ========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // 定数
        STORAGE_KEYS,
        TIMER_DEFAULTS,
        VALIDATION,

        // ユーティリティ
        sanitizeInput,
        validateTaskTitle,
        formatTime,

        // LocalStorage
        saveToStorage,
        loadFromStorage,

        // データモデル
        createTask,

        // タスク管理
        getFilteredTasks,

        // タイマー
        calculateTimerProgress,
        determineNextMode,
        getModeDuration,

        // 統計
        calculateTotalTime,
        calculateCompletedTasks,

        // 日付管理
        getTodayString,
        isDateChanged
    };
}
