/**
 * Unit Tests: Formatter Functions
 *
 * Test Coverage:
 * - formatTime() - 秒数を MM:SS 形式に変換
 * - formatRelativeTime() - ISO日時を相対時刻に変換
 * - getTodayKey() - 今日の日付キー (YYYY-MM-DD) を取得
 *
 * Target: 100% branch coverage
 */

describe('Formatter Functions', () => {
  // Extract formatter functions from app.js for testing
  const formatTime = (totalSeconds) => {
    const seconds = Math.max(0, Number.parseInt(totalSeconds, 10) || 0);
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const created = new Date(isoString);
    if (Number.isNaN(created.getTime())) return '';
    const diff = Date.now() - created.getTime();
    if (diff < 60 * 1000) return 'たった今';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}時間前`;
    return created.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  };

  const getTodayKey = () => {
    return new Date().toISOString().slice(0, 10);
  };

  describe('formatTime() - Time Formatting', () => {
    describe('正常系: Valid Input', () => {
      test('0秒を 00:00 に変換する', () => {
        // Given: 0秒
        const input = 0;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 00:00が返される
        expect(result).toBe('00:00');
      });

      test('59秒を 00:59 に変換する', () => {
        // Given: 59秒
        const input = 59;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 00:59が返される
        expect(result).toBe('00:59');
      });

      test('60秒を 01:00 に変換する', () => {
        // Given: 60秒
        const input = 60;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 01:00が返される
        expect(result).toBe('01:00');
      });

      test('61秒を 01:01 に変換する', () => {
        // Given: 61秒
        const input = 61;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 01:01が返される
        expect(result).toBe('01:01');
      });

      test('1500秒(25分)を 25:00 に変換する', () => {
        // Given: 1500秒
        const input = 1500;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 25:00が返される
        expect(result).toBe('25:00');
      });

      test('3599秒(59分59秒)を 59:59 に変換する', () => {
        // Given: 3599秒
        const input = 3599;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 59:59が返される
        expect(result).toBe('59:59');
      });

      test('3600秒(1時間)を 60:00 に変換する', () => {
        // Given: 3600秒
        const input = 3600;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 60:00が返される (時間表示なし)
        expect(result).toBe('60:00');
      });
    });

    describe('境界値: Boundary Values', () => {
      test('1秒を 00:01 に変換する', () => {
        // Given: 1秒
        const input = 1;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 00:01が返される
        expect(result).toBe('00:01');
      });

      test('非常に大きな秒数(10000秒)を変換する', () => {
        // Given: 10000秒
        const input = 10000;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 166:40が返される
        expect(result).toBe('166:40');
      });

      test('小数点を含む秒数を整数に丸める', () => {
        // Given: 59.9秒
        const input = 59.9;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 小数点以下が切り捨てられる
        expect(result).toBe('00:59');
      });
    });

    describe('異常系: Invalid Input', () => {
      test('負の秒数を 00:00 に変換する', () => {
        // Given: 負の秒数
        const input = -100;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 00:00が返される
        expect(result).toBe('00:00');
      });

      test('NaNを 00:00 に変換する', () => {
        // Given: NaN
        const input = NaN;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 00:00が返される
        expect(result).toBe('00:00');
      });

      test('文字列 "abc" を 00:00 に変換する', () => {
        // Given: 文字列
        const input = 'abc';

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 00:00が返される
        expect(result).toBe('00:00');
      });

      test('null を 00:00 に変換する', () => {
        // Given: null
        const input = null;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 00:00が返される
        expect(result).toBe('00:00');
      });

      test('undefined を 00:00 に変換する', () => {
        // Given: undefined
        const input = undefined;

        // When: formatTime関数を実行
        const result = formatTime(input);

        // Then: 00:00が返される
        expect(result).toBe('00:00');
      });
    });
  });

  describe('formatRelativeTime() - Relative Time Formatting', () => {
    describe('正常系: Valid Input', () => {
      test('30秒前の時刻を "たった今" に変換する', () => {
        // Given: 30秒前のISO文字列
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(thirtySecondsAgo);

        // Then: "たった今"が返される
        expect(result).toBe('たった今');
      });

      test('5分前の時刻を "5分前" に変換する', () => {
        // Given: 5分前のISO文字列
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(fiveMinutesAgo);

        // Then: "5分前"が返される
        expect(result).toBe('5分前');
      });

      test('59分前の時刻を "59分前" に変換する', () => {
        // Given: 59分前のISO文字列
        const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(fiftyNineMinutesAgo);

        // Then: "59分前"が返される
        expect(result).toBe('59分前');
      });

      test('2時間前の時刻を "2時間前" に変換する', () => {
        // Given: 2時間前のISO文字列
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(twoHoursAgo);

        // Then: "2時間前"が返される
        expect(result).toBe('2時間前');
      });

      test('23時間前の時刻を "23時間前" に変換する', () => {
        // Given: 23時間前のISO文字列
        const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(twentyThreeHoursAgo);

        // Then: "23時間前"が返される
        expect(result).toBe('23時間前');
      });

      test('25時間前の時刻を日付形式に変換する', () => {
        // Given: 25時間前のISO文字列
        const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(twentyFiveHoursAgo);

        // Then: "M/D"形式の日付が返される
        expect(result).toMatch(/^\d{1,2}\/\d{1,2}$/);
      });

      test('1ヶ月前の時刻を日付形式に変換する', () => {
        // Given: 1ヶ月前のISO文字列
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(oneMonthAgo);

        // Then: "M/D"形式の日付が返される
        expect(result).toMatch(/^\d{1,2}\/\d{1,2}$/);
      });
    });

    describe('境界値: Boundary Values', () => {
      test('59秒前の時刻を "たった今" に変換する', () => {
        // Given: 59秒前のISO文字列
        const fiftyNineSecondsAgo = new Date(Date.now() - 59 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(fiftyNineSecondsAgo);

        // Then: "たった今"が返される
        expect(result).toBe('たった今');
      });

      test('60秒前(1分前)の時刻を "1分前" に変換する', () => {
        // Given: 60秒前のISO文字列
        const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(sixtySecondsAgo);

        // Then: "1分前"が返される
        expect(result).toBe('1分前');
      });

      test('60分前(1時間前)の時刻を "1時間前" に変換する', () => {
        // Given: 60分前のISO文字列
        const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(sixtyMinutesAgo);

        // Then: "1時間前"が返される
        expect(result).toBe('1時間前');
      });

      test('24時間前の時刻を日付形式に変換する', () => {
        // Given: 24時間前のISO文字列
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(twentyFourHoursAgo);

        // Then: "M/D"形式の日付が返される
        expect(result).toMatch(/^\d{1,2}\/\d{1,2}$/);
      });
    });

    describe('異常系: Invalid Input', () => {
      test('空文字列を渡すと空文字列を返す', () => {
        // Given: 空文字列
        const input = '';

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(input);

        // Then: 空文字列が返される
        expect(result).toBe('');
      });

      test('null を渡すと空文字列を返す', () => {
        // Given: null
        const input = null;

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(input);

        // Then: 空文字列が返される
        expect(result).toBe('');
      });

      test('undefined を渡すと空文字列を返す', () => {
        // Given: undefined
        const input = undefined;

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(input);

        // Then: 空文字列が返される
        expect(result).toBe('');
      });

      test('無効なISO文字列を渡すと空文字列を返す', () => {
        // Given: 無効なISO文字列
        const input = 'invalid-date';

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(input);

        // Then: 空文字列が返される
        expect(result).toBe('');
      });

      test('数値を渡すと空文字列を返す', () => {
        // Given: 数値
        const input = 123456789;

        // When: formatRelativeTime関数を実行
        const result = formatRelativeTime(input);

        // Then: 空文字列が返される（文字列ではないため）
        expect(result).toBe('');
      });
    });
  });

  describe('getTodayKey() - Today Date Key', () => {
    test('今日の日付を YYYY-MM-DD 形式で返す', () => {
      // Given: 現在時刻
      const now = new Date();
      const expected = now.toISOString().slice(0, 10);

      // When: getTodayKey関数を実行
      const result = getTodayKey();

      // Then: YYYY-MM-DD形式の文字列が返される
      expect(result).toBe(expected);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('返される文字列が10文字である', () => {
      // Given: なし
      // When: getTodayKey関数を実行
      const result = getTodayKey();

      // Then: 10文字の文字列が返される
      expect(result).toHaveLength(10);
    });

    test('返される文字列が年-月-日の形式である', () => {
      // Given: なし
      // When: getTodayKey関数を実行
      const result = getTodayKey();

      // Then: YYYY-MM-DD形式である
      const parts = result.split('-');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(4); // 年
      expect(parts[1]).toHaveLength(2); // 月
      expect(parts[2]).toHaveLength(2); // 日
    });

    test('連続して呼び出しても同じ値を返す（同じ日内）', () => {
      // Given: なし
      // When: getTodayKey関数を2回実行
      const result1 = getTodayKey();
      const result2 = getTodayKey();

      // Then: 同じ値が返される
      expect(result1).toBe(result2);
    });
  });
});
