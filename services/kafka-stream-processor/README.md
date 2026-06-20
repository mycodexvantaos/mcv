# Kafka Stream Processor

Real-time stream processing service for MyCodeXvantaOS, built on Apache Kafka with exactly-once semantics, windowed aggregations, and Prometheus metrics.

## Architecture

```
┌─────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  Producer    │────▶│  Kafka Topic         │────▶│  Consumer    │
│  (HTTP/CLI)  │     │  (input-topic)       │     │  (Group)     │
└─────────────┘     └──────────────────────┘     └──────┬───────┘
                                                         │
                                                         ▼
                    ┌──────────────────────────────────────────────┐
                    │           Stream Processor                   │
                    │  ┌─────────┐  ┌───────────┐  ┌───────────┐ │
                    │  │Transform│─▶│Aggregate/ │─▶│Window     │ │
                    │  │(filter/ │  │Reduce     │  │(tumbling/ │ │
                    │  │ map)    │  │           │  │ hopping)  │ │
                    │  └─────────┘  └───────────┘  └───────────┘ │
                    └──────┬──────────────┬───────────────────────┘
                           │              │
                           ▼              ▼
                    ┌──────────────┐  ┌──────────────┐
                    │ Output Topic │  │ DLQ Topic    │
                    │ (results)    │  │ (failures)   │
                    └──────────────┘  └──────────────┘
```

## Features

- **Stream Producer** — HTTP API and CLI for producing messages with configurable delivery semantics (at-most-once, at-least-once, exactly-once)
- **Stream Consumer** — Consumer groups with manual offset commit, read_committed isolation for exactly-once
- **Stream Processor** — Transform, aggregate, and window operations on streaming data
- **Windowing** — Tumbling and hopping windows with grace periods for late data
- **Exactly-once Semantics** — Transactional producers and read_committed consumers
- **Dead-letter Queues** — Automatic routing of failed messages with original metadata
- **Prometheus Metrics** — Throughput, latency, error rates, consumer lag at `/metrics`
- **FastAPI HTTP API** — RESTful endpoints for pipeline management
- **CLI** — Produce, consume, admin, and serve subcommands

## Quick Start

### Using Docker Compose (Recommended)

```bash
cd services/kafka-stream-processor
cp .env.example .env
docker compose up -d
```

This starts Kafka (KRaft mode), PostgreSQL, and the stream processor service.

### Using CLI

```bash
# Install the package
cd python
uv sync --all-packages

# Produce a message
uv run kafka-stream-processor produce \
  --topic test-events \
  --value '{"event": "click", "user": "u-123"}' \
  --bootstrap-servers localhost:9092

# Consume messages
uv run kafka-stream-processor consume \
  --topic test-events \
  --group-id my-consumer \
  --max-records 10

# Admin operations
uv run kafka-stream-processor admin list \
  --bootstrap-servers localhost:9092

# Start HTTP API server
uv run kafka-stream-processor serve \
  --port 8001 \
  --bootstrap-servers localhost:9092
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with Kafka connectivity status |
| GET | `/metrics` | Prometheus-compatible metrics |
| GET | `/api/topics` | List all Kafka topics |
| POST | `/api/topics` | Create a new topic |
| GET | `/api/topics/{name}` | Describe a topic |
| DELETE | `/api/topics/{name}` | Delete a topic |
| POST | `/api/produce` | Produce a message to a topic |
| POST | `/api/consume` | Consume messages from a topic |
| POST | `/api/processors` | Create a stream processor |
| POST | `/api/processors/{name}/start` | Start a processor |
| POST | `/api/processors/{name}/stop` | Stop a processor |
| GET | `/api/processors/{name}` | Get processor status |
| GET | `/api/processors` | List all processors |

### Example: Create and Run a Processor

```bash
# Create a processor
curl -X POST http://localhost:8001/api/processors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "event-enricher",
    "input_topics": ["raw-events"],
    "output_topic": "enriched-events",
    "error_topic": "dlq.raw-events",
    "delivery_semantic": "at_least_once"
  }'

# Start the processor
curl -X POST http://localhost:8001/api/processors/event-enricher/start

# Check status
curl http://localhost:8001/api/processors/event-enricher

# Stop the processor
curl -X POST http://localhost:8001/api/processors/event-enricher/stop
```

### Example: Produce and Consume

```bash
# Produce a message
curl -X POST http://localhost:8001/api/produce \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "test-events",
    "key": "user-1",
    "value": {"event": "page_view", "page": "/home"}
  }'

# Consume messages
curl -X POST http://localhost:8001/api/consume \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "test-events",
    "group_id": "api-consumer-1",
    "max_records": 10,
    "timeout_ms": 5000
  }'
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka cluster address |
| `LOG_LEVEL` | `INFO` | Logging level |
| `HOST` | `0.0.0.0` | HTTP server bind address |
| `PORT` | `8001` | HTTP server port |
| `DATABASE_URL` | _(empty)_ | PostgreSQL connection string |

## Delivery Semantics

| Semantic | Producer | Consumer | Use Case |
|----------|----------|----------|----------|
| At-most-once | No retries | Commit before processing | Metrics, counters (loss acceptable) |
| At-least-once | Retries with acks=all | Commit after processing | Event sourcing (duplicates tolerable) |
| Exactly-once | Transactional + idempotent | read_committed isolation | Financial transactions, dedup required |

## Window Types

| Window | Description | Example |
|--------|-------------|---------|
| Tumbling | Fixed-size, non-overlapping | 1-minute count of events |
| Hopping | Fixed-size, overlapping | 5-minute average every 1 minute |
| Sliding | Based on data patterns | Session windows by user activity |
| Session | Grouped by inactivity gap | User sessions with 30-min timeout |

## Metrics

The `/metrics` endpoint exposes Prometheus-compatible metrics:

```
stream_messages_consumed{processor="my-processor"} 1042
stream_messages_produced{processor="my-processor"} 1038
stream_messages_errored{processor="my-processor"} 4
stream_dead_letter_count{processor="my-processor"} 4
stream_consumer_lag{processor="my-processor"} 12
stream_processing_latency_ms{processor="my-processor"} 5.2
stream_throughput_per_second{processor="my-processor"} 156.3
stream_window_results_count{processor="my-processor"} 60
```

## Testing

```bash
cd python
uv sync --extra dev --all-packages
uv run pytest tests/test_stream_pipeline_* -v
```

## Related

- Library package: `python/packages/mycodexvantaos-stream-pipeline/`
- ADR: `docs/adr/adr-0012-kafka-stream-pipeline.md`
- Module manifest: `modules/mycodexvantaos-stream-pipeline/module-manifest.yaml`
