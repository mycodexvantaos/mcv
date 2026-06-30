module.exports = {
  maxWorkers: 2,
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/packages", "<rootDir>/modules", "<rootDir>/services"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        compilerOptions: {
          module: "commonjs",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  collectCoverageFrom: [
    "packages/*/src/**/*.ts",
    "modules/*/src/**/*.ts",
    "services/*/src/**/*.ts",
    "!packages/*/src/**/*.d.ts",
    "!modules/*/src/**/*.d.ts",
    "!services/*/src/**/*.d.ts",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/__tests__/"],
  coverageReporters: ["text", "text-summary", "json", "lcov"],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  moduleNameMapper: {
    "^@mycodexvantaos/(.*)$": "<rootDir>/packages/$1/src",
  },
  testTimeout: 15000,
  verbose: false,
};
