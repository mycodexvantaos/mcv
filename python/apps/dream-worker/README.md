# Dream Worker App

Command-line tool for executing memory dream processing.

## Usage

```bash
# Dream run with subcommand (recommended)
cd python && uv run python apps/dream-worker/main.py run --mode dry-run
cd python && uv run python apps/dream-worker/main.py run --mode proposal
cd python && uv run python apps/dream-worker/main.py run --mode execute

# With input file
cd python && uv run python apps/dream-worker/main.py run --mode dry-run memories.json

# Save report to file
cd python && uv run python apps/dream-worker/main.py run --mode dry-run memories.json -o dream-report.json

# JSON output (for TS integration)
cd python && uv run python apps/dream-worker/main.py run --mode dry-run --json

# Stdin input (for TS→Python child process)
echo '[{"memory_id":"mem_001","content":"Test"}]' | uv run python apps/dream-worker/main.py run --stdin --json --mode dry-run

# Legacy direct invocation
cd python && uv run python apps/dream-worker/main.py memories.json
```

## Modes

| Mode | dry_run | proposal_mode | Description |
|------|---------|---------------|-------------|
| `dry-run` | ✅ | ✅ | Report only, no changes |
| `proposal` | ✅ | ✅ | Suggest actions but don't auto-apply |
| `execute` | ❌ | ❌ | Execute actions and apply changes |

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

## TS Integration

The `--stdin --json` flags enable TypeScript→Python integration via child process:

```typescript
import { spawn } from 'node:child_process';

const proc = spawn('python', [
  'python/apps/dream-worker/main.py', 'run',
  '--stdin', '--json', '--mode', 'dry-run'
]);

proc.stdin.write(JSON.stringify(memoryItems));
proc.stdin.end();

let output = '';
proc.stdout.on('data', (data) => { output += data; });
proc.on('close', () => {
  const report = JSON.parse(output);
  // Use dream report...
});
```
