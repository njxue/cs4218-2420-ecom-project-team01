module.exports = {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",
  
  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/middlewares/*.test.js",
    "<rootDir>/models/*.test.js",
  ],

  testPathIgnorePatterns: ["/.*\\.integration\\.test\\.js$"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "helpers/**",
    "middlewares/**",
    "models/**",
  ],
  coverageDirectory: "coverage/backend",
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 50,
    },
  },
};
