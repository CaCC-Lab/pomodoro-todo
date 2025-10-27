module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  collectCoverageFrom: [
    '../output/app.js'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/*.test.js'
  ],
  // Mock timer APIs
  timers: 'modern',
  // Increase timeout for async tests
  testTimeout: 10000
};
