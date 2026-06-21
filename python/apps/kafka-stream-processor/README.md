# Kafka Stream Processor App

FastAPI service and CLI for real-time stream processing with Apache Kafka.

## Usage

```bash
# Start the HTTP API server
cd python && uv run python apps/kafka-stream-processor/main.py serve

# Run as a CLI consumer
cd python && uv run python apps/kafka-stream-processor/main.py consume --topic my-topic

# Run as a CLI producer
cd python && uv run python apps/kafka-stream-processor/main.py produce --topic my-topic --message '{"key": "value"}'
```

## Configuration

| Environment Variable      | Default          | Description                  |
| ------------------------- | ---------------- | ---------------------------- |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker address(es)     |
| `LOG_LEVEL`               | `INFO`           | Logging level                |
| `HOST`                    | `0.0.0.0`        | API server bind host         |
| `PORT`                    | `8001`           | API server bind port         |
| `DATABASE_URL`            | _(empty)_        | Optional database connection |

## API Endpoints

- `GET /health` — Health check
- `POST /produce` — Produce a message to a topic
- `POST /processors` — Create a stream processor
- `GET /processors/{processor_id}` — Get processor status
- `DELETE /processors/{processor_id}` — Stop a processor
- `GET /metrics` — Stream processing metrics
