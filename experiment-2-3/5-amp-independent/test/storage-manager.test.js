/**
 * StorageManagerクラスのテストスイート
 */

describe('StorageManager クラス', () => {
  let mockLocalStorage;

  beforeEach(() => {
    // localStorageのモック
    mockLocalStorage = (() => {
      let store = {};
      return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value; }),
        removeItem: jest.fn((key) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: jest.fn((index) => Object.keys(store)[index] || null)
      };
    })();

    // グローバルlocalStorageを置き換え
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // appのモック
    global.app = {
      showNotification: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save メソッド', () => {
    test('正常系: データを正常に保存できる', () => {
      // Given: キーとデータ
      const key = 'test_key';
      const data = { value: 'test_data' };
      
      // When: save実行
      StorageManager.save(key, data);
      
      // Then: localStorage.setItemが呼ばれる
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(data));
    });

    test('正常系: オブジェクトをJSON形式で保存', () => {
      // Given: 複雑なオブジェクト
      const data = {
        id: 'uuid-123',
        items: [1, 2, 3],
        nested: { a: 'b' }
      };
      
      // When: save実行
      StorageManager.save('complex', data);
      
      // Then: JSON文字列として保存
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'complex',
        JSON.stringify(data)
      );
    });

    test('異常系: QuotaExceededErrorでE005エラー表示', () => {
      // Given: setItemがQuotaExceededErrorをスロー
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      mockLocalStorage.setItem.mockImplementation(() => { throw error; });
      
      // When: save実行
      StorageManager.save('key', { large: 'data' });
      
      // Then: E005エラー通知が表示される
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E005, 'error');
    });

    test('異常系: その他のエラーでE006エラー表示', () => {
      // Given: setItemが一般的なエラーをスロー
      const error = new Error('Generic Error');
      mockLocalStorage.setItem.mockImplementation(() => { throw error; });
      
      // When: save実行
      StorageManager.save('key', { data: 'test' });
      
      // Then: E006エラー通知が表示される
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E006, 'error');
    });

    test('異常系: nullを保存', () => {
      // Given: null
      const data = null;
      
      // When: save実行
      StorageManager.save('null_key', data);
      
      // Then: "null"として保存される
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('null_key', 'null');
    });

    test('異常系: undefinedを保存', () => {
      // Given: undefined
      const data = undefined;
      
      // When: save実行
      StorageManager.save('undef_key', data);
      
      // Then: undefinedがJSON化される
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('load メソッド', () => {
    test('正常系: 保存されたデータを読み込む', () => {
      // Given: 保存されているデータ
      const data = { value: 'stored_data' };
      mockLocalStorage.setItem('test_key', JSON.stringify(data));
      
      // When: load実行
      const loaded = StorageManager.load('test_key');
      
      // Then: 同じデータが返る
      expect(loaded).toEqual(data);
    });

    test('正常系: 存在しないキーでdefaultValueを返す', () => {
      // Given: 存在しないキー
      const defaultValue = { default: true };
      
      // When: load実行
      const loaded = StorageManager.load('non_existent_key', defaultValue);
      
      // Then: defaultValueが返る
      expect(loaded).toEqual(defaultValue);
    });

    test('境界値: defaultValue=nullで存在しないキー', () => {
      // Given: 存在しないキー、defaultValue=null
      
      // When: load実行
      const loaded = StorageManager.load('missing_key', null);
      
      // Then: nullが返る
      expect(loaded).toBeNull();
    });

    test('異常系: 不正なJSON文字列でdefaultValueを返す', () => {
      // Given: 壊れたJSON
      mockLocalStorage.setItem('broken_json', '{invalid json}');
      const defaultValue = { fallback: true };
      
      // When: load実行
      const loaded = StorageManager.load('broken_json', defaultValue);
      
      // Then: defaultValueが返る（エラーハンドリング）
      expect(loaded).toEqual(defaultValue);
    });

    test('異常系: localStorage読み込みエラー', () => {
      // Given: getItemがエラーをスロー
      mockLocalStorage.getItem.mockImplementation(() => { throw new Error('Read error'); });
      const defaultValue = { error: 'handled' };
      
      // When: load実行
      const loaded = StorageManager.load('error_key', defaultValue);
      
      // Then: defaultValueが返る
      expect(loaded).toEqual(defaultValue);
    });
  });

  describe('saveTasks / loadTasks', () => {
    test('正常系: 空配列を保存・読み込み', () => {
      // Given: 空配列
      const tasks = [];
      
      // When: 保存→読み込み
      StorageManager.saveTasks(tasks);
      const loaded = StorageManager.loadTasks();
      
      // Then: 空配列が返る
      expect(loaded).toEqual([]);
    });

    test('正常系: 1タスクを保存・読み込み', () => {
      // Given: 1タスク
      const task = new Task('テストタスク', 3);
      const tasks = [task];
      
      // When: 保存→読み込み
      StorageManager.saveTasks(tasks);
      const loaded = StorageManager.loadTasks();
      
      // Then: 同じデータが復元される
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toBeInstanceOf(Task);
      expect(loaded[0].title).toBe('テストタスク');
      expect(loaded[0].estimatedPomodoros).toBe(3);
    });

    test('正常系: 複数タスクを保存・読み込み', () => {
      // Given: 複数タスク
      const task1 = new Task('タスク1', 2);
      const task2 = new Task('タスク2', 5);
      const task3 = new Task('タスク3', 1);
      const tasks = [task1, task2, task3];
      
      // When: 保存→読み込み
      StorageManager.saveTasks(tasks);
      const loaded = StorageManager.loadTasks();
      
      // Then: すべて復元される
      expect(loaded).toHaveLength(3);
      expect(loaded[0].title).toBe('タスク1');
      expect(loaded[1].title).toBe('タスク2');
      expect(loaded[2].title).toBe('タスク3');
    });

    test('境界値: 100タスクを保存・読み込み', () => {
      // Given: 100タスク
      const tasks = [];
      for (let i = 0; i < 100; i++) {
        tasks.push(new Task(`タスク${i}`, i % 10));
      }
      
      // When: 保存→読み込み
      StorageManager.saveTasks(tasks);
      const loaded = StorageManager.loadTasks();
      
      // Then: すべて復元される
      expect(loaded).toHaveLength(100);
      expect(loaded[0].title).toBe('タスク0');
      expect(loaded[99].title).toBe('タスク99');
    });

    test('境界値: 1000タスクを保存・読み込み', () => {
      // Given: 1000タスク
      const tasks = [];
      for (let i = 0; i < 1000; i++) {
        tasks.push(new Task(`タスク${i}`, 1));
      }
      
      // When: 保存→読み込み
      StorageManager.saveTasks(tasks);
      const loaded = StorageManager.loadTasks();
      
      // Then: すべて復元される
      expect(loaded).toHaveLength(1000);
    });

    test('異常系: 不正なデータで空配列を返す', () => {
      // Given: 壊れたデータ
      mockLocalStorage.setItem(STORAGE_KEYS.tasks, '{invalid}');
      
      // When: loadTasks実行
      const loaded = StorageManager.loadTasks();
      
      // Then: 空配列が返る
      expect(loaded).toEqual([]);
    });
  });

  describe('saveTimer / loadTimer', () => {
    test('正常系: 初期状態のTimerを保存・読み込み', () => {
      // Given: 新規Timer
      const timer = new Timer();
      
      // When: 保存→読み込み
      StorageManager.saveTimer(timer);
      const loaded = StorageManager.loadTimer();
      
      // Then: 同じ状態が復元される
      expect(loaded).toBeInstanceOf(Timer);
      expect(loaded.mode).toBe('work');
      expect(loaded.remainingSeconds).toBe(CONFIG.workDuration);
    });

    test('正常系: 実行中のTimerを保存・読み込み（isRunningは復元されない仕様）', () => {
      // Given: 実行中のTimer
      const timer = new Timer();
      timer.start('task-123');
      timer.remainingSeconds = 1000;
      
      // When: 保存→読み込み
      StorageManager.saveTimer(timer);
      const loaded = StorageManager.loadTimer();
      
      // Then: 状態は復元されるが、isRunningは復元されない
      expect(loaded.remainingSeconds).toBe(1000);
      expect(loaded.currentTaskId).toBe('task-123');
      // isRunningは復元時にfalseになる（仕様）
    });

    test('正常系: データがない場合は新規Timerを返す', () => {
      // Given: データなし
      mockLocalStorage.removeItem(STORAGE_KEYS.timer);
      
      // When: loadTimer実行
      const loaded = StorageManager.loadTimer();
      
      // Then: 新規Timerインスタンス
      expect(loaded).toBeInstanceOf(Timer);
      expect(loaded.mode).toBe('work');
    });
  });

  describe('saveStatistics / loadStatistics', () => {
    test('正常系: Statisticsを保存・読み込み', () => {
      // Given: データが入ったStatistics
      const stats = new Statistics();
      stats.todayPomodoros = 8;
      stats.todayCompletedTasks = 5;
      
      // When: 保存→読み込み
      StorageManager.saveStatistics(stats);
      const loaded = StorageManager.loadStatistics();
      
      // Then: 同じデータが復元される
      expect(loaded).toBeInstanceOf(Statistics);
      expect(loaded.todayPomodoros).toBe(8);
      expect(loaded.todayCompletedTasks).toBe(5);
    });

    test('正常系: データがない場合は新規Statisticsを返す', () => {
      // Given: データなし
      mockLocalStorage.removeItem(STORAGE_KEYS.statistics);
      
      // When: loadStatistics実行
      const loaded = StorageManager.loadStatistics();
      
      // Then: 新規Statisticsインスタンス
      expect(loaded).toBeInstanceOf(Statistics);
      expect(loaded.todayPomodoros).toBe(0);
      expect(loaded.todayCompletedTasks).toBe(0);
    });

    test('正常系: 日付リセットチェックが実行される', () => {
      // Given: 昨日のデータ
      const stats = new Statistics();
      stats.todayPomodoros = 20;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      stats.lastResetDate = yesterday.toDateString();
      
      // When: 保存→読み込み
      StorageManager.saveStatistics(stats);
      const loaded = StorageManager.loadStatistics();
      
      // Then: リセットされている
      expect(loaded.todayPomodoros).toBe(0);
      expect(loaded.lastResetDate).toBe(new Date().toDateString());
    });
  });

  describe('saveFilter / loadFilter', () => {
    test('正常系: フィルタを保存・読み込み', () => {
      // Given: フィルタ='active'
      const filter = 'active';
      
      // When: 保存→読み込み
      StorageManager.saveFilter(filter);
      const loaded = StorageManager.loadFilter();
      
      // Then: 'active'が返る
      expect(loaded).toBe('active');
    });

    test('正常系: フィルタ='completed'を保存・読み込み', () => {
      // Given: フィルタ='completed'
      StorageManager.saveFilter('completed');
      
      // When: load実行
      const loaded = StorageManager.loadFilter();
      
      // Then: 'completed'が返る
      expect(loaded).toBe('completed');
    });

    test('正常系: データがない場合はデフォルト'all'を返す', () => {
      // Given: データなし
      mockLocalStorage.removeItem(STORAGE_KEYS.filter);
      
      // When: loadFilter実行
      const loaded = StorageManager.loadFilter();
      
      // Then: 'all'が返る
      expect(loaded).toBe('all');
    });
  });

  describe('統合テスト: データの永続化', () => {
    test('シナリオ: タスク追加→保存→リロード→復元', () => {
      // Given: タスク追加
      const task1 = new Task('重要なタスク', 5);
      const task2 = new Task('緊急タスク', 2);
      task1.incrementPomodoros();
      task1.incrementPomodoros();
      task2.toggleComplete();
      
      const tasks = [task1, task2];
      
      // When: 保存
      StorageManager.saveTasks(tasks);
      
      // When: リロード（新しいインスタンスを読み込み）
      const loadedTasks = StorageManager.loadTasks();
      
      // Then: すべてのデータが復元される
      expect(loadedTasks).toHaveLength(2);
      expect(loadedTasks[0].title).toBe('重要なタスク');
      expect(loadedTasks[0].actualPomodoros).toBe(2);
      expect(loadedTasks[1].completed).toBe(true);
    });

    test('シナリオ: アプリ状態の完全保存・復元', () => {
      // Given: アプリの完全な状態
      const tasks = [new Task('タスク1', 3), new Task('タスク2', 2)];
      const timer = new Timer();
      timer.pomodoroCount = 4;
      const stats = new Statistics();
      stats.todayPomodoros = 10;
      stats.todayCompletedTasks = 7;
      const filter = 'active';
      
      // When: すべて保存
      StorageManager.saveTasks(tasks);
      StorageManager.saveTimer(timer);
      StorageManager.saveStatistics(stats);
      StorageManager.saveFilter(filter);
      
      // When: すべて読み込み
      const loadedTasks = StorageManager.loadTasks();
      const loadedTimer = StorageManager.loadTimer();
      const loadedStats = StorageManager.loadStatistics();
      const loadedFilter = StorageManager.loadFilter();
      
      // Then: すべて復元される
      expect(loadedTasks).toHaveLength(2);
      expect(loadedTimer.pomodoroCount).toBe(4);
      expect(loadedStats.todayPomodoros).toBe(10);
      expect(loadedFilter).toBe('active');
    });
  });
});
