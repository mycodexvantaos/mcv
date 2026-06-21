"""Metrics collector for Prometheus-compatible stream pipeline monitoring."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from mycodexvantaos_stream_pipeline.models import StreamMetrics

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Collects and exposes stream pipeline metrics in Prometheus exposition format.

    Tracks throughput, latency, error rates, consumer lag, and window metrics.
    """

    def __init__(self) -> None:
        self._processors: dict[str, StreamMetrics] = {}
        self._global_start_time = time.monotonic()

    def register_processor(self, name: str, metrics: StreamMetrics) -> None:
        """Register a processor for metrics tracking."""
        self._processors[name] = metrics
        logger.info("Registered metrics for processor '%s'", name)

    def unregister_processor(self, name: str) -> None:
        """Unregister a processor from metrics tracking."""
        self._processors.pop(name, None)

    def get_processor_metrics(self, name: str) -> StreamMetrics | None:
        """Get metrics for a specific processor."""
        return self._processors.get(name)

    def get_all_metrics(self) -> dict[str, StreamMetrics]:
        """Get metrics for all registered processors."""
        return dict(self._processors)

    def get_aggregate_metrics(self) -> StreamMetrics:
        """Get aggregated metrics across all processors."""
        total = StreamMetrics(processor_name="__aggregate__")
        for m in self._processors.values():
            total.messages_consumed += m.messages_consumed
            total.messages_produced += m.messages_produced
            total.messages_errored += m.messages_errored
            total.dead_letter_count += m.dead_letter_count
            total.window_results_count += m.window_results_count
        total.uptime_seconds = time.monotonic() - self._global_start_time
        total.collected_at = datetime.now(timezone.utc)
        return total

    def to_prometheus_format(self) -> str:
        """Export metrics in Prometheus exposition text format.

        Produces lines like:
            # HELP stream_messages_consumed Total messages consumed
            # TYPE stream_messages_consumed counter
            stream_messages_consumed{processor="my-processor"} 42
        """
        lines: list[str] = []

        # Global uptime
        uptime = time.monotonic() - self._global_start_time
        lines.append("# HELP stream_uptime_seconds Pipeline uptime in seconds")
        lines.append("# TYPE stream_uptime_seconds gauge")
        lines.append(f"stream_uptime_seconds {uptime:.2f}")

        # Per-processor metrics
        metrics_defs = [
            (
                "stream_messages_consumed",
                "Total messages consumed",
                "counter",
                lambda m: m.messages_consumed,
            ),
            (
                "stream_messages_produced",
                "Total messages produced",
                "counter",
                lambda m: m.messages_produced,
            ),
            (
                "stream_messages_errored",
                "Total messages errored",
                "counter",
                lambda m: m.messages_errored,
            ),
            (
                "stream_dead_letter_count",
                "Total dead-letter messages",
                "counter",
                lambda m: m.dead_letter_count,
            ),
            (
                "stream_consumer_lag",
                "Current consumer lag",
                "gauge",
                lambda m: m.consumer_lag,
            ),
            (
                "stream_processing_latency_ms",
                "Processing latency in ms",
                "gauge",
                lambda m: m.processing_latency_ms,
            ),
            (
                "stream_throughput_per_second",
                "Messages per second",
                "gauge",
                lambda m: m.throughput_per_second,
            ),
            (
                "stream_window_results_count",
                "Window results produced",
                "counter",
                lambda m: m.window_results_count,
            ),
            (
                "stream_processor_uptime_seconds",
                "Processor uptime in seconds",
                "gauge",
                lambda m: m.uptime_seconds,
            ),
        ]

        for metric_name, help_text, metric_type, value_fn in metrics_defs:
            lines.append(f"# HELP {metric_name} {help_text}")
            lines.append(f"# TYPE {metric_name} {metric_type}")
            for proc_name, metrics in self._processors.items():
                safe_name = proc_name.replace("-", "_").replace(".", "_")
                val = value_fn(metrics)
                lines.append(f'{metric_name}{{processor="{safe_name}"}} {val}')

        return "\n".join(lines) + "\n"

    def compute_throughput(self) -> None:
        """Compute throughput for all registered processors."""
        for name, metrics in self._processors.items():
            if metrics.uptime_seconds > 0:
                metrics.throughput_per_second = (
                    metrics.messages_consumed / metrics.uptime_seconds
                )
