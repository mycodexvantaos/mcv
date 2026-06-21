"""Data models for Kafka stream processing pipeline."""

from __future__ import annotations

import enum
import json
import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class WindowType(str, enum.Enum):
    """Supported window types for stream aggregation."""

    TUMBLING = "tumbling"
    HOPPING = "hopping"
    SLIDING = "sliding"
    SESSION = "session"


class OffsetResetStrategy(str, enum.Enum):
    """Consumer offset reset strategy."""

    EARLIEST = "earliest"
    LATEST = "latest"
    NONE = "none"


class CompressionType(str, enum.Enum):
    """Kafka message compression type."""

    NONE = "none"
    GZIP = "gzip"
    SNAPPY = "snappy"
    LZ4 = "lz4"
    ZSTD = "zstd"


class DeliverySemantic(str, enum.Enum):
    """Message delivery semantic guarantee."""

    AT_MOST_ONCE = "at_most_once"
    AT_LEAST_ONCE = "at_least_once"
    EXACTLY_ONCE = "exactly_once"


class ProcessorState(str, enum.Enum):
    """Stream processor lifecycle state."""

    CREATED = "created"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


# ---------------------------------------------------------------------------
# Configuration Models
# ---------------------------------------------------------------------------


class KafkaTopicConfig(BaseModel):
    """Configuration for a Kafka topic."""

    name: str = Field(..., description="Topic name (kebab-case)")
    num_partitions: int = Field(default=3, ge=1, le=256)
    replication_factor: int = Field(default=1, ge=1, le=5)
    retention_ms: int = Field(default=604800000, description="Retention in ms (default 7 days)")
    cleanup_policy: str = Field(default="delete", pattern="^(delete|compact)$")
    max_message_bytes: int = Field(default=1048576, description="Max message size in bytes")

    @field_validator("name")
    @classmethod
    def validate_topic_name(cls, v: str) -> str:
        """Topic names must be lowercase with hyphens or dots."""
        if not v:
            raise ValueError("Topic name cannot be empty")
        if " " in v:
            raise ValueError("Topic name cannot contain spaces")
        return v.lower()


class ProducerConfig(BaseModel):
    """Configuration for a Kafka producer."""

    bootstrap_servers: str = Field(default="localhost:9092")
    client_id: str = Field(default="stream-producer")
    acks: str = Field(default="all", pattern="^(0|1|all)$")
    compression: CompressionType = Field(default=CompressionType.GZIP)
    linger_ms: int = Field(default=5, ge=0)
    batch_size: int = Field(default=16384, ge=1)
    max_in_flight_requests: int = Field(default=5, ge=1, le=10)
    enable_idempotence: bool = Field(default=True)
    transactional_id: str = Field(default="", description="Required for exactly-once")
    retry_backoff_ms: int = Field(default=100, ge=0)
    request_timeout_ms: int = Field(default=30000, ge=1000)
    delivery_semantic: DeliverySemantic = Field(default=DeliverySemantic.AT_LEAST_ONCE)

    @field_validator("transactional_id")
    @classmethod
    def validate_transactional_id(cls, v: str, info: Any) -> str:
        """When using exactly-once, transactional_id must be set."""
        delivery = info.data.get("delivery_semantic")
        if delivery == DeliverySemantic.EXACTLY_ONCE and not v:
            raise ValueError("transactional_id is required for exactly-once semantics")
        return v

    @field_validator("delivery_semantic")
    @classmethod
    def validate_delivery_semantic(cls, v: DeliverySemantic, info: Any) -> str:
        """When using exactly-once, transactional_id must already be set."""
        if v == DeliverySemantic.EXACTLY_ONCE and not info.data.get("transactional_id"):
            raise ValueError("transactional_id is required for exactly-once semantics")
        return v


class ConsumerConfig(BaseModel):
    """Configuration for a Kafka consumer."""

    bootstrap_servers: str = Field(default="localhost:9092")
    group_id: str = Field(default="stream-consumer-group")
    client_id: str = Field(default="stream-consumer")
    auto_offset_reset: OffsetResetStrategy = Field(default=OffsetResetStrategy.LATEST)
    enable_auto_commit: bool = Field(default=False)
    auto_commit_interval_ms: int = Field(default=5000, ge=100)
    max_poll_records: int = Field(default=500, ge=1)
    max_poll_interval_ms: int = Field(default=300000, ge=1000)
    session_timeout_ms: int = Field(default=10000, ge=1000)
    heartbeat_interval_ms: int = Field(default=3000, ge=500)
    delivery_semantic: DeliverySemantic = Field(default=DeliverySemantic.AT_LEAST_ONCE)
    isolation_level: str = Field(
        default="read_uncommitted", pattern="^(read_uncommitted|read_committed)$"
    )


class WindowConfig(BaseModel):
    """Configuration for a stream window."""

    window_type: WindowType
    window_size_ms: int = Field(default=60000, ge=1000, description="Window size in ms")
    hop_size_ms: int = Field(default=0, ge=0, description="Hop size for hopping windows in ms")
    grace_period_ms: int = Field(default=0, ge=0, description="Late data tolerance in ms")
    allowed_lateness_ms: int = Field(default=0, ge=0, description="How long to keep windows open")

    @field_validator("hop_size_ms")
    @classmethod
    def validate_hop_size(cls, v: int, info: Any) -> int:
        """Hopping windows must have hop_size < window_size."""
        window_type = info.data.get("window_type")
        window_size = info.data.get("window_size_ms", 60000)
        if window_type == WindowType.HOPPING and v <= 0:
            raise ValueError("hopping windows require hop_size_ms > 0")
        if window_type == WindowType.HOPPING and v >= window_size:
            raise ValueError("hop_size_ms must be less than window_size_ms")
        return v


class ProcessorConfig(BaseModel):
    """Configuration for a stream processor."""

    name: str = Field(..., description="Processor name (kebab-case)")
    input_topics: list[str] = Field(..., min_length=1)
    output_topic: str = Field(default="", description="Output topic for processed results")
    error_topic: str = Field(default="", description="Dead-letter topic for failed messages")
    consumer_config: ConsumerConfig = Field(default_factory=ConsumerConfig)
    producer_config: ProducerConfig = Field(default_factory=ProducerConfig)
    window_config: WindowConfig | None = None
    delivery_semantic: DeliverySemantic = Field(default=DeliverySemantic.AT_LEAST_ONCE)
    max_retries: int = Field(default=3, ge=0)
    retry_backoff_ms: int = Field(default=1000, ge=100)

    @field_validator("name")
    @classmethod
    def validate_processor_name(cls, v: str) -> str:
        """Processor names must be kebab-case."""
        if not v:
            raise ValueError("Processor name cannot be empty")
        if " " in v or "_" in v:
            raise ValueError("Processor name must use kebab-case (lowercase, hyphens)")
        return v.lower()


# ---------------------------------------------------------------------------
# Runtime Data Models
# ---------------------------------------------------------------------------


class KafkaMessage(BaseModel):
    """A Kafka message with metadata."""

    topic: str
    partition: int = -1
    offset: int = -1
    key: str | None = None
    value: str | dict[str, Any] | bytes = ""
    headers: dict[str, str] = Field(default_factory=dict)
    timestamp: int = 0
    timestamp_type: str = "create_time"

    def serialized_value(self) -> bytes:
        """Serialize value for Kafka transport."""
        if isinstance(self.value, bytes):
            return self.value
        if isinstance(self.value, dict):
            return json.dumps(self.value, default=str).encode("utf-8")
        return str(self.value).encode("utf-8")


class DeadLetterMessage(BaseModel):
    """A message routed to the dead-letter queue after processing failure."""

    original_topic: str
    original_partition: int = -1
    original_offset: int = -1
    original_key: str | None = None
    original_value: Any = None
    original_headers: dict[str, str] = Field(default_factory=dict)
    error_message: str
    error_type: str = "processing_error"
    retry_count: int = 0
    processor_name: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WindowResult(BaseModel):
    """Result of a windowed aggregation."""

    window_start: datetime
    window_end: datetime
    window_type: WindowType
    key: str | None = None
    aggregate_value: Any = None
    record_count: int = 0
    late_records_dropped: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StreamMetrics(BaseModel):
    """Metrics snapshot for a stream processor."""

    processor_name: str = ""
    messages_consumed: int = 0
    messages_produced: int = 0
    messages_errored: int = 0
    dead_letter_count: int = 0
    consumer_lag: int = 0
    processing_latency_ms: float = 0.0
    throughput_per_second: float = 0.0
    last_message_at: datetime | None = None
    window_results_count: int = 0
    uptime_seconds: float = 0.0
    collected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProduceRequest(BaseModel):
    """API request body for producing messages."""

    topic: str
    key: str | None = None
    value: Any
    headers: dict[str, str] = Field(default_factory=dict)


class ProduceResponse(BaseModel):
    """API response for producing messages."""

    success: bool
    topic: str
    partition: int = -1
    offset: int = -1
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class ConsumeRequest(BaseModel):
    """API request body for consuming messages."""

    topic: str
    group_id: str | None = None
    max_records: int = Field(default=10, ge=1, le=1000)
    timeout_ms: int = Field(default=5000, ge=100)


class ConsumeResponse(BaseModel):
    """API response for consuming messages."""

    messages: list[KafkaMessage] = Field(default_factory=list)
    count: int = 0
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class ProcessorStatusResponse(BaseModel):
    """API response for processor status."""

    name: str
    state: ProcessorState
    config: ProcessorConfig
    metrics: StreamMetrics = Field(default_factory=StreamMetrics)
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
