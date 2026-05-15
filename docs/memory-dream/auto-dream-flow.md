# Auto-Dream Flow

## Overview

The auto-dream flow is the automated memory consolidation process that runs
periodically to maintain the health and relevance of the memory store.

## Flow Diagram

```
[Scheduled Trigger]
    -> [TS: memory-capture service] (collect recent events)
    -> [TS: policy engine] (check dream policy)
    -> [D1 Job Table] (enqueue dream job)
    -> [Python: dream-worker] (execute dream)
        -> [Load Memories] (fetch from store)
        -> [Consolidate] (merge, deprecate, reinforce)
        -> [Generate Proposals] (if in proposal mode)
        -> [Apply Changes] (if in auto-apply mode)
    -> [Report] (write dream report)
    -> [TS Audit] (record dream completion)
```

## Dream Modes

### dry-run

- Evaluates all memories and computes what changes would be made
- No mutations to the memory store
- Returns a preview of proposed changes

### proposal (default)

- Generates consolidation proposals
- Proposals require human review before application
- Proposals include: merge candidates, deprecation candidates, reinforcement confirmations

### auto-apply

- Automatically applies all consolidation changes
- NOT enabled by default
- Architecture decision memories are ALWAYS excluded from auto-apply
- Requires explicit opt-in per workspace

## Safety Constraints

1. Architecture decision memories are never auto-deprecated or auto-merged
2. Reinforced memories require at least 3 independent confirmations
3. Deprecated memories are retained for 30 days before archival
4. All dream operations are fully auditable
5. Dream proposals expire after 7 days if not reviewed
