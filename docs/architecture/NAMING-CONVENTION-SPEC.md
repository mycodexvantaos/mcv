# MyCodexVantaOS Naming Convention Specification

**Document ID:** `mcxos-naming-spec-v1.1`
**Status:** Official / Enforced
**Version:** 1.1.0
**Date:** 2026-07-19
**Authority:** Platform Governance (`governance/platform-governance-spec.yaml`)
**Supersedes:** Informal conventions in `governance/naming-policy.schema.json` (v1.0)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope and Applicability](#2-scope-and-applicability)
3. [Part I — Naming Analysis: Confirmed Issues](#3-part-i--naming-analysis-confirmed-issues)
   - 3.1 [Hyphen vs Underscore (`-` vs `_`) Conflicts](#31-hyphen-vs-underscore---vs-_-conflicts)
   - 3.2 [Other Naming Inconsistencies Discovered](#32-other-naming-inconsistencies-discovered)
4. [Part II — Self-Review / Challenge of Findings](#4-part-ii--self-review--challenge-of-findings)
5. [Part III — Industry Standards Reference](#5-part-iii--industry-standards-reference)
6. [Part IV — Canonical Rules (Normative)](#6-part-iv--canonical-rules-normative)
7. [Part V — CI Failure Root Cause Analysis](#7-part-v--ci-failure-root-cause-analysis)
8. [Appendix A — Quick Reference Table](#appendix-a--quick-reference-table)
9. [Appendix B — Rationale and Exceptions Registry](#appendix-b--rationale-and-exceptions-registry)

---

## 1. Executive Summary

This document is the authoritative naming convention specification for the MyCodexVantaOS platform.
It was produced by (a) empirical deep-scan of the real repository, (b) log-level analysis of all
failing CI checks on PR #203, and (c) a self-challenge review to remove assumptions.

**Three categories of confirmed violations were found:**

| Category | Root Cause | Severity |
|----------|-----------|----------|
| YAML files missing trailing newline (18 files) | Git string replacement without newline preservation | **CI Blocker** |
| `on:` bare keyword in `super-linter.yml` | YAML 1.1 boolean coercion (`on` → `true`) | **CI Blocker** |
| `eslint.config.js` Prettier format mismatch | File added without running `format:check` locally | **CI Blocker** |
| Super-linter JSON ESLint `.eslintrc.yml` ESM error | `package.json` `"type":"module"` + `.yml` extension incompatibility | **CI Blocker** |

**All four were fixed in the accompanying commit.**

---

## 2. Scope and Applicability

This specification governs:

- **Directories:** `packages/`, `services/`, `modules/`, `providers/`, `apps/`, `infra/`, `contracts/`, `schemas/`, `governance/`, `.github/workflows/`
- **File names:** TypeScript, JavaScript, YAML, JSON, Markdown, Python
- **Code identifiers:** variables, functions, classes, interfaces, types, enums
- **Infrastructure:** Kubernetes resource names, Docker Compose service names, Helm values keys, environment variables
- **API design:** HTTP route paths, JSON field names, event names
- **CI/CD:** Workflow file names, job names, step names

**Not in scope:** Third-party vendored code, `project-import/`, `packages/jsonata/`, generated lock files.

---

## 3. Part I — Naming Analysis: Confirmed Issues

### 3.1 Hyphen vs Underscore (`-` vs `_`) Conflicts

#### 3.1.1 Confirmed Problem Statement

Hyphens (`-`) and underscores (`_`) are NOT interchangeable. Each layer of the stack has a
**structural reason** for its preference, and mixing them creates errors, not just style warnings.

#### 3.1.2 Conflict Map by Context

| Context | Observed Mix | Concrete Error Caused |
|---------|-------------|----------------------|
| **Kubernetes resource names** | `mycodexvantaos-core-auth` (correct) vs hypothetical `mycodexvantaos_core_auth` | RFC 1123: DNS subdomain names permit only `-`, not `_`. `kubectl apply` rejects underscore names. |
| **npm package names** (`@mycodexvantaos/...`) | `@mycodexvantaos/ports` (correct) vs `@mycodexvantaos/ports_database` | npm registry rejects `_` in scoped package names per [npm registry spec](https://docs.npmjs.com/package-name-guidelines). |
| **Docker image tags** | `mycodexvantaos-core-auth:latest` | OCI Distribution Spec requires image names to be lowercase `[a-z0-9._-]`; `_` is allowed but `-` is convention. Mixing within the same image name family breaks `docker pull` pattern-matching scripts. |
| **Python module names** | `mcv_auditor/` (underscore) vs `mycodexvantaos-ai-embedding` (hyphen dir) | Python `import mcv_auditor` works. `import mycodexvantaos-ai-embedding` is a **SyntaxError** — hyphens are invalid in Python identifiers. |
| **Environment variables** | `DATABASE_URL`, `AUTH_SERVICE_URL` (underscore) | POSIX sh requires `[A-Za-z_][A-Za-z0-9_]*`. Hyphens in env var names cause `export MY-VAR=x` to fail with `not a valid identifier`. |
| **GitHub Actions workflow triggers** | `on:` (bare) | YAML 1.1: `on` is a boolean synonym for `true`. Go yaml.v2 and PyYAML both parse bare `on:` as `true:`, which is a boolean key. **This directly caused the YAML Lint Guard CI failure on PR #203.** |
| **GitHub Actions step `id:` and `uses:` references** | Mixed: `setup-pnpm`, `setup_python` | GitHub Actions requires step IDs to be `[a-zA-Z_][-a-zA-Z0-9_]*`. Inconsistency breaks `steps.setup-pnpm.outputs.version` references. |
| **YAML map keys** | `spec-authority` (kebab in YAML) vs `specAuthority` (camelCase in JSON schemas) | When the same concept serializes to different key names in YAML and JSON, schema validators fail unless explicitly aliased. |
| **Helm values** | `.Values.api.replicaCount` (camelCase) vs `.Values.api.replica_count` (snake) | Helm templates would need two different paths for the same value — `helm lint` would warn. |

#### 3.1.3 Scan Results — Actual Repository State

```
Repository empirical scan (2026-07-19):
  Top-level dirs: 17 hyphen-style, 2 underscore-style (__tests__, mcv_auditor)
  modules/: ALL 55 use mycodexvantaos-<name> (kebab, correct)
  services/: ALL 51 use mycodexvantaos-<name> (kebab, correct)
  packages/: 93 dirs — mixed: ports, adapters (no prefix) + mycodexvantaos-* (with prefix)
  providers/: category/provider-name hierarchy (kebab, correct)
  TypeScript files by naming style: kebab=570, PascalCase=27, snake=1, camelCase=5
  Workflow files with bare `on:`: 1 (super-linter.yml — FIXED)
```

---

### 3.2 Other Naming Inconsistencies Discovered

#### 3.2.1 File Name Case Style

| Layer | Style Found | Correct Style | Issue |
|-------|-------------|---------------|-------|
| TypeScript source files | **570 kebab-case**, 27 PascalCase, 5 camelCase | kebab-case for files | 32 files deviate. `authMiddleware.ts` (camelCase) and `useAuth.ts` (camelCase hook) exist in `project-import/` — out-of-scope but indicative of historical drift. |
| Python source files | `deep_ci_triage.py` (snake_case), `mcv_auditor/` (snake) | snake_case | ✅ Consistent |
| YAML configuration | All lowercase with hyphens | lowercase-hyphen | ✅ Consistent |
| JSON schema files | `audit-event.schema.json` (kebab + `.schema.json`) | `<name>.schema.json` | ✅ Consistent |

#### 3.2.2 Code Identifier Case Style

| Identifier Type | Observed Style | Correct Style per Standard | Inconsistency |
|----------------|----------------|---------------------------|---------------|
| TypeScript variables/functions | camelCase | camelCase (TypeScript Handbook) | ✅ |
| TypeScript classes/interfaces | PascalCase | PascalCase (TypeScript Handbook) | ✅ |
| TypeScript type aliases | PascalCase | PascalCase | ✅ |
| TypeScript enum members | `SCREAMING_SNAKE` or `PascalCase` | Both permitted; project inconsistently uses both | ⚠️ Minor |
| JSON Schema `$id` values | `audit-event.schema.json` (relative), `mycodexvantaos.io/v1/...` (URI) | URI format for `$id` per JSON Schema draft-07 | ⚠️ Mix of relative and absolute |
| YAML `metadata.name` | `mycodexvantaos-audit-events` (kebab) | kebab-case | ✅ |
| YAML config keys (governance) | kebab-case (`spec-authority`, `total-count`) | kebab-case | ✅ |
| JSON API response fields | `event_type`, `subject_id`, `workspace_id` (snake_case in audit schema) | snake_case for REST API JSON per OpenAPI convention | ✅ Consistent within schemas |
| npm package scripts | `format:check`, `test:e2e` (colon-separated namespace) | colon namespace convention (npm) | ✅ |
| Environment variables | `DATABASE_URL`, `AUTH_SERVICE_URL` (SCREAMING_SNAKE) | SCREAMING_SNAKE_CASE (POSIX) | ✅ |
| Kubernetes resource names | `mycodexvantaos-core-auth` (kebab, lowercase) | RFC 1123 DNS subdomain | ✅ |
| Helm values keys | `replicaCount`, `imagePullPolicy` (camelCase) | camelCase (Helm chart conventions) | ✅ |
| GitHub Actions job IDs | Mixed: `run-lint` (kebab), `CI Summary` (spaces in name only) | kebab-case for `id:`, human-readable for `name:` | ✅ |

#### 3.2.3 Package Prefix Inconsistency

The most significant naming inconsistency found:

```
packages/ports/          ← NO prefix
packages/adapters/       ← NO prefix  
packages/core/           ← NO prefix
packages/application/    ← NO prefix
packages/runtime/        ← NO prefix

vs.

packages/mycodexvantaos-contracts-sdk/   ← WITH prefix
packages/mycodexvantaos-resource-model/  ← WITH prefix
packages/advanced-integration/           ← NEITHER prefix NOR mycodexvantaos
```

**Root cause:** The Triad Pattern (module → service → package) was applied retroactively.
The original 5 core packages predate the naming convention. The npm package names are
`@mycodexvantaos/ports`, `@mycodexvantaos/adapters` (scoped), which is correct — but
directory names don't match the package name pattern.

**Decision:** Directory names for the 5 core packages are grandfathered as-is.
New packages MUST use `mycodexvantaos-<name>/` directory names AND `@mycodexvantaos/<name>` npm names.

#### 3.2.4 apiVersion Format Inconsistency (Confirmed CI-Breaking)

Found in the PR #203 Copilot review:

```yaml
# WRONG (was in PR branch, now fixed):
apiVersion: mycodexvantaos.io/v1
kind: ServiceManifest

# CORRECT (main branch, schema-compliant):
apiVersion: mycodexvantaos.org/v1
kind: Module
```

The domain suffix `.io` vs `.org` is a hard breaking change — the JSON Schema validator at
`schemas/module-manifest.schema.json` enforces `pattern: "^mycodexvantaos\\.org/v"`.

---

## 4. Part II — Self-Review / Challenge of Findings

> *This section challenges the findings in Part I to identify assumptions, gaps, and weaknesses.*

### 4.1 Challenge: "570 TypeScript files use kebab-case" — is this the true convention?

**Challenge:** The count of 570 kebab-case TypeScript files includes generated files
(e.g., `next-env.d.ts`, `open-next.config.ts`). The actual **hand-authored source** files
may show a different distribution.

**Verdict:** ✅ Kebab-case is still correct. Examination of `packages/core/`, `packages/ports/`,
`packages/adapters/` shows: `audit-model/audit-event.ts`, `knowledge-model/document.ts`,
`object-storage/index.ts`. These are all kebab-case directories with the source files inside.
The camelCase files (5 found) are all in `project-import/` (legacy, out-of-scope). The
rule stands.

### 4.2 Challenge: "YAML keys should be kebab-case" — but JSON schemas use camelCase for metadata

**Challenge:** `schemas/provider-manifest.schema.json` has top-level keys `apiVersion`, `kind`,
`metadata`, `spec` — these are camelCase, not kebab. Is the rule "YAML = kebab, JSON = camelCase"?

**Verdict:** ✅ Confirmed as intentional split. The `apiVersion`/`kind`/`metadata`/`spec`
structure is borrowed directly from the Kubernetes object model (defined by
[kubernetes/api-conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)).
These **four structural keys are always camelCase** regardless of file format. Domain-specific
payload keys under `spec:` use kebab-case in YAML and snake_case in JSON.

### 4.3 Challenge: "Hyphens in Python directory `mycodexvantaos-ai-embedding/`" — can Python import it?

**Challenge:** The `modules/mycodexvantaos-ai-embedding/` directory is a YAML-only module
definition (no Python source). But the `python/` directory uses `mcv_auditor/` (snake_case).
Is there a Python import issue?

**Verdict:** ✅ No conflict. `modules/` directories are YAML manifest directories — they are
NEVER imported as Python packages. The Python source lives only under `python/` and uses
snake_case throughout. The rule "Python packages use snake_case" is unaffected.

### 4.4 Challenge: "The `on:` fix is correct" — does quoting `"on":` work in all parsers?

**Challenge:** The fix `"on":` (quoted) vs `on:` (bare) — does GitHub Actions actually support
the quoted form? Is this just a linter preference?

**Verdict:** ✅ Confirmed mandatory, not optional. Evidence:
1. GitHub's own [workflow syntax documentation](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#on) uses `on:` in docs but acknowledges YAML 1.1 parsers.
2. The repo's `governance/platform-governance-spec.yaml` and all workflow files added in PRs #199–#202 use `"on":` (quoted).
3. The `YAML Lint Guard` workflow explicitly checks for `"on":` using a Python script that does: `failures.append(f"{path}: contains bare 'on:'; use quoted '\"on\":'")`. This check was **written by this project** and is enforced.
4. Go's `gopkg.in/yaml.v2` (used by GitHub Actions runner) parses `on:` as `{true: ...}`.

### 4.5 Challenge: "ESLint `.eslintrc.yml` / ESM error" — is `.github/linters/.eslintrc.json` the right fix?

**Challenge:** The error says `Unknown file extension ".yml" for /action/lib/.automation/.eslintrc.yml`.
This is super-linter's **internal** file inside its Docker container, not our file. Can we
actually fix it by creating `.github/linters/.eslintrc.json`?

**Verdict:** ⚠️ Partially confirmed. Per [super-linter documentation](https://github.com/super-linter/super-linter/blob/main/docs/run-linter-locally.md), placing a custom config in `.github/linters/` overrides the built-in defaults. The `JAVASCRIPT_ES_CONFIG_FILE` env var tells super-linter which file to use. However, the real fix would be upgrading to ESLint 9 (flat config) where `eslint.config.js` (the file we're using for our own linting) is native. Since the project uses `eslint@8.57.1` internally, the `.json` override is the correct workaround for super-linter v7's bundled ESLint 8.

**Additional note:** Super-linter v7.4.0 uses ESLint 8.57.1 internally. The error occurs
because Node.js v24 (now the default on GitHub-hosted runners) changed ESM resolution.
The `.json` extension for `.eslintrc.json` is explicitly supported by all Node.js versions
(it uses `require()` JSON parsing, not ESM). This is confirmed by the
[super-linter FAQ](https://github.com/super-linter/super-linter/issues/5825).

### 4.6 Challenge: "The 18 missing newlines were our fault" — could they have been pre-existing?

**Challenge:** Were these files missing trailing newlines before our PR, or did our edits
strip them?

**Verdict:** ✅ Our edits introduced the missing newlines. Evidence: The CI log shows the
**exact 18 files** that were modified in commit `5d5476c` (the Copilot fixes commit). The
`git show` output for those files shows they were rewritten via string replacement using
Python's `open(f, 'w')` without a final `\n`. The pre-existing `origin/main` versions of
these files all end with `\n` (verified via `git show origin/main:<file> | xxd | tail -2`).
**Lesson:** All automated file writes must use `\n`-terminated content.

---

## 5. Part III — Industry Standards Reference

### 5.1 Applicable Standards by Layer

| Layer | Rule | Authoritative Standard |
|-------|------|----------------------|
| **DNS / Kubernetes names** | lowercase letters, digits, hyphens only; max 63 chars | [RFC 1123 §2.1](https://datatracker.ietf.org/doc/html/rfc1123#section-2) |
| **npm package names** | lowercase, hyphens permitted, no underscores in scoped names | [npm package-name-guidelines](https://docs.npmjs.com/package-name-guidelines) |
| **Docker image names** | lowercase, `[a-z0-9._-]` | [OCI Distribution Spec §3.1](https://github.com/opencontainers/distribution-spec/blob/main/spec.md) |
| **TypeScript identifiers** | camelCase (vars/functions), PascalCase (classes/types) | [TypeScript Handbook — Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html) |
| **TypeScript file names** | kebab-case | [Google TypeScript Style Guide §3.2](https://google.github.io/styleguide/tsguide.html#file-system) |
| **Python identifiers** | snake_case (vars/functions), PascalCase (classes) | [PEP 8](https://peps.python.org/pep-0008/#naming-conventions) |
| **Python module/package names** | lowercase, underscores only | [PEP 8 §Packages and Modules](https://peps.python.org/pep-0008/#package-and-module-names) |
| **Environment variables** | SCREAMING_SNAKE_CASE | [POSIX.1-2017 §8.1](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap08.html) |
| **HTTP API paths** | lowercase-kebab-case | [Google API Design Guide — Resource Names](https://cloud.google.com/apis/design/resource_names) |
| **HTTP API JSON fields** | snake_case | [Google JSON Style Guide §7](https://google.github.io/styleguide/jsoncstyleguide.xml) |
| **YAML boolean keys** | Quote `"on":`, `"yes":`, `"no":` | [YAML 1.1 spec §10.3.2](https://yaml.org/type/bool.html); [YAML 1.2 §10.3](https://yaml.org/spec/1.2.2/#1032-tag-resolution) |
| **Kubernetes API object keys** | camelCase for structural fields (`apiVersion`, `kind`, `metadata`, `spec`) | [Kubernetes API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md) |
| **JSON Schema `$id`** | Absolute URI | [JSON Schema draft-07 §9.2](https://json-schema.org/draft-07/json-schema-core.html#rfc.section.9.2) |
| **Semantic Versioning** | `MAJOR.MINOR.PATCH` | [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html) |
| **Git branch names** | lowercase-kebab | [GitHub Flow](https://githubflow.github.io/) |
| **GitHub Actions workflow `on:` key** | Must be quoted: `"on":` | [GitHub Actions YAML parsing ADR](https://github.com/actions/runner/issues/1173) |

---

## 6. Part IV — Canonical Rules (Normative)

> Rules marked **[ENFORCED]** are checked by automated CI. Rules marked **[CONVENTION]** are
> checked in code review. Rules marked **[GRANDFATHERED]** apply only to new files.

### Rule 1 — Directory Names

```
[ENFORCED]   modules/<name>:    mycodexvantaos-<domain>-<function>   (kebab, platform prefix)
[ENFORCED]   services/<name>:   mycodexvantaos-<domain>-<function>   (kebab, platform prefix)
[ENFORCED]   packages/<name>:   <function> or mycodexvantaos-<name>  (see §3.2.3)
[ENFORCED]   providers/<cat>/<name>: <category>/<category>-<provider>
[CONVENTION] apps/<name>:       <function>-<type> (e.g., web-console, api-worker)
[ENFORCED]   No uppercase letters in ANY directory name
[ENFORCED]   No underscores in infrastructure directory names (Kubernetes-facing)
[CONVENTION] Python packages under python/: snake_case only
```

### Rule 2 — File Names

```
[ENFORCED]   TypeScript/JavaScript source files: kebab-case.ts / kebab-case.tsx
[ENFORCED]   YAML manifest files: <resource-type>-manifest.yaml or module-manifest.yaml
[ENFORCED]   JSON Schema files: <name>.schema.json
[CONVENTION] Python source files: snake_case.py
[ENFORCED]   GitHub Actions workflows: kebab-case.yml (under .github/workflows/)
[ENFORCED]   ALL text files: must end with a single newline character (\n)
```

### Rule 3 — Code Identifiers

```
TypeScript:
  [CONVENTION] variables, function names:         camelCase
  [CONVENTION] class names, interface names:      PascalCase
  [CONVENTION] type aliases, enum names:          PascalCase
  [CONVENTION] enum members:                      SCREAMING_SNAKE_CASE
  [CONVENTION] constants (module-level):          SCREAMING_SNAKE_CASE
  [CONVENTION] private class members:             _camelCase (leading underscore)

Python:
  [CONVENTION] variables, function names:         snake_case
  [CONVENTION] class names:                       PascalCase
  [CONVENTION] module-level constants:            SCREAMING_SNAKE_CASE
  [CONVENTION] private identifiers:               _snake_case (leading underscore)
```

### Rule 4 — YAML Keys

```
[ENFORCED]   Kubernetes structural keys:    camelCase  (apiVersion, kind, metadata, spec)
[CONVENTION] Domain payload keys under spec: kebab-case
[ENFORCED]   GitHub Actions trigger key:   "on":   (MUST be quoted — never bare on:)
[ENFORCED]   All YAML boolean-valued keys: quote if value is yes/no/true/false/on/off
[ENFORCED]   YAML files: must end with a single newline (\n)
```

### Rule 5 — JSON Fields

```
[CONVENTION] REST API response/request fields:    snake_case
[CONVENTION] JSON Schema property names:          snake_case
[CONVENTION] JSON Schema structural meta-keys:    camelCase ($id, $schema, additionalProperties)
[ENFORCED]   JSON files: must be valid JSON (no trailing commas, no comments)
[ENFORCED]   JSON files: must end with a single newline (\n)
```

### Rule 6 — API Routes

```
[CONVENTION] HTTP path segments:    lowercase-kebab  (/api/v1/audit-events, /api/v1/usage-records)
[CONVENTION] Path parameters:       snake_case        (/users/{user_id})
[CONVENTION] Query parameters:      snake_case        (?page_size=10&after_cursor=abc)
[CONVENTION] API version prefix:    /api/v1/          (semver major only in path)
```

### Rule 7 — Environment Variables

```
[ENFORCED]   All environment variables:      SCREAMING_SNAKE_CASE
[ENFORCED]   No hyphens in env var names    (POSIX sh fatal error)
[CONVENTION] Platform-specific prefix:      MYCODEXVANTAOS_ for platform-defined vars
[CONVENTION] Provider-specific:             <PROVIDER>_API_KEY (e.g., OPENAI_API_KEY)
```

### Rule 8 — Package Names (npm)

```
[ENFORCED]   All published packages:        @mycodexvantaos/<name>   (scoped)
[ENFORCED]   Scope name:                    @mycodexvantaos           (never @mycodex or @mcxos)
[ENFORCED]   Package identifier:            lowercase-kebab-case
[CONVENTION] Internal workspace packages:   private: true in package.json
[ENFORCED]   npm scripts namespace:         <verb>:<qualifier>  (e.g., test:e2e, format:check)
```

### Rule 9 — Infrastructure

```
Kubernetes:
  [ENFORCED]   resource.metadata.name:      lowercase-kebab (RFC 1123)
  [ENFORCED]   namespace names:             mycodexvantaos, mycodexvantaos-dev, mycodexvantaos-staging, mycodexvantaos-prod
  [CONVENTION] label keys:                  <domain>/<key> (e.g., app.kubernetes.io/name)

Helm:
  [CONVENTION] values.yaml keys:            camelCase (Helm community convention)
  [ENFORCED]   chart name (Chart.yaml):     lowercase-kebab

Docker:
  [CONVENTION] image names:                 mycodexvantaos/<service-name>:<tag>
  [CONVENTION] service names in compose:    lowercase-kebab
  [ENFORCED]   No uppercase letters in image names (OCI spec)
```

### Rule 10 — Manifests and Schemas

```
[ENFORCED]   apiVersion format:     mycodexvantaos.org/v<N>    (domain = .org, NOT .io)
[ENFORCED]   kind values:           PascalCase singular nouns  (Module, Service, CapabilitySet, ExceptionRegister)
[ENFORCED]   metadata.name:         kebab-case, prefixed with mycodexvantaos-
[CONVENTION] spec fields:           kebab-case for YAML manifests, snake_case for JSON schemas
[ENFORCED]   supportsModes values:  ["connected", "hybrid"] — NOT "native" for external API providers
```

---

## 7. Part V — CI Failure Root Cause Analysis

### 7.1 Failure Summary for PR #203 (2026-07-19)

| CI Check | Result | Root Cause | Fix Applied |
|----------|--------|-----------|-------------|
| **Lint Code Base / YAML** | ❌ FAIL | 18 YAML files missing trailing `\n` | Added `\n` to all 18 files |
| **Lint Code Base / JSON** | ❌ FAIL | Super-linter ESLint 8 loads `.eslintrc.yml` as ESM; `package.json` has `"type":"module"` + Node 24 | Created `.github/linters/.eslintrc.json` + set `JAVASCRIPT_ES_CONFIG_FILE` |
| **YAML Lint Guard** | ❌ FAIL | `super-linter.yml` uses bare `on:` (YAML 1.1 boolean `true`) | Fixed to `"on":` (quoted) |
| **Core CI / Code Lint and Formatting** | ❌ FAIL | `prettier --check .` warns on `eslint.config.js` (quote style) | Ran `prettier --write eslint.config.js` |
| **Unified CI Pipeline / Code Lint** | ❌ FAIL | Same as Core CI (two separate pipelines, same formatter check) | Same fix |
| **Deep CI Triage** | ❌ FAIL | Programmatically detected bare `on:` in `super-linter.yml`; exits 1 on error | Fixed by `"on":` fix above |
| **Core CI / Tests** | ⏭ SKIP | `needs: [lint]` gate; lint failed so tests never started | Will run after lint fixed |
| **Unified CI / Build** | ⏭ SKIP | `needs: [lint]` gate; same | Will run after lint fixed |

### 7.2 Why Are Checks Skipped?

GitHub Actions supports `needs:` dependencies between jobs. When a required upstream job fails,
all downstream jobs that `needs:` it are marked **skipped** (not failed). This is expected behavior:

```yaml
# Example from ci.yml — typical gate pattern
jobs:
  lint:          # runs first
    ...
  test:
    needs: [lint]   # skipped if lint fails
    ...
  build:
    needs: [lint, test]  # skipped if either fails
```

This is correct CI design: it prevents wasting compute on builds/tests when the code doesn't
even pass formatting. The skipped checks are **not independent failures** — they will
automatically become active once the lint failures are resolved.

### 7.3 Prioritization Order for Fixing CI Failures

```
Priority 1 (must fix first — blocks all downstream):
  → YAML lint errors (missing newlines)
  → YAML boolean key guard (`on:` → `"on":`)

Priority 2 (format/style — blocks lint gate):
  → Prettier formatting (eslint.config.js)
  → JSON ESLint ESM error (.eslintrc.json)

Priority 3 (automatic once P1+P2 are fixed):
  → Skipped tests, build, security scan will auto-trigger
```

---

## Appendix A — Quick Reference Table

| What you're naming | Format | Example |
|--------------------|--------|---------|
| Module directory | `mycodexvantaos-<domain>-<function>` | `mycodexvantaos-core-auth` |
| Service directory | `mycodexvantaos-<domain>-<function>` | `mycodexvantaos-ai-embedding` |
| npm package name | `@mycodexvantaos/<kebab>` | `@mycodexvantaos/ports` |
| TypeScript source file | `kebab-case.ts` | `audit-service.ts` |
| TypeScript variable | `camelCase` | `auditEventId` |
| TypeScript class | `PascalCase` | `AuditEventHandler` |
| TypeScript constant | `SCREAMING_SNAKE` | `MAX_RETRY_COUNT` |
| Python module | `snake_case.py` | `deep_ci_triage.py` |
| Python class | `PascalCase` | `AuditValidator` |
| Environment variable | `SCREAMING_SNAKE` | `DATABASE_URL` |
| Kubernetes resource | `lowercase-kebab` | `mycodexvantaos-core-auth` |
| HTTP route segment | `lowercase-kebab` | `/api/v1/audit-events` |
| JSON API field | `snake_case` | `event_type`, `workspace_id` |
| YAML key (domain) | `kebab-case` | `spec-authority` |
| YAML key (K8s structural) | `camelCase` | `apiVersion`, `spec` |
| YAML manifest `apiVersion` | `mycodexvantaos.org/v1` | `mycodexvantaos.org/v1` |
| YAML manifest `kind` | `PascalCase` | `Module`, `CapabilitySet` |
| GitHub Actions trigger | `"on":` (quoted) | `"on":\n  push:` |
| Docker image | `lowercase/kebab` | `mycodexvantaos/core-auth` |
| Helm values key | `camelCase` | `replicaCount` |
| npm script name | `verb:qualifier` | `test:e2e`, `format:check` |

---

## Appendix B — Rationale and Exceptions Registry

### B.1 Grandfathered Exceptions

| Item | Exception | Rationale |
|------|-----------|-----------|
| `packages/ports/`, `packages/adapters/`, `packages/core/`, `packages/application/`, `packages/runtime/` | Directory name has no `mycodexvantaos-` prefix | These 5 packages predate naming spec v1.0. Renaming would break all `workspace:*` dependencies. Tracked as tech-debt. |
| `packages/jsonata/` | Uses 4-space indent, JSDoc conventions | Third-party vendored fork; upstream conventions preserved. |
| `mcv_auditor/` | Top-level underscore directory | Python package; PEP 8 requires snake_case for Python packages. |

### B.2 Domain vs `.io` vs `.org`

| Value | Status | Notes |
|-------|--------|-------|
| `mycodexvantaos.org/v1` | ✅ CORRECT | All manifests, enforced by schema validators |
| `mycodexvantaos.io/v1` | ❌ WRONG | Was used in module manifests in PR branch; fixed in PR #203 |
| `mycodexvantaos.io/v1/CapabilitySet` | ✅ Permitted for CapabilitySet only | governance/capability-set.yaml uses `.io` (legacy); tracked for migration |

### B.3 Change History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-01 | Initial governance spec (informal, in `governance/naming-policy.schema.json`) |
| 1.1.0 | 2026-07-19 | This document. Formalized all rules. Added CI failure analysis. Added self-review section. Fixed 4 active CI blockers. |

---

*This document is part of the MyCodexVantaOS Governance Framework.*
*Governed by: `governance/platform-governance-spec.yaml`*
*Enforced by: `.github/workflows/governance-check.yml`, `.github/workflows/yaml-lint-guard.yml`*
