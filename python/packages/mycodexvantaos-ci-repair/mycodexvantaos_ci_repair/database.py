"""PostgreSQL database integration for storing repair history and analyses.

Provides async database access via asyncpg for storing and retrieving
failure analyses and repair plans.
"""

from __future__ import annotations

import logging
from typing import Any

import asyncpg
from mycodexvantaos_ci_repair.models import FailureAnalysis, RepairPlan

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Schema DDL
# ---------------------------------------------------------------------------

_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS ci_repair_analyses (
    id              SERIAL PRIMARY KEY,
    run_id          INTEGER NOT NULL,
    job_id          INTEGER NOT NULL,
    job_name        TEXT NOT NULL,
    error_category  TEXT NOT NULL,
    severity        TEXT NOT NULL,
    root_cause      TEXT NOT NULL DEFAULT \'\',
    affected_files  TEXT[] NOT NULL DEFAULT \'{}\',
    affected_deps   TEXT[] NOT NULL DEFAULT \'{}\',
    log_evidence    TEXT NOT NULL DEFAULT \'\',
    suggested_fix   TEXT NOT NULL DEFAULT \'\',
    confidence      REAL NOT NULL DEFAULT 0.0,
    metadata        JSONB NOT NULL DEFAULT \'{}\',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ci_repair_plans (
    id              SERIAL PRIMARY KEY,
    run_id          INTEGER NOT NULL,
    run_name        TEXT NOT NULL DEFAULT \'\',
    branch          TEXT NOT NULL DEFAULT \'main\',
    branch_name     TEXT NOT NULL DEFAULT \'\',
    pr_title        TEXT NOT NULL DEFAULT \'\',
    pr_body         TEXT NOT NULL DEFAULT \'\',
    can_auto_fix    BOOLEAN NOT NULL DEFAULT FALSE,
    summary         TEXT NOT NULL DEFAULT \'\',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ci_repair_actions (
    id              SERIAL PRIMARY KEY,
    plan_id         INTEGER NOT NULL REFERENCES ci_repair_plans(id),
    action_type     TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT \'\',
    file_path       TEXT NOT NULL DEFAULT \'\',
    command         TEXT NOT NULL DEFAULT \'\',
    risk_level      TEXT NOT NULL DEFAULT \'low\',
    requires_manual BOOLEAN NOT NULL DEFAULT FALSE,
    metadata        JSONB NOT NULL DEFAULT \'{}\'
);

CREATE INDEX IF NOT EXISTS idx_analyses_run_id ON ci_repair_analyses(run_id);
CREATE INDEX IF NOT EXISTS idx_plans_run_id ON ci_repair_plans(run_id);
CREATE INDEX IF NOT EXISTS idx_actions_plan_id ON ci_repair_actions(plan_id);
"""


class DatabaseClient:
    """Async PostgreSQL client for CI repair data persistence."""

    def __init__(self, dsn: str) -> None:
        self.dsn = dsn
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        """Create a connection pool and initialize the schema."""
        self._pool = await asyncpg.create_pool(self.dsn, min_size=2, max_size=10)
        async with self._pool.acquire() as conn:  # type: ignore[union-attr]
            await conn.execute(_SCHEMA_SQL)
        logger.info("Database connected and schema initialized")

    async def close(self) -> None:
        """Close the connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None
            logger.info("Database connection pool closed")

    @property
    def pool(self) -> asyncpg.Pool:
        """Get the connection pool, raising if not connected."""
        if self._pool is None:
            raise RuntimeError("Database not connected — call connect() first")
        return self._pool

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    async def save_analysis(self, analysis: FailureAnalysis) -> int:
        """Save a failure analysis to the database. Returns the row ID."""
        async with self.pool.acquire() as conn:
            row_id: int = await conn.fetchval(
                """
                INSERT INTO ci_repair_analyses
                    (run_id, job_id, job_name, error_category, severity,
                     root_cause, affected_files, affected_deps, log_evidence,
                     suggested_fix, confidence, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
                """,
                analysis.run_id,
                analysis.job_id,
                analysis.job_name,
                analysis.error_category.value,
                analysis.severity.value,
                analysis.root_cause,
                analysis.affected_files,
                analysis.affected_dependencies,
                analysis.log_evidence,
                analysis.suggested_fix,
                analysis.confidence,
                analysis.metadata,
            )
        logger.debug(
            "Saved analysis row %d for run %d job %d",
            row_id,
            analysis.run_id,
            analysis.job_id,
        )
        return row_id

    async def save_repair_plan(self, plan: RepairPlan) -> int:
        """Save a repair plan (and its actions) to the database. Returns the plan row ID."""
        async with self.pool.acquire() as conn:
            plan_id: int = await conn.fetchval(
                """
                INSERT INTO ci_repair_plans
                    (run_id, run_name, branch, branch_name, pr_title,
                     pr_body, can_auto_fix, summary)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
                """,
                plan.run_id,
                plan.run_name,
                plan.branch,
                plan.branch_name,
                plan.pr_title,
                plan.pr_body,
                plan.can_auto_fix,
                plan.summary,
            )

            # Save associated actions
            for action in plan.actions:
                await conn.execute(
                    """
                    INSERT INTO ci_repair_actions
                        (plan_id, action_type, description, file_path,
                         command, risk_level, requires_manual, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    """,
                    plan_id,
                    action.action_type.value,
                    action.description,
                    action.file_path,
                    action.command,
                    action.risk_level.value,
                    action.requires_manual_review,
                    action.metadata,
                )

        logger.debug("Saved repair plan row %d for run %d",
                     plan_id, plan.run_id)
        return plan_id

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    async def get_analyses_for_run(self, run_id: int) -> list[dict[str, Any]]:
        """Retrieve all analyses for a given workflow run ID."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ci_repair_analyses WHERE run_id = $1 ORDER BY created_at DESC",
                run_id,
            )
        return [dict(row) for row in rows]

    async def get_plans_for_run(self, run_id: int) -> list[dict[str, Any]]:
        """Retrieve all repair plans for a given workflow run ID."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ci_repair_plans WHERE run_id = $1 ORDER BY created_at DESC",
                run_id,
            )
        return [dict(row) for row in rows]

    async def get_recent_analyses(self, limit: int = 50) -> list[dict[str, Any]]:
        """Retrieve the most recent analyses across all runs."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ci_repair_analyses ORDER BY created_at DESC LIMIT $1",
                limit,
            )
        return [dict(row) for row in rows]

    async def get_error_category_counts(self, days: int = 30) -> dict[str, int]:
        """Get counts of analyses by error category in the last N days."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT error_category, COUNT(*)
                FROM ci_repair_analyses
                WHERE created_at >= NOW() - ($1::int * INTERVAL \'1 day\')
                GROUP BY error_category
                ORDER BY count DESC
                """,
                days,
            )
        return {row["error_category"]: row["count"] for row in rows}
