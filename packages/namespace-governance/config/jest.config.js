/**
 * Jest configuration. Coverage thresholds enforce the charter's quality gate
 * (line >=90%, branch >=80%). ESM is handled via Node's native vm-modules; no
 * Babel transform keeps the toolchain minimal and fast (make test-fast).
 *
 * rootDir is the package root because this file is re-exported by the root
 * jest.config.js shim, whose location Jest treats as the config directory.
 *
 * Rationale: failing the build below threshold makes coverage a hard gate, not
 * a suggestion.
 */
export default {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageDirectory: 'config/coverage',
  coverageThreshold: {
    global: { lines: 90, branches: 80, functions: 90, statements: 90 },
  },
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  transform: {},
  verbose: false,
};
