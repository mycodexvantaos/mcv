"""Shared test fixtures for CI Repair Agent tests."""

from __future__ import annotations

from datetime import datetime
from unittest.mock import AsyncMock

import pytest
from mycodexvantaos_ci_repair.github_client import GitHubActionsClient
from mycodexvantaos_ci_repair.models import (FailedJob, FailedStep,
                                             WorkflowRunSummary)

# ---------------------------------------------------------------------------
# Plain factory functions (can be called directly from tests)
# ---------------------------------------------------------------------------


def make_sample_workflow_runs() -> list[WorkflowRunSummary]:
    """Create sample workflow run summaries for testing."""
    return [
        WorkflowRunSummary(
            run_id=1001,
            run_name="CI Pipeline",
            status="completed",
            conclusion="failure",
            head_branch="main",
            event="push",
            created_at=datetime(2025, 1, 15, 10, 0, 0),
            updated_at=datetime(2025, 1, 15, 10, 15, 0),
            html_url="https://github.com/test/repo/actions/runs/1001",
        ),
        WorkflowRunSummary(
            run_id=1002,
            run_name="Deploy",
            status="completed",
            conclusion="success",
            head_branch="develop",
            event="push",
            created_at=datetime(2025, 1, 15, 11, 0, 0),
            updated_at=datetime(2025, 1, 15, 11, 10, 0),
            html_url="https://github.com/test/repo/actions/runs/1002",
        ),
    ]


def make_sample_failed_jobs() -> list[FailedJob]:
    """Create sample failed jobs for testing."""
    return [
        FailedJob(
            job_id=2001,
            job_name="Build",
            conclusion="failure",
            failed_steps=[
                FailedStep(
                    step_name="Install dependencies",
                    step_number=3,
                    conclusion="failure",
                    log_excerpt="npm ERR! ERESOLVE could not resolve dependency",
                ),
            ],
            full_log=(
                "Running install...\n"
                "npm install --frozen-lockfile\n"
                "npm ERR! ERESOLVE could not resolve dependency\n"
                "npm ERR! While resolving: ws@8.17.0\n"
                "npm ERR! Found: ws@7.5.9\n"
                "Error: Process completed with exit code 1"
            ),
        ),
    ]


def make_sample_lint_failed_jobs() -> list[FailedJob]:
    """Create sample lint-failed jobs for testing."""
    return [
        FailedJob(
            job_id=2002,
            job_name="Lint",
            conclusion="failure",
            failed_steps=[
                FailedStep(
                    step_name="Run ruff check",
                    step_number=2,
                    conclusion="failure",
                    log_excerpt="ruff check error: I001 Import block is unsorted",
                ),
            ],
            full_log=(
                "Running linter...\n"
                "ruff check .\n"
                "src/main.py:1:1: I001 Import block is unsorted\n"
                "ruff check error: 2 errors\n"
                "Error: Process completed with exit code 1"
            ),
        ),
    ]


def make_sample_docker_failed_jobs() -> list[FailedJob]:
    """Create sample docker-build-failed jobs for testing."""
    return [
        FailedJob(
            job_id=2003,
            job_name="Docker Build",
            conclusion="failure",
            failed_steps=[
                FailedStep(
                    step_name="Build Docker image",
                    step_number=4,
                    conclusion="failure",
                    log_excerpt='process "/bin/sh -c npm ci" did not complete successfully',
                ),
            ],
            full_log=(
                "Building Docker image...\n"
                "Step 5/8 : RUN npm ci\n"
                'process "/bin/sh -c npm ci" did not complete successfully\n'
                "COPY failed: file not found in build context\n"
                "Error: Docker build failed"
            ),
        ),
    ]


def make_sample_deployment_failed_jobs() -> list[FailedJob]:
    """Create sample deployment-failed jobs for testing."""
    return [
        FailedJob(
            job_id=2004,
            job_name="Deploy",
            conclusion="failure",
            failed_steps=[
                FailedStep(
                    step_name="Deploy to Cloudflare",
                    step_number=5,
                    conclusion="failure",
                    log_excerpt="cloudflare deploy fail",
                ),
            ],
            full_log=(
                "Deploying to Cloudflare...\n"
                "wrangler deploy\n"
                "wrangler error: Authentication error\n"
                "cloudflare deploy fail: invalid API token\n"
                "Error: deploy failed"
            ),
        ),
    ]


# ---------------------------------------------------------------------------
# Pytest fixtures (for test functions that request them as parameters)
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_workflow_runs() -> list[WorkflowRunSummary]:
    """Create sample workflow run summaries for testing."""
    return make_sample_workflow_runs()


@pytest.fixture
def sample_failed_jobs() -> list[FailedJob]:
    """Create sample failed jobs for testing."""
    return make_sample_failed_jobs()


@pytest.fixture
def sample_lint_failed_jobs() -> list[FailedJob]:
    """Create sample lint-failed jobs for testing."""
    return make_sample_lint_failed_jobs()


@pytest.fixture
def sample_docker_failed_jobs() -> list[FailedJob]:
    """Create sample docker-build-failed jobs for testing."""
    return make_sample_docker_failed_jobs()


@pytest.fixture
def sample_deployment_failed_jobs() -> list[FailedJob]:
    """Create sample deployment-failed jobs for testing."""
    return make_sample_deployment_failed_jobs()


@pytest.fixture
def mock_github_client(
    sample_workflow_runs: list[WorkflowRunSummary],
    sample_failed_jobs: list[FailedJob],
) -> AsyncMock:
    """Create a mocked GitHubActionsClient for API testing."""
    mock_client = AsyncMock(spec=GitHubActionsClient)
    mock_client.list_workflow_runs = AsyncMock(return_value=sample_workflow_runs)
    mock_client.get_failed_jobs = AsyncMock(return_value=sample_failed_jobs)
    mock_client.get_branch_sha = AsyncMock(return_value="abc123def456")
    mock_client.create_branch = AsyncMock(return_value=True)
    mock_client.create_pull_request = AsyncMock(
        return_value="https://github.com/test/repo/pull/42"
    )
    return mock_client
