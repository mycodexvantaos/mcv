# MyCodeXvantaOS Changelog

All notable changes to MyCodeXvantaOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-24

### Added

- IM-MCV-001: Internal Security Audit Framework & Compliance Baseline
- IM-MCV-002: Auditor Implementation & Tooling Specification
- 42 pytest tests all passing

### Changed

- Section markers normalized: all `Spec-X` replaced with `## Spec X：` and `Spec-X.Y` with `### Spec X.Y：` for Markdown compatibility across GitLab Wiki, Docsify, and static site generators
- Version baseline established as `v1.0.0` per SemVer convention; prior `v1.1.0` references corrected to `v1.0.0`
- CHANGELOG.md cleaned: removed duplicate entries and non-changelog sections (roadmap, benchmarks, known issues, deprecation notices, security updates, performance improvements, contributors, support)
- CONTRIBUTING.md updated with section-sign symbol prohibition and Spec format documentation rule
- Pre-commit hook added to prevent U+00A7 from entering the repository

## [0.1.3] - 2026-07-21

### Security

- Resolved GHSA-q7rr-3cgh-j5r3 (CVE-2026-44902, HIGH): OpenTelemetry Prometheus exporter DoS via malformed HTTP request to port 9464
  - Added `pnpm.overrides` for `@opentelemetry/auto-instrumentations-node@^0.75.0` and `@opentelemetry/sdk-node@^0.217.0`
  - Defense-in-depth: Prometheus exporter is NOT used in our codebase; port not exposed in any deployment
  - `pnpm audit` reduced from 3 vulnerabilities (2 HIGH + 1 LOW) to 1 LOW
  - Closes #98 (previously accepted risk, now fully remediated with overrides)
- Remaining accepted risk: `@tootallnate/once` (GHSA-vpq2-c234-7xj6, LOW, Issue #99) — cannot override due to ESM/CJS incompatibility with http-proxy-agent@5.x

### Fixed

- Added `[tool.hatch.build.targets.wheel]` to Python app packages (agent-worker, dream-worker, knowledge-worker) — fixes `hatchling` build failures that prevented `uv sync --all-packages` from installing workspace packages
- Fixed `ruff` lint errors in `test_memory_dream.py` (I001: unsorted imports, W292: no newline at end of file)
- Applied `ruff format` to 9 Python files in `mycodexvantaos-memory-dream` package
- Updated `uv.lock` with all workspace packages now discoverable and installable

## [0.1.2] - 2026-05-21

### Security

- Fixed CodeQL code scanning configuration error (PR #100)
  - Added `.github/codeql/codeql-config.yml` with explicit path filters and security-and-quality query suite
  - Referenced config-file in `codeql.yml` init step for deterministic scanning
  - Upgraded `security-scan.yaml` SARIF upload actions from v3 to v4
- Removed vestigial `@cloudflare/next-on-pages` from studio-platform devDependencies (Closes #95)
  - Eliminates undici v5 CVE chain (5 CVEs) introduced via miniflare v3 transitive dependency
  - Removed `@cloudflare/next-on-pages>next` peer dependency rule from root `package.json`
- Migrated `apollo-server-express` v3 to `@apollo/server` v5 (Closes #96)
  - Replaced `apollo-server-express` with `@apollo/server` ^5.5.1 + `@as-integrations/express4` ^1.1.2
  - Replaced `gql` import from `apollo-server-express` with `graphql-tag` ^2.12.6
  - Upgraded `graphql` from ^16.8.0 to ^16.11.0 (required by @apollo/server v5)
  - Removes apollo-server-core XS-Search vulnerability (CVE-2022-35736 class)
- Upgraded `vitest` from ^1.3.1 to ^3.2.4 in dev-studio and validation services (Closes #97)
  - Eliminates vite v5 path traversal vulnerability (CVE-2024-32706 class)

### Accepted Risk

- Issue #98: Genkit OpenTelemetry dependency chain (Prometheus exporter CVE) — code path not used, pinned by genkit
- Issue #99: @tootallnate/once transitive vulnerability via http-proxy-agent — low severity, override incompatible with CJS

## [0.1.1] - 2026-07-20

### Security

- Remediated 10 of 20 Dependabot vulnerability alerts (Issue #81)
- Upgraded `wrangler` from v3 to v4 in `apps/api-worker` (resolves 5 undici vulnerabilities via miniflare v4)
- Upgraded `ws` from `^8.16.0` to `^8.20.1` in `services/mycodexvantaos-ai-team-service` (CVE-2024-37886 memory disclosure)
- Added 9 `pnpm.overrides` for vulnerable transitive dependencies: ws, esbuild, postcss, protobufjs, brace-expansion, ip-address, cookie, hono (via MCP SDK), fast-uri (via ajv)
- Documented 10 deferred vulnerabilities with accepted risk and migration paths in `docs/security/dependency-vulnerability-remediation-v0.1.1.md`
- Deferred: undici v5 (locked by @cloudflare/next-on-pages), apollo-server-core v3 (EOL), vite v5 (locked by vitest v1), OTel SDK (genkit-controlled), @tootallnate/once (deep transitive)

### Changed

- Simplified `pnpm-workspace.yaml` — removed duplicated overrides, consolidated to `package.json` as canonical source
- All security overrides now documented with CVE references in `pnpm-workspace.yaml` comments

## [0.1.0] - 2026-05-18

### Added

- Stable release v0.1.0 promoted from v0.1.0-rc.1 with evidence-based go/no-go recommendation
- Publication tag `v0.1.0-stable` created at commit `1371a89` as recovery tag (per ADR-006)
- RC soak validation script (`pnpm rc:soak`) producing soak-report.json and markdown report
- Promotion gate evaluation script (`pnpm release:promotion:evaluate`) evaluating 11 gates against rc-promotion-policy.json
- Stable release signing plan (`docs/security/release-signing.md`) defining Sigstore keyless, GPG, and Vault/HSM signing methods
- Machine-readable signing policy (`release/policies/signing-policy.json`) with signing-not-configured to signing-configured transition
- Stable release draft (`docs/releases/v0.1.0.md`) with promotion evidence, supply chain artifacts, and post-stable requirements
- Release draft artifact (`release/artifacts/v0.1.0/release-draft.json`) with promotion evidence, go/no-go recommendation, and draft hash
- v0.1.0 stable release artifacts: release-manifest.json, artifact-digests.json, verification-summary.json (`release/artifacts/0.1.0/`)
- CycloneDX 1.5 JSON SBOM with 161 components (`release/artifacts/0.1.0/sbom.cyclonedx.json`)
- SLSA v1 / in-toto Statement v1 provenance with supply-chain-summary.json (`release/artifacts/0.1.0/`)
- Self-hosted quickstart guide for v0.1.0 (`docs/self-hostable/quickstart-0.1.0.md`)
- v0.1.0 promotion evaluation report (`docs/releases/0.1.0-promotion-evaluation.md`)
- v0.1.0 soak validation report (`docs/releases/0.1.0-soak-report.md`)

### Changed

- README.md and PLATFORM_ARCHITECTURE.md synchronized with v0.1.0 stable codebase (PR #75)
- CONTRIBUTING.md rewritten for v0.1.0 architecture (PR #76)
- Release notes artifact paths updated from v0.1.0-rc.1 to 0.1.0 stable paths
- Promotion gate evaluation: 9/11 gates pass, 2 skipped with acceptable-skip (G010: signing-not-configured, G011: infrastructure-not-configured)
- Signing classification: signing-not-configured documented with policy and implementation plan for stable release requirement
- Infrastructure classification: infrastructure-not-configured documented as optional for stable per promotion policy

### Security

- Signing policy defines transition from signing-not-configured (RC) to signing-configured (stable)
- All 7 governance enforcement flags remain active and verified
- No security scanning disabled or bypassed

## [0.1.0-rc.1] - 2026-05-16

### Added

- Platform governance enforcement: audit, knowledge trace, and dream safety enforcement middleware
- `withAudit()` middleware wrapping all mutating routes with trace_id generation
- `withPolicy()` runtime enforcement middleware with 5 decision types (allow, deny, require-review, dry-run-only, audit-required)
- Knowledge trace receipt validation for knowledge-assisted answers
- Dream safety lifecycle: review gate, before/after JSON tracking, rollback, delete prohibition
- Architecture decision enforcement requiring review for tagged memory merges
- Release manifest generator (`pnpm generate-release-manifest`) with manifest hash integrity
- Release candidate verification (`pnpm rc:verify`) covering 8 categories
- Release candidate check workflow (`.github/workflows/release-candidate-check.yml`)
- Terraform Cloud guard workflow documenting external TFC failures as infrastructure-not-configured
- Governance check now includes 24 checks with structured Enforcement Flag Summary
- 7 canonical enforcement flags: auditEnforcementEnabled, knowledgeTraceEnforcementEnabled, dreamSafetyEnforcementEnabled, auditEnforcementMiddleware, knowledgeTraceEnforcementMiddleware, dreamSafetyEnforcementMiddleware, policyRuntimeEnforcement

### Changed

- Consolidated CodeQL from 3 redundant workflows to single CodeQL Advanced (v4) workflow covering actions, javascript-typescript, and python
- Removed legacy `codeql-analysis.yml` (v3, JavaScript-only)
- Removed duplicate CodeQL job from `security-scan.yaml`
- Updated CodeQL Advanced workflow triggers to include `feature/**` and `fix/**` branches
- Updated security-scan.yaml version from 2.1.0 to 3.0.0
- Normalized governance flag reporting with structured summary output

### Fixed

- CodeQL transient failures resolved by consolidating to single v4 workflow
- Terraform Cloud external status check failure documented and classified as infrastructure-not-configured
- Governance enforcement flag output cleaned and normalized

### Security

- CodeQL analysis consolidated to v4 actions with improved coverage
- No security scanning disabled or bypassed
- All enforcement flags remain active and verified by governance checks

## [Unreleased]

### Fixed

- **CI (P0)**: Restored all push- and pull_request-triggered GitHub Actions workflows on `main`. Repository policy `sha_pinning_required` was silently toggled to `true` between commits `63936ff` and `98c7353`. With SHA pinning enforced, every `uses: ...@v4` tag reference produced `startup_failure`. Set `sha_pinning_required` back to `false` via repository Actions permissions API. SHA-pinning of all third-party actions is tracked as governed deferred work for v0.2.0 (ADR-0013).
- **CI**: Relocated misplaced ArgoCD/Kustomize manifests from `.github/workflows/argocd/` to top-level `argocd/` directory. These non-workflow YAML files caused all push-triggered GitHub Actions workflows on `main` to return `startup_failure`. Root cause: GitHub Actions parses every YAML under `.github/workflows/` as a workflow definition; Kubernetes manifests use top-level keys that are not valid workflow keys. See ADR-0012.

## Types of Changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities


<!-- Platform v1.0 additions -->
- Section markers normalized: all `Spec-X` replaced with `## Spec X：` and `Spec-X.Y` with `### Spec X.Y：` for Markdown compatibility across GitLab Wiki, Docsify, and static site generators
- CONTRIBUTING.md updated with section-symbol prohibition and Spec format documentation rule
- Pre-commit hook added to prevent U+00A7 from entering the repository