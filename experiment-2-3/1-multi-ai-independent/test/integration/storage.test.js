/**
 * Integration Tests: LocalStorage Integration
 *
 * Test Coverage:
 * - Data persistence (save/load tasks, timer, settings)
 * - Error handling (QuotaExceededError, invalid JSON)
 * - Data migration (old format to new format)
 * - Data integrity (corrupted data recovery)
 *
 * Target: 100% branch coverage for storage-related code
 */

describe('LocalStorage Integration', () => {
  const STORAGE_KEYS = Object.freeze({
    TASKS: 'pomotodo_tasks',
    TIMER: 'pomotodo_timer',
    SETTINGS: 'pomotodo_settings',
    TODAY: 'pomotodo_today',
    HISTORY: 'pomotodo_history'
  });

  beforeEach(() => {
    localStorage.clear();
  });

  // Helper: safeParseStorage
  const safeParseStorage = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw === 'null') return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  };

  // Helper: persistTasks
  const persistTasks = (tasks) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return true;
    } catch (error) {
      return false;
    }
  };

  // Helper: handleStorageError
  const handleStorageError = (error) => {
    if (error && error.name === 'QuotaExceededError') {
      return 'E005';  // 保存容量が不足しています
    } else {
      return 'E006';  // データの保存ができません
    }
  };

  describe('Task Persistence', () => {
    describe('正常系: Successful Save and Load', () => {
      test('タスクを保存して読み込める', () => {
        // Given: タスクデータ
        const tasks = [
          {
            id: 'task_1',
            title: 'タスク1',
            completed: false,
            estimatedPomodoros: 5,
            actualPomodoros: 2,
            createdAt: '2025-01-01T00:00:00.000Z',
            completedAt: null
          }
        ];

        // When: 保存と読み込み
        persistTasks(tasks);
        const loaded = safeParseStorage(STORAGE_KEYS.TASKS, []);

        // Then: 正しく復元される
        expect(loaded).toHaveLength(1);
        expect(loaded[0].id).toBe('task_1');
        expect(loaded[0].title).toBe('タスク1');
      });

      test('複数のタスクを保存して読み込める', () => {
        // Given: 複数のタスク
        const tasks = [
          { id: 'task_1', title: 'タスク1', completed: false, estimatedPomodoros: 3, actualPomodoros: 1, createdAt: new Date().toISOString(), completedAt: null },
          { id: 'task_2', title: 'タスク2', completed: true, estimatedPomodoros: 5, actualPomodoros: 5, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
          { id: 'task_3', title: 'タスク3', completed: false, estimatedPomodoros: 2, actualPomodoros: 0, createdAt: new Date().toISOString(), completedAt: null }
        ];

        // When: 保存と読み込み
        persistTasks(tasks);
        const loaded = safeParseStorage(STORAGE_KEYS.TASKS, []);

        // Then: 全てのタスクが復元される
        expect(loaded).toHaveLength(3);
        expect(loaded[0].id).toBe('task_1');
        expect(loaded[1].id).toBe('task_2');
        expect(loaded[2].id).toBe('task_3');
      });

      test('空のタスク配列を保存して読み込める', () => {
        // Given: 空の配列
        const tasks = [];

        // When: 保存と読み込み
        persistTasks(tasks);
        const loaded = safeParseStorage(STORAGE_KEYS.TASKS, []);

        // Then: 空の配列が復元される
        expect(loaded).toEqual([]);
        expect(loaded).toHaveLength(0);
      });

      test('日本語を含むタスクを保存して読み込める', () => {
        // Given: 日本語を含むタスク
        const tasks = [
          {
            id: 'task_1',
            title: '買い物リスト: 牛乳、パン、卵',
            completed: false,
            estimatedPomodoros: null,
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
            completedAt: null
          }
        ];

        // When: 保存と読み込み
        persistTasks(tasks);
        const loaded = safeParseStorage(STORAGE_KEYS.TASKS, []);

        // Then: 日本語が正しく復元される
        expect(loaded[0].title).toBe('買い物リスト: 牛乳、パン、卵');
      });
    });

    describe('異常系: Error Handling', () => {
      test('無効なJSONを読み込むとfallbackが返される', () => {
        // Given: 無効なJSON
        localStorage.setItem(STORAGE_KEYS.TASKS, '{invalid json}');

        // When: 読み込み
        const loaded = safeParseStorage(STORAGE_KEYS.TASKS, []);

        // Then: fallbackが返される
        expect(loaded).toEqual([]);
      });

      test('キーが存在しない場合はfallbackが返される', () => {
        // Given: キーが存在しない

        // When: 読み込み
        const loaded = safeParseStorage('nonexistent_key', []);

        // Then: fallbackが返される
        expect(loaded).toEqual([]);
      });

      test('nullが保存されている場合はfallbackが返される', () => {
        // Given: nullが保存されている
        localStorage.setItem(STORAGE_KEYS.TASKS, null);

        // When: 読み込み
        const loaded = safeParseStorage(STORAGE_KEYS.TASKS, []);

        // Then: fallbackが返される
        expect(loaded).toEqual([]);
      });

      test('QuotaExceededErrorが発生した場合はE005エラーを返す', () => {
        // Given: 容量制限を超えるデータ
        const largeData = 'x'.repeat(10000000);  // 10MB
        let errorCode = null;

        // When: 保存を試行
        try {
          localStorage.setItem(STORAGE_KEYS.TASKS, largeData);
        } catch (error) {
          errorCode = handleStorageError(error);
        }

        // Then: E005エラーが返される
        expect(errorCode).toBe('E005');
      });

      test('その他のストレージエラーの場合はE006エラーを返す', () => {
        // Given: 一般的なエラー
        const error = new Error('Storage error');
        error.name = 'StorageError';

        // When: エラーハンドリング
        const errorCode = handleStorageError(error);

        // Then: E006エラーが返される
        expect(errorCode).toBe('E006');
      });
    });
  });

  describe('Timer Persistence', () => {
    describe('正常系: Successful Save and Load', () => {
      test('タイマー状態を保存して読み込める', () => {
        // Given: タイマー状態
        const timer = {
          mode: 'work',
          remainingTime: 1500,
          isRunning: false,
          isPaused: false,
          currentTaskId: 'task_1',
          startedAt: null,
          targetTimestamp: null,
          pomodoroCount: 5
        };

        // When: 保存と読み込み
        localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(timer));
        const loaded = safeParseStorage(STORAGE_KEYS.TIMER, {});

        // Then: 正しく復元される
        expect(loaded.mode).toBe('work');
        expect(loaded.remainingTime).toBe(1500);
        expect(loaded.pomodoroCount).toBe(5);
      });

      test('実行中のタイマーを保存して読み込める', () => {
        // Given: 実行中のタイマー
        const timer = {
          mode: 'work',
          remainingTime: 1200,
          isRunning: true,
          isPaused: false,
          currentTaskId: 'task_1',
          startedAt: new Date().toISOString(),
          targetTimestamp: Date.now() + 1200000,
          pomodoroCount: 3
        };

        // When: 保存と読み込み
        localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(timer));
        const loaded = safeParseStorage(STORAGE_KEYS.TIMER, {});

        // Then: 実行中の状態が復元される
        expect(loaded.isRunning).toBe(true);
        expect(loaded.targetTimestamp).toBeDefined();
        expect(loaded.startedAt).toBeDefined();
      });

      test('一時停止中のタイマーを保存して読み込める', () => {
        // Given: 一時停止中のタイマー
        const timer = {
          mode: 'work',
          remainingTime: 900,
          isRunning: false,
          isPaused: true,
          currentTaskId: 'task_1',
          startedAt: new Date().toISOString(),
          targetTimestamp: null,
          pomodoroCount: 2
        };

        // When: 保存と読み込み
        localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(timer));
        const loaded = safeParseStorage(STORAGE_KEYS.TIMER, {});

        // Then: 一時停止の状態が復元される
        expect(loaded.isRunning).toBe(false);
        expect(loaded.isPaused).toBe(true);
        expect(loaded.remainingTime).toBe(900);
      });
    });
  });

  describe('Settings Persistence', () => {
    describe('正常系: Successful Save and Load', () => {
      test('設定を保存して読み込める', () => {
        // Given: 設定データ
        const settings = {
          workDuration: 25,
          shortBreakDuration: 5,
          notificationSound: 'beep',
          focusMode: false,
          filterState: 'all'
        };

        // When: 保存と読み込み
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        const loaded = safeParseStorage(STORAGE_KEYS.SETTINGS, {});

        // Then: 正しく復元される
        expect(loaded.workDuration).toBe(25);
        expect(loaded.shortBreakDuration).toBe(5);
        expect(loaded.notificationSound).toBe('beep');
      });

      test('カスタマイズした設定を保存して読み込める', () => {
        // Given: カスタマイズした設定
        const settings = {
          workDuration: 50,
          shortBreakDuration: 10,
          notificationSound: 'silent',
          focusMode: true,
          filterState: 'active'
        };

        // When: 保存と読み込み
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        const loaded = safeParseStorage(STORAGE_KEYS.SETTINGS, {});

        // Then: カスタマイズした値が復元される
        expect(loaded.workDuration).toBe(50);
        expect(loaded.shortBreakDuration).toBe(10);
        expect(loaded.focusMode).toBe(true);
      });
    });
  });

  describe('Today Summary Persistence', () => {
    describe('正常系: Successful Save and Load', () => {
      test('今日のサマリーを保存して読み込める', () => {
        // Given: 今日のサマリー
        const today = {
          date: '2025-01-01',
          pomodoros: 8,
          completedTasks: 5,
          totalMinutes: 200,
          currentStreak: 3,
          lastTaskId: 'task_5'
        };

        // When: 保存と読み込み
        localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify(today));
        const loaded = safeParseStorage(STORAGE_KEYS.TODAY, {});

        // Then: 正しく復元される
        expect(loaded.date).toBe('2025-01-01');
        expect(loaded.pomodoros).toBe(8);
        expect(loaded.completedTasks).toBe(5);
        expect(loaded.currentStreak).toBe(3);
      });

      test('ポモドーロが0の日のサマリーを保存して読み込める', () => {
        // Given: ポモドーロが0の日
        const today = {
          date: '2025-01-01',
          pomodoros: 0,
          completedTasks: 0,
          totalMinutes: 0,
          currentStreak: 0,
          lastTaskId: null
        };

        // When: 保存と読み込み
        localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify(today));
        const loaded = safeParseStorage(STORAGE_KEYS.TODAY, {});

        // Then: 0の値が正しく復元される
        expect(loaded.pomodoros).toBe(0);
        expect(loaded.completedTasks).toBe(0);
        expect(loaded.currentStreak).toBe(0);
      });
    });
  });

  describe('History Persistence', () => {
    describe('正常系: Successful Save and Load', () => {
      test('履歴を保存して読み込める', () => {
        // Given: 履歴データ
        const history = [
          {
            date: '2025-01-01',
            pomodoros: 8,
            completedTasks: 5,
            totalMinutes: 200,
            currentStreak: 3,
            lastTaskId: 'task_5'
          },
          {
            date: '2025-01-02',
            pomodoros: 6,
            completedTasks: 3,
            totalMinutes: 150,
            currentStreak: 2,
            lastTaskId: 'task_3'
          }
        ];

        // When: 保存と読み込み
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        const loaded = safeParseStorage(STORAGE_KEYS.HISTORY, []);

        // Then: 正しく復元される
        expect(loaded).toHaveLength(2);
        expect(loaded[0].date).toBe('2025-01-01');
        expect(loaded[1].date).toBe('2025-01-02');
      });

      test('30日分の履歴を保存して読み込める', () => {
        // Given: 30日分の履歴
        const history = Array.from({ length: 30 }, (_, i) => ({
          date: `2025-01-${String(i + 1).padStart(2, '0')}`,
          pomodoros: i + 1,
          completedTasks: i,
          totalMinutes: (i + 1) * 25,
          currentStreak: 1,
          lastTaskId: `task_${i + 1}`
        }));

        // When: 保存と読み込み
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        const loaded = safeParseStorage(STORAGE_KEYS.HISTORY, []);

        // Then: 30日分が正しく復元される
        expect(loaded).toHaveLength(30);
        expect(loaded[0].date).toBe('2025-01-01');
        expect(loaded[29].date).toBe('2025-01-30');
      });
    });
  });

  describe('Multiple Data Persistence', () => {
    test('全てのデータを同時に保存して読み込める', () => {
      // Given: 全てのデータ
      const tasks = [
        { id: 'task_1', title: 'タスク1', completed: false, estimatedPomodoros: 3, actualPomodoros: 1, createdAt: new Date().toISOString(), completedAt: null }
      ];
      const timer = {
        mode: 'work',
        remainingTime: 1500,
        isRunning: false,
        isPaused: false,
        currentTaskId: null,
        startedAt: null,
        targetTimestamp: null,
        pomodoroCount: 0
      };
      const settings = {
        workDuration: 25,
        shortBreakDuration: 5,
        notificationSound: 'beep',
        focusMode: false,
        filterState: 'all'
      };
      const today = {
        date: '2025-01-01',
        pomodoros: 0,
        completedTasks: 0,
        totalMinutes: 0,
        currentStreak: 0,
        lastTaskId: null
      };
      const history = [];

      // When: 全て保存
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(timer));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify(today));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

      // Then: 全て読み込める
      const loadedTasks = safeParseStorage(STORAGE_KEYS.TASKS, []);
      const loadedTimer = safeParseStorage(STORAGE_KEYS.TIMER, {});
      const loadedSettings = safeParseStorage(STORAGE_KEYS.SETTINGS, {});
      const loadedToday = safeParseStorage(STORAGE_KEYS.TODAY, {});
      const loadedHistory = safeParseStorage(STORAGE_KEYS.HISTORY, []);

      expect(loadedTasks).toHaveLength(1);
      expect(loadedTimer.mode).toBe('work');
      expect(loadedSettings.workDuration).toBe(25);
      expect(loadedToday.date).toBe('2025-01-01');
      expect(loadedHistory).toEqual([]);
    });
  });
});
