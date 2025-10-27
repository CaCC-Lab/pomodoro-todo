const path = require("path");
const fs = require("fs");
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
const { JSDOM } = require("jsdom");
const { Blob } = require("buffer");

const OUTPUT_DIR = path.resolve(__dirname, "..", "output");
const APP_PATH = path.resolve(OUTPUT_DIR, "app.js");
const INDEX_PATH = path.resolve(OUTPUT_DIR, "index.html");

const BASE_TIME = new Date("2024-01-01T00:00:00.000Z");

const flushMicrotasks = () => new Promise((resolve) => process.nextTick(resolve));

function bootstrap(options = {}) {
  jest.resetModules();
  jest.useFakeTimers();
  jest.setSystemTime(BASE_TIME);

  const html = fs.readFileSync(INDEX_PATH, "utf-8");
  const template = new JSDOM(html);
  document.documentElement.innerHTML = template.window.document.documentElement.innerHTML;

  global.Blob = global.Blob || Blob;
  localStorage.clear();
  if (options.tasks) localStorage.setItem("pomotodo_tasks", JSON.stringify(options.tasks));
  if (options.timer) localStorage.setItem("pomotodo_timer", JSON.stringify(options.timer));
  if (options.settings) localStorage.setItem("pomotodo_settings", JSON.stringify(options.settings));
  if (options.today) localStorage.setItem("pomotodo_today", JSON.stringify(options.today));
  if (options.history) localStorage.setItem("pomotodo_history", JSON.stringify(options.history));
  if (options.selection !== undefined) localStorage.setItem("pomotodo_selection", JSON.stringify(options.selection));

  window.Notification = function () {};
  window.Notification.permission = options.notificationPermission ?? "granted";
  window.Notification.requestPermission = jest.fn().mockResolvedValue("granted");
  window.confirm = jest.fn(() => true);
  window.requestAnimationFrame = (cb) => cb();

  if (!window.HTMLDialogElement) {
    class HTMLDialogElement extends window.HTMLElement {
      constructor() {
        super();
        this.open = false;
        this.returnValue = "";
      }
    }
    window.HTMLDialogElement = HTMLDialogElement;
    global.HTMLDialogElement = HTMLDialogElement;
  }
  window.HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  window.HTMLDialogElement.prototype.close = function close(value = "cancel") {
    this.open = false;
    this.returnValue = value;
    this.dispatchEvent(new window.Event("close"));
  };

  window.URL.createObjectURL = jest.fn(() => "blob:mock");
  window.URL.revokeObjectURL = jest.fn();

  window.Audio = function AudioMock() {
    return { play: jest.fn().mockResolvedValue(undefined), currentTime: 0 };
  };
  window.AudioContext = jest.fn(() => ({
    currentTime: 0,
    destination: {},
    state: "running",
    resume: jest.fn().mockResolvedValue(undefined),
    createOscillator: () => ({
      type: "",
      frequency: { setValueAtTime: jest.fn() },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn()
    }),
    createGain: () => ({
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn(),
      disconnect: jest.fn()
    })
  }));
  window.webkitAudioContext = undefined;

  jest.isolateModules(() => {
    require(APP_PATH);
  });
  document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));

  return {
    notification: document.getElementById("notification"),
    confirmDialog: document.getElementById("confirm-dialog"),
    settingsDialog: document.getElementById("settings-dialog")
  };
}

describe("PomoTodo エンドツーエンドフロー", () => {
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    localStorage.clear();
  });

  test("正常: タスク追加が一覧と通知を更新する", () => {
    const { notification } = bootstrap();
    const titleInput = document.getElementById("task-title");
    const estimateInput = document.getElementById("task-estimate");
    const form = document.getElementById("task-form");

    // Given: 有効なタスク名と見積もりを入力する
    titleInput.value = "Write integration tests";
    estimateInput.value = "3";

    // When: タスク追加フォームを送信する
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    // Then: タスクが1件追加され成功通知が表示される
    const items = document.querySelectorAll("#task-list .task-item");
    expect(items).toHaveLength(1);
    expect(items[0].querySelector(".task-title-text").textContent).toBe("Write integration tests");
    expect(notification.textContent).toBe("タスクを追加しました");
    expect(JSON.parse(localStorage.getItem("pomotodo_tasks"))).toHaveLength(1);
  });

  test("異常: 空タイトルのタスクはE001を表示する", () => {
    bootstrap();
    const titleInput = document.getElementById("task-title");
    const estimateInput = document.getElementById("task-estimate");
    const form = document.getElementById("task-form");

    // Given: タイトルを空白に設定する
    titleInput.value = "   ";
    estimateInput.value = "2";

    // When: タスク追加フォームを送信する
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    // Then: フォームエラーにE001が表示されタスクは追加されない
    const error = document.getElementById("task-form-error");
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("E001: タスク名を入力してください");
    expect(document.querySelectorAll("#task-list .task-item")).toHaveLength(0);
  });

  test("境界: 101文字のタイトルはE002で拒否される", () => {
    bootstrap();
    const titleInput = document.getElementById("task-title");
    const estimateInput = document.getElementById("task-estimate");
    const form = document.getElementById("task-form");

    // Given: 101文字のタイトルを入力する
    titleInput.value = "a".repeat(101);
    estimateInput.value = "2";

    // When: タスク追加フォームを送信する
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    // Then: 長さエラーE002が表示されタスクは追加されない
    const error = document.getElementById("task-form-error");
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("E002: タスク名は100文字以内で入力してください");
    expect(document.querySelectorAll("#task-list .task-item")).toHaveLength(0);
  });

  test("境界: 100文字のタイトルは正常に追加できる", () => {
    const { notification } = bootstrap();
    const titleInput = document.getElementById("task-title");
    const estimateInput = document.getElementById("task-estimate");
    const form = document.getElementById("task-form");

    // Given: 100文字のタイトルと最小見積もりを入力する
    titleInput.value = "b".repeat(100);
    estimateInput.value = "1";

    // When: タスク追加フォームを送信する
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    // Then: タスクが追加され成功通知が表示される
    const items = document.querySelectorAll("#task-list .task-item");
    expect(items).toHaveLength(1);
    expect(items[0].querySelector(".task-title-text").textContent).toBe("b".repeat(100));
    expect(notification.textContent).toBe("タスクを追加しました");
  });

  test.each([
    ["0", "E009: 見積もりは1〜20の範囲で入力してください"],
    ["21", "E009: 見積もりは1〜20の範囲で入力してください"],
    ["abc", "E009: 見積もりは1〜20の範囲で入力してください"],
    ["", "E009: 見積もりは1〜20の範囲で入力してください"]
  ])("異常: 見積もり入力%pはエラーになる", (estimateValue, message) => {
    bootstrap();
    const titleInput = document.getElementById("task-title");
    const estimateInput = document.getElementById("task-estimate");
    const form = document.getElementById("task-form");

    // Given: 不正な見積もり値を設定する
    titleInput.value = "Invalid estimate";
    estimateInput.value = estimateValue;

    // When: タスク追加フォームを送信する
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    // Then: 見積もりエラーが表示されタスクは追加されない
    const error = document.getElementById("task-form-error");
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe(message);
    expect(document.querySelectorAll("#task-list .task-item")).toHaveLength(0);
  });

  test("異常: タスク未選択でタイマー開始するとE003", () => {
    const { notification } = bootstrap();
    const form = document.getElementById("task-form");
    const titleInput = document.getElementById("task-title");
    const estimateInput = document.getElementById("task-estimate");
    titleInput.value = "Timer task";
    estimateInput.value = "1";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    // Given: タスクは存在するが選択されていない

    // When: 開始ボタンをクリックする
    document.getElementById("start-btn").click();

    // Then: 選択エラーE003が通知されタイマーは開始されない
    expect(notification.textContent).toBe("E003: タスクを選択してください");
    expect(document.getElementById("timer-mode").parentElement.classList.contains("running")).toBe(false);
  });

  test("異常: 編集モード中のタイマー開始はE008", async () => {
    const { notification } = bootstrap();
    const form = document.getElementById("task-form");
    const titleInput = document.getElementById("task-title");
    const estimateInput = document.getElementById("task-estimate");
    titleInput.value = "Edit mode task";
    estimateInput.value = "2";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushMicrotasks();
    document.querySelector("#task-list .task-item .task-title-text").dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // Given: タスク編集モードに入っている
    document.querySelector("#task-list .task-item .edit-btn").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushMicrotasks();
    expect(document.querySelector(".task-edit-form")).not.toBeNull();

    // When: タイマー開始ボタンをクリックする
    document.getElementById("start-btn").click();
    await flushMicrotasks();

    // Then: 編集完了エラーE008が表示されタイマーは開始されない
    expect(notification.textContent).toBe("E008: 編集を完了してください");
    expect(document.getElementById("timer-mode").parentElement.classList.contains("running")).toBe(false);
  });

  test("正常: タスク選択後にタイマーが開始される", async () => {
    const { notification } = bootstrap();
    const form = document.getElementById("task-form");
    const titleInput = document.getElementById("task-title");
    const estimateInput = document.getElementById("task-estimate");
    titleInput.value = "Startable task";
    estimateInput.value = "1";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushMicrotasks();

    // Given: タスクを選択状態にする
    document.querySelector("#task-list .task-item").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushMicrotasks();
    const selectedItem = document.querySelector("#task-list .task-item");
    expect(selectedItem.classList.contains("selected")).toBe(true);

    // When: 開始ボタンをクリックする
    document.getElementById("start-btn").click();
    await flushMicrotasks();

    // Then: タイマーが走り通知にエラーが出ない
    expect(notification.textContent).not.toMatch(/^E\d{3}/);
    expect(document.getElementById("timer-mode").parentElement.classList.contains("running")).toBe(true);
    expect(document.getElementById("current-task").textContent).toContain("Startable task");
  });

  test("正常: 作業スキップで休憩モードへ切り替わる", async () => {
    const { notification } = bootstrap();
    const form = document.getElementById("task-form");
    const titleInput = document.getElementById("task-title");
    const estimateInput = document.getElementById("task-estimate");
    titleInput.value = "Skippable task";
    estimateInput.value = "1";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushMicrotasks();
    const taskItem = document.querySelector("#task-list .task-item");
    taskItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushMicrotasks();
    document.getElementById("start-btn").click();
    await flushMicrotasks();

    // Given: 作業タイマーが稼働中

    // When: スキップボタンを押す
    document.getElementById("skip-btn").click();
    await flushMicrotasks();

    // Then: 休憩モードへ遷移し情報通知が表示される
    expect(document.getElementById("timer-mode").textContent).toBe("休憩中");
    expect(notification.textContent).toBe("作業をスキップしました。休憩に切り替えます");
  });

  test("正常: リセットは確認後に残り時間を初期化する", async () => {
    const { confirmDialog } = bootstrap();
    const form = document.getElementById("task-form");
    document.getElementById("task-title").value = "Reset task";
    document.getElementById("task-estimate").value = "1";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushMicrotasks();
    const taskItem = document.querySelector("#task-list .task-item");
    taskItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushMicrotasks();
    document.getElementById("start-btn").click();
    await flushMicrotasks();

    // Given: 経過時間を発生させる
    jest.advanceTimersByTime(30000);
    jest.setSystemTime(new Date(BASE_TIME.getTime() + 30000));

    // When: リセットボタンを押して確認ダイアログで確定する
    document.getElementById("reset-btn").click();
    confirmDialog.close("confirm");
    await flushMicrotasks();

    // Then: タイマー表示が初期値に戻り実行状態は解除される
    expect(document.getElementById("timer-display").textContent).toBe("25:00");
    expect(document.getElementById("timer-mode").parentElement.classList.contains("running")).toBe(false);
  });

  test("異常: 設定値が範囲外の場合はエラー通知される", () => {
    const { notification, settingsDialog } = bootstrap();

    // Given: 設定ダイアログを開いて不正値をセットする
    document.getElementById("open-settings-btn").click();
    document.getElementById("settings-work-duration").value = "0";

    // When: 設定フォームを送信する
    document.getElementById("settings-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    // Then: 範囲外エラー通知が表示されフォーカスが戻る
    expect(notification.textContent).toBe("作業時間は1〜60分で設定してください");
    expect(document.activeElement).toBe(document.getElementById("settings-work-duration"));
    expect(settingsDialog.open).toBe(true);
  });

  test("正常: 設定保存でタイマー値とフィルターが更新される", async () => {
    const { notification, settingsDialog } = bootstrap({ settings: { workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, longBreakInterval: 4, notificationSound: "beep", focusMode: false, filterState: "all" } });

    // Given: 設定ダイアログで境界内の値を入力する
    document.getElementById("open-settings-btn").click();
    document.getElementById("settings-work-duration").value = "10";
    document.getElementById("settings-short-break").value = "3";
    document.getElementById("settings-long-break").value = "5";
    document.getElementById("settings-long-interval").value = "2";
    document.getElementById("settings-sound").value = "chime";
    document.getElementById("settings-focus-mode").checked = true;
    document.getElementById("settings-filter-default").value = "completed";

    // When: 設定フォームを送信する
    document.getElementById("settings-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushMicrotasks();

    // Then: 設定が保存されタイマー表示とフィルター状態が更新される
    expect(notification.textContent).toBe("設定を保存しました");
    expect(settingsDialog.open).toBe(false);
    expect(document.getElementById("timer-display").textContent).toBe("10:00");
    expect(document.querySelector(".filter-btn.active").dataset.filter).toBe("completed");
    const savedSettings = JSON.parse(localStorage.getItem("pomotodo_settings"));
    expect(savedSettings.focusMode).toBe(true);
    expect(savedSettings.notificationSound).toBe("chime");
  });

  test("異常: 集中モード中の検索入力はE011で拒否される", async () => {
    const { notification } = bootstrap();
    const form = document.getElementById("task-form");
    document.getElementById("task-title").value = "Focus task";
    document.getElementById("task-estimate").value = "1";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushMicrotasks();
    document.querySelector("#task-list .task-item .task-title-text").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document.getElementById("start-btn").click();

    // Given: 集中モードを有効化する
    document.getElementById("toggle-focus-btn").click();

    // When: 検索フィールドに入力する
    const search = document.getElementById("task-search");
    search.value = "blocked";
    search.dispatchEvent(new Event("input", { bubbles: true }));

    // Then: 値は反映されずE011警告が通知される
    expect(search.value).toBe("");
    expect(notification.textContent).toBe("E011: 集中モード中は操作できません");
  });

  test("異常: 完了タスクがない状態で一括削除すると通知のみ", async () => {
    const { notification } = bootstrap();

    // Given: 完了済みタスクが存在しない

    // When: 一括削除ボタンを押す
    document.getElementById("bulk-delete-btn").click();
    await flushMicrotasks();

    // Then: 情報通知のみ表示されタスクは削除されない
    expect(notification.textContent).toBe("完了したタスクはありません");
  });

  test("正常: 完了タスクの一括削除が確認後に反映される", async () => {
    const { notification, confirmDialog } = bootstrap();
    const form = document.getElementById("task-form");
    document.getElementById("task-title").value = "Task A";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushMicrotasks();
    document.getElementById("task-title").value = "Task B";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushMicrotasks();

    // Given: 2件のタスクを完了状態にする
    document.querySelectorAll("#task-list .task-item .task-checkbox").forEach((checkbox) => {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await flushMicrotasks();

    // When: 一括削除ボタンを押して確認を確定する
    document.getElementById("bulk-delete-btn").click();
    confirmDialog.close("confirm");
    await flushMicrotasks();

    // Then: タスクが削除され通知が表示される
    expect(document.querySelectorAll("#task-list .task-item")).toHaveLength(0);
    expect(notification.textContent).toBe("完了したタスクを削除しました");
  });

  test("異常: localStorage容量不足はE005を通知する", async () => {
    const { notification } = bootstrap();
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const messageSpy = jest.spyOn(notification, "textContent", "set");
    try {
      localStorage.setItem = jest.fn((key, value) => {
        if (key === "pomotodo__test") {
          return originalSetItem(key, value);
        }
        const error = new Error("quota");
        error.name = "QuotaExceededError";
        throw error;
      });

      // Given: 正常なタスク入力を行う
      document.getElementById("task-title").value = "Storage task";
      document.getElementById("task-estimate").value = "1";

      // When: タスクを追加し保存処理を発火させる
      document.getElementById("task-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await flushMicrotasks();

      // Then: 容量不足エラーが記録されタスクは保存されない
      const messages = messageSpy.mock.calls.map(([value]) => value);
      expect(messages).toContain("E005: 保存容量が不足しています");
      expect(warnSpy).toHaveBeenCalledWith("storage save failed", expect.objectContaining({ name: "QuotaExceededError" }));
      expect(localStorage.getItem("pomotodo_tasks")).toBeNull();
    } finally {
      localStorage.setItem = originalSetItem;
      messageSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  test("正常: 作業完了でポモドーロ統計が加算される", async () => {
    const { notification } = bootstrap();
    const form = document.getElementById("task-form");
    document.getElementById("task-title").value = "Pomodoro task";
    document.getElementById("task-estimate").value = "1";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushMicrotasks();
    const taskItem = document.querySelector("#task-list .task-item");
    taskItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushMicrotasks();
    document.getElementById("start-btn").click();
    await flushMicrotasks();

    // Given: タイマーが作業モードで稼働している

    // When: 1分経過させてセッションを完了させる
    jest.advanceTimersByTime(60000);
    jest.setSystemTime(new Date(BASE_TIME.getTime() + 60000));
    jest.advanceTimersByTime(1000);
    await flushMicrotasks();
    jest.runOnlyPendingTimers();
    await flushMicrotasks();

    // Then: ポモドーロ統計が1増加し成功通知が表示される
    expect(document.getElementById("stat-today-pomodoros").textContent).toBe("🍅 1");
    expect(document.getElementById("stat-today-tasks").textContent).toBe("✓ 1/1");
    expect(notification.textContent).toBe("作業セッション完了！休憩に入りましょう");
  });
});
