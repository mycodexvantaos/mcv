# ci-repair-agent

CI Repair Agent — FastAPI service and CLI for GitHub Actions auto-repair in MyCodeXvantaOS.

## Usage

### CLI

```bash
# Analyze the latest failed run
python -m main analyze --token $GITHUB_TOKEN

# Analyze a specific run
python -m main analyze --token $GITHUB_TOKEN --run-id 12345 --output plan.json

# Start the API server
python -m main serve --token $GITHUB_TOKEN --port 8000
```

### API

```bash
# Health check
curl http://localhost:8000/health

# List workflow runs
curl http://localhost:8000/api/runs

# Analyze a failed run
curl http://localhost:8000/api/runs/12345/analyze

# Trigger repair with PR creation
curl -X POST http://localhost:8000/api/runs/12345/repair \
  -H "Content-Type: application/json" \
  -d '{"run_id": 12345, "create_branch": true, "create_pr": true}'
```
