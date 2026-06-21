"""Stream consumer with configurable offset management and delivery semantics."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, AsyncIterator

from aiokafka import AIOKafkaConsumer
from aiokafka.errors import CommitFailedError, KafkaError
from aiokafka.structs import ConsumerRecord, TopicPartition
from mycodexvantaos_stream_pipeline.models import (
    ConsumerConfig,
    DeliverySemantic,
    KafkaMessage,
    StreamMetrics,
)

logger = logging.getLogger(__name__)


class StreamConsumer:
    """Async Kafka consumer with configurable delivery semantics.

    Supports at-most-once, at-least-once, and exactly-once delivery
    via manual offset commit control and read_committed isolation.
    """

    def __init__(
        self,
        config: ConsumerConfig,
        topics: list[str],
        metrics: StreamMetrics,
    ) -> None:
        self._config = config
        self._topics = topics
        self._metrics = metrics
        self._consumer: AIOKafkaConsumer | None = None
        self._running = False

    async def start(self) -> None:
        """Start the consumer and subscribe to configured topics."""
        auto_offset_reset = self._config.auto_offset_reset.value
        if auto_offset_reset == "none":
            auto_offset_reset = "earliest"

        consumer_kwargs: dict[str, Any] = {
            "bootstrap_servers": self._config.bootstrap_servers,
            "group_id": self._config.group_id,
            "client_id": self._config.client_id,
            "auto_offset_reset": auto_offset_reset,
            "enable_auto_commit": self._config.enable_auto_commit,
            "auto_commit_interval_ms": self._config.auto_commit_interval_ms,
            "max_poll_records": self._config.max_poll_records,
            "max_poll_interval_ms": self._config.max_poll_interval_ms,
            "session_timeout_ms": self._config.session_timeout_ms,
            "heartbeat_interval_ms": self._config.heartbeat_interval_ms,
        }

        if self._config.delivery_semantic == DeliverySemantic.EXACTLY_ONCE:
            consumer_kwargs["isolation_level"] = "read_committed"
        else:
            consumer_kwargs["isolation_level"] = self._config.isolation_level

        self._consumer = AIOKafkaConsumer(*self._topics, **consumer_kwargs)
        await self._consumer.start()
        self._running = True

        logger.info(
            "Stream consumer started — group: %s, topics: %s, semantic: %s",
            self._config.group_id,
            self._topics,
            self._config.delivery_semantic.value,
        )

    async def stop(self) -> None:
        """Stop the consumer and close the connection."""
        self._running = False
        if self._consumer:
            try:
                if not self._config.enable_auto_commit:
                    await self._consumer.commit()
            except CommitFailedError:
                logger.warning(
                    "Failed to commit offsets during consumer shutdown")
            except KafkaError:
                logger.exception("Error committing offsets during shutdown")
            await self._consumer.stop()
            self._consumer = None
            logger.info("Stream consumer stopped")

    @property
    def consumer(self) -> AIOKafkaConsumer:
        """Get the underlying consumer, raising if not started."""
        if self._consumer is None:
            raise RuntimeError("Consumer not started — call start() first")
        return self._consumer

    def _record_to_message(self, record: ConsumerRecord) -> KafkaMessage:
        """Convert a Kafka ConsumerRecord to our KafkaMessage model."""
        value: str | dict[str, Any] | bytes
        if isinstance(record.value, bytes):
            try:
                decoded = record.value.decode("utf-8")
                try:
                    value = json.loads(decoded)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    value = decoded
            except UnicodeDecodeError:
                value = record.value
        else:
            value = record.value

        headers: dict[str, str] = {}
        if record.headers:
            for k, v in record.headers:
                headers[k] = v.decode(
                    "utf-8") if isinstance(v, bytes) else str(v)

        # Kafka timestamp_type: 0 = CREATE_TIME, 1 = LOG_APPEND_TIME
        ts_type_map = {0: "create_time", 1: "log_append_time"}
        ts_type_str = ts_type_map.get(record.timestamp_type, "create_time")

        return KafkaMessage(
            topic=record.topic,
            partition=record.partition,
            offset=record.offset,
            key=(
                record.key.decode("utf-8")
                if isinstance(record.key, bytes)
                else record.key
            ),
            value=value,
            headers=headers,
            timestamp=record.timestamp,
            timestamp_type=ts_type_str,
        )

    async def consume(
        self, max_records: int = 10, timeout_ms: int = 5000
    ) -> list[KafkaMessage]:
        """Consume up to max_records messages from subscribed topics.

        For at-most-once: offsets are committed before processing.
        For at-least-once: offsets are committed after processing (caller must call commit).
        For exactly-once: offsets are committed within a transaction (read_committed isolation).
        """
        messages: list[KafkaMessage] = []

        try:
            records = await self.consumer.getmany(
                timeout_ms=timeout_ms,
                max_records=max_records,
            )

            for _topic_partition, partition_records in records.items():
                for record in partition_records:
                    msg = self._record_to_message(record)
                    messages.append(msg)
                    self._metrics.messages_consumed += 1
                    self._metrics.last_message_at = datetime.now(timezone.utc)

            # At-most-once: commit immediately after fetch
            if (
                self._config.delivery_semantic == DeliverySemantic.AT_MOST_ONCE
                and not self._config.enable_auto_commit
                and messages
            ):
                await self.commit()

        except KafkaError:
            self._metrics.messages_errored += 1
            logger.exception("Error consuming messages")

        return messages

    async def consume_stream(self) -> AsyncIterator[KafkaMessage]:
        """Async iterator yielding messages as they arrive.

        For at-least-once, the caller must call commit() after processing each batch.
        For exactly-once, the consumer reads only committed messages.
        """
        if not self._consumer:
            raise RuntimeError("Consumer not started")

        async for record in self._consumer:
            if not self._running:
                break
            msg = self._record_to_message(record)
            self._metrics.messages_consumed += 1
            self._metrics.last_message_at = datetime.now(timezone.utc)
            yield msg

    async def commit(self) -> None:
        """Manually commit current offsets.

        Used for at-least-once and exactly-once semantics where
        auto_commit is disabled.
        """
        try:
            await self.consumer.commit()
            logger.debug("Offsets committed for group %s",
                         self._config.group_id)
        except CommitFailedError:
            self._metrics.messages_errored += 1
            logger.exception(
                "Failed to commit offsets for group %s", self._config.group_id
            )
        except KafkaError:
            self._metrics.messages_errored += 1
            logger.exception("Kafka error during offset commit")

    async def seek(self, topic: str, partition: int, offset: int) -> None:
        """Seek to a specific offset in a topic partition."""
        tp = TopicPartition(topic, partition)
        self.consumer.seek(tp, offset)
        logger.info("Seeked to offset %d for %s-%d", offset, topic, partition)

    async def position(self, topic: str, partition: int) -> int:
        """Get the current consumer position for a topic partition."""
        tp = TopicPartition(topic, partition)
        return await self.consumer.position(tp)

    async def end_offset(self, topic: str, partition: int) -> int:
        """Get the end offset for a topic partition (used for lag calculation)."""
        tp = TopicPartition(topic, partition)
        offsets = await self.consumer.end_offsets([tp])
        return offsets.get(tp, 0)

    async def get_consumer_lag(self) -> int:
        """Calculate total consumer lag across all assigned partitions."""
        total_lag = 0
        try:
            assignment = self.consumer.assignment()
            if not assignment:
                return 0
            end_offsets = await self.consumer.end_offsets(assignment)
            for tp in assignment:
                pos = await self.consumer.position(tp)
                end = end_offsets.get(tp, 0)
                total_lag += max(0, end - pos)
        except KafkaError:
            logger.exception("Error calculating consumer lag")
        self._metrics.consumer_lag = total_lag
        return total_lag
