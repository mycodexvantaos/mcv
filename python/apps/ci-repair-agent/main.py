"""CI Repair Agent — FastAPI service and CLI for GitHub Actions auto-repair.

Provides both an HTTP API and a CLI for analyzing failed GitHub Actions
workflow runs, classifying errors, and generating repair plans.
"""

import argparse
import asyncio
import json
import logging
import sys
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

import uvicorn
from asyncpg.exceptions import (
    CannotConnectNowError,
    ClientConfigurationError,
    ConnectionDoesNotExistError,
    InvalidAuthorizationSpecificationError,
    InvalidCatalogNameError,
    InvalidPasswordError,
    PostgresConnectionError,
)
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
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
# Standardized API response models
# ---------------------------------------------------------------------------


class ErrorCode:
    """Standardized error codes for API responses."""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    RATE_LIMITED = "RATE_LIMITED"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    GITHUB_API_ERROR = "GITHUB_API_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ApiResponse(BaseModel):
    """Standardized API response wrapper.

    All API endpoints return this format with success, data, error, and request_id.
    """

    success: bool
    data: dict[str, Any] | None = None
    error: dict[str, Any] | None = None
    request_id: str


class AppException(Exception):
    """Base application exception with error code and HTTP status."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


# ---------------------------------------------------------------------------
# API domain models
# ---------------------------------------------------------------------------


class HealthData(BaseModel):
    """Health check response data."""

    status: str = "ok"
    version: str = "0.2.0"
    repository: str = ""
    database: str = "not_configured"
    timestamp: str = ""


class RunData(BaseModel):
    """Single workflow run data."""

    run_id: int
    run_name: str
    status: str
    conclusion: str | None = None
    head_branch: str
    event: str
    html_url: str = ""


class RunListData(BaseModel):
    """Response data for listing workflow runs."""

    runs: list[RunData] = Field(default_factory=list)
    count: int = 0


class AnalysisData(BaseModel):
    """Response data for a single failure analysis."""

    job_id: int
    job_name: str
    error_category: str
    severity: str
    root_cause: str
    affected_files: list[str] = Field(default_factory=list)
    affected_dependencies: list[str] = Field(default_factory=list)
    suggested_fix: str = ""
    confidence: float = 0.0


class RepairActionData(BaseModel):
    """Response data for a single repair action."""

    action_type: str
    description: str
    file_path: str = ""
    command: str = ""
    risk_level: str = "low"
    requires_manual_review: bool = True


class RepairPlanData(BaseModel):
    """Response data for a complete repair plan."""

    branch_name: str = ""
    pr_title: str = ""
    pr_body: str = ""
    can_auto_fix: bool = False
    summary: str = ""


class AnalyzeData(BaseModel):
    """Response data for the analyze endpoint."""

    run_id: int
    run_name: str = ""
    branch: str = "main"
    analyses: list[AnalysisData] = Field(default_factory=list)
    repair_plan: RepairPlanData | None = None


class RepairRequest(BaseModel):
    """Request body for triggering a repair."""

    run_id: int
    create_branch: bool = False
    create_pr: bool = False


class RepairData(BaseModel):
    """Response data for the repair endpoint."""

    run_id: int
    repair_plan: RepairPlanData | None = None
    branch_created: bool = False
    pr_url: str = ""
    message: str = ""


class HistoryData(BaseModel):
    """Response data for repair history."""

    analyses: list[dict[str, Any]] = Field(default_factory=list)
    count: int = 0


class CategoryStatsData(BaseModel):
    """Response data for error category statistics."""

    categories: dict[str, int] = Field(default_factory=dict)
    period_days: int = 30


# ---------------------------------------------------------------------------
# Client factory
# ---------------------------------------------------------------------------


def _get_client() -> GitHubActionsClient:
    """Create a GitHub Actions client from settings."""
    if not settings.github_token:
        raise AppException(
            code=ErrorCode.UNAUTHORIZED,
            message="GITHUB_TOKEN not configured. Set the GITHUB_TOKEN environment variable.",
            status_code=401,
        )
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
        except (
            PostgresConnectionError,
            CannotConnectNowError,
            ConnectionDoesNotExistError,
            InvalidAuthorizationSpecificationError,
            InvalidPasswordError,
            InvalidCatalogNameError,
            ClientConfigurationError,
            OSError,
            asyncio.TimeoutError,
        ):
            logger.exception("Failed to connect to database — running without persistence")
            _db_client = None
        except Exception:
            logger.exception("Unexpected error while connecting to database")
            raise

    yield

    # Close database connection
    if _db_client:
        await _db_client.close()
    logger.info("CI Repair Agent shutting down")


app = FastAPI(
    title="CI Repair Agent",
    description="GitHub Actions auto-repair agent for MyCodeXvantaOS",
    version="0.2.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Middleware: request ID injection
# ---------------------------------------------------------------------------


@app.middleware("http")
async def request_id_middleware(request: Request, call_next: Any) -> Any:
    """Attach a unique request_id to every request for tracing."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application-level exceptions with standardized format."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            success=False,
            error={
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            request_id=request_id,
        ).model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTPExceptions with standardized format."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            success=False,
            error={
                "code": ErrorCode.INTERNAL_ERROR,
                "message": str(exc.detail),
            },
            request_id=request_id,
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions with standardized format."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content=ApiResponse(
            success=False,
            error={
                "code": ErrorCode.INTERNAL_ERROR,
                "message": "An unexpected error occurred",
            },
            request_id=request_id,
        ).model_dump(),
    )


# ---------------------------------------------------------------------------
# Helper: build success response
# ---------------------------------------------------------------------------


def _success(request: Request, data: dict[str, Any]) -> dict[str, Any]:
    """Build a standardized success response."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return ApiResponse(success=True, data=data, request_id=request_id).model_dump()


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health_check(request: Request) -> dict[str, Any]:
    """Health check endpoint — reports service and database status."""
    db_status = "not_configured"
    if _db_client:
        try:
            await _db_client.get_recent_analyses(limit=1)
            db_status = "connected"
        except Exception:
            db_status = "error"

    return _success(
        request,
        HealthData(
            status="ok",
            version="0.2.0",
            repository=settings.repository,
            database=db_status,
            timestamp=datetime.now().isoformat(),
        ).model_dump(),
    )


@app.get("/runs", summary="List recent workflow runs")
async def list_runs(
    request: Request,
    limit: int = Query(10, ge=1, le=100),
    branch: str | None = Query(None),
) -> dict[str, Any]:
    """List recent GitHub Actions workflow runs for the configured repository.

    Optionally filter by branch.
    """
    client = _get_client()
    runs = await client.list_workflow_runs(branch=branch, limit=limit)
    run_data = [
        RunData(
            run_id=run["id"],
            run_name=run["name"],
            status=run["status"],
            conclusion=run["conclusion"],
            head_branch=run["head_branch"],
            event=run["event"],
            html_url=run["html_url"],
        )
        for run in runs
    ]
    return _success(request, RunListData(runs=run_data, count=len(run_data)).model_dump())


@app.get("/runs/{run_id}/analyze", summary="Analyze a failed workflow run")
async def analyze_run(
    request: Request,
    run_id: int = Field(..., gt=0),
) -> dict[str, Any]:
    """Analyze a specific failed GitHub Actions workflow run for root causes and repair suggestions.

    Returns a detailed analysis for each failed job and a high-level repair plan.
    """
    client = _get_client()
    run = await client.get_workflow_run(run_id)
    if not run:
        raise AppException(
            code=ErrorCode.NOT_FOUND,
            message=f"Workflow run {run_id} not found.",
            status_code=404,
        )

    jobs = await client.list_jobs_for_workflow_run(run_id)
    if not jobs:
        raise AppException(
            code=ErrorCode.NOT_FOUND,
            message=f"No jobs found for workflow run {run_id}.",
            status_code=404,
        )

    all_analyses = []
    for job in jobs:
        if job["conclusion"] == "failure":
            logs = await client.get_job_logs(job["id"])
            analysis_result = analyze_failure(logs)
            all_analyses.append(
                AnalysisData(
                    job_id=job["id"],
                    job_name=job["name"],
                    error_category=analysis_result["error_category"],
                    severity=analysis_result["severity"],
                    root_cause=analysis_result["root_cause"],
                    affected_files=analysis_result["affected_files"],
                    affected_dependencies=analysis_result["affected_dependencies"],
                    suggested_fix=analysis_result["suggested_fix"],
                    confidence=analysis_result["confidence"],
                ).model_dump()
            )

    repair_plan = generate_repair_plan(all_analyses, run["head_branch"])
    repair_plan_data = RepairPlanData(
        branch_name=repair_plan["branch_name"],
        pr_title=repair_plan["pr_title"],
        pr_body=repair_plan["pr_body"],
        can_auto_fix=repair_plan["can_auto_fix"],
        summary=repair_plan["summary"],
    )

    return _success(
        request,
        AnalyzeData(
            run_id=run_id,
            run_name=run["name"],
            branch=run["head_branch"],
            analyses=all_analyses,
            repair_plan=repair_plan_data,
        ).model_dump(),
    )


@app.post("/runs/{run_id}/repair", summary="Trigger a repair for a failed workflow run")
async def trigger_repair(
    request: Request,
    run_id: int = Field(..., gt=0),
    repair_request: RepairRequest | None = None,
) -> dict[str, Any]:
    """Trigger a repair process for a given workflow run.

    If `create_branch` is true, a new branch will be created with proposed fixes.
    If `create_pr` is true, a pull request will also be opened.
    """
    client = _get_client()
    run = await client.get_workflow_run(run_id)
    if not run:
        raise AppException(
            code=ErrorCode.NOT_FOUND,
            message=f"Workflow run {run_id} not found.",
            status_code=404,
        )

    jobs = await client.list_jobs_for_workflow_run(run_id)
    if not jobs:
        raise AppException(
            code=ErrorCode.NOT_FOUND,
            message=f"No jobs found for workflow run {run_id}.",
            status_code=404,
        )

    all_analyses = []
    for job in jobs:
        if job["conclusion"] == "failure":
            logs = await client.get_job_logs(job["id"])
            analysis_result = analyze_failure(logs)
            all_analyses.append(analysis_result)

    repair_plan = generate_repair_plan(all_analyses, run["head_branch"])

    branch_created = False
    pr_url = ""
    message = "Repair plan generated."

    if repair_request and repair_request.create_branch and repair_plan["can_auto_fix"]:
        # In a real scenario, this would involve applying fixes and committing
        # For now, we just simulate branch/PR creation
        new_branch_name = repair_plan["branch_name"]
        await client.create_branch(new_branch_name, run["head_sha"])
        branch_created = True
        message = f"Repair branch `{new_branch_name}` created."

        if repair_request.create_pr:
            pr = await client.create_pull_request(
                base_branch=run["head_branch"],
                head_branch=new_branch_name,
                title=repair_plan["pr_title"],
                body=repair_plan["pr_body"],
            )
            pr_url = pr["html_url"]
            message = f"Repair branch `{new_branch_name}` created and PR opened: {pr_url}"

    repair_data = RepairData(
        run_id=run_id,
        repair_plan=RepairPlanData(
            branch_name=repair_plan["branch_name"],
            pr_title=repair_plan["pr_title"],
            pr_body=repair_plan["pr_body"],
            can_auto_fix=repair_plan["can_auto_fix"],
            summary=repair_plan["summary"],
        ),
        branch_created=branch_created,
        pr_url=pr_url,
        message=message,
    )

    return _success(request, repair_data.model_dump())


@app.get("/history", summary="Get repair history")
async def get_history(
    request: Request,
    limit: int = Query(10, ge=1, le=100),
) -> dict[str, Any]:
    """Retrieve a history of past analyses and repairs.

    Requires database to be configured.
    """
    db = _get_db()
    if not db:
        raise AppException(
            code=ErrorCode.DATABASE_ERROR,
            message="Database not configured. Cannot retrieve history.",
            status_code=500,
        )
    analyses = await db.get_recent_analyses(limit=limit)
    return _success(request, HistoryData(analyses=analyses, count=len(analyses)).model_dump())


@app.get("/stats/categories", summary="Get error category statistics")
async def get_category_stats(
    request: Request,
    period_days: int = Query(30, ge=1, le=365),
) -> dict[str, Any]:
    """Get statistics on error categories over a given period.

    Requires database to be configured.
    """
    db = _get_db()
    if not db:
        raise AppException(
            code=ErrorCode.DATABASE_ERROR,
            message="Database not configured. Cannot retrieve category statistics.",
            status_code=500,
        )
    stats = await db.get_category_statistics(period_days=period_days)
    return _success(
        request, CategoryStatsData(categories=stats, period_days=period_days).model_dump()
    )


# ---------------------------------------------------------------------------
# CLI commands
# ---------------------------------------------------------------------------


async def _cli_analyze(args: argparse.Namespace) -> None:
    """CLI command to analyze a workflow run."""
    client = _get_client()
    run = await client.get_workflow_run(args.run_id)
    if not run:
        print(f"Error: Workflow run {args.run_id} not found.")
        sys.exit(1)

    jobs = await client.list_jobs_for_workflow_run(args.run_id)
    if not jobs:
        print(f"Error: No jobs found for workflow run {args.run_id}.")
        sys.exit(1)

    all_analyses = []
    for job in jobs:
        if job["conclusion"] == "failure":
            logs = await client.get_job_logs(job["id"])
            analysis_result = analyze_failure(logs)
            all_analyses.append(analysis_result)

    repair_plan = generate_repair_plan(all_analyses, run["head_branch"])

    print(f"\n--- Analysis for Run {args.run_id} ({run['name']}) ---")
    print(f"Branch: {run['head_branch']}")
    print("\nFailed Jobs Analyses:")
    for analysis in all_analyses:
        print(f"  Job: {analysis['job_name']} (ID: {analysis['job_id']})")
        print(f"    Error Category: {analysis['error_category']} (Severity: {analysis['severity']})")
        print(f"    Root Cause: {analysis['root_cause']}")
        print(f"    Suggested Fix: {analysis['suggested_fix']}")
        if analysis["affected_files"]:
            print(f"    Affected Files: {', '.join(analysis['affected_files'])}")
        if analysis["affected_dependencies"]:
            print(f"    Affected Dependencies: {', '.join(analysis['affected_dependencies'])}")
        print(f"    Confidence: {analysis['confidence']:.2f}")
        print("\n")

    print("--- Repair Plan ---")
    print(f"Summary: {repair_plan['summary']}")
    print(f"Can Auto-Fix: {repair_plan['can_auto_fix']}")
    if repair_plan["can_auto_fix"]:
        print(f"  Proposed Branch: {repair_plan['branch_name']}")
        print(f"  Proposed PR Title: {repair_plan['pr_title']}")
        print(f"  Proposed PR Body: {repair_plan['pr_body']}")


async def _cli_serve(args: argparse.Namespace) -> None:
    """CLI command to serve the FastAPI application."""
    config = uvicorn.Config(app, host=args.host, port=args.port, log_level=settings.log_level.lower())
    server = uvicorn.Server(config)
    await server.serve()


def main() -> None:
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(description="CI Repair Agent CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    analyze_parser = subparsers.add_parser("analyze", help="Analyze a failed workflow run")
    analyze_parser.add_argument("run_id", type=int, help="ID of the workflow run to analyze")
    analyze_parser.set_defaults(func=_cli_analyze)

    serve_parser = subparsers.add_parser("serve", help="Serve the FastAPI application")
    serve_parser.add_argument("--host", type=str, default=settings.host, help="Host address")
    serve_parser.add_argument("--port", type=int, default=settings.port, help="Port number")
    serve_parser.set_defaults(func=_cli_serve)

    args = parser.parse_args()

    # Initialize logging for CLI commands as well
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    try:
        asyncio.run(args.func(args))
    except AppException as e:
        logger.error("CLI Error: %s - %s", e.code, e.message)
        sys.exit(1)
    except Exception as e:
        logger.error("An unexpected error occurred in CLI: %s", e, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
