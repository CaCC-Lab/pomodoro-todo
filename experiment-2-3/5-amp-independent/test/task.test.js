/**
 * Taskクラスのテストスイート
 */

describe('Task クラス', () => {
  describe('コンストラクタ', () => {
    test('正常系: タイトルのみでインスタンスを生成', () => {
      // Given: タスク名
      const title = 'テストタスク';
      
      // When: Taskインスタンスを生成
      const task = new Task(title);
      
      // Then: 正しく初期化される
      expect(task.title).toBe('テストタスク');
      expect(task.estimatedPomodoros).toBe(0);
      expect(task.actualPomodoros).toBe(0);
      expect(task.completed).toBe(false);
      expect(task.completedAt).toBeNull();
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
    });

    test('正常系: タイトルと見積もりでインスタンスを生成', () => {
      // Given: タスク名と見積もり
      const title = 'テストタスク';
      const estimatedPomodoros = 5;
      
      // When: Taskインスタンスを生成
      const task = new Task(title, estimatedPomodoros);
      
      // Then: 正しく初期化される
      expect(task.title).toBe('テストタスク');
      expect(task.estimatedPomodoros).toBe(5);
      expect(task.actualPomodoros).toBe(0);
    });

    test('境界値: 見積もり0でインスタンスを生成', () => {
      // Given: 見積もり0
      const task = new Task('タスク', 0);
      
      // When/Then: estimatedPomodoros=0
      expect(task.estimatedPomodoros).toBe(0);
    });

    test('境界値: 見積もり1でインスタンスを生成', () => {
      // Given: 見積もり1
      const task = new Task('タスク', 1);
      
      // When/Then: estimatedPomodoros=1
      expect(task.estimatedPomodoros).toBe(1);
    });

    test('境界値: 見積もり20でインスタンスを生成', () => {
      // Given: 見積もり20（最大値）
      const task = new Task('タスク', 20);
      
      // When/Then: estimatedPomodoros=20
      expect(task.estimatedPomodoros).toBe(20);
    });

    test('異常系: 見積もり負の値でもインスタンスを生成（バリデーション未実装）', () => {
      // Given: 見積もり-1
      const task = new Task('タスク', -1);
      
      // When/Then: -1がセットされる（Controller層でバリデーション必要）
      expect(task.estimatedPomodoros).toBe(-1);
    });

    test('異常系: 見積もり21以上でもインスタンスを生成（バリデーション未実装）', () => {
      // Given: 見積もり21
      const task = new Task('タスク', 21);
      
      // When/Then: 21がセットされる（Controller層でバリデーション必要）
      expect(task.estimatedPomodoros).toBe(21);
    });

    test('正常系: IDが一意のUUID形式である', () => {
      // Given: 複数のTaskインスタンス
      const task1 = new Task('タスク1');
      const task2 = new Task('タスク2');
      
      // When/Then: IDが異なり、UUID形式
      expect(task1.id).not.toBe(task2.id);
      expect(task1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('正常系: createdAtがISO 8601形式である', () => {
      // Given: Taskインスタンス
      const task = new Task('タスク');
      
      // When/Then: createdAtがISO形式
      expect(task.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(task.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('toggleComplete メソッド', () => {
    test('正常系: 未完了→完了に切り替え', () => {
      // Given: 未完了のタスク
      const task = new Task('タスク');
      expect(task.completed).toBe(false);
      expect(task.completedAt).toBeNull();
      
      // When: toggleComplete実行
      task.toggleComplete();
      
      // Then: 完了状態になり、完了日時が設定される
      expect(task.completed).toBe(true);
      expect(task.completedAt).not.toBeNull();
      expect(task.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('正常系: 完了→未完了に切り替え', () => {
      // Given: 完了済みタスク
      const task = new Task('タスク');
      task.toggleComplete(); // 一度完了にする
      expect(task.completed).toBe(true);
      
      // When: 再度toggleComplete実行
      task.toggleComplete();
      
      // Then: 未完了に戻り、完了日時がnullになる
      expect(task.completed).toBe(false);
      expect(task.completedAt).toBeNull();
    });

    test('正常系: 2回トグルすると元の状態に戻る', () => {
      // Given: 未完了のタスク
      const task = new Task('タスク');
      const initialState = task.completed;
      
      // When: 2回toggleComplete実行
      task.toggleComplete();
      task.toggleComplete();
      
      // Then: 元の状態に戻る
      expect(task.completed).toBe(initialState);
      expect(task.completedAt).toBeNull();
    });

    test('正常系: 完了日時が現在時刻に近い', () => {
      // Given: タスク
      const task = new Task('タスク');
      const beforeTime = new Date();
      
      // When: 完了にする
      task.toggleComplete();
      const afterTime = new Date();
      const completedTime = new Date(task.completedAt);
      
      // Then: 完了日時が実行時刻に近い（±1秒以内）
      expect(completedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(completedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('incrementPomodoros メソッド', () => {
    test('正常系: 0から1に増加', () => {
      // Given: 新規タスク（actualPomodoros=0）
      const task = new Task('タスク');
      expect(task.actualPomodoros).toBe(0);
      
      // When: incrementPomodoros実行
      task.incrementPomodoros();
      
      // Then: actualPomodoros=1
      expect(task.actualPomodoros).toBe(1);
    });

    test('正常系: 複数回増加（5回）', () => {
      // Given: 新規タスク
      const task = new Task('タスク');
      
      // When: 5回実行
      for (let i = 0; i < 5; i++) {
        task.incrementPomodoros();
      }
      
      // Then: actualPomodoros=5
      expect(task.actualPomodoros).toBe(5);
    });

    test('境界値: 見積もりを超過しても増加する', () => {
      // Given: 見積もり3のタスク
      const task = new Task('タスク', 3);
      
      // When: 4回実行（見積もり超過）
      for (let i = 0; i < 4; i++) {
        task.incrementPomodoros();
      }
      
      // Then: actualPomodoros=4（見積もりを超える）
      expect(task.actualPomodoros).toBe(4);
      expect(task.actualPomodoros).toBeGreaterThan(task.estimatedPomodoros);
    });

    test('正常系: 大量のポモドーロ（100回）', () => {
      // Given: タスク
      const task = new Task('タスク');
      
      // When: 100回実行
      for (let i = 0; i < 100; i++) {
        task.incrementPomodoros();
      }
      
      // Then: actualPomodoros=100
      expect(task.actualPomodoros).toBe(100);
    });
  });

  describe('toJSON メソッド', () => {
    test('正常系: すべてのプロパティがシリアライズされる', () => {
      // Given: タスク
      const task = new Task('テストタスク', 5);
      task.incrementPomodoros();
      task.incrementPomodoros();
      task.toggleComplete();
      
      // When: JSON化
      const json = task.toJSON();
      
      // Then: すべてのプロパティが含まれる
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('title');
      expect(json).toHaveProperty('completed');
      expect(json).toHaveProperty('estimatedPomodoros');
      expect(json).toHaveProperty('actualPomodoros');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('completedAt');
      
      expect(json.title).toBe('テストタスク');
      expect(json.estimatedPomodoros).toBe(5);
      expect(json.actualPomodoros).toBe(2);
      expect(json.completed).toBe(true);
      expect(json.completedAt).not.toBeNull();
    });

    test('正常系: 未完了タスクのcompletedAtがnull', () => {
      // Given: 未完了タスク
      const task = new Task('タスク');
      
      // When: JSON化
      const json = task.toJSON();
      
      // Then: completedAt=null
      expect(json.completed).toBe(false);
      expect(json.completedAt).toBeNull();
    });

    test('正常系: JSON.stringifyで文字列化可能', () => {
      // Given: タスク
      const task = new Task('タスク', 3);
      
      // When: JSON文字列化
      const jsonString = JSON.stringify(task.toJSON());
      
      // Then: 文字列化成功
      expect(typeof jsonString).toBe('string');
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });
  });

  describe('fromJSON 静的メソッド', () => {
    test('正常系: JSONデータからTaskインスタンスを復元', () => {
      // Given: JSONデータ
      const jsonData = {
        id: 'test-uuid-1234',
        title: 'テストタスク',
        completed: false,
        estimatedPomodoros: 5,
        actualPomodoros: 2,
        createdAt: '2025-10-27T10:00:00.000Z',
        completedAt: null
      };
      
      // When: fromJSON実行
      const task = Task.fromJSON(jsonData);
      
      // Then: 正しく復元される
      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe('test-uuid-1234');
      expect(task.title).toBe('テストタスク');
      expect(task.completed).toBe(false);
      expect(task.estimatedPomodoros).toBe(5);
      expect(task.actualPomodoros).toBe(2);
      expect(task.createdAt).toBe('2025-10-27T10:00:00.000Z');
      expect(task.completedAt).toBeNull();
    });

    test('正常系: 完了タスクのデータを復元', () => {
      // Given: 完了済みタスクのJSONデータ
      const jsonData = {
        id: 'test-uuid-5678',
        title: '完了タスク',
        completed: true,
        estimatedPomodoros: 3,
        actualPomodoros: 3,
        createdAt: '2025-10-27T09:00:00.000Z',
        completedAt: '2025-10-27T10:30:00.000Z'
      };
      
      // When: fromJSON実行
      const task = Task.fromJSON(jsonData);
      
      // Then: completedAtが保持される
      expect(task.completed).toBe(true);
      expect(task.completedAt).toBe('2025-10-27T10:30:00.000Z');
    });

    test('正常系: toJSON→fromJSONで元のデータと一致', () => {
      // Given: 元のタスク
      const originalTask = new Task('テスト', 4);
      originalTask.incrementPomodoros();
      originalTask.toggleComplete();
      
      // When: JSON化→復元
      const json = originalTask.toJSON();
      const restoredTask = Task.fromJSON(json);
      
      // Then: すべてのプロパティが一致
      expect(restoredTask.id).toBe(originalTask.id);
      expect(restoredTask.title).toBe(originalTask.title);
      expect(restoredTask.completed).toBe(originalTask.completed);
      expect(restoredTask.estimatedPomodoros).toBe(originalTask.estimatedPomodoros);
      expect(restoredTask.actualPomodoros).toBe(originalTask.actualPomodoros);
      expect(restoredTask.createdAt).toBe(originalTask.createdAt);
      expect(restoredTask.completedAt).toBe(originalTask.completedAt);
    });

    test('異常系: 不完全なJSONデータでも復元（一部プロパティ欠損）', () => {
      // Given: 不完全なデータ
      const jsonData = {
        title: '不完全タスク',
        estimatedPomodoros: 2
      };
      
      // When: fromJSON実行
      const task = Task.fromJSON(jsonData);
      
      // Then: 新規IDが生成され、デフォルト値が設定される
      expect(task.title).toBe('不完全タスク');
      expect(task.estimatedPomodoros).toBe(2);
      // idは新規生成される
      expect(task.id).toBeDefined();
      // その他はデフォルト値
      expect(task.completed).toBeDefined();
      expect(task.actualPomodoros).toBeDefined();
    });
  });

  describe('統合テスト: タスクのライフサイクル', () => {
    test('シナリオ: タスク作成→ポモドーロ実行→完了', () => {
      // Given: 新規タスク作成
      const task = new Task('重要なタスク', 3);
      expect(task.completed).toBe(false);
      expect(task.actualPomodoros).toBe(0);
      
      // When: ポモドーロ1回目実行
      task.incrementPomodoros();
      expect(task.actualPomodoros).toBe(1);
      
      // When: ポモドーロ2回目実行
      task.incrementPomodoros();
      expect(task.actualPomodoros).toBe(2);
      
      // When: ポモドーロ3回目実行（見積もり達成）
      task.incrementPomodoros();
      expect(task.actualPomodoros).toBe(3);
      expect(task.actualPomodoros).toBe(task.estimatedPomodoros);
      
      // When: タスク完了
      task.toggleComplete();
      
      // Then: すべて正常
      expect(task.completed).toBe(true);
      expect(task.completedAt).not.toBeNull();
      expect(task.actualPomodoros).toBe(task.estimatedPomodoros);
    });

    test('シナリオ: タスク作成→保存→復元→継続', () => {
      // Given: タスク作成とポモドーロ実行
      const originalTask = new Task('保存テスト', 5);
      originalTask.incrementPomodoros();
      originalTask.incrementPomodoros();
      
      // When: JSON保存
      const savedData = originalTask.toJSON();
      const jsonString = JSON.stringify(savedData);
      
      // When: 復元
      const parsedData = JSON.parse(jsonString);
      const restoredTask = Task.fromJSON(parsedData);
      
      // When: 継続してポモドーロ実行
      restoredTask.incrementPomodoros();
      
      // Then: 状態が正しく継続される
      expect(restoredTask.actualPomodoros).toBe(3);
      expect(restoredTask.estimatedPomodoros).toBe(5);
    });
  });
});
