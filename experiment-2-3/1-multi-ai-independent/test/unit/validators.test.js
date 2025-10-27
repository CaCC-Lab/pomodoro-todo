/**
 * Unit Tests: Validator Functions
 *
 * Test Coverage:
 * - normalizeTask() - タスクオブジェクトの正規化
 * - sanitizeTimer() - タイマーオブジェクトのサニタイズ
 * - sanitizeNumber() - 数値のサニタイズ
 * - clamp() - 数値の範囲制限
 *
 * Target: 100% branch coverage
 */

describe('Validator Functions', () => {
  // Extract validator functions from app.js for testing
  const sanitizeNumber = (value, fallback) => {
    const num = Number.parseInt(value, 10);
    return Number.isFinite(num) ? num : fallback;
  };

  const clamp = (value, min, max) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return min;
    return Math.min(Math.max(num, min), max);
  };

  const DEFAULT_SETTINGS = {
    workDuration: 25,
    shortBreakDuration: 5
  };

  const getModeDuration = (mode) => {
    if (mode === 'break') {
      return clamp(DEFAULT_SETTINGS.shortBreakDuration, 1, 30) * 60;
    }
    return clamp(DEFAULT_SETTINGS.workDuration, 1, 60) * 60;
  };

  const normalizeTask = (task) => {
    return {
      id: task.id || `task_${Date.now()}`,
      title: typeof task.title === 'string' ? task.title : '名称未設定',
      completed: Boolean(task.completed),
      estimatedPomodoros: sanitizeNumber(task.estimatedPomodoros, null),
      actualPomodoros: sanitizeNumber(task.actualPomodoros, 0),
      createdAt: task.createdAt || new Date().toISOString(),
      completedAt: task.completedAt || null
    };
  };

  const sanitizeTimer = (timer) => {
    const sanitized = { ...timer };
    sanitized.mode = timer.mode === 'break' ? 'break' : 'work';
    sanitized.remainingTime = sanitizeNumber(timer.remainingTime, getModeDuration(sanitized.mode));
    sanitized.isRunning = Boolean(timer.isRunning);
    sanitized.isPaused = Boolean(timer.isPaused);
    sanitized.currentTaskId = timer.currentTaskId || null;
    sanitized.startedAt = timer.startedAt || null;
    sanitized.targetTimestamp = timer.targetTimestamp || null;
    sanitized.pomodoroCount = sanitizeNumber(timer.pomodoroCount, 0);
    return sanitized;
  };

  describe('sanitizeNumber() - Number Sanitization', () => {
    describe('正常系: Valid Input', () => {
      test('有効な数値をそのまま返す', () => {
        // Given: 有効な数値
        const input = 42;
        const fallback = 0;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: 同じ数値が返される
        expect(result).toBe(42);
      });

      test('文字列の数値を数値に変換する', () => {
        // Given: 文字列の数値
        const input = '123';
        const fallback = 0;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: 数値に変換される
        expect(result).toBe(123);
      });

      test('負の数値を正しく処理する', () => {
        // Given: 負の数値
        const input = -10;
        const fallback = 0;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: 負の数値が返される
        expect(result).toBe(-10);
      });

      test('0を正しく処理する', () => {
        // Given: 0
        const input = 0;
        const fallback = -1;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: 0が返される
        expect(result).toBe(0);
      });
    });

    describe('境界値: Boundary Values', () => {
      test('小数点を含む文字列を整数に変換する', () => {
        // Given: 小数点を含む文字列
        const input = '42.9';
        const fallback = 0;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: 整数部分のみが返される
        expect(result).toBe(42);
      });

      test('非常に大きな数値を処理する', () => {
        // Given: 大きな数値
        const input = 9999999;
        const fallback = 0;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: そのまま返される
        expect(result).toBe(9999999);
      });
    });

    describe('異常系: Invalid Input', () => {
      test('NaNの場合はfallbackを返す', () => {
        // Given: NaN
        const input = NaN;
        const fallback = 100;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: fallbackが返される
        expect(result).toBe(100);
      });

      test('無効な文字列の場合はfallbackを返す', () => {
        // Given: 無効な文字列
        const input = 'abc';
        const fallback = 50;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: fallbackが返される
        expect(result).toBe(50);
      });

      test('nullの場合はfallbackを返す', () => {
        // Given: null
        const input = null;
        const fallback = 10;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: fallbackが返される
        expect(result).toBe(10);
      });

      test('undefinedの場合はfallbackを返す', () => {
        // Given: undefined
        const input = undefined;
        const fallback = 20;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: fallbackが返される
        expect(result).toBe(20);
      });

      test('Infinityの場合はfallbackを返す', () => {
        // Given: Infinity
        const input = Infinity;
        const fallback = 30;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: fallbackが返される
        expect(result).toBe(30);
      });

      test('オブジェクトの場合はfallbackを返す', () => {
        // Given: オブジェクト
        const input = { value: 42 };
        const fallback = 40;

        // When: sanitizeNumber関数を実行
        const result = sanitizeNumber(input, fallback);

        // Then: fallbackが返される
        expect(result).toBe(40);
      });
    });
  });

  describe('clamp() - Value Clamping', () => {
    describe('正常系: Valid Input', () => {
      test('範囲内の値をそのまま返す', () => {
        // Given: 範囲内の値
        const value = 15;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 同じ値が返される
        expect(result).toBe(15);
      });

      test('最小値と同じ値をそのまま返す', () => {
        // Given: 最小値
        const value = 10;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最小値が返される
        expect(result).toBe(10);
      });

      test('最大値と同じ値をそのまま返す', () => {
        // Given: 最大値
        const value = 20;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最大値が返される
        expect(result).toBe(20);
      });

      test('最小値より小さい値を最小値にクランプする', () => {
        // Given: 最小値より小さい値
        const value = 5;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最小値が返される
        expect(result).toBe(10);
      });

      test('最大値より大きい値を最大値にクランプする', () => {
        // Given: 最大値より大きい値
        const value = 25;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最大値が返される
        expect(result).toBe(20);
      });
    });

    describe('境界値: Boundary Values', () => {
      test('最小値-1を最小値にクランプする', () => {
        // Given: 最小値-1
        const value = 9;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最小値が返される
        expect(result).toBe(10);
      });

      test('最大値+1を最大値にクランプする', () => {
        // Given: 最大値+1
        const value = 21;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最大値が返される
        expect(result).toBe(20);
      });

      test('負の範囲でクランプできる', () => {
        // Given: 負の範囲
        const value = -15;
        const min = -20;
        const max = -10;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 範囲内の値が返される
        expect(result).toBe(-15);
      });

      test('0を含む範囲でクランプできる', () => {
        // Given: 0を含む範囲
        const value = 0;
        const min = -10;
        const max = 10;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 0が返される
        expect(result).toBe(0);
      });
    });

    describe('異常系: Invalid Input', () => {
      test('NaNを最小値にクランプする', () => {
        // Given: NaN
        const value = NaN;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最小値が返される
        expect(result).toBe(10);
      });

      test('Infinityを最大値にクランプする', () => {
        // Given: Infinity
        const value = Infinity;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最大値が返される
        expect(result).toBe(20);
      });

      test('-Infinityを最小値にクランプする', () => {
        // Given: -Infinity
        const value = -Infinity;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最小値が返される
        expect(result).toBe(10);
      });

      test('文字列を最小値にクランプする', () => {
        // Given: 文字列
        const value = 'abc';
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最小値が返される
        expect(result).toBe(10);
      });

      test('nullを最小値にクランプする', () => {
        // Given: null
        const value = null;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最小値が返される
        expect(result).toBe(10);
      });

      test('undefinedを最小値にクランプする', () => {
        // Given: undefined
        const value = undefined;
        const min = 10;
        const max = 20;

        // When: clamp関数を実行
        const result = clamp(value, min, max);

        // Then: 最小値が返される
        expect(result).toBe(10);
      });
    });
  });

  describe('normalizeTask() - Task Normalization', () => {
    describe('正常系: Valid Input', () => {
      test('有効なタスクをそのまま返す', () => {
        // Given: 有効なタスクオブジェクト
        const input = {
          id: 'task_123',
          title: 'テストタスク',
          completed: false,
          estimatedPomodoros: 5,
          actualPomodoros: 2,
          createdAt: '2025-01-01T00:00:00.000Z',
          completedAt: null
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: 同じ値が返される
        expect(result).toEqual({
          id: 'task_123',
          title: 'テストタスク',
          completed: false,
          estimatedPomodoros: 5,
          actualPomodoros: 2,
          createdAt: '2025-01-01T00:00:00.000Z',
          completedAt: null
        });
      });

      test('完了済みタスクを正しく処理する', () => {
        // Given: 完了済みタスク
        const input = {
          id: 'task_456',
          title: '完了タスク',
          completed: true,
          estimatedPomodoros: 3,
          actualPomodoros: 3,
          createdAt: '2025-01-01T00:00:00.000Z',
          completedAt: '2025-01-01T01:00:00.000Z'
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: 完了フラグが保持される
        expect(result.completed).toBe(true);
        expect(result.completedAt).toBe('2025-01-01T01:00:00.000Z');
      });
    });

    describe('境界値: Missing Fields', () => {
      test('idが無い場合は自動生成する', () => {
        // Given: idが無いタスク
        const input = {
          title: 'タスク',
          completed: false
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: idが自動生成される
        expect(result.id).toMatch(/^task_\d+$/);
      });

      test('titleが無い場合はデフォルト値を設定する', () => {
        // Given: titleが無いタスク
        const input = {
          id: 'task_789',
          completed: false
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: デフォルト値が設定される
        expect(result.title).toBe('名称未設定');
      });

      test('createdAtが無い場合は現在時刻を設定する', () => {
        // Given: createdAtが無いタスク
        const input = {
          id: 'task_101',
          title: 'タスク',
          completed: false
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: 現在時刻が設定される
        expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      test('estimatedPomodorosが無い場合はnullを設定する', () => {
        // Given: estimatedPomodorosが無いタスク
        const input = {
          id: 'task_102',
          title: 'タスク',
          completed: false
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: nullが設定される
        expect(result.estimatedPomodoros).toBeNull();
      });

      test('actualPomodorosが無い場合は0を設定する', () => {
        // Given: actualPomodorosが無いタスク
        const input = {
          id: 'task_103',
          title: 'タスク',
          completed: false
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: 0が設定される
        expect(result.actualPomodoros).toBe(0);
      });
    });

    describe('異常系: Invalid Values', () => {
      test('titleが文字列でない場合はデフォルト値を設定する', () => {
        // Given: titleが数値のタスク
        const input = {
          id: 'task_201',
          title: 123,
          completed: false
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: デフォルト値が設定される
        expect(result.title).toBe('名称未設定');
      });

      test('completedがbooleanでない場合は変換する', () => {
        // Given: completedが文字列のタスク
        const input = {
          id: 'task_202',
          title: 'タスク',
          completed: 'true'
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: booleanに変換される
        expect(result.completed).toBe(true);
      });

      test('estimatedPomodorosが無効な値の場合はnullを設定する', () => {
        // Given: estimatedPomodorosが文字列のタスク
        const input = {
          id: 'task_203',
          title: 'タスク',
          completed: false,
          estimatedPomodoros: 'abc'
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: nullが設定される
        expect(result.estimatedPomodoros).toBeNull();
      });

      test('actualPomodorosが無効な値の場合は0を設定する', () => {
        // Given: actualPomodorosがNaNのタスク
        const input = {
          id: 'task_204',
          title: 'タスク',
          completed: false,
          actualPomodoros: NaN
        };

        // When: normalizeTask関数を実行
        const result = normalizeTask(input);

        // Then: 0が設定される
        expect(result.actualPomodoros).toBe(0);
      });
    });
  });

  describe('sanitizeTimer() - Timer Sanitization', () => {
    describe('正常系: Valid Input', () => {
      test('有効なworkタイマーをそのまま返す', () => {
        // Given: 有効なworkタイマー
        const input = {
          mode: 'work',
          remainingTime: 1500,
          isRunning: false,
          isPaused: false,
          currentTaskId: 'task_123',
          startedAt: null,
          targetTimestamp: null,
          pomodoroCount: 5
        };

        // When: sanitizeTimer関数を実行
        const result = sanitizeTimer(input);

        // Then: 同じ値が返される
        expect(result).toEqual({
          mode: 'work',
          remainingTime: 1500,
          isRunning: false,
          isPaused: false,
          currentTaskId: 'task_123',
          startedAt: null,
          targetTimestamp: null,
          pomodoroCount: 5
        });
      });

      test('有効なbreakタイマーをそのまま返す', () => {
        // Given: 有効なbreakタイマー
        const input = {
          mode: 'break',
          remainingTime: 300,
          isRunning: true,
          isPaused: false,
          currentTaskId: null,
          startedAt: '2025-01-01T00:00:00.000Z',
          targetTimestamp: 1704067200000,
          pomodoroCount: 3
        };

        // When: sanitizeTimer関数を実行
        const result = sanitizeTimer(input);

        // Then: 同じ値が返される
        expect(result.mode).toBe('break');
        expect(result.remainingTime).toBe(300);
        expect(result.isRunning).toBe(true);
      });
    });

    describe('境界値: Missing or Invalid Fields', () => {
      test('modeが無効な場合はworkに設定する', () => {
        // Given: modeが無効なタイマー
        const input = {
          mode: 'invalid'
        };

        // When: sanitizeTimer関数を実行
        const result = sanitizeTimer(input);

        // Then: workに設定される
        expect(result.mode).toBe('work');
      });

      test('remainingTimeが無効な場合はモード規定の時間を設定する', () => {
        // Given: remainingTimeが無効なタイマー
        const input = {
          mode: 'work',
          remainingTime: NaN
        };

        // When: sanitizeTimer関数を実行
        const result = sanitizeTimer(input);

        // Then: デフォルトの作業時間(25分=1500秒)が設定される
        expect(result.remainingTime).toBe(1500);
      });

      test('currentTaskIdが無い場合はnullを設定する', () => {
        // Given: currentTaskIdが無いタイマー
        const input = {
          mode: 'work'
        };

        // When: sanitizeTimer関数を実行
        const result = sanitizeTimer(input);

        // Then: nullが設定される
        expect(result.currentTaskId).toBeNull();
      });

      test('pomodoroCountが無効な場合は0を設定する', () => {
        // Given: pomodoroCountが無効なタイマー
        const input = {
          mode: 'work',
          pomodoroCount: 'abc'
        };

        // When: sanitizeTimer関数を実行
        const result = sanitizeTimer(input);

        // Then: 0が設定される
        expect(result.pomodoroCount).toBe(0);
      });
    });

    describe('異常系: Type Conversion', () => {
      test('isRunningをbooleanに変換する', () => {
        // Given: isRunningが文字列のタイマー
        const input = {
          mode: 'work',
          isRunning: 'true'
        };

        // When: sanitizeTimer関数を実行
        const result = sanitizeTimer(input);

        // Then: booleanに変換される
        expect(result.isRunning).toBe(true);
      });

      test('isPausedをbooleanに変換する', () => {
        // Given: isPausedが数値のタイマー
        const input = {
          mode: 'work',
          isPaused: 1
        };

        // When: sanitizeTimer関数を実行
        const result = sanitizeTimer(input);

        // Then: booleanに変換される
        expect(result.isPaused).toBe(true);
      });

      test('breakモードのremainingTimeが無い場合は休憩時間を設定する', () => {
        // Given: breakモードでremainingTimeが無いタイマー
        const input = {
          mode: 'break',
          remainingTime: null
        };

        // When: sanitizeTimer関数を実行
        const result = sanitizeTimer(input);

        // Then: デフォルトの休憩時間(5分=300秒)が設定される
        expect(result.remainingTime).toBe(300);
      });
    });
  });
});
