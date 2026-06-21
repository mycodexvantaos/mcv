"""GitHub Actions API client for fetching workflow runs, jobs, and logs."""

from __future__ import annotations

import logging
from typing import Any

import httpx
from mycodexvantaos_ci_repair.models import FailedJob, FailedStep, WorkflowRunSummary

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"


class GitHubActionsClient:
    """Async client for GitHub Actions API."""

    def __init__(self, token: str, repository: str) -> None:
        self.token = token
        self.repository = repository
        self.owner, self.repo = repository.split("/", 1)
        self._headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def list_workflow_runs(
        self,
        branch: str | None = None,
        status: str | None = None,
        per_page: int = 20,
    ) -> list[WorkflowRunSummary]:
        """List workflow runs, optionally filtered by branch and status."""
        params: dict[str, Any] = {"per_page": per_page}
        if branch:
            params["branch"] = branch
        if status:
            params["status"] = status

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{self.owner}/{self.repo}/actions/runs",
                headers=self._headers,
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()

        summaries: list[WorkflowRunSummary] = []
        for run in data.get("workflow_runs", []):
            summaries.append(
                WorkflowRunSummary(
                    run_id=run["id"],
                    run_name=run.get("name", run.get("path", "").split("/")[-1]),
                    status=run["status"],
                    conclusion=run.get("conclusion"),
                    head_branch=run["head_branch"],
                    event=run["event"],
                    created_at=run["created_at"],
                    updated_at=run["updated_at"],
                    html_url=run.get("html_url", ""),
                    workflow_id=run.get("workflow_id", 0),
                )
            )
        return summaries

    async def get_failed_jobs(self, run_id: int) -> list[FailedJob]:
        """Get failed jobs for a specific workflow run."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{self.owner}/{self.repo}/actions/runs/{run_id}/jobs",
                headers=self._headers,
            )
            resp.raise_for_status()
            data = resp.json()

        failed_jobs: list[FailedJob] = []
        for job in data.get("jobs", []):
            if job.get("conclusion") != "failure":
                continue

            failed_steps: list[FailedStep] = []
            step_number = 0
            for step in job.get("steps", []):
                step_number += 1
                if step.get("conclusion") == "failure":
                    failed_steps.append(
                        FailedStep(
                            step_name=step.get("name", f"step-{step_number}"),
                            step_number=step_number,
                            conclusion=step["conclusion"],
                        )
                    )

            job_id = job["id"]
            log_text = ""
            try:
                log_text = await self._get_job_log(job_id)
            except Exception:
                logger.warning("Failed to fetch log for job %s", job_id)

            failed_jobs.append(
                FailedJob(
                    job_id=job_id,
                    job_name=job.get("name", ""),
                    conclusion=job["conclusion"],
                    failed_steps=failed_steps,
                    full_log=log_text,
                )
            )
        return failed_jobs

    async def _get_job_log(self, job_id: int) -> str:
        """Fetch the log text for a specific job."""
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{self.owner}/{self.repo}/actions/jobs/{job_id}/logs",
                headers=self._headers,
            )
            if resp.status_code == 200:
                return resp.text
            logger.warning("Log fetch returned status %s for job %s", resp.status_code, job_id)
            return ""

    async def get_run_logs(self, run_id: int) -> str:
        """Fetch combined logs for a workflow run."""
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{self.owner}/{self.repo}/actions/runs/{run_id}/logs",
                headers=self._headers,
            )
            if resp.status_code == 200:
                return resp.text
            return ""

    async def create_branch(self, branch_name: str, sha: str) -> bool:
        """Create a new branch from a given SHA."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{GITHUB_API_BASE}/repos/{self.owner}/{self.repo}/git/refs",
                headers=self._headers,
                json={"ref": f"refs/heads/{branch_name}", "sha": sha},
            )
            if resp.status_code in (201, 422):
                return True
            logger.error("Failed to create branch: %s", resp.text)
            return False

    async def get_branch_sha(self, branch: str = "main") -> str:
        """Get the SHA of a branch's latest commit."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{self.owner}/{self.repo}/git/ref/heads/{branch}",
                headers=self._headers,
            )
            resp.raise_for_status()
            return resp.json()["object"]["sha"]

    async def create_pull_request(
        self,
        title: str,
        body: str,
        head: str,
        base: str = "main",
    ) -> str:
        """Create a pull request. Returns the PR URL."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{GITHUB_API_BASE}/repos/{self.owner}/{self.repo}/pulls",
                headers=self._headers,
                json={"title": title, "body": body, "head": head, "base": base},
            )
            resp.raise_for_status()
            return resp.json().get("html_url", "")
