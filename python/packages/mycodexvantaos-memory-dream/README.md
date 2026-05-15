# mycodexvantaos-memory-dream

Memory Dream Processing Engine — Temporal consolidation, conflict detection & semantic clustering.

## Features

- **Duplicate Detection**: Identify duplicate memory items
- **Conflict Detection**: Detect explicit `conflicts_with` relationships
- **Orphan Detection**: Find orphaned `related_entities`
- **Temporal Normalization**: Normalize temporal expressions
- **Semantic Clustering**: Group related memories (TF-IDF + Cosine Similarity MVP)
- **Dream Action Generation**: Suggest actions to fix issues

## Data Models

```python
from mycodexvantaos_memory_dream import MemoryItem, DreamRun, DreamAction, DreamReport

# Memory item
memory = MemoryItem(
    memory_id="mem_001",
    content="System updated at 2024-01-15",
    tags=["system", "update"],
    related_entities=["system-001"],
    temporal_expressions=["2024-01-15"],
    memory_type="observation",
)

# Run dream session
dream_run = DreamRun.from_memory_items([memory])
report = dream_run.run()
```

## Dependencies

Core:
- `pydantic` — Data validation
- `pydantic-settings` — Configuration

Optional (for ML features):
- `scikit-learn` — TF-IDF, clustering
- `numpy` — Vector operations

## License

MIT License