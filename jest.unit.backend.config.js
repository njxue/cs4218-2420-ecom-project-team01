module.exports = {
  // display name
  displayName: "backend unit tests",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/**/*.test.js"],

  // ignore client files and integration tests
  testPathIgnorePatterns: [
    "/.*\\.integration\\.test\\.js$",
    "<rootDir>/client/",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "helpers/**",
    "middlewares/**",
    "models/**",
  ],
  coveragePathIgnorePatterns: ["/.*\\.test\\.js$"],
  coverageDirectory: "coverage/backend",
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 50,
    },
  },
};
