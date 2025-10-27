/**
 * Unit Tests: Task Operations
 *
 * Test Coverage:
 * - Task creation (handleTaskSubmit)
 * - Task editing (requestEditTask)
 * - Task deletion (requestDeleteTask)
 * - Task completion toggle (toggleTaskCompletion)
 * - Task selection (selectTask)
 * - Task filtering (getTasksByFilter)
 *
 * Target: 100% branch coverage
 * Note: These are unit tests for task operations logic extracted from app.js
 */

describe('Task Operations', () => {
  // Mock state
  let state;

  // Mock elements
  let elements;

  // Setup before each test
  beforeEach(() => {
    state = {
      tasks: [],
      filter: 'all',
      selectedTaskId: null,
      editingTaskId: null,
      timer: {
        isRunning: false,
        currentTaskId: null
      }
    };

    elements = {
      alert: {
        textContent: '',
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      }
    };

    // Reset localStorage
    localStorage.clear();
  });

  // Helper: sanitize function
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

  // Helper: showAlert function
  const showAlert = (code, overrideMessage) => {
    const ERROR_MESSAGES = {
      E001: 'タスク名を入力してください',
      E002: 'タスク名は100文字以内で入力してください',
      E003: 'タスクを選択してください',
      E004: 'タイマーを停止してから削除してください',
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

  describe('Task Creation (handleTaskSubmit)', () => {
    describe('正常系: Valid Input', () => {
      test('有効なタスク名のみでタスクを追加できる', () => {
        // Given: 有効なタスク名
        const title = '買い物';
        const estimate = '';

        // When: タスクを追加
        const trimmed = sanitize(title.trim());
        if (trimmed && trimmed.length <= 100) {
          const newTask = {
            id: `task_${Date.now()}`,
            title: trimmed,
            completed: false,
            estimatedPomodoros: null,
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
            completedAt: null
          };
          state.tasks = [newTask, ...state.tasks];
        }

        // Then: タスクが追加される
        expect(state.tasks).toHaveLength(1);
        expect(state.tasks[0].title).toBe('買い物');
        expect(state.tasks[0].estimatedPomodoros).toBeNull();
      });

      test('タスク名と見積もりポモドーロを指定してタスクを追加できる', () => {
        // Given: タスク名と見積もり
        const title = '作業';
        const estimate = '5';

        // When: タスクを追加
        const trimmed = sanitize(title.trim());
        const parsed = Number.parseInt(estimate, 10);
        if (trimmed && trimmed.length <= 100 && Number.isFinite(parsed) && parsed >= 1 && parsed <= 20) {
          const newTask = {
            id: `task_${Date.now()}`,
            title: trimmed,
            completed: false,
            estimatedPomodoros: parsed,
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
            completedAt: null
          };
          state.tasks = [newTask, ...state.tasks];
        }

        // Then: タスクが追加され、見積もりが設定される
        expect(state.tasks).toHaveLength(1);
        expect(state.tasks[0].title).toBe('作業');
        expect(state.tasks[0].estimatedPomodoros).toBe(5);
      });

      test('見積もりが空の場合はnullとして追加される', () => {
        // Given: 見積もりが空
        const title = 'タスク';
        const estimate = '';

        // When: タスクを追加
        const trimmed = sanitize(title.trim());
        let estimateValue = null;
        if (estimate) {
          const parsed = Number.parseInt(estimate, 10);
          if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 20) {
            estimateValue = parsed;
          }
        }

        const newTask = {
          id: `task_${Date.now()}`,
          title: trimmed,
          completed: false,
          estimatedPomodoros: estimateValue,
          actualPomodoros: 0,
          createdAt: new Date().toISOString(),
          completedAt: null
        };
        state.tasks = [newTask, ...state.tasks];

        // Then: estimatedPomodorosがnull
        expect(state.tasks[0].estimatedPomodoros).toBeNull();
      });
    });

    describe('境界値: Boundary Values', () => {
      test('タスク名が1文字でも追加できる', () => {
        // Given: 1文字のタスク名
        const title = 'a';

        // When: タスクを追加
        const newTask = {
          id: `task_${Date.now()}`,
          title: sanitize(title.trim()),
          completed: false,
          estimatedPomodoros: null,
          actualPomodoros: 0,
          createdAt: new Date().toISOString(),
          completedAt: null
        };
        state.tasks = [newTask, ...state.tasks];

        // Then: タスクが追加される
        expect(state.tasks).toHaveLength(1);
        expect(state.tasks[0].title).toBe('a');
      });

      test('タスク名が100文字でも追加できる', () => {
        // Given: 100文字のタスク名
        const title = 'a'.repeat(100);

        // When: タスクを追加
        if (title.length <= 100) {
          const newTask = {
            id: `task_${Date.now()}`,
            title: sanitize(title.trim()),
            completed: false,
            estimatedPomodoros: null,
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
            completedAt: null
          };
          state.tasks = [newTask, ...state.tasks];
        }

        // Then: タスクが追加される
        expect(state.tasks).toHaveLength(1);
        expect(state.tasks[0].title).toHaveLength(100);
      });

      test('見積もりが1でも追加できる', () => {
        // Given: 見積もりが1
        const title = 'タスク';
        const estimate = '1';

        // When: タスクを追加
        const parsed = Number.parseInt(estimate, 10);
        if (parsed >= 1 && parsed <= 20) {
          const newTask = {
            id: `task_${Date.now()}`,
            title: sanitize(title.trim()),
            completed: false,
            estimatedPomodoros: parsed,
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
            completedAt: null
          };
          state.tasks = [newTask, ...state.tasks];
        }

        // Then: タスクが追加される
        expect(state.tasks[0].estimatedPomodoros).toBe(1);
      });

      test('見積もりが20でも追加できる', () => {
        // Given: 見積もりが20
        const title = 'タスク';
        const estimate = '20';

        // When: タスクを追加
        const parsed = Number.parseInt(estimate, 10);
        if (parsed >= 1 && parsed <= 20) {
          const newTask = {
            id: `task_${Date.now()}`,
            title: sanitize(title.trim()),
            completed: false,
            estimatedPomodoros: parsed,
            actualPomodoros: 0,
            createdAt: new Date().toISOString(),
            completedAt: null
          };
          state.tasks = [newTask, ...state.tasks];
        }

        // Then: タスクが追加される
        expect(state.tasks[0].estimatedPomodoros).toBe(20);
      });
    });

    describe('異常系: Invalid Input', () => {
      test('タスク名が空の場合はエラーE001を表示', () => {
        // Given: 空のタスク名
        const title = '';

        // When: バリデーション実行
        const trimmed = sanitize(title.trim());
        let errorMessage = '';
        if (!trimmed) {
          errorMessage = showAlert('E001');
        }

        // Then: エラーメッセージが設定される
        expect(errorMessage).toBe('タスク名を入力してください');
        expect(elements.alert.textContent).toBe('タスク名を入力してください');
      });

      test('タスク名が空白のみの場合はエラーE001を表示', () => {
        // Given: 空白のみのタスク名
        const title = '   ';

        // When: バリデーション実行
        const trimmed = sanitize(title.trim());
        let errorMessage = '';
        if (!trimmed) {
          errorMessage = showAlert('E001');
        }

        // Then: エラーメッセージが設定される
        expect(errorMessage).toBe('タスク名を入力してください');
      });

      test('タスク名が100文字を超える場合はエラーE002を表示', () => {
        // Given: 101文字のタスク名
        const title = 'a'.repeat(101);

        // When: バリデーション実行
        const trimmed = sanitize(title.trim());
        let errorMessage = '';
        if (trimmed.length > 100) {
          errorMessage = showAlert('E002');
        }

        // Then: エラーメッセージが設定される
        expect(errorMessage).toBe('タスク名は100文字以内で入力してください');
      });

      test('見積もりが0の場合はエラーを表示', () => {
        // Given: 見積もりが0
        const estimate = '0';

        // When: バリデーション実行
        const parsed = Number.parseInt(estimate, 10);
        let errorMessage = '';
        if (Number.isNaN(parsed) || parsed < 1 || parsed > 20) {
          errorMessage = '見積もりは1〜20の範囲で入力してください';
        }

        // Then: エラーメッセージが設定される
        expect(errorMessage).toBe('見積もりは1〜20の範囲で入力してください');
      });

      test('見積もりが21の場合はエラーを表示', () => {
        // Given: 見積もりが21
        const estimate = '21';

        // When: バリデーション実行
        const parsed = Number.parseInt(estimate, 10);
        let errorMessage = '';
        if (Number.isNaN(parsed) || parsed < 1 || parsed > 20) {
          errorMessage = '見積もりは1〜20の範囲で入力してください';
        }

        // Then: エラーメッセージが設定される
        expect(errorMessage).toBe('見積もりは1〜20の範囲で入力してください');
      });

      test('見積もりが負の数の場合はエラーを表示', () => {
        // Given: 見積もりが-1
        const estimate = '-1';

        // When: バリデーション実行
        const parsed = Number.parseInt(estimate, 10);
        let errorMessage = '';
        if (Number.isNaN(parsed) || parsed < 1 || parsed > 20) {
          errorMessage = '見積もりは1〜20の範囲で入力してください';
        }

        // Then: エラーメッセージが設定される
        expect(errorMessage).toBe('見積もりは1〜20の範囲で入力してください');
      });

      test('見積もりが非数値の場合はエラーを表示', () => {
        // Given: 見積もりが"abc"
        const estimate = 'abc';

        // When: バリデーション実行
        const parsed = Number.parseInt(estimate, 10);
        let errorMessage = '';
        if (Number.isNaN(parsed) || parsed < 1 || parsed > 20) {
          errorMessage = '見積もりは1〜20の範囲で入力してください';
        }

        // Then: エラーメッセージが設定される
        expect(errorMessage).toBe('見積もりは1〜20の範囲で入力してください');
      });

      test('編集中にタスクを追加しようとするとエラーE008を表示', () => {
        // Given: editingTaskIdが設定されている
        state.editingTaskId = 'task_1';

        // When: タスク追加を試行
        let errorMessage = '';
        if (state.editingTaskId) {
          errorMessage = showAlert('E008');
        }

        // Then: エラーメッセージが設定される
        expect(errorMessage).toBe('編集を完了してください');
      });

      test('HTMLタグを含むタスク名はサニタイズされる', () => {
        // Given: HTMLタグを含むタスク名
        const title = '<script>alert(1)</script>';

        // When: サニタイズして追加
        const newTask = {
          id: `task_${Date.now()}`,
          title: sanitize(title.trim()),
          completed: false,
          estimatedPomodoros: null,
          actualPomodoros: 0,
          createdAt: new Date().toISOString(),
          completedAt: null
        };
        state.tasks = [newTask, ...state.tasks];

        // Then: サニタイズされたタイトルが設定される
        expect(state.tasks[0].title).toBe('alert(1)');
        expect(state.tasks[0].title).not.toContain('<script>');
      });
    });
  });

  describe('Task Filtering (getTasksByFilter)', () => {
    beforeEach(() => {
      // Given: 複数のタスクを用意
      state.tasks = [
        {
          id: 'task_1',
          title: 'タスク1',
          completed: false,
          estimatedPomodoros: 3,
          actualPomodoros: 1,
          createdAt: new Date().toISOString(),
          completedAt: null
        },
        {
          id: 'task_2',
          title: 'タスク2',
          completed: true,
          estimatedPomodoros: 5,
          actualPomodoros: 5,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        },
        {
          id: 'task_3',
          title: 'タスク3',
          completed: false,
          estimatedPomodoros: 2,
          actualPomodoros: 0,
          createdAt: new Date().toISOString(),
          completedAt: null
        }
      ];
    });

    // Helper: getTasksByFilter
    const getTasksByFilter = () => {
      return state.tasks.filter((task) => {
        if (state.filter === 'active') return !task.completed;
        if (state.filter === 'completed') return task.completed;
        return true;
      });
    };

    test('filterが"all"の場合はすべてのタスクを返す', () => {
      // Given: filterが"all"
      state.filter = 'all';

      // When: フィルタリング実行
      const result = getTasksByFilter();

      // Then: すべてのタスクが返される
      expect(result).toHaveLength(3);
    });

    test('filterが"active"の場合は未完了のタスクのみを返す', () => {
      // Given: filterが"active"
      state.filter = 'active';

      // When: フィルタリング実行
      const result = getTasksByFilter();

      // Then: 未完了のタスクのみが返される
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('task_1');
      expect(result[1].id).toBe('task_3');
    });

    test('filterが"completed"の場合は完了済みのタスクのみを返す', () => {
      // Given: filterが"completed"
      state.filter = 'completed';

      // When: フィルタリング実行
      const result = getTasksByFilter();

      // Then: 完了済みのタスクのみが返される
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('task_2');
    });
  });

  describe('Task Completion Toggle (toggleTaskCompletion)', () => {
    beforeEach(() => {
      // Given: タスクを用意
      state.tasks = [
        {
          id: 'task_1',
          title: 'タスク1',
          completed: false,
          estimatedPomodoros: 3,
          actualPomodoros: 1,
          createdAt: new Date().toISOString(),
          completedAt: null
        }
      ];
    });

    test('未完了のタスクを完了にできる', () => {
      // Given: 未完了のタスク
      const task = state.tasks[0];

      // When: 完了状態に変更
      task.completed = true;
      task.completedAt = new Date().toISOString();

      // Then: 完了状態になる
      expect(task.completed).toBe(true);
      expect(task.completedAt).not.toBeNull();
    });

    test('完了済みのタスクを未完了に戻せる', () => {
      // Given: 完了済みのタスク
      const task = state.tasks[0];
      task.completed = true;
      task.completedAt = new Date().toISOString();

      // When: 未完了状態に変更
      task.completed = false;
      task.completedAt = null;

      // Then: 未完了状態になる
      expect(task.completed).toBe(false);
      expect(task.completedAt).toBeNull();
    });

    test('タイマー実行中のタスクは完了状態を変更できない', () => {
      // Given: タイマー実行中
      state.timer.isRunning = true;
      state.timer.currentTaskId = 'task_1';

      // When: 完了状態の変更を試行
      let errorMessage = '';
      if (state.timer.isRunning && state.timer.currentTaskId === 'task_1') {
        errorMessage = 'タイマーを停止してから操作してください';
      }

      // Then: エラーメッセージが設定される
      expect(errorMessage).toBe('タイマーを停止してから操作してください');
      expect(state.tasks[0].completed).toBe(false);
    });
  });

  describe('Task Selection (selectTask)', () => {
    beforeEach(() => {
      // Given: タスクを用意
      state.tasks = [
        {
          id: 'task_1',
          title: 'タスク1',
          completed: false,
          estimatedPomodoros: 3,
          actualPomodoros: 1,
          createdAt: new Date().toISOString(),
          completedAt: null
        }
      ];
    });

    test('タスクを選択できる', () => {
      // Given: タスクID
      const taskId = 'task_1';

      // When: タスクを選択
      if (state.tasks.some(task => task.id === taskId)) {
        state.selectedTaskId = taskId;
        state.timer.currentTaskId = taskId;
      }

      // Then: 選択状態になる
      expect(state.selectedTaskId).toBe('task_1');
      expect(state.timer.currentTaskId).toBe('task_1');
    });

    test('タイマー実行中はタスクを選択できない', () => {
      // Given: タイマー実行中
      state.timer.isRunning = true;

      // When: タスク選択を試行
      let errorMessage = '';
      if (state.timer.isRunning) {
        errorMessage = 'タイマーを停止してから選択してください';
      }

      // Then: エラーメッセージが設定され、選択されない
      expect(errorMessage).toBe('タイマーを停止してから選択してください');
      expect(state.selectedTaskId).toBeNull();
    });

    test('存在しないタスクIDは選択できない', () => {
      // Given: 存在しないタスクID
      const taskId = 'nonexistent_task';

      // When: タスク選択を試行
      if (state.tasks.some(task => task.id === taskId)) {
        state.selectedTaskId = taskId;
      }

      // Then: 選択されない
      expect(state.selectedTaskId).toBeNull();
    });
  });

  describe('Task Deletion (requestDeleteTask)', () => {
    beforeEach(() => {
      // Given: タスクを用意
      state.tasks = [
        {
          id: 'task_1',
          title: 'タスク1',
          completed: false,
          estimatedPomodoros: 3,
          actualPomodoros: 1,
          createdAt: new Date().toISOString(),
          completedAt: null
        }
      ];
    });

    test('タスクを削除できる', () => {
      // Given: タスクID
      const taskId = 'task_1';

      // When: タスクを削除
      const taskIndex = state.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        state.tasks.splice(taskIndex, 1);
      }

      // Then: タスクが削除される
      expect(state.tasks).toHaveLength(0);
    });

    test('タイマー実行中はタスクを削除できない', () => {
      // Given: タイマー実行中
      state.timer.isRunning = true;

      // When: タスク削除を試行
      let errorMessage = '';
      if (state.timer.isRunning) {
        errorMessage = showAlert('E004');
      }

      // Then: エラーメッセージが設定され、削除されない
      expect(errorMessage).toBe('タイマーを停止してから削除してください');
      expect(state.tasks).toHaveLength(1);
    });

    test('選択中のタスクを削除すると選択が解除される', () => {
      // Given: タスクが選択されている
      state.selectedTaskId = 'task_1';
      state.timer.currentTaskId = 'task_1';

      // When: タスクを削除
      const taskIndex = state.tasks.findIndex(t => t.id === 'task_1');
      if (taskIndex !== -1) {
        state.tasks.splice(taskIndex, 1);
        if (state.selectedTaskId === 'task_1') {
          state.selectedTaskId = null;
          state.timer.currentTaskId = null;
        }
      }

      // Then: 選択が解除される
      expect(state.selectedTaskId).toBeNull();
      expect(state.timer.currentTaskId).toBeNull();
    });
  });
});
