/**
 * Unit Tests: Helper Functions
 *
 * Test Coverage:
 * - derivePomodoroStatus() - ポモドーロのステータス判定
 * - getModeDuration() - モードに応じた時間取得
 * - createTodaySummary() - 今日のサマリー作成
 * - safeParseStorage() - 安全なストレージ解析
 *
 * Target: 100% branch coverage
 */

describe('Helper Functions', () => {
  // Extract helper functions from app.js for testing
  const derivePomodoroStatus = (task) => {
    if (typeof task.estimatedPomodoros !== 'number') return 'open';
    if (task.actualPomodoros === task.estimatedPomodoros) return 'achieved';
    if (task.actualPomodoros > task.estimatedPomodoros) return 'over';
    return 'open';
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

  const createTodaySummary = (date) => {
    return {
      date,
      pomodoros: 0,
      completedTasks: 0,
      totalMinutes: 0,
      currentStreak: 0,
      lastTaskId: null
    };
  };

  const safeParseStorage = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw === 'null') return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  };

  describe('derivePomodoroStatus() - Pomodoro Status', () => {
    describe('正常系: Valid Input', () => {
      test('見積もりが無い場合は "open" を返す', () => {
        // Given: 見積もりが無いタスク
        const task = {
          estimatedPomodoros: null,
          actualPomodoros: 5
        };

        // When: derivePomodoroStatus関数を実行
        const result = derivePomodoroStatus(task);

        // Then: "open"が返される
        expect(result).toBe('open');
      });

      test('実績が見積もりと同じ場合は "achieved" を返す', () => {
        // Given: 実績と見積もりが同じタスク
        const task = {
          estimatedPomodoros: 5,
          actualPomodoros: 5
        };

        // When: derivePomodoroStatus関数を実行
        const result = derivePomodoroStatus(task);

        // Then: "achieved"が返される
        expect(result).toBe('achieved');
      });

      test('実績が見積もりを超えた場合は "over" を返す', () => {
        // Given: 実績が見積もりを超えるタスク
        const task = {
          estimatedPomodoros: 5,
          actualPomodoros: 7
        };

        // When: derivePomodoroStatus関数を実行
        const result = derivePomodoroStatus(task);

        // Then: "over"が返される
        expect(result).toBe('over');
      });

      test('実績が見積もり未満の場合は "open" を返す', () => {
        // Given: 実績が見積もり未満のタスク
        const task = {
          estimatedPomodoros: 5,
          actualPomodoros: 3
        };

        // When: derivePomodoroStatus関数を実行
        const result = derivePomodoroStatus(task);

        // Then: "open"が返される
        expect(result).toBe('open');
      });
    });

    describe('境界値: Boundary Values', () => {
      test('実績が0、見積もりがある場合は "open" を返す', () => {
        // Given: 実績が0のタスク
        const task = {
          estimatedPomodoros: 5,
          actualPomodoros: 0
        };

        // When: derivePomodoroStatus関数を実行
        const result = derivePomodoroStatus(task);

        // Then: "open"が返される
        expect(result).toBe('open');
      });

      test('実績が見積もり+1の場合は "over" を返す', () => {
        // Given: 実績が見積もり+1のタスク
        const task = {
          estimatedPomodoros: 5,
          actualPomodoros: 6
        };

        // When: derivePomodoroStatus関数を実行
        const result = derivePomodoroStatus(task);

        // Then: "over"が返される
        expect(result).toBe('over');
      });

      test('実績が見積もり-1の場合は "open" を返す', () => {
        // Given: 実績が見積もり-1のタスク
        const task = {
          estimatedPomodoros: 5,
          actualPomodoros: 4
        };

        // When: derivePomodoroStatus関数を実行
        const result = derivePomodoroStatus(task);

        // Then: "open"が返される
        expect(result).toBe('open');
      });
    });

    describe('異常系: Invalid Input', () => {
      test('estimatedPomodorosがundefinedの場合は "open" を返す', () => {
        // Given: estimatedPomodorosがundefinedのタスク
        const task = {
          estimatedPomodoros: undefined,
          actualPomodoros: 5
        };

        // When: derivePomodoroStatus関数を実行
        const result = derivePomodoroStatus(task);

        // Then: "open"が返される
        expect(result).toBe('open');
      });

      test('estimatedPomodorosが文字列の場合は "open" を返す', () => {
        // Given: estimatedPomodorosが文字列のタスク
        const task = {
          estimatedPomodoros: '5',
          actualPomodoros: 5
        };

        // When: derivePomodoroStatus関数を実行
        const result = derivePomodoroStatus(task);

        // Then: "open"が返される（数値型チェック）
        expect(result).toBe('open');
      });
    });
  });

  describe('getModeDuration() - Mode Duration', () => {
    describe('正常系: Valid Input', () => {
      test('workモードの時間を秒数で返す（25分=1500秒）', () => {
        // Given: workモード
        const mode = 'work';

        // When: getModeDuration関数を実行
        const result = getModeDuration(mode);

        // Then: 1500秒が返される
        expect(result).toBe(1500);
      });

      test('breakモードの時間を秒数で返す（5分=300秒）', () => {
        // Given: breakモード
        const mode = 'break';

        // When: getModeDuration関数を実行
        const result = getModeDuration(mode);

        // Then: 300秒が返される
        expect(result).toBe(300);
      });
    });

    describe('異常系: Invalid Input', () => {
      test('無効なモードの場合はworkモードの時間を返す', () => {
        // Given: 無効なモード
        const mode = 'invalid';

        // When: getModeDuration関数を実行
        const result = getModeDuration(mode);

        // Then: workモードの時間(1500秒)が返される
        expect(result).toBe(1500);
      });

      test('nullの場合はworkモードの時間を返す', () => {
        // Given: null
        const mode = null;

        // When: getModeDuration関数を実行
        const result = getModeDuration(mode);

        // Then: workモードの時間(1500秒)が返される
        expect(result).toBe(1500);
      });

      test('undefinedの場合はworkモードの時間を返す', () => {
        // Given: undefined
        const mode = undefined;

        // When: getModeDuration関数を実行
        const result = getModeDuration(mode);

        // Then: workモードの時間(1500秒)が返される
        expect(result).toBe(1500);
      });
    });
  });

  describe('createTodaySummary() - Today Summary Creation', () => {
    describe('正常系: Valid Input', () => {
      test('指定した日付で今日のサマリーを作成する', () => {
        // Given: 日付文字列
        const date = '2025-01-01';

        // When: createTodaySummary関数を実行
        const result = createTodaySummary(date);

        // Then: 初期化されたサマリーが返される
        expect(result).toEqual({
          date: '2025-01-01',
          pomodoros: 0,
          completedTasks: 0,
          totalMinutes: 0,
          currentStreak: 0,
          lastTaskId: null
        });
      });

      test('すべてのフィールドが初期値0またはnullである', () => {
        // Given: 日付文字列
        const date = '2025-12-31';

        // When: createTodaySummary関数を実行
        const result = createTodaySummary(date);

        // Then: すべてのフィールドが初期値
        expect(result.pomodoros).toBe(0);
        expect(result.completedTasks).toBe(0);
        expect(result.totalMinutes).toBe(0);
        expect(result.currentStreak).toBe(0);
        expect(result.lastTaskId).toBeNull();
      });
    });

    describe('境界値: Edge Cases', () => {
      test('空文字列を渡してもオブジェクトを作成する', () => {
        // Given: 空文字列
        const date = '';

        // When: createTodaySummary関数を実行
        const result = createTodaySummary(date);

        // Then: 空文字列がdateに設定される
        expect(result.date).toBe('');
        expect(result.pomodoros).toBe(0);
      });

      test('ISO形式の日付文字列でオブジェクトを作成する', () => {
        // Given: ISO形式の日付
        const date = '2025-01-01T00:00:00.000Z';

        // When: createTodaySummary関数を実行
        const result = createTodaySummary(date);

        // Then: そのままdateに設定される
        expect(result.date).toBe('2025-01-01T00:00:00.000Z');
      });
    });
  });

  describe('safeParseStorage() - Safe Storage Parsing', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    describe('正常系: Valid Input', () => {
      test('有効なJSONをパースして返す', () => {
        // Given: 有効なJSON文字列をlocalStorageに保存
        const key = 'test_key';
        const data = { value: 123, name: 'test' };
        localStorage.setItem(key, JSON.stringify(data));

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, null);

        // Then: パースされたオブジェクトが返される
        expect(result).toEqual(data);
      });

      test('配列をパースして返す', () => {
        // Given: 配列のJSON文字列をlocalStorageに保存
        const key = 'test_array';
        const data = [1, 2, 3, 4, 5];
        localStorage.setItem(key, JSON.stringify(data));

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, []);

        // Then: パースされた配列が返される
        expect(result).toEqual(data);
      });

      test('文字列をパースして返す', () => {
        // Given: 文字列のJSON
        const key = 'test_string';
        const data = 'hello world';
        localStorage.setItem(key, JSON.stringify(data));

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, '');

        // Then: パースされた文字列が返される
        expect(result).toBe(data);
      });

      test('数値をパースして返す', () => {
        // Given: 数値のJSON
        const key = 'test_number';
        const data = 42;
        localStorage.setItem(key, JSON.stringify(data));

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, 0);

        // Then: パースされた数値が返される
        expect(result).toBe(data);
      });
    });

    describe('境界値: Missing or Empty Data', () => {
      test('キーが存在しない場合はfallbackを返す', () => {
        // Given: 存在しないキー
        const key = 'nonexistent_key';
        const fallback = { default: true };

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, fallback);

        // Then: fallbackが返される
        expect(result).toEqual(fallback);
      });

      test('値がnullの場合はfallbackを返す', () => {
        // Given: nullが保存されているキー
        const key = 'null_key';
        localStorage.setItem(key, null);

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, 'fallback');

        // Then: fallbackが返される
        expect(result).toBe('fallback');
      });

      test('fallbackが指定されていない場合はundefinedを返す', () => {
        // Given: 存在しないキー、fallbackなし
        const key = 'nonexistent';

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key);

        // Then: undefinedが返される
        expect(result).toBeUndefined();
      });
    });

    describe('異常系: Invalid JSON', () => {
      test('無効なJSONの場合はfallbackを返す', () => {
        // Given: 無効なJSON文字列
        const key = 'invalid_json';
        localStorage.setItem(key, '{invalid json}');
        const fallback = { error: true };

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, fallback);

        // Then: fallbackが返される
        expect(result).toEqual(fallback);
      });

      test('不完全なJSONの場合はfallbackを返す', () => {
        // Given: 不完全なJSON文字列
        const key = 'incomplete_json';
        localStorage.setItem(key, '{"key": "value"');
        const fallback = [];

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, fallback);

        // Then: fallbackが返される
        expect(result).toEqual(fallback);
      });

      test('空文字列の場合はfallbackを返す', () => {
        // Given: 空文字列
        const key = 'empty_string';
        localStorage.setItem(key, '');
        const fallback = 'default';

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, fallback);

        // Then: fallbackが返される
        expect(result).toBe('default');
      });

      test('localStorageのgetItemが例外を投げる場合はfallbackを返す', () => {
        // Given: getItemが例外を投げるモック
        const key = 'error_key';
        const fallback = { safe: true };
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = jest.fn(() => {
          throw new Error('Storage error');
        });

        // When: safeParseStorage関数を実行
        const result = safeParseStorage(key, fallback);

        // Then: fallbackが返される
        expect(result).toEqual(fallback);

        // Cleanup
        localStorage.getItem = originalGetItem;
      });
    });
  });
});
