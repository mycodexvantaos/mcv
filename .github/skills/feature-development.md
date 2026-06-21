# Skill: Feature Development

## Description

This skill guides Copilot through the standard feature development workflow for the MyCodeXvantaOS platform, ensuring all architecture invariants and governance rules are followed.

## Architecture Invariants Checklist

Before implementing any feature, verify it respects:

- [ ] **Local-first**: Does the feature work without external dependencies?
- [ ] **Provider-agnostic**: Is business logic decoupled from third-party SDKs?
- [ ] **Contract-first**: Are interfaces defined before implementation?
- [ ] **Governance-enforced**: Does naming follow conventions?

## Workflow

### 1. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/<feature-name>
```

### 2. Explore Existing Code

Before writing code, understand the relevant parts:

- Read related source files
- Check existing patterns and conventions
- Identify affected modules and their dependencies
- Review related contracts in `packages/mycodexvantaos-contracts-sdk/`
- Check governance rules that apply

### 3. Define Contracts (if new interfaces)

For features that introduce new service interfaces:

```bash
# Define contract in packages/mycodexvantaos-contracts-sdk/
# Validate
npm run contracts:validate
```

### 4. Plan Implementation

For complex features, create a plan:

```
/plan <description of the feature>
```

Consider:

- Which platform layer does this belong to?
- Which packages/services are affected?
- Does this need a new service? (Follow naming: `mycodexvantaos-<domain>-<capability>`)
- Does this need Provider abstraction?

### 5. Implement

- Write TypeScript with strict mode
- Follow existing patterns in the codebase
- Add JSDoc comments for public APIs
- Use Provider abstraction for external services
- Keep changes focused and atomic
- Handle errors with typed error classes

### 6. Validate

```bash
# TypeScript
npm run typecheck

# Formatting
npm run format:check
# If fails: npm run format

# Governance
npm run governance:check

# Contracts (if modified)
npm run contracts:validate

# Tests
npm run test:services
npm run test:contracts

# Python (if applicable)
npm run python:lint
npm run python:typecheck
npm run python:test
```

### 7. Commit

```bash
git add -A
git commit -m "feat: <concise description>"
```

### 8. Create Pull Request

```bash
gh pr create --title "feat: <description>" --body "<detailed description>

## Changes
- ...

## Architecture Compliance
- [x] Local-first
- [x] Provider-agnostic
- [x] Contract-first
- [x] Governance-enforced

## Validation
- [x] npm run typecheck
- [x] npm run governance:check
- [x] npm run contracts:validate
"
```

## Feature Types

### New Package

```bash
mkdir packages/<name>
# Create: package.json, tsconfig.json, src/index.ts
# Export public API from src/index.ts
# Add JSDoc for all exports
npm run governance:check
```

### New Service

```bash
mkdir services/mycodexvantaos-<domain>-<capability>
# Create: package.json, tsconfig.json, src/index.ts, README.md
# Define contracts first
# Add to governance.json if new capabilities
npm run governance:check
```

### New Module

```bash
mkdir modules/mycodexvantaos-<domain>-<capability>
# Modules compose packages and services
# Create: package.json, tsconfig.json, src/index.ts
npm run governance:check
```

### New Python Service

```bash
mkdir python/apps/<service-name>
# Create: main.py, __init__.py, README.md
# Add to pyproject.toml
# Create CI workflow in .github/workflows/
npm run python:lint
npm run python:typecheck
```

## Conventions

- Branch naming: `feat/<name>`, `fix/<name>`, `docs/<name>`, `refactor/<name>`
- Commit messages: conventional commits format
- PR descriptions: include what, why, how, and architecture compliance
- Always request review before merging
- All validation must pass before merge
