# ADR 0012: Real-Time Kafka Stream Processing Pipeline

**Date**: 2026-05-21
**Status**: Accepted
**Context**: Data Processing Pipeline Enhancement

## Context

MyCodeXvantaOS requires a real-time data processing pipeline capable of ingesting, transforming, aggregating, and windowing streaming data. The existing `mycodexvantaos-data-pipeline` module provides batch-oriented data ingestion via PostgreSQL and RabbitMQ, but lacks stream processing capabilities for real-time event correlation, tumbling/hopping windows, and exactly-once delivery guarantees.

The platform already uses Python 3.11 with FastAPI for services. Adding Apache Kafka as the streaming backbone enables event-driven architecture patterns that the current RabbitMQ queue cannot efficiently support — particularly consumer groups, partition-based parallelism, and Kafka-native exactly-once semantics via transactional producers and consumers.

## Decision

Implement a Kafka stream processing pipeline with the following architecture:

1. **Core library** (`mycodexvantaos-stream-pipeline`) providing:
   - Kafka admin client for topic lifecycle management (create, describe, delete)
   - Stream producer with transactional exactly-once semantics
   - Stream consumer with configurable consumer groups and offset commit strategies
   - Stream processor supporting map, filter, transform, aggregate, and window operations
   - Tumbling and hopping window implementations with watermark-based late data handling
   - Dead-letter queue producer for failed message routing
   - Prometheus-compatible metrics collector for throughput, latency, error rates, and consumer lag
   - Pydantic v2 models for topic configurations, message schemas, and processor definitions

2. **FastAPI service** (`kafka-stream-processor`) providing:
   - HTTP API for pipeline management (create/start/stop processors, list topics, get metrics)
   - CLI with `produce`, `consume`, `process`, `serve`, and `admin` subcommands
   - Health check endpoint with Kafka connectivity status
   - Structured logging with request_id and trace_id propagation

3. **Infrastructure**:
   - Docker multi-stage build with `python:3.11-slim`
   - docker-compose.yml with Kafka (KRaft mode), PostgreSQL, and the stream processor service
   - GitHub Actions CI workflow for lint, test, and Docker build verification

## Key Design Choices

- **aiokafka over confluent-kafka**: aiokafka provides native async/await support aligned with FastAPI's async model. confluent-kafka requires callback-based patterns. aiokafka supports idempotent producers and transactional APIs for exactly-once semantics.
- **KRaft mode over Zookeeper**: Kafka 3.6+ supports KRaft mode without Zookeeper, reducing operational complexity. The docker-compose configuration uses KRaft mode.
- **Python-native windowing**: Window operations are implemented in Python rather than relying on Kafka Streams (Java). This keeps the implementation within the approved language scope (TypeScript/JavaScript, Python, YAML/JSON/Markdown, GitHub Actions).
- **Dead-letter queue pattern**: Failed messages are routed to a dedicated dead-letter topic with original metadata, enabling reprocessing without data loss.
- **Metrics as Prometheus exposition format**: Metrics are exposed via a `/metrics` endpoint compatible with Prometheus scraping, consistent with the platform observability module.

## Consequences

- **Positive**: Real-time stream processing with exactly-once guarantees. Tumbling and hopping windows enable time-based aggregations. Dead-letter queues prevent data loss. Metrics enable operational visibility.
- **Positive**: The pipeline integrates with the existing CI repair agent — CI failure events can be published to Kafka topics, processed in real-time, and correlated with historical patterns.
- **Negative**: Kafka adds operational complexity (brokers, partitions, consumer group management). For simple use cases, RabbitMQ may be more appropriate.
- **Negative**: Python-based windowing has higher latency than Kafka Streams (Java). For sub-millisecond windowing requirements, a Java-based solution would be needed (requires ADR for new runtime language).
- **Risk**: aiokafka transactional API maturity. Mitigated by comprehensive error handling, dead-letter queues, and idempotent producer configuration.

## Alternatives Considered

1. **Kafka Streams (Java)**: Native Kafka stream processing with exactly-once and windowing. Rejected — requires Java runtime not approved in v0.1.x language scope.
2. **Faust (Python)**: Python stream processing library by Robinhood. Rejected — project is archived and no longer maintained. Last release 2020.
3. **Quix Streams (Python)**: Python stream processing using Kafka. Rejected — less mature community and fewer production deployments than aiokafka.
4. **RabbitMQ Streams**: Stream plugin for RabbitMQ. Rejected — does not provide Kafka-level partition parallelism or transactional exactly-once.

## References

- MyCodeXvantaOS Data Pipeline Module: `modules/mycodexvantaos-data-pipeline/`
- MyCodeXvantaOS Platform Observability Module: `modules/mycodexvantaos-platform-observability/`
- aiokafka Documentation: https://aiokafka.readthedocs.io/
