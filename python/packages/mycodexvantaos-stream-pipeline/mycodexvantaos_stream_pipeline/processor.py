"""Stream processor — transform, aggregate, and window operations on Kafka streams."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

from mycodexvantaos_stream_pipeline.consumer import StreamConsumer
from mycodexvantaos_stream_pipeline.models import (
    DeadLetterMessage,
    DeliverySemantic,
    KafkaMessage,
    ProcessorConfig,
    ProcessorState,
    StreamMetrics,
    WindowConfig,
    WindowResult,
    WindowType,
)
from mycodexvantaos_stream_pipeline.producer import StreamProducer

logger = logging.getLogger(__name__)

# Type aliases for processor functions
TransformFunc = Callable[[KafkaMessage], KafkaMessage | None]
AggregateFunc = Callable[[Any, KafkaMessage], Any]
WindowTriggerFunc = Callable[[WindowResult], Awaitable[None]]


class WindowState:
    """Manages window state for tumbling and hopping windows."""

    def __init__(self, config: WindowConfig) -> None:
        self._config = config
        self._windows: dict[str, dict[str, Any]] = {}
        self._window_results: list[WindowResult] = []
        self._closed_window_keys: set[str] = set()

    def _window_key(self, message_key: str | None, window_start: datetime) -> str:
        """Generate a unique key for a window bucket."""
        return f"{message_key or '__all__'}:{window_start.isoformat()}"

    def _compute_window_start(self, timestamp_ms: int) -> datetime:
        """Compute the window start time for a given timestamp."""
        epoch_ms = timestamp_ms
        window_ms = self._config.window_size_ms

        if self._config.window_type == WindowType.TUMBLING:
            aligned = (epoch_ms // window_ms) * window_ms
            return datetime.fromtimestamp(aligned / 1000.0, tz=timezone.utc)

        if self._config.window_type == WindowType.HOPPING:
            hop_ms = self._config.hop_size_ms
            aligned = (epoch_ms // hop_ms) * hop_ms
            return datetime.fromtimestamp(aligned / 1000.0, tz=timezone.utc)

        # Default: tumbling
        aligned = (epoch_ms // window_ms) * window_ms
        return datetime.fromtimestamp(aligned / 1000.0, tz=timezone.utc)

    def add_message(
        self,
        message: KafkaMessage,
        aggregate_fn: AggregateFunc | None = None,
        initial_value: Any = None,
    ) -> WindowResult | None:
        """Add a message to the appropriate window bucket.

        Returns a WindowResult if the window was triggered (closed), None otherwise.
        Messages are considered late if their timestamp falls into a window that has
        already closed (window_end + grace_period < current processing time).
        """
        timestamp_ms = (
            message.timestamp
            if message.timestamp > 0
            else int(datetime.now(timezone.utc).timestamp() * 1000)
        )
        window_start = self._compute_window_start(timestamp_ms)
        window_end_dt = datetime.fromtimestamp(
            window_start.timestamp() + self._config.window_size_ms / 1000.0,
            tz=timezone.utc,
        )

        key = self._window_key(message.key, window_start)

        # Check if message is late — it belongs to a window that was already closed
        if key in self._closed_window_keys:
            # Find or create a tracker bucket for the closed window
            if key not in self._windows:
                self._windows[key] = {
                    "window_start": window_start,
                    "window_end": window_end_dt,
                    "key": message.key,
                    "value": initial_value,
                    "record_count": 0,
                    "late_records_dropped": 0,
                }
            self._windows[key]["late_records_dropped"] += 1
            logger.debug("Dropping late record for closed window %s", key)
            return None

        if key not in self._windows:
            self._windows[key] = {
                "window_start": window_start,
                "window_end": window_end_dt,
                "key": message.key,
                "value": initial_value,
                "record_count": 0,
                "late_records_dropped": 0,
            }

        bucket = self._windows[key]

        # Check if message is late (the window it belongs to has already closed)
        # A message is late if the current processing time is past the window's
        # end time plus grace period. However, we only check this against
        # already-closed windows that were removed by close_expired_windows().
        # For the add_message path, we allow the message into the bucket and
        # let close_expired_windows handle the timing.

        # Apply aggregation function
        if aggregate_fn:
            bucket["value"] = aggregate_fn(bucket["value"], message)
        else:
            # Default: count aggregation
            bucket["value"] = bucket.get("value", 0)
            if not isinstance(bucket["value"], int):
                bucket["value"] = 0
            bucket["value"] += 1

        bucket["record_count"] += 1
        return None

    def close_expired_windows(self) -> list[WindowResult]:
        """Close windows that have passed their end time plus grace period.

        Returns a list of WindowResult for all closed windows.
        A window is expired when the current processing time exceeds
        window_end + grace_period.
        """
        now_ms = datetime.now(timezone.utc).timestamp() * 1000
        results: list[WindowResult] = []
        keys_to_remove: list[str] = []

        for key, bucket in self._windows.items():
            window_close_ms = (
                bucket["window_end"].timestamp() * 1000 + self._config.grace_period_ms
            )
            if now_ms >= window_close_ms:
                result = WindowResult(
                    window_start=bucket["window_start"],
                    window_end=bucket["window_end"],
                    window_type=self._config.window_type,
                    key=bucket["key"],
                    aggregate_value=bucket["value"],
                    record_count=bucket["record_count"],
                    late_records_dropped=bucket["late_records_dropped"],
                )
                results.append(result)
                keys_to_remove.append(key)

        for key in keys_to_remove:
            del self._windows[key]

        # Track closed window keys so future late messages are detected
        self._closed_window_keys: set[str] = set(keys_to_remove)

        self._window_results.extend(results)
        return results


class StreamProcessor:
    """Kafka stream processor supporting transform, aggregate, and window operations.

    The processor consumes from input topics, applies transformations and
    aggregations, and produces results to output topics. Failed messages are
    routed to a dead-letter queue.
    """

    def __init__(self, config: ProcessorConfig) -> None:
        self._config = config
        self._metrics = StreamMetrics(processor_name=config.name)
        self._state = ProcessorState.CREATED
        self._producer: StreamProducer | None = None
        self._consumer: StreamConsumer | None = None
        self._window_state: WindowState | None = None
        self._transform_fn: TransformFunc | None = None
        self._aggregate_fn: AggregateFunc | None = None
        self._window_trigger_fn: WindowTriggerFunc | None = None
        self._aggregate_initial: Any = None
        self._task: asyncio.Task | None = None

        if config.window_config:
            self._window_state = WindowState(config.window_config)

    @property
    def name(self) -> str:
        """Processor name."""
        return self._config.name

    @property
    def state(self) -> ProcessorState:
        """Current processor state."""
        return self._state

    @property
    def metrics(self) -> StreamMetrics:
        """Current processor metrics."""
        return self._metrics

    @property
    def config(self) -> ProcessorConfig:
        """Processor configuration."""
        return self._config

    def with_transform(self, fn: TransformFunc) -> "StreamProcessor":
        """Set the transformation function for this processor.

        The transform function receives a KafkaMessage and returns
        a transformed KafkaMessage, or None to filter out the message.
        """
        self._transform_fn = fn
        return self

    def with_aggregate(
        self,
        fn: AggregateFunc,
        initial: Any = None,
    ) -> "StreamProcessor":
        """Set the aggregation function for this processor.

        The aggregate function receives (accumulator, message) and returns
        the updated accumulator value.
        """
        self._aggregate_fn = fn
        self._aggregate_initial = initial
        return self

    def with_window_trigger(self, fn: WindowTriggerFunc) -> "StreamProcessor":
        """Set the window trigger callback.

        Called when a window closes and produces a result.
        """
        self._window_trigger_fn = fn
        return self

    async def start(self) -> None:
        """Start the stream processor (consumer, producer, and processing loop)."""
        if self._state == ProcessorState.RUNNING:
            logger.warning("Processor '%s' is already running", self._config.name)
            return

        self._state = ProcessorState.STARTING

        # Initialize producer
        self._producer = StreamProducer(self._config.producer_config, self._metrics)
        await self._producer.start()

        # Initialize consumer
        self._consumer = StreamConsumer(
            config=self._config.consumer_config,
            topics=self._config.input_topics,
            metrics=self._metrics,
        )
        await self._consumer.start()

        self._state = ProcessorState.RUNNING
        self._start_time = time.monotonic()

        logger.info("Stream processor '%s' started", self._config.name)

    async def stop(self) -> None:
        """Stop the stream processor gracefully."""
        if self._state in (ProcessorState.STOPPED, ProcessorState.STOPPING):
            return

        self._state = ProcessorState.STOPPING

        if self._consumer:
            await self._consumer.stop()
        if self._producer:
            await self._producer.stop()

        self._state = ProcessorState.STOPPED
        logger.info("Stream processor '%s' stopped", self._config.name)

    async def process_once(self, max_records: int = 10, timeout_ms: int = 5000) -> int:
        """Process a single batch of messages.

        Returns the number of messages successfully processed.
        """
        if not self._consumer or not self._producer:
            raise RuntimeError("Processor not started — call start() first")

        if self._state != ProcessorState.RUNNING:
            return 0

        messages = await self._consumer.consume(
            max_records=max_records, timeout_ms=timeout_ms
        )
        if not messages:
            return 0

        processed = 0
        for msg in messages:
            try:
                result = await self._process_message(msg)
                if result:
                    processed += 1
            except Exception:
                self._metrics.messages_errored += 1
                await self._send_to_dead_letter(msg, "processing_error")
                logger.exception(
                    "Error processing message from %s-%d", msg.topic, msg.partition
                )

        # Commit offsets after successful processing (at-least-once)
        if (
            self._config.delivery_semantic == DeliverySemantic.AT_LEAST_ONCE
            and not self._config.consumer_config.enable_auto_commit
        ):
            await self._consumer.commit()

        # Check for expired windows
        if self._window_state:
            window_results = self._window_state.close_expired_windows()
            for wr in window_results:
                self._metrics.window_results_count += 1
                if self._window_trigger_fn:
                    try:
                        await self._window_trigger_fn(wr)
                    except Exception:
                        logger.exception("Error in window trigger callback")
                if self._config.output_topic:
                    await self._producer.send(
                        topic=self._config.output_topic,
                        value=json.loads(wr.model_dump_json()),
                        key=str(wr.key) if wr.key else None,
                    )

        # Update uptime
        if hasattr(self, "_start_time"):
            self._metrics.uptime_seconds = time.monotonic() - self._start_time

        return processed

    async def run(self) -> None:
        """Run the processing loop continuously until stopped."""
        if self._state != ProcessorState.RUNNING:
            await self.start()

        logger.info("Stream processor '%s' entering main loop", self._config.name)
        try:
            while self._state == ProcessorState.RUNNING:
                await self.process_once(max_records=100, timeout_ms=1000)
                # Brief yield to allow other coroutines
                await asyncio.sleep(0.01)
        except asyncio.CancelledError:
            logger.info("Stream processor '%s' cancelled", self._config.name)
        except Exception:
            self._state = ProcessorState.ERROR
            logger.exception(
                "Stream processor '%s' encountered fatal error", self._config.name
            )
        finally:
            await self.stop()

    async def run_as_task(self) -> asyncio.Task:
        """Start the processing loop as an asyncio task."""
        self._task = asyncio.create_task(self.run())
        return self._task

    async def _process_message(self, message: KafkaMessage) -> bool:
        """Process a single message through the pipeline.

        Returns True if the message was successfully processed and forwarded.
        """
        # Apply transformation
        if self._transform_fn:
            transformed = self._transform_fn(message)
            if transformed is None:
                # Message was filtered out — not an error
                return True
            message = transformed

        # Apply windowing / aggregation
        if self._window_state:
            self._window_state.add_message(
                message,
                aggregate_fn=self._aggregate_fn,
                initial_value=self._aggregate_initial,
            )
            # Windowed messages are emitted when windows close, not immediately
            return True

        # Apply non-windowed aggregation
        if self._aggregate_fn:
            self._aggregate_initial = self._aggregate_fn(
                self._aggregate_initial, message
            )
            return True

        # Forward to output topic
        if self._config.output_topic and self._producer:
            result = await self._producer.send(
                topic=self._config.output_topic,
                value=message.value,
                key=message.key,
                headers=message.headers,
            )
            return result is not None

        return True

    async def _send_to_dead_letter(
        self, message: KafkaMessage, error_type: str
    ) -> None:
        """Send a failed message to the dead-letter queue."""
        if not self._producer:
            return

        dlq = DeadLetterMessage(
            original_topic=message.topic,
            original_partition=message.partition,
            original_offset=message.offset,
            original_key=message.key,
            original_value=message.value,
            original_headers=message.headers,
            error_message=f"Failed to process message from {message.topic}",
            error_type=error_type,
            processor_name=self._config.name,
        )
        target = self._config.error_topic or f"dlq.{message.topic}"
        await self._producer.send_dead_letter(dlq, topic=target)
