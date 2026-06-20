# MyCodeXvantaOS Stream Pipeline

Kafka stream processing engine for MyCodeXvantaOS — producers, consumers, and processors with exactly-once semantics, windowing, aggregation, and metrics.

## Features

- **Stream Producer**: Transactional and idempotent message production with configurable delivery semantics (at-most-once, at-least-once, exactly-once)
- **Stream Consumer**: Consumer groups with manual offset commit, lag tracking, and read_committed isolation
- **Stream Processor**: Transform, filter, aggregate, and window operations on streaming data
- **Windowing**: Tumbling and hopping windows with configurable grace periods for late data
- **Dead-Letter Queue**: Automatic routing of failed messages with original metadata
- **Metrics**: Prometheus-compatible metrics exposition for throughput, latency, error rates, and consumer lag
- **Kafka Admin**: Topic lifecycle management (create, describe, delete, list)

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Kafka Topic  │────▶│  Stream Processor │────▶│  Kafka Topic  │
│  (input)      │     │  transform/filter │     │  (output)     │
└──────────────┘     │  aggregate/window │     └──────────────┘
                     │  exactly-once      │────▶┌──────────────┐
                     └──────────────────┘     │  DLQ Topic    │
                                              └──────────────┘
```

## Installation

```bash
cd python
uv sync --extra dev --all-packages
```

## Usage

### Producing Messages

```python
from mycodexvantaos_stream_pipeline.models import ProducerConfig, DeliverySemantic
from mycodexvantaos_stream_pipeline.producer import StreamProducer
from mycodexvantaos_stream_pipeline.models import StreamMetrics

config = ProducerConfig(
    bootstrap_servers="localhost:9092",
    delivery_semantic=DeliverySemantic.EXACTLY_ONCE,
    transactional_id="my-txn-id",
)
metrics = StreamMetrics()
producer = StreamProducer(config, metrics)
await producer.start()

await producer.send(topic="events", value={"key": "value"}, key="msg-1")
await producer.stop()
```

### Consuming Messages

```python
from mycodexvantaos_stream_pipeline.models import ConsumerConfig, DeliverySemantic
from mycodexvantaos_stream_pipeline.consumer import StreamConsumer

config = ConsumerConfig(
    bootstrap_servers="localhost:9092",
    group_id="my-consumer-group",
    delivery_semantic=DeliverySemantic.AT_LEAST_ONCE,
)
metrics = StreamMetrics()
consumer = StreamConsumer(config, topics=["events"], metrics=metrics)
await consumer.start()

messages = await consumer.consume(max_records=10, timeout_ms=5000)
await consumer.commit()
await consumer.stop()
```

### Stream Processor with Windowing

```python
from mycodexvantaos_stream_pipeline.models import ProcessorConfig, WindowConfig, WindowType
from mycodexvantaos_stream_pipeline.processor import StreamProcessor

config = ProcessorConfig(
    name="event-aggregator",
    input_topics=["events"],
    output_topic="aggregates",
    error_topic="dlq.events",
    window_config=WindowConfig(
        window_type=WindowType.TUMBLING,
        window_size_ms=60000,
        grace_period_ms=5000,
    ),
)

processor = StreamProcessor(config)
processor.with_aggregate(
    fn=lambda acc, msg: (acc or 0) + 1,
    initial=0,
)
await processor.start()
await processor.run()
```

## Metrics

Metrics are exposed in Prometheus exposition format via the `MetricsCollector`:

```
stream_messages_consumed{processor="event_aggregator"} 1234
stream_messages_produced{processor="event_aggregator"} 1200
stream_processing_latency_ms{processor="event_aggregator"} 12.5
stream_consumer_lag{processor="event_aggregator"} 42
```

## Error Handling

- **Dead-Letter Queue**: Failed messages are routed to a `dlq.<original-topic>` topic with original metadata, error message, and retry count.
- **Exactly-Once Semantics**: Transactional producers ensure atomic writes across input and output topics.
- **Retry with Backoff**: Configurable retry count and backoff for transient failures.

## Testing

```bash
cd python
uv run pytest tests/test_stream_pipeline.py -v
```
