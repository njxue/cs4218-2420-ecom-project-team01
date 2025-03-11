module.exports = {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/helpers/*.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "helpers/**",
  ],
  coverageDirectory: "coverage/backend",
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 50,
    },
  },
};
