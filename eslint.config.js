/**
 * ESLint flat config — MyCodexVantaOS monorepo
 *
 * Compatible with ESLint v8.x (flat config mode).
 * Uses @eslint/js v9 (compatible with ESLint 8 flat config)
 * and @typescript-eslint/eslint-plugin + parser v8.
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
    ],
  },

  // Base JS recommended rules (manually spread for ESLint 8 compat)
  {
    rules: {
      'no-var': 'warn',
      'no-undef': 'error',
      'no-empty': 'error',
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

  // TypeScript rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',

      // Domain hardcoding guard — WARN during migration, ERROR post-migration
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
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
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
