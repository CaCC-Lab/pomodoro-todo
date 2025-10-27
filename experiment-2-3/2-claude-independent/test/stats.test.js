/**
 * 統計・日付管理機能のテスト
 */

const {
    calculateTotalTime,
    calculateCompletedTasks,
    getTodayString,
    isDateChanged
} = require('./app.testable');

describe('統計機能', () => {

    describe('calculateTotalTime()', () => {

        // ST1-1: 正常系 - 初期状態（0ポモドーロ）
        test('0ポモドーロの場合は0時間0分を返す', () => {
            // Given: ポモドーロカウント0
            const pomodoroCount = 0;

            // When: calculateTotalTimeを呼び出す
            const result = calculateTotalTime(pomodoroCount);

            // Then: 0時間0分が返される
            expect(result).toEqual({ hours: 0, minutes: 0 });
        });

        // ST1-2: 正常系 - 通常の統計（5ポモドーロ）
        test('5ポモドーロの場合は2時間5分を返す', () => {
            // Given: ポモドーロカウント5
            const pomodoroCount = 5;

            // When: calculateTotalTimeを呼び出す
            const result = calculateTotalTime(pomodoroCount);

            // Then: 2時間5分が返される（5 * 25 = 125分 = 2時間5分）
            expect(result).toEqual({ hours: 2, minutes: 5 });
        });

        // ST1-3: 境界値 - 1ポモドーロ
        test('1ポモドーロの場合は0時間25分を返す', () => {
            // Given: ポモドーロカウント1
            const pomodoroCount = 1;

            // When: calculateTotalTimeを呼び出す
            const result = calculateTotalTime(pomodoroCount);

            // Then: 0時間25分が返される
            expect(result).toEqual({ hours: 0, minutes: 25 });
        });

        // ST1-4: 境界値 - 100ポモドーロ
        test('100ポモドーロの場合は41時間40分を返す', () => {
            // Given: ポモドーロカウント100
            const pomodoroCount = 100;

            // When: calculateTotalTimeを呼び出す
            const result = calculateTotalTime(pomodoroCount);

            // Then: 41時間40分が返される（100 * 25 = 2500分 = 41時間40分）
            expect(result).toEqual({ hours: 41, minutes: 40 });
        });

        // 境界値 - 2ポモドーロ
        test('2ポモドーロの場合は0時間50分を返す', () => {
            // Given: ポモドーロカウント2
            const pomodoroCount = 2;

            // When: calculateTotalTimeを呼び出す
            const result = calculateTotalTime(pomodoroCount);

            // Then: 0時間50分が返される
            expect(result).toEqual({ hours: 0, minutes: 50 });
        });

        // 境界値 - ちょうど1時間（2.4ポモドーロ → 切り捨て不可、3ポモドーロで検証）
        test('3ポモドーロの場合は1時間15分を返す', () => {
            // Given: ポモドーロカウント3
            const pomodoroCount = 3;

            // When: calculateTotalTimeを呼び出す
            const result = calculateTotalTime(pomodoroCount);

            // Then: 1時間15分が返される
            expect(result).toEqual({ hours: 1, minutes: 15 });
        });

        // 異常系 - 負の値
        test('負のポモドーロカウントの場合は負の時間を返す', () => {
            // Given: ポモドーロカウント-5
            const pomodoroCount = -5;

            // When: calculateTotalTimeを呼び出す
            const result = calculateTotalTime(pomodoroCount);

            // Then: 負の時間が返される
            expect(result.hours).toBeLessThan(0);
        });

        // 境界値 - 大きな値（1000ポモドーロ）
        test('1000ポモドーロの場合は416時間40分を返す', () => {
            // Given: ポモドーロカウント1000
            const pomodoroCount = 1000;

            // When: calculateTotalTimeを呼び出す
            const result = calculateTotalTime(pomodoroCount);

            // Then: 416時間40分が返される（1000 * 25 = 25000分 = 416時間40分）
            expect(result).toEqual({ hours: 416, minutes: 40 });
        });
    });

    describe('calculateCompletedTasks()', () => {

        // ST1-1: 正常系 - 完了タスク0件
        test('完了タスクが0件の場合は0を返す', () => {
            // Given: 全て未完了のタスクリスト
            const tasks = [
                { id: '1', completed: false },
                { id: '2', completed: false }
            ];

            // When: calculateCompletedTasksを呼び出す
            const result = calculateCompletedTasks(tasks);

            // Then: 0が返される
            expect(result).toBe(0);
        });

        // ST1-2: 正常系 - 完了タスク3件
        test('完了タスクが3件の場合は3を返す', () => {
            // Given: 3件完了、2件未完了のタスクリスト
            const tasks = [
                { id: '1', completed: true },
                { id: '2', completed: false },
                { id: '3', completed: true },
                { id: '4', completed: false },
                { id: '5', completed: true }
            ];

            // When: calculateCompletedTasksを呼び出す
            const result = calculateCompletedTasks(tasks);

            // Then: 3が返される
            expect(result).toBe(3);
        });

        // 境界値 - 空配列
        test('空配列の場合は0を返す', () => {
            // Given: 空配列
            const tasks = [];

            // When: calculateCompletedTasksを呼び出す
            const result = calculateCompletedTasks(tasks);

            // Then: 0が返される
            expect(result).toBe(0);
        });

        // 境界値 - 全て完了
        test('全て完了の場合はタスク数を返す', () => {
            // Given: 全て完了のタスクリスト
            const tasks = [
                { id: '1', completed: true },
                { id: '2', completed: true },
                { id: '3', completed: true }
            ];

            // When: calculateCompletedTasksを呼び出す
            const result = calculateCompletedTasks(tasks);

            // Then: 3が返される
            expect(result).toBe(3);
        });

        // 境界値 - 1タスクのみ（完了）
        test('完了タスク1件のみの場合は1を返す', () => {
            // Given: 完了タスク1件
            const tasks = [{ id: '1', completed: true }];

            // When: calculateCompletedTasksを呼び出す
            const result = calculateCompletedTasks(tasks);

            // Then: 1が返される
            expect(result).toBe(1);
        });

        // 境界値 - 1タスクのみ（未完了）
        test('未完了タスク1件のみの場合は0を返す', () => {
            // Given: 未完了タスク1件
            const tasks = [{ id: '1', completed: false }];

            // When: calculateCompletedTasksを呼び出す
            const result = calculateCompletedTasks(tasks);

            // Then: 0が返される
            expect(result).toBe(0);
        });

        // 正常系 - 大量タスク（100件中50件完了）
        test('100件中50件完了の場合は50を返す', () => {
            // Given: 100件のタスク（半分完了）
            const tasks = Array.from({ length: 100 }, (_, i) => ({
                id: `${i}`,
                completed: i % 2 === 0
            }));

            // When: calculateCompletedTasksを呼び出す
            const result = calculateCompletedTasks(tasks);

            // Then: 50が返される
            expect(result).toBe(50);
        });
    });
});

describe('日付管理機能', () => {

    describe('getTodayString()', () => {

        // 正常系 - 現在日付の取得
        test('現在日付をYYYY-MM-DD形式で返す', () => {
            // Given & When: getTodayStringを呼び出す
            const result = getTodayString();

            // Then: YYYY-MM-DD形式の文字列が返される
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        // 正常系 - 返される日付が妥当
        test('返される日付が妥当である', () => {
            // Given & When: getTodayStringを呼び出す
            const result = getTodayString();

            // Then: 日付として解釈可能
            const date = new Date(result);
            expect(date).toBeInstanceOf(Date);
            expect(isNaN(date.getTime())).toBe(false);
        });

        // 正常系 - 複数回呼び出しても同じ日付（同日内）
        test('複数回呼び出しても同じ日付を返す（同日内）', () => {
            // Given & When: getTodayStringを2回呼び出す
            const result1 = getTodayString();
            const result2 = getTodayString();

            // Then: 同じ日付が返される
            expect(result1).toBe(result2);
        });

        // 境界値 - タイムゾーンに関わらず正しい日付
        test('タイムゾーンに関わらず正しい日付を返す', () => {
            // Given & When: getTodayStringを呼び出す
            const result = getTodayString();

            // Then: ISO 8601形式の日付部分が返される
            const today = new Date().toISOString().split('T')[0];
            expect(result).toBe(today);
        });
    });

    describe('isDateChanged()', () => {

        // ST2-1: 正常系 - 同日（変更なし）
        test('保存日付と現在日付が同じ場合はfalseを返す', () => {
            // Given: 今日の日付
            const savedDate = '2025-10-27';
            const currentDate = '2025-10-27';

            // When: isDateChangedを呼び出す
            const result = isDateChanged(savedDate, currentDate);

            // Then: falseが返される
            expect(result).toBe(false);
        });

        // ST2-2: 正常系 - 日付変更（昨日→今日）
        test('保存日付が昨日の場合はtrueを返す', () => {
            // Given: 昨日の日付と今日の日付
            const savedDate = '2025-10-26';
            const currentDate = '2025-10-27';

            // When: isDateChangedを呼び出す
            const result = isDateChanged(savedDate, currentDate);

            // Then: trueが返される
            expect(result).toBe(true);
        });

        // ST2-3: 境界値 - null（初回起動）
        test('保存日付がnullの場合はtrueを返す', () => {
            // Given: nullの保存日付
            const savedDate = null;
            const currentDate = '2025-10-27';

            // When: isDateChangedを呼び出す
            const result = isDateChanged(savedDate, currentDate);

            // Then: trueが返される
            expect(result).toBe(true);
        });

        // ST2-4: 境界値 - 1週間前
        test('保存日付が1週間前の場合はtrueを返す', () => {
            // Given: 1週間前の日付
            const savedDate = '2025-10-20';
            const currentDate = '2025-10-27';

            // When: isDateChangedを呼び出す
            const result = isDateChanged(savedDate, currentDate);

            // Then: trueが返される
            expect(result).toBe(true);
        });

        // 異常系 - 不正な日付形式
        test('不正な日付形式の場合はtrueを返す', () => {
            // Given: 不正な日付形式
            const savedDate = 'invalid-date';
            const currentDate = '2025-10-27';

            // When: isDateChangedを呼び出す
            const result = isDateChanged(savedDate, currentDate);

            // Then: trueが返される（不一致として扱われる）
            expect(result).toBe(true);
        });

        // 境界値 - 年をまたぐ
        test('年をまたぐ場合はtrueを返す', () => {
            // Given: 昨年の日付
            const savedDate = '2024-12-31';
            const currentDate = '2025-01-01';

            // When: isDateChangedを呼び出す
            const result = isDateChanged(savedDate, currentDate);

            // Then: trueが返される
            expect(result).toBe(true);
        });

        // 境界値 - 月をまたぐ
        test('月をまたぐ場合はtrueを返す', () => {
            // Given: 前月の日付
            const savedDate = '2025-09-30';
            const currentDate = '2025-10-01';

            // When: isDateChangedを呼び出す
            const result = isDateChanged(savedDate, currentDate);

            // Then: trueが返される
            expect(result).toBe(true);
        });

        // 異常系 - undefined
        test('undefinedの場合はtrueを返す', () => {
            // Given: undefinedの保存日付
            const savedDate = undefined;
            const currentDate = '2025-10-27';

            // When: isDateChangedを呼び出す
            const result = isDateChanged(savedDate, currentDate);

            // Then: trueが返される
            expect(result).toBe(true);
        });

        // 正常系 - 未来の日付（システム時刻が戻った場合）
        test('保存日付が未来の場合はtrueを返す', () => {
            // Given: 未来の日付
            const savedDate = '2025-10-28';
            const currentDate = '2025-10-27';

            // When: isDateChangedを呼び出す
            const result = isDateChanged(savedDate, currentDate);

            // Then: trueが返される
            expect(result).toBe(true);
        });
    });
});
