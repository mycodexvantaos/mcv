"""Tests for CI Repair Agent API endpoints.

Uses FastAPI TestClient with mocked GitHub API client to test all
API endpoints including standardized response format, error handling,
and validation.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

# Load the ci-repair-agent main module directly by file path to avoid
# name collision with apps/agent-worker/main.py
_main_path = str(Path(__file__).resolve().parent.parent / "apps" / "ci-repair-agent" / "main.py")
_spec = importlib.util.spec_from_file_location("ci_repair_agent_main", _main_path)

# Mock env vars before importing
with patch.dict(
    "os.environ",
    {
        "GITHUB_TOKEN": "test-token-123",
        "GITHUB_REPOSITORY": "test/repo",
        "DATABASE_URL": "",
    },
):
    assert _spec is not None
    _module = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_module)  # type: ignore[union-attr]
    app = _module.app


@pytest.fixture
def client() -> TestClient:
    """Create a FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def mock_client_fixture():
    """Patch _get_client to return a mock GitHub client."""
    from conftest import make_sample_failed_jobs, make_sample_workflow_runs

    mock = AsyncMock()
    mock.list_workflow_runs = AsyncMock(return_value=make_sample_workflow_runs())
    mock.get_failed_jobs = AsyncMock(return_value=make_sample_failed_jobs())
    mock.get_branch_sha = AsyncMock(return_value="abc123def456")
    mock.create_branch = AsyncMock(return_value=True)
    mock.create_pull_request = AsyncMock(return_value="https://github.com/test/repo/pull/42")
    with patch.object(_module, "_get_client", return_value=mock):
        yield mock


class TestHealthEndpoint:
    """Test the /health endpoint."""

    def test_health_returns_success(self, client: TestClient) -> None:
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["status"] == "ok"
        assert "version" in body["data"]
        assert "request_id" in body

    def test_health_includes_database_status(self, client: TestClient) -> None:
        resp = client.get("/health")
        body = resp.json()
        assert "database" in body["data"]
        # Without database configured, should be not_configured
        assert body["data"]["database"] in ("not_configured", "connected", "error")

    def test_health_includes_timestamp(self, client: TestClient) -> None:
        resp = client.get("/health")
        body = resp.json()
        assert "timestamp" in body["data"]
        assert body["data"]["timestamp"].endswith("Z")


class TestListRunsEndpoint:
    """Test the GET /api/runs endpoint."""

    def test_list_runs_success(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.get("/api/runs")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "runs" in body["data"]
        assert "count" in body["data"]
        assert body["data"]["count"] >= 0

    def test_list_runs_with_branch_filter(
        self, client: TestClient, mock_client_fixture: AsyncMock
    ) -> None:
        resp = client.get("/api/runs?branch=main")
        assert resp.status_code == 200
        mock_client_fixture.list_workflow_runs.assert_called_once()
        call_kwargs = mock_client_fixture.list_workflow_runs.call_args[1]
        assert call_kwargs["branch"] == "main"

    def test_list_runs_with_status_filter(
        self, client: TestClient, mock_client_fixture: AsyncMock
    ) -> None:
        resp = client.get("/api/runs?status=failure")
        assert resp.status_code == 200
        call_kwargs = mock_client_fixture.list_workflow_runs.call_args[1]
        assert call_kwargs["status"] == "failure"

    def test_list_runs_per_page_validation(self, client: TestClient) -> None:
        """per_page must be between 1 and 100."""
        resp = client.get("/api/runs?per_page=0")
        assert resp.status_code == 422

        resp = client.get("/api/runs?per_page=101")
        assert resp.status_code == 422

    def test_list_runs_has_request_id(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.get("/api/runs")
        body = resp.json()
        assert "request_id" in body
        assert len(body["request_id"]) > 0


class TestAnalyzeEndpoint:
    """Test the GET /api/runs/{run_id}/analyze endpoint."""

    def test_analyze_success(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.get("/api/runs/1001/analyze")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["run_id"] == 1001
        assert "analyses" in body["data"]
        assert "repair_plan" in body["data"]

    def test_analyze_classifies_dependency_error(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.get("/api/runs/1001/analyze")
        body = resp.json()
        analyses = body["data"]["analyses"]
        assert len(analyses) >= 1
        # The sample log contains npm ERR! ERESOLVE — dependency error
        assert analyses[0]["error_category"] == "dependency_error"

    def test_analyze_includes_suggested_fix(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.get("/api/runs/1001/analyze")
        body = resp.json()
        analyses = body["data"]["analyses"]
        assert len(analyses) >= 1
        assert len(analyses[0]["suggested_fix"]) > 0

    def test_analyze_repair_plan_has_branch_name(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.get("/api/runs/1001/analyze")
        body = resp.json()
        plan = body["data"]["repair_plan"]
        assert plan is not None
        assert "fix/ci-repair-" in plan["branch_name"]

    def test_analyze_no_failed_jobs(
        self, client: TestClient, mock_client_fixture: AsyncMock
    ) -> None:
        mock_client_fixture.get_failed_jobs = AsyncMock(return_value=[])
        resp = client.get("/api/runs/9999/analyze")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["analyses"] == []

    def test_analyze_negative_run_id(self, client: TestClient) -> None:
        """Negative run_id should return validation error."""
        resp = client.get("/api/runs/-1/analyze")
        assert resp.status_code == 400
        body = resp.json()
        assert body["success"] is False
        assert body["error"]["code"] == "VALIDATION_ERROR"

    def test_analyze_zero_run_id(self, client: TestClient) -> None:
        """Zero run_id should return validation error."""
        resp = client.get("/api/runs/0/analyze")
        assert resp.status_code == 400
        body = resp.json()
        assert body["success"] is False
        assert body["error"]["code"] == "VALIDATION_ERROR"


class TestRepairEndpoint:
    """Test the POST /api/runs/{run_id}/repair endpoint."""

    def test_repair_success(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.post(
            "/api/runs/1001/repair",
            json={"run_id": 1001, "create_branch": False, "create_pr": False},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["run_id"] == 1001
        assert "repair_plan" in body["data"]

    def test_repair_with_branch_and_pr(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.post(
            "/api/runs/1001/repair",
            json={"run_id": 1001, "create_branch": True, "create_pr": True},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["data"]["branch_created"] is True
        assert body["data"]["pr_url"] == "https://github.com/test/repo/pull/42"

    def test_repair_no_failed_jobs(
        self, client: TestClient, mock_client_fixture: AsyncMock
    ) -> None:
        mock_client_fixture.get_failed_jobs = AsyncMock(return_value=[])
        resp = client.post(
            "/api/runs/9999/repair",
            json={"run_id": 9999, "create_branch": False, "create_pr": False},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "nothing to repair" in body["data"]["message"].lower()

    def test_repair_run_id_mismatch(self, client: TestClient) -> None:
        """run_id in URL and body must match."""
        resp = client.post(
            "/api/runs/1001/repair",
            json={"run_id": 9999, "create_branch": False, "create_pr": False},
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["success"] is False
        assert body["error"]["code"] == "VALIDATION_ERROR"

    def test_repair_negative_run_id(self, client: TestClient) -> None:
        resp = client.post(
            "/api/runs/-1/repair",
            json={"run_id": -1, "create_branch": False, "create_pr": False},
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["success"] is False

    def test_repair_missing_body(self, client: TestClient) -> None:
        resp = client.post("/api/runs/1001/repair")
        assert resp.status_code == 422  # Pydantic validation error


class TestHistoryEndpoints:
    """Test the /api/history/* endpoints."""

    def test_analyses_without_database(self, client: TestClient) -> None:
        """Without database, should return 503 SERVICE_UNAVAILABLE."""
        resp = client.get("/api/history/analyses")
        assert resp.status_code == 503
        body = resp.json()
        assert body["success"] is False
        assert body["error"]["code"] == "SERVICE_UNAVAILABLE"

    def test_category_stats_without_database(self, client: TestClient) -> None:
        """Without database, should return 503 SERVICE_UNAVAILABLE."""
        resp = client.get("/api/history/stats/categories")
        assert resp.status_code == 503
        body = resp.json()
        assert body["success"] is False
        assert body["error"]["code"] == "SERVICE_UNAVAILABLE"

    def test_category_stats_days_validation(self, client: TestClient) -> None:
        """days must be between 1 and 365."""
        resp = client.get("/api/history/stats/categories?days=0")
        assert resp.status_code == 422

        resp = client.get("/api/history/stats/categories?days=366")
        assert resp.status_code == 422


class TestResponseFormat:
    """Test that all responses follow the standardized format."""

    def test_success_response_has_required_fields(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.get("/health")
        body = resp.json()
        assert "success" in body
        assert "data" in body
        assert "request_id" in body
        assert "error" in body or body["success"] is True

    def test_error_response_has_required_fields(self, client: TestClient) -> None:
        resp = client.get("/api/runs/-1/analyze")
        body = resp.json()
        assert "success" in body
        assert body["success"] is False
        assert "error" in body
        assert "code" in body["error"]
        assert "message" in body["error"]
        assert "request_id" in body

    def test_request_id_is_propagated(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        """Custom X-Request-ID header should be propagated."""
        resp = client.get("/api/runs", headers={"X-Request-ID": "test-req-123"})
        assert resp.status_code == 200
        assert resp.headers.get("X-Request-ID") == "test-req-123"
        body = resp.json()
        assert body["request_id"] == "test-req-123"

    def test_request_id_generated_when_missing(
        self,
        client: TestClient,
        mock_client_fixture: AsyncMock,  # noqa: ARG002
    ) -> None:
        resp = client.get("/api/runs")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["request_id"]) > 0
