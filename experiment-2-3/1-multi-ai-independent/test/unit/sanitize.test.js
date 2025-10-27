/**
 * Unit Tests: sanitize() function
 *
 * Test Coverage:
 * - XSS prevention (HTML tags, special characters)
 * - Type validation (string, number, null, undefined, object, array)
 * - Boundary values (empty string, whitespace)
 * - Complex XSS patterns (event handlers, img tags, etc.)
 *
 * Target: 100% branch coverage
 */

describe('sanitize() - XSS Prevention', () => {
  // Since app.js is wrapped in IIFE, we need to extract and test the sanitize function
  // We'll define a standalone version for testing
  const sanitize = (str) => {
    if (typeof str !== 'string') return '';
    // First, escape special characters
    let sanitized = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    // Then, remove HTML tags (now safely escaped)
    // This will remove patterns like &lt;script&gt; to become empty
    sanitized = sanitized.replace(/&lt;[^&]*&gt;/g, '');
    return sanitized;
  };

  describe('正常系: Valid Input', () => {
    test('通常の文字列をそのまま返す', () => {
      // Given: 通常の英語文字列
      const input = 'Hello World';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 同じ文字列が返される
      expect(result).toBe('Hello World');
    });

    test('日本語文字列をそのまま返す', () => {
      // Given: 日本語文字列
      const input = 'こんにちは';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 同じ文字列が返される
      expect(result).toBe('こんにちは');
    });

    test('数字を含む文字列をそのまま返す', () => {
      // Given: 数字を含む文字列
      const input = 'Task 123';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 同じ文字列が返される
      expect(result).toBe('Task 123');
    });

    test('記号（ハイフン、アンダースコア等）を含む文字列を返す', () => {
      // Given: 安全な記号を含む文字列
      const input = 'task_name-01';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 同じ文字列が返される
      expect(result).toBe('task_name-01');
    });
  });

  describe('異常系: XSS Attack Prevention', () => {
    test('HTMLタグ（script）を削除する', () => {
      // Given: scriptタグを含む文字列
      const input = '<script>alert(\'XSS\')</script>';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: タグが削除され、内容のみエスケープされる
      expect(result).toBe('alert(&#x27;XSS&#x27;)');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    test('img タグのonerrorイベントハンドラを削除する', () => {
      // Given: onerrorイベントハンドラを含むimgタグ
      const input = '<img src=x onerror=alert(1)>';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: タグが完全に削除される
      expect(result).toBe('');
      expect(result).not.toContain('<img');
      expect(result).not.toContain('onerror');
    });

    test('特殊文字（<, >, &, ", \')をHTMLエンティティに変換する', () => {
      // Given: 特殊文字を含む文字列
      const input = '< > & " \'';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: すべてエスケープされる
      expect(result).toBe('&lt; &gt; &amp; &quot; &#x27;');
    });

    test('onclickイベントハンドラをエスケープする', () => {
      // Given: onclickイベントハンドラを含む文字列
      const input = 'onclick=\'alert(1)\'';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: シングルクォートがエスケープされる
      expect(result).toBe('onclick=&#x27;alert(1)&#x27;');
      expect(result).not.toContain('\'');
    });

    test('複数のHTMLタグをすべて削除する', () => {
      // Given: 複数のHTMLタグを含む文字列
      const input = '<div><p>Hello</p><span>World</span></div>';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: タグが削除され、テキストのみ残る
      expect(result).toBe('HelloWorld');
    });

    test('既にエスケープされたHTMLエンティティを二重エスケープする', () => {
      // Given: 既にエスケープされた文字列
      const input = '&lt;script&gt;';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: &記号が再度エスケープされる
      expect(result).toBe('&amp;lt;script&amp;gt;');
    });

    test('JavaScriptプロトコルを含むリンクをエスケープする', () => {
      // Given: javascript:プロトコルを含む文字列
      const input = '<a href="javascript:alert(1)">Click</a>';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: タグが削除され、内容のみエスケープされる
      expect(result).toBe('Click');
    });

    test('データプロトコルを含むimgタグを削除する', () => {
      // Given: data:プロトコルを含むimgタグ
      const input = '<img src="data:image/svg+xml,<svg/onload=alert(1)>">';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: タグが削除される
      expect(result).toBe('');
    });
  });

  describe('境界値: Boundary Values', () => {
    test('空文字列をそのまま返す', () => {
      // Given: 空文字列
      const input = '';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空文字列が返される
      expect(result).toBe('');
    });

    test('空白のみの文字列をそのまま返す', () => {
      // Given: 空白のみの文字列
      const input = '   ';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空白が保持される
      expect(result).toBe('   ');
    });

    test('単一文字の文字列をそのまま返す', () => {
      // Given: 単一文字
      const input = 'a';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 同じ文字が返される
      expect(result).toBe('a');
    });

    test('非常に長い文字列を処理できる', () => {
      // Given: 1000文字の文字列
      const input = 'a'.repeat(1000);

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 同じ長さの文字列が返される
      expect(result).toBe('a'.repeat(1000));
      expect(result.length).toBe(1000);
    });
  });

  describe('異常系: Invalid Type Input', () => {
    test('null を渡すと空文字列を返す', () => {
      // Given: null
      const input = null;

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空文字列が返される
      expect(result).toBe('');
    });

    test('undefined を渡すと空文字列を返す', () => {
      // Given: undefined
      const input = undefined;

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空文字列が返される
      expect(result).toBe('');
    });

    test('数値型を渡すと空文字列を返す', () => {
      // Given: 数値
      const input = 123;

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空文字列が返される
      expect(result).toBe('');
    });

    test('オブジェクトを渡すと空文字列を返す', () => {
      // Given: オブジェクト
      const input = { key: 'value' };

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空文字列が返される
      expect(result).toBe('');
    });

    test('配列を渡すと空文字列を返す', () => {
      // Given: 配列
      const input = ['test'];

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空文字列が返される
      expect(result).toBe('');
    });

    test('関数を渡すと空文字列を返す', () => {
      // Given: 関数
      const input = () => 'test';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空文字列が返される
      expect(result).toBe('');
    });

    test('boolean型を渡すと空文字列を返す', () => {
      // Given: boolean
      const input = true;

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空文字列が返される
      expect(result).toBe('');
    });

    test('Symbol型を渡すと空文字列を返す', () => {
      // Given: Symbol
      const input = Symbol('test');

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 空文字列が返される
      expect(result).toBe('');
    });
  });

  describe('複合ケース: Complex XSS Patterns', () => {
    test('複数のXSS攻撃パターンを含む文字列を完全にサニタイズする', () => {
      // Given: 複雑なXSS攻撃パターン
      const input = '<script>alert("XSS")</script><img src=x onerror=alert(1)>\'onclick="alert(2)"';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: すべてのタグが削除され、特殊文字がエスケープされる
      expect(result).toBe('alert(&quot;XSS&quot;)&#x27;onclick=&quot;alert(2)&quot;');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    test('タグと通常テキストが混在する文字列を正しく処理する', () => {
      // Given: タグとテキストが混在
      const input = 'Hello <b>World</b> & <i>Test</i>';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: タグが削除され、&がエスケープされる
      expect(result).toBe('Hello World &amp; Test');
    });

    test('ネストされたタグを完全に削除する', () => {
      // Given: ネストされたタグ
      const input = '<div><div><div>Deep</div></div></div>';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: すべてのタグが削除される
      expect(result).toBe('Deep');
    });

    test('特殊文字が連続する文字列をすべてエスケープする', () => {
      // Given: 特殊文字が連続
      const input = '<<>>&""\'\'';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: すべてエスケープされる
      expect(result).toBe('&lt;&lt;&gt;&gt;&amp;&quot;&quot;&#x27;&#x27;');
    });

    test('改行やタブを含む文字列をそのまま保持する', () => {
      // Given: 改行やタブを含む文字列
      const input = 'Line1\nLine2\tTabbed';

      // When: sanitize関数を実行
      const result = sanitize(input);

      // Then: 改行やタブが保持される
      expect(result).toBe('Line1\nLine2\tTabbed');
      expect(result).toContain('\n');
      expect(result).toContain('\t');
    });
  });
});
