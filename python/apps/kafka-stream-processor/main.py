"""Kafka Stream Processor — FastAPI service and CLI for real-time stream processing.

Provides an HTTP API and CLI for producing, consuming, and processing
Kafka streams with exactly-once semantics, windowing, and metrics.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
import uuid
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException
from mycodexvantaos_stream_pipeline.admin import KafkaAdmin
from mycodexvantaos_stream_pipeline.consumer import StreamConsumer
from mycodexvantaos_stream_pipeline.metrics import MetricsCollector
from mycodexvantaos_stream_pipeline.models import (
    ConsumerConfig,
    DeliverySemantic,
    KafkaTopicConfig,
    OffsetResetStrategy,
    ProcessorConfig,
    ProcessorState,
    ProcessorStatusResponse,
    ProducerConfig,
    ProduceRequest,
    ProduceResponse,
    StreamMetrics,
    WindowConfig,
    WindowType,
)
from mycodexvantaos_stream_pipeline.processor import StreamProcessor
from mycodexvantaos_stream_pipeline.producer import StreamProducer
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


class Settings(BaseModel):
    """Application settings loaded from environment variables."""

    kafka_bootstrap_servers: str = "localhost:9092"
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8001
    database_url: str = ""


def _load_settings() -> Settings:
    """Load settings from environment variables."""
    import os

    return Settings(
        kafka_bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8001")),
        database_url=os.getenv("DATABASE_URL", ""),
    )


settings = _load_settings()

# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------

_metrics_collector = MetricsCollector()
_processors: dict[str, StreamProcessor] = {}
_admin: KafkaAdmin | None = None


def _get_admin() -> KafkaAdmin:
    """Get or create the Kafka admin client."""
    global _admin
    if _admin is None:
        _admin = KafkaAdmin(bootstrap_servers=settings.kafka_bootstrap_servers)
    return _admin


# ---------------------------------------------------------------------------
# API models
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    version: str = "0.1.0"
    kafka_bootstrap: str = ""
    active_processors: int = 0


class TopicListResponse(BaseModel):
    """Response for listing topics."""

    topics: list[str] = Field(default_factory=list)
    count: int = 0


class TopicCreateRequest(BaseModel):
    """Request body for creating a topic."""

    name: str
    num_partitions: int = 3
    replication_factor: int = 1
    retention_ms: int = 604800000


class TopicCreateResponse(BaseModel):
    """Response for creating a topic."""

    success: bool
    topic: str
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class MetricsResponse(BaseModel):
    """Response for metrics endpoint."""

    processors: dict[str, Any] = Field(default_factory=dict)
    prometheus_text: str = ""


class ProcessorCreateRequest(BaseModel):
    """Request body for creating a processor."""

    name: str
    input_topics: list[str]
    output_topic: str = ""
    error_topic: str = ""
    delivery_semantic: DeliverySemantic = DeliverySemantic.AT_LEAST_ONCE
    window_type: WindowType | None = None
    window_size_ms: int = 60000
    hop_size_ms: int = 0
    grace_period_ms: int = 0


class ProcessorCreateResponse(BaseModel):
    """Response for creating a processor."""

    success: bool
    processor_name: str
    state: str
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class ProcessorActionResponse(BaseModel):
    """Response for processor start/stop actions."""

    success: bool
    processor_name: str
    state: str
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """Application lifespan handler."""
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    logger.info(
        "Kafka Stream Processor starting — bootstrap: %s",
        settings.kafka_bootstrap_servers,
    )

    # Try to connect admin client
    try:
        admin = _get_admin()
        await admin.connect()
        logger.info("Kafka admin client connected")
    except Exception:
        logger.warning(
            "Kafka admin client connection failed — topic management unavailable"
        )

    yield

    # Stop all processors
    for name, processor in _processors.items():
        if processor.state == ProcessorState.RUNNING:
            logger.info("Stopping processor '%s' during shutdown", name)
            await processor.stop()

    # Close admin client
    if _admin:
        await _admin.close()

    logger.info("Kafka Stream Processor shutting down")


app = FastAPI(
    title="Kafka Stream Processor",
    description="Real-time stream processing with Apache Kafka for MyCodeXvantaOS",
    version="0.1.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    active = sum(1 for p in _processors.values() if p.state == ProcessorState.RUNNING)
    return HealthResponse(
        status="ok",
        version="0.1.0",
        kafka_bootstrap=settings.kafka_bootstrap_servers,
        active_processors=active,
    )


@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics() -> MetricsResponse:
    """Get Prometheus-compatible metrics for all processors."""
    _metrics_collector.compute_throughput()
    prom_text = _metrics_collector.to_prometheus_format()
    all_metrics = _metrics_collector.get_all_metrics()
    return MetricsResponse(
        processors={name: m.model_dump(mode="json") for name, m in all_metrics.items()},
        prometheus_text=prom_text,
    )


@app.get("/api/topics", response_model=TopicListResponse)
async def list_topics() -> TopicListResponse:
    """List all Kafka topics."""
    admin = _get_admin()
    try:
        topics = await admin.list_topics()
        return TopicListResponse(topics=topics, count=len(topics))
    except Exception:
        raise HTTPException(status_code=503, detail="Kafka admin client not available")


@app.post("/api/topics", response_model=TopicCreateResponse)
async def create_topic(body: TopicCreateRequest) -> TopicCreateResponse:
    """Create a new Kafka topic."""
    admin = _get_admin()
    config = KafkaTopicConfig(
        name=body.name,
        num_partitions=body.num_partitions,
        replication_factor=body.replication_factor,
        retention_ms=body.retention_ms,
    )
    success = await admin.create_topic(config)
    return TopicCreateResponse(success=success, topic=body.name)


@app.get("/api/topics/{topic_name}")
async def describe_topic(topic_name: str) -> dict[str, Any]:
    """Get detailed metadata for a topic."""
    admin = _get_admin()
    result = await admin.describe_topic(topic_name)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_name}' not found")
    return result


@app.delete("/api/topics/{topic_name}")
async def delete_topic(topic_name: str) -> TopicCreateResponse:
    """Delete a Kafka topic."""
    admin = _get_admin()
    success = await admin.delete_topic(topic_name)
    return TopicCreateResponse(success=success, topic=topic_name)


@app.post("/api/produce", response_model=ProduceResponse)
async def produce_message(body: ProduceRequest) -> ProduceResponse:
    """Produce a message to a Kafka topic."""
    producer_config = ProducerConfig(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        client_id=f"api-producer-{uuid.uuid4().hex[:8]}",
    )
    metrics = StreamMetrics()
    producer = StreamProducer(producer_config, metrics)

    try:
        await producer.start()
        result = await producer.send(
            topic=body.topic,
            value=body.value,
            key=body.key,
            headers=body.headers,
        )
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to produce message")
        return ProduceResponse(
            success=True,
            topic=body.topic,
            partition=result[0],
            offset=result[1],
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to produce message")
    finally:
        await producer.stop()


@app.post("/api/consume")
async def consume_messages(body: dict[str, Any]) -> dict[str, Any]:
    """Consume messages from a Kafka topic.

    This is a one-shot consumer — for continuous processing, create a processor.
    """
    topic = body.get("topic", "")
    group_id = body.get("group_id", f"api-consumer-{uuid.uuid4().hex[:8]}")
    max_records = body.get("max_records", 10)
    timeout_ms = body.get("timeout_ms", 5000)

    if not topic:
        raise HTTPException(status_code=400, detail="topic is required")

    consumer_config = ConsumerConfig(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id=group_id,
        auto_offset_reset=OffsetResetStrategy.EARLIEST,
    )
    metrics = StreamMetrics()
    consumer = StreamConsumer(consumer_config, topics=[topic], metrics=metrics)

    try:
        await consumer.start()
        messages = await consumer.consume(
            max_records=max_records, timeout_ms=timeout_ms
        )
        await consumer.commit()
        return {
            "messages": [m.model_dump(mode="json") for m in messages],
            "count": len(messages),
            "request_id": str(uuid.uuid4()),
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to consume messages")
    finally:
        await consumer.stop()


@app.post("/api/processors", response_model=ProcessorCreateResponse)
async def create_processor(body: ProcessorCreateRequest) -> ProcessorCreateResponse:
    """Create a new stream processor."""
    if body.name in _processors:
        raise HTTPException(
            status_code=409,
            detail=f"Processor '{body.name}' already exists",
        )

    window_config = None
    if body.window_type:
        window_config = WindowConfig(
            window_type=body.window_type,
            window_size_ms=body.window_size_ms,
            hop_size_ms=body.hop_size_ms,
            grace_period_ms=body.grace_period_ms,
        )

    processor_config = ProcessorConfig(
        name=body.name,
        input_topics=body.input_topics,
        output_topic=body.output_topic,
        error_topic=body.error_topic,
        consumer_config=ConsumerConfig(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=f"processor-{body.name}",
        ),
        producer_config=ProducerConfig(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            client_id=f"processor-{body.name}-producer",
        ),
        window_config=window_config,
        delivery_semantic=body.delivery_semantic,
    )

    processor = StreamProcessor(processor_config)
    _processors[body.name] = processor
    _metrics_collector.register_processor(body.name, processor.metrics)

    return ProcessorCreateResponse(
        success=True,
        processor_name=body.name,
        state=processor.state.value,
    )


@app.post("/api/processors/{name}/start", response_model=ProcessorActionResponse)
async def start_processor(name: str) -> ProcessorActionResponse:
    """Start a stream processor."""
    processor = _processors.get(name)
    if not processor:
        raise HTTPException(status_code=404, detail=f"Processor '{name}' not found")

    try:
        await processor.start()
        return ProcessorActionResponse(
            success=True,
            processor_name=name,
            state=processor.state.value,
        )
    except Exception:
        raise HTTPException(
            status_code=500, detail=f"Failed to start processor '{name}'"
        )


@app.post("/api/processors/{name}/stop", response_model=ProcessorActionResponse)
async def stop_processor(name: str) -> ProcessorActionResponse:
    """Stop a stream processor."""
    processor = _processors.get(name)
    if not processor:
        raise HTTPException(status_code=404, detail=f"Processor '{name}' not found")

    await processor.stop()
    return ProcessorActionResponse(
        success=True,
        processor_name=name,
        state=processor.state.value,
    )


@app.get("/api/processors/{name}", response_model=ProcessorStatusResponse)
async def get_processor_status(name: str) -> ProcessorStatusResponse:
    """Get the status and metrics of a stream processor."""
    processor = _processors.get(name)
    if not processor:
        raise HTTPException(status_code=404, detail=f"Processor '{name}' not found")

    return ProcessorStatusResponse(
        name=processor.name,
        state=processor.state,
        config=processor.config,
        metrics=processor.metrics,
    )


@app.get("/api/processors", response_model=list[ProcessorStatusResponse])
async def list_processors() -> list[ProcessorStatusResponse]:
    """List all stream processors and their status."""
    return [
        ProcessorStatusResponse(
            name=p.name,
            state=p.state,
            config=p.config,
            metrics=p.metrics,
        )
        for p in _processors.values()
    ]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _run_produce(args: argparse.Namespace) -> None:
    """CLI: produce a message to a Kafka topic."""

    async def _produce() -> None:
        config = ProducerConfig(bootstrap_servers=args.bootstrap_servers)
        metrics = StreamMetrics()
        producer = StreamProducer(config, metrics)
        await producer.start()

        try:
            value = args.value
            if value.startswith("{") or value.startswith("["):
                value = json.loads(value)

            result = await producer.send(
                topic=args.topic,
                value=value,
                key=args.key,
            )
            if result:
                print(
                    f"Produced to {args.topic} partition={result[0]} offset={result[1]}"
                )
            else:
                print("Failed to produce message", file=sys.stderr)
                sys.exit(1)
        finally:
            await producer.stop()

    asyncio.run(_produce())


def _run_consume(args: argparse.Namespace) -> None:
    """CLI: consume messages from a Kafka topic."""

    async def _consume() -> None:
        config = ConsumerConfig(
            bootstrap_servers=args.bootstrap_servers,
            group_id=args.group_id,
        )
        metrics = StreamMetrics()
        consumer = StreamConsumer(config, topics=[args.topic], metrics=metrics)
        await consumer.start()

        try:
            messages = await consumer.consume(
                max_records=args.max_records,
                timeout_ms=args.timeout_ms,
            )
            await consumer.commit()

            for msg in messages:
                output = msg.model_dump(mode="json")
                print(json.dumps(output, default=str))
        finally:
            await consumer.stop()

    asyncio.run(_consume())


def _run_admin(args: argparse.Namespace) -> None:
    """CLI: Kafka admin operations."""

    async def _admin_cmd() -> None:
        admin = KafkaAdmin(bootstrap_servers=args.bootstrap_servers)
        await admin.connect()

        try:
            if args.admin_command == "list":
                topics = await admin.list_topics()
                for t in topics:
                    print(t)
            elif args.admin_command == "create":
                config = KafkaTopicConfig(
                    name=args.topic_name,
                    num_partitions=args.partitions,
                )
                success = await admin.create_topic(config)
                print(
                    f"Topic '{args.topic_name}': {'created' if success else 'failed'}"
                )
            elif args.admin_command == "delete":
                success = await admin.delete_topic(args.topic_name)
                print(
                    f"Topic '{args.topic_name}': {'deleted' if success else 'failed'}"
                )
            elif args.admin_command == "describe":
                result = await admin.describe_topic(args.topic_name)
                if result:
                    print(json.dumps(result, indent=2, default=str))
                else:
                    print(f"Topic '{args.topic_name}' not found")
            else:
                print("Unknown admin command", file=sys.stderr)
                sys.exit(1)
        finally:
            await admin.close()

    asyncio.run(_admin_cmd())


def _run_serve(args: argparse.Namespace) -> None:
    """CLI: start the FastAPI server."""
    if args.bootstrap_servers:
        settings.kafka_bootstrap_servers = args.bootstrap_servers
    if args.port:
        settings.port = args.port

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )


def cli() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Kafka Stream Processor — real-time stream processing for MyCodeXvantaOS",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # produce subcommand
    produce_parser = subparsers.add_parser(
        "produce", help="Produce a message to a Kafka topic"
    )
    produce_parser.add_argument("--topic", required=True, help="Target topic")
    produce_parser.add_argument(
        "--value", required=True, help="Message value (JSON or string)"
    )
    produce_parser.add_argument("--key", default=None, help="Message key")
    produce_parser.add_argument(
        "--bootstrap-servers",
        default="localhost:9092",
        help="Kafka bootstrap servers",
    )

    # consume subcommand
    consume_parser = subparsers.add_parser(
        "consume", help="Consume messages from a Kafka topic"
    )
    consume_parser.add_argument("--topic", required=True, help="Source topic")
    consume_parser.add_argument(
        "--group-id", default="cli-consumer", help="Consumer group ID"
    )
    consume_parser.add_argument(
        "--max-records", type=int, default=10, help="Max records to fetch"
    )
    consume_parser.add_argument(
        "--timeout-ms", type=int, default=5000, help="Consume timeout in ms"
    )
    consume_parser.add_argument(
        "--bootstrap-servers",
        default="localhost:9092",
        help="Kafka bootstrap servers",
    )

    # admin subcommand
    admin_parser = subparsers.add_parser("admin", help="Kafka admin operations")
    admin_parser.add_argument(
        "admin_command", choices=["list", "create", "delete", "describe"]
    )
    admin_parser.add_argument(
        "--topic-name", help="Topic name for create/delete/describe"
    )
    admin_parser.add_argument(
        "--partitions", type=int, default=3, help="Number of partitions"
    )
    admin_parser.add_argument(
        "--bootstrap-servers",
        default="localhost:9092",
        help="Kafka bootstrap servers",
    )

    # serve subcommand
    serve_parser = subparsers.add_parser("serve", help="Start the HTTP API server")
    serve_parser.add_argument("--port", type=int, default=8001, help="Server port")
    serve_parser.add_argument(
        "--bootstrap-servers",
        default="localhost:9092",
        help="Kafka bootstrap servers",
    )

    args = parser.parse_args()

    if args.command == "produce":
        _run_produce(args)
    elif args.command == "consume":
        _run_consume(args)
    elif args.command == "admin":
        _run_admin(args)
    elif args.command == "serve":
        _run_serve(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    cli()
