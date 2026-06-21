"""
Feedback Loop - Adaptive learning and optimization
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


@dataclass
class Feedback:
    """Feedback item"""

    decision_id: str
    actual_outcome: str
    expected_outcome: str
    accuracy: float
    timestamp: datetime


class ResultAnalyzer:
    """Analyzes decision results"""

    async def analyze(
        self, result: Dict[str, Any], actual_outcome: str
    ) -> Dict[str, Any]:
        """Analyze result against actual outcome"""
        expected_outcome = result.get("verdict")
        accuracy = 1.0 if expected_outcome == actual_outcome else 0.0

        return {
            "accuracy": accuracy,
            "expected": expected_outcome,
            "actual": actual_outcome,
            "confidence_match": result.get("confidence", 0) if accuracy == 1.0 else 0,
        }


class PerformanceMetrics:
    """Collects and aggregates performance metrics"""

    def __init__(self):
        self.metrics: List[Dict[str, Any]] = []

    def record(self, metric: Dict[str, Any]) -> None:
        """Record a metric"""
        self.metrics.append(
            {
                "timestamp": datetime.now().isoformat(),
                **metric,
            }
        )

    def get_summary(self) -> Dict[str, Any]:
        """Get metrics summary"""
        if not self.metrics:
            return {}

        accuracies = [m.get("accuracy", 0) for m in self.metrics]
        confidences = [m.get("confidence", 0) for m in self.metrics]

        return {
            "total_decisions": len(self.metrics),
            "avg_accuracy": sum(accuracies) / len(accuracies),
            "avg_confidence": sum(confidences) / len(confidences),
            "recent_metrics": self.metrics[-10:],
        }


class AdaptiveOptimizer:
    """Adaptively optimizes parameters based on feedback"""

    def __init__(self):
        self.optimization_history: List[Dict[str, Any]] = []

    async def optimize(
        self, metrics: Dict[str, Any], current_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Optimize parameters based on metrics"""
        optimized = current_params.copy()

        avg_accuracy = metrics.get("avg_accuracy", 0.5)

        # Adjust thresholds based on accuracy
        if avg_accuracy < 0.7:
            optimized["evidence_sufficiency_threshold"] = max(
                0.5, optimized.get(
                    "evidence_sufficiency_threshold", 0.7) - 0.05
            )
            optimized["hypothesis_confidence_min"] = max(
                0.4, optimized.get("hypothesis_confidence_min", 0.6) - 0.05
            )
        elif avg_accuracy > 0.9:
            optimized["evidence_sufficiency_threshold"] = min(
                0.95, optimized.get(
                    "evidence_sufficiency_threshold", 0.7) + 0.05
            )
            optimized["hypothesis_confidence_min"] = min(
                0.9, optimized.get("hypothesis_confidence_min", 0.6) + 0.05
            )

        self.optimization_history.append(
            {
                "timestamp": datetime.now().isoformat(),
                "original": current_params,
                "optimized": optimized,
                "metrics": metrics,
            }
        )

        logger.info(f"Parameters optimized: accuracy={avg_accuracy:.2%}")
        return optimized


class FeedbackLoop:
    """Main feedback loop orchestrator"""

    def __init__(self):
        self.result_analyzer = ResultAnalyzer()
        self.performance_metrics = PerformanceMetrics()
        self.adaptive_optimizer = AdaptiveOptimizer()
        self.feedback_store: List[Feedback] = []

    async def process_feedback(
        self, decision_id: str, actual_outcome: str, result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process feedback and update parameters"""

        # Analyze result
        analysis = await self.result_analyzer.analyze(result, actual_outcome)

        # Record metrics
        self.performance_metrics.record(analysis)

        # Store feedback
        feedback = Feedback(
            decision_id=decision_id,
            actual_outcome=actual_outcome,
            expected_outcome=result.get("verdict"),
            accuracy=analysis["accuracy"],
            timestamp=datetime.now(),
        )
        self.feedback_store.append(feedback)

        logger.info(
            f"Feedback recorded: {decision_id} - accuracy={analysis['accuracy']:.0%}"
        )

        return analysis

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get performance metrics summary"""
        return self.performance_metrics.get_summary()

    def get_optimization_history(self) -> List[Dict[str, Any]]:
        """Get optimization history"""
        return self.adaptive_optimizer.optimization_history
