module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    verbose: false,
    testMatch: [
      '<rootDir>/lib/**/?(*.)+(spec|test).ts?(x)'
    ],
    transform: {
      "^.+\\.tsx?$": "ts-jest"
    },
    collectCoverage: false,
    coverageDirectory: '<rootDir>/coverage',
    collectCoverageFrom: [
      "**/lib/**.{ts,jsx}",
      "!**/lib?(*.)+(spec|test).ts?(x)",
      "!**/node_modules/**",
      "!**/coverage/**"
    ],
    moduleFileExtensions: [
      "js",
      "jsx",
      "ts",
      "tsx",
      "json"
    ]
  }
  