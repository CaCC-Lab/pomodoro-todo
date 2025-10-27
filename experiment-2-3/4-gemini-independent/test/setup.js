
// test/setup.js

// localStorageのモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// alertのモック
window.alert = jest.fn();

// Notification APIのモック
Object.defineProperty(window, 'Notification', {
  value: jest.fn().mockImplementation(() => ({
    requestPermission: jest.fn(),
  })),
  writable: true,
});

// Audio APIのモック
Object.defineProperty(window, 'Audio', {
    value: jest.fn().mockImplementation(() => ({
        play: jest.fn().mockResolvedValue(undefined), // play()はPromiseを返す
        pause: jest.fn(),
    })),
    writable: true,
});
