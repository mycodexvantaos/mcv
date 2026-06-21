"""Tests for mycodexvantaos-stream-pipeline processor module."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from mycodexvantaos_stream_pipeline.models import (
    ConsumerConfig,
    KafkaMessage,
    ProcessorConfig,
    ProcessorState,
    ProducerConfig,
    WindowConfig,
    WindowType,
)
from mycodexvantaos_stream_pipeline.processor import StreamProcessor, WindowState

# ---------------------------------------------------------------------------
# WindowState
# ---------------------------------------------------------------------------


class TestWindowState:
    """Tests for WindowState tumbling and hopping window management."""

    def _make_message(
        self,
        topic: str = "test-topic",
        key: str | None = None,
        timestamp_ms: int = 0,
    ) -> KafkaMessage:
        return KafkaMessage(
            topic=topic,
            key=key,
            value="test-value",
            timestamp=timestamp_ms,
        )

    def test_tumbling_window_add_message(self) -> None:
        config = WindowConfig(
            window_type=WindowType.TUMBLING,
            window_size_ms=60000,
        )
        state = WindowState(config)
        now_ms = int(datetime.now(UTC).timestamp() * 1000)
        msg = self._make_message(timestamp_ms=now_ms)
        result = state.add_message(msg)
        # Window should not be closed yet
        assert result is None

    def test_tumbling_window_close_expired(self) -> None:
        config = WindowConfig(
            window_type=WindowType.TUMBLING,
            window_size_ms=1000,  # 1 second window
            grace_period_ms=0,
        )
        state = WindowState(config)

        # Add a message in the past
        past_ms = int((datetime.now(UTC).timestamp() - 10) * 1000)
        msg = self._make_message(timestamp_ms=past_ms)
        state.add_message(msg)

        # Close expired windows
        results = state.close_expired_windows()
        assert len(results) == 1
        assert results[0].record_count == 1

    def test_hopping_window_add_message(self) -> None:
        config = WindowConfig(
            window_type=WindowType.HOPPING,
            window_size_ms=60000,
            hop_size_ms=10000,
        )
        state = WindowState(config)
        now_ms = int(datetime.now(UTC).timestamp() * 1000)
        msg = self._make_message(timestamp_ms=now_ms)
        result = state.add_message(msg)
        assert result is None

    def test_window_aggregation_custom(self) -> None:
        config = WindowConfig(
            window_type=WindowType.TUMBLING,
            window_size_ms=1000,
            grace_period_ms=0,
        )
        state = WindowState(config)

        def sum_aggregate(acc: int, msg: KafkaMessage) -> int:
            val = msg.value if isinstance(msg.value, (int, float)) else 1
            return (acc or 0) + val

        past_ms = int((datetime.now(UTC).timestamp() - 10) * 1000)
        msg1 = self._make_message(timestamp_ms=past_ms)
        msg2 = self._make_message(timestamp_ms=past_ms)

        state.add_message(msg1, aggregate_fn=sum_aggregate, initial_value=0)
        state.add_message(msg2, aggregate_fn=sum_aggregate, initial_value=0)

        results = state.close_expired_windows()
        assert len(results) == 1
        assert results[0].record_count == 2

    def test_window_with_key_partitioning(self) -> None:
        config = WindowConfig(
            window_type=WindowType.TUMBLING,
            window_size_ms=1000,
            grace_period_ms=0,
        )
        state = WindowState(config)

        past_ms = int((datetime.now(UTC).timestamp() - 10) * 1000)
        msg_a = self._make_message(key="user-a", timestamp_ms=past_ms)
        msg_b = self._make_message(key="user-b", timestamp_ms=past_ms)

        state.add_message(msg_a)
        state.add_message(msg_b)

        results = state.close_expired_windows()
        assert len(results) == 2  # Two windows, one per key

    def test_late_records_dropped(self) -> None:
        """Messages arriving after window end + grace period should be dropped."""
        config = WindowConfig(
            window_type=WindowType.TUMBLING,
            window_size_ms=1000,
            grace_period_ms=0,
        )
        state = WindowState(config)

        # Add a message with a very old timestamp
        very_old_ms = int((datetime.now(UTC).timestamp() - 100) * 1000)
        msg = self._make_message(timestamp_ms=very_old_ms)
        state.add_message(msg)

        # Close the window
        results = state.close_expired_windows()
        assert len(results) == 1

        # Now add another message to the same closed window
        # This message should be considered late since the window is already closed
        msg2 = self._make_message(timestamp_ms=very_old_ms)
        result = state.add_message(msg2)
        assert result is None  # Late message returns None


# ---------------------------------------------------------------------------
# StreamProcessor
# ---------------------------------------------------------------------------


class TestStreamProcessor:
    """Tests for StreamProcessor lifecycle and configuration."""

    def test_processor_creation(self) -> None:
        config = ProcessorConfig(
            name="test-processor",
            input_topics=["input-topic"],
            output_topic="output-topic",
        )
        processor = StreamProcessor(config)
        assert processor.name == "test-processor"
        assert processor.state == ProcessorState.CREATED
        assert processor.metrics.processor_name == "test-processor"

    def test_processor_with_transform(self) -> None:
        config = ProcessorConfig(
            name="transform-proc",
            input_topics=["in"],
            output_topic="out",
        )
        processor = StreamProcessor(config)

        def uppercase(msg: KafkaMessage) -> KafkaMessage:
            if isinstance(msg.value, str):
                msg.value = msg.value.upper()
            return msg

        result = processor.with_transform(uppercase)
        assert result is processor  # Builder pattern returns self

    def test_processor_with_aggregate(self) -> None:
        config = ProcessorConfig(
            name="agg-proc",
            input_topics=["in"],
            output_topic="out",
        )
        processor = StreamProcessor(config)

        def count_agg(acc: int, _msg: KafkaMessage) -> int:
            return (acc or 0) + 1

        result = processor.with_aggregate(count_agg, initial=0)
        assert result is processor

    def test_processor_with_window_trigger(self) -> None:
        config = ProcessorConfig(
            name="win-proc",
            input_topics=["in"],
            output_topic="out",
            window_config=WindowConfig(
                window_type=WindowType.TUMBLING,
                window_size_ms=60000,
            ),
        )
        processor = StreamProcessor(config)

        async def on_trigger(result: object) -> None:
            pass

        result = processor.with_window_trigger(on_trigger)
        assert result is processor

    def test_processor_with_window_config(self) -> None:
        window = WindowConfig(
            window_type=WindowType.HOPPING,
            window_size_ms=60000,
            hop_size_ms=10000,
        )
        config = ProcessorConfig(
            name="windowed-proc",
            input_topics=["in"],
            output_topic="out",
            window_config=window,
        )
        processor = StreamProcessor(config)
        assert processor._window_state is not None

    @pytest.mark.asyncio
    async def test_processor_start_stop(self) -> None:
        config = ProcessorConfig(
            name="lifecycle-proc",
            input_topics=["in"],
            output_topic="out",
            consumer_config=ConsumerConfig(
                bootstrap_servers="localhost:9092",
                group_id="test-group",
            ),
            producer_config=ProducerConfig(
                bootstrap_servers="localhost:9092",
                client_id="test-producer",
            ),
        )
        processor = StreamProcessor(config)

        with (
            patch.object(StreamProcessor, "start", new_callable=AsyncMock) as mock_start,
            patch.object(StreamProcessor, "stop", new_callable=AsyncMock) as mock_stop,
        ):
            await processor.start()
            mock_start.assert_called_once()

            await processor.stop()
            mock_stop.assert_called_once()

    def test_processor_state_values(self) -> None:
        assert ProcessorState.CREATED.value == "created"
        assert ProcessorState.STARTING.value == "starting"
        assert ProcessorState.RUNNING.value == "running"
        assert ProcessorState.PAUSED.value == "paused"
        assert ProcessorState.STOPPING.value == "stopping"
        assert ProcessorState.STOPPED.value == "stopped"
        assert ProcessorState.ERROR.value == "error"
