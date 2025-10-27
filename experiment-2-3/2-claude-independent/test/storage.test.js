/**
 * LocalStorage操作とデータモデルのテスト
 */

const {
    saveToStorage,
    loadFromStorage,
    createTask,
    STORAGE_KEYS
} = require('./app.testable');

describe('LocalStorage操作', () => {

    // 各テストの前後でlocalStorageをクリア
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('saveToStorage()', () => {

        // S1-1: 正常系 - 通常オブジェクト
        test('通常のオブジェクトを正常に保存する', () => {
            // Given: 通常のオブジェクト
            const data = { name: 'test', value: 123 };
            const key = 'test_key';

            // When: saveToStorageを呼び出す
            const result = saveToStorage(key, data);

            // Then: 保存に成功しtrueが返される
            expect(result).toBe(true);
            expect(localStorage.getItem(key)).toBe(JSON.stringify(data));
        });

        // S1-2: 正常系 - 空配列（境界値）
        test('空配列を正常に保存する', () => {
            // Given: 空配列
            const data = [];
            const key = 'test_key';

            // When: saveToStorageを呼び出す
            const result = saveToStorage(key, data);

            // Then: 保存に成功する
            expect(result).toBe(true);
            expect(localStorage.getItem(key)).toBe('[]');
        });

        // S1-3: 正常系 - null
        test('nullを正常に保存する', () => {
            // Given: null
            const data = null;
            const key = 'test_key';

            // When: saveToStorageを呼び出す
            const result = saveToStorage(key, data);

            // Then: 保存に成功する
            expect(result).toBe(true);
            expect(localStorage.getItem(key)).toBe('null');
        });

        // S1-4: 異常系 - QuotaExceededError
        test('容量超過時にエラーをスローする', () => {
            // Given: localStorageのsetItemをモック化してQuotaExceededErrorをスロー
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = jest.fn(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });

            const data = { test: 'data' };
            const key = 'test_key';

            // When & Then: saveToStorageを呼び出すとエラーがスローされる
            expect(() => saveToStorage(key, data)).toThrow('保存容量が不足しています');

            // モックを元に戻す
            Storage.prototype.setItem = originalSetItem;
        });

        // S1-5: 異常系 - 一般エラー
        test('一般エラー時にエラーをスローする', () => {
            // Given: localStorageのsetItemをモック化して一般エラーをスロー
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = jest.fn(() => {
                throw new Error('General Error');
            });

            const data = { test: 'data' };
            const key = 'test_key';

            // When & Then: saveToStorageを呼び出すとエラーがスローされる
            expect(() => saveToStorage(key, data)).toThrow('データの保存ができません');

            // モックを元に戻す
            Storage.prototype.setItem = originalSetItem;
        });

        // S1-6: 異常系 - 循環参照オブジェクト
        test('循環参照オブジェクトに対してエラーをスローする', () => {
            // Given: 循環参照を持つオブジェクト
            const data = {};
            data.self = data;
            const key = 'test_key';

            // When & Then: saveToStorageを呼び出すとJSON.stringifyエラーがスローされる
            expect(() => saveToStorage(key, data)).toThrow();
        });

        // S1-7: 正常系 - 複雑なネストされたオブジェクト
        test('複雑なネストされたオブジェクトを保存する', () => {
            // Given: ネストされたオブジェクト
            const data = {
                tasks: [
                    { id: 1, title: 'Task 1', nested: { value: 'test' } },
                    { id: 2, title: 'Task 2', nested: { value: 'test2' } }
                ]
            };
            const key = 'test_key';

            // When: saveToStorageを呼び出す
            const result = saveToStorage(key, data);

            // Then: 保存に成功する
            expect(result).toBe(true);
            const saved = JSON.parse(localStorage.getItem(key));
            expect(saved).toEqual(data);
        });
    });

    describe('loadFromStorage()', () => {

        // S2-1: 正常系 - 有効なJSON
        test('有効なJSONをパースして返す', () => {
            // Given: localStorageに有効なJSONが保存されている
            const data = { name: 'test', value: 123 };
            const key = 'test_key';
            localStorage.setItem(key, JSON.stringify(data));

            // When: loadFromStorageを呼び出す
            const result = loadFromStorage(key, {});

            // Then: パースされたオブジェクトが返される
            expect(result).toEqual(data);
        });

        // S2-2: 正常系 - null（データなし）
        test('データがない場合はデフォルト値を返す', () => {
            // Given: localStorageにデータがない
            const key = 'non_existent_key';
            const defaultValue = { default: true };

            // When: loadFromStorageを呼び出す
            const result = loadFromStorage(key, defaultValue);

            // Then: デフォルト値が返される
            expect(result).toEqual(defaultValue);
        });

        // S2-3: 異常系 - 不正なJSON
        test('不正なJSONの場合はデフォルト値を返す', () => {
            // Given: localStorageに不正なJSONが保存されている
            const key = 'test_key';
            const defaultValue = [];
            localStorage.setItem(key, '{invalid json}');

            // When: loadFromStorageを呼び出す
            const result = loadFromStorage(key, defaultValue);

            // Then: デフォルト値が返される
            expect(result).toEqual(defaultValue);
        });

        // S2-4: 正常系 - 空配列
        test('空配列を正しく読み込む', () => {
            // Given: localStorageに空配列が保存されている
            const key = 'test_key';
            const data = [];
            localStorage.setItem(key, JSON.stringify(data));

            // When: loadFromStorageを呼び出す
            const result = loadFromStorage(key, null);

            // Then: 空配列が返される
            expect(result).toEqual([]);
        });

        // S2-5: 正常系 - null値が保存されている
        test('null値を正しく読み込む', () => {
            // Given: localStorageにnullが保存されている
            const key = 'test_key';
            localStorage.setItem(key, 'null');

            // When: loadFromStorageを呼び出す
            const result = loadFromStorage(key, { default: true });

            // Then: nullが返される
            expect(result).toBeNull();
        });

        // S2-6: 異常系 - getItemがエラーをスロー
        test('getItemがエラーをスローした場合はデフォルト値を返す', () => {
            // Given: localStorageのgetItemをモック化してエラーをスロー
            const originalGetItem = Storage.prototype.getItem;
            Storage.prototype.getItem = jest.fn(() => {
                throw new Error('Storage Error');
            });

            const key = 'test_key';
            const defaultValue = { error: 'default' };

            // When: loadFromStorageを呼び出す
            const result = loadFromStorage(key, defaultValue);

            // Then: デフォルト値が返される
            expect(result).toEqual(defaultValue);

            // モックを元に戻す
            Storage.prototype.getItem = originalGetItem;
        });
    });
});

describe('データモデル', () => {

    describe('createTask()', () => {

        // モックのDate.nowを設定
        let originalDateNow;
        let mockTimestamp;

        beforeEach(() => {
            originalDateNow = Date.now;
            mockTimestamp = 1234567890000;
            Date.now = jest.fn(() => mockTimestamp);
        });

        afterEach(() => {
            Date.now = originalDateNow;
        });

        // T1-1: 正常系 - 通常生成
        test('タイトルと見積もりを指定してタスクを生成する', () => {
            // Given: タイトルと見積もり
            const title = 'テスト';
            const estimate = 5;

            // When: createTaskを呼び出す
            const task = createTask(title, estimate);

            // Then: 正しいタスクオブジェクトが生成される
            expect(task).toMatchObject({
                id: `task_${mockTimestamp}`,
                title: 'テスト',
                completed: false,
                estimatedPomodoros: 5,
                actualPomodoros: 0
            });
            expect(task.createdAt).toBeDefined();
            expect(task.completedAt).toBeNull();
        });

        // T1-2: 正常系 - 見積もりなし
        test('見積もりなしでタスクを生成する', () => {
            // Given: タイトルのみ
            const title = 'テスト';

            // When: createTaskを呼び出す（見積もりなし）
            const task = createTask(title);

            // Then: 見積もりがnullのタスクが生成される
            expect(task.estimatedPomodoros).toBeNull();
        });

        // T1-3: 正常系 - 見積もり0（境界値・最小）
        test('見積もり0でタスクを生成する', () => {
            // Given: タイトルと見積もり0
            const title = 'テスト';
            const estimate = 0;

            // When: createTaskを呼び出す
            const task = createTask(title, estimate);

            // Then: 見積もりが0のタスクが生成される
            expect(task.estimatedPomodoros).toBe(0);
        });

        // T1-4: 正常系 - 見積もり20（境界値・最大）
        test('見積もり20でタスクを生成する', () => {
            // Given: タイトルと見積もり20
            const title = 'テスト';
            const estimate = 20;

            // When: createTaskを呼び出す
            const task = createTask(title, estimate);

            // Then: 見積もりが20のタスクが生成される
            expect(task.estimatedPomodoros).toBe(20);
        });

        // T1-5: 正常系 - XSS対策（サニタイズ）
        test('scriptタグを含むタイトルをサニタイズする', () => {
            // Given: scriptタグを含むタイトル
            const title = '<script>alert("XSS")</script>';

            // When: createTaskを呼び出す
            const task = createTask(title);

            // Then: タイトルがエスケープされている
            expect(task.title).not.toContain('<script>');
            expect(task.title).toContain('&lt;script&gt;');
        });

        // T1-6: 境界値 - 100文字タイトル
        test('100文字のタイトルでタスクを生成する', () => {
            // Given: 100文字のタイトル
            const title = 'a'.repeat(100);

            // When: createTaskを呼び出す
            const task = createTask(title);

            // Then: タスクが正常に生成される
            expect(task.title.length).toBe(100);
        });

        // T1-7: 正常系 - IDの一意性
        test('連続して生成したタスクは異なるIDを持つ', () => {
            // Given: 2つのタスク生成
            const task1 = createTask('Task 1');

            // 時間を進める
            mockTimestamp = 1234567890001;
            const task2 = createTask('Task 2');

            // Then: IDが異なる
            expect(task1.id).not.toBe(task2.id);
        });

        // T1-8: 正常系 - createdAtのフォーマット
        test('createdAtがISO 8601フォーマットである', () => {
            // Given: タスク生成
            const task = createTask('Test');

            // When: createdAtを検証
            // Then: ISO 8601フォーマットである
            expect(task.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });

        // T1-9: 正常系 - 初期値の検証
        test('タスクの初期値が正しく設定されている', () => {
            // Given & When: タスク生成
            const task = createTask('Test', 3);

            // Then: 初期値が正しい
            expect(task.completed).toBe(false);
            expect(task.actualPomodoros).toBe(0);
            expect(task.completedAt).toBeNull();
        });
    });
});
