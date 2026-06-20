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

    data = HealthData(
        status="ok",
        version="0.2.0",
        repository=settings.repository,
        database=db_status,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
    return _success(request, data.model_dump())


@app.get("/api/runs")
async def list_runs(
    request: Request,
    branch: str | None = Query(default=None, description="Filter by branch name"),
    status: str | None = Query(default=None, description="Filter by run status"),
    per_page: int = Query(default=20, ge=1, le=100, description="Results per page"),
) -> dict[str, Any]:
    """List workflow runs, optionally filtered by branch and status."""
    client = _get_client()
    try:
        runs = await client.list_workflow_runs(branch=branch, status=status, per_page=per_page)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.GITHUB_API_ERROR,
            message=f"Failed to fetch workflow runs: {exc}",
            status_code=502,
        ) from exc

    run_list = [
        RunData(
            run_id=r.run_id,
            run_name=r.run_name,
            status=r.status,
            conclusion=r.conclusion,
            head_branch=r.head_branch,
            event=r.event,
            html_url=r.html_url,
        ).model_dump()
        for r in runs
    ]

    data = RunListData(runs=run_list, count=len(run_list)).model_dump()
    return _success(request, data)


@app.get("/api/runs/{run_id}/analyze")
async def analyze_run(request: Request, run_id: int) -> dict[str, Any]:
    """Analyze a failed workflow run and produce a repair plan.

    Reads failed job logs, classifies errors into categories
    (dependency_error, test_failure, lint_error, docker_build_error,
    deployment_error, etc.), and generates a repair plan with
    actionable suggestions.
    """
    if run_id <= 0:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="run_id must be a positive integer",
            status_code=400,
        )

    client = _get_client()

    # Fetch failed jobs
    try:
        failed_jobs = await client.get_failed_jobs(run_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.GITHUB_API_ERROR,
            message=f"Failed to fetch jobs for run {run_id}: {exc}",
            status_code=502,
        ) from exc

    if not failed_jobs:
        return _success(
            request,
            AnalyzeData(
                run_id=run_id,
                analyses=[],
                repair_plan=None,
            ).model_dump(),
        )

    # Get run metadata
    run_name = ""
    branch = "main"
    try:
        runs = await client.list_workflow_runs(per_page=50)
        for r in runs:
            if r.run_id == run_id:
                run_name = r.run_name
                branch = r.head_branch
                break
    except Exception:
        logger.warning("Failed to fetch run metadata for run %d", run_id)

    # Analyze each failed job
    analyses_data: list[AnalysisData] = []
    for job in failed_jobs:
        analysis = analyze_failure(
            run_id=run_id,
            job_id=job.job_id,
            job_name=job.job_name,
            log_text=job.full_log,
        )

        analyses_data.append(
            AnalysisData(
                job_id=analysis.job_id,
                job_name=analysis.job_name,
                error_category=analysis.error_category.value,
                severity=analysis.severity.value,
                root_cause=analysis.root_cause,
                affected_files=analysis.affected_files,
                affected_dependencies=analysis.affected_dependencies,
                suggested_fix=analysis.suggested_fix,
                confidence=analysis.confidence,
            )
        )

        # Save to database if configured
        if _db_client:
            try:
                await _db_client.save_analysis(analysis)
            except Exception:
                logger.exception("Failed to save analysis to database")

    # Generate repair plan
    analyses_models = []
    for job in failed_jobs:
        analyses_models.append(
            analyze_failure(
                run_id=run_id,
                job_id=job.job_id,
                job_name=job.job_name,
                log_text=job.full_log,
            )
        )

    plan = generate_repair_plan(
        run_id=run_id,
        run_name=run_name,
        branch=branch,
        analyses=analyses_models,
    )

    # Save plan to database if configured
    if _db_client:
        try:
            await _db_client.save_repair_plan(plan)
        except Exception:
            logger.exception("Failed to save repair plan to database")

    plan_data = RepairPlanData(
        branch_name=plan.branch_name,
        pr_title=plan.pr_title,
        pr_body=plan.pr_body,
        can_auto_fix=plan.can_auto_fix,
        summary=plan.summary,
    )

    data = AnalyzeData(
        run_id=run_id,
        run_name=run_name,
        branch=branch,
        analyses=analyses_data,
        repair_plan=plan_data,
    ).model_dump()

    return _success(request, data)


@app.post("/api/runs/{run_id}/repair")
async def repair_run(request: Request, run_id: int, body: RepairRequest) -> dict[str, Any]:
    """Execute repair actions for a failed workflow run.

    Optionally creates a patch branch and pull request when the repair
    plan indicates auto-fixable actions. Branch and PR creation are
    controlled by the create_branch and create_pr request fields.
    """
    if run_id <= 0:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="run_id must be a positive integer",
            status_code=400,
        )

    if body.run_id != run_id:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message="run_id in path does not match run_id in body",
            status_code=400,
        )

    client = _get_client()

    # First analyze
    try:
        failed_jobs = await client.get_failed_jobs(run_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.GITHUB_API_ERROR,
            message=f"Failed to fetch jobs for run {run_id}: {exc}",
            status_code=502,
        ) from exc

    if not failed_jobs:
        return _success(
            request,
            RepairData(
                run_id=run_id,
                message="No failed jobs found — nothing to repair",
            ).model_dump(),
        )

    run_name = ""
    branch = "main"
    try:
        runs = await client.list_workflow_runs(per_page=50)
        for r in runs:
            if r.run_id == run_id:
                run_name = r.run_name
                branch = r.head_branch
                break
    except Exception:
        logger.warning("Failed to fetch run metadata for run %d", run_id)

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

    plan_data = RepairPlanData(
        branch_name=plan.branch_name,
        pr_title=plan.pr_title,
        pr_body=plan.pr_body,
        can_auto_fix=plan.can_auto_fix,
        summary=plan.summary,
    )

    data = RepairData(
        run_id=run_id,
        repair_plan=plan_data,
        branch_created=branch_created,
        pr_url=pr_url,
        message=plan.summary,
    ).model_dump()

    return _success(request, data)


@app.get("/api/history/analyses")
async def get_analysis_history(
    request: Request,
    run_id: int | None = Query(default=None, description="Filter by run ID"),
    limit: int = Query(default=50, ge=1, le=500, description="Max results"),
) -> dict[str, Any]:
    """Retrieve stored failure analyses from the database."""
    db = _get_db()
    if not db:
        raise AppException(
            code=ErrorCode.SERVICE_UNAVAILABLE,
            message="Database not configured. Set DATABASE_URL to enable history.",
            status_code=503,
        )

    try:
        if run_id:
            analyses = await db.get_analyses_for_run(run_id)
        else:
            analyses = await db.get_recent_analyses(limit=limit)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.DATABASE_ERROR,
            message=f"Failed to fetch analyses: {exc}",
            status_code=500,
        ) from exc

    data = HistoryData(analyses=analyses, count=len(analyses)).model_dump()
    return _success(request, data)


@app.get("/api/history/stats/categories")
async def get_category_stats(
    request: Request,
    days: int = Query(default=30, ge=1, le=365, description="Lookback period in days"),
) -> dict[str, Any]:
    """Get error category distribution statistics from the database."""
    db = _get_db()
    if not db:
        raise AppException(
            code=ErrorCode.SERVICE_UNAVAILABLE,
            message="Database not configured. Set DATABASE_URL to enable statistics.",
            status_code=503,
        )

    try:
        categories = await db.get_error_category_counts(days=days)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.DATABASE_ERROR,
            message=f"Failed to fetch category stats: {exc}",
            status_code=500,
        ) from exc

    data = CategoryStatsData(categories=categories, period_days=days).model_dump()
    return _success(request, data)


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
        print("\u2705 Auto-fix available", file=sys.stderr)
    else:
        print("\u26a0\ufe0f  Manual review required", file=sys.stderr)


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
