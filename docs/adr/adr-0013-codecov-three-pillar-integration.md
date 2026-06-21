# ADR 0013: Codecov Three-Pillar Integration — Coverage Analytics, Bundle Analysis, and Test Analytics

**Date**: 2026-07-23
**Status**: Accepted
**Supersedes**: None
**Context**: Codecov integration for MyCodeXvantaOS across Coverage Analytics (Python), Bundle Analysis (Next.js/Vite), and Test Analytics (Python JUnit XML)

## Context

MyCodeXvantaOS operates a dual-plane architecture with a TypeScript Control Plane (Next.js 16 + Vite, pnpm monorepo) and a Python Intelligence Plane (FastAPI, uv workspace). The repository contains 106 workspace projects with CI workflows spanning both planes. Prior to this integration, coverage reporting relied on manual `actions/upload-artifact` with no centralized dashboard, no bundle size tracking for JavaScript builds, and no test result analytics.

Codecov provides three complementary capabilities that address these gaps: Coverage Analytics for code coverage visualization and trend tracking, Bundle Analysis for JavaScript bundle size monitoring and regression detection, and Test Analytics for test failure tracking and flaky test detection.

## Decision

Integrate Codecov's three pillars across the CI/CD pipeline:

### 1. Coverage Analytics (Python)

Add `codecov/codecov-action@v5` to all Python CI workflows with branch coverage enabled:

- **coder-deep-mcp.yml**: `--cov-branch --cov-report=xml:coverage-coder-deep.xml`, flags `coder-deep`
- **ci-repair-agent.yml**: `--cov-branch --cov-report=xml:coverage-ci-repair.xml`, flags `ci-repair`
- **python-ci.yml**: `--cov-branch --cov-report=xml`, flags `python`
- **release-candidate-check.yml**: `--cov-branch --cov-report=xml`, flags `python-rc`

The `CODECOV_TOKEN` secret authenticates uploads. Branch coverage (`--cov-branch`) provides line + branch granularity beyond line-only coverage.

### 2. Bundle Analysis (JavaScript/TypeScript)

Install `@codecov/webpack-plugin` and `@codecov/vite-plugin` as devDependencies and configure them in build configs:

- **next.config.ts** (3 apps): `codecovWebpackPlugin` with `enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined` and `bundleName` per service
- **vite.config.ts**: `codecovVitePlugin` with same conditional enablement
- **7 CI/CD workflows**: `CODECOV_TOKEN` env var added to build steps (unified-ci.yaml, ci.yml, ci.yaml, cd.yml, deploy-cloudflare-preview.yaml, nextjs.yml, release-consolidated.yaml)

Conditional enablement (`process.env.CODECOV_TOKEN !== undefined`) ensures local development builds work without a token while CI builds with the token automatically upload bundle analysis.

### 3. Test Analytics (Python)

Add JUnit XML output and `codecov/test-results-action@v1` to all Python CI workflows:

- **pytest flags**: `--junitxml=junit.xml -o junit_family=legacy` added to coverage test commands
- **test-results-action**: Added after each coverage upload with `if: ${{ !cancelled() }}` condition ensuring results upload even when tests fail
- The `!cancelled()` condition (instead of `always()`) prevents uploads on workflow cancellation, which would produce incomplete data

### 4. Configuration File (codecov.yml)

Centralized `codecov.yml` with:

- Coverage targets: 70% with 5% threshold for both project and patch
- Flags: `coder-deep`, `ci-repair`, `python` (coverage), `nextjs`, `vite` (bundle), `test-results` (test analytics)
- Ignore paths: test files, scripts, caches, migrations, node_modules, .next, dist

## Key Design Choices

- **Conditional bundle analysis**: `enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined` prevents build failures when CODECOV_TOKEN is absent (local dev, PRs from forks). The token presence check is a runtime evaluation, not a build-time requirement.

- **`!cancelled()` vs `always()` for test results**: The `if: ${{ !cancelled() }}` condition runs on success, failure, and skipped outcomes but NOT on cancellation. This matches Codecov's recommendation because cancelled workflows produce incomplete JUnit XML files that would corrupt test analytics.

- **Flag-based coverage isolation**: Each Python workspace package uses a dedicated flag (`coder-deep`, `ci-repair`, `python`) with `carryforward: true`. This ensures that a coverage drop in one package doesn't affect the status check for unrelated packages when only one package's paths change.

- **Legacy JUnit family**: `-o junit_family=legacy` produces JUnit XML compatible with Codecov's test parser. The default `xunit2` format can cause parsing failures for some test runners.

- **Separate coverage upload and test results upload**: `codecov/codecov-action@v5` handles coverage data (XML), while `codecov/test-results-action@v1` handles test outcomes (JUnit XML). These are distinct actions with distinct payloads — they cannot be merged.

## Consequences

- **Positive**: Centralized dashboard at codecov.io provides coverage trends, bundle size history, and test failure analytics across all branches and PRs.
- **Positive**: Bundle analysis detects size regressions before merge, preventing performance degradation from dependency bloat.
- **Positive**: Test analytics identifies flaky tests and failure patterns across the Python test suite.
- **Positive**: Flag-based coverage isolation prevents false-negative status checks when unrelated packages change.
- **Negative**: `CODECOV_TOKEN` must be configured as a repository secret (requires admin access). Fork PRs cannot upload without the token.
- **Negative**: Bundle analysis adds minimal overhead to build times (~1-2s for webpack/vite plugin initialization and upload).
- **Risk**: If Codecov service experiences downtime, coverage uploads fail silently (`if: always()` ensures the workflow still passes).

## References

- Codecov Coverage Action: https://github.com/codecov/codecov-action
- Codecov Webpack Plugin: https://github.com/codecov/webpack-plugin
- Codecov Vite Plugin: https://github.com/codecov/vite-plugin
- Codecov Test Results Action: https://github.com/codecov/test-results-action
- Commit `fb000bb`: Coverage analytics integration
- Commit `e04230f`: Bundle analysis integration
- Commit `fcc6645`: Test analytics integration
