"""Repair engine — generates repair plans from failure analyses."""

from __future__ import annotations

import logging
import re

from mycodexvantaos_ci_repair.models import (ErrorCategory, FailureAnalysis,
                                             FailureSeverity, RepairAction,
                                             RepairActionType, RepairPlan)

logger = logging.getLogger(__name__)


def _severity_for_category(category: ErrorCategory) -> FailureSeverity:
    """Map error category to default severity."""
    mapping: dict[ErrorCategory, FailureSeverity] = {
        ErrorCategory.DEPENDENCY_ERROR: FailureSeverity.HIGH,
        ErrorCategory.TEST_FAILURE: FailureSeverity.MEDIUM,
        ErrorCategory.LINT_ERROR: FailureSeverity.LOW,
        ErrorCategory.BUILD_ERROR: FailureSeverity.HIGH,
        ErrorCategory.DOCKER_BUILD_ERROR: FailureSeverity.HIGH,
        ErrorCategory.DEPLOYMENT_ERROR: FailureSeverity.CRITICAL,
        ErrorCategory.PERMISSION_ERROR: FailureSeverity.HIGH,
        ErrorCategory.CONFIGURATION_ERROR: FailureSeverity.MEDIUM,
        ErrorCategory.TIMEOUT_ERROR: FailureSeverity.MEDIUM,
        ErrorCategory.UNKNOWN_ERROR: FailureSeverity.MEDIUM,
    }
    return mapping.get(category, FailureSeverity.MEDIUM)


def _suggest_fix(analysis: FailureAnalysis) -> str:
    """Generate a human-readable fix suggestion based on the analysis."""
    category = analysis.error_category
    deps = analysis.affected_dependencies
    files = analysis.affected_files

    if category == ErrorCategory.DEPENDENCY_ERROR:
        if deps:
            return f"Update or override dependencies: {\", \".join(deps)}. Run `pnpm install` to update lockfile."
        return "Check dependency resolution. Run `pnpm install` and verify lockfile sync."

    if category == ErrorCategory.LINT_ERROR:
        if any("ruff" in f for f in files) or any(".py" in f for f in files):
            return "Run `uv run ruff check --fix .` and `uv run ruff format .` to auto-fix."
        return "Run `pnpm run format` and `pnpm run lint` to auto-fix formatting issues."

    if category == ErrorCategory.TEST_FAILURE:
        return "Review failing test output. Check for import errors, assertion failures, or missing fixtures."

    if category == ErrorCategory.BUILD_ERROR:
        if "TS" in analysis.log_evidence:
            return "Fix TypeScript errors. Run `npx tsc --noEmit` locally to reproduce."
        return (
            "Review build error output. Check for missing imports, type errors, or config issues."
        )

    if category == ErrorCategory.DOCKER_BUILD_ERROR:
        return "Review Dockerfile. Check for missing COPY targets, failed RUN commands, or base image issues."

    if category == ErrorCategory.DEPLOYMENT_ERROR:
        return "Review deployment configuration. Check credentials, environment variables, and target platform status."

    if category == ErrorCategory.PERMISSION_ERROR:
        return "Check GitHub Actions permissions. Verify token has required scopes (checks:read, contents:write)."

    if category == ErrorCategory.CONFIGURATION_ERROR:
        return "Review workflow YAML configuration. Check for syntax errors or invalid action references."

    if category == ErrorCategory.TIMEOUT_ERROR:
        return "Investigate timeout. Consider increasing timeout, optimizing build, or splitting the job."

    return "Manual investigation required. Review the full log output for details."


def _generate_repair_actions(analysis: FailureAnalysis) -> list[RepairAction]:
    """Generate repair actions from a failure analysis."""
    category = analysis.error_category
    actions: list[RepairAction] = []

    if category == ErrorCategory.DEPENDENCY_ERROR:
        deps = analysis.affected_dependencies
        if deps:
            for dep in deps:
                actions.append(
                    RepairAction(
                        action_type=RepairActionType.UPDATE_DEPENDENCY,
                        description=f"Update dependency: {dep}",
                        command=f"pnpm update {dep}",
                        risk_level=FailureSeverity.LOW,
                        requires_manual_review=False,
                        metadata={"dependency": dep},
                    )
                )
        else:
            actions.append(
                RepairAction(
                    action_type=RepairActionType.UPDATE_DEPENDENCY,
                    description="Reinstall dependencies to sync lockfile",
                    command="pnpm install --no-frozen-lockfile",
                    risk_level=FailureSeverity.LOW,
                    requires_manual_review=False,
                )
            )

    elif category == ErrorCategory.LINT_ERROR:
        has_python = any(".py" in f for f in analysis.affected_files)
        if has_python:
            actions.append(
                RepairAction(
                    action_type=RepairActionType.FIX_LINT,
                    description="Auto-fix Python lint errors with ruff",
                    command="cd python && uv run ruff check --fix . && uv run ruff format .",
                    risk_level=FailureSeverity.LOW,
                    requires_manual_review=False,
                )
            )
        else:
            actions.append(
                RepairAction(
                    action_type=RepairActionType.FIX_LINT,
                    description="Auto-fix formatting with prettier",
                    command="pnpm run format",
                    risk_level=FailureSeverity.LOW,
                    requires_manual_review=False,
                )
            )

    elif category == ErrorCategory.TEST_FAILURE:
        actions.append(
            RepairAction(
                action_type=RepairActionType.FIX_TEST,
                description="Review and fix failing tests",
                risk_level=FailureSeverity.MEDIUM,
                requires_manual_review=True,
                metadata={"affected_files": analysis.affected_files},
            )
        )

    elif category == ErrorCategory.BUILD_ERROR:
        actions.append(
            RepairAction(
                action_type=RepairActionType.PATCH_FILE,
                description="Fix build errors in affected files",
                risk_level=FailureSeverity.MEDIUM,
                requires_manual_review=True,
                metadata={"affected_files": analysis.affected_files},
            )
        )

    elif category == ErrorCategory.PERMISSION_ERROR:
        actions.append(
            RepairAction(
                action_type=RepairActionType.UPDATE_WORKFLOW,
                description="Update workflow permissions",
                risk_level=FailureSeverity.HIGH,
                requires_manual_review=True,
            )
        )

    elif category == ErrorCategory.CONFIGURATION_ERROR:
        actions.append(
            RepairAction(
                action_type=RepairActionType.UPDATE_WORKFLOW,
                description="Fix workflow configuration",
                risk_level=FailureSeverity.MEDIUM,
                requires_manual_review=True,
            )
        )

    elif category == ErrorCategory.DOCKER_BUILD_ERROR:
        actions.append(
            RepairAction(
                action_type=RepairActionType.UPDATE_DOCKERFILE,
                description="Fix Dockerfile build errors",
                risk_level=FailureSeverity.MEDIUM,
                requires_manual_review=True,
            )
        )

    elif category == ErrorCategory.DEPLOYMENT_ERROR:
        actions.append(
            RepairAction(
                action_type=RepairActionType.MANUAL_INTERVENTION,
                description="Investigate deployment failure manually",
                risk_level=FailureSeverity.CRITICAL,
                requires_manual_review=True,
            )
        )

    else:
        actions.append(
            RepairAction(
                action_type=RepairActionType.MANUAL_INTERVENTION,
                description="Manual investigation required",
                risk_level=FailureSeverity.MEDIUM,
                requires_manual_review=True,
            )
        )

    return actions


def analyze_failure(
    run_id: int,
    job_id: int,
    job_name: str,
    log_text: str,
) -> FailureAnalysis:
    """Analyze a single job failure from its log text."""
    from mycodexvantaos_ci_repair.log_parser import (
        classify_log, extract_affected_dependencies, extract_affected_files,
        extract_error_context)

    category = classify_log(log_text)
    severity = _severity_for_category(category)
    affected_files = extract_affected_files(log_text)
    affected_deps = extract_affected_dependencies(log_text)
    log_evidence = extract_error_context(log_text, max_lines=30)

    analysis = FailureAnalysis(
        run_id=run_id,
        job_id=job_id,
        job_name=job_name,
        error_category=category,
        severity=severity,
        root_cause=f"{category.value} detected in job \'{job_name}\'",
        affected_files=affected_files,
        affected_dependencies=affected_deps,
        log_evidence=log_evidence,
        confidence=0.8 if category != ErrorCategory.UNKNOWN_ERROR else 0.3,
    )
    analysis.suggested_fix = _suggest_fix(analysis)
    return analysis


def generate_repair_plan(
    run_id: int,
    run_name: str,
    branch: str,
    analyses: list[FailureAnalysis],
) -> RepairPlan:
    """Generate a complete repair plan from multiple failure analyses."""
    all_actions: list[RepairAction] = []
    for analysis in analyses:
        actions = _generate_repair_actions(analysis)
        all_actions.extend(actions)

    can_auto_fix = any(not a.requires_manual_review for a in all_actions)
    has_critical = any(a.risk_level == FailureSeverity.CRITICAL for a in all_actions)

    # Generate branch name
    safe_name = re.sub(r"[^a-z0-9-]", "-", run_name.lower())[:40]
    branch_name = f"fix/ci-repair-{safe_name}-{run_id}"

    # Generate PR title
    categories = sorted(set(a.error_category for a in analyses))
    category_str = ", ".join(c.value.replace("_", " ") for c in categories)
    pr_title = f"fix(ci): auto-repair for {category_str} — run #{run_id}"

    # Generate PR body
    body_parts = [
        "## CI Auto-Repair\n",
        f"**Workflow Run:** #{run_id} — {run_name}",
        f"**Branch:** {branch}",
        f"**Error Categories:** {category_str}\n",
        "### Failure Analysis\n",
    ]
    for i, analysis in enumerate(analyses, 1):
        body_parts.append(
            f"**{i}. {analysis.job_name}** — {analysis.error_category.value} "
            f"({analysis.severity.value})\n"
            f"   Root cause: {analysis.root_cause}\n"
            f"   Suggested fix: {analysis.suggested_fix}\n"
        )

    if all_actions:
        body_parts.append("### Repair Actions\n")
        for i, action in enumerate(all_actions, 1):
            auto = "🔄 Auto" if not action.requires_manual_review else "👀 Manual"
            body_parts.append(
                f"{i}. [{auto}] {action.description} (risk: {action.risk_level.value})\n"
            )

    body_parts.append("\n---\n*Generated by MyCodeXvantaOS CI Repair Agent*")
    pr_body = "\n".join(body_parts)

    # Summary
    summary_parts = [
        f"Run #{run_id}: {len(analyses)} failure(s), {len(all_actions)} action(s)",
    ]
    if can_auto_fix and not has_critical:
        summary_parts.append("Auto-fix available")
    else:
        summary_parts.append("Manual review required")

    return RepairPlan(
        run_id=run_id,
        run_name=run_name,
        branch=branch,
        analyses=analyses,
        actions=all_actions,
        branch_name=branch_name,
        pr_title=pr_title,
        pr_body=pr_body,
        can_auto_fix=can_auto_fix and not has_critical,
        summary="; ".join(summary_parts),
    )
