/**
 * タイマー機能のテスト
 */

const {
    calculateTimerProgress,
    determineNextMode,
    getModeDuration,
    TIMER_DEFAULTS
} = require('./app.testable');

describe('タイマー機能', () => {

    describe('calculateTimerProgress()', () => {

        // 正常系 - 0%進捗（開始時）
        test('開始時（残り時間=全体時間）は0%を返す', () => {
            // Given: 全体時間1500秒、残り時間1500秒
            const duration = 1500;
            const remainingTime = 1500;

            // When: calculateTimerProgressを呼び出す
            const progress = calculateTimerProgress(duration, remainingTime);

            // Then: 0%が返される
            expect(progress).toBe(0);
        });

        // 正常系 - 50%進捗
        test('半分経過した場合は50%を返す', () => {
            // Given: 全体時間1500秒、残り時間750秒
            const duration = 1500;
            const remainingTime = 750;

            // When: calculateTimerProgressを呼び出す
            const progress = calculateTimerProgress(duration, remainingTime);

            // Then: 50%が返される
            expect(progress).toBe(50);
        });

        // 正常系 - 100%進捗（完了時）
        test('完了時（残り時間=0）は100%を返す', () => {
            // Given: 全体時間1500秒、残り時間0秒
            const duration = 1500;
            const remainingTime = 0;

            // When: calculateTimerProgressを呼び出す
            const progress = calculateTimerProgress(duration, remainingTime);

            // Then: 100%が返される
            expect(progress).toBe(100);
        });

        // 境界値 - 1秒残り
        test('残り1秒の場合は99.93%を返す', () => {
            // Given: 全体時間1500秒、残り時間1秒
            const duration = 1500;
            const remainingTime = 1;

            // When: calculateTimerProgressを呼び出す
            const progress = calculateTimerProgress(duration, remainingTime);

            // Then: 約99.93%が返される
            expect(progress).toBeCloseTo(99.93, 1);
        });

        // 境界値 - 全体時間1秒
        test('全体時間1秒、残り0秒の場合は100%を返す', () => {
            // Given: 全体時間1秒、残り時間0秒
            const duration = 1;
            const remainingTime = 0;

            // When: calculateTimerProgressを呼び出す
            const progress = calculateTimerProgress(duration, remainingTime);

            // Then: 100%が返される
            expect(progress).toBe(100);
        });

        // 異常系 - 負の残り時間
        test('負の残り時間の場合は100%以上を返す', () => {
            // Given: 全体時間1500秒、残り時間-10秒
            const duration = 1500;
            const remainingTime = -10;

            // When: calculateTimerProgressを呼び出す
            const progress = calculateTimerProgress(duration, remainingTime);

            // Then: 100%以上が返される
            expect(progress).toBeGreaterThan(100);
        });

        // 異常系 - 残り時間が全体時間より大きい
        test('残り時間が全体時間より大きい場合は負の値を返す', () => {
            // Given: 全体時間1500秒、残り時間2000秒
            const duration = 1500;
            const remainingTime = 2000;

            // When: calculateTimerProgressを呼び出す
            const progress = calculateTimerProgress(duration, remainingTime);

            // Then: 負の値が返される
            expect(progress).toBeLessThan(0);
        });

        // 異常系 - ゼロ除算
        test('全体時間が0の場合はInfinityを返す', () => {
            // Given: 全体時間0秒、残り時間0秒
            const duration = 0;
            const remainingTime = 0;

            // When: calculateTimerProgressを呼び出す
            const progress = calculateTimerProgress(duration, remainingTime);

            // Then: NaNが返される（0/0）
            expect(progress).toBeNaN();
        });
    });

    describe('determineNextMode()', () => {

        // TM6-1: 正常系 - 作業完了→ショートブレーク
        test('作業完了後（1回目）はショートブレークに遷移', () => {
            // Given: 現在のモードが'work'、ポモドーロカウント0
            const currentMode = 'work';
            const pomodoroCount = 1;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'shortBreak'が返される
            expect(nextMode).toBe('shortBreak');
        });

        // TM6-2: 正常系 - 作業完了（4回目）→ロングブレーク
        test('作業完了後（4回目）はロングブレークに遷移', () => {
            // Given: 現在のモードが'work'、ポモドーロカウント4
            const currentMode = 'work';
            const pomodoroCount = 4;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'longBreak'が返される
            expect(nextMode).toBe('longBreak');
        });

        // TM6-3: 正常系 - ショートブレーク完了→作業
        test('ショートブレーク完了後は作業に遷移', () => {
            // Given: 現在のモードが'shortBreak'
            const currentMode = 'shortBreak';
            const pomodoroCount = 1;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'work'が返される
            expect(nextMode).toBe('work');
        });

        // TM6-4: 正常系 - ロングブレーク完了→作業
        test('ロングブレーク完了後は作業に遷移', () => {
            // Given: 現在のモードが'longBreak'
            const currentMode = 'longBreak';
            const pomodoroCount = 4;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'work'が返される
            expect(nextMode).toBe('work');
        });

        // TM6-5: 境界値 - 初回完了
        test('初回作業完了（カウント1）はショートブレークに遷移', () => {
            // Given: 現在のモードが'work'、ポモドーロカウント1
            const currentMode = 'work';
            const pomodoroCount = 1;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'shortBreak'が返される
            expect(nextMode).toBe('shortBreak');
        });

        // TM6-6: 境界値 - 8回目完了（2サイクル目）→ロングブレーク
        test('8回目作業完了（2サイクル目）はロングブレークに遷移', () => {
            // Given: 現在のモードが'work'、ポモドーロカウント8
            const currentMode = 'work';
            const pomodoroCount = 8;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'longBreak'が返される
            expect(nextMode).toBe('longBreak');
        });

        // 境界値 - 2回目完了
        test('2回目作業完了はショートブレークに遷移', () => {
            // Given: 現在のモードが'work'、ポモドーロカウント2
            const currentMode = 'work';
            const pomodoroCount = 2;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'shortBreak'が返される
            expect(nextMode).toBe('shortBreak');
        });

        // 境界値 - 3回目完了
        test('3回目作業完了はショートブレークに遷移', () => {
            // Given: 現在のモードが'work'、ポモドーロカウント3
            const currentMode = 'work';
            const pomodoroCount = 3;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'shortBreak'が返される
            expect(nextMode).toBe('shortBreak');
        });

        // 境界値 - 12回目完了（3サイクル目）
        test('12回目作業完了（3サイクル目）はロングブレークに遷移', () => {
            // Given: 現在のモードが'work'、ポモドーロカウント12
            const currentMode = 'work';
            const pomodoroCount = 12;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'longBreak'が返される
            expect(nextMode).toBe('longBreak');
        });

        // 異常系 - 不正なモード
        test('不正なモードの場合は作業に遷移', () => {
            // Given: 不正なモード
            const currentMode = 'invalid';
            const pomodoroCount = 1;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'work'が返される（デフォルト動作）
            expect(nextMode).toBe('work');
        });

        // 異常系 - カウント0
        test('カウント0の場合はロングブレークに遷移', () => {
            // Given: 現在のモードが'work'、ポモドーロカウント0
            const currentMode = 'work';
            const pomodoroCount = 0;

            // When: determineNextModeを呼び出す
            const nextMode = determineNextMode(currentMode, pomodoroCount);

            // Then: 'longBreak'が返される（0 % 4 === 0）
            expect(nextMode).toBe('longBreak');
        });
    });

    describe('getModeDuration()', () => {

        // 正常系 - 'work'モード
        test('workモードの場合は25分（1500秒）を返す', () => {
            // Given: 'work'モード
            const mode = 'work';

            // When: getModeDurationを呼び出す
            const duration = getModeDuration(mode);

            // Then: 1500秒が返される
            expect(duration).toBe(TIMER_DEFAULTS.WORK_DURATION);
            expect(duration).toBe(1500);
        });

        // 正常系 - 'shortBreak'モード
        test('shortBreakモードの場合は5分（300秒）を返す', () => {
            // Given: 'shortBreak'モード
            const mode = 'shortBreak';

            // When: getModeDurationを呼び出す
            const duration = getModeDuration(mode);

            // Then: 300秒が返される
            expect(duration).toBe(TIMER_DEFAULTS.SHORT_BREAK);
            expect(duration).toBe(300);
        });

        // 正常系 - 'longBreak'モード
        test('longBreakモードの場合は15分（900秒）を返す', () => {
            // Given: 'longBreak'モード
            const mode = 'longBreak';

            // When: getModeDurationを呼び出す
            const duration = getModeDuration(mode);

            // Then: 900秒が返される
            expect(duration).toBe(TIMER_DEFAULTS.LONG_BREAK);
            expect(duration).toBe(900);
        });

        // 異常系 - 不正なモード
        test('不正なモードの場合はworkモードのデフォルト値を返す', () => {
            // Given: 不正なモード
            const mode = 'invalid';

            // When: getModeDurationを呼び出す
            const duration = getModeDuration(mode);

            // Then: workモードのデフォルト値が返される
            expect(duration).toBe(TIMER_DEFAULTS.WORK_DURATION);
        });

        // 異常系 - nullモード
        test('nullモードの場合はworkモードのデフォルト値を返す', () => {
            // Given: nullモード
            const mode = null;

            // When: getModeDurationを呼び出す
            const duration = getModeDuration(mode);

            // Then: workモードのデフォルト値が返される
            expect(duration).toBe(TIMER_DEFAULTS.WORK_DURATION);
        });

        // 異常系 - undefinedモード
        test('undefinedモードの場合はworkモードのデフォルト値を返す', () => {
            // Given: undefinedモード
            const mode = undefined;

            // When: getModeDurationを呼び出す
            const duration = getModeDuration(mode);

            // Then: workモードのデフォルト値が返される
            expect(duration).toBe(TIMER_DEFAULTS.WORK_DURATION);
        });

        // 境界値 - 'idle'モード
        test('idleモードの場合はworkモードのデフォルト値を返す', () => {
            // Given: 'idle'モード
            const mode = 'idle';

            // When: getModeDurationを呼び出す
            const duration = getModeDuration(mode);

            // Then: workモードのデフォルト値が返される
            expect(duration).toBe(TIMER_DEFAULTS.WORK_DURATION);
        });
    });
});
