"""Log parser — extracts failure signals from GitHub Actions job logs."""

from __future__ import annotations

import re

from mycodexvantaos_ci_repair.models import ErrorCategory

# Priority ordering: higher priority categories are checked first.
# When scanning bottom-up, multiple categories may match; we return
# the highest-priority match to ensure root causes (like dependency errors)
# take precedence over downstream effects (like build errors).
_PRIORITY: dict[ErrorCategory, int] = {
    ErrorCategory.PERMISSION_ERROR: 10,
    ErrorCategory.DEPENDENCY_ERROR: 9,
    ErrorCategory.CONFIGURATION_ERROR: 8,
    ErrorCategory.DOCKER_BUILD_ERROR: 7,
    ErrorCategory.DEPLOYMENT_ERROR: 6,
    ErrorCategory.TIMEOUT_ERROR: 5,
    ErrorCategory.TEST_FAILURE: 4,
    ErrorCategory.BUILD_ERROR: 3,
    ErrorCategory.LINT_ERROR: 2,
    ErrorCategory.UNKNOWN_ERROR: 1,
}

# Patterns mapped to error categories.
_PATTERNS: list[tuple[re.Pattern[str], ErrorCategory]] = [
    # Dependency errors
    (re.compile(r"npm ERR! .*ERESOLVE.*", re.IGNORECASE), ErrorCategory.DEPENDENCY_ERROR),
    (
        re.compile(r"pnpm install.*--frozen-lockfile.*failed", re.IGNORECASE),
        ErrorCategory.DEPENDENCY_ERROR,
    ),
    (re.compile(r"ERR_PNPM_LOCKFILE_MISSING", re.IGNORECASE), ErrorCategory.DEPENDENCY_ERROR),
    (re.compile(r"Could not resolve dependency", re.IGNORECASE), ErrorCategory.DEPENDENCY_ERROR),
    (re.compile(r"pip.*ERROR.*Could not find", re.IGNORECASE), ErrorCategory.DEPENDENCY_ERROR),
    (re.compile(r"uv sync.*error", re.IGNORECASE), ErrorCategory.DEPENDENCY_ERROR),
    (re.compile(r"ModuleNotFoundError", re.IGNORECASE), ErrorCategory.DEPENDENCY_ERROR),
    (re.compile(r"ImportError", re.IGNORECASE), ErrorCategory.DEPENDENCY_ERROR),
    (
        re.compile(r"dependency_file_not_resolvable", re.IGNORECASE),
        ErrorCategory.DEPENDENCY_ERROR,
    ),
    # Docker build errors
    (re.compile(r"docker build.*failed", re.IGNORECASE), ErrorCategory.DOCKER_BUILD_ERROR),
    (re.compile(r"COPY failed", re.IGNORECASE), ErrorCategory.DOCKER_BUILD_ERROR),
    (re.compile(r"ERROR:.*Dockerfile", re.IGNORECASE), ErrorCategory.DOCKER_BUILD_ERROR),
    (
        re.compile(r'process "/bin/sh.*did not complete successfully', re.IGNORECASE),
        ErrorCategory.DOCKER_BUILD_ERROR,
    ),
    # Test failures
    (re.compile(r"FAILED\s+\d+ test", re.IGNORECASE), ErrorCategory.TEST_FAILURE),
    (re.compile(r"AssertionError", re.IGNORECASE), ErrorCategory.TEST_FAILURE),
    (re.compile(r"pytest.*failed", re.IGNORECASE), ErrorCategory.TEST_FAILURE),
    (re.compile(r"FAIL\s+.*test", re.IGNORECASE), ErrorCategory.TEST_FAILURE),
    (re.compile(r"Error:.*test.*timed out", re.IGNORECASE), ErrorCategory.TEST_FAILURE),
    # Lint errors
    (re.compile(r"ruff check.*error", re.IGNORECASE), ErrorCategory.LINT_ERROR),
    (re.compile(r"ESLint.*error", re.IGNORECASE), ErrorCategory.LINT_ERROR),
    (re.compile(r"prettier.*check.*failed", re.IGNORECASE), ErrorCategory.LINT_ERROR),
    (re.compile(r"Code style issues found", re.IGNORECASE), ErrorCategory.LINT_ERROR),
    (re.compile(r"\d+ error[s]?\s*\(", re.IGNORECASE), ErrorCategory.LINT_ERROR),
    # Build errors
    (re.compile(r"Type error:", re.IGNORECASE), ErrorCategory.BUILD_ERROR),
    (re.compile(r"error TS\d+:", re.IGNORECASE), ErrorCategory.BUILD_ERROR),
    (re.compile(r"Build failed", re.IGNORECASE), ErrorCategory.BUILD_ERROR),
    (re.compile(r"next build.*error", re.IGNORECASE), ErrorCategory.BUILD_ERROR),
    (re.compile(r"FATAL.*build", re.IGNORECASE), ErrorCategory.BUILD_ERROR),
    # Deployment errors
    (re.compile(r"deploy.*failed", re.IGNORECASE), ErrorCategory.DEPLOYMENT_ERROR),
    (re.compile(r"wrangler.*error", re.IGNORECASE), ErrorCategory.DEPLOYMENT_ERROR),
    (re.compile(r"cloudflare.*deploy.*fail", re.IGNORECASE), ErrorCategory.DEPLOYMENT_ERROR),
    # Permission errors
    (re.compile(r"Permission denied", re.IGNORECASE), ErrorCategory.PERMISSION_ERROR),
    (re.compile(r"403 Forbidden", re.IGNORECASE), ErrorCategory.PERMISSION_ERROR),
    (re.compile(r"Resource not accessible", re.IGNORECASE), ErrorCategory.PERMISSION_ERROR),
    # Configuration errors
    (re.compile(r"config.*error", re.IGNORECASE), ErrorCategory.CONFIGURATION_ERROR),
    (re.compile(r"invalid.*workflow", re.IGNORECASE), ErrorCategory.CONFIGURATION_ERROR),
    (re.compile(r"yaml.*syntax.*error", re.IGNORECASE), ErrorCategory.CONFIGURATION_ERROR),
    # Timeout errors
    (re.compile(r"timeout.*exceeded", re.IGNORECASE), ErrorCategory.TIMEOUT_ERROR),
    (re.compile(r"ETIMEDOUT", re.IGNORECASE), ErrorCategory.TIMEOUT_ERROR),
    (re.compile(r"job was cancelled", re.IGNORECASE), ErrorCategory.TIMEOUT_ERROR),
]


def classify_log(log_text: str) -> ErrorCategory:
    """Classify the error category from log text.

    Scans all log lines for known patterns and returns the highest-priority
    category match. This ensures root causes (e.g., dependency errors) take
    precedence over downstream effects (e.g., build errors).
    """
    if not log_text:
        return ErrorCategory.UNKNOWN_ERROR

    best_category = ErrorCategory.UNKNOWN_ERROR
    best_priority = 0

    for line in log_text.strip().splitlines():
        for pattern, category in _PATTERNS:
            if pattern.search(line):
                priority = _PRIORITY.get(category, 0)
                if priority > best_priority:
                    best_priority = priority
                    best_category = category

    return best_category


def extract_error_context(log_text: str, max_lines: int = 50) -> str:
    """Extract the most relevant error context from log text.

    Returns up to max_lines centered around the last error indicator, or the
    last max_lines if no error indicator is found.
    """
    if not log_text:
        return ""

    lines = log_text.strip().splitlines()
    error_indicators = [
        "error",
        "failed",
        "FAIL",
        "fatal",
        "FATAL",
        "exception",
        "Exception",
        "ERR!",
        "ERR_PNPM",
        "Traceback",
    ]

    # Find lines with error indicators
    error_line_indices = []
    for i, line in enumerate(lines):
        if any(ind in line for ind in error_indicators):
            error_line_indices.append(i)

    if not error_line_indices:
        return "\n".join(lines[-max_lines:])

    # Take context around the last error
    last_error_idx = error_line_indices[-1]
    start = max(0, last_error_idx - 10)
    end = min(len(lines), start + max_lines)
    return "\n".join(lines[start:end])


def extract_affected_files(log_text: str) -> list[str]:
    """Extract file paths mentioned in error lines."""
    if not log_text:
        return []

    file_pattern = re.compile(
        r"(?:^|\s)((?:\./)?(?:src|lib|test|tests|python|packages|apps|services)/"
        r"[\w/.-]+\.(?:py|ts|tsx|js|jsx|json|yaml|yml|toml|md))"
    )
    matches = file_pattern.findall(log_text)
    # Deduplicate while preserving order
    seen: set[str] = set()
    result: list[str] = []
    for m in matches:
        if m not in seen:
            seen.add(m)
            result.append(m)
    return result


def extract_affected_dependencies(log_text: str) -> list[str]:
    """Extract dependency names from error lines."""
    if not log_text:
        return []

    dep_patterns = [
        re.compile(r"could not resolve dependency[:\s]+([@\w/-]+)", re.IGNORECASE),
        re.compile(r"""npm ERR! .*['"]([@\w/-]+)['"]"""),
        re.compile(r"""ModuleNotFoundError:\s+No module named ['"]([\w.]+)['"]"""),
        re.compile(r"""ImportError:\s+.*['"]([\w.]+)['"]"""),
        re.compile(r"""package ['"]([@\w/-]+)['"] not found"""),
    ]

    deps: list[str] = []
    for pattern in dep_patterns:
        for match in pattern.findall(log_text):
            if match not in deps:
                deps.append(match)
    return deps
