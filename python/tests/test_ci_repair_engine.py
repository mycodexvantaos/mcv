"""Tests for CI repair engine — analysis and plan generation.

Covers failure analysis for all error categories, repair plan generation,
auto-fix detection, PR body generation, and branch naming.
"""

from mycodexvantaos_ci_repair.models import (
    ErrorCategory,
    FailureSeverity,
    RepairActionType,
)
from mycodexvantaos_ci_repair.repair_engine import (
    _generate_repair_actions,
    _severity_for_category,
    analyze_failure,
    generate_repair_plan,
)


class TestSeverityForCategory:
    """Test severity mapping for error categories."""

    def test_deployment_is_critical(self) -> None:
        assert _severity_for_category(ErrorCategory.DEPLOYMENT_ERROR) == FailureSeverity.CRITICAL

    def test_dependency_is_high(self) -> None:
        assert _severity_for_category(ErrorCategory.DEPENDENCY_ERROR) == FailureSeverity.HIGH

    def test_test_failure_is_medium(self) -> None:
        assert _severity_for_category(ErrorCategory.TEST_FAILURE) == FailureSeverity.MEDIUM

    def test_lint_is_low(self) -> None:
        assert _severity_for_category(ErrorCategory.LINT_ERROR) == FailureSeverity.LOW

    def test_build_is_high(self) -> None:
        assert _severity_for_category(ErrorCategory.BUILD_ERROR) == FailureSeverity.HIGH

    def test_docker_build_is_high(self) -> None:
        assert _severity_for_category(ErrorCategory.DOCKER_BUILD_ERROR) == FailureSeverity.HIGH

    def test_permission_is_high(self) -> None:
        assert _severity_for_category(ErrorCategory.PERMISSION_ERROR) == FailureSeverity.HIGH

    def test_configuration_is_medium(self) -> None:
        assert _severity_for_category(ErrorCategory.CONFIGURATION_ERROR) == FailureSeverity.MEDIUM

    def test_timeout_is_medium(self) -> None:
        assert _severity_for_category(ErrorCategory.TIMEOUT_ERROR) == FailureSeverity.MEDIUM

    def test_unknown_is_medium(self) -> None:
        assert _severity_for_category(ErrorCategory.UNKNOWN_ERROR) == FailureSeverity.MEDIUM


class TestSuggestFix:
    """Test fix suggestion generation for each error category."""

    def test_dependency_error_with_deps(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Build",
            log_text="npm ERR! ERESOLVE could not resolve dependency: ws",
        )
        assert "ws" in analysis.suggested_fix
        assert "pnpm" in analysis.suggested_fix.lower()

    def test_dependency_error_without_deps(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Build",
            log_text="npm ERR! ERESOLVE could not resolve",
        )
        assert "dependency" in analysis.suggested_fix.lower()

    def test_lint_error_python(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Lint",
            log_text="ruff check error: I001 in src/main.py",
        )
        assert "ruff" in analysis.suggested_fix.lower()

    def test_lint_error_js(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Lint",
            log_text="ESLint error: unexpected any",
        )
        assert (
            "format" in analysis.suggested_fix.lower() or "lint" in analysis.suggested_fix.lower()
        )

    def test_test_failure_suggests_review(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Test",
            log_text="FAILED 1 test\nAssertionError: expected True",
        )
        assert (
            "review" in analysis.suggested_fix.lower() or "test" in analysis.suggested_fix.lower()
        )

    def test_build_error_typescript(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Build",
            log_text="error TS2322: Type 'string' is not assignable",
        )
        assert (
            "typescript" in analysis.suggested_fix.lower()
            or "type" in analysis.suggested_fix.lower()
        )

    def test_docker_build_error(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Docker",
            log_text='process "/bin/sh -c npm ci" did not complete successfully',
        )
        assert "docker" in analysis.suggested_fix.lower() or "Dockerfile" in analysis.suggested_fix

    def test_deployment_error(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Deploy",
            log_text="deploy failed: cloudflare deploy fail",
        )
        assert "deploy" in analysis.suggested_fix.lower()

    def test_permission_error(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="CI",
            log_text="Permission denied: cannot access resource",
        )
        assert (
            "permission" in analysis.suggested_fix.lower()
            or "token" in analysis.suggested_fix.lower()
        )

    def test_configuration_error(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="CI",
            log_text="config error: invalid workflow file",
        )
        assert (
            "workflow" in analysis.suggested_fix.lower() or "yaml" in analysis.suggested_fix.lower()
        )

    def test_timeout_error(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="CI",
            log_text="timeout exceeded: build took too long",
        )
        assert "timeout" in analysis.suggested_fix.lower()

    def test_unknown_error(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="CI",
            log_text="Something went wrong but we don't know what",
        )
        assert "manual" in analysis.suggested_fix.lower()


class TestGenerateRepairActions:
    """Test repair action generation for each error category."""

    def test_dependency_error_with_deps(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Build",
            log_text="npm ERR! ERESOLVE could not resolve dependency: ws",
        )
        actions = _generate_repair_actions(analysis)
        assert len(actions) >= 1
        assert any(a.action_type == RepairActionType.UPDATE_DEPENDENCY for a in actions)

    def test_dependency_error_without_deps(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Build",
            log_text="npm ERR! ERESOLVE could not resolve",
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.UPDATE_DEPENDENCY for a in actions)
        assert "pnpm install" in actions[0].command

    def test_lint_error_python(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Lint",
            log_text="ruff check error: I001 in src/main.py",
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.FIX_LINT for a in actions)

    def test_lint_error_js(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Lint",
            log_text="ESLint error: unexpected any in src/app.ts",
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.FIX_LINT for a in actions)

    def test_test_failure_generates_fix_test(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Test",
            log_text="FAILED 1 test\nAssertionError: expected True",
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.FIX_TEST for a in actions)
        assert all(a.requires_manual_review for a in actions)

    def test_build_error_generates_patch_file(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Build",
            log_text="error TS2322: Type error",
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.PATCH_FILE for a in actions)

    def test_docker_build_error(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Docker",
            log_text='process "/bin/sh -c npm ci" did not complete successfully',
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.UPDATE_DOCKERFILE for a in actions)

    def test_deployment_error_generates_manual(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Deploy",
            log_text="deploy failed: cloudflare deploy fail",
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.MANUAL_INTERVENTION for a in actions)
        assert actions[0].risk_level == FailureSeverity.CRITICAL

    def test_permission_error_generates_update_workflow(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="CI",
            log_text="Permission denied",
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.UPDATE_WORKFLOW for a in actions)

    def test_configuration_error_generates_update_workflow(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="CI",
            log_text="config error: invalid workflow",
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.UPDATE_WORKFLOW for a in actions)

    def test_unknown_error_generates_manual(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="CI",
            log_text="Something unexpected happened",
        )
        actions = _generate_repair_actions(analysis)
        assert any(a.action_type == RepairActionType.MANUAL_INTERVENTION for a in actions)


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
        assert (
            "ruff" in analysis.suggested_fix.lower() or "format" in analysis.suggested_fix.lower()
        )

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

    def test_docker_build_analysis(self) -> None:
        log = 'process "/bin/sh -c npm ci" did not complete successfully\nCOPY failed'
        analysis = analyze_failure(
            run_id=123,
            job_id=456,
            job_name="Docker",
            log_text=log,
        )
        assert analysis.error_category == ErrorCategory.DOCKER_BUILD_ERROR
        assert analysis.severity == FailureSeverity.HIGH

    def test_deployment_error_analysis(self) -> None:
        log = "deploy failed: cloudflare deploy fail"
        analysis = analyze_failure(
            run_id=123,
            job_id=456,
            job_name="Deploy",
            log_text=log,
        )
        assert analysis.error_category == ErrorCategory.DEPLOYMENT_ERROR
        assert analysis.severity == FailureSeverity.CRITICAL

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

    def test_analysis_includes_root_cause(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Build",
            log_text="npm ERR! ERESOLVE could not resolve",
        )
        assert "dependency_error" in analysis.root_cause
        assert "Build" in analysis.root_cause

    def test_analysis_includes_log_evidence(self) -> None:
        analysis = analyze_failure(
            run_id=1,
            job_id=1,
            job_name="Build",
            log_text="npm ERR! ERESOLVE could not resolve",
        )
        assert len(analysis.log_evidence) > 0


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

    def test_plan_with_lint_error_auto_fixable(self) -> None:
        analyses = [
            analyze_failure(
                run_id=100,
                job_id=200,
                job_name="Lint",
                log_text="ruff check error: I001",
            ),
        ]
        plan = generate_repair_plan(
            run_id=100,
            run_name="Lint Check",
            branch="main",
            analyses=analyses,
        )
        assert plan.can_auto_fix is True

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

    def test_plan_branch_name_is_kebab_case(self) -> None:
        analyses = [
            analyze_failure(
                run_id=42,
                job_id=1,
                job_name="Build",
                log_text="npm ERR! ERESOLVE",
            ),
        ]
        plan = generate_repair_plan(
            run_id=42,
            run_name="CI Pipeline",
            branch="main",
            analyses=analyses,
        )
        assert plan.branch_name.startswith("fix/ci-repair-")
        # Should be lowercase kebab-case
        assert plan.branch_name == plan.branch_name.lower()

    def test_plan_summary_includes_counts(self) -> None:
        analyses = [
            analyze_failure(
                run_id=100,
                job_id=200,
                job_name="Build",
                log_text="npm ERR! ERESOLVE",
            ),
        ]
        plan = generate_repair_plan(
            run_id=100,
            run_name="CI",
            branch="main",
            analyses=analyses,
        )
        assert "1 failure" in plan.summary
        assert "1 action" in plan.summary

    def test_plan_with_critical_prevents_auto_fix(self) -> None:
        """Even if one action is auto-fixable, critical risk prevents auto-fix."""
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
