/**
 * Prettier configuration — canonical source of truth.
 * Rationale: Replaces conflicting .prettierrc (JSON) to eliminate dual-config
 * resolution ambiguity. singleQuote: true preserved to match existing src/
 * codebase (Next.js app, packages/core). bracketSpacing and arrowParens
 * added for explicit style governance. endOfLine: 'lf' enforces cross-platform
 * consistency in CI. .prettierrc must be deleted after this file is merged.
 *
 * @type {import("prettier").Config}
 */
const config = {
  semi: true,
  singleQuote: true, // Matches existing src/ — DO NOT change without full-repo reformat PR
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.yaml', '*.yml'],
      options: {
        singleQuote: false, // YAML convention: double quotes
        printWidth: 120,
      },
    },
    {
      files: ['*.json'],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ['*.md'],
      options: {
        proseWrap: 'preserve',
        printWidth: 120,
      },
    },
  ],
};

export default config;
