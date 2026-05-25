# Autopilot Workflow Instructions

## Pre-Flight Checklist

Before starting any autonomous task, verify:

- [ ] Current branch is correct (create feature branch if needed)
- [ ] Working directory is clean (`git status`)
- [ ] Dependencies are installed (`node_modules/` exists)
- [ ] TypeScript compiles cleanly (`npm run typecheck`)
- [ ] Understand which platform layer the task affects

## Standard Autopilot Workflow

### Phase 1: Exploration

1. Read the relevant source files to understand current state
2. Identify affected packages, modules, and services
3. Check for existing patterns to follow
4. Review any related contracts or schemas
5. Check governance rules that may apply

### Phase 2: Planning (for non-trivial changes)

1. Determine if changes span multiple layers
2. Identify potential breaking changes
3. List files to be created/modified/deleted
4. Verify changes respect architecture invariants:
   - Local-first: Does this require external dependencies?
   - Provider-agnostic: Is business logic decoupled from SDKs?
   - Contract-first: Are interfaces defined before implementation?
   - Governance-enforced: Will CI gates pass?

### Phase 3: Implementation

1. Write code following existing patterns
2. Add JSDoc comments for public APIs
3. Use TypeScript strict mode
4. Follow naming convention: `mycodexvantaos-<domain>-<capability>`
5. Use Provider abstraction for external services
6. Handle errors with typed error classes

### Phase 4: Validation

Execute in order:

```bash
# 1. TypeScript compilation
npm run typecheck

# 2. Code formatting
npm run format:check
# If fails: npm run format && re-check

# 3. Governance compliance
npm run governance:check

# 4. Contract validation (if contracts modified)
npm run contracts:validate

# 5. Tests (if available for affected area)
npm run test:services
npm run test:contracts

# 6. Python validation (if Python modified)
npm run python:lint
npm run python:typecheck
npm run python:test
```

### Phase 5: Commit & Finalize

1. Stage changes: `git add -A`
2. Review staged changes: `git diff --cached --stat`
3. Commit with conventional message:
   - `feat: <description>` — New feature
   - `fix: <description>` — Bug fix
   - `docs: <description>` — Documentation
   - `refactor: <description>` — Code restructuring
   - `chore: <description>` — Maintenance
   - `test: <description>` — Test additions
4. Push to feature branch (never directly to main for non-trivial changes)

## Failure Recovery

### TypeScript Errors

1. Read the error messages carefully
2. Fix type errors in order (some cascade)
3. Re-run `npm run typecheck`
4. If stuck after 3 attempts, ask for guidance

### Governance Failures

1. Read the governance error output
2. Common issues:
   - Naming convention violation → Rename to `mycodexvantaos-<domain>-<capability>`
   - Missing capability declaration → Add to `governance.json`
   - Architecture compliance → Check layer boundaries
3. Re-run `npm run governance:check`

### Contract Validation Failures

1. Check `packages/mycodexvantaos-contracts-sdk/` for schema definitions
2. Ensure implementation matches contract
3. If contract needs updating, modify contract first, then implementation
4. Re-run `npm run contracts:validate`

### Hook Blocks

1. If `agentStop` hook blocks completion: fix typecheck errors
2. If `preToolUse` hook denies: the operation is not allowed, find alternative approach
3. Never disable or bypass hooks

## Context Management

- Use `/compact` when context grows large
- Use `@filepath` to reference specific files
- Use `/add-dir` to add related directories to context
- Save important findings to temporary notes
- Use `/clear` between unrelated tasks
