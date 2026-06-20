## Memory Dream Operations Instructions

This document provides modular instructions for managing the memory persistence loop and interacting with the `mycodexvantaos-memory-dream` engine.

### 1. Memory Persistence Loop

To ensure continuity and reusability, agents must follow this loop for every task:
- **Pre-Task (Fetch)**: Query the memory engine for `MemoryItem`s with matching `tags` or `related_entities`.
- **Task Execution**: Incorporate retrieved memories into the decision-making process.
- **Post-Task (Emit)**: Record the task's outcome as a new `MemoryItem`.

### 2. Formatting MemoryItems

Every emitted memory MUST follow the `mycodexvantaos-memory-dream` schema:
- **`memory_id`**: A unique URN (e.g., `urn:mycodexvantaos:memory:task-456`).
- **`content`**: A concise summary of the action and its result.
- **`tags`**: Relevant categories (e.g., `governance`, `ci-cd`, `refactoring`).
- **`related_entities`**: URNs of affected resources (e.g., `urn:mycodexvantaos:repo:mycodexvantaos-auth-service`).
- **`temporal_expressions`**: ISO 8601 timestamps or relative temporal markers.
- **`memory_type`**: `observation`, `decision`, or `action`.

### 3. Handling DreamActions

When the `DreamRun` report suggests `DreamAction`s, agents must:
1. **Analyze**: Review the suggested actions for conflict resolution or semantic clustering.
2. **Execute**: Prioritize these actions before proceeding with new feature development.
3. **Verify**: Ensure the actions resolve the identified memory conflicts or orphans.

### 4. Integration with AI Tasks

- **Input Context**: Attach relevant `MemoryItem` IDs to the `ai-task` input manifest.
- **Output Artifacts**: Include the `DreamReport` and new `MemoryItem`s in the `ai-task` completion evidence.

### 5. Automated Remediation

- **Duplicate Detected**: Merge overlapping memories into a single canonical `MemoryItem`.
- **Conflict Detected**: Flag the conflict for human review or follow the pre-defined resolution policy.
- **Orphan Detected**: Re-link orphaned entities to their correct parent modules or services.

Agents must refer to these instructions to maintain a high-fidelity, actionable memory state within the platform.
