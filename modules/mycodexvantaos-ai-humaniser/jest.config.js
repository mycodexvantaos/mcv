module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/src/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/core/**/*.ts', 'src/providers/**/*.ts', 'src/utils/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
