module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    verbose: false,
    testMatch: [
      '<rootDir>/test/**/?(*.)+(spec|test).ts?(x)',
      '<rootDir>/lib/**/?(*.)+(spec|test).ts?(x)'
    ],
    transform: {
      "^.+\\.tsx?$": "ts-jest"
    },
    collectCoverage: false,
    coverageDirectory: '<rootDir>/coverage',
    collectCoverageFrom: [
      "**/lib/**.{ts,jsx}",
      "!**/node_modules/**",
      "!**/coverage/**",
      "!**/test/**"
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
  