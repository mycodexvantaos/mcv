"""Tests for CI Repair Agent GitHub API client.

Tests the GitHubActionsClient with mocked httpx responses.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from mycodexvantaos_ci_repair.github_client import GitHubActionsClient


@pytest.fixture
def client() -> GitHubActionsClient:
    """Create a GitHubActionsClient for testing."""
    return GitHubActionsClient(token="test-token", repository="test/repo")


class TestGitHubActionsClientInit:
    """Test client initialization."""

    def test_parses_owner_and_repo(self) -> None:
        c = GitHubActionsClient(token="tok", repository="mycodexvantaos/mycodexvantaos")
        assert c.owner == "mycodexvantaos"
        assert c.repo == "mycodexvantaos"

    def test_sets_auth_headers(self) -> None:
        c = GitHubActionsClient(token="my-secret-token", repository="test/repo")
        assert c._headers["Authorization"] == "Bearer my-secret-token"
        assert c._headers["Accept"] == "application/vnd.github+json"
        assert c._headers["X-GitHub-Api-Version"] == "2022-11-28"


class TestListWorkflowRuns:
    """Test list_workflow_runs method."""

    @pytest.mark.asyncio
    async def test_returns_workflow_summaries(self, client: GitHubActionsClient) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "workflow_runs": [
                {
                    "id": 1001,
                    "name": "CI",
                    "status": "completed",
                    "conclusion": "failure",
                    "head_branch": "main",
                    "event": "push",
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T10:15:00Z",
                    "html_url": "https://github.com/test/repo/actions/runs/1001",
                    "workflow_id": 42,
                },
            ]
        }

        mock_http_client = AsyncMock()
        mock_http_client.get = AsyncMock(return_value=mock_response)
        mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
        mock_http_client.__aexit__ = AsyncMock(return_value=False)

        with patch(
            "mycodexvantaos_ci_repair.github_client.httpx.AsyncClient",
            return_value=mock_http_client,
        ):
            runs = await client.list_workflow_runs(branch="main", status="failure")

        assert len(runs) == 1
        assert runs[0].run_id == 1001
        assert runs[0].conclusion == "failure"
        assert runs[0].head_branch == "main"


class TestGetFailedJobs:
    """Test get_failed_jobs method."""

    @pytest.mark.asyncio
    async def test_returns_only_failed_jobs(self, client: GitHubActionsClient) -> None:
        jobs_response = MagicMock()
        jobs_response.status_code = 200
        jobs_response.raise_for_status = MagicMock()
        jobs_response.json.return_value = {
            "jobs": [
                {
                    "id": 2001,
                    "name": "Build",
                    "conclusion": "failure",
                    "steps": [
                        {"name": "Checkout", "conclusion": "success"},
                        {"name": "Install", "conclusion": "failure"},
                    ],
                },
                {
                    "id": 2002,
                    "name": "Test",
                    "conclusion": "success",
                    "steps": [],
                },
            ]
        }

        log_response = MagicMock()
        log_response.status_code = 200
        log_response.text = "npm ERR! ERESOLVE could not resolve dependency"

        mock_http_client = AsyncMock()
        mock_http_client.get = AsyncMock(side_effect=[jobs_response, log_response])
        mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
        mock_http_client.__aexit__ = AsyncMock(return_value=False)

        with patch(
            "mycodexvantaos_ci_repair.github_client.httpx.AsyncClient",
            return_value=mock_http_client,
        ):
            failed = await client.get_failed_jobs(1001)

        assert len(failed) == 1
        assert failed[0].job_id == 2001
        assert failed[0].job_name == "Build"
        assert len(failed[0].failed_steps) == 1
        assert failed[0].failed_steps[0].step_name == "Install"


class TestCreateBranch:
    """Test create_branch method."""

    @pytest.mark.asyncio
    async def test_returns_true_on_201(self, client: GitHubActionsClient) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 201

        mock_http_client = AsyncMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)
        mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
        mock_http_client.__aexit__ = AsyncMock(return_value=False)

        with patch(
            "mycodexvantaos_ci_repair.github_client.httpx.AsyncClient",
            return_value=mock_http_client,
        ):
            result = await client.create_branch("fix/test", "abc123")

        assert result is True

    @pytest.mark.asyncio
    async def test_returns_true_on_422_already_exists(self, client: GitHubActionsClient) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 422

        mock_http_client = AsyncMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)
        mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
        mock_http_client.__aexit__ = AsyncMock(return_value=False)

        with patch(
            "mycodexvantaos_ci_repair.github_client.httpx.AsyncClient",
            return_value=mock_http_client,
        ):
            result = await client.create_branch("fix/test", "abc123")

        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_on_error(self, client: GitHubActionsClient) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.text = "Forbidden"

        mock_http_client = AsyncMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)
        mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
        mock_http_client.__aexit__ = AsyncMock(return_value=False)

        with patch(
            "mycodexvantaos_ci_repair.github_client.httpx.AsyncClient",
            return_value=mock_http_client,
        ):
            result = await client.create_branch("fix/test", "abc123")

        assert result is False


class TestCreatePullRequest:
    """Test create_pull_request method."""

    @pytest.mark.asyncio
    async def test_returns_pr_url(self, client: GitHubActionsClient) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"html_url": "https://github.com/test/repo/pull/42"}

        mock_http_client = AsyncMock()
        mock_http_client.post = AsyncMock(return_value=mock_response)
        mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
        mock_http_client.__aexit__ = AsyncMock(return_value=False)

        with patch(
            "mycodexvantaos_ci_repair.github_client.httpx.AsyncClient",
            return_value=mock_http_client,
        ):
            url = await client.create_pull_request(
                title="Fix CI", body="Auto-repair", head="fix/test", base="main"
            )

        assert url == "https://github.com/test/repo/pull/42"
