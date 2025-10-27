/**
 * タスク管理機能のテスト
 */

const {
    getFilteredTasks,
    STORAGE_KEYS
} = require('./app.testable');

describe('タスク管理機能', () => {

    describe('getFilteredTasks()', () => {

        // テスト用のタスクリスト
        const mockTasks = [
            { id: '1', title: 'Task 1', completed: false },
            { id: '2', title: 'Task 2', completed: true },
            { id: '3', title: 'Task 3', completed: false },
            { id: '4', title: 'Task 4', completed: true },
            { id: '5', title: 'Task 5', completed: false }
        ];

        // T6-1: 正常系 - 'all'フィルタ
        test('allフィルタで全タスクを返す', () => {
            // Given: 混在したタスクリスト
            const tasks = mockTasks;
            const filterState = 'all';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 全タスクが返される
            expect(result).toHaveLength(5);
            expect(result).toEqual(tasks);
        });

        // T6-2: 正常系 - 'active'フィルタ
        test('activeフィルタで未完了タスクのみを返す', () => {
            // Given: 混在したタスクリスト
            const tasks = mockTasks;
            const filterState = 'active';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 未完了タスクのみが返される
            expect(result).toHaveLength(3);
            expect(result.every(t => !t.completed)).toBe(true);
            expect(result.map(t => t.id)).toEqual(['1', '3', '5']);
        });

        // T6-3: 正常系 - 'completed'フィルタ
        test('completedフィルタで完了タスクのみを返す', () => {
            // Given: 混在したタスクリスト
            const tasks = mockTasks;
            const filterState = 'completed';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 完了タスクのみが返される
            expect(result).toHaveLength(2);
            expect(result.every(t => t.completed)).toBe(true);
            expect(result.map(t => t.id)).toEqual(['2', '4']);
        });

        // T6-4: 境界値 - 空配列
        test('空配列に対してallフィルタで空配列を返す', () => {
            // Given: 空配列
            const tasks = [];
            const filterState = 'all';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 空配列が返される
            expect(result).toEqual([]);
        });

        // T6-5: 境界値 - 全完了リスト
        test('全完了リストに対してactiveフィルタで空配列を返す', () => {
            // Given: 全て完了したタスクリスト
            const tasks = [
                { id: '1', title: 'Task 1', completed: true },
                { id: '2', title: 'Task 2', completed: true }
            ];
            const filterState = 'active';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 空配列が返される
            expect(result).toEqual([]);
        });

        // T6-6: 境界値 - 全未完了リスト
        test('全未完了リストに対してcompletedフィルタで空配列を返す', () => {
            // Given: 全て未完了のタスクリスト
            const tasks = [
                { id: '1', title: 'Task 1', completed: false },
                { id: '2', title: 'Task 2', completed: false }
            ];
            const filterState = 'completed';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 空配列が返される
            expect(result).toEqual([]);
        });

        // T6-7: 境界値 - 1タスクのみ
        test('1タスクのみのリストを正しくフィルタする', () => {
            // Given: 1タスクのみ
            const tasks = [{ id: '1', title: 'Task 1', completed: false }];
            const filterState = 'active';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: そのタスクが返される
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });

        // T6-8: 異常系 - 不正なフィルタ値（default動作）
        test('不正なフィルタ値の場合は全タスクを返す', () => {
            // Given: 不正なフィルタ値
            const tasks = mockTasks;
            const filterState = 'invalid';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 全タスクが返される（デフォルト動作）
            expect(result).toHaveLength(5);
            expect(result).toEqual(tasks);
        });

        // T6-9: 異常系 - nullフィルタ値
        test('nullフィルタ値の場合は全タスクを返す', () => {
            // Given: nullフィルタ
            const tasks = mockTasks;
            const filterState = null;

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 全タスクが返される（デフォルト動作）
            expect(result).toHaveLength(5);
            expect(result).toEqual(tasks);
        });

        // T6-10: 正常系 - 大量タスク
        test('大量タスクを正しくフィルタする', () => {
            // Given: 100タスク（半分完了）
            const tasks = Array.from({ length: 100 }, (_, i) => ({
                id: `${i}`,
                title: `Task ${i}`,
                completed: i % 2 === 0
            }));
            const filterState = 'active';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 未完了の50タスクが返される
            expect(result).toHaveLength(50);
            expect(result.every(t => !t.completed)).toBe(true);
        });

        // T6-11: 正常系 - フィルタ後の元配列への影響なし
        test('フィルタしても元配列は変更されない', () => {
            // Given: タスクリスト
            const tasks = [...mockTasks];
            const originalLength = tasks.length;
            const filterState = 'active';

            // When: getFilteredTasksを呼び出す
            const result = getFilteredTasks(tasks, filterState);

            // Then: 元配列は変更されていない
            expect(tasks).toHaveLength(originalLength);
            expect(tasks).toEqual(mockTasks);
        });
    });
});
