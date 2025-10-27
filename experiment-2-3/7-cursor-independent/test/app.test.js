const fs = require('fs');
const path = require('path');

/**
 * DOM初期化ユーティリティ
 */
function setupDom() {
  const html = fs.readFileSync(path.resolve(__dirname, '../output/index.html'), 'utf-8');
  document.documentElement.innerHTML = html;
  return document;
}

describe('PomoTodo アプリ - ユニットテスト', () => {
  let exposed;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();

    // localStorageモック
    const storage = (() => {
      let store = new Map();
      return {
        getItem: jest.fn((key) => (store.has(key) ? store.get(key) : null)),
        setItem: jest.fn((key, value) => {
          store.set(key, String(value));
        }),
        removeItem: jest.fn((key) => {
          store.delete(key);
        }),
        clear() {
          store.clear();
        },
        __setError(method, error) {
          this[method].mockImplementation(() => {
            throw error;
          });
        }
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true
    });

    setupDom();

    require('../output/app.js');
    exposed = window.__PomoTodoTest;

    // 初期化が副作用を持つため、テストでは明示的に初期化しない
    jest.spyOn(exposed.App, 'init').mockImplementation(() => {});
  });

  describe('validateTaskInput', () => {
    test('Given 有効なタイトルとestimate null When validateTaskInput Then validになる (TC-01)', () => {
      // Given
      const title = '有効タスク';
      const estimate = null;

      // When
      const result = exposed.validateTaskInput(title, estimate);

      // Then
      expect(result).toEqual({ valid: true });
    });

    test('Given タイトル空 When validateTaskInput Then エラーメッセージ (TC-02)', () => {
      const result = exposed.validateTaskInput('', null);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch('タスク名を入力してください');
    });

    test('Given タイトルが101文字 When validateTaskInput Then 長さ超過エラー (TC-03)', () => {
      const longTitle = 'a'.repeat(101);
      const result = exposed.validateTaskInput(longTitle, null);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch('100文字以内');
    });

    test('Given estimateが0 When validateTaskInput Then 範囲外エラー (TC-06)', () => {
      const result = exposed.validateTaskInput('タスク', 0);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch('1〜20');
    });

    test('Given estimateが21 When validateTaskInput Then 範囲外エラー (TC-07)', () => {
      const result = exposed.validateTaskInput('タスク', 21);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch('1〜20');
    });

    test('Given estimateが文字列 When validateTaskInput Then 範囲外エラー (TC-08)', () => {
      const result = exposed.validateTaskInput('タスク', 'abc');
      expect(result.valid).toBe(false);
      expect(result.message).toMatch('1〜20');
    });

    test('Given estimateが小数 When validateTaskInput Then 範囲外エラー (TC-09)', () => {
      const result = exposed.validateTaskInput('タスク', 1.5);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch('1〜20');
    });
  });

  describe('normalizeEstimate', () => {
    test('Given null When normalizeEstimate Then nullを返す (TC-10)', () => {
      const result = exposed.normalizeEstimate(null);
      expect(result).toBeNull();
    });

    test('Given 最小境界 When normalizeEstimate Then 1を返す (TC-11)', () => {
      const result = exposed.normalizeEstimate(1);
      expect(result).toBe(1);
    });

    test('Given 最大境界 When normalizeEstimate Then 20を返す (TC-12)', () => {
      const result = exposed.normalizeEstimate(20);
      expect(result).toBe(20);
    });

    test('Given 最小-1 When normalizeEstimate Then 1に補正 (TC-13)', () => {
      const result = exposed.normalizeEstimate(0);
      expect(result).toBe(1);
    });

    test('Given 最大+1 When normalizeEstimate Then 20に補正 (TC-14)', () => {
      const result = exposed.normalizeEstimate(21);
      expect(result).toBe(20);
    });

    test('Given 文字列数値 When normalizeEstimate Then 数値化して返す (TC-15)', () => {
      const result = exposed.normalizeEstimate('5');
      expect(result).toBe(5);
    });

    test('Given 不正文字列 When normalizeEstimate Then nullを返す (TC-16)', () => {
      const result = exposed.normalizeEstimate('abc');
      expect(result).toBeNull();
    });
  });

  describe('Storage', () => {
    test('Given localStorage成功 When Storage.read Then JSONを返す (TC-17)', () => {
      window.localStorage.setItem(exposed.STORAGE_KEYS.tasks, JSON.stringify([{ id: 't1' }]));

      const result = exposed.Storage.read(exposed.STORAGE_KEYS.tasks, []);

      expect(result).toEqual([{ id: 't1' }]);
      expect(window.localStorage.getItem).toHaveBeenCalled();
    });

    test('Given localStorage null When Storage.read Then fallbackコピー (TC-18)', () => {
      window.localStorage.getItem.mockReturnValueOnce(null);

      const fallback = [{ id: 'fallback' }];
      const result = exposed.Storage.read('unknown_key', fallback);

      expect(result).toEqual(fallback);
      expect(result).not.toBe(fallback); // deepCloneの確認
    });

    test('Given localStorage例外 When Storage.read Then console.errorとfallback (TC-19)', () => {
      const error = new Error('read fail');
      window.localStorage.getItem.mockImplementationOnce(() => {
        throw error;
      });
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = exposed.Storage.read('key', { test: true });

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to read'), error);
      expect(result).toEqual({ test: true });
    });

    test('Given setItem成功 When Storage.write Then true (TC-20)', () => {
      const result = exposed.Storage.write('key', { ok: true });
      expect(result).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('key', JSON.stringify({ ok: true }));
    });

    test('Given setItem例外 When Storage.write Then notifyErrorとfalse (TC-21)', () => {
      const error = new Error('quota exceeded');
      window.localStorage.setItem.mockImplementationOnce(() => {
        throw error;
      });

      const notifySpy = jest.spyOn(exposed, 'notifyError').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = exposed.Storage.write('key', { x: 1 });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to write'), error);
      expect(notifySpy).toHaveBeenCalledWith('E005', '保存容量が不足しています');
      expect(result).toBe(false);
    });

    test('Given removeItem例外 When Storage.remove Then console.error (TC-22)', () => {
      const error = new Error('remove');
      window.localStorage.removeItem.mockImplementationOnce(() => {
        throw error;
      });
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

      exposed.Storage.remove('key');

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to remove'), error);
    });
  });

  describe('State.setFilter', () => {
    test('Given 有効filter When setFilter Then 状態更新 (TC-23)', () => {
      // Given
      const handler = jest.fn();
      exposed.State.subscribe('filter', handler);

      // When
      exposed.State.setFilter('active');

      // Then
      const snapshot = exposed.State.getSnapshot();
      expect(snapshot.filter).toBe('active');
      expect(handler).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        exposed.STORAGE_KEYS.settings,
        expect.stringContaining('active')
      );
    });

    test('Given 不正filter When setFilter Then 状態変更なし (TC-24)', () => {
      const initial = exposed.State.getSnapshot().filter;

      exposed.State.setFilter('unknown');

      const snapshot = exposed.State.getSnapshot();
      expect(snapshot.filter).toBe(initial);
      expect(window.localStorage.setItem).not.toHaveBeenCalledWith(
        exposed.STORAGE_KEYS.settings,
        expect.stringContaining('unknown')
      );
    });
  });

  describe('State.setSelectedTask', () => {
    beforeEach(() => {
      const initialTasks = [
        exposed.Models.createTask({ id: 'task1', title: 'タスク1' }),
        exposed.Models.createTask({ id: 'task2', title: 'タスク2' })
      ];
      exposed.State.replaceTasks(initialTasks);
    });

    test('Given 有効ID When setSelectedTask Then 選択保存 (TC-25)', () => {
      const handler = jest.fn();
      exposed.State.subscribe('selection', handler);

      exposed.State.setSelectedTask('task1');

      const snapshot = exposed.State.getSnapshot();
      expect(snapshot.selectedTaskId).toBe('task1');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        exposed.STORAGE_KEYS.selectedTask,
        JSON.stringify('task1')
      );
      expect(handler).toHaveBeenCalled();
    });

    test('Given 無効ID When setSelectedTask Then 選択解除 (TC-26)', () => {
      exposed.State.setSelectedTask('invalid');

      const snapshot = exposed.State.getSnapshot();
      expect(snapshot.selectedTaskId).toBeNull();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(exposed.STORAGE_KEYS.selectedTask);
    });
  });

  describe('handleTaskSubmit', () => {
    test('Given 正常入力 When handleTaskSubmit Then タスク追加とフォームリセット (TC-27)', () => {
      const form = document.querySelector('#task-form');
      const titleInput = document.querySelector('#new-task-title');
      const estimateInput = document.querySelector('#new-task-estimate');
      const errorBox = document.querySelector('#task-form-error');

      titleInput.value = '新規タスク';
      estimateInput.value = '3';

      const preventDefault = jest.fn();
      const event = { preventDefault };

      // When
      exposed.handleTaskSubmit(event);

      // Then
      expect(preventDefault).toHaveBeenCalled();
      const snapshot = exposed.State.getSnapshot();
      expect(snapshot.tasks[0].title).toBe('新規タスク');
      expect(snapshot.tasks[0].estimatedPomodoros).toBe(3);
      expect(titleInput.value).toBe('');
      expect(estimateInput.value).toBe('');
      expect(errorBox.textContent).toBe('');
      expect(document.activeElement).toBe(titleInput);
    });

    test('Given タイトル空 When handleTaskSubmit Then エラー表示 (TC-28)', () => {
      const titleInput = document.querySelector('#new-task-title');
      const errorBox = document.querySelector('#task-form-error');
      titleInput.value = '   ';

      const preventDefault = jest.fn();
      const event = { preventDefault };

      exposed.handleTaskSubmit(event);

      expect(preventDefault).toHaveBeenCalled();
      expect(errorBox.textContent).toMatch('タスク名を入力してください');
      expect(document.activeElement).toBe(titleInput);
    });
  });

  describe('deleteTask', () => {
    beforeEach(() => {
      const tasks = [
        exposed.Models.createTask({ id: 'task1', title: 'Task 1' }),
        exposed.Models.createTask({ id: 'task2', title: 'Task 2' })
      ];
      exposed.State.replaceTasks(tasks);
    });

    test('Given タイマー実行中タスク When deleteTask Then エラー通知 (TC-29)', () => {
      const notifySpy = jest.spyOn(exposed, 'notifyError').mockImplementation(() => {});
      exposed.State.updateTimer((timer) => {
        timer.isRunning = true;
        timer.currentTaskId = 'task1';
      });

      const snapshotBefore = exposed.State.getSnapshot();
      expect(snapshotBefore.tasks).toHaveLength(2);

      exposed.deleteTask('task1');

      const snapshotAfter = exposed.State.getSnapshot();
      expect(snapshotAfter.tasks).toHaveLength(2);
      expect(notifySpy).toHaveBeenCalledWith('E004', 'タイマーを停止してから削除してください');
    });

    test('Given 通常削除 When deleteTask Then タスク減少 (TC-30)', () => {
      const snapshotBefore = exposed.State.getSnapshot();
      expect(snapshotBefore.tasks).toHaveLength(2);

      exposed.deleteTask('task1');

      const snapshotAfter = exposed.State.getSnapshot();
      expect(snapshotAfter.tasks).toHaveLength(1);
      expect(snapshotAfter.tasks[0].id).toBe('task2');
    });
  });
});

