export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/tests/unit/**/*.test.ts',
        '**/tests/integration/**/*.test.ts',
    ],
    moduleFileExtensions: ['ts', 'js']
};
