module.exports = {
  rootDir: __dirname,
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.js"],
  collectCoverageFrom: ["<rootDir>/output/**/*.js"],
  coverageDirectory: "<rootDir>/coverage",
  reporters: ["default"]
};
