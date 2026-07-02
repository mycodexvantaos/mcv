"""MCV Auditor Core Module — MyCodexVantaOS v1.0.0

Exports the 5-phase deterministic audit functions and data classes.
Legacy class-based analyzers (PromptAnalyzer, ToolAnalyzer, GuardrailAnalyzer)
have been replaced by function-based phases in v1.0.0.
"""
from .session import LLMSession, AsyncLLMSession, SessionConfig, SessionResponse
from .analyzers import (
    # Data classes
    Finding,
    GuardrailProbe,
    GuardrailEvaluation,
    AuditPhaseResult,
    # Constants
    CANONICAL_URL,
    MACHINE_IDENTITY,
    FORBIDDEN_PROVIDER_DOMAINS,
    # Phase functions
    validate_environment,
    extract_system_prompts,
    analyze_domain_policy,
    analyze_secret_patterns,
    evaluate_guardrails,
    # Guardrail helpers
    default_guardrail_probes,
    evaluate_guardrail_probe,
    # Report aggregation
    aggregate_results,
    write_report,
)

__all__ = [
    # Session
    "LLMSession",
    "AsyncLLMSession",
    "SessionConfig",
    "SessionResponse",
    # Data classes
    "Finding",
    "GuardrailProbe",
    "GuardrailEvaluation",
    "AuditPhaseResult",
    # Constants
    "CANONICAL_URL",
    "MACHINE_IDENTITY",
    "FORBIDDEN_PROVIDER_DOMAINS",
    # Phase functions
    "validate_environment",
    "extract_system_prompts",
    "analyze_domain_policy",
    "analyze_secret_patterns",
    "evaluate_guardrails",
    # Guardrail helpers
    "default_guardrail_probes",
    "evaluate_guardrail_probe",
    # Report aggregation
    "aggregate_results",
    "write_report",
]
