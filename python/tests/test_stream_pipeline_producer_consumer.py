"""Tests for mycodexvantaos-stream-pipeline producer and consumer."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from mycodexvantaos_stream_pipeline.consumer import StreamConsumer
from mycodexvantaos_stream_pipeline.models import (
    ConsumerConfig,
    DeadLetterMessage,
    DeliverySemantic,
    KafkaMessage,
    OffsetResetStrategy,
    ProducerConfig,
    StreamMetrics,
)
from mycodexvantaos_stream_pipeline.producer import StreamProducer

# ---------------------------------------------------------------------------
# StreamProducer (unit tests with mocked AIOKafkaProducer)
# ---------------------------------------------------------------------------


class TestStreamProducer:
    """Tests for StreamProducer with mocked Kafka backend."""

    def _make_producer(
        self,
        semantic: DeliverySemantic = DeliverySemantic.AT_LEAST_ONCE,
        transactional_id: str = "",
    ) -> StreamProducer:
        config = ProducerConfig(
            bootstrap_servers="localhost:9092",
            client_id="test-producer",
            delivery_semantic=semantic,
            transactional_id=transactional_id,
        )
        metrics = StreamMetrics()
        return StreamProducer(config, metrics)

    @pytest.mark.asyncio
    async def test_start_at_least_once(self) -> None:
        producer = self._make_producer()
        with patch("mycodexvantaos_stream_pipeline.producer.AIOKafkaProducer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await producer.start()
            mock_instance.start.assert_called_once()

    @pytest.mark.asyncio
    async def test_start_exactly_once(self) -> None:
        producer = self._make_producer(
            semantic=DeliverySemantic.EXACTLY_ONCE,
            transactional_id="tx-1",
        )
        with patch("mycodexvantaos_stream_pipeline.producer.AIOKafkaProducer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await producer.start()
            mock_instance.start.assert_called_once()
            mock_instance.init_transactions.assert_called_once()

    @pytest.mark.asyncio
    async def test_stop(self) -> None:
        producer = self._make_producer()
        with patch("mycodexvantaos_stream_pipeline.producer.AIOKafkaProducer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await producer.start()
            await producer.stop()
            mock_instance.flush.assert_called_once()
            mock_instance.stop.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_string_value(self) -> None:
        producer = self._make_producer()
        with patch("mycodexvantaos_stream_pipeline.producer.AIOKafkaProducer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await producer.start()

            mock_result = MagicMock()
            mock_result.partition = 0
            mock_result.offset = 42
            mock_instance.send_and_wait = AsyncMock(return_value=mock_result)

            result = await producer.send(topic="test-topic", value="hello")
            assert result == (0, 42)
            assert producer._metrics.messages_produced == 1

    @pytest.mark.asyncio
    async def test_send_dict_value(self) -> None:
        producer = self._make_producer()
        with patch("mycodexvantaos_stream_pipeline.producer.AIOKafkaProducer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await producer.start()

            mock_result = MagicMock()
            mock_result.partition = 1
            mock_result.offset = 99
            mock_instance.send_and_wait = AsyncMock(return_value=mock_result)

            result = await producer.send(
                topic="test-topic",
                value={"key": "val"},
                key="my-key",
            )
            assert result == (1, 99)

    @pytest.mark.asyncio
    async def test_send_with_headers(self) -> None:
        producer = self._make_producer()
        with patch("mycodexvantaos_stream_pipeline.producer.AIOKafkaProducer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await producer.start()

            mock_result = MagicMock()
            mock_result.partition = 0
            mock_result.offset = 1
            mock_instance.send_and_wait = AsyncMock(return_value=mock_result)

            result = await producer.send(
                topic="t",
                value="v",
                headers={"trace-id": "abc"},
            )
            assert result is not None

    @pytest.mark.asyncio
    async def test_send_failure_returns_none(self) -> None:
        producer = self._make_producer()
        with patch("mycodexvantaos_stream_pipeline.producer.AIOKafkaProducer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await producer.start()

            from aiokafka.errors import KafkaError

            mock_instance.send_and_wait = AsyncMock(side_effect=KafkaError("send failed"))

            result = await producer.send(topic="t", value="v")
            assert result is None
            assert producer._metrics.messages_errored == 1

    @pytest.mark.asyncio
    async def test_producer_property_raises_before_start(self) -> None:
        producer = self._make_producer()
        with pytest.raises(RuntimeError, match="not started"):
            _ = producer.producer

    @pytest.mark.asyncio
    async def test_exactly_once_without_transactional_id_raises(self) -> None:
        with pytest.raises(ValueError):
            ProducerConfig(
                delivery_semantic=DeliverySemantic.EXACTLY_ONCE,
                transactional_id="",
            )

    @pytest.mark.asyncio
    async def test_send_dead_letter(self) -> None:
        producer = self._make_producer()
        with patch("mycodexvantaos_stream_pipeline.producer.AIOKafkaProducer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await producer.start()

            mock_result = MagicMock()
            mock_result.partition = 0
            mock_result.offset = 1
            mock_instance.send_and_wait = AsyncMock(return_value=mock_result)

            dlq = DeadLetterMessage(
                original_topic="input-topic",
                error_message="test error",
            )
            success = await producer.send_dead_letter(dlq, topic="dlq.input-topic")
            assert success is True
            assert producer._metrics.dead_letter_count == 1

    @pytest.mark.asyncio
    async def test_send_batch(self) -> None:
        producer = self._make_producer()
        with patch("mycodexvantaos_stream_pipeline.producer.AIOKafkaProducer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await producer.start()

            mock_result = MagicMock()
            mock_result.partition = 0
            mock_result.offset = 1
            mock_instance.send_and_wait = AsyncMock(return_value=mock_result)

            messages = [
                KafkaMessage(topic="t", value="v1", key="k1"),
                KafkaMessage(topic="t", value="v2", key="k2"),
            ]
            results = await producer.send_batch("t", messages)
            assert len(results) == 2
            assert all(r is not None for r in results)


# ---------------------------------------------------------------------------
# StreamConsumer (unit tests with mocked AIOKafkaConsumer)
# ---------------------------------------------------------------------------


class TestStreamConsumer:
    """Tests for StreamConsumer with mocked Kafka backend."""

    def _make_consumer(self) -> StreamConsumer:
        config = ConsumerConfig(
            bootstrap_servers="localhost:9092",
            group_id="test-group",
            auto_offset_reset=OffsetResetStrategy.EARLIEST,
        )
        metrics = StreamMetrics()
        return StreamConsumer(config, topics=["test-topic"], metrics=metrics)

    @pytest.mark.asyncio
    async def test_start(self) -> None:
        consumer = self._make_consumer()
        with patch("mycodexvantaos_stream_pipeline.consumer.AIOKafkaConsumer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await consumer.start()
            mock_instance.start.assert_called_once()

    @pytest.mark.asyncio
    async def test_stop(self) -> None:
        consumer = self._make_consumer()
        with patch("mycodexvantaos_stream_pipeline.consumer.AIOKafkaConsumer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await consumer.start()
            await consumer.stop()
            mock_instance.commit.assert_called()
            mock_instance.stop.assert_called_once()

    @pytest.mark.asyncio
    async def test_consumer_property_raises_before_start(self) -> None:
        consumer = self._make_consumer()
        with pytest.raises(RuntimeError, match="not started"):
            _ = consumer.consumer

    @pytest.mark.asyncio
    async def test_consume_records(self) -> None:
        consumer = self._make_consumer()
        with patch("mycodexvantaos_stream_pipeline.consumer.AIOKafkaConsumer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await consumer.start()

            # Create mock records
            from aiokafka.structs import ConsumerRecord, TopicPartition

            mock_record = MagicMock(spec=ConsumerRecord)
            mock_record.topic = "test-topic"
            mock_record.partition = 0
            mock_record.offset = 1
            mock_record.key = None
            mock_record.value = b'{"key": "val"}'
            mock_record.headers = []
            mock_record.timestamp = 1000
            mock_record.timestamp_type = 0

            tp = TopicPartition("test-topic", 0)
            mock_instance.getmany = AsyncMock(return_value={tp: [mock_record]})
            mock_instance.commit = AsyncMock()

            messages = await consumer.consume(max_records=10, timeout_ms=1000)
            assert len(messages) == 1
            assert messages[0].topic == "test-topic"
            assert messages[0].value == {"key": "val"}

    @pytest.mark.asyncio
    async def test_consume_string_value(self) -> None:
        consumer = self._make_consumer()
        with patch("mycodexvantaos_stream_pipeline.consumer.AIOKafkaConsumer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await consumer.start()

            from aiokafka.structs import ConsumerRecord, TopicPartition

            mock_record = MagicMock(spec=ConsumerRecord)
            mock_record.topic = "test-topic"
            mock_record.partition = 0
            mock_record.offset = 1
            mock_record.key = b"my-key"
            mock_record.value = b"plain text"
            mock_record.headers = [("trace-id", b"abc123")]
            mock_record.timestamp = 1000
            mock_record.timestamp_type = 0

            tp = TopicPartition("test-topic", 0)
            mock_instance.getmany = AsyncMock(return_value={tp: [mock_record]})

            messages = await consumer.consume(max_records=10, timeout_ms=1000)
            assert len(messages) == 1
            assert messages[0].value == "plain text"
            assert messages[0].key == "my-key"
            assert messages[0].headers == {"trace-id": "abc123"}

    @pytest.mark.asyncio
    async def test_consume_at_most_once_commits_immediately(self) -> None:
        config = ConsumerConfig(
            bootstrap_servers="localhost:9092",
            group_id="amo-group",
            delivery_semantic=DeliverySemantic.AT_MOST_ONCE,
            enable_auto_commit=False,
        )
        metrics = StreamMetrics()
        consumer = StreamConsumer(config, topics=["test-topic"], metrics=metrics)

        with patch("mycodexvantaos_stream_pipeline.consumer.AIOKafkaConsumer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await consumer.start()

            from aiokafka.structs import ConsumerRecord, TopicPartition

            mock_record = MagicMock(spec=ConsumerRecord)
            mock_record.topic = "t"
            mock_record.partition = 0
            mock_record.offset = 1
            mock_record.key = None
            mock_record.value = b"data"
            mock_record.headers = []
            mock_record.timestamp = 1000
            mock_record.timestamp_type = 0

            tp = TopicPartition("t", 0)
            mock_instance.getmany = AsyncMock(return_value={tp: [mock_record]})
            mock_instance.commit = AsyncMock()

            messages = await consumer.consume(max_records=10, timeout_ms=1000)
            assert len(messages) == 1
            # At-most-once should commit immediately
            mock_instance.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_record_to_message_with_headers(self) -> None:
        consumer = self._make_consumer()
        with patch("mycodexvantaos_stream_pipeline.consumer.AIOKafkaConsumer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await consumer.start()

            from aiokafka.structs import ConsumerRecord

            mock_record = MagicMock(spec=ConsumerRecord)
            mock_record.topic = "t"
            mock_record.partition = 0
            mock_record.offset = 1
            mock_record.key = b"key1"
            mock_record.value = b"val1"
            mock_record.headers = [("h1", b"v1"), ("h2", b"v2")]
            mock_record.timestamp = 1700000000000
            mock_record.timestamp_type = 0

            msg = consumer._record_to_message(mock_record)
            assert msg.key == "key1"
            assert msg.headers == {"h1": "v1", "h2": "v2"}

    @pytest.mark.asyncio
    async def test_get_consumer_lag(self) -> None:
        consumer = self._make_consumer()
        with patch("mycodexvantaos_stream_pipeline.consumer.AIOKafkaConsumer") as mock_cls:
            mock_instance = AsyncMock()
            mock_cls.return_value = mock_instance
            await consumer.start()

            from aiokafka.structs import TopicPartition

            tp = TopicPartition("test-topic", 0)
            mock_instance.assignment = MagicMock(return_value=[tp])
            mock_instance.end_offsets = AsyncMock(return_value={tp: 100})
            mock_instance.position = AsyncMock(return_value=95)

            lag = await consumer.get_consumer_lag()
            assert lag == 5
            assert consumer._metrics.consumer_lag == 5
