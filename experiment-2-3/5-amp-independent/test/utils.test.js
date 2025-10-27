/**
 * Utils関数のテストスイート
 */

// app.jsから関数をインポート（テスト環境ではrequireを使用）
// 実際の実装では、app.jsをモジュール化する必要がある

describe('Utils.generateUUID', () => {
  test('正常系: UUID v4形式の文字列を生成する', () => {
    // Given: Utils.generateUUID関数が存在する
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // When: UUIDを生成する
    const uuid = Utils.generateUUID();
    
    // Then: UUID v4形式に一致する
    expect(uuid).toMatch(uuidPattern);
    expect(uuid).toHaveLength(36);
  });

  test('正常系: 生成されるUUIDが一意である', () => {
    // Given: 大量のUUID生成
    const count = 10000;
    const uuids = new Set();
    
    // When: 10000個のUUIDを生成
    for (let i = 0; i < count; i++) {
      uuids.add(Utils.generateUUID());
    }
    
    // Then: すべて異なる値（重複なし）
    expect(uuids.size).toBe(count);
  });

  test('境界値: 連続して呼び出しても正常に動作する', () => {
    // Given: 連続呼び出しの準備
    const results = [];
    
    // When: 連続10000回呼び出し
    for (let i = 0; i < 10000; i++) {
      results.push(Utils.generateUUID());
    }
    
    // Then: すべて成功し、すべて異なる
    expect(results.length).toBe(10000);
    expect(new Set(results).size).toBe(10000);
  });
});

describe('Utils.formatTime', () => {
  test('正常系: 25分（1500秒）を"25:00"にフォーマット', () => {
    // Given: 1500秒
    const seconds = 1500;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: "25:00"が返る
    expect(result).toBe('25:00');
  });

  test('正常系: 1分（60秒）を"01:00"にフォーマット', () => {
    // Given: 60秒
    const seconds = 60;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: "01:00"が返る
    expect(result).toBe('01:00');
  });

  test('正常系: 1分1秒（61秒）を"01:01"にフォーマット', () => {
    // Given: 61秒
    const seconds = 61;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: "01:01"が返る
    expect(result).toBe('01:01');
  });

  test('境界値: 0秒を"00:00"にフォーマット', () => {
    // Given: 0秒
    const seconds = 0;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: "00:00"が返る
    expect(result).toBe('00:00');
  });

  test('境界値: 1秒を"00:01"にフォーマット', () => {
    // Given: 1秒
    const seconds = 1;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: "00:01"が返る
    expect(result).toBe('00:01');
  });

  test('境界値: 59秒を"00:59"にフォーマット', () => {
    // Given: 59秒
    const seconds = 59;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: "00:59"が返る
    expect(result).toBe('00:59');
  });

  test('境界値: 60秒を"01:00"にフォーマット', () => {
    // Given: 60秒
    const seconds = 60;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: "01:00"が返る
    expect(result).toBe('01:00');
  });

  test('境界値: 99分59秒（5999秒）を"99:59"にフォーマット', () => {
    // Given: 5999秒
    const seconds = 5999;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: "99:59"が返る
    expect(result).toBe('99:59');
  });

  test('異常系: 負の値を渡すと"00:00"または適切な処理', () => {
    // Given: -1秒
    const seconds = -1;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: 負の値が正しく処理される（仕様による）
    // 実装により "-1:00" または "00:00" など
    expect(result).toMatch(/^-?\d{2}:\d{2}$/);
  });

  test('異常系: 小数を渡すと整数部分で処理', () => {
    // Given: 1.5秒
    const seconds = 1.5;
    
    // When: フォーマット実行
    const result = Utils.formatTime(seconds);
    
    // Then: "00:01"（Math.floor処理）
    expect(result).toBe('00:01');
  });

  test('異常系: 文字列を渡すとNaNまたはエラー', () => {
    // Given: 文字列
    const seconds = 'abc';
    
    // When/Then: エラーまたはNaN処理
    expect(() => {
      const result = Utils.formatTime(seconds);
      // NaNの場合は "NaN:NaN" のような結果になる可能性
      expect(result).toContain('NaN');
    }).not.toThrow(); // または .toThrow() でエラーを期待
  });

  test('異常系: nullを渡すとエラーまたは"00:00"', () => {
    // Given: null
    const seconds = null;
    
    // When/Then: エラーまたは0として処理
    const result = Utils.formatTime(seconds);
    expect(result).toBe('00:00'); // nullは0として扱われる
  });

  test('異常系: undefinedを渡すとエラーまたは"NaN:NaN"', () => {
    // Given: undefined
    const seconds = undefined;
    
    // When/Then: NaN処理
    const result = Utils.formatTime(seconds);
    expect(result).toContain('NaN');
  });

  test('異常系: オブジェクトを渡すとエラーまたはNaN', () => {
    // Given: オブジェクト
    const seconds = {};
    
    // When/Then: NaN処理
    const result = Utils.formatTime(seconds);
    expect(result).toContain('NaN');
  });
});

describe('Utils.isToday', () => {
  test('正常系: 今日の日付文字列でtrueを返す', () => {
    // Given: 今日の日付
    const today = new Date().toISOString();
    
    // When: 今日かチェック
    const result = Utils.isToday(today);
    
    // Then: trueが返る
    expect(result).toBe(true);
  });

  test('正常系: 昨日の日付文字列でfalseを返す', () => {
    // Given: 昨日の日付
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString();
    
    // When: 今日かチェック
    const result = Utils.isToday(dateString);
    
    // Then: falseが返る
    expect(result).toBe(false);
  });

  test('正常系: 明日の日付文字列でfalseを返す', () => {
    // Given: 明日の日付
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString();
    
    // When: 今日かチェック
    const result = Utils.isToday(dateString);
    
    // Then: falseが返る
    expect(result).toBe(false);
  });

  test('境界値: 今日の0時0分0秒でtrueを返す', () => {
    // Given: 今日の0時0分0秒
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateString = today.toISOString();
    
    // When: 今日かチェック
    const result = Utils.isToday(dateString);
    
    // Then: trueが返る
    expect(result).toBe(true);
  });

  test('境界値: 今日の23時59分59秒でtrueを返す', () => {
    // Given: 今日の23時59分59秒
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dateString = today.toISOString();
    
    // When: 今日かチェック
    const result = Utils.isToday(dateString);
    
    // Then: trueが返る
    expect(result).toBe(true);
  });

  test('異常系: 不正な日付文字列でfalseまたはエラー', () => {
    // Given: 不正な文字列
    const invalid = 'invalid-date';
    
    // When/Then: falseまたはエラー
    const result = Utils.isToday(invalid);
    expect(result).toBe(false);
  });

  test('異常系: 空文字列でfalseまたはエラー', () => {
    // Given: 空文字列
    const empty = '';
    
    // When/Then: falseまたはエラー
    const result = Utils.isToday(empty);
    expect(result).toBe(false);
  });

  test('異常系: nullでエラーをスロー', () => {
    // Given: null
    const nullValue = null;
    
    // When/Then: エラー
    expect(() => Utils.isToday(nullValue)).toThrow();
  });

  test('異常系: undefinedでエラーをスロー', () => {
    // Given: undefined
    const undefinedValue = undefined;
    
    // When/Then: エラー
    expect(() => Utils.isToday(undefinedValue)).toThrow();
  });
});

describe('Utils.sanitize', () => {
  // DOM環境が必要なテスト（JSDOM使用）
  beforeEach(() => {
    // DOMのセットアップ
    document.body.innerHTML = '';
  });

  test('正常系: 通常のテキストをそのまま返す', () => {
    // Given: 通常のテキスト
    const text = 'Hello World';
    
    // When: サニタイズ実行
    const result = Utils.sanitize(text);
    
    // Then: そのまま返る
    expect(result).toBe('Hello World');
  });

  test('正常系: HTMLタグをエスケープする', () => {
    // Given: scriptタグを含むテキスト
    const text = '<script>alert("XSS")</script>';
    
    // When: サニタイズ実行
    const result = Utils.sanitize(text);
    
    // Then: エスケープされる
    expect(result).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
  });

  test('正常系: 特殊文字をエスケープする', () => {
    // Given: 特殊文字を含むテキスト
    const text = '<>&"';
    
    // When: サニタイズ実行
    const result = Utils.sanitize(text);
    
    // Then: エスケープされる
    expect(result).toBe('&lt;&gt;&amp;"');
  });

  test('境界値: 空文字列を渡すと空文字列を返す', () => {
    // Given: 空文字列
    const text = '';
    
    // When: サニタイズ実行
    const result = Utils.sanitize(text);
    
    // Then: 空文字列
    expect(result).toBe('');
  });

  test('異常系: nullでエラーをスロー', () => {
    // Given: null
    const text = null;
    
    // When/Then: エラー
    expect(() => Utils.sanitize(text)).toThrow();
  });

  test('異常系: undefinedでエラーをスロー', () => {
    // Given: undefined
    const text = undefined;
    
    // When/Then: エラー
    expect(() => Utils.sanitize(text)).toThrow();
  });

  test('異常系: オブジェクトを渡すと"[object Object]"になる', () => {
    // Given: オブジェクト
    const text = {};
    
    // When: サニタイズ実行
    const result = Utils.sanitize(text);
    
    // Then: "[object Object]"
    expect(result).toBe('[object Object]');
  });
});
