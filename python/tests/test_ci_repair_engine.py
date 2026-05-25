"""Tests for CI repair engine — analysis and plan generation."""

from mycodexvantaos_ci_repair.models import ErrorCategory, FailureSeverity
from mycodexvantaos_ci_repair.repair_engine import analyze_failure, generate_repair_plan


class TestAnalyzeFailure:
    """Test failure analysis from log text."""

    def test_dependency_error_analysis(self) -> None:
        log = "npm ERR! ERESOLVE could not resolve dependency: @opentelemetry/sdk-node"
        analysis = analyze_failure(
            run_id=123,
            job_id=456,
            job_name="Build",
            log_text=log,
        )
        assert analysis.error_category == ErrorCategory.DEPENDENCY_ERROR
        assert analysis.severity == FailureSeverity.HIGH
        assert "@opentelemetry/sdk-node" in analysis.affected_dependencies
        assert analysis.confidence >= 0.5

    def test_lint_error_analysis(self) -> None:
        log = "ruff check error: I001 Import block is unsorted\n  src/main.py"
        analysis = analyze_failure(
            run_id=123,
            job_id=456,
            job_name="Lint",
            log_text=log,
        )
        assert analysis.error_category == ErrorCategory.LINT_ERROR
        assert analysis.severity == FailureSeverity.LOW
        assert "ruff" in analysis.suggested_fix.lower() or "format" in analysis.suggested_fix.lower()

    def test_test_failure_analysis(self) -> None:
        log = "FAILED 2 tests in 1.5s\nAssertionError: expected 200, got 404"
        analysis = analyze_failure(
            run_id=123,
            job_id=456,
            job_name="Test",
            log_text=log,
        )
        assert analysis.error_category == ErrorCategory.TEST_FAILURE
        assert analysis.severity == FailureSeverity.MEDIUM

    def test_unknown_error_analysis(self) -> None:
        log = "Something went wrong but no known pattern matches"
        analysis = analyze_failure(
            run_id=123,
            job_id=456,
            job_name="Unknown",
            log_text=log,
        )
        assert analysis.error_category == ErrorCategory.UNKNOWN_ERROR
        assert analysis.confidence < 0.5

    def test_empty_log_analysis(self) -> None:
        analysis = analyze_failure(
            run_id=123,
            job_id=456,
            job_name="Empty",
            log_text="",
        )
        assert analysis.error_category == ErrorCategory.UNKNOWN_ERROR


class TestGenerateRepairPlan:
    """Test repair plan generation."""

    def test_plan_with_dependency_error(self) -> None:
        analyses = [
            analyze_failure(
                run_id=100,
                job_id=200,
                job_name="Build",
                log_text="npm ERR! ERESOLVE could not resolve dependency: ws",
            ),
        ]
        plan = generate_repair_plan(
            run_id=100,
            run_name="CI",
            branch="main",
            analyses=analyses,
        )
        assert plan.run_id == 100
        assert len(plan.actions) >= 1
        assert plan.can_auto_fix is True
        assert "fix/ci-repair-" in plan.branch_name
        assert "dependency" in plan.pr_title

    def test_plan_with_multiple_failures(self) -> None:
        analyses = [
            analyze_failure(
                run_id=100,
                job_id=200,
                job_name="Lint",
                log_text="ruff check error: I001",
            ),
            analyze_failure(
                run_id=100,
                job_id=201,
                job_name="Test",
                log_text="FAILED 1 test\nAssertionError: expected True, got False",
            ),
        ]
        plan = generate_repair_plan(
            run_id=100,
            run_name="CI",
            branch="main",
            analyses=analyses,
        )
        assert len(plan.analyses) == 2
        assert len(plan.actions) >= 2

    def test_plan_with_manual_review(self) -> None:
        analyses = [
            analyze_failure(
                run_id=100,
                job_id=200,
                job_name="Deploy",
                log_text="deploy failed: cloudflare deploy fail",
            ),
        ]
        plan = generate_repair_plan(
            run_id=100,
            run_name="Deploy",
            branch="main",
            analyses=analyses,
        )
        assert not plan.can_auto_fix
        assert any(a.requires_manual_review for a in plan.actions)

    def test_plan_pr_body_contains_analysis(self) -> None:
        analyses = [
            analyze_failure(
                run_id=100,
                job_id=200,
                job_name="Build",
                log_text="npm ERR! ERESOLVE could not resolve dependency: ws",
            ),
        ]
        plan = generate_repair_plan(
            run_id=100,
            run_name="CI",
            branch="main",
            analyses=analyses,
        )
        assert "dependency_error" in plan.pr_body
        assert "Build" in plan.pr_body
