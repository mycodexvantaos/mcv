# Semantic Core Integration

Complete integration of Semantic Core with Python backend for advanced decision-making and analysis.

## Components

### 1. TypeScript Client (`../semantic-core-client/typescript/`)

Full-featured TypeScript/Node.js client for Semantic Core API.

**Features**:

- Async/await support
- Automatic retry with exponential backoff
- Comprehensive error handling
- Request tracing and logging
- Type-safe API

**Usage**:

```typescript
import { SemanticCoreClient } from '@mycodexvantaos/semantic-core-client';

const client = new SemanticCoreClient({
  baseUrl: 'http://localhost:8001',
});

const decision = await client.decide({
  hypothesis: 'This is a valid action',
  evidence: [
    {
      source: 'internal_primary',
      content: 'Evidence supporting the hypothesis',
      confidence: 0.95,
      timestamp: new Date(),
    },
  ],
});

console.log(decision.verdict); // ALLOW, DENY, or ABSTAIN
```

### 2. Python Backend (`backend/`)

Python integration layer with decision pipeline and feedback loops.

**Modules**:

- `decision_pipeline.py` - Main decision orchestration
- `feedback_loop.py` - Adaptive learning and optimization

**Usage**:

```python
from backend.decision_pipeline import DecisionPipeline, Evidence, DecisionParameters
from datetime import datetime

pipeline = DecisionPipeline()

evidence = [
    Evidence(
        source='internal_primary',
        content='Evidence text',
        confidence=0.95,
        timestamp=datetime.now(),
    ),
]

result = await pipeline.process(
    hypothesis='Test hypothesis',
    evidence=evidence,
)

print(result.verdict)  # ALLOW, DENY, or ABSTAIN
```

### 3. Infrastructure (`infrastructure/`)

Docker and CI/CD setup for production deployment.

**Services**:

- Semantic Core API (Node.js, port 8001)
- Python Backend (port 8002)
- Redis (port 6379)
- PostgreSQL (port 5432)

**Start services**:

```bash
cd infrastructure/docker
docker-compose up -d
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐     ┌───────▼──────────┐
│ TypeScript Client│     │ Python Backend   │
│  (REST/tRPC)     │     │ (FastAPI)        │
└───────┬──────────┘     └───────┬──────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Semantic Core API     │
        │   (Decision Engine)     │
        └────────────┬────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────┐          ┌────────▼─────┐
    │ Redis  │          │  PostgreSQL  │
    │ Cache  │          │  Persistence │
    └────────┘          └──────────────┘
```

## Development

### Setup

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Run tests
npm test
python -m pytest

# Start development servers
npm run dev
python -m uvicorn backend.main:app --reload
```

### Testing

```bash
# TypeScript tests
cd packages/semantic-core-client/typescript
npm test

# Python tests
cd packages/semantic-core-integration/backend
python -m pytest tests/
```

## Deployment

### Docker

```bash
cd infrastructure/docker
docker-compose up -d
```

### Kubernetes

```bash
kubectl apply -f infrastructure/k8s/
```

## API Reference

### Decision Endpoint

**Request**:

```json
{
  "hypothesis": "string",
  "evidence": [
    {
      "source": "internal_primary|internal_secondary|external_peer_reviewed|external_standard|global_news|global_forum",
      "content": "string",
      "confidence": 0.0-1.0,
      "timestamp": "ISO8601",
      "tags": ["string"]
    }
  ],
  "parameters": {
    "evidence_sufficiency_threshold": 0.7,
    "hypothesis_confidence_min": 0.6,
    "risk_tolerance": 0.5,
    "enable_feedback": true
  }
}
```

**Response**:

```json
{
  "verdict": "ALLOW|DENY|ABSTAIN",
  "confidence": 0.0-1.0,
  "reasoning": "string",
  "scores": {
    "evidence_sufficiency": 0.0-1.0,
    "hypothesis_validation": 0.0-1.0,
    "action_priority": 0.0-1.0
  },
  "vectorAnalysis": {
    "hypothesis_vector": [number],
    "evidence_clusters": [
      {
        "id": "string",
        "size": number,
        "centroid": [number],
        "semantic_coherence": 0.0-1.0
      }
    ],
    "semantic_distances": [number]
  },
  "audit": {
    "request_id": "string",
    "timestamp": "ISO8601",
    "processing_time_ms": number
  }
}
```

## Monitoring

### Health Checks

```bash
# Semantic Core
curl http://localhost:8001/health

# Python Backend
curl http://localhost:8002/health
```

### Metrics

```bash
# Prometheus metrics
curl http://localhost:8001/metrics
curl http://localhost:8002/metrics
```

## Troubleshooting

### Connection Issues

If services can't communicate:

1. Verify Docker network: `docker network ls`
2. Check service health: `docker-compose ps`
3. Review logs: `docker-compose logs [service-name]`

### Performance Issues

1. Check Redis: `redis-cli INFO`
2. Monitor PostgreSQL: `psql -U mycodex -d mycodex -c "SELECT * FROM pg_stat_statements;"`
3. Review application logs

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests: `npm test && python -m pytest`
4. Submit PR

## License

MIT
