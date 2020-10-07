module.exports = {
    roots: ['<rootDir>/test'],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)',
    ],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    verbose: true,
    collectCoverage: true,
    testPathIgnorePatterns: ['/node_modules/'],
    coverageDirectory: './test/report',
    coveragePathIgnorePatterns: [],
    testEnvironment: 'node',
    globals: { NODE_ENV: 'test'}
};
