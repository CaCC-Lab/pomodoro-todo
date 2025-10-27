/**
 * TodoControllerクラスのテストスイート
 */

describe('TodoController クラス', () => {
  let controller;
  let mockApp;

  beforeEach(() => {
    // DOMのセットアップ
    document.body.innerHTML = `
      <div id="task-list"></div>
    `;

    // アプリのモック
    mockApp = {
      showNotification: jest.fn(),
      timer: {
        isRunning: false,
        currentTaskId: null
      },
      timerController: {
        updateCurrentTaskDisplay: jest.fn()
      },
      statisticsController: {
        addCompletedTask: jest.fn(),
        render: jest.fn()
      },
      statistics: {
        todayCompletedTasks: 0
      }
    };
    global.app = mockApp;

    // TodoControllerインスタンス生成
    controller = new TodoController();
    controller.init = jest.fn(); // initをモック化
    controller.tasks = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addTask メソッド', () => {
    test('正常系: 通常のタスクを追加できる', () => {
      // Given: タスク名と見積もり
      const title = 'テストタスク';
      const estimatedPomodoros = 5;
      
      // When: addTask実行
      const result = controller.addTask(title, estimatedPomodoros);
      
      // Then: タスクが追加される
      expect(result).toBe(true);
      expect(controller.tasks).toHaveLength(1);
      expect(controller.tasks[0].title).toBe('テストタスク');
      expect(controller.tasks[0].estimatedPomodoros).toBe(5);
    });

    test('正常系: 見積もりなし（0）でタスク追加', () => {
      // Given: タスク名のみ
      const title = 'シンプルタスク';
      
      // When: addTask実行
      const result = controller.addTask(title, 0);
      
      // Then: estimatedPomodoros=0で追加
      expect(result).toBe(true);
      expect(controller.tasks[0].estimatedPomodoros).toBe(0);
    });

    test('正常系: タスクは配列の先頭に追加される（unshift）', () => {
      // Given: 既存タスク
      controller.tasks = [new Task('既存タスク', 1)];
      
      // When: 新規タスク追加
      controller.addTask('新規タスク', 2);
      
      // Then: 先頭に追加される
      expect(controller.tasks).toHaveLength(2);
      expect(controller.tasks[0].title).toBe('新規タスク');
      expect(controller.tasks[1].title).toBe('既存タスク');
    });

    test('境界値: 1文字のタスク名', () => {
      // Given: 1文字
      const result = controller.addTask('a', 0);
      
      // When/Then: 追加成功
      expect(result).toBe(true);
      expect(controller.tasks[0].title).toBe('a');
    });

    test('境界値: 100文字のタスク名', () => {
      // Given: 100文字
      const title = 'あ'.repeat(100);
      const result = controller.addTask(title, 0);
      
      // When/Then: 追加成功
      expect(result).toBe(true);
      expect(controller.tasks[0].title).toHaveLength(100);
    });

    test('境界値: 前後に空白があるタスク名（trim処理）', () => {
      // Given: 空白付きタスク名
      const title = '  タスク名  ';
      
      // When: addTask実行
      controller.addTask(title, 0);
      
      // Then: trimされて保存
      expect(controller.tasks[0].title).toBe('タスク名');
    });

    test('異常系: 空文字でE001エラー', () => {
      // Given: 空文字
      const title = '';
      
      // When: addTask実行
      const result = controller.addTask(title, 0);
      
      // Then: falseが返り、エラー通知
      expect(result).toBe(false);
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E001, 'error');
      expect(controller.tasks).toHaveLength(0);
    });

    test('異常系: 空白のみでE001エラー', () => {
      // Given: 空白のみ
      const title = '   ';
      
      // When: addTask実行
      const result = controller.addTask(title, 0);
      
      // Then: falseが返り、エラー通知
      expect(result).toBe(false);
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E001, 'error');
    });

    test('異常系: 101文字でE002エラー', () => {
      // Given: 101文字
      const title = 'あ'.repeat(101);
      
      // When: addTask実行
      const result = controller.addTask(title, 0);
      
      // Then: falseが返り、エラー通知
      expect(result).toBe(false);
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E002, 'error');
      expect(controller.tasks).toHaveLength(0);
    });

    test('異常系: nullでエラー', () => {
      // Given: null
      const result = controller.addTask(null, 0);
      
      // When/Then: エラー
      expect(result).toBe(false);
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E001, 'error');
    });

    test('異常系: undefinedでエラー', () => {
      // Given: undefined
      const result = controller.addTask(undefined, 0);
      
      // When/Then: エラー
      expect(result).toBe(false);
    });
  });

  describe('editTask メソッド', () => {
    test('正常系: タスク名を編集できる', () => {
      // Given: 既存タスク
      const task = new Task('元のタイトル', 3);
      controller.tasks = [task];
      
      // When: editTask実行
      const result = controller.editTask(task.id, '新しいタイトル');
      
      // Then: タイトルが変更される
      expect(result).toBe(true);
      expect(controller.tasks[0].title).toBe('新しいタイトル');
    });

    test('正常系: 前後の空白は削除される', () => {
      // Given: 既存タスク
      const task = new Task('タスク', 1);
      controller.tasks = [task];
      
      // When: 空白付きで編集
      controller.editTask(task.id, '  新タイトル  ');
      
      // Then: trimされる
      expect(controller.tasks[0].title).toBe('新タイトル');
    });

    test('境界値: 1文字に編集', () => {
      // Given: 既存タスク
      const task = new Task('長いタスク名', 1);
      controller.tasks = [task];
      
      // When: 1文字に編集
      const result = controller.editTask(task.id, 'a');
      
      // Then: 成功
      expect(result).toBe(true);
      expect(controller.tasks[0].title).toBe('a');
    });

    test('境界値: 100文字に編集', () => {
      // Given: 既存タスク
      const task = new Task('タスク', 1);
      controller.tasks = [task];
      const newTitle = 'あ'.repeat(100);
      
      // When: 100文字に編集
      const result = controller.editTask(task.id, newTitle);
      
      // Then: 成功
      expect(result).toBe(true);
      expect(controller.tasks[0].title).toHaveLength(100);
    });

    test('異常系: 存在しないIDでfalseを返す', () => {
      // Given: 既存タスク
      controller.tasks = [new Task('タスク', 1)];
      
      // When: 存在しないID
      const result = controller.editTask('invalid-id', '新タイトル');
      
      // Then: falseが返る
      expect(result).toBe(false);
    });

    test('異常系: 空文字でE001エラー', () => {
      // Given: 既存タスク
      const task = new Task('タスク', 1);
      controller.tasks = [task];
      
      // When: 空文字で編集
      const result = controller.editTask(task.id, '');
      
      // Then: falseとエラー通知
      expect(result).toBe(false);
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E001, 'error');
      expect(controller.tasks[0].title).toBe('タスク'); // 変更されない
    });

    test('異常系: 101文字でE002エラー', () => {
      // Given: 既存タスク
      const task = new Task('タスク', 1);
      controller.tasks = [task];
      const longTitle = 'あ'.repeat(101);
      
      // When: 101文字で編集
      const result = controller.editTask(task.id, longTitle);
      
      // Then: falseとエラー通知
      expect(result).toBe(false);
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E002, 'error');
    });

    test('異常系: 空白のみでE001エラー', () => {
      // Given: 既存タスク
      const task = new Task('タスク', 1);
      controller.tasks = [task];
      
      // When: 空白のみで編集
      const result = controller.editTask(task.id, '   ');
      
      // Then: エラー
      expect(result).toBe(false);
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E001, 'error');
    });
  });

  describe('deleteTask メソッド', () => {
    test('正常系: タスクを削除できる', () => {
      // Given: 既存タスク
      const task = new Task('削除タスク', 1);
      controller.tasks = [task];
      
      // When: deleteTask実行
      const result = controller.deleteTask(task.id);
      
      // Then: 削除される
      expect(result).toBe(true);
      expect(controller.tasks).toHaveLength(0);
    });

    test('正常系: 選択中タスクを削除するとselectedTaskIdがnullになる', () => {
      // Given: 選択中タスク
      const task = new Task('タスク', 1);
      controller.tasks = [task];
      controller.selectedTaskId = task.id;
      
      // When: deleteTask実行
      const result = controller.deleteTask(task.id);
      
      // Then: selectedTaskId=null
      expect(result).toBe(true);
      expect(controller.selectedTaskId).toBeNull();
      expect(app.timerController.updateCurrentTaskDisplay).toHaveBeenCalled();
    });

    test('正常系: 複数タスクから1つを削除', () => {
      // Given: 3つのタスク
      const task1 = new Task('タスク1', 1);
      const task2 = new Task('タスク2', 2);
      const task3 = new Task('タスク3', 3);
      controller.tasks = [task1, task2, task3];
      
      // When: task2を削除
      controller.deleteTask(task2.id);
      
      // Then: task2のみ削除される
      expect(controller.tasks).toHaveLength(2);
      expect(controller.tasks[0].title).toBe('タスク1');
      expect(controller.tasks[1].title).toBe('タスク3');
    });

    test('異常系: タイマー実行中のタスクは削除不可', () => {
      // Given: タイマー実行中のタスク
      const task = new Task('実行中タスク', 1);
      controller.tasks = [task];
      app.timer.isRunning = true;
      app.timer.currentTaskId = task.id;
      
      // When: deleteTask実行
      const result = controller.deleteTask(task.id);
      
      // Then: 削除されず、E004エラー
      expect(result).toBe(false);
      expect(app.showNotification).toHaveBeenCalledWith(ERRORS.E004, 'error');
      expect(controller.tasks).toHaveLength(1);
    });

    test('異常系: 存在しないIDでもtrueを返す（何も起きない）', () => {
      // Given: 既存タスク
      controller.tasks = [new Task('タスク', 1)];
      
      // When: 存在しないID
      const result = controller.deleteTask('invalid-id');
      
      // Then: trueだが何も変わらない
      expect(result).toBe(true);
      expect(controller.tasks).toHaveLength(1);
    });
  });

  describe('toggleTaskComplete メソッド', () => {
    test('正常系: 未完了→完了に切り替え', () => {
      // Given: 未完了タスク
      const task = new Task('タスク', 1);
      controller.tasks = [task];
      
      // When: toggleTaskComplete実行
      controller.toggleTaskComplete(task.id);
      
      // Then: 完了状態になり、統計が増える
      expect(task.completed).toBe(true);
      expect(app.statisticsController.addCompletedTask).toHaveBeenCalled();
    });

    test('正常系: 完了→未完了に切り替え', () => {
      // Given: 完了済みタスク
      const task = new Task('タスク', 1);
      task.toggleComplete(); // 完了にする
      controller.tasks = [task];
      app.statistics.todayCompletedTasks = 1;
      
      // When: toggleTaskComplete実行
      controller.toggleTaskComplete(task.id);
      
      // Then: 未完了に戻り、統計が減る
      expect(task.completed).toBe(false);
      expect(app.statistics.todayCompletedTasks).toBe(0);
    });

    test('境界値: 統計が0のときに未完了にしても負にならない', () => {
      // Given: 完了タスク、統計0
      const task = new Task('タスク', 1);
      task.toggleComplete();
      controller.tasks = [task];
      app.statistics.todayCompletedTasks = 0;
      
      // When: 未完了に切り替え
      controller.toggleTaskComplete(task.id);
      
      // Then: 統計は0のまま（負にならない）
      expect(app.statistics.todayCompletedTasks).toBe(0);
    });
  });

  describe('selectTask メソッド', () => {
    test('正常系: タスクを選択できる', () => {
      // Given: タスク
      const task = new Task('タスク', 1);
      controller.tasks = [task];
      
      // When: selectTask実行
      controller.selectTask(task.id);
      
      // Then: selectedTaskIdが設定される
      expect(controller.selectedTaskId).toBe(task.id);
      expect(app.timerController.updateCurrentTaskDisplay).toHaveBeenCalled();
    });

    test('異常系: タイマー実行中は選択不可', () => {
      // Given: タイマー実行中
      const task = new Task('タスク', 1);
      controller.tasks = [task];
      app.timer.isRunning = true;
      
      // When: selectTask実行
      controller.selectTask(task.id);
      
      // Then: エラー通知、選択されない
      expect(app.showNotification).toHaveBeenCalledWith(
        'タイマー実行中はタスクを変更できません',
        'error'
      );
    });
  });

  describe('incrementTaskPomodoros メソッド', () => {
    test('正常系: タスクのポモドーロ数を増やす', () => {
      // Given: タスク
      const task = new Task('タスク', 3);
      controller.tasks = [task];
      expect(task.actualPomodoros).toBe(0);
      
      // When: incrementTaskPomodoros実行
      controller.incrementTaskPomodoros(task.id);
      
      // Then: actualPomodorosが増える
      expect(task.actualPomodoros).toBe(1);
    });

    test('正常系: 存在しないIDでは何も起きない', () => {
      // Given: タスク
      controller.tasks = [new Task('タスク', 1)];
      
      // When: 存在しないID
      controller.incrementTaskPomodoros('invalid-id');
      
      // Then: エラーなく終了
      expect(controller.tasks[0].actualPomodoros).toBe(0);
    });
  });

  describe('getFilteredTasks メソッド', () => {
    beforeEach(() => {
      // テスト用タスク準備
      const task1 = new Task('未完了1', 1);
      const task2 = new Task('完了1', 2);
      task2.toggleComplete();
      const task3 = new Task('未完了2', 3);
      const task4 = new Task('完了2', 4);
      task4.toggleComplete();
      
      controller.tasks = [task1, task2, task3, task4];
    });

    test('正常系: フィルタ="all"ですべてのタスクを返す', () => {
      // Given: フィルタ='all'
      controller.currentFilter = 'all';
      
      // When: getFilteredTasks実行
      const filtered = controller.getFilteredTasks();
      
      // Then: すべて返る
      expect(filtered).toHaveLength(4);
    });

    test('正常系: フィルタ="active"で未完了のみ返す', () => {
      // Given: フィルタ='active'
      controller.currentFilter = 'active';
      
      // When: getFilteredTasks実行
      const filtered = controller.getFilteredTasks();
      
      // Then: 未完了のみ
      expect(filtered).toHaveLength(2);
      expect(filtered[0].title).toBe('未完了1');
      expect(filtered[1].title).toBe('未完了2');
    });

    test('正常系: フィルタ="completed"で完了済みのみ返す', () => {
      // Given: フィルタ='completed'
      controller.currentFilter = 'completed';
      
      // When: getFilteredTasks実行
      const filtered = controller.getFilteredTasks();
      
      // Then: 完了済みのみ
      expect(filtered).toHaveLength(2);
      expect(filtered[0].title).toBe('完了1');
      expect(filtered[1].title).toBe('完了2');
    });

    test('境界値: タスク0件の場合は空配列', () => {
      // Given: タスクなし
      controller.tasks = [];
      controller.currentFilter = 'all';
      
      // When: getFilteredTasks実行
      const filtered = controller.getFilteredTasks();
      
      // Then: 空配列
      expect(filtered).toEqual([]);
    });

    test('異常系: 不正なフィルタ名でデフォルト（all）動作', () => {
      // Given: 不正なフィルタ
      controller.currentFilter = 'invalid-filter';
      
      // When: getFilteredTasks実行
      const filtered = controller.getFilteredTasks();
      
      // Then: すべて返る（defaultケース）
      expect(filtered).toHaveLength(4);
    });
  });

  describe('統合テスト: タスク管理フロー', () => {
    test('シナリオ: タスク追加→編集→ポモドーロ実行→完了', () => {
      // Given: 初期状態
      expect(controller.tasks).toHaveLength(0);
      
      // When: タスク追加
      controller.addTask('重要タスク', 3);
      const taskId = controller.tasks[0].id;
      
      // Then: 追加成功
      expect(controller.tasks).toHaveLength(1);
      
      // When: タスク編集
      controller.editTask(taskId, '超重要タスク');
      
      // Then: タイトル変更
      expect(controller.tasks[0].title).toBe('超重要タスク');
      
      // When: ポモドーロ実行（3回）
      controller.incrementTaskPomodoros(taskId);
      controller.incrementTaskPomodoros(taskId);
      controller.incrementTaskPomodoros(taskId);
      
      // Then: actualPomodoros=3
      expect(controller.tasks[0].actualPomodoros).toBe(3);
      expect(controller.tasks[0].actualPomodoros).toBe(controller.tasks[0].estimatedPomodoros);
      
      // When: 完了にする
      controller.toggleTaskComplete(taskId);
      
      // Then: 完了状態
      expect(controller.tasks[0].completed).toBe(true);
      expect(app.statisticsController.addCompletedTask).toHaveBeenCalled();
    });

    test('シナリオ: 複数タスクのフィルタリング', () => {
      // Given: 複数タスク追加
      controller.addTask('タスクA', 1);
      controller.addTask('タスクB', 2);
      controller.addTask('タスクC', 3);
      controller.addTask('タスクD', 4);
      
      // When: タスクBとDを完了
      controller.toggleTaskComplete(controller.tasks[1].id); // タスクC
      controller.toggleTaskComplete(controller.tasks[3].id); // タスクA
      
      // When: activeフィルタ
      controller.currentFilter = 'active';
      const active = controller.getFilteredTasks();
      
      // Then: 未完了のみ
      expect(active).toHaveLength(2);
      
      // When: completedフィルタ
      controller.currentFilter = 'completed';
      const completed = controller.getFilteredTasks();
      
      // Then: 完了済みのみ
      expect(completed).toHaveLength(2);
    });
  });
});
