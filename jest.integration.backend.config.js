module.exports = {
  // display name
  displayName: "backend integration tests",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/**/*.integration.test.js"],

  // ignore frontend tests
  testPathIgnorePatterns: ["<rootDir>/client/.*\\.integration\\.test\\.js$"],
};
