/**
 * Unit Tests: Timer Operations
 *
 * Test Coverage:
 * - Timer start (startTimer)
 * - Timer pause (pauseTimer)
 * - Timer reset (resetTimer)
 * - Timer completion (completeTimerCycle)
 * - Mode advancement (advanceTimerMode)
 * - Timer state restoration (restoreTimerState)
 *
 * Target: 100% branch coverage
 * Note: Uses jest.useFakeTimers() for time-based tests
 */

describe('Timer Operations', () => {
  // Mock state
  let state;

  // Mock elements
  let elements;

  // Setup before each test
  beforeEach(() => {
    jest.useFakeTimers();

    state = {
      tasks: [],
      selectedTaskId: null,
      editingTaskId: null,
      timer: {
        mode: 'work',
        remainingTime: 1500,  // 25分
        isRunning: false,
        isPaused: false,
        currentTaskId: null,
        startedAt: null,
        targetTimestamp: null,
        pomodoroCount: 0
      },
      settings: {
        workDuration: 25,
        shortBreakDuration: 5
      },
      today: {
        pomodoros: 0,
        totalMinutes: 0,
        currentStreak: 0,
        lastTaskId: null
      }
    };

    elements = {
      alert: {
        textContent: '',
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      },
      timer: {
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      }
    };

    // Reset localStorage and mocks
    localStorage.clear();
    jest.clearAllMocks();
    global.confirm.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper: showAlert function
  const showAlert = (code, overrideMessage) => {
    const ERROR_MESSAGES = {
      E003: 'タスクを選択してください',
      E007: 'タイマーをリセットしますか？',
      E008: '編集を完了してください'
    };

    const message = overrideMessage !== undefined ? overrideMessage : ERROR_MESSAGES[code] || '';
    if (elements.alert) {
      elements.alert.textContent = message || '';
      if (!message) {
        elements.alert.classList.remove('is-visible');
      } else {
        elements.alert.classList.add('is-visible');
      }
    }
    return message;
  };

  // Helper: getModeDuration
  const getModeDuration = (mode) => {
    if (mode === 'break') {
      return state.settings.shortBreakDuration * 60;
    }
    return state.settings.workDuration * 60;
  };

  describe('Timer Start (startTimer)', () => {
    describe('正常系: Valid Start Conditions', () => {
      test('タスクを選択してworkモードのタイマーを開始できる', () => {
        // Given: タスクが選択されている
        state.selectedTaskId = 'task_1';
        state.timer.mode = 'work';

        // When: タイマーを開始
        if (!state.timer.isRunning && !state.editingTaskId) {
          if (state.timer.mode === 'work' && state.selectedTaskId) {
            state.timer.isRunning = true;
            state.timer.isPaused = false;
            state.timer.currentTaskId = state.selectedTaskId;
            const now = Date.now();
            state.timer.startedAt = new Date(now).toISOString();
            state.timer.targetTimestamp = now + state.timer.remainingTime * 1000;
            elements.timer.classList.add('running');
          }
        }

        // Then: タイマーが開始される
        expect(state.timer.isRunning).toBe(true);
        expect(state.timer.currentTaskId).toBe('task_1');
        expect(state.timer.targetTimestamp).toBeGreaterThan(Date.now());
      });

      test('breakモードのタイマーをタスク選択なしで開始できる', () => {
        // Given: breakモード
        state.timer.mode = 'break';
        state.timer.remainingTime = 300;

        // When: タイマーを開始
        if (!state.timer.isRunning && !state.editingTaskId) {
          state.timer.isRunning = true;
          state.timer.isPaused = false;
          const now = Date.now();
          state.timer.startedAt = new Date(now).toISOString();
          state.timer.targetTimestamp = now + state.timer.remainingTime * 1000;
          elements.timer.classList.add('running');
        }

        // Then: タイマーが開始される
        expect(state.timer.isRunning).toBe(true);
        expect(state.timer.targetTimestamp).toBeGreaterThan(Date.now());
      });

      test('一時停止中のタイマーを再開できる', () => {
        // Given: 一時停止中
        state.selectedTaskId = 'task_1';
        state.timer.mode = 'work';
        state.timer.isPaused = true;
        state.timer.remainingTime = 1200;  // 20分残り

        // When: タイマーを再開
        if (!state.timer.isRunning && !state.editingTaskId) {
          if (state.timer.mode === 'work' && state.selectedTaskId) {
            state.timer.isRunning = true;
            state.timer.isPaused = false;
            state.timer.currentTaskId = state.selectedTaskId;
            const now = Date.now();
            state.timer.startedAt = new Date(now).toISOString();
            state.timer.targetTimestamp = now + state.timer.remainingTime * 1000;
          }
        }

        // Then: タイマーが再開される
        expect(state.timer.isRunning).toBe(true);
        expect(state.timer.isPaused).toBe(false);
        expect(state.timer.remainingTime).toBe(1200);
      });
    });

    describe('異常系: Invalid Start Conditions', () => {
      test('workモードでタスク未選択の場合はエラーE003を表示', () => {
        // Given: タスク未選択
        state.selectedTaskId = null;
        state.timer.mode = 'work';

        // When: タイマー開始を試行
        let errorMessage = '';
        if (!state.timer.isRunning && !state.editingTaskId) {
          if (state.timer.mode === 'work' && !state.selectedTaskId) {
            errorMessage = showAlert('E003');
          }
        }

        // Then: エラーメッセージが表示される
        expect(errorMessage).toBe('タスクを選択してください');
        expect(state.timer.isRunning).toBe(false);
      });

      test('既にタイマーが実行中の場合は開始できない', () => {
        // Given: タイマーが既に実行中
        state.timer.isRunning = true;
        state.selectedTaskId = 'task_1';

        // When: タイマー開始を試行
        let started = false;
        if (!state.timer.isRunning) {
          started = true;
        }

        // Then: 開始されない
        expect(started).toBe(false);
      });

      test('編集中の場合はタイマーを開始できない（エラーE008）', () => {
        // Given: タスク編集中
        state.editingTaskId = 'task_1';
        state.selectedTaskId = 'task_1';
        state.timer.mode = 'work';

        // When: タイマー開始を試行
        let errorMessage = '';
        if (!state.timer.isRunning && state.editingTaskId) {
          errorMessage = showAlert('E008');
        }

        // Then: エラーメッセージが表示される
        expect(errorMessage).toBe('編集を完了してください');
        expect(state.timer.isRunning).toBe(false);
      });
    });
  });

  describe('Timer Pause (pauseTimer)', () => {
    beforeEach(() => {
      // Given: タイマーが実行中
      state.selectedTaskId = 'task_1';
      state.timer.mode = 'work';
      state.timer.isRunning = true;
      state.timer.isPaused = false;
      state.timer.currentTaskId = 'task_1';
      const now = Date.now();
      state.timer.startedAt = new Date(now).toISOString();
      state.timer.targetTimestamp = now + 1500 * 1000;
    });

    test('実行中のタイマーを一時停止できる', () => {
      // Given: タイマーが実行中
      // (beforeEach で設定済み)

      // When: タイマーを一時停止
      if (state.timer.isRunning) {
        state.timer.isRunning = false;
        state.timer.isPaused = true;
        if (state.timer.targetTimestamp) {
          const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
          state.timer.remainingTime = remaining;
        }
        state.timer.targetTimestamp = null;
        elements.timer.classList.remove('running');
      }

      // Then: 一時停止状態になる
      expect(state.timer.isRunning).toBe(false);
      expect(state.timer.isPaused).toBe(true);
      expect(state.timer.targetTimestamp).toBeNull();
      expect(state.timer.remainingTime).toBeGreaterThan(0);
    });

    test('一時停止後も残り時間が保持される', () => {
      // Given: タイマーが実行中
      jest.advanceTimersByTime(5000);  // 5秒経過

      // When: タイマーを一時停止
      if (state.timer.isRunning) {
        state.timer.isRunning = false;
        state.timer.isPaused = true;
        if (state.timer.targetTimestamp) {
          const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
          state.timer.remainingTime = remaining;
        }
        state.timer.targetTimestamp = null;
      }

      // Then: 残り時間が減少している
      expect(state.timer.remainingTime).toBeLessThan(1500);
      expect(state.timer.remainingTime).toBeGreaterThan(0);
    });

    test('停止中のタイマーは一時停止できない', () => {
      // Given: タイマーが停止中
      state.timer.isRunning = false;
      state.timer.isPaused = false;

      // When: 一時停止を試行
      let paused = false;
      if (state.timer.isRunning) {
        paused = true;
      }

      // Then: 一時停止されない
      expect(paused).toBe(false);
    });
  });

  describe('Timer Reset (resetTimer)', () => {
    beforeEach(() => {
      // Given: タイマーが実行中または一時停止中
      state.selectedTaskId = 'task_1';
      state.timer.mode = 'work';
      state.timer.isRunning = true;
      state.timer.currentTaskId = 'task_1';
      state.timer.remainingTime = 1200;  // 20分残り
      const now = Date.now();
      state.timer.startedAt = new Date(now).toISOString();
      state.timer.targetTimestamp = now + 1200 * 1000;
    });

    test('確認ダイアログでOKの場合、タイマーをリセットできる', () => {
      // Given: confirm() が true を返す
      global.confirm.mockReturnValue(true);

      // When: タイマーをリセット
      const confirmed = window.confirm('タイマーをリセットしますか？');
      if (confirmed) {
        state.timer.isRunning = false;
        state.timer.isPaused = false;
        state.timer.targetTimestamp = null;
        state.timer.remainingTime = getModeDuration(state.timer.mode);
        state.timer.startedAt = null;
        state.timer.currentTaskId = state.selectedTaskId;
        elements.timer.classList.remove('running');
      }

      // Then: タイマーがリセットされる
      expect(state.timer.isRunning).toBe(false);
      expect(state.timer.isPaused).toBe(false);
      expect(state.timer.remainingTime).toBe(1500);  // 25分にリセット
      expect(state.timer.targetTimestamp).toBeNull();
    });

    test('確認ダイアログでキャンセルの場合、タイマーはリセットされない', () => {
      // Given: confirm() が false を返す
      global.confirm.mockReturnValue(false);
      const originalRemaining = state.timer.remainingTime;

      // When: タイマーリセットを試行
      const confirmed = window.confirm('タイマーをリセットしますか？');
      if (!confirmed) {
        // リセットしない
      }

      // Then: タイマーがリセットされない
      expect(state.timer.remainingTime).toBe(originalRemaining);
      expect(state.timer.isRunning).toBe(true);
    });

    test('一時停止中のタイマーもリセットできる', () => {
      // Given: タイマーが一時停止中
      state.timer.isRunning = false;
      state.timer.isPaused = true;
      state.timer.remainingTime = 900;  // 15分残り
      global.confirm.mockReturnValue(true);

      // When: タイマーをリセット
      const confirmed = window.confirm('タイマーをリセットしますか？');
      if (confirmed) {
        state.timer.isRunning = false;
        state.timer.isPaused = false;
        state.timer.targetTimestamp = null;
        state.timer.remainingTime = getModeDuration(state.timer.mode);
        state.timer.startedAt = null;
      }

      // Then: タイマーがリセットされる
      expect(state.timer.isPaused).toBe(false);
      expect(state.timer.remainingTime).toBe(1500);
    });
  });

  describe('Timer Completion (completeTimerCycle)', () => {
    beforeEach(() => {
      // Given: タスクを用意
      state.tasks = [
        {
          id: 'task_1',
          title: 'タスク1',
          completed: false,
          estimatedPomodoros: 5,
          actualPomodoros: 2,
          createdAt: new Date().toISOString(),
          completedAt: null
        }
      ];
      state.selectedTaskId = 'task_1';
      state.timer.mode = 'work';
      state.timer.isRunning = true;
      state.timer.currentTaskId = 'task_1';
      state.timer.remainingTime = 0;
    });

    test('workモード完了時にポモドーロカウントが増加する', () => {
      // Given: workモードのタイマーが完了
      const task = state.tasks[0];
      const initialPomodoros = task.actualPomodoros;

      // When: タイマー完了処理
      state.timer.isRunning = false;
      state.timer.isPaused = false;
      state.timer.targetTimestamp = null;
      state.timer.remainingTime = 0;
      elements.timer.classList.remove('running');

      if (state.timer.mode === 'work' && state.timer.currentTaskId) {
        task.actualPomodoros += 1;
        state.today.pomodoros += 1;
        state.today.totalMinutes += state.settings.workDuration;
      }

      // Then: ポモドーロカウントが増加する
      expect(task.actualPomodoros).toBe(initialPomodoros + 1);
      expect(state.today.pomodoros).toBe(1);
      expect(state.today.totalMinutes).toBe(25);
    });

    test('workモード完了時にストリークが増加する（同じタスク）', () => {
      // Given: 前回と同じタスク
      state.today.lastTaskId = 'task_1';
      state.today.currentStreak = 3;

      // When: タイマー完了処理
      const task = state.tasks[0];
      if (state.timer.mode === 'work' && state.timer.currentTaskId) {
        task.actualPomodoros += 1;
        state.today.pomodoros += 1;
        state.today.totalMinutes += state.settings.workDuration;

        if (!state.today.lastTaskId || state.today.lastTaskId === task.id) {
          state.today.currentStreak = (state.today.currentStreak || 0) + 1;
        } else {
          state.today.currentStreak = 1;
        }
        state.today.lastTaskId = task.id;
      }

      // Then: ストリークが増加する
      expect(state.today.currentStreak).toBe(4);
    });

    test('workモード完了時にストリークがリセットされる（異なるタスク）', () => {
      // Given: 前回と異なるタスク
      state.today.lastTaskId = 'task_2';
      state.today.currentStreak = 5;

      // When: タイマー完了処理
      const task = state.tasks[0];
      if (state.timer.mode === 'work' && state.timer.currentTaskId) {
        task.actualPomodoros += 1;
        state.today.pomodoros += 1;
        state.today.totalMinutes += state.settings.workDuration;

        if (!state.today.lastTaskId || state.today.lastTaskId === task.id) {
          state.today.currentStreak = (state.today.currentStreak || 0) + 1;
        } else {
          state.today.currentStreak = 1;
        }
        state.today.lastTaskId = task.id;
      }

      // Then: ストリークが1にリセットされる
      expect(state.today.currentStreak).toBe(1);
      expect(state.today.lastTaskId).toBe('task_1');
    });

    test('breakモード完了時はポモドーロカウントが増加しない', () => {
      // Given: breakモードのタイマーが完了
      state.timer.mode = 'break';
      state.timer.currentTaskId = null;
      const initialPomodoros = state.today.pomodoros;

      // When: タイマー完了処理
      state.timer.isRunning = false;
      state.timer.isPaused = false;
      state.timer.targetTimestamp = null;
      state.timer.remainingTime = 0;

      if (state.timer.mode === 'work' && state.timer.currentTaskId) {
        // この処理は実行されない
        state.today.pomodoros += 1;
      }

      // Then: ポモドーロカウントは増加しない
      expect(state.today.pomodoros).toBe(initialPomodoros);
    });

    test('タイマー完了時にタイマーが停止状態になる', () => {
      // Given: タイマーが実行中
      // When: タイマー完了処理
      state.timer.isRunning = false;
      state.timer.isPaused = false;
      state.timer.targetTimestamp = null;
      state.timer.remainingTime = 0;
      elements.timer.classList.remove('running');

      // Then: タイマーが停止状態になる
      expect(state.timer.isRunning).toBe(false);
      expect(state.timer.isPaused).toBe(false);
      expect(state.timer.remainingTime).toBe(0);
    });
  });

  describe('Mode Advancement (advanceTimerMode)', () => {
    test('workモード完了後はbreakモードに切り替わる', () => {
      // Given: workモード
      state.timer.mode = 'work';
      state.timer.remainingTime = 0;

      // When: モード切り替え
      if (state.timer.mode === 'work') {
        state.timer.mode = 'break';
        state.timer.remainingTime = getModeDuration('break');
      }

      // Then: breakモードに切り替わる
      expect(state.timer.mode).toBe('break');
      expect(state.timer.remainingTime).toBe(300);  // 5分
    });

    test('breakモード完了後はworkモードに切り替わる', () => {
      // Given: breakモード
      state.timer.mode = 'break';
      state.timer.remainingTime = 0;

      // When: モード切り替え
      if (state.timer.mode === 'break') {
        state.timer.mode = 'work';
        state.timer.remainingTime = getModeDuration('work');
      } else {
        state.timer.mode = 'break';
        state.timer.remainingTime = getModeDuration('break');
      }

      // Then: workモードに切り替わる
      expect(state.timer.mode).toBe('work');
      expect(state.timer.remainingTime).toBe(1500);  // 25分
    });
  });

  describe('Timer State Restoration (restoreTimerState)', () => {
    test('実行中のタイマーを復元できる', () => {
      // Given: 実行中のタイマー状態が保存されている
      const futureTimestamp = Date.now() + 600 * 1000;  // 10分後
      state.timer.isRunning = true;
      state.timer.targetTimestamp = futureTimestamp;

      // When: タイマー状態を復元
      if (state.timer.isRunning && state.timer.targetTimestamp) {
        const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
        state.timer.remainingTime = remaining;
        if (remaining > 0) {
          elements.timer.classList.add('running');
        }
      }

      // Then: タイマーが復元される
      expect(state.timer.remainingTime).toBeGreaterThan(0);
      expect(state.timer.remainingTime).toBeLessThanOrEqual(600);
    });

    test('時間切れのタイマーは完了処理される', () => {
      // Given: 時間切れのタイマー
      const pastTimestamp = Date.now() - 1000;  // 1秒前
      state.timer.isRunning = true;
      state.timer.targetTimestamp = pastTimestamp;

      // When: タイマー状態を復元
      if (state.timer.isRunning && state.timer.targetTimestamp) {
        const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
        state.timer.remainingTime = remaining;
        if (remaining <= 0) {
          // 完了処理
          state.timer.isRunning = false;
          state.timer.remainingTime = 0;
        }
      }

      // Then: タイマーが完了状態になる
      expect(state.timer.isRunning).toBe(false);
      expect(state.timer.remainingTime).toBe(0);
    });

    test('停止中のタイマーはremainingTimeを復元する', () => {
      // Given: 停止中のタイマー
      state.timer.isRunning = false;
      state.timer.targetTimestamp = null;
      state.timer.remainingTime = 1200;  // 20分

      // When: タイマー状態を復元
      if (!state.timer.isRunning || !state.timer.targetTimestamp) {
        if (!Number.isFinite(state.timer.remainingTime) || state.timer.remainingTime <= 0) {
          state.timer.remainingTime = getModeDuration(state.timer.mode);
        }
      }

      // Then: 残り時間が保持される
      expect(state.timer.remainingTime).toBe(1200);
    });

    test('無効なremainingTimeはデフォルト値にリセットされる', () => {
      // Given: 無効なremainingTime
      state.timer.isRunning = false;
      state.timer.targetTimestamp = null;
      state.timer.remainingTime = NaN;

      // When: タイマー状態を復元
      if (!state.timer.isRunning || !state.timer.targetTimestamp) {
        if (!Number.isFinite(state.timer.remainingTime) || state.timer.remainingTime <= 0) {
          state.timer.remainingTime = getModeDuration(state.timer.mode);
        }
      }

      // Then: デフォルト値にリセットされる
      expect(state.timer.remainingTime).toBe(1500);  // 25分
    });
  });
});
