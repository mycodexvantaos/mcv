"""CI Repair Agent — FastAPI service and CLI for GitHub Actions auto-repair.

Provides both an HTTP API and a CLI for analyzing failed GitHub Actions
workflow runs, classifying errors, and generating repair plans.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from mycodexvantaos_ci_repair.database import DatabaseClient
from mycodexvantaos_ci_repair.github_client import GitHubActionsClient
from mycodexvantaos_ci_repair.repair_engine import analyze_failure, generate_repair_plan

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


class Settings(BaseModel):
    """Application settings loaded from environment variables."""

    github_token: str = ""
    repository: str = "mycodexvantaos/mycodexvantaos"
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8000
    database_url: str = ""


def _load_settings() -> Settings:
    """Load settings from environment variables."""
    import os

    return Settings(
        github_token=os.getenv("GITHUB_TOKEN", ""),
        repository=os.getenv("GITHUB_REPOSITORY", "mycodexvantaos/mycodexvantaos"),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        database_url=os.getenv("DATABASE_URL", ""),
    )


settings = _load_settings()

# ---------------------------------------------------------------------------
# Database client singleton
# ---------------------------------------------------------------------------

_db_client: DatabaseClient | None = None


def _get_db() -> DatabaseClient | None:
    """Get the database client if configured."""
    return _db_client


# ---------------------------------------------------------------------------
# API models
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    version: str = "0.1.0"
    repository: str = ""
    database: str = "not_configured"


class RunListResponse(BaseModel):
    """Response for listing workflow runs."""

    runs: list[dict[str, Any]] = Field(default_factory=list)
    count: int = 0


class AnalysisResponse(BaseModel):
    """Response for failure analysis."""

    run_id: int
    run_name: str
    branch: str
    analyses: list[dict[str, Any]] = Field(default_factory=list)
    repair_plan: dict[str, Any] = Field(default_factory=dict)


class RepairRequest(BaseModel):
    """Request body for triggering a repair."""

    run_id: int
    create_branch: bool = False
    create_pr: bool = False


class RepairResponse(BaseModel):
    """Response for repair execution."""

    run_id: int
    plan: dict[str, Any] = Field(default_factory=dict)
    branch_created: bool = False
    pr_url: str = ""
    message: str = ""


class HistoryResponse(BaseModel):
    """Response for repair history."""

    analyses: list[dict[str, Any]] = Field(default_factory=list)
    count: int = 0


class CategoryStatsResponse(BaseModel):
    """Response for error category statistics."""

    categories: dict[str, int] = Field(default_factory=dict)
    period_days: int = 30


# ---------------------------------------------------------------------------
# Client factory
# ---------------------------------------------------------------------------


def _get_client() -> GitHubActionsClient:
    """Create a GitHub Actions client from settings."""
    if not settings.github_token:
        raise HTTPException(status_code=500, detail="GITHUB_TOKEN not configured")
    return GitHubActionsClient(token=settings.github_token, repository=settings.repository)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """Application lifespan handler."""
    global _db_client  # noqa: PLW0603

    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    logger.info("CI Repair Agent starting — repository: %s", settings.repository)

    # Connect to database if URL is configured
    if settings.database_url:
        _db_client = DatabaseClient(dsn=settings.database_url)
        try:
            await _db_client.connect()
            logger.info("Database connected: %s", settings.database_url[:30] + "...")
        except Exception:
            logger.exception("Failed to connect to database — running without persistence")
            _db_client = None

    yield

    # Close database connection
    if _db_client:
        await _db_client.close()
    logger.info("CI Repair Agent shutting down")


app = FastAPI(
    title="CI Repair Agent",
    description="GitHub Actions auto-repair agent for MyCodeXvantaOS",
    version="0.1.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    db_status = "connected" if _db_client else "not_configured"
    if _db_client:
        try:
            await _db_client.get_recent_analyses(limit=1)
            db_status = "connected"
        except Exception:
            db_status = "error"

    return HealthResponse(
        status="ok",
        version="0.1.0",
        repository=settings.repository,
        database=db_status,
    )


@app.get("/api/runs", response_model=RunListResponse)
async def list_runs(
    branch: str | None = Query(default=None),
    status: str | None = Query(default=None),
    per_page: int = Query(default=20, ge=1, le=100),
) -> RunListResponse:
    """List workflow runs, optionally filtered."""
    client = _get_client()
    runs = await client.list_workflow_runs(branch=branch, status=status, per_page=per_page)
    return RunListResponse(
        runs=[r.model_dump(mode="json") for r in runs],
        count=len(runs),
    )


@app.get("/api/runs/{run_id}/analyze", response_model=AnalysisResponse)
async def analyze_run(run_id: int) -> AnalysisResponse:
    """Analyze a failed workflow run and produce a repair plan."""
    client = _get_client()
    failed_jobs = await client.get_failed_jobs(run_id)

    if not failed_jobs:
        return AnalysisResponse(
            run_id=run_id,
            run_name="",
            branch="",
            analyses=[],
            repair_plan={"message": "No failed jobs found for this run"},
        )

    # Get run metadata
    runs = await client.list_workflow_runs(per_page=1)
    run_name = ""
    branch = "main"
    for r in runs:
        if r.run_id == run_id:
            run_name = r.run_name
            branch = r.head_branch
            break

    # Analyze each failed job
    analyses = []
    for job in failed_jobs:
        analysis = analyze_failure(
            run_id=run_id,
            job_id=job.job_id,
            job_name=job.job_name,
            log_text=job.full_log,
        )
        analyses.append(analysis)

        # Save to database if configured
        if _db_client:
            try:
                await _db_client.save_analysis(analysis)
            except Exception:
                logger.exception("Failed to save analysis to database")

    # Generate repair plan
    plan = generate_repair_plan(
        run_id=run_id,
        run_name=run_name,
        branch=branch,
        analyses=analyses,
    )

    # Save plan to database if configured
    if _db_client:
        try:
            await _db_client.save_repair_plan(plan)
        except Exception:
            logger.exception("Failed to save repair plan to database")

    return AnalysisResponse(
        run_id=run_id,
        run_name=run_name,
        branch=branch,
        analyses=[a.model_dump(mode="json") for a in analyses],
        repair_plan=plan.model_dump(mode="json"),
    )


@app.post("/api/runs/{run_id}/repair", response_model=RepairResponse)
async def repair_run(run_id: int, body: RepairRequest) -> RepairResponse:
    """Execute repair actions for a failed workflow run."""
    client = _get_client()

    # First analyze
    failed_jobs = await client.get_failed_jobs(run_id)
    if not failed_jobs:
        return RepairResponse(
            run_id=run_id,
            message="No failed jobs found — nothing to repair",
        )

    runs = await client.list_workflow_runs(per_page=50)
    run_name = ""
    branch = "main"
    for r in runs:
        if r.run_id == run_id:
            run_name = r.run_name
            branch = r.head_branch
            break

    analyses = []
    for job in failed_jobs:
        analysis = analyze_failure(
            run_id=run_id,
            job_id=job.job_id,
            job_name=job.job_name,
            log_text=job.full_log,
        )
        analyses.append(analysis)

    plan = generate_repair_plan(
        run_id=run_id,
        run_name=run_name,
        branch=branch,
        analyses=analyses,
    )

    branch_created = False
    pr_url = ""

    # Create branch if requested and plan is auto-fixable
    if body.create_branch and plan.can_auto_fix:
        try:
            sha = await client.get_branch_sha(branch)
            branch_created = await client.create_branch(plan.branch_name, sha)
        except Exception:
            logger.exception("Failed to create branch")

    # Create PR if requested
    if body.create_pr and branch_created:
        try:
            pr_url = await client.create_pull_request(
                title=plan.pr_title,
                body=plan.pr_body,
                head=plan.branch_name,
                base=branch,
            )
        except Exception:
            logger.exception("Failed to create PR")

    # Save plan to database if configured
    if _db_client:
        try:
            await _db_client.save_repair_plan(plan)
        except Exception:
            logger.exception("Failed to save repair plan to database")

    return RepairResponse(
        run_id=run_id,
        plan=plan.model_dump(mode="json"),
        branch_created=branch_created,
        pr_url=pr_url,
        message=plan.summary,
    )


@app.get("/api/history/analyses", response_model=HistoryResponse)
async def get_analysis_history(
    run_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
) -> HistoryResponse:
    """Retrieve stored failure analyses from the database."""
    db = _get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not configured")

    if run_id:
        analyses = await db.get_analyses_for_run(run_id)
    else:
        analyses = await db.get_recent_analyses(limit=limit)

    return HistoryResponse(analyses=analyses, count=len(analyses))


@app.get("/api/history/stats/categories", response_model=CategoryStatsResponse)
async def get_category_stats(
    days: int = Query(default=30, ge=1, le=365),
) -> CategoryStatsResponse:
    """Get error category distribution statistics."""
    db = _get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Database not configured")

    categories = await db.get_error_category_counts(days=days)
    return CategoryStatsResponse(categories=categories, period_days=days)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _run_analyze(args: argparse.Namespace) -> None:
    """CLI: analyze a workflow run."""
    client = GitHubActionsClient(token=args.token, repository=args.repository)

    if args.run_id:
        run_id = args.run_id
    else:
        # Find the latest failed run
        runs = asyncio.run(client.list_workflow_runs(status="failure", per_page=1))
        if not runs:
            print("No failed workflow runs found.", file=sys.stderr)
            return
        run_id = runs[0].run_id
        print(f"Latest failed run: #{run_id} — {runs[0].run_name}")

    failed_jobs = asyncio.run(client.get_failed_jobs(run_id))
    if not failed_jobs:
        print(f"No failed jobs found for run #{run_id}")
        return

    runs = asyncio.run(client.list_workflow_runs(per_page=50))
    run_name = ""
    branch = "main"
    for r in runs:
        if r.run_id == run_id:
            run_name = r.run_name
            branch = r.head_branch
            break

    analyses = []
    for job in failed_jobs:
        analysis = analyze_failure(
            run_id=run_id,
            job_id=job.job_id,
            job_name=job.job_name,
            log_text=job.full_log,
        )
        analyses.append(analysis)

    plan = generate_repair_plan(
        run_id=run_id,
        run_name=run_name,
        branch=branch,
        analyses=analyses,
    )

    # Output as JSON
    output = plan.model_dump(mode="json")
    if args.output:
        with open(args.output, "w") as f:
            json.dump(output, f, indent=2, default=str)
        print(f"Repair plan written to {args.output}")
    else:
        print(json.dumps(output, indent=2, default=str))

    # Summary
    print(f"\nSummary: {plan.summary}", file=sys.stderr)
    if plan.can_auto_fix:
        print("✅ Auto-fix available", file=sys.stderr)
    else:
        print("⚠️  Manual review required", file=sys.stderr)


def _run_serve(args: argparse.Namespace) -> None:
    """CLI: start the FastAPI server."""
    if args.token:
        settings.github_token = args.token
    if args.repository:
        settings.repository = args.repository
    if args.port:
        settings.port = args.port
    if args.database_url:
        settings.database_url = args.database_url

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )


def cli() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="CI Repair Agent — GitHub Actions auto-repair for MyCodeXvantaOS",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # analyze subcommand
    analyze_parser = subparsers.add_parser("analyze", help="Analyze failed workflow runs")
    analyze_parser.add_argument("--run-id", type=int, help="Specific run ID to analyze")
    analyze_parser.add_argument("--token", required=True, help="GitHub token")
    analyze_parser.add_argument(
        "--repository",
        default="mycodexvantaos/mycodexvantaos",
        help="GitHub repository",
    )
    analyze_parser.add_argument("--output", "-o", help="Output JSON file path")

    # serve subcommand
    serve_parser = subparsers.add_parser("serve", help="Start the HTTP API server")
    serve_parser.add_argument("--token", help="GitHub token (or set GITHUB_TOKEN)")
    serve_parser.add_argument(
        "--repository",
        default="mycodexvantaos/mycodexvantaos",
        help="GitHub repository",
    )
    serve_parser.add_argument("--port", type=int, default=8000, help="Server port")
    serve_parser.add_argument("--database-url", help="PostgreSQL connection URL")

    args = parser.parse_args()

    if args.command == "analyze":
        _run_analyze(args)
    elif args.command == "serve":
        _run_serve(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    cli()
