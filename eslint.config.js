/**
 * ESLint flat config — MyCodexVantaOS monorepo
 *
 * Compatible with ESLint v8.x (flat config mode).
 * Rule severities aligned with original .eslintrc.json to avoid
 * introducing new failures.  Incremental tightening tracked in tech debt.
 */

import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      'outputs/**',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      // Domain SSOT — this file IS the canonical source; hardcoding is intentional
      'packages/core/src/config/domains.ts',
      // Python / YAML / JSON — not processed by ESLint
      '**/*.py',
      '**/*.yaml',
      '**/*.yml',
      '**/*.json',
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

  // Base JS rules (relaxed for monorepo compatibility)
  {
    rules: {
      'no-var': 'warn',
      'no-undef': 'off',
      'no-empty': 'warn',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-func-assign': 'error',
      'no-irregular-whitespace': 'error',
      'no-sparse-arrays': 'warn',
      'no-unreachable': 'error',
      'no-unsafe-negation': 'error',
      'valid-typeof': 'error',
      curly: ['warn', 'multi-line'],
      'no-cond-assign': ['error', 'except-parens'],
      'no-constant-condition': 'warn',
      'no-debugger': 'error',
      'no-extra-boolean-cast': 'warn',
      'no-extra-semi': 'error',
      'no-inner-declarations': 'error',
      'no-prototype-builtins': 'warn',
      'no-shadow-restricted-names': 'error',
      'no-useless-catch': 'warn',
      'no-with': 'error',
      'prefer-const': 'warn',
    },
  },

  // TypeScript rules (aligned with original .eslintrc.json severities)
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
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
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      // Aligned with original .eslintrc.json
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-console': 'off',

      // New rules for PR #200
      '@typescript-eslint/consistent-type-imports': 'warn',

      // Domain hardcoding guard — WARN during migration
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/mycodexvantaos\\.com/]',
          message:
            'Do not hardcode production domain strings. Use getDomainConfig() from @mycodexvantaos/core instead.',
        },
      ],

      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Style
      eqeqeq: ['warn', 'always'],
    },
  },

  // Service entry files — allow domain literals (issuer/audience are structural)
  {
    files: ['services/**/src/index.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  // Test files — relaxed rules
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];

export default config;
