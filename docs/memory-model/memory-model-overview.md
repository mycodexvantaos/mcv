# Memory Model Overview

## Purpose

The Memory Model manages the platform's memory system: capturing, storing,
consolidating, and retrieving memories. The Dream subsystem handles automated
memory consolidation.

## Architecture

- **Package**: `@mycodexvantaos/memory-model` (TS types)
- **Python Package**: `mycodexvantaos-memory-dream` (dream execution)
- **Contract**: `contracts/events/memory-events.yaml`
- **Schema**: `contracts/schemas/memory-model.schema.json`

## Memory Lifecycle

1. **Capture**: Events and interactions are captured as memory items
2. **Store**: Memory items are stored with metadata and embeddings
3. **Dream**: Automated consolidation runs (dry-run, proposal, auto-apply)
4. **Retrieve**: Memory items are retrieved for context injection

## Dream System

The Dream system has three modes:
- **dry-run**: Evaluate only, no changes written
- **proposal** (default): Generate proposals for human review
- **auto-apply**: Automatically apply changes (not enabled by default)

### Architecture Decision Protection

Architecture decision memories must NOT be auto-deprecated or auto-merged
without explicit human review. This is a non-negotiable constraint.

## Memory Statuses

| Status | Description | Injectable |
|---|---|---|
| `candidate` | Newly created, not yet validated | No |
| `active` | Validated and in use | Yes |
| `reinforced` | Confirmed by multiple sources | Yes |
| `merged` | Merged from multiple candidates | No |
| `deprecated` | Superseded or invalidated | No |
| `orphaned` | No references found | No |
| `archived` | Historical, not active | No |
| `rejected` | Failed validation | No |

Only `active` and `reinforced` memories may be injected into prompts.
