"""Tests for CI repair log parser — error classification and extraction."""

from mycodexvantaos_ci_repair.log_parser import (
    classify_log,
    extract_affected_dependencies,
    extract_affected_files,
    extract_error_context,
)
from mycodexvantaos_ci_repair.models import ErrorCategory


class TestClassifyLog:
    """Test log classification into error categories."""

    def test_dependency_error_npm_eresolve(self) -> None:
        log = "npm ERR! ERESOLVE could not resolve dependency\nBuild failed"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_pnpm_lockfile(self) -> None:
        log = "ERR_PNPM_LOCKFILE_MISSING lockfile is missing"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_module_not_found(self) -> None:
        log = "ModuleNotFoundError: No module named 'mycodexvantaos_ci_repair'"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_import_error(self) -> None:
        log = "ImportError: cannot import name 'BaseModel' from 'pydantic'"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_lint_error_ruff(self) -> None:
        log = "ruff check error: I001 Import block is unsorted"
        assert classify_log(log) == ErrorCategory.LINT_ERROR

    def test_lint_error_prettier(self) -> None:
        log = "Code style issues found in the above file. Run Prettier with --write to fix."
        assert classify_log(log) == ErrorCategory.LINT_ERROR

    def test_test_failure_pytest(self) -> None:
        log = "FAILED 3 tests in 2.5s\npytest failed"
        assert classify_log(log) == ErrorCategory.TEST_FAILURE

    def test_test_failure_assertion(self) -> None:
        log = "AssertionError: expected 200, got 404"
        assert classify_log(log) == ErrorCategory.TEST_FAILURE

    def test_build_error_typescript(self) -> None:
        log = "error TS2322: Type 'string' is not assignable to type 'number'"
        assert classify_log(log) == ErrorCategory.BUILD_ERROR

    def test_build_error_type_error(self) -> None:
        log = "Type error: Property 'foo' does not exist on type 'Bar'"
        assert classify_log(log) == ErrorCategory.BUILD_ERROR

    def test_docker_build_error(self) -> None:
        log = "process \"/bin/sh -c npm ci\" did not complete successfully"
        assert classify_log(log) == ErrorCategory.DOCKER_BUILD_ERROR

    def test_permission_error(self) -> None:
        log = "Resource not accessible by integration (HTTP 403)"
        assert classify_log(log) == ErrorCategory.PERMISSION_ERROR

    def test_timeout_error(self) -> None:
        log = "timeout exceeded: job was cancelled after 60 minutes"
        assert classify_log(log) == ErrorCategory.TIMEOUT_ERROR

    def test_unknown_error(self) -> None:
        log = "Something unexpected happened but we don't know what"
        assert classify_log(log) == ErrorCategory.UNKNOWN_ERROR

    def test_empty_log(self) -> None:
        assert classify_log("") == ErrorCategory.UNKNOWN_ERROR

    def test_dependency_takes_priority_over_build(self) -> None:
        """Dependency error should be classified even if build error appears later."""
        log = "Build failed\nnpm ERR! ERESOLVE could not resolve"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR


class TestExtractErrorContext:
    """Test error context extraction from logs."""

    def test_extracts_error_lines(self) -> None:
        log = "line1\nline2\nerror: something failed\nline4\nline5"
        context = extract_error_context(log, max_lines=10)
        assert "error: something failed" in context

    def test_empty_log(self) -> None:
        assert extract_error_context("") == ""

    def test_returns_last_lines_when_no_error(self) -> None:
        log = "line1\nline2\nline3"
        context = extract_error_context(log, max_lines=2)
        assert context.count("\n") == 1  # 2 lines


class TestExtractAffectedFiles:
    """Test file path extraction from error logs."""

    def test_extracts_python_files(self) -> None:
        log = "Error in python/packages/mycodexvantaos-ci-repair/mycodexvantaos_ci_repair/models.py"
        files = extract_affected_files(log)
        assert any("models.py" in f for f in files)

    def test_extracts_ts_files(self) -> None:
        log = "Type error in src/ai/genkit.ts:42:5"
        files = extract_affected_files(log)
        assert any("genkit.ts" in f for f in files)

    def test_empty_log(self) -> None:
        assert extract_affected_files("") == []

    def test_deduplicates(self) -> None:
        log = "error in src/app.ts\nerror in src/app.ts"
        files = extract_affected_files(log)
        assert len(files) == 1


class TestExtractAffectedDependencies:
    """Test dependency name extraction from error logs."""

    def test_extracts_npm_dependency(self) -> None:
        log = "Could not resolve dependency: @opentelemetry/sdk-node"
        deps = extract_affected_dependencies(log)
        assert "@opentelemetry/sdk-node" in deps

    def test_extracts_python_module(self) -> None:
        log = "ModuleNotFoundError: No module named 'fastapi'"
        deps = extract_affected_dependencies(log)
        assert "fastapi" in deps

    def test_empty_log(self) -> None:
        assert extract_affected_dependencies("") == []
