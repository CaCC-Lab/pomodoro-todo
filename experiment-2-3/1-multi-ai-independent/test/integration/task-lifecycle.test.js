/**
 * Integration Tests: Task Lifecycle
 *
 * Test Coverage:
 * - Full task lifecycle: create → select → complete → delete
 * - Task + Timer integration
 * - Multiple tasks coordination
 * - Filter state transitions
 *
 * Target: End-to-end task workflows
 */

describe('Task Lifecycle Integration', () => {
  // Mock state (simulating full application state)
  let state;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();

    state = {
      tasks: [],
      filter: 'all',
      selectedTaskId: null,
      editingTaskId: null,
      timer: {
        mode: 'work',
        remainingTime: 1500,
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
  const sanitize = (str) => {
    if (typeof str !== 'string') return '';
    let sanitized = str.replace(/<[^>]*>?/gm, '');
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    return sanitized;
  };

  const createTask = (title, estimate = null) => {
    const trimmed = sanitize(title.trim());
    if (!trimmed || trimmed.length > 100) return null;

    const newTask = {
      id: `task_${Date.now()}`,
      title: trimmed,
      completed: false,
      estimatedPomodoros: estimate,
      actualPomodoros: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    state.tasks = [newTask, ...state.tasks];
    return newTask;
  };

  const selectTask = (taskId) => {
    if (state.timer.isRunning) return false;
    if (!state.tasks.some(task => task.id === taskId)) return false;

    state.selectedTaskId = taskId;
    state.timer.currentTaskId = taskId;
    return true;
  };

  const startTimer = () => {
    if (state.timer.isRunning) return false;
    if (state.editingTaskId) return false;
    if (state.timer.mode === 'work' && !state.selectedTaskId) return false;

    state.timer.isRunning = true;
    state.timer.isPaused = false;
    const now = Date.now();
    state.timer.startedAt = new Date(now).toISOString();
    state.timer.targetTimestamp = now + state.timer.remainingTime * 1000;
    return true;
  };

  const completeTimer = () => {
    if (!state.timer.isRunning) return false;

    state.timer.isRunning = false;
    state.timer.isPaused = false;
    state.timer.targetTimestamp = null;
    state.timer.remainingTime = 0;

    if (state.timer.mode === 'work' && state.timer.currentTaskId) {
      const task = state.tasks.find(t => t.id === state.timer.currentTaskId);
      if (task) {
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

  const completeTask = (taskId) => {
    if (state.timer.isRunning && state.timer.currentTaskId === taskId) return false;

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.completed = true;
    task.completedAt = new Date().toISOString();

    const todayKey = state.today.date;
    const completedToday = state.tasks.filter(
      t => t.completedAt && t.completedAt.startsWith(todayKey)
    ).length;
    state.today.completedTasks = completedToday;

    return true;
  };

  const deleteTask = (taskId) => {
    if (state.timer.isRunning) return false;

    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return false;

    state.tasks.splice(taskIndex, 1);

    if (state.selectedTaskId === taskId) {
      state.selectedTaskId = null;
      state.timer.currentTaskId = null;
    }

    return true;
  };

  describe('Basic Task Lifecycle', () => {
    test('タスクを作成→選択→完了→削除できる', () => {
      // Given: 何もない状態

      // When: タスクを作成
      const task = createTask('買い物', 3);

      // Then: タスクが作成される
      expect(state.tasks).toHaveLength(1);
      expect(task.title).toBe('買い物');

      // When: タスクを選択
      const selected = selectTask(task.id);

      // Then: タスクが選択される
      expect(selected).toBe(true);
      expect(state.selectedTaskId).toBe(task.id);

      // When: タスクを完了
      const completed = completeTask(task.id);

      // Then: タスクが完了する
      expect(completed).toBe(true);
      expect(task.completed).toBe(true);
      expect(task.completedAt).not.toBeNull();

      // When: タスクを削除
      const deleted = deleteTask(task.id);

      // Then: タスクが削除される
      expect(deleted).toBe(true);
      expect(state.tasks).toHaveLength(0);
    });

    test('複数のタスクを作成して個別に管理できる', () => {
      // Given: 何もない状態

      // When: 3つのタスクを作成
      const task1 = createTask('タスク1', 5);
      const task2 = createTask('タスク2', 3);
      const task3 = createTask('タスク3', null);

      // Then: 3つのタスクが作成される
      expect(state.tasks).toHaveLength(3);
      expect(task1.estimatedPomodoros).toBe(5);
      expect(task2.estimatedPomodoros).toBe(3);
      expect(task3.estimatedPomodoros).toBeNull();

      // When: タスク2を完了
      completeTask(task2.id);

      // Then: タスク2のみ完了状態
      expect(task1.completed).toBe(false);
      expect(task2.completed).toBe(true);
      expect(task3.completed).toBe(false);

      // When: タスク1を削除
      deleteTask(task1.id);

      // Then: タスク2と3が残る
      expect(state.tasks).toHaveLength(2);
      expect(state.tasks.find(t => t.id === task2.id)).toBeDefined();
      expect(state.tasks.find(t => t.id === task3.id)).toBeDefined();
    });
  });

  describe('Task + Timer Integration', () => {
    test('タスクを作成→選択→タイマー開始→完了の一連の流れ', () => {
      // Given: 何もない状態

      // When: タスクを作成
      const task = createTask('作業タスク', 5);

      // Then: タスクが作成される
      expect(state.tasks).toHaveLength(1);

      // When: タスクを選択
      selectTask(task.id);

      // Then: タスクが選択される
      expect(state.selectedTaskId).toBe(task.id);
      expect(state.timer.currentTaskId).toBe(task.id);

      // When: タイマーを開始
      const started = startTimer();

      // Then: タイマーが開始される
      expect(started).toBe(true);
      expect(state.timer.isRunning).toBe(true);

      // When: タイマーが完了
      const timerCompleted = completeTimer();

      // Then: ポモドーロカウントが増加する
      expect(timerCompleted).toBe(true);
      expect(task.actualPomodoros).toBe(1);
      expect(state.today.pomodoros).toBe(1);
      expect(state.today.totalMinutes).toBe(25);
    });

    test('複数のポモドーロサイクルを実行できる', () => {
      // Given: タスクを作成して選択
      const task = createTask('長時間作業', 5);
      selectTask(task.id);

      // When: 1回目のポモドーロ
      startTimer();
      completeTimer();

      // Then: 1ポモドーロ完了
      expect(task.actualPomodoros).toBe(1);
      expect(state.today.pomodoros).toBe(1);
      expect(state.timer.mode).toBe('break');

      // When: 休憩後、2回目のポモドーロ
      state.timer.mode = 'work';
      startTimer();
      completeTimer();

      // Then: 2ポモドーロ完了
      expect(task.actualPomodoros).toBe(2);
      expect(state.today.pomodoros).toBe(2);

      // When: 3回目のポモドーロ
      state.timer.mode = 'work';
      startTimer();
      completeTimer();

      // Then: 3ポモドーロ完了
      expect(task.actualPomodoros).toBe(3);
      expect(state.today.pomodoros).toBe(3);
      expect(state.today.totalMinutes).toBe(75);  // 25 * 3
    });

    test('見積もりポモドーロ数に達したタスクを完了できる', () => {
      // Given: 見積もり3ポモドーロのタスク
      const task = createTask('短時間作業', 3);
      selectTask(task.id);

      // When: 3ポモドーロを実行
      for (let i = 0; i < 3; i++) {
        state.timer.mode = 'work';
        startTimer();
        completeTimer();
      }

      // Then: 3ポモドーロ完了
      expect(task.actualPomodoros).toBe(3);
      expect(task.actualPomodoros).toBe(task.estimatedPomodoros);

      // When: タスクを完了
      const completed = completeTask(task.id);

      // Then: タスクが完了状態になる
      expect(completed).toBe(true);
      expect(task.completed).toBe(true);
      expect(state.today.completedTasks).toBe(1);
    });

    test('タイマー実行中はタスクを削除できない', () => {
      // Given: タスクを作成してタイマー開始
      const task = createTask('実行中タスク', 5);
      selectTask(task.id);
      startTimer();

      // When: タスク削除を試行
      const deleted = deleteTask(task.id);

      // Then: 削除されない
      expect(deleted).toBe(false);
      expect(state.tasks).toHaveLength(1);
    });

    test('タイマー実行中はタスクの完了状態を変更できない', () => {
      // Given: タスクを作成してタイマー開始
      const task = createTask('実行中タスク', 5);
      selectTask(task.id);
      startTimer();

      // When: タスク完了を試行
      const completed = completeTask(task.id);

      // Then: 完了されない
      expect(completed).toBe(false);
      expect(task.completed).toBe(false);
    });
  });

  describe('Streak Tracking', () => {
    test('同じタスクで連続ポモドーロを実行するとストリークが増加する', () => {
      // Given: タスクを作成して選択
      const task = createTask('集中作業', 10);
      selectTask(task.id);

      // When: 3ポモドーロを連続実行
      for (let i = 0; i < 3; i++) {
        state.timer.mode = 'work';
        startTimer();
        completeTimer();
      }

      // Then: ストリークが3になる
      expect(state.today.currentStreak).toBe(3);
      expect(state.today.lastTaskId).toBe(task.id);
    });

    test('異なるタスクに切り替えるとストリークがリセットされる', () => {
      // Given: 最初のタスクで2ポモドーロ実行
      const task1 = createTask('タスク1', 5);
      selectTask(task1.id);

      for (let i = 0; i < 2; i++) {
        state.timer.mode = 'work';
        startTimer();
        completeTimer();
      }

      expect(state.today.currentStreak).toBe(2);

      // When: 別のタスクに切り替えて1ポモドーロ実行
      const task2 = createTask('タスク2', 5);
      state.timer.mode = 'work';
      selectTask(task2.id);
      startTimer();
      completeTimer();

      // Then: ストリークが1にリセットされる
      expect(state.today.currentStreak).toBe(1);
      expect(state.today.lastTaskId).toBe(task2.id);
    });
  });

  describe('Today Summary Updates', () => {
    test('タスク完了時にtoday.completedTasksが更新される', () => {
      // Given: 3つのタスクを作成
      const task1 = createTask('タスク1', 1);
      const task2 = createTask('タスク2', 1);
      const task3 = createTask('タスク3', 1);

      // When: タスク1を完了
      completeTask(task1.id);

      // Then: completedTasksが1になる
      expect(state.today.completedTasks).toBe(1);

      // When: タスク2も完了
      completeTask(task2.id);

      // Then: completedTasksが2になる
      expect(state.today.completedTasks).toBe(2);

      // When: タスク3も完了
      completeTask(task3.id);

      // Then: completedTasksが3になる
      expect(state.today.completedTasks).toBe(3);
    });

    test('ポモドーロ完了時にtoday.pomodorosとtotalMinutesが更新される', () => {
      // Given: タスクを作成して選択
      const task = createTask('作業', 10);
      selectTask(task.id);

      // When: 5ポモドーロを実行
      for (let i = 0; i < 5; i++) {
        state.timer.mode = 'work';
        startTimer();
        completeTimer();
      }

      // Then: pomodorosとtotalMinutesが更新される
      expect(state.today.pomodoros).toBe(5);
      expect(state.today.totalMinutes).toBe(125);  // 25 * 5
    });
  });

  describe('Complex Workflows', () => {
    test('複数タスクを並行して進める複雑なワークフロー', () => {
      // Given: 3つのタスクを作成
      const taskA = createTask('タスクA', 3);
      const taskB = createTask('タスクB', 2);
      const taskC = createTask('タスクC', 5);

      // When: タスクAで2ポモドーロ実行
      selectTask(taskA.id);
      for (let i = 0; i < 2; i++) {
        state.timer.mode = 'work';
        startTimer();
        completeTimer();
      }

      // Then: タスクAが2ポモドーロ
      expect(taskA.actualPomodoros).toBe(2);
      expect(state.today.pomodoros).toBe(2);

      // When: タスクBで2ポモドーロ実行（完了）
      selectTask(taskB.id);
      for (let i = 0; i < 2; i++) {
        state.timer.mode = 'work';
        startTimer();
        completeTimer();
      }
      completeTask(taskB.id);

      // Then: タスクBが完了
      expect(taskB.actualPomodoros).toBe(2);
      expect(taskB.completed).toBe(true);
      expect(state.today.pomodoros).toBe(4);
      expect(state.today.completedTasks).toBe(1);

      // When: タスクAに戻って1ポモドーロ実行（完了）
      selectTask(taskA.id);
      state.timer.mode = 'work';
      startTimer();
      completeTimer();
      completeTask(taskA.id);

      // Then: タスクAも完了
      expect(taskA.actualPomodoros).toBe(3);
      expect(taskA.completed).toBe(true);
      expect(state.today.pomodoros).toBe(5);
      expect(state.today.completedTasks).toBe(2);

      // When: タスクCで3ポモドーロ実行（未完了）
      selectTask(taskC.id);
      for (let i = 0; i < 3; i++) {
        state.timer.mode = 'work';
        startTimer();
        completeTimer();
      }

      // Then: タスクCは未完了だが3ポモドーロ実行済み
      expect(taskC.actualPomodoros).toBe(3);
      expect(taskC.completed).toBe(false);
      expect(state.today.pomodoros).toBe(8);
      expect(state.today.totalMinutes).toBe(200);  // 25 * 8
    });
  });
});
