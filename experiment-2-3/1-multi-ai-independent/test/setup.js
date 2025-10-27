/**
 * Jest Setup File
 * - DOM mocking
 * - localStorage mocking
 * - Global test utilities
 */

// Mock localStorage with full API
const createLocalStorageMock = () => {
  let store = {};

  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      // Simulate QuotaExceededError for large data
      const totalSize = Object.values(store).join('').length + value.length;
      if (totalSize > 5242880) { // 5MB limit
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    // Test utility: force error
    _forceError: (errorType = 'QuotaExceededError') => {
      const originalSetItem = store.setItem;
      store.setItem = jest.fn(() => {
        const error = new Error(errorType);
        error.name = errorType;
        throw error;
      });
    },
    // Test utility: get raw store
    _getStore: () => ({ ...store }),
    // Test utility: set store
    _setStore: (newStore) => {
      store = { ...newStore };
    }
  };
};

global.localStorage = createLocalStorageMock();

// Mock Notification API
global.Notification = class {
  constructor(title, options) {
    this.title = title;
    this.options = options;
  }

  static permission = 'default';
  static requestPermission = jest.fn(() => Promise.resolve('granted'));
};

// Mock AudioContext with proper chainable methods
global.AudioContext = jest.fn().mockImplementation(() => {
  const mockOscillator = {
    type: 'sine',
    frequency: {
      setValueAtTime: jest.fn()
    },
    connect: jest.fn().mockReturnThis(),
    start: jest.fn(),
    stop: jest.fn()
  };

  const mockGain = {
    gain: {
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn()
    },
    connect: jest.fn(() => ({
      connect: jest.fn()
    }))
  };

  mockOscillator.connect = jest.fn(() => mockGain);

  return {
    currentTime: 0,
    createOscillator: jest.fn(() => mockOscillator),
    createGain: jest.fn(() => mockGain),
    destination: {}
  };
});

global.webkitAudioContext = global.AudioContext;

// Mock window.confirm, prompt, and alert
global.confirm = jest.fn(() => true);
global.prompt = jest.fn(() => null);
global.alert = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};

// Global beforeEach for all tests
global.beforeEach(() => {
  // Reset localStorage
  if (localStorage.clear) {
    localStorage.clear();
  }

  // Reset all mocks
  jest.clearAllMocks();

  // Reset global mocks
  global.alert = jest.fn();
  global.confirm = jest.fn(() => true);
  global.prompt = jest.fn(() => null);

  // Reset Notification permission
  global.Notification.permission = 'default';
  global.Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

  // Reset console mocks
  console.warn = jest.fn();
  console.error = jest.fn();
});
