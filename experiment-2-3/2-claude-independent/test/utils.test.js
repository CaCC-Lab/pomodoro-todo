/**
 * ユーティリティ関数のテスト
 */

const {
    sanitizeInput,
    validateTaskTitle,
    formatTime,
    VALIDATION
} = require('./app.testable');

describe('ユーティリティ関数', () => {

    describe('sanitizeInput()', () => {

        // U1-1: 正常系 - 通常文字列
        test('通常の文字列をそのまま返す', () => {
            // Given: 通常の文字列
            const input = 'test';

            // When: sanitizeInputを呼び出す
            const result = sanitizeInput(input);

            // Then: 同じ文字列が返される
            expect(result).toBe('test');
        });

        // U1-2: 正常系 - 空文字列（境界値）
        test('空文字列をそのまま返す', () => {
            // Given: 空文字列
            const input = '';

            // When: sanitizeInputを呼び出す
            const result = sanitizeInput(input);

            // Then: 空文字列が返される
            expect(result).toBe('');
        });

        // U1-3: 異常系 - HTMLタグ（XSS対策）
        test('HTMLタグをエスケープする', () => {
            // Given: scriptタグを含む文字列
            const input = '<script>alert("XSS")</script>';

            // When: sanitizeInputを呼び出す
            const result = sanitizeInput(input);

            // Then: タグがエスケープされている
            expect(result).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
        });

        // U1-4: 異常系 - HTMLエンティティ
        test('HTMLエンティティをエスケープする', () => {
            // Given: HTMLエンティティを含む文字列
            const input = '&lt;div&gt;';

            // When: sanitizeInputを呼び出す
            const result = sanitizeInput(input);

            // Then: エンティティがさらにエスケープされている
            expect(result).toBe('&amp;lt;div&amp;gt;');
        });

        // U1-5: 境界値 - 特殊文字
        test('特殊文字をエスケープする', () => {
            // Given: 特殊文字を含む文字列
            const input = '<>&"\'';

            // When: sanitizeInputを呼び出す
            const result = sanitizeInput(input);

            // Then: すべてエスケープされている
            expect(result).toContain('&lt;');
            expect(result).toContain('&gt;');
        });

        // U1-6: 異常系 - imgタグ（onloadイベント付き）
        test('imgタグとイベントハンドラをエスケープする', () => {
            // Given: imgタグとonloadイベント
            const input = '<img src=x onerror=alert(1)>';

            // When: sanitizeInputを呼び出す
            const result = sanitizeInput(input);

            // Then: タグがエスケープされている
            expect(result).not.toContain('<img');
            expect(result).toContain('&lt;img');
        });

        // U1-7: 正常系 - 日本語文字列
        test('日本語文字列をそのまま返す', () => {
            // Given: 日本語文字列
            const input = 'テストタスク';

            // When: sanitizeInputを呼び出す
            const result = sanitizeInput(input);

            // Then: 同じ文字列が返される
            expect(result).toBe('テストタスク');
        });

        // U1-8: 正常系 - 絵文字
        test('絵文字をそのまま返す', () => {
            // Given: 絵文字を含む文字列
            const input = '🍅 ポモドーロ';

            // When: sanitizeInputを呼び出す
            const result = sanitizeInput(input);

            // Then: 同じ文字列が返される
            expect(result).toBe('🍅 ポモドーロ');
        });
    });

    describe('validateTaskTitle()', () => {

        // U2-1: 正常系 - 通常文字列
        test('通常の文字列に対してnullを返す', () => {
            // Given: 通常の文字列
            const title = 'テスト';

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーなし（null）
            expect(result).toBeNull();
        });

        // U2-2: 正常系 - 100文字（境界値・最大）
        test('100文字のタイトルに対してnullを返す', () => {
            // Given: 100文字の文字列
            const title = 'a'.repeat(100);

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーなし（null）
            expect(result).toBeNull();
        });

        // U2-3: 異常系 - 空文字列
        test('空文字列に対してエラーメッセージを返す', () => {
            // Given: 空文字列
            const title = '';

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーメッセージが返される
            expect(result).toBe('タスク名を入力してください');
        });

        // U2-4: 異常系 - 空白のみ
        test('空白のみの文字列に対してエラーメッセージを返す', () => {
            // Given: 空白のみの文字列
            const title = '   ';

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーメッセージが返される
            expect(result).toBe('タスク名を入力してください');
        });

        // U2-5: 異常系 - 101文字（境界値・最大+1）
        test('101文字のタイトルに対してエラーメッセージを返す', () => {
            // Given: 101文字の文字列
            const title = 'a'.repeat(101);

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーメッセージが返される
            expect(result).toBe('タスク名は100文字以内で入力してください');
        });

        // U2-6: 境界値 - 99文字（境界値・最大-1）
        test('99文字のタイトルに対してnullを返す', () => {
            // Given: 99文字の文字列
            const title = 'a'.repeat(99);

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーなし（null）
            expect(result).toBeNull();
        });

        // U2-7: 異常系 - null
        test('nullに対してエラーメッセージを返す', () => {
            // Given: null
            const title = null;

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーメッセージが返される
            expect(result).toBe('タスク名を入力してください');
        });

        // U2-8: 異常系 - undefined
        test('undefinedに対してエラーメッセージを返す', () => {
            // Given: undefined
            const title = undefined;

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーメッセージが返される
            expect(result).toBe('タスク名を入力してください');
        });

        // U2-9: 正常系 - 先頭と末尾に空白
        test('先頭と末尾に空白があるが内容が有効な文字列に対してnullを返す', () => {
            // Given: 空白を含む文字列
            const title = '  テスト  ';

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーなし（null）
            expect(result).toBeNull();
        });

        // U2-10: 境界値 - 1文字
        test('1文字のタイトルに対してnullを返す', () => {
            // Given: 1文字の文字列
            const title = 'a';

            // When: validateTaskTitleを呼び出す
            const result = validateTaskTitle(title);

            // Then: エラーなし（null）
            expect(result).toBeNull();
        });
    });

    describe('formatTime()', () => {

        // U3-1: 正常系 - 0秒（境界値・最小）
        test('0秒を"00:00"にフォーマットする', () => {
            // Given: 0秒
            const seconds = 0;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "00:00"が返される
            expect(result).toBe('00:00');
        });

        // U3-2: 正常系 - 59秒（境界値・秒最大）
        test('59秒を"00:59"にフォーマットする', () => {
            // Given: 59秒
            const seconds = 59;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "00:59"が返される
            expect(result).toBe('00:59');
        });

        // U3-3: 正常系 - 60秒（境界値・1分）
        test('60秒を"01:00"にフォーマットする', () => {
            // Given: 60秒
            const seconds = 60;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "01:00"が返される
            expect(result).toBe('01:00');
        });

        // U3-4: 正常系 - 61秒（境界値・1分+1秒）
        test('61秒を"01:01"にフォーマットする', () => {
            // Given: 61秒
            const seconds = 61;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "01:01"が返される
            expect(result).toBe('01:01');
        });

        // U3-5: 正常系 - 1500秒（25分）
        test('1500秒を"25:00"にフォーマットする', () => {
            // Given: 1500秒（25分）
            const seconds = 1500;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "25:00"が返される
            expect(result).toBe('25:00');
        });

        // U3-6: 正常系 - 3599秒（境界値・59:59）
        test('3599秒を"59:59"にフォーマットする', () => {
            // Given: 3599秒
            const seconds = 3599;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "59:59"が返される
            expect(result).toBe('59:59');
        });

        // U3-7: 正常系 - 3600秒（1時間）
        test('3600秒を"60:00"にフォーマットする', () => {
            // Given: 3600秒（1時間）
            const seconds = 3600;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "60:00"が返される
            expect(result).toBe('60:00');
        });

        // U3-8: 異常系 - 負の値
        test('負の値に対して不正な出力を返す', () => {
            // Given: 負の値
            const seconds = -1;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: 負の分と秒が表示される（実装の実際の挙動）
            expect(result).toBe('-1:-1');
        });

        // U3-9: 異常系 - 文字列
        test('文字列に対してNaNを含む出力を返す', () => {
            // Given: 文字列
            const seconds = 'string';

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: NaNが含まれる
            expect(result).toContain('NaN');
        });

        // U3-10: 異常系 - null
        test('nullに対して"00:00"を返す', () => {
            // Given: null
            const seconds = null;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "00:00"が返される（null は数値演算で0として扱われる）
            expect(result).toBe('00:00');
        });

        // U3-11: 境界値 - 1秒
        test('1秒を"00:01"にフォーマットする', () => {
            // Given: 1秒
            const seconds = 1;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "00:01"が返される
            expect(result).toBe('00:01');
        });

        // U3-12: 正常系 - 300秒（5分・ショートブレーク）
        test('300秒を"05:00"にフォーマットする', () => {
            // Given: 300秒（5分）
            const seconds = 300;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "05:00"が返される
            expect(result).toBe('05:00');
        });

        // U3-13: 正常系 - 900秒（15分・ロングブレーク）
        test('900秒を"15:00"にフォーマットする', () => {
            // Given: 900秒（15分）
            const seconds = 900;

            // When: formatTimeを呼び出す
            const result = formatTime(seconds);

            // Then: "15:00"が返される
            expect(result).toBe('15:00');
        });
    });
});
