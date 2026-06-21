"""Tests for mycodexvantaos-stream-pipeline metrics collector."""

from __future__ import annotations

from mycodexvantaos_stream_pipeline.metrics import MetricsCollector
from mycodexvantaos_stream_pipeline.models import StreamMetrics


class TestMetricsCollector:
    """Tests for MetricsCollector Prometheus-compatible metrics."""

    def test_register_processor(self) -> None:
        collector = MetricsCollector()
        metrics = StreamMetrics(processor_name="test-proc")
        collector.register_processor("test-proc", metrics)
        assert collector.get_processor_metrics("test-proc") is metrics

    def test_unregister_processor(self) -> None:
        collector = MetricsCollector()
        metrics = StreamMetrics(processor_name="test-proc")
        collector.register_processor("test-proc", metrics)
        collector.unregister_processor("test-proc")
        assert collector.get_processor_metrics("test-proc") is None

    def test_unregister_nonexistent(self) -> None:
        collector = MetricsCollector()
        collector.unregister_processor("nonexistent")  # Should not raise

    def test_get_all_metrics(self) -> None:
        collector = MetricsCollector()
        m1 = StreamMetrics(processor_name="p1")
        m2 = StreamMetrics(processor_name="p2")
        collector.register_processor("p1", m1)
        collector.register_processor("p2", m2)
        all_metrics = collector.get_all_metrics()
        assert len(all_metrics) == 2
        assert "p1" in all_metrics
        assert "p2" in all_metrics

    def test_get_aggregate_metrics(self) -> None:
        collector = MetricsCollector()
        m1 = StreamMetrics(
            processor_name="p1", messages_consumed=10, messages_produced=8
        )
        m2 = StreamMetrics(
            processor_name="p2", messages_consumed=20, messages_produced=15
        )
        collector.register_processor("p1", m1)
        collector.register_processor("p2", m2)
        agg = collector.get_aggregate_metrics()
        assert agg.messages_consumed == 30
        assert agg.messages_produced == 23
        assert agg.processor_name == "__aggregate__"

    def test_prometheus_format(self) -> None:
        collector = MetricsCollector()
        metrics = StreamMetrics(
            processor_name="test-proc",
            messages_consumed=100,
            messages_produced=95,
            messages_errored=2,
            dead_letter_count=1,
            consumer_lag=5,
            processing_latency_ms=12.5,
            throughput_per_second=10.0,
        )
        collector.register_processor("test-proc", metrics)
        output = collector.to_prometheus_format()

        assert "# HELP stream_messages_consumed" in output
        assert "# TYPE stream_messages_consumed counter" in output
        assert 'stream_messages_consumed{processor="test_proc"} 100' in output
        assert "# HELP stream_messages_produced" in output
        assert 'stream_messages_produced{processor="test_proc"} 95' in output
        assert "# HELP stream_messages_errored" in output
        assert 'stream_messages_errored{processor="test_proc"} 2' in output
        assert "# HELP stream_dead_letter_count" in output
        assert 'stream_dead_letter_count{processor="test_proc"} 1' in output
        assert "# HELP stream_consumer_lag" in output
        assert "# TYPE stream_consumer_lag gauge" in output
        assert 'stream_consumer_lag{processor="test_proc"} 5' in output
        assert "# HELP stream_uptime_seconds" in output
        assert "stream_uptime_seconds" in output

    def test_prometheus_format_kebab_to_underscore(self) -> None:
        """Processor names with hyphens are converted to underscores in labels."""
        collector = MetricsCollector()
        metrics = StreamMetrics(
            processor_name="my-processor", messages_consumed=5)
        collector.register_processor("my-processor", metrics)
        output = collector.to_prometheus_format()
        assert 'stream_messages_consumed{processor="my_processor"} 5' in output

    def test_compute_throughput(self) -> None:
        collector = MetricsCollector()
        metrics = StreamMetrics(
            processor_name="tp-proc",
            messages_consumed=1000,
            uptime_seconds=100.0,
        )
        collector.register_processor("tp-proc", metrics)
        collector.compute_throughput()
        assert metrics.throughput_per_second == 10.0

    def test_compute_throughput_zero_uptime(self) -> None:
        collector = MetricsCollector()
        metrics = StreamMetrics(
            processor_name="zero-proc",
            messages_consumed=100,
            uptime_seconds=0.0,
        )
        collector.register_processor("zero-proc", metrics)
        collector.compute_throughput()
        assert metrics.throughput_per_second == 0.0

    def test_prometheus_format_multiple_processors(self) -> None:
        collector = MetricsCollector()
        m1 = StreamMetrics(processor_name="proc-a", messages_consumed=10)
        m2 = StreamMetrics(processor_name="proc-b", messages_consumed=20)
        collector.register_processor("proc-a", m1)
        collector.register_processor("proc-b", m2)
        output = collector.to_prometheus_format()
        assert 'processor="proc_a"' in output
        assert 'processor="proc_b"' in output

    def test_empty_collector(self) -> None:
        collector = MetricsCollector()
        assert collector.get_all_metrics() == {}
        agg = collector.get_aggregate_metrics()
        assert agg.messages_consumed == 0
        output = collector.to_prometheus_format()
        assert "stream_uptime_seconds" in output
