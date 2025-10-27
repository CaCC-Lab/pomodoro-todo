const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { createInstrumenter } = require("istanbul-lib-instrument");

const OUTPUT_DIR = path.resolve(__dirname, "../output");
const HTML_PATH = path.join(OUTPUT_DIR, "index.html");
const SCRIPT_PATH = path.join(OUTPUT_DIR, "app.js");
const APP_SOURCE = fs.readFileSync(SCRIPT_PATH, "utf-8");
const instrumenter = createInstrumenter({ produceSourceMap: false });
const INSTRUMENTED_APP_SOURCE = instrumenter.instrumentSync(APP_SOURCE, SCRIPT_PATH);

const STORAGE_KEYS = {
  TASKS: "pomotodo_tasks",
  TASKS_BACKUP: "pomotodo_tasks_backup",
  TIMER: "pomotodo_timer",
  SETTINGS: "pomotodo_settings",
  TODAY: "pomotodo_today",
  HISTORY: "pomotodo_history"
};

function bootstrapApp({
  prefilledStorage = {},
  confirmBehavior = () => true,
  notificationPermission = "granted",
  requestPermissionMock
} = {}) {
  const html = fs.readFileSync(HTML_PATH, "utf-8");
  const dom = new JSDOM(html, {
    url: "http://localhost",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;

  if (!window.FormData) {
    window.FormData = global.FormData;
  }

  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);

  const confirmMock = jest.fn(confirmBehavior);
  window.confirm = confirmMock;

  class FakeNotification {
    constructor(title, options) {
      FakeNotification.instances.push({ title, options });
    }
  }
  FakeNotification.instances = [];
  FakeNotification.permission = notificationPermission;
  FakeNotification.requestPermission =
    requestPermissionMock || jest.fn().mockResolvedValue(notificationPermission);
  Object.defineProperty(window, "Notification", {
    configurable: true,
    writable: true,
    value: FakeNotification
  });

  window.AudioContext = class {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
    }
    createOscillator() {
      return {
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 0 },
        type: "triangle"
      };
    }
    createGain() {
      return {
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn()
        }
      };
    }
  };

  Object.entries(prefilledStorage).forEach(([key, value]) => {
    window.localStorage.setItem(key, value);
  });

  let initCallback;
  const originalAddEventListener = document.addEventListener.bind(document);
  document.addEventListener = (type, listener, options) => {
    if (type === "DOMContentLoaded") {
      initCallback = listener;
    }
    return originalAddEventListener(type, listener, options);
  };

  window.eval(INSTRUMENTED_APP_SOURCE);
  if (initCallback) {
    initCallback();
  } else {
    document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  }

  const cleanup = () => {
    jest.clearAllMocks();
    dom.window.close();
  };

  return {
    window,
    document,
    cleanup,
    confirmMock,
    notification: FakeNotification
  };
}

function dispatchClick(element, window) {
  element.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}

function submitForm(form, window) {
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}

function addTask(window, title, estimate) {
  const form = window.document.querySelector("[data-task-form]");
  const titleInput = window.document.getElementById("taskTitle");
  const estimateInput = window.document.getElementById("taskEstimate");
  titleInput.value = title;
  estimateInput.value = estimate ?? "";
  submitForm(form, window);
}

function selectTask(window, indexOrTitle = 0) {
  const buttons = Array.from(window.document.querySelectorAll("[data-role='select-task']"));
  const target =
    typeof indexOrTitle === "string"
      ? buttons.find((btn) => btn.textContent === indexOrTitle)
      : buttons[indexOrTitle];
  if (!target) {
    throw new Error("指定したタスクが見つかりません");
  }
  dispatchClick(target, window);
}

function clickTimerButton(window, action) {
  const button = window.document.querySelector(`[data-action='${action}']`);
  dispatchClick(button, window);
}

const getToast = (document) => document.querySelector("[data-element='toast']");
const getFormHint = (document) => document.querySelector("[data-text='formHint']");

describe("PomoTodo E2E-like interactions", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("タスクを正常に追加すると一覧とフォームが更新される", () => {
    // Given: 有効なタイトルと最大値の見積もりを入力している
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      addTask(window, "集中作業", "20");

      // When: タスク追加フォームを送信する
      const items = document.querySelectorAll("[data-task-id]");

      // Then: タスクが追加されフォームがリセットされる
      expect(items).toHaveLength(1);
      expect(items[0].querySelector(".task-title").textContent).toBe("集中作業");
      expect(document.getElementById("taskTitle").value).toBe("");
      expect(document.getElementById("taskEstimate").value).toBe("");
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.TASKS));
      expect(stored[0].title).toBe("集中作業");
      expect(getFormHint(document).textContent).toBe("");
    } finally {
      cleanup();
    }
  });

  test("タイトルが空の場合はE001エラーを表示して追加しない", () => {
    // Given: タイトルが空文字のまま
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      window.document.getElementById("taskTitle").value = " ";
      submitForm(window.document.querySelector("[data-task-form]"), window);

      // When: タスク追加フォームを送信する
      const items = document.querySelectorAll("[data-task-id]");

      // Then: エラーメッセージが表示されタスクは追加されない
      expect(items).toHaveLength(0);
      expect(getFormHint(document).textContent).toBe("タスク名を入力してください");
    } finally {
      cleanup();
    }
  });

  test("101文字のタイトルはE002エラーを表示する", () => {
    // Given: 101文字の長いタイトル
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      const longTitle = "a".repeat(101);
      addTask(window, longTitle, "");

      // When: フォーム送信を試みる
      const items = document.querySelectorAll("[data-task-id]");

      // Then: エラーメッセージE002が表示され追加されない
      expect(items).toHaveLength(0);
      expect(getFormHint(document).textContent).toBe("タスク名は100文字以内で入力してください");
    } finally {
      cleanup();
    }
  });

  test.each([
    ["0", "見積もりは1〜20で入力してください", "最小値より小さい"],
    ["abc", "見積もりは1〜20で入力してください", "不正形式"]
  ])("見積もりが%3$s場合はバリデーションエラーになる", (estimate, message) => {
    // Given: 見積もりに不正値を入力している
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      addTask(window, "検証タスク", estimate);

      // When: タスク追加を試みる
      const items = document.querySelectorAll("[data-task-id]");

      // Then: 指定メッセージが表示されタスクは追加されない
      expect(items).toHaveLength(0);
      expect(getFormHint(document).textContent).toBe(message);
    } finally {
      cleanup();
    }
  });

  test("タスク選択後にタイマーを完走すると実績とトーストが更新される", () => {
    // Given: タスクを追加して選択し、タイマーを開始する準備ができている
    jest.useFakeTimers();
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      addTask(window, "集中作業", "2");
      selectTask(window, 0);

      // When: タイマーを開始し25分経過まで進める
      clickTimerButton(window, "timer-start");
      expect(document.querySelector("[data-text='timerState']").textContent).toBe("実行中");
      jest.advanceTimersByTime(25 * 60 * 1000 + 1000);

      // Then: 実績ポモドーロが増えトーストが成功メッセージになる
      const badge = document.querySelector("[data-task-id] .task-meta span").textContent;
      expect(badge).toBe("🍅 1/2");
      expect(getToast(document).textContent).toBe("集中作業 が完了しました");
      expect(document.querySelector("[data-text='timerModeLabel']").textContent).toBe("短い休憩");
    } finally {
      cleanup();
    }
  });

  test("タスク未選択でタイマー開始するとE003を表示する", () => {
    // Given: タスクを追加したが選択していない
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      addTask(window, "未選択タスク", "");

      // When: タイマー開始ボタンを押す
      clickTimerButton(window, "timer-start");

      // Then: E003トーストが表示されタイマーは停止のまま
      expect(getToast(document).textContent).toBe("タスクを選択してください");
      expect(document.querySelector("[data-text='timerState']").textContent).toBe("停止中");
    } finally {
      cleanup();
    }
  });

  test("実行中に別タスクを選択するとSELECT_LOCKエラーになる", () => {
    // Given: 2件のタスクがあり1件目でタイマーを実行中
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      addTask(window, "タスクA", "");
      addTask(window, "タスクB", "");
      selectTask(window, "タスクA");
      clickTimerButton(window, "timer-start");

      // When: 2件目のタスクを選択しようとする
      selectTask(window, "タスクB");

      // Then: SELECT_LOCKトーストが表示され選択中ラベルは変更されない
      expect(getToast(document).textContent).toBe("タイマーを停止してから選択してください");
      expect(document.querySelector("[data-text='selectedTaskLabel']").textContent).toContain("タスクA");
    } finally {
      cleanup();
    }
  });

  test("実行中タスクの削除はE004エラーになる", () => {
    // Given: タスクAでタイマーを実行している
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      addTask(window, "削除テスト", "");
      selectTask(window, 0);
      clickTimerButton(window, "timer-start");
      const deleteButton = document.querySelector("[data-task-id] [data-action='delete']");

      // When: 削除ボタンを押す
      dispatchClick(deleteButton, window);

      // Then: E004トーストが表示されタスクは残る
      expect(getToast(document).textContent).toBe("タイマーを停止してから削除してください");
      expect(document.querySelectorAll("[data-task-id]")).toHaveLength(1);
    } finally {
      cleanup();
    }
  });

  test("リセット確認でOKするとタイマーが初期化される", () => {
    // Given: タスクを選択してタイマーが動作中か一時停止状態
    const env = bootstrapApp({
      confirmBehavior: () => true
    });
    const { window, document, cleanup } = env;
    try {
      addTask(window, "リセット対象", "");
      selectTask(window, 0);
      clickTimerButton(window, "timer-start");

      // When: リセットボタンを押して確認ダイアログでOKする
      clickTimerButton(window, "timer-reset");

      // Then: タイマーはidleに戻り選択タスクが解除される
      expect(document.querySelector("[data-text='timerModeLabel']").textContent).toBe("待機中");
      expect(document.querySelector("[data-text='selectedTaskLabel']").textContent).toBe("タスクを選択してください");
    } finally {
      cleanup();
    }
  });

  test("リセット確認でキャンセルすると状態は維持される", () => {
    // Given: タスクを選択してタイマーが動作中
    const env = bootstrapApp({
      confirmBehavior: () => false
    });
    const { window, document, cleanup } = env;
    try {
      addTask(window, "キャンセル対象", "");
      selectTask(window, 0);
      clickTimerButton(window, "timer-start");

      // When: リセットボタンを押してダイアログでキャンセルする
      clickTimerButton(window, "timer-reset");

      // Then: タイマー状態は実行中のまま維持される
      expect(document.querySelector("[data-text='timerState']").textContent).toBe("実行中");
      expect(document.querySelector("[data-text='selectedTaskLabel']").textContent).toContain("キャンセル対象");
    } finally {
      cleanup();
    }
  });

  test("設定の最小値補正が行われる", () => {
    // Given: 設定モーダルに最小値未満(0)を入力している
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      const openBtn = document.querySelector("[data-action='open-settings']");
      dispatchClick(openBtn, window);
      const form = document.querySelector("[data-settings-form]");
      form.workDuration.value = "0";
      form.longBreakInterval.value = "0";

      // When: 設定フォームを送信する
      submitForm(form, window);

      // Then: 保存された値は最小値である1に補正される
      const settings = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.SETTINGS));
      expect(settings.workDuration).toBe(1);
      expect(settings.longBreakInterval).toBe(1);
      expect(getToast(document).textContent).toBe("設定を保存しました");
    } finally {
      cleanup();
    }
  });

  test("設定の最大値超過は上限にクランプされる", () => {
    // Given: 設定フォームに上限超えの値を入力している
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    try {
      const openBtn = document.querySelector("[data-action='open-settings']");
      dispatchClick(openBtn, window);
      const form = document.querySelector("[data-settings-form]");
      form.workDuration.value = "61";
      form.longBreakInterval.value = "11";

      // When: 設定フォームを送信する
      submitForm(form, window);

      // Then: 保存された値はそれぞれ上限値にクランプされる
      const settings = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.SETTINGS));
      expect(settings.workDuration).toBe(60);
      expect(settings.longBreakInterval).toBe(10);
    } finally {
      cleanup();
    }
  });

  test("localStorageのQuotaExceededErrorはE005を表示する", () => {
    // Given: localStorage.setItemがQuotaExceededErrorをスローする
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    const storageProto = Object.getPrototypeOf(window.localStorage);
    const originalSetItem = storageProto.setItem;
    jest.spyOn(storageProto, "setItem").mockImplementation(function mockSetItem(key, value) {
      if (key === STORAGE_KEYS.TASKS || key === STORAGE_KEYS.TASKS_BACKUP) {
        const err = new Error("quota");
        err.name = "QuotaExceededError";
        throw err;
      }
      return originalSetItem.call(this, key, value);
    });
    try {
      addTask(window, "ストレージ上限", "");

      // When: タスク保存が実行される
      // Then: E005トーストが表示される
      expect(getToast(document).textContent).toBe("保存容量が不足しています");
    } finally {
      storageProto.setItem.mockRestore();
      cleanup();
    }
  });

  test("localStorageの一般エラーはE006を表示する", () => {
    // Given: localStorage.setItemが汎用エラーをスローする
    const env = bootstrapApp();
    const { window, document, cleanup } = env;
    const storageProto = Object.getPrototypeOf(window.localStorage);
    const originalSetItem = storageProto.setItem;
    jest.spyOn(storageProto, "setItem").mockImplementation(function mockSetItem(key, value) {
      if (key === STORAGE_KEYS.TASKS || key === STORAGE_KEYS.TASKS_BACKUP) {
        throw new Error("generic failure");
      }
      return originalSetItem.call(this, key, value);
    });
    try {
      addTask(window, "一般エラー", "");

      // When: タスク保存が実行される
      // Then: E006トーストが表示される
      expect(getToast(document).textContent).toBe("データの保存ができません");
    } finally {
      storageProto.setItem.mockRestore();
      cleanup();
    }
  });

  test("壊れたJSONを読み込むとE006が表示されconfirmが呼ばれる", () => {
    // Given: localStorageに壊れたJSONが保存されている
    const env = bootstrapApp({
      prefilledStorage: {
        [STORAGE_KEYS.TASKS]: "{"
      },
      confirmBehavior: () => false
    });
    const { document, cleanup, confirmMock } = env;
    try {
      // When: アプリ初期化が走る

      // Then: E006トーストが表示されダイアログが呼ばれる
      expect(getToast(document).textContent).toBe("データの保存ができません");
      expect(confirmMock).toHaveBeenCalledWith("保存データが破損しています。初期化しますか？");
    } finally {
      cleanup();
    }
  });

  test("NULLを含む保存済みタスクは正規化される", () => {
    // Given: localStorageにnull値を含むタスクが保存されている
    const env = bootstrapApp({
      prefilledStorage: {
        [STORAGE_KEYS.TASKS]: JSON.stringify([
          {
            id: "task_null",
            title: null,
            estimatedPomodoros: null,
            actualPomodoros: null,
            completed: null
          }
        ])
      }
    });
    const { document, cleanup } = env;
    try {
      // When: 初期化後にタスクリストを参照する
      const taskTitle = document.querySelector("[data-task-id] .task-title").textContent;
      const badge = document.querySelector("[data-task-id] .task-meta span").textContent;

      // Then: タイトルは無題、推定はハイフンで表示される
      expect(taskTitle).toBe("無題");
      expect(badge).toBe("🍅 0/-");
    } finally {
      cleanup();
    }
  });
});
