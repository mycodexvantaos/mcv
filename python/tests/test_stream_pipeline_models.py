"""Tests for mycodexvantaos-stream-pipeline data models."""

from __future__ import annotations

import json
from datetime import UTC

import pytest
from pydantic import ValidationError

from mycodexvantaos_stream_pipeline.models import (
    CompressionType,
    ConsumerConfig,
    ConsumeRequest,
    DeadLetterMessage,
    DeliverySemantic,
    KafkaMessage,
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
    WindowResult,
    WindowType,
)

# ---------------------------------------------------------------------------
# KafkaTopicConfig
# ---------------------------------------------------------------------------


class TestKafkaTopicConfig:
    """Tests for KafkaTopicConfig validation."""

    def test_valid_topic_config(self) -> None:
        config = KafkaTopicConfig(name="my-topic")
        assert config.name == "my-topic"
        assert config.num_partitions == 3
        assert config.replication_factor == 1
        assert config.retention_ms == 604800000
        assert config.cleanup_policy == "delete"

    def test_topic_name_lowercased(self) -> None:
        config = KafkaTopicConfig(name="My-Topic")
        assert config.name == "my-topic"

    def test_topic_name_rejects_spaces(self) -> None:
        with pytest.raises(ValidationError, match="cannot contain spaces"):
            KafkaTopicConfig(name="my topic")

    def test_topic_name_rejects_empty(self) -> None:
        with pytest.raises(ValidationError, match="cannot be empty"):
            KafkaTopicConfig(name="")

    def test_topic_compact_policy(self) -> None:
        config = KafkaTopicConfig(name="my-topic", cleanup_policy="compact")
        assert config.cleanup_policy == "compact"

    def test_topic_invalid_policy(self) -> None:
        with pytest.raises(ValidationError, match="cleanup_policy"):
            KafkaTopicConfig(name="my-topic", cleanup_policy="invalid")

    def test_topic_partitions_bounds(self) -> None:
        with pytest.raises(ValidationError):
            KafkaTopicConfig(name="t", num_partitions=0)
        with pytest.raises(ValidationError):
            KafkaTopicConfig(name="t", num_partitions=257)

    def test_topic_replication_bounds(self) -> None:
        with pytest.raises(ValidationError):
            KafkaTopicConfig(name="t", replication_factor=0)
        with pytest.raises(ValidationError):
            KafkaTopicConfig(name="t", replication_factor=6)


# ---------------------------------------------------------------------------
# ProducerConfig
# ---------------------------------------------------------------------------


class TestProducerConfig:
    """Tests for ProducerConfig validation."""

    def test_default_producer_config(self) -> None:
        config = ProducerConfig()
        assert config.bootstrap_servers == "localhost:9092"
        assert config.acks == "all"
        assert config.compression == CompressionType.GZIP
        assert config.enable_idempotence is True
        assert config.delivery_semantic == DeliverySemantic.AT_LEAST_ONCE

    def test_exactly_once_requires_transactional_id(self) -> None:
        with pytest.raises(ValidationError, match="transactional_id is required"):
            ProducerConfig(delivery_semantic=DeliverySemantic.EXACTLY_ONCE)

    def test_exactly_once_with_transactional_id(self) -> None:
        config = ProducerConfig(
            delivery_semantic=DeliverySemantic.EXACTLY_ONCE,
            transactional_id="tx-prod-1",
        )
        assert config.transactional_id == "tx-prod-1"

    def test_invalid_acks(self) -> None:
        with pytest.raises(ValidationError):
            ProducerConfig(acks="2")

    def test_compression_types(self) -> None:
        for ct in CompressionType:
            config = ProducerConfig(compression=ct)
            assert config.compression == ct


# ---------------------------------------------------------------------------
# ConsumerConfig
# ---------------------------------------------------------------------------


class TestConsumerConfig:
    """Tests for ConsumerConfig validation."""

    def test_default_consumer_config(self) -> None:
        config = ConsumerConfig()
        assert config.bootstrap_servers == "localhost:9092"
        assert config.auto_offset_reset == OffsetResetStrategy.LATEST
        assert config.enable_auto_commit is False
        assert config.isolation_level == "read_uncommitted"

    def test_exactly_once_sets_read_committed(self) -> None:
        config = ConsumerConfig(
            delivery_semantic=DeliverySemantic.EXACTLY_ONCE,
            isolation_level="read_committed",
        )
        assert config.isolation_level == "read_committed"

    def test_invalid_isolation_level(self) -> None:
        with pytest.raises(ValidationError):
            ConsumerConfig(isolation_level="invalid")


# ---------------------------------------------------------------------------
# WindowConfig
# ---------------------------------------------------------------------------


class TestWindowConfig:
    """Tests for WindowConfig validation."""

    def test_tumbling_window(self) -> None:
        config = WindowConfig(
            window_type=WindowType.TUMBLING,
            window_size_ms=60000,
        )
        assert config.window_type == WindowType.TUMBLING
        assert config.hop_size_ms == 0

    def test_hopping_window(self) -> None:
        config = WindowConfig(
            window_type=WindowType.HOPPING,
            window_size_ms=60000,
            hop_size_ms=10000,
        )
        assert config.hop_size_ms == 10000

    def test_hopping_window_requires_hop_size(self) -> None:
        with pytest.raises(ValidationError, match="hop_size_ms > 0"):
            WindowConfig(
                window_type=WindowType.HOPPING,
                window_size_ms=60000,
                hop_size_ms=0,
            )

    def test_hopping_window_hop_size_less_than_window(self) -> None:
        with pytest.raises(ValidationError, match="hop_size_ms must be less"):
            WindowConfig(
                window_type=WindowType.HOPPING,
                window_size_ms=60000,
                hop_size_ms=60000,
            )

    def test_window_size_minimum(self) -> None:
        with pytest.raises(ValidationError):
            WindowConfig(window_type=WindowType.TUMBLING, window_size_ms=100)


# ---------------------------------------------------------------------------
# ProcessorConfig
# ---------------------------------------------------------------------------


class TestProcessorConfig:
    """Tests for ProcessorConfig validation."""

    def test_valid_processor_config(self) -> None:
        config = ProcessorConfig(
            name="my-processor",
            input_topics=["input-topic"],
        )
        assert config.name == "my-processor"
        assert config.output_topic == ""
        assert config.max_retries == 3

    def test_processor_name_kebab_case(self) -> None:
        config = ProcessorConfig(name="My-Processor", input_topics=["t"])
        assert config.name == "my-processor"

    def test_processor_name_rejects_spaces(self) -> None:
        with pytest.raises(ValidationError, match="kebab-case"):
            ProcessorConfig(name="my processor", input_topics=["t"])

    def test_processor_name_rejects_underscores(self) -> None:
        with pytest.raises(ValidationError, match="kebab-case"):
            ProcessorConfig(name="my_processor", input_topics=["t"])

    def test_processor_name_rejects_empty(self) -> None:
        with pytest.raises(ValidationError, match="cannot be empty"):
            ProcessorConfig(name="", input_topics=["t"])

    def test_processor_requires_input_topics(self) -> None:
        with pytest.raises(ValidationError):
            ProcessorConfig(name="p", input_topics=[])

    def test_processor_with_window(self) -> None:
        window = WindowConfig(window_type=WindowType.TUMBLING, window_size_ms=30000)
        config = ProcessorConfig(
            name="windowed-proc",
            input_topics=["in"],
            output_topic="out",
            window_config=window,
        )
        assert config.window_config is not None
        assert config.window_config.window_type == WindowType.TUMBLING


# ---------------------------------------------------------------------------
# KafkaMessage
# ---------------------------------------------------------------------------


class TestKafkaMessage:
    """Tests for KafkaMessage model."""

    def test_message_defaults(self) -> None:
        msg = KafkaMessage(topic="test-topic", value="hello")
        assert msg.topic == "test-topic"
        assert msg.value == "hello"
        assert msg.partition == -1
        assert msg.key is None
        assert msg.headers == {}

    def test_serialized_value_dict(self) -> None:
        msg = KafkaMessage(topic="t", value={"key": "val"})
        serialized = msg.serialized_value()
        assert isinstance(serialized, bytes)
        assert json.loads(serialized) == {"key": "val"}

    def test_serialized_value_string(self) -> None:
        msg = KafkaMessage(topic="t", value="hello")
        serialized = msg.serialized_value()
        assert serialized == b"hello"

    def test_serialized_value_bytes(self) -> None:
        msg = KafkaMessage(topic="t", value=b"\x00\x01")
        serialized = msg.serialized_value()
        assert serialized == b"\x00\x01"

    def test_message_with_headers(self) -> None:
        msg = KafkaMessage(
            topic="t",
            value="data",
            headers={"trace-id": "abc123"},
        )
        assert msg.headers["trace-id"] == "abc123"


# ---------------------------------------------------------------------------
# DeadLetterMessage
# ---------------------------------------------------------------------------


class TestDeadLetterMessage:
    """Tests for DeadLetterMessage model."""

    def test_dead_letter_creation(self) -> None:
        dlq = DeadLetterMessage(
            original_topic="input-topic",
            error_message="deserialization failed",
            error_type="serialization_error",
        )
        assert dlq.original_topic == "input-topic"
        assert dlq.error_message == "deserialization failed"
        assert dlq.retry_count == 0
        assert dlq.processor_name == ""

    def test_dead_letter_with_original_message(self) -> None:
        dlq = DeadLetterMessage(
            original_topic="t",
            original_partition=2,
            original_offset=42,
            original_key="order-123",
            original_value={"order": "data"},
            error_message="invalid schema",
            processor_name="order-processor",
        )
        assert dlq.original_partition == 2
        assert dlq.original_offset == 42
        assert dlq.processor_name == "order-processor"


# ---------------------------------------------------------------------------
# WindowResult
# ---------------------------------------------------------------------------


class TestWindowResult:
    """Tests for WindowResult model."""

    def test_window_result_creation(self) -> None:
        from datetime import datetime

        start = datetime(2024, 1, 1, 0, 0, 0, tzinfo=UTC)
        end = datetime(2024, 1, 1, 0, 1, 0, tzinfo=UTC)
        result = WindowResult(
            window_start=start,
            window_end=end,
            window_type=WindowType.TUMBLING,
            key="agg-key",
            aggregate_value=42,
            record_count=100,
        )
        assert result.window_type == WindowType.TUMBLING
        assert result.aggregate_value == 42
        assert result.record_count == 100


# ---------------------------------------------------------------------------
# StreamMetrics
# ---------------------------------------------------------------------------


class TestStreamMetrics:
    """Tests for StreamMetrics model."""

    def test_default_metrics(self) -> None:
        metrics = StreamMetrics()
        assert metrics.messages_consumed == 0
        assert metrics.messages_produced == 0
        assert metrics.messages_errored == 0
        assert metrics.dead_letter_count == 0
        assert metrics.consumer_lag == 0

    def test_metrics_with_processor_name(self) -> None:
        metrics = StreamMetrics(processor_name="test-proc")
        assert metrics.processor_name == "test-proc"


# ---------------------------------------------------------------------------
# API Models
# ---------------------------------------------------------------------------


class TestProduceRequest:
    """Tests for ProduceRequest model."""

    def test_valid_produce_request(self) -> None:
        req = ProduceRequest(topic="test-topic", value="hello")
        assert req.topic == "test-topic"
        assert req.value == "hello"
        assert req.key is None

    def test_produce_request_with_json_value(self) -> None:
        req = ProduceRequest(topic="t", value={"key": "val"}, key="k1")
        assert req.value == {"key": "val"}
        assert req.key == "k1"


class TestProduceResponse:
    """Tests for ProduceResponse model."""

    def test_produce_response_defaults(self) -> None:
        resp = ProduceResponse(success=True, topic="t")
        assert resp.success is True
        assert resp.partition == -1
        assert resp.offset == -1
        assert len(resp.request_id) > 0


class TestConsumeRequest:
    """Tests for ConsumeRequest model."""

    def test_valid_consume_request(self) -> None:
        req = ConsumeRequest(topic="t")
        assert req.topic == "t"
        assert req.max_records == 10
        assert req.timeout_ms == 5000

    def test_max_records_bounds(self) -> None:
        with pytest.raises(ValidationError):
            ConsumeRequest(topic="t", max_records=0)
        with pytest.raises(ValidationError):
            ConsumeRequest(topic="t", max_records=1001)


class TestProcessorStatusResponse:
    """Tests for ProcessorStatusResponse model."""

    def test_status_response(self) -> None:
        config = ProcessorConfig(name="p", input_topics=["in"])
        resp = ProcessorStatusResponse(
            name="p",
            state=ProcessorState.CREATED,
            config=config,
        )
        assert resp.state == ProcessorState.CREATED
