/**
 * Integration Tests: Timer Lifecycle
 *
 * Test Coverage:
 * - Full timer lifecycle: start → pause → resume → complete
 * - Mode transitions (work ⇔ break)
 * - Timer restoration after page reload
 * - Edge cases (time elapsed during background, invalid states)
 *
 * Target: End-to-end timer workflows
 */

describe('Timer Lifecycle Integration', () => {
  // Mock state
  let state;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();

    state = {
      tasks: [],
      selectedTaskId: null,
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
        date: new Date().toISOString().slice(0, 10),
        pomodoros: 0,
        completedTasks: 0,
        totalMinutes: 0,
        currentStreak: 0,
        lastTaskId: null
      }
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper functions
  const createTask = (id, title) => {
    const task = {
      id,
      title,
      completed: false,
      estimatedPomodoros: 5,
      actualPomodoros: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    state.tasks.push(task);
    return task;
  };

  const selectTask = (taskId) => {
    if (!state.timer.isRunning) {
      state.selectedTaskId = taskId;
      state.timer.currentTaskId = taskId;
      return true;
    }
    return false;
  };

  const startTimer = () => {
    if (state.timer.isRunning) return false;
    if (state.timer.mode === 'work' && !state.selectedTaskId) return false;

    state.timer.isRunning = true;
    state.timer.isPaused = false;
    const now = Date.now();
    state.timer.startedAt = new Date(now).toISOString();
    state.timer.targetTimestamp = now + state.timer.remainingTime * 1000;
    return true;
  };

  const pauseTimer = () => {
    if (!state.timer.isRunning) return false;

    state.timer.isRunning = false;
    state.timer.isPaused = true;
    if (state.timer.targetTimestamp) {
      const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
      state.timer.remainingTime = remaining;
    }
    state.timer.targetTimestamp = null;
    return true;
  };

  const resetTimer = () => {
    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.targetTimestamp = null;
    const duration = state.timer.mode === 'break'
      ? state.settings.shortBreakDuration * 60
      : state.settings.workDuration * 60;
    state.timer.remainingTime = duration;
    state.timer.startedAt = null;
    state.timer.currentTaskId = state.selectedTaskId;
    return true;
  };

  const tick = () => {
    if (!state.timer.isRunning || !state.timer.targetTimestamp) return 0;
    const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
    state.timer.remainingTime = remaining;
    return remaining;
  };

  const completeTimerCycle = () => {
    if (!state.timer.isRunning) return false;

    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.targetTimestamp = null;
    state.timer.remainingTime = 0;

    // Handle work completion
    if (state.timer.mode === 'work' && state.timer.currentTaskId) {
      const task = state.tasks.find(t => t.id === state.timer.currentTaskId);
      if (task) {
        task.actualPomodoros += 1;
        state.today.pomodoros += 1;
        state.today.totalMinutes += state.settings.workDuration;
      }
    }

    // Advance mode
    if (state.timer.mode === 'work') {
      state.timer.mode = 'break';
      state.timer.remainingTime = state.settings.shortBreakDuration * 60;
    } else {
      state.timer.mode = 'work';
      state.timer.remainingTime = state.settings.workDuration * 60;
    }

    return true;
  };

  const restoreTimerState = (savedTimer) => {
    state.timer = { ...state.timer, ...savedTimer };

    if (!state.timer.isRunning || !state.timer.targetTimestamp) {
      if (!Number.isFinite(state.timer.remainingTime) || state.timer.remainingTime <= 0) {
        const duration = state.timer.mode === 'break'
          ? state.settings.shortBreakDuration * 60
          : state.settings.workDuration * 60;
        state.timer.remainingTime = duration;
      }
      return 'stopped';
    }

    const remaining = Math.max(0, Math.round((state.timer.targetTimestamp - Date.now()) / 1000));
    state.timer.remainingTime = remaining;

    if (remaining <= 0) {
      completeTimerCycle();
      return 'completed';
    }

    return 'running';
  };

  describe('Basic Timer Lifecycle', () => {
    test('タイマーを開始→一時停止→再開→完了できる', () => {
      // Given: タスクを選択
      const task = createTask('task_1', 'テストタスク');
      selectTask(task.id);

      // When: タイマー開始
      const started = startTimer();

      // Then: タイマーが開始される
      expect(started).toBe(true);
      expect(state.timer.isRunning).toBe(true);
      expect(state.timer.targetTimestamp).toBeDefined();

      // When: 10分経過
      jest.advanceTimersByTime(10 * 60 * 1000);
      tick();

      // Then: 残り時間が減少
      expect(state.timer.remainingTime).toBeLessThan(1500);
      expect(state.timer.remainingTime).toBeGreaterThan(0);

      // When: 一時停止
      const paused = pauseTimer();

      // Then: 一時停止状態になる
      expect(paused).toBe(true);
      expect(state.timer.isRunning).toBe(false);
      expect(state.timer.isPaused).toBe(true);
      expect(state.timer.targetTimestamp).toBeNull();

      // When: 再開
      const resumed = startTimer();

      // Then: 再開される
      expect(resumed).toBe(true);
      expect(state.timer.isRunning).toBe(true);
      expect(state.timer.isPaused).toBe(false);

      // When: 残り時間まで経過
      const currentRemaining = state.timer.remainingTime;
      jest.advanceTimersByTime(currentRemaining * 1000);
      tick();

      // Then: 時間切れ
      expect(state.timer.remainingTime).toBe(0);

      // When: タイマー完了処理
      completeTimerCycle();

      // Then: ポモドーロカウントが増加
      expect(task.actualPomodoros).toBe(1);
      expect(state.today.pomodoros).toBe(1);
    });

    test('タイマーをリセットできる', () => {
      // Given: タスクを選択してタイマー開始
      const task = createTask('task_1', 'テストタスク');
      selectTask(task.id);
      startTimer();

      // When: 10分経過
      jest.advanceTimersByTime(10 * 60 * 1000);
      tick();

      // Then: 残り時間が減少
      expect(state.timer.remainingTime).toBeLessThan(1500);

      // When: リセット
      resetTimer();

      // Then: 初期状態に戻る
      expect(state.timer.isRunning).toBe(false);
      expect(state.timer.isPaused).toBe(false);
      expect(state.timer.remainingTime).toBe(1500);
    });
  });

  describe('Mode Transitions', () => {
    test('workモード完了後はbreakモードに切り替わる', () => {
      // Given: workモードでタイマー開始
      const task = createTask('task_1', 'テストタスク');
      selectTask(task.id);
      startTimer();

      // When: 25分経過してタイマー完了
      jest.advanceTimersByTime(25 * 60 * 1000);
      tick();
      completeTimerCycle();

      // Then: breakモードに切り替わる
      expect(state.timer.mode).toBe('break');
      expect(state.timer.remainingTime).toBe(300);  // 5分
      expect(task.actualPomodoros).toBe(1);
    });

    test('breakモード完了後はworkモードに切り替わる', () => {
      // Given: breakモード
      state.timer.mode = 'break';
      state.timer.remainingTime = 300;
      startTimer();

      // When: 5分経過してタイマー完了
      jest.advanceTimersByTime(5 * 60 * 1000);
      tick();
      completeTimerCycle();

      // Then: workモードに切り替わる
      expect(state.timer.mode).toBe('work');
      expect(state.timer.remainingTime).toBe(1500);  // 25分
    });

    test('複数のワークサイクルを実行できる', () => {
      // Given: タスクを選択
      const task = createTask('task_1', '長時間作業');
      selectTask(task.id);

      // Cycle 1: Work → Break
      startTimer();
      jest.advanceTimersByTime(25 * 60 * 1000);
      tick();
      completeTimerCycle();

      expect(state.timer.mode).toBe('break');
      expect(task.actualPomodoros).toBe(1);

      // Cycle 2: Break → Work
      startTimer();
      jest.advanceTimersByTime(5 * 60 * 1000);
      tick();
      completeTimerCycle();

      expect(state.timer.mode).toBe('work');

      // Cycle 3: Work → Break
      startTimer();
      jest.advanceTimersByTime(25 * 60 * 1000);
      tick();
      completeTimerCycle();

      expect(state.timer.mode).toBe('break');
      expect(task.actualPomodoros).toBe(2);
      expect(state.today.pomodoros).toBe(2);
      expect(state.today.totalMinutes).toBe(50);  // 25 * 2
    });
  });

  describe('Timer State Restoration', () => {
    test('実行中のタイマーを復元できる', () => {
      // Given: 実行中のタイマー状態を保存
      const futureTimestamp = Date.now() + 600 * 1000;  // 10分後
      const savedTimer = {
        mode: 'work',
        remainingTime: 600,
        isRunning: true,
        isPaused: false,
        currentTaskId: 'task_1',
        startedAt: new Date(Date.now() - 900000).toISOString(),
        targetTimestamp: futureTimestamp,
        pomodoroCount: 2
      };

      // When: タイマー状態を復元
      const status = restoreTimerState(savedTimer);

      // Then: 実行中として復元される
      expect(status).toBe('running');
      expect(state.timer.isRunning).toBe(true);
      expect(state.timer.remainingTime).toBeGreaterThan(0);
      expect(state.timer.remainingTime).toBeLessThanOrEqual(600);
    });

    test('時間切れのタイマーは完了処理される', () => {
      // Given: 時間切れのタイマー状態
      const task = createTask('task_1', 'テストタスク');
      const pastTimestamp = Date.now() - 1000;  // 1秒前
      const savedTimer = {
        mode: 'work',
        remainingTime: 0,
        isRunning: true,
        isPaused: false,
        currentTaskId: task.id,
        startedAt: new Date(Date.now() - 1500000).toISOString(),
        targetTimestamp: pastTimestamp,
        pomodoroCount: 0
      };

      // When: タイマー状態を復元
      const status = restoreTimerState(savedTimer);

      // Then: 完了処理される
      expect(status).toBe('completed');
      expect(state.timer.isRunning).toBe(false);
      expect(state.timer.mode).toBe('break');  // workからbreakに切り替わる
    });

    test('停止中のタイマーは残り時間を復元する', () => {
      // Given: 停止中のタイマー状態
      const savedTimer = {
        mode: 'work',
        remainingTime: 1200,  // 20分
        isRunning: false,
        isPaused: false,
        currentTaskId: null,
        startedAt: null,
        targetTimestamp: null,
        pomodoroCount: 0
      };

      // When: タイマー状態を復元
      const status = restoreTimerState(savedTimer);

      // Then: 停止状態として復元される
      expect(status).toBe('stopped');
      expect(state.timer.remainingTime).toBe(1200);
      expect(state.timer.isRunning).toBe(false);
    });

    test('無効な残り時間はデフォルト値にリセットされる', () => {
      // Given: 無効な残り時間の状態
      const savedTimer = {
        mode: 'work',
        remainingTime: NaN,
        isRunning: false,
        isPaused: false,
        currentTaskId: null,
        startedAt: null,
        targetTimestamp: null,
        pomodoroCount: 0
      };

      // When: タイマー状態を復元
      const status = restoreTimerState(savedTimer);

      // Then: デフォルト値にリセットされる
      expect(status).toBe('stopped');
      expect(state.timer.remainingTime).toBe(1500);  // 25分
    });

    test('一時停止中のタイマーを復元できる', () => {
      // Given: 一時停止中のタイマー状態
      const savedTimer = {
        mode: 'work',
        remainingTime: 900,  // 15分
        isRunning: false,
        isPaused: true,
        currentTaskId: 'task_1',
        startedAt: new Date(Date.now() - 600000).toISOString(),
        targetTimestamp: null,
        pomodoroCount: 1
      };

      // When: タイマー状態を復元
      const status = restoreTimerState(savedTimer);

      // Then: 一時停止状態として復元される
      expect(status).toBe('stopped');
      expect(state.timer.isPaused).toBe(true);
      expect(state.timer.remainingTime).toBe(900);
    });
  });

  describe('Edge Cases', () => {
    test('バックグラウンドで時間経過したタイマーを正しく処理する', () => {
      // Given: タイマー開始
      const task = createTask('task_1', 'テストタスク');
      selectTask(task.id);
      startTimer();

      // When: バックグラウンドで30分経過（25分のタイマーを超える）
      jest.advanceTimersByTime(30 * 60 * 1000);

      // Then: tickで残り時間が0になる
      tick();
      expect(state.timer.remainingTime).toBe(0);

      // When: 完了処理
      completeTimerCycle();

      // Then: 正しくポモドーロカウントが増加
      expect(task.actualPomodoros).toBe(1);
      expect(state.timer.mode).toBe('break');
    });

    test('マイナスの残り時間は0として扱われる', () => {
      // Given: タイマー開始
      const task = createTask('task_1', 'テストタスク');
      selectTask(task.id);
      startTimer();

      // When: targetTimestampを過去にする
      state.timer.targetTimestamp = Date.now() - 10000;  // 10秒前

      // Then: tickで残り時間が0になる
      tick();
      expect(state.timer.remainingTime).toBe(0);
    });

    test('タスク未選択でworkモードのタイマーは開始できない', () => {
      // Given: タスク未選択
      state.selectedTaskId = null;
      state.timer.mode = 'work';

      // When: タイマー開始を試行
      const started = startTimer();

      // Then: 開始されない
      expect(started).toBe(false);
      expect(state.timer.isRunning).toBe(false);
    });

    test('既に実行中のタイマーは再度開始できない', () => {
      // Given: タイマーが既に実行中
      const task = createTask('task_1', 'テストタスク');
      selectTask(task.id);
      startTimer();

      // When: 再度開始を試行
      const started = startTimer();

      // Then: 開始されない
      expect(started).toBe(false);
    });

    test('停止中のタイマーは一時停止できない', () => {
      // Given: タイマーが停止中
      state.timer.isRunning = false;

      // When: 一時停止を試行
      const paused = pauseTimer();

      // Then: 一時停止されない
      expect(paused).toBe(false);
    });

    test('残り0秒でtick()を呼び出すと0を返す', () => {
      // Given: タイマーが時間切れ
      const task = createTask('task_1', 'テストタスク');
      selectTask(task.id);
      startTimer();
      state.timer.targetTimestamp = Date.now();

      // When: tick()を実行
      const remaining = tick();

      // Then: 0が返される
      expect(remaining).toBe(0);
    });
  });

  describe('Persistence Integration', () => {
    const STORAGE_KEYS = {
      TIMER: 'pomotodo_timer',
      TASKS: 'pomotodo_tasks',
      TODAY: 'pomotodo_today'
    };

    test('タイマー状態をlocalStorageに保存して復元できる', () => {
      // Given: タスクを選択してタイマー開始
      const task = createTask('task_1', 'テストタスク');
      selectTask(task.id);
      startTimer();

      // When: 10分経過
      jest.advanceTimersByTime(10 * 60 * 1000);
      tick();

      // Then: タイマー状態を保存
      localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(state.timer));

      // When: 新しいセッションで復元
      const savedTimer = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMER));
      const status = restoreTimerState(savedTimer);

      // Then: 正しく復元される
      expect(status).toBe('running');
      expect(state.timer.remainingTime).toBeGreaterThan(0);
    });

    test('完了したポモドーロをlocalStorageに保存できる', () => {
      // Given: タスクを選択してタイマー完了
      const task = createTask('task_1', 'テストタスク');
      selectTask(task.id);
      startTimer();
      jest.advanceTimersByTime(25 * 60 * 1000);
      tick();
      completeTimerCycle();

      // When: データを保存
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
      localStorage.setItem(STORAGE_KEYS.TODAY, JSON.stringify(state.today));

      // Then: 保存されたデータを確認
      const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS));
      const savedToday = JSON.parse(localStorage.getItem(STORAGE_KEYS.TODAY));

      expect(savedTasks[0].actualPomodoros).toBe(1);
      expect(savedToday.pomodoros).toBe(1);
      expect(savedToday.totalMinutes).toBe(25);
    });
  });
});
