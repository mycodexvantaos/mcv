"""Stream producer with exactly-once semantics support."""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from typing import Any

from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaError
from mycodexvantaos_stream_pipeline.models import (
    CompressionType,
    DeadLetterMessage,
    DeliverySemantic,
    KafkaMessage,
    ProducerConfig,
    StreamMetrics,
)

logger = logging.getLogger(__name__)

_COMPRESSION_MAP: dict[CompressionType, str] = {
    CompressionType.NONE: "none",
    CompressionType.GZIP: "gzip",
    CompressionType.SNAPPY: "snappy",
    CompressionType.LZ4: "lz4",
    CompressionType.ZSTD: "zstd",
}


class StreamProducer:
    """Async Kafka producer with configurable delivery semantics.

    Supports at-most-once, at-least-once, and exactly-once delivery
    via idempotent producers and transactional commits.
    """

    def __init__(self, config: ProducerConfig, metrics: StreamMetrics) -> None:
        self._config = config
        self._metrics = metrics
        self._producer: AIOKafkaProducer | None = None

    async def start(self) -> None:
        """Start the producer and connect to Kafka."""
        compression = _COMPRESSION_MAP.get(self._config.compression, "none")

        producer_kwargs: dict[str, Any] = {
            "bootstrap_servers": self._config.bootstrap_servers,
            "client_id": self._config.client_id,
            "acks": self._config.acks,
            "compression_type": compression if compression != "none" else None,
            "linger_ms": self._config.linger_ms,
            "batch_size": self._config.batch_size,
            "max_in_flight_requests_per_connection": self._config.max_in_flight_requests,
            "retry_backoff_ms": self._config.retry_backoff_ms,
            "request_timeout_ms": self._config.request_timeout_ms,
        }

        if self._config.delivery_semantic == DeliverySemantic.EXACTLY_ONCE:
            if not self._config.transactional_id:
                raise ValueError(
                    "transactional_id is required for exactly-once semantics"
                )
            producer_kwargs["transactional_id"] = self._config.transactional_id
            producer_kwargs["enable_idempotence"] = True
        elif self._config.enable_idempotence:
            producer_kwargs["enable_idempotence"] = True

        self._producer = AIOKafkaProducer(**producer_kwargs)
        await self._producer.start()

        if self._config.delivery_semantic == DeliverySemantic.EXACTLY_ONCE:
            # Initialize transactions — must be called before any transactional sends
            try:
                await self._producer.init_transactions()
            except KafkaError:
                logger.exception("Failed to initialize transactions for producer")

        logger.info(
            "Stream producer started — semantic: %s, bootstrap: %s",
            self._config.delivery_semantic.value,
            self._config.bootstrap_servers,
        )

    async def stop(self) -> None:
        """Flush pending messages and close the producer."""
        if self._producer:
            try:
                await self._producer.flush()
            except KafkaError:
                logger.exception("Error flushing producer during shutdown")
            await self._producer.stop()
            self._producer = None
            logger.info("Stream producer stopped")

    @property
    def producer(self) -> AIOKafkaProducer:
        """Get the underlying producer, raising if not started."""
        if self._producer is None:
            raise RuntimeError("Producer not started — call start() first")
        return self._producer

    async def send(
        self,
        topic: str,
        value: Any,
        key: str | bytes | None = None,
        headers: dict[str, str] | None = None,
    ) -> tuple[int, int] | None:
        """Send a message to a Kafka topic.

        Returns (partition, offset) on success, None on failure.
        """
        start_time = time.monotonic()

        if isinstance(value, dict):
            serialized_value = json.dumps(value, default=str).encode("utf-8")
        elif isinstance(value, bytes):
            serialized_value = value
        elif isinstance(value, str):
            serialized_value = value.encode("utf-8")
        else:
            serialized_value = json.dumps(value, default=str).encode("utf-8")

        if isinstance(key, str):
            serialized_key = key.encode("utf-8")
        else:
            serialized_key = key

        kafka_headers: list[tuple[str, bytes]] | None = None
        if headers:
            kafka_headers = [(k, v.encode("utf-8")) for k, v in headers.items()]

        try:
            if self._config.delivery_semantic == DeliverySemantic.EXACTLY_ONCE:
                async with self._producer.transaction():
                    result = await self._producer.send_and_wait(
                        topic,
                        value=serialized_value,
                        key=serialized_key,
                        headers=kafka_headers,
                    )
            else:
                result = await self.producer.send_and_wait(
                    topic,
                    value=serialized_value,
                    key=serialized_key,
                    headers=kafka_headers,
                )

            elapsed = (time.monotonic() - start_time) * 1000
            self._metrics.messages_produced += 1
            self._metrics.processing_latency_ms = elapsed
            self._metrics.last_message_at = datetime.now(timezone.utc)

            logger.debug(
                "Sent message to %s partition=%d offset=%d latency=%.1fms",
                topic,
                result.partition,
                result.offset,
                elapsed,
            )
            return (result.partition, result.offset)

        except KafkaError:
            self._metrics.messages_errored += 1
            logger.exception("Failed to send message to topic '%s'", topic)
            return None

    async def send_batch(
        self,
        topic: str,
        messages: list[KafkaMessage],
    ) -> list[tuple[int, int] | None]:
        """Send a batch of messages to a Kafka topic.

        For exactly-once semantics, all messages are sent within a single transaction.
        Returns a list of (partition, offset) tuples or None for failures.
        """
        results: list[tuple[int, int] | None] = []

        if self._config.delivery_semantic == DeliverySemantic.EXACTLY_ONCE:
            try:
                async with self._producer.transaction():
                    for msg in messages:
                        result = await self._producer.send_and_wait(
                            topic,
                            value=msg.serialized_value(),
                            key=(
                                msg.key.encode("utf-8")
                                if isinstance(msg.key, str)
                                else None
                            ),
                            headers=(
                                [(k, v.encode("utf-8")) for k, v in msg.headers.items()]
                                if msg.headers
                                else None
                            ),
                        )
                        results.append((result.partition, result.offset))
                        self._metrics.messages_produced += 1
            except KafkaError:
                self._metrics.messages_errored += len(messages)
                logger.exception("Transaction failed for batch send to '%s'", topic)
                results = [None] * len(messages)
        else:
            for msg in messages:
                r = await self.send(
                    topic=topic,
                    value=msg.value,
                    key=msg.key,
                    headers=msg.headers,
                )
                results.append(r)

        return results

    async def send_dead_letter(self, dlq: DeadLetterMessage, topic: str = "") -> bool:
        """Send a message to the dead-letter queue.

        Returns True if the dead-letter was successfully sent.
        """
        target_topic = topic or f"dlq.{dlq.original_topic}"
        payload = json.loads(dlq.model_dump_json())
        result = await self.send(
            topic=target_topic, value=payload, key=dlq.original_key
        )
        if result:
            self._metrics.dead_letter_count += 1
            logger.info(
                "Sent dead-letter for topic '%s' partition=%d offset=%d to '%s'",
                dlq.original_topic,
                result[0],
                result[1],
                target_topic,
            )
            return True
        return False

    async def begin_transaction(self) -> None:
        """Begin a Kafka transaction (for exactly-once semantics)."""
        if self._config.delivery_semantic != DeliverySemantic.EXACTLY_ONCE:
            raise RuntimeError("Transactions require exactly-once delivery semantic")
        await self._producer.begin_transaction()

    async def commit_transaction(self) -> None:
        """Commit the current Kafka transaction."""
        await self._producer.commit_transaction()

    async def abort_transaction(self) -> None:
        """Abort the current Kafka transaction."""
        await self._producer.abort_transaction()
