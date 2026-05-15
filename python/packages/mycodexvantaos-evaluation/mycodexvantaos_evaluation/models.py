"""
Evaluation data models
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class EvaluationMetric(BaseModel):
    """A single evaluation metric"""

    name: str
    value: float
    threshold: float | None = None
    passed: bool | None = None
    description: str | None = None


class EvaluationRun(BaseModel):
    """An evaluation run configuration"""

    run_id: str
    target_service: str
    metrics: list[str] = Field(default_factory=list)
    dataset: str | None = None
    metadata: dict[str, object] = Field(default_factory=dict)


class EvaluationReport(BaseModel):
    """Evaluation report with results"""

    run_id: str
    target_service: str
    metrics: list[EvaluationMetric] = Field(default_factory=list)
    overall_passed: bool = True
    summary: str | None = None
    created_at: str | None = None
