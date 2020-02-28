module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    verbose: false,
    testMatch: [
        '<rootDir>/lib/**/?(*.)+(spec|test).ts?(x)',
        '<rootDir>/test/**/?(*.)+(spec|test).ts?(x)'

    ],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage',
    collectCoverageFrom: [
        '**/lib/**/*.{ts,jsx}',
        '!**/lib?(*.)+(spec|test).ts?(x)',
        '!**/node_modules/**',
        '!**/coverage/**'
    ],
    moduleFileExtensions: [
        'js',
        'jsx',
        'ts',
        'tsx',
        'json'
    ]
};
