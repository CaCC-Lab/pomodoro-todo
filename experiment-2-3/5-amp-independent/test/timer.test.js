/**
 * Timerクラスのテストスイート
 */

describe('Timer クラス', () => {
  let timer;

  beforeEach(() => {
    // 各テストの前に新しいTimerインスタンスを生成
    timer = new Timer();
    // タイマーをクリア
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
    }
    jest.useRealTimers();
  });

  describe('コンストラクタ', () => {
    test('正常系: 初期状態が正しく設定される', () => {
      // Given/When: Timerインスタンス生成
      const timer = new Timer();
      
      // Then: デフォルト値が設定される
      expect(timer.mode).toBe('work');
      expect(timer.remainingSeconds).toBe(CONFIG.workDuration); // 1500
      expect(timer.totalSeconds).toBe(CONFIG.workDuration);
      expect(timer.isRunning).toBe(false);
      expect(timer.intervalId).toBeNull();
      expect(timer.startTime).toBeNull();
      expect(timer.currentTaskId).toBeNull();
      expect(timer.pomodoroCount).toBe(0);
    });
  });

  describe('start メソッド', () => {
    test('正常系: 停止状態から開始できる', () => {
      // Given: 停止状態のタイマー
      const taskId = 'test-task-123';
      expect(timer.isRunning).toBe(false);
      
      // When: start実行
      timer.start(taskId);
      
      // Then: 実行状態になる
      expect(timer.isRunning).toBe(true);
      expect(timer.currentTaskId).toBe(taskId);
      expect(timer.startTime).not.toBeNull();
      expect(timer.intervalId).not.toBeNull();
    });

    test('正常系: 実行中に再度startを呼んでも何も起きない', () => {
      // Given: 実行中のタイマー
      timer.start('task-1');
      const firstIntervalId = timer.intervalId;
      const firstStartTime = timer.startTime;
      
      // When: 再度start実行
      timer.start('task-2');
      
      // Then: 状態が変わらない（早期リターン）
      expect(timer.intervalId).toBe(firstIntervalId);
      expect(timer.startTime).toBe(firstStartTime);
      expect(timer.currentTaskId).toBe('task-1'); // 最初のタスクのまま
    });

    test('境界値: taskId=nullで開始', () => {
      // Given: taskId=null
      const taskId = null;
      
      // When: start実行
      timer.start(taskId);
      
      // Then: currentTaskId=null
      expect(timer.currentTaskId).toBeNull();
      expect(timer.isRunning).toBe(true);
    });

    test('異常系: taskId=undefinedで開始', () => {
      // Given: taskId=undefined
      const taskId = undefined;
      
      // When: start実行
      timer.start(taskId);
      
      // Then: currentTaskId=undefined
      expect(timer.currentTaskId).toBeUndefined();
      expect(timer.isRunning).toBe(true);
    });
  });

  describe('pause メソッド', () => {
    test('正常系: 実行中を一時停止', () => {
      // Given: 実行中のタイマー
      timer.start('task-1');
      expect(timer.isRunning).toBe(true);
      
      // When: pause実行
      timer.pause();
      
      // Then: 停止状態になる
      expect(timer.isRunning).toBe(false);
      expect(timer.intervalId).toBeNull();
    });

    test('正常系: 停止中にpauseを呼んでも問題ない', () => {
      // Given: 停止中のタイマー
      expect(timer.isRunning).toBe(false);
      
      // When: pause実行
      timer.pause();
      
      // Then: エラーなく実行される
      expect(timer.isRunning).toBe(false);
      expect(timer.intervalId).toBeNull();
    });
  });

  describe('reset メソッド', () => {
    test('正常系: 実行中をリセット', () => {
      // Given: 実行中で時間が経過したタイマー
      timer.start('task-1');
      timer.remainingSeconds = 1000; // 時間経過をシミュレート
      
      // When: reset実行
      timer.reset();
      
      // Then: 停止し、remainingSecondsがtotalSecondsに戻る
      expect(timer.isRunning).toBe(false);
      expect(timer.remainingSeconds).toBe(timer.totalSeconds);
      expect(timer.startTime).toBeNull();
    });

    test('正常系: 停止中をリセット', () => {
      // Given: 停止中で時間が進んだタイマー
      timer.remainingSeconds = 500;
      
      // When: reset実行
      timer.reset();
      
      // Then: totalSecondsに戻る
      expect(timer.remainingSeconds).toBe(CONFIG.workDuration);
    });
  });

  describe('skip メソッド', () => {
    test('正常系: 作業モード→休憩モードにスキップ', () => {
      // Given: 作業モード
      expect(timer.mode).toBe('work');
      
      // When: skip実行
      timer.skip();
      
      // Then: 休憩モードに切り替わる
      expect(timer.mode).toBe('break');
      expect(timer.isRunning).toBe(false); // pauseされる
    });

    test('正常系: 休憩モード→作業モードにスキップ', () => {
      // Given: 休憩モード
      timer.setMode('break');
      expect(timer.mode).toBe('break');
      
      // When: skip実行
      timer.skip();
      
      // Then: 作業モードに切り替わる
      expect(timer.mode).toBe('work');
    });
  });

  describe('setMode メソッド', () => {
    test('正常系: 作業モードに設定', () => {
      // Given: 休憩モード
      timer.mode = 'break';
      
      // When: setMode('work')
      timer.setMode('work');
      
      // Then: 作業時間（25分）が設定される
      expect(timer.mode).toBe('work');
      expect(timer.totalSeconds).toBe(CONFIG.workDuration); // 1500
      expect(timer.remainingSeconds).toBe(CONFIG.workDuration);
    });

    test('正常系: 休憩モード（短）に設定', () => {
      // Given: ポモドーロカウント1
      timer.pomodoroCount = 1;
      
      // When: setMode('break')
      timer.setMode('break');
      
      // Then: 短い休憩（5分）、ポモドーロカウント+1
      expect(timer.mode).toBe('break');
      expect(timer.totalSeconds).toBe(CONFIG.shortBreak); // 300
      expect(timer.pomodoroCount).toBe(2);
    });

    test('境界値: ポモドーロカウント3で休憩モード（短）', () => {
      // Given: ポモドーロカウント3（4の倍数未満）
      timer.pomodoroCount = 3;
      
      // When: setMode('break')
      timer.setMode('break');
      
      // Then: 短い休憩
      expect(timer.totalSeconds).toBe(CONFIG.shortBreak); // 300
      expect(timer.pomodoroCount).toBe(4);
    });

    test('境界値: ポモドーロカウント4で休憩モード（長）', () => {
      // Given: ポモドーロカウント4（4の倍数）
      timer.pomodoroCount = 3; // 次のsetModeで4になる
      
      // When: setMode('break')
      timer.setMode('break');
      
      // Then: 長い休憩（15分）
      expect(timer.pomodoroCount).toBe(4);
      expect(timer.totalSeconds).toBe(CONFIG.longBreak); // 900
    });

    test('境界値: ポモドーロカウント5で休憩モード（短）', () => {
      // Given: ポモドーロカウント5（4で割り切れない）
      timer.pomodoroCount = 4; // 次で5になる
      
      // When: setMode('break')
      timer.setMode('break');
      
      // Then: 短い休憩
      expect(timer.pomodoroCount).toBe(5);
      expect(timer.totalSeconds).toBe(CONFIG.shortBreak); // 300
    });
  });

  describe('tick メソッド', () => {
    test('正常系: 1秒経過すると remainingSeconds が減る', () => {
      // Given: 実行中のタイマー
      const mockApp = {
        todoController: { incrementTaskPomodoros: jest.fn() },
        statisticsController: { addPomodoro: jest.fn() },
        timerController: { handleTimerComplete: jest.fn() }
      };
      global.app = mockApp;
      
      timer.start('task-1');
      const initialRemaining = timer.remainingSeconds;
      
      // When: 1秒経過（Date.nowをモック）
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => timer.startTime + 1000); // 1秒後
      
      timer.tick();
      
      // Then: remainingSecondsが1減る
      expect(timer.remainingSeconds).toBe(initialRemaining - 1);
      
      // クリーンアップ
      Date.now = originalDateNow;
    });

    test('正常系: タイマー完了時にonCompleteが呼ばれる', () => {
      // Given: 残り時間0のタイマー
      const mockApp = {
        todoController: { incrementTaskPomodoros: jest.fn() },
        statisticsController: { addPomodoro: jest.fn() },
        timerController: { handleTimerComplete: jest.fn() }
      };
      global.app = mockApp;
      
      timer.start('task-1');
      timer.totalSeconds = 1;
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => timer.startTime + 1000); // 1秒後
      
      // When: tick実行
      timer.tick();
      
      // Then: onCompleteが呼ばれる
      expect(timer.isRunning).toBe(false);
      expect(timer.remainingSeconds).toBe(0);
      expect(mockApp.timerController.handleTimerComplete).toHaveBeenCalled();
      
      // クリーンアップ
      Date.now = originalDateNow;
    });

    test('境界値: remainingSeconds=1のときにtick実行でonComplete', () => {
      // Given: 残り1秒のタイマー
      const mockApp = {
        todoController: { incrementTaskPomodoros: jest.fn() },
        statisticsController: { addPomodoro: jest.fn() },
        timerController: { handleTimerComplete: jest.fn() }
      };
      global.app = mockApp;
      
      timer.start('task-1');
      timer.totalSeconds = 1;
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => timer.startTime + 1000);
      
      // When: tick実行
      timer.tick();
      
      // Then: onCompleteが呼ばれる
      expect(mockApp.timerController.handleTimerComplete).toHaveBeenCalled();
      
      // クリーンアップ
      Date.now = originalDateNow;
    });
  });

  describe('onComplete メソッド', () => {
    test('正常系: 作業完了時にタスクのポモドーロ数が増える', () => {
      // Given: 作業モードのタイマー
      const mockApp = {
        todoController: { incrementTaskPomodoros: jest.fn() },
        statisticsController: { addPomodoro: jest.fn() },
        timerController: { handleTimerComplete: jest.fn() }
      };
      global.app = mockApp;
      
      timer.mode = 'work';
      timer.currentTaskId = 'task-123';
      timer.isRunning = true;
      
      // When: onComplete実行
      timer.onComplete();
      
      // Then: ポモドーロ数が増加
      expect(mockApp.todoController.incrementTaskPomodoros).toHaveBeenCalledWith('task-123');
      expect(mockApp.statisticsController.addPomodoro).toHaveBeenCalled();
      expect(mockApp.timerController.handleTimerComplete).toHaveBeenCalled();
      expect(timer.isRunning).toBe(false);
      expect(timer.remainingSeconds).toBe(0);
    });

    test('正常系: 休憩完了時はポモドーロ数が増えない', () => {
      // Given: 休憩モードのタイマー
      const mockApp = {
        todoController: { incrementTaskPomodoros: jest.fn() },
        statisticsController: { addPomodoro: jest.fn() },
        timerController: { handleTimerComplete: jest.fn() }
      };
      global.app = mockApp;
      
      timer.mode = 'break';
      timer.currentTaskId = 'task-123';
      timer.isRunning = true;
      
      // When: onComplete実行
      timer.onComplete();
      
      // Then: ポモドーロ数は増えない
      expect(mockApp.todoController.incrementTaskPomodoros).not.toHaveBeenCalled();
      expect(mockApp.statisticsController.addPomodoro).not.toHaveBeenCalled();
      expect(mockApp.timerController.handleTimerComplete).toHaveBeenCalled();
    });
  });

  describe('getProgress メソッド', () => {
    test('正常系: 進捗0%（開始直後）', () => {
      // Given: 開始直後
      timer.remainingSeconds = timer.totalSeconds;
      
      // When: getProgress実行
      const progress = timer.getProgress();
      
      // Then: 0%
      expect(progress).toBe(0);
    });

    test('正常系: 進捗50%（半分経過）', () => {
      // Given: 半分経過
      timer.totalSeconds = 1000;
      timer.remainingSeconds = 500;
      
      // When: getProgress実行
      const progress = timer.getProgress();
      
      // Then: 50%
      expect(progress).toBe(50);
    });

    test('正常系: 進捗100%（完了）', () => {
      // Given: 完了
      timer.remainingSeconds = 0;
      
      // When: getProgress実行
      const progress = timer.getProgress();
      
      // Then: 100%
      expect(progress).toBe(100);
    });

    test('境界値: 1秒経過の進捗率', () => {
      // Given: 1500秒中1秒経過
      timer.totalSeconds = 1500;
      timer.remainingSeconds = 1499;
      
      // When: getProgress実行
      const progress = timer.getProgress();
      
      // Then: 約0.067%
      expect(progress).toBeCloseTo(0.0667, 2);
    });
  });

  describe('toJSON / fromJSON', () => {
    test('正常系: すべての状態がシリアライズされる', () => {
      // Given: 実行中のタイマー
      timer.start('task-456');
      timer.pomodoroCount = 3;
      timer.remainingSeconds = 1000;
      
      // When: JSON化
      const json = timer.toJSON();
      
      // Then: すべてのプロパティが含まれる
      expect(json).toHaveProperty('mode');
      expect(json).toHaveProperty('remainingSeconds');
      expect(json).toHaveProperty('totalSeconds');
      expect(json).toHaveProperty('isRunning');
      expect(json).toHaveProperty('currentTaskId');
      expect(json).toHaveProperty('pomodoroCount');
      expect(json).toHaveProperty('startTime');
      
      expect(json.mode).toBe('work');
      expect(json.currentTaskId).toBe('task-456');
      expect(json.pomodoroCount).toBe(3);
      expect(json.remainingSeconds).toBe(1000);
    });

    test('正常系: JSONから正しく復元される', () => {
      // Given: JSONデータ
      const jsonData = {
        mode: 'break',
        remainingSeconds: 200,
        totalSeconds: 300,
        isRunning: false,
        currentTaskId: 'task-789',
        pomodoroCount: 4,
        startTime: Date.now()
      };
      
      // When: fromJSON実行
      const restoredTimer = Timer.fromJSON(jsonData);
      
      // Then: 正しく復元
      expect(restoredTimer.mode).toBe('break');
      expect(restoredTimer.remainingSeconds).toBe(200);
      expect(restoredTimer.totalSeconds).toBe(300);
      expect(restoredTimer.isRunning).toBe(false);
      expect(restoredTimer.currentTaskId).toBe('task-789');
      expect(restoredTimer.pomodoroCount).toBe(4);
    });

    test('正常系: toJSON→fromJSONで状態が維持される', () => {
      // Given: タイマーの状態
      timer.mode = 'break';
      timer.pomodoroCount = 2;
      timer.remainingSeconds = 150;
      timer.currentTaskId = 'task-999';
      
      // When: JSON化→復元
      const json = timer.toJSON();
      const restored = Timer.fromJSON(json);
      
      // Then: すべての状態が一致
      expect(restored.mode).toBe(timer.mode);
      expect(restored.pomodoroCount).toBe(timer.pomodoroCount);
      expect(restored.remainingSeconds).toBe(timer.remainingSeconds);
      expect(restored.currentTaskId).toBe(timer.currentTaskId);
    });
  });
});
