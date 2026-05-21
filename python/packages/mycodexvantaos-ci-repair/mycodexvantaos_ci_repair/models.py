"""Data models for CI repair analysis and repair plans."""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ErrorCategory(str, enum.Enum):
    """Classification of CI failure root causes."""

    DEPENDENCY_ERROR = "dependency_error"
    TEST_FAILURE = "test_failure"
    LINT_ERROR = "lint_error"
    BUILD_ERROR = "build_error"
    DOCKER_BUILD_ERROR = "docker_build_error"
    DEPLOYMENT_ERROR = "deployment_error"
    PERMISSION_ERROR = "permission_error"
    CONFIGURATION_ERROR = "configuration_error"
    TIMEOUT_ERROR = "timeout_error"
    UNKNOWN_ERROR = "unknown_error"


class FailureSeverity(str, enum.Enum):
    """Severity of a CI failure."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RepairActionType(str, enum.Enum):
    """Type of repair action."""

    PATCH_FILE = "patch_file"
    UPDATE_DEPENDENCY = "update_dependency"
    FIX_LINT = "fix_lint"
    FIX_TEST = "fix_test"
    UPDATE_WORKFLOW = "update_workflow"
    UPDATE_DOCKERFILE = "update_dockerfile"
    MANUAL_INTERVENTION = "manual_intervention"
    RETRY_RUN = "retry_run"
    NO_ACTION = "no_action"


class WorkflowRunSummary(BaseModel):
    """Summary of a GitHub Actions workflow run."""

    run_id: int
    run_name: str
    status: str
    conclusion: str | None = None
    head_branch: str
    event: str
    created_at: datetime
    updated_at: datetime
    html_url: str = ""
    workflow_id: int = 0


class FailedStep(BaseModel):
    """A single failed step within a job."""

    step_name: str
    step_number: int
    conclusion: str
    log_excerpt: str = Field(default="", description="Last N lines of step log")


class FailedJob(BaseModel):
    """A failed job within a workflow run."""

    job_id: int
    job_name: str
    conclusion: str
    failed_steps: list[FailedStep] = Field(default_factory=list)
    full_log: str = Field(default="", description="Complete job log text")


class FailureAnalysis(BaseModel):
    """Analysis result for a single failure."""

    run_id: int
    job_id: int
    job_name: str
    error_category: ErrorCategory
    severity: FailureSeverity
    root_cause: str
    affected_files: list[str] = Field(default_factory=list)
    affected_dependencies: list[str] = Field(default_factory=list)
    log_evidence: str = ""
    suggested_fix: str = ""
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class RepairAction(BaseModel):
    """A single repair action to apply."""

    action_type: RepairActionType
    description: str
    file_path: str = ""
    patch_content: str = Field(default="", description="Unified diff or file content")
    command: str = Field(default="", description="Shell command to execute the fix")
    risk_level: FailureSeverity = FailureSeverity.LOW
    requires_manual_review: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)


class RepairPlan(BaseModel):
    """Complete repair plan for a workflow run failure."""

    run_id: int
    run_name: str
    branch: str
    analyses: list[FailureAnalysis] = Field(default_factory=list)
    actions: list[RepairAction] = Field(default_factory=list)
    branch_name: str = ""
    pr_title: str = ""
    pr_body: str = ""
    can_auto_fix: bool = False
    summary: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
