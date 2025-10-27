/**
 * Statisticsクラスのテストスイート
 */

describe('Statistics クラス', () => {
  let stats;

  beforeEach(() => {
    stats = new Statistics();
  });

  describe('コンストラクタ', () => {
    test('正常系: 初期状態が正しく設定される', () => {
      // Given/When: Statisticsインスタンス生成
      const stats = new Statistics();
      
      // Then: 初期値が設定される
      expect(stats.todayPomodoros).toBe(0);
      expect(stats.todayCompletedTasks).toBe(0);
      expect(stats.pomodoroTimestamps).toEqual([]);
      expect(stats.lastResetDate).toBe(new Date().toDateString());
    });
  });

  describe('addPomodoro メソッド', () => {
    test('正常系: 初回追加でカウントが1になる', () => {
      // Given: 初期状態（todayPomodoros=0）
      expect(stats.todayPomodoros).toBe(0);
      
      // When: addPomodoro実行
      stats.addPomodoro();
      
      // Then: todayPomodoros=1
      expect(stats.todayPomodoros).toBe(1);
      expect(stats.pomodoroTimestamps).toHaveLength(1);
    });

    test('正常系: 複数回追加（5回）', () => {
      // Given: 初期状態
      
      // When: 5回実行
      for (let i = 0; i < 5; i++) {
        stats.addPomodoro();
      }
      
      // Then: todayPomodoros=5, タイムスタンプ5件
      expect(stats.todayPomodoros).toBe(5);
      expect(stats.pomodoroTimestamps).toHaveLength(5);
    });

    test('正常系: タイムスタンプがISO 8601形式で記録される', () => {
      // Given: 初期状態
      const beforeTime = new Date();
      
      // When: addPomodoro実行
      stats.addPomodoro();
      const afterTime = new Date();
      
      // Then: タイムスタンプが記録される
      expect(stats.pomodoroTimestamps).toHaveLength(1);
      const timestamp = new Date(stats.pomodoroTimestamps[0]);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      expect(stats.pomodoroTimestamps[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('正常系: 日付が変わっていたらリセットされる', () => {
      // Given: 昨日のデータ
      stats.todayPomodoros = 10;
      stats.pomodoroTimestamps = ['2025-10-26T10:00:00.000Z'];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      stats.lastResetDate = yesterday.toDateString();
      
      // When: addPomodoro実行（checkDailyResetが呼ばれる）
      stats.addPomodoro();
      
      // Then: リセット後に1になる
      expect(stats.todayPomodoros).toBe(1);
      expect(stats.pomodoroTimestamps).toHaveLength(1);
      expect(stats.lastResetDate).toBe(new Date().toDateString());
    });

    test('境界値: 100ポモドーロ追加', () => {
      // Given: 初期状態
      
      // When: 100回実行
      for (let i = 0; i < 100; i++) {
        stats.addPomodoro();
      }
      
      // Then: todayPomodoros=100
      expect(stats.todayPomodoros).toBe(100);
      expect(stats.pomodoroTimestamps).toHaveLength(100);
    });
  });

  describe('addCompletedTask メソッド', () => {
    test('正常系: 初回追加でカウントが1になる', () => {
      // Given: 初期状態（todayCompletedTasks=0）
      expect(stats.todayCompletedTasks).toBe(0);
      
      // When: addCompletedTask実行
      stats.addCompletedTask();
      
      // Then: todayCompletedTasks=1
      expect(stats.todayCompletedTasks).toBe(1);
    });

    test('正常系: 複数回追加（3回）', () => {
      // Given: 初期状態
      
      // When: 3回実行
      stats.addCompletedTask();
      stats.addCompletedTask();
      stats.addCompletedTask();
      
      // Then: todayCompletedTasks=3
      expect(stats.todayCompletedTasks).toBe(3);
    });

    test('正常系: 日付が変わっていたらリセットされる', () => {
      // Given: 昨日のデータ
      stats.todayCompletedTasks = 20;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      stats.lastResetDate = yesterday.toDateString();
      
      // When: addCompletedTask実行
      stats.addCompletedTask();
      
      // Then: リセット後に1になる
      expect(stats.todayCompletedTasks).toBe(1);
    });

    test('境界値: 50タスク完了', () => {
      // Given: 初期状態
      
      // When: 50回実行
      for (let i = 0; i < 50; i++) {
        stats.addCompletedTask();
      }
      
      // Then: todayCompletedTasks=50
      expect(stats.todayCompletedTasks).toBe(50);
    });
  });

  describe('getTotalWorkTime メソッド', () => {
    test('正常系: 0ポモドーロで0分', () => {
      // Given: todayPomodoros=0
      expect(stats.todayPomodoros).toBe(0);
      
      // When: getTotalWorkTime実行
      const workTime = stats.getTotalWorkTime();
      
      // Then: 0分
      expect(workTime).toBe(0);
    });

    test('正常系: 1ポモドーロで25分', () => {
      // Given: todayPomodoros=1
      stats.addPomodoro();
      
      // When: getTotalWorkTime実行
      const workTime = stats.getTotalWorkTime();
      
      // Then: 25分
      expect(workTime).toBe(25);
    });

    test('正常系: 5ポモドーロで125分', () => {
      // Given: todayPomodoros=5
      for (let i = 0; i < 5; i++) {
        stats.addPomodoro();
      }
      
      // When: getTotalWorkTime実行
      const workTime = stats.getTotalWorkTime();
      
      // Then: 125分
      expect(workTime).toBe(125);
    });

    test('境界値: 100ポモドーロで2500分', () => {
      // Given: todayPomodoros=100
      stats.todayPomodoros = 100;
      
      // When: getTotalWorkTime実行
      const workTime = stats.getTotalWorkTime();
      
      // Then: 2500分（41時間40分）
      expect(workTime).toBe(2500);
    });
  });

  describe('checkDailyReset メソッド', () => {
    test('正常系: 同じ日はリセットされない', () => {
      // Given: 今日のデータ
      stats.todayPomodoros = 5;
      stats.todayCompletedTasks = 3;
      stats.pomodoroTimestamps = ['timestamp1', 'timestamp2'];
      stats.lastResetDate = new Date().toDateString();
      
      // When: checkDailyReset実行
      stats.checkDailyReset();
      
      // Then: データが保持される
      expect(stats.todayPomodoros).toBe(5);
      expect(stats.todayCompletedTasks).toBe(3);
      expect(stats.pomodoroTimestamps).toHaveLength(2);
    });

    test('正常系: 日付が変わったらリセットされる', () => {
      // Given: 昨日のデータ
      stats.todayPomodoros = 10;
      stats.todayCompletedTasks = 7;
      stats.pomodoroTimestamps = ['old1', 'old2', 'old3'];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      stats.lastResetDate = yesterday.toDateString();
      
      // When: checkDailyReset実行
      stats.checkDailyReset();
      
      // Then: すべて0にリセットされる
      expect(stats.todayPomodoros).toBe(0);
      expect(stats.todayCompletedTasks).toBe(0);
      expect(stats.pomodoroTimestamps).toEqual([]);
      expect(stats.lastResetDate).toBe(new Date().toDateString());
    });

    test('境界値: ちょうど0時（日付境界）', () => {
      // Given: 昨日23:59のデータ
      stats.todayPomodoros = 8;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      stats.lastResetDate = yesterday.toDateString();
      
      // When: 今日0:00にcheckDailyReset実行
      stats.checkDailyReset();
      
      // Then: リセットされる
      expect(stats.todayPomodoros).toBe(0);
      expect(stats.lastResetDate).toBe(new Date().toDateString());
    });
  });

  describe('toJSON / fromJSON', () => {
    test('正常系: すべてのプロパティがシリアライズされる', () => {
      // Given: データが入った統計
      stats.todayPomodoros = 8;
      stats.todayCompletedTasks = 5;
      stats.pomodoroTimestamps = ['2025-10-27T10:00:00.000Z', '2025-10-27T11:00:00.000Z'];
      stats.lastResetDate = '2025-10-27';
      
      // When: JSON化
      const json = stats.toJSON();
      
      // Then: すべてのプロパティが含まれる
      expect(json).toHaveProperty('todayPomodoros');
      expect(json).toHaveProperty('todayCompletedTasks');
      expect(json).toHaveProperty('pomodoroTimestamps');
      expect(json).toHaveProperty('lastResetDate');
      
      expect(json.todayPomodoros).toBe(8);
      expect(json.todayCompletedTasks).toBe(5);
      expect(json.pomodoroTimestamps).toHaveLength(2);
      expect(json.lastResetDate).toBe('2025-10-27');
    });

    test('正常系: JSONから正しく復元される', () => {
      // Given: JSONデータ
      const jsonData = {
        todayPomodoros: 12,
        todayCompletedTasks: 8,
        pomodoroTimestamps: ['2025-10-27T09:00:00.000Z', '2025-10-27T10:00:00.000Z'],
        lastResetDate: '2025-10-27'
      };
      
      // When: fromJSON実行
      const restoredStats = Statistics.fromJSON(jsonData);
      
      // Then: 正しく復元される
      expect(restoredStats.todayPomodoros).toBe(12);
      expect(restoredStats.todayCompletedTasks).toBe(8);
      expect(restoredStats.pomodoroTimestamps).toHaveLength(2);
      expect(restoredStats.lastResetDate).toBe('2025-10-27');
    });

    test('正常系: 復元時に日付チェックが実行される', () => {
      // Given: 昨日のJSONデータ
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const jsonData = {
        todayPomodoros: 15,
        todayCompletedTasks: 10,
        pomodoroTimestamps: ['old-timestamp'],
        lastResetDate: yesterday.toDateString()
      };
      
      // When: fromJSON実行（checkDailyResetが内部で呼ばれる）
      const restoredStats = Statistics.fromJSON(jsonData);
      
      // Then: リセットされている
      expect(restoredStats.todayPomodoros).toBe(0);
      expect(restoredStats.todayCompletedTasks).toBe(0);
      expect(restoredStats.pomodoroTimestamps).toEqual([]);
      expect(restoredStats.lastResetDate).toBe(new Date().toDateString());
    });

    test('正常系: toJSON→fromJSONで状態が維持される（同じ日）', () => {
      // Given: 今日のデータ
      stats.todayPomodoros = 6;
      stats.todayCompletedTasks = 4;
      stats.pomodoroTimestamps = ['ts1', 'ts2'];
      stats.lastResetDate = new Date().toDateString();
      
      // When: JSON化→復元
      const json = stats.toJSON();
      const restored = Statistics.fromJSON(json);
      
      // Then: すべての状態が一致
      expect(restored.todayPomodoros).toBe(stats.todayPomodoros);
      expect(restored.todayCompletedTasks).toBe(stats.todayCompletedTasks);
      expect(restored.pomodoroTimestamps).toEqual(stats.pomodoroTimestamps);
      expect(restored.lastResetDate).toBe(stats.lastResetDate);
    });
  });

  describe('統合テスト: 統計のライフサイクル', () => {
    test('シナリオ: 1日の作業フロー', () => {
      // Given: 朝の初期状態
      const stats = new Statistics();
      expect(stats.todayPomodoros).toBe(0);
      expect(stats.todayCompletedTasks).toBe(0);
      
      // When: 午前中に3ポモドーロ、2タスク完了
      stats.addPomodoro();
      stats.addPomodoro();
      stats.addCompletedTask();
      stats.addPomodoro();
      stats.addCompletedTask();
      
      // Then: 統計が更新される
      expect(stats.todayPomodoros).toBe(3);
      expect(stats.todayCompletedTasks).toBe(2);
      expect(stats.getTotalWorkTime()).toBe(75); // 25*3
      
      // When: 午後に5ポモドーロ、3タスク完了
      for (let i = 0; i < 5; i++) {
        stats.addPomodoro();
      }
      for (let i = 0; i < 3; i++) {
        stats.addCompletedTask();
      }
      
      // Then: 合計が正しい
      expect(stats.todayPomodoros).toBe(8);
      expect(stats.todayCompletedTasks).toBe(5);
      expect(stats.getTotalWorkTime()).toBe(200); // 25*8
    });

    test('シナリオ: 日付をまたぐデータリセット', () => {
      // Given: 昨日のデータが保存されている
      const stats = new Statistics();
      stats.todayPomodoros = 20;
      stats.todayCompletedTasks = 15;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      stats.lastResetDate = yesterday.toDateString();
      
      // When: 翌日にaddPomodoroを呼ぶ
      stats.addPomodoro();
      
      // Then: リセット後に1になる
      expect(stats.todayPomodoros).toBe(1);
      expect(stats.todayCompletedTasks).toBe(0);
      expect(stats.lastResetDate).toBe(new Date().toDateString());
    });
  });
});
