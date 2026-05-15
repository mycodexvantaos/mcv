# MyCodeXvantaOS Python Intelligence Plane

> **TypeScript Control Plane + Python Intelligence Plane**

The Python workspace provides AI/ML capabilities that complement the TypeScript control plane:

- **Memory Dream**: Temporal memory consolidation, conflict detection, semantic clustering
- **Knowledge Pipeline**: Document parsing, embedding generation, RAG retrieval
- **Agent Workers**: Self-hosted AI worker runtime for local execution
- **Evaluation**: AI system evaluation and testing tools

## Architecture

```
mycodexvantaos/
├── packages/              # TypeScript Control Plane
├── services/              # TypeScript Platform Services
├── python/                # Python Intelligence Plane
│   ├── packages/
│   │   └── mycodexvantaos-memory-dream/  # Core dream processing
│   ├── apps/
│   │   └── dream-worker/                    # Dream execution worker
│   └── tests/
```

## Cross-Language Communication

TypeScript and Python communicate through **contracts**:

```
contracts/schemas/
├── memory-item.schema.json
├── dream-run.schema.json
├── dream-action.schema.json
└── dream-report.schema.json
```

### Communication Flow

1. **TypeScript API** creates a `dream-run` record
2. **Python Worker** reads the job from the database
3. **Python** processes memory items and generates `dream-actions`
4. **Python** writes `dream-report` back to database
5. **TypeScript** reads results for audit/UI

## Quick Start

```bash
# Install uv (fast Python package installer)
pip install uv

# Install dependencies
uv sync --extra dev --extra dream

# Run tests
pytest

# Run dream worker
uv run python -m apps.dream_worker.main
```

## Packages

| Package                       | Description                         |
| ----------------------------- | ----------------------------------- |
| `mycodexvantaos-memory-dream` | Core memory dream processing engine |

## Apps

| App            | Description                   |
| -------------- | ----------------------------- |
| `dream-worker` | Memory dream execution worker |

## Development

```bash
# Lint and format
uv run ruff check .
uv run ruff format .

# Type checking
uv run mypy python/packages/

# Run tests with coverage
uv run pytest --cov=python/packages --cov-report=html
```

## Tech Stack

- **Package Manager**: `uv` (fast Rust-based resolver)
- **Data Models**: `pydantic`
- **Testing**: `pytest`
- **Linting**: `ruff`
- **Type Checking**: `mypy`
- **ML/NLP**: `scikit-learn` (MVP), `sentence-transformers` (future)

## License

MIT License — see `../../LICENSE` for details.
