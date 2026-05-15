# Dream Worker App

Command-line tool for executing memory dream processing.

## Usage

```bash
# Basic usage
uv run python -m apps.dream_worker.main memories.json

# Save report to file
uv run python -m apps.dream_worker.main memories.json -o dream-report.json

# Execute actions (not dry-run)
uv run python -m apps.dream_worker.main memories.json --no-dry-run

# Auto-apply actions (not just proposal)
uv run python -m apps.dream_worker.main memories.json --no-proposal-mode
```

## Input Format

Input JSON file should contain an array of memory items:

```json
[
  {
    "memory_id": "mem_001",
    "content": "System updated at 2024-01-15",
    "tags": ["system", "update"],
    "related_entities": [],
    "temporal_expressions": ["2024-01-15"],
    "memory_type": "observation"
  },
  {
    "memory_id": "mem_002",
    "content": "System updated at 2024-01-15",
    "tags": ["system", "update"],
    "related_entities": [],
    "temporal_expressions": ["2024-01-15"],
    "memory_type": "observation"
  }
]
```

## Output Format

Output JSON file contains the dream report:

```json
{
  "dream_run_id": "urn:mycodexvantaos:dream:...",
  "processed_at": "2024-01-15T...",
  "total_memories": 2,
  "duplicates_found": 1,
  "conflicts_found": 0,
  "orphans_found": 0,
  "actions": [
    {
      "action_type": "merge",
      "target_memory_id": "...",
      "related_memory_id": "...",
      "reason": "Duplicate of ...",
      "confidence": 0.95
    }
  ],
  "statistics": {...}
}
```
