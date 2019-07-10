module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    verbose: false,
    testMatch: [
      '<rootDir>/test/**/?(*.)+(spec|test).ts?(x)',
      '<rootDir>/src/**/?(*.)+(spec|test).ts?(x)'
    ],
    transform: {
      "^.+\\.tsx?$": "ts-jest"
    },
    collectCoverage: false,
    coverageDirectory: '<rootDir>/coverage',
    collectCoverageFrom: [
      "**/src/search/**.{ts,jsx}",
      "**/src/common/request/**.{ts,jsx}",
      "!**/src/search/models/**",
      "!**/node_modules/**",
      "!**/pipeline/**",
      "!**/coverage/**",
      "!**/test/**",
      "!**/src/config/**"
    ],
    moduleFileExtensions: [
      "ts",
      "tsx",
      "js",
      "jsx",
      "json",
      "node"
    ]
  }
  