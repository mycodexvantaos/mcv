/**
 * ESLint flat config — MyCodexVantaOS monorepo
 *
 * Rationale:
 * - Keeps production-domain hardcoding guard active without blocking the domain SSOT.
 * - Prevents false-positive cascade caused by legitimate canonical domain registry.
 * - Applies strict TypeScript safety while allowing generated/config/governance artifacts
 *   to be handled by JSON/YAML/Python dedicated validators.
 * - Uses js.configs.recommended as the JavaScript base, then overlays
 *   TypeScript-specific rules from @typescript-eslint plugin.
 *
 * Document ID: IM-ESLINT-001
 */

import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      'outputs/**',
      'reports/**',
      '.turbo/**',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
      '*.config.ts',
      '**/*.json',
      '**/*.yaml',
      '**/*.yml',
      '**/*.md',
      '**/*.py',

      // Domain SSOT — this file intentionally owns canonical production domains.
      'packages/core/src/config/domains.ts',

      // Generated governance/catalog surfaces are validated by schema-specific CI.
      'governance/**',
      'unified-gates/**',
      'policies/**',
      'provider-registry/**',
      'service-catalog/**',
      'capability-set/**',

      // Project import / generated / vendored code
      'project-import/**',

      // Cloudflare Worker bundles (generated, not source)
      'web-deploy/**',

      // Legacy JS service files (pre-existing, tracked in tech debt)
      'packages/providers/src/*.js',
      'services/mycodexvantaos-platform-validation/src/*.js',
      'services/mycodexvantaos-ai-ensemble/src/*.js',
      'ci/validate-architecture.js',

      // Legacy jest configs
      '**/jest.config.js',
      '**/jest.preset.js',

      // Modules (pre-existing, not yet migrated)
      'modules/**',

      // Engineering templates (generated, use require())
      'engineering-templates/**',

      // Kubernetes init (generated)
      'infra/kubernetes/base/init.ts',

      // Scripts (standalone, use require())
      'scripts/**',

      // Legacy tailwind configs (CommonJS require)
      '**/tailwind.config.ts',

      // Legacy app-dev-studio (pre-existing React code)
      'services/mycodexvantaos-app-dev-studio/**',

      // Legacy studio platform (pre-existing React code, missing react-hooks plugin)
      'services/mycodexvantaos-studio-platform/**',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.base.json'],
      },
      globals: {
        // Node.js globals
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // Web API globals (Cloudflare Workers, etc.)
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        crypto: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        // Test globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        vi: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      // Strict TypeScript safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],

      // Migration bridge warnings (pre-existing code, not yet fully migrated)
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',

      // Strict equality and control flow
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Console discipline
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Domain hardcoding guard — warns when mycodexvantaos.com is hardcoded
      // outside the designated domain SSOT file.
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/mycodexvantaos\\.com/]',
          message:
            'Do not hardcode production domain strings. Use getDomainConfig() from @mycodexvantaos/core instead.',
        },
      ],
    },
  },

  // Service entry files — allow domain literals (issuer/audience are structural)
  {
    files: ['services/**/src/index.ts', 'apps/**/index.ts'],
    rules: {
      // Migration bridge: service entrypoints may contain issuer/audience/callback
      // strings until all services consume DomainConfig through dependency injection.
      'no-restricted-syntax': 'off',
    },
  },

  // Test files — relaxed rules
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'no-restricted-syntax': 'off',
      'no-console': 'off',
    },
  },
];

export default config;
