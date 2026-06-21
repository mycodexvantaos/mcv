"""Tests for CI repair log parser — error classification and extraction.

Covers all 10 error categories, priority ordering, context extraction,
file path extraction, and dependency name extraction.
"""

from mycodexvantaos_ci_repair.log_parser import (
    classify_log,
    extract_affected_dependencies,
    extract_affected_files,
    extract_error_context,
)
from mycodexvantaos_ci_repair.models import ErrorCategory


class TestClassifyLog:
    """Test log classification into error categories."""

    # --- Dependency errors ---

    def test_dependency_error_npm_eresolve(self) -> None:
        log = "npm ERR! ERESOLVE could not resolve dependency\nBuild failed"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_pnpm_lockfile(self) -> None:
        log = "ERR_PNPM_LOCKFILE_MISSING lockfile is missing"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_pnpm_frozen_lockfile(self) -> None:
        log = "pnpm install --frozen-lockfile failed: lockfile is out of date"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_could_not_resolve(self) -> None:
        log = "Could not resolve dependency: @types/node"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_pip(self) -> None:
        log = "pip ERROR: Could not find a version that satisfies the requirement"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_uv_sync(self) -> None:
        log = "uv sync error: failed to resolve dependencies"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_module_not_found(self) -> None:
        log = "ModuleNotFoundError: No module named 'mycodexvantaos_ci_repair'"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_import_error(self) -> None:
        log = "ImportError: cannot import name 'BaseModel' from 'pydantic'"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_dependency_error_file_not_resolvable(self) -> None:
        log = "dependency_file_not_resolvable: package.json"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    # --- Docker build errors ---

    def test_docker_build_error_docker_build_failed(self) -> None:
        log = "docker build failed: COPY failed"
        assert classify_log(log) == ErrorCategory.DOCKER_BUILD_ERROR

    def test_docker_build_error_copy_failed(self) -> None:
        log = "COPY failed: file not found in build context"
        assert classify_log(log) == ErrorCategory.DOCKER_BUILD_ERROR

    def test_docker_build_error_dockerfile(self) -> None:
        log = "ERROR: Dockerfile parse error line 15"
        assert classify_log(log) == ErrorCategory.DOCKER_BUILD_ERROR

    def test_docker_build_error_process_not_complete(self) -> None:
        log = 'process "/bin/sh -c npm ci" did not complete successfully'
        assert classify_log(log) == ErrorCategory.DOCKER_BUILD_ERROR

    # --- Test failures ---

    def test_test_failure_pytest(self) -> None:
        log = "FAILED 3 tests in 2.5s\npytest failed"
        assert classify_log(log) == ErrorCategory.TEST_FAILURE

    def test_test_failure_assertion(self) -> None:
        log = "AssertionError: expected 200, got 404"
        assert classify_log(log) == ErrorCategory.TEST_FAILURE

    def test_test_failure_fail_test(self) -> None:
        log = "FAIL  src/test/app.test.ts"
        assert classify_log(log) == ErrorCategory.TEST_FAILURE

    def test_test_failure_timed_out(self) -> None:
        log = "Error: test suite timed out after 30000ms"
        assert classify_log(log) == ErrorCategory.TEST_FAILURE

    # --- Lint errors ---

    def test_lint_error_ruff(self) -> None:
        log = "ruff check error: I001 Import block is unsorted"
        assert classify_log(log) == ErrorCategory.LINT_ERROR

    def test_lint_error_eslint(self) -> None:
        log = "ESLint error: Unexpected any. Specify a different type"
        assert classify_log(log) == ErrorCategory.LINT_ERROR

    def test_lint_error_prettier(self) -> None:
        log = "Code style issues found in the above file. Run Prettier with --write to fix."
        assert classify_log(log) == ErrorCategory.LINT_ERROR

    def test_lint_error_count(self) -> None:
        log = "2 errors ("
        assert classify_log(log) == ErrorCategory.LINT_ERROR

    # --- Build errors ---

    def test_build_error_typescript(self) -> None:
        log = "error TS2322: Type 'string' is not assignable to type 'number'"
        assert classify_log(log) == ErrorCategory.BUILD_ERROR

    def test_build_error_type_error(self) -> None:
        log = "Type error: Property 'foo' does not exist on type 'Bar'"
        assert classify_log(log) == ErrorCategory.BUILD_ERROR

    def test_build_error_build_failed(self) -> None:
        log = "Build failed with exit code 1"
        assert classify_log(log) == ErrorCategory.BUILD_ERROR

    def test_build_error_next_build(self) -> None:
        log = "next build error: Type error in page.tsx"
        assert classify_log(log) == ErrorCategory.BUILD_ERROR

    def test_build_error_fatal(self) -> None:
        log = "FATAL build error: compilation failed"
        assert classify_log(log) == ErrorCategory.BUILD_ERROR

    # --- Deployment errors ---

    def test_deployment_error_deploy_failed(self) -> None:
        log = "deploy failed: could not push to cloudflare"
        assert classify_log(log) == ErrorCategory.DEPLOYMENT_ERROR

    def test_deployment_error_wrangler(self) -> None:
        log = "wrangler error: Authentication failed"
        assert classify_log(log) == ErrorCategory.DEPLOYMENT_ERROR

    def test_deployment_error_cloudflare(self) -> None:
        log = "cloudflare deploy fail: internal server error"
        assert classify_log(log) == ErrorCategory.DEPLOYMENT_ERROR

    # --- Permission errors ---

    def test_permission_error_denied(self) -> None:
        log = "Permission denied: cannot write to /app/data"
        assert classify_log(log) == ErrorCategory.PERMISSION_ERROR

    def test_permission_error_403(self) -> None:
        log = "403 Forbidden: insufficient permissions"
        assert classify_log(log) == ErrorCategory.PERMISSION_ERROR

    def test_permission_error_resource_not_accessible(self) -> None:
        log = "Resource not accessible by integration (HTTP 403)"
        assert classify_log(log) == ErrorCategory.PERMISSION_ERROR

    # --- Configuration errors ---

    def test_configuration_error(self) -> None:
        log = "config error: invalid workflow file"
        assert classify_log(log) == ErrorCategory.CONFIGURATION_ERROR

    def test_configuration_error_invalid_workflow(self) -> None:
        log = "invalid workflow: .github/workflows/ci.yml is not valid"
        assert classify_log(log) == ErrorCategory.CONFIGURATION_ERROR

    def test_configuration_error_yaml(self) -> None:
        log = "yaml syntax error at line 15"
        assert classify_log(log) == ErrorCategory.CONFIGURATION_ERROR

    # --- Timeout errors ---

    def test_timeout_error_exceeded(self) -> None:
        log = "timeout exceeded: build took too long"
        assert classify_log(log) == ErrorCategory.TIMEOUT_ERROR

    def test_timeout_error_etimedout(self) -> None:
        log = "ETIMEDOUT: connection timed out"
        assert classify_log(log) == ErrorCategory.TIMEOUT_ERROR

    def test_timeout_error_cancelled(self) -> None:
        log = "job was cancelled due to timeout"
        assert classify_log(log) == ErrorCategory.TIMEOUT_ERROR

    # --- Unknown / edge cases ---

    def test_unknown_error(self) -> None:
        log = "Something unexpected happened but we don't know what"
        assert classify_log(log) == ErrorCategory.UNKNOWN_ERROR

    def test_empty_log(self) -> None:
        assert classify_log("") == ErrorCategory.UNKNOWN_ERROR

    def test_whitespace_only_log(self) -> None:
        assert classify_log("   \n  \n  ") == ErrorCategory.UNKNOWN_ERROR

    # --- Priority ordering ---

    def test_dependency_takes_priority_over_build(self) -> None:
        """Dependency error should be classified even if build error appears later."""
        log = "Build failed\nnpm ERR! ERESOLVE could not resolve"
        assert classify_log(log) == ErrorCategory.DEPENDENCY_ERROR

    def test_permission_takes_top_priority(self) -> None:
        """Permission error has highest priority."""
        log = "Build failed\nPermission denied: cannot access file"
        assert classify_log(log) == ErrorCategory.PERMISSION_ERROR

    def test_docker_build_takes_priority_over_build(self) -> None:
        """Docker build error should take priority over generic build error."""
        log = "Build failed\nCOPY failed: file not found"
        assert classify_log(log) == ErrorCategory.DOCKER_BUILD_ERROR


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

    def test_extracts_context_around_last_error(self) -> None:
        log = "\n".join(
            [f"line{i}" for i in range(20)]
            + ["error: the problem"]
            + [f"line{i}" for i in range(20, 40)]
        )
        context = extract_error_context(log, max_lines=15)
        assert "error: the problem" in context

    def test_respects_max_lines(self) -> None:
        log = "\n".join([f"line{i}" for i in range(100)] + ["error: bad thing"])
        context = extract_error_context(log, max_lines=10)
        assert len(context.split("\n")) <= 10

    def test_traceback_indicator(self) -> None:
        log = "some output\nTraceback (most recent call last):\n  File 'test.py', line 1\nerror!"
        context = extract_error_context(log, max_lines=20)
        assert "Traceback" in context


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

    def test_extracts_test_files(self) -> None:
        log = "FAIL tests/test_app.py::test_health"
        files = extract_affected_files(log)
        assert any("test_app.py" in f for f in files)

    def test_extracts_yaml_files(self) -> None:
        log = "error in tests/fixtures/config.yaml at line 5"
        files = extract_affected_files(log)
        assert any("config.yaml" in f for f in files)

    def test_empty_log(self) -> None:
        assert extract_affected_files("") == []

    def test_deduplicates(self) -> None:
        log = "error in src/app.ts\nerror in src/app.ts"
        files = extract_affected_files(log)
        assert len(files) == 1

    def test_no_files_in_log(self) -> None:
        log = "Build failed with exit code 1"
        assert extract_affected_files(log) == []

    def test_extracts_toml_files(self) -> None:
        log = "config error in python/pyproject.toml"
        files = extract_affected_files(log)
        assert any("pyproject.toml" in f for f in files)


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

    def test_extracts_import_error_module(self) -> None:
        log = "ImportError: cannot import name 'Settings' from 'pydantic'"
        deps = extract_affected_dependencies(log)
        assert "pydantic" in deps

    def test_extracts_npm_err_dependency(self) -> None:
        log = 'npm ERR! Could not resolve dependency: "lodash"'
        deps = extract_affected_dependencies(log)
        assert "lodash" in deps

    def test_extracts_package_not_found(self) -> None:
        log = "package 'express' not found"
        deps = extract_affected_dependencies(log)
        assert "express" in deps

    def test_empty_log(self) -> None:
        assert extract_affected_dependencies("") == []

    def test_no_dependencies_in_log(self) -> None:
        log = "Build failed with exit code 1"
        assert extract_affected_dependencies(log) == []

    def test_deduplicates(self) -> None:
        log = "Could not resolve dependency: @opentelemetry/sdk-node\nCould not resolve dependency: @opentelemetry/sdk-node"
        deps = extract_affected_dependencies(log)
        assert len(deps) == 1
