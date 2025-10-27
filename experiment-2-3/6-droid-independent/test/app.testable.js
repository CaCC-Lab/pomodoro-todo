const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { Blob } = require("buffer");

const APP_PATH = path.resolve(__dirname, "..", "output", "app.js");
const SOURCE = fs.readFileSync(APP_PATH, "utf8");

function injectTestApi(source) {
  const terminatorIndex = source.lastIndexOf("})();");
  if (terminatorIndex === -1) throw new Error("Unable to locate IIFE terminator in app.js");
  const exposure = `\n  window.__APP_TEST_API__ = {\n    CONFIG,\n    ERRORS,\n    DEFAULT_SETTINGS,\n    state,\n    dom,\n    bus,\n    validateTask,\n    createTask,\n    normalizeTask,\n    normalizeSettings,\n    createTimerState,\n    normalizeTimer,\n    createToday,\n    normalizeToday,\n    normalizeHistoryEntry,\n    mergeImportedData,\n    storageAvailable,\n    save,\n    load,\n    ensureToday,\n    clamp,\n    modeLabel,\n    modeColor,\n    formatTime,\n    addTask,\n    selectTask,\n    startTimer,\n    pauseTimer,\n    resetTimer,\n    skipTimer,\n    bulkDeleteCompleted,\n    toggleFocusMode,\n    toggleComplete,\n    applyPomodoroResults,\n    showNotification,\n    confirmAction,\n    handleTaskSearch\n  };\n`;
  return source.slice(0, terminatorIndex) + exposure + source.slice(terminatorIndex);
}

function createContext() {
  const storage = new Map();
  const listeners = {};
  const context = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Promise,
    Date,
    Math,
    JSON,
    Array,
    Number,
    String,
    Boolean,
    RegExp,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Symbol
  };
  context.window = context;
  context.window.Blob = Blob;
  context.window.requestAnimationFrame = (cb) => cb();
  context.window.cancelAnimationFrame = () => {};
  context.window.URL = {
    createObjectURL: () => "blob:mock",
    revokeObjectURL: () => {}
  };
  context.window.Notification = function Notification() {};
  context.window.Notification.permission = "granted";
  context.window.Notification.requestPermission = () => Promise.resolve("granted");
  context.window.Audio = function AudioMock() {
    return { play: () => Promise.resolve() };
  };
  context.window.AudioContext = function AudioContextMock() {
    return {
      currentTime: 0,
      destination: {},
      state: "running",
      resume: () => Promise.resolve(),
      createOscillator: () => ({
        frequency: { setValueAtTime() {} },
        connect() {},
        start() {},
        stop() {},
        disconnect() {}
      }),
      createGain: () => ({
        gain: {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {}
        },
        connect() {},
        disconnect() {}
      })
    };
  };
  context.document = {
    addEventListener: (event, handler) => {
      listeners[event] = handler;
    },
    getElementById: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
      className: "",
      style: {},
      setAttribute() {},
      append() {},
      appendChild() {},
      addEventListener() {},
      classList: { add() {}, remove() {}, toggle() {} }
    }),
    createDocumentFragment: () => ({ appendChild() {} }),
    body: { classList: { add() {}, remove() {}, toggle() {} } }
  };
  context.localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => {
      storage.set(key, String(value));
    },
    removeItem: (key) => storage.delete(key)
  };
  context.window.__testListeners = listeners;
  return vm.createContext(context);
}

const INSTRUMENTED_SOURCE = injectTestApi(SOURCE);

function createTestApi() {
  const context = createContext();
  const script = new vm.Script(INSTRUMENTED_SOURCE, { filename: APP_PATH });
  script.runInContext(context);
  return { ...context.window.__APP_TEST_API__, __context: context };
}

module.exports = { createTestApi };
