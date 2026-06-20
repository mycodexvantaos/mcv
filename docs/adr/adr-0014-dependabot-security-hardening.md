# ADR 0014: Dependabot Security Hardening — Comprehensive Ecosystem Configuration and CODEOWNERS

**Date**: 2026-07-23
**Status**: Accepted
**Supersedes**: None
**Context**: Dependabot configuration for MyCodeXvantaOS with multi-ecosystem support and security review ownership

## Context

The existing `dependabot.yml` was a stub template with an empty `package-ecosystem: ''` value and a single root directory. Dependabot automated security fixes were enabled (`automated-security-fixes: enabled`), but without proper ecosystem configuration, Dependabot could not create version update PRs for any of the four package ecosystems in the repository: npm/pnpm (TypeScript Control Plane), pip (Python Intelligence Plane), Docker (container builds), and GitHub Actions (CI workflows).

The repository also lacked a CODEOWNERS file, meaning no automatic review requests were triggered for security-critical paths like workflow files, CodeQL configuration, security scanning workflows, and the codecov configuration.

Prior vulnerability remediation efforts (v0.1.1 through v0.1.3 documented in `docs/security/`) relied on manual `pnpm.overrides` in `package.json` to patch transitive dependencies. While effective for immediate fixes, this approach does not scale and creates maintenance burden when upstream packages release fixes that should be adopted directly.

## Decision

### 1. Comprehensive Dependabot Configuration

Replace the stub `dependabot.yml` with a full four-ecosystem configuration:

| Ecosystem | Directory | Schedule | PR Limit | Labels |
|-----------|-----------|----------|----------|--------|
| `github-actions` | `/` | Monday | 10 | dependencies, github_actions, security |
| `npm` | `/` | Tuesday | 15 | dependencies, javascript, security |
| `pip` | `/python` | Wednesday | 10 | dependencies, security |
| `docker` | `/` | Thursday | 5 | dependencies, infra, security |

Key configuration decisions:

- **Staggered schedule**: Each ecosystem updates on a different weekday to distribute PR volume and avoid CI queue congestion on a single day.
- **Grouped updates**: Production and development dependencies are grouped separately for npm and pip, reducing PR count while maintaining reviewability. GitHub Actions and Docker use single groups since their dependency graphs are simpler.
- **Versioning strategy `increase`** for npm: Ensures `package.json` version ranges are bumped, not just `pnpm-lock.yaml`. This makes updates visible in the source of truth.
- **Ignore rule for `@tootallnate/once`**: Major version (3.x) is ESM-only and incompatible with `http-proxy-agent@5.x` CJS imports. This codifies the accepted risk from Issue #99 and prevents Dependabot from repeatedly creating PRs that would break the build.
- **Security label on all ecosystems**: Every Dependabot PR is labeled `security` in addition to ecosystem-specific labels, enabling security team filtering.

### 2. CODEOWNERS for Security-Critical Paths

Create `.github/CODEOWNERS` with ownership assignments:

- **Security workflows** (`codeql.yml`, `security-scan.yaml`, `gitleaks.yaml`, `trivy-scan.yaml`, etc.): `@mycodexvantaos/security`
- **Codecov configuration** (`codecov.yml`): `@mycodexvantaos/security`
- **All CI workflows** (`.github/workflows/`): `@mycodexvantaos/infra`
- **Python AI packages** (coder-deep, ci-repair, memory-dream): `@mycodexvantaos/ai-team`
- **Security documentation** (`docs/security/`): `@mycodexvantaos/security`
- **Default**: `@mycodexvantaos/core`

This ensures that Dependabot PRs touching security-critical paths automatically request review from the security team, and infrastructure workflow changes require infra team review.

### 3. Codecov Allowed Actions

The repository uses `allowed_actions: selected` with an explicit `patterns_allowed` list. The Codecov actions (`codecov/codecov-action@*`, `codecov/test-results-action@*`) must be added to this list for the Codecov integration workflows to execute. This requires organization admin access to modify via the GitHub API.

## Key Design Choices

- **`pip` directory is `/python`** (not `/`): The Python workspace root is `python/` with `pyproject.toml` and `uv.lock`. Dependabot for pip must target this directory to detect Python dependencies. The root directory has no `requirements.txt` or `setup.py`.

- **`npm` directory is `/`** (not individual packages): The pnpm monorepo manages all npm dependencies from the root `package.json` and `pnpm-lock.yaml`. Individual package directories do not have independent lock files, so the root directory is the correct target for Dependabot.

- **`docker` directory is `/`**: The root Dockerfile and service Dockerfiles all use the repository root as build context. Dependabot scans Dockerfiles for base image references and creates PRs to update them.

- **No `reviewers` field in dependabot.yml**: CODEOWNERS provides automatic review assignment. Adding explicit `reviewers` would duplicate review requests and create confusion about who is responsible.

- **`open-pull-requests-limit`**: npm has 15 (highest due to the large dependency tree), pip and github-actions have 10, docker has 5 (fewer base images than libraries).

## Consequences

- **Positive**: Dependabot will automatically create version update PRs for all four ecosystems, reducing manual dependency tracking burden.
- **Positive**: Grouped updates reduce PR noise from 50+ individual PRs to ~4-8 grouped PRs per week.
- **Positive**: CODEOWNERS ensures security-critical changes always require security team review.
- **Positive**: The `@tootallnate/once` ignore rule prevents recurring failed build PRs that were previously manually closed.
- **Negative**: Dependabot PRs consume CI minutes. With staggered schedules and PR limits, this is bounded to ~40 PRs/week maximum.
- **Negative**: CODEOWNERS requires team accounts (`@mycodexvantaos/security`, `@mycodexvantaos/infra`, `@mycodexvantaos/ai-team`, `@mycodexvantaos/core`) to exist in the GitHub organization. If teams don't exist, review requests silently fail.
- **Risk**: Dependabot for `pip` with `uv` is supported but may not detect all workspace member dependencies correctly if they are only specified in `uv.sources` and not in `pyproject.toml` dependencies.

## References

- Dependabot configuration: `.github/dependabot.yml`
- CODEOWNERS: `.github/CODEOWNERS`
- Dependency vulnerability remediation history: `docs/security/dependency-vulnerability-remediation-v0.1.*.md`
- pnpm overrides: `package.json` → `pnpm.overrides`
- Issue #99: `@tootallnate/once` ESM-only blocking upgrade
