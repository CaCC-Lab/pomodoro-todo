module.exports = {
  testEnvironment: 'jsdom',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'output/app.js'
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  testMatch: [
    '**/test/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.js'
  ],
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/'
  ],
  verbose: true
};
