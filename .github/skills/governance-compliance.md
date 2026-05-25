# Skill: Governance Compliance

## Description

This skill helps ensure all code changes comply with MyCodeXvantaOS governance rules. Governance is machine-enforced — non-compliant code will be blocked by CI.

## Governance Principles

1. All rules are machine-readable and auto-enforceable
2. CI/CD gates automatically verify compliance
3. Non-compliant code is blocked from merging
4. Governance rules are defined in `governance.json`

## Quick Check

```bash
# Run governance check
npm run governance:check

# Run policy check (same command)
npm run policy:check
```

## Naming Conventions

### Services

Pattern: `mycodexvantaos-<domain>-<capability>`

Valid examples:
- `mycodexvantaos-ai-memory`
- `mycodexvantaos-core-gateway`
- `mycodexvantaos-platform-scheduler`

Invalid examples:
- `memory-service` (missing prefix)
- `mycodexvantaos-memory` (missing domain)
- `MyCodeXvantaOS-AI-Memory` (wrong case)

### Packages

Pattern: `@mycodexvantaos/<capability>`

Valid examples:
- `@mycodexvantaos/core-gateway`
- `@mycodexvantaos/ai-agent`
- `@mycodexvantaos/security-validation`

### Capabilities

Pattern: `urn:mycodexvantaos:capability:<name>`

Examples:
- `urn:mycodexvantaos:capability:builder`
- `urn:mycodexvantaos:capability:runtime`
- `urn:mycodexvantaos:capability:service-discovery`

## Architecture Compliance

### Layer Boundaries

```
Builder Layer → Can depend on: nothing (generates output)
Runtime Layer → Can depend on: core packages only
Native Services → Can depend on: runtime, core packages
AI Layer → Can depend on: runtime, core, Genkit
Python Plane → Communicates via: HTTP APIs (contracts)
```

### Forbidden Patterns

- Cross-service direct imports (use contracts/APIs)
- Circular dependencies between packages
- Business logic importing third-party SDKs directly
- Services depending on Builder layer

## Contract Compliance

```bash
# Validate all contracts
npm run contracts:validate

# Test contracts
npm run test:contracts
```

### Contract Rules

1. All service interfaces must have a contract definition
2. Contracts live in `packages/mycodexvantaos-contracts-sdk/`
3. Implementation must match contract exactly
4. Breaking changes require version bump and migration plan

## Fixing Governance Failures

### Naming Violation

```bash
# Check the error output
npm run governance:check 2>&1 | grep "naming"

# Fix: rename directory/package to follow convention
mv services/bad-name services/mycodexvantaos-<domain>-<capability>
# Update package.json name field
# Update all imports
```

### Missing Capability Declaration

```bash
# Add to governance.json
# Under the appropriate layer's capabilities array
# Format: "urn:mycodexvantaos:capability:<name>"
```

### Architecture Violation

```bash
# Check which dependency is violating layer boundaries
# Remove the forbidden import
# Use the appropriate abstraction (Provider pattern, contracts)
```

## Adding New Governance Rules

1. Define the rule in `tools/governance/`
2. Add enforcement logic to `tools/governance/check.ts`
3. Test with `npm run governance:check`
4. Document in this file
5. Ensure CI workflow includes the check
