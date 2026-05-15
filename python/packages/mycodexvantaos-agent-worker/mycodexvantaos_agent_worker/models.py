"""
Agent Worker data models
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class AgentTask(BaseModel):
    """A task for the agent worker to execute"""

    task_id: str
    session_id: str
    prompt: str
    collection_ids: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    max_steps: int = 10
    metadata: dict[str, object] = Field(default_factory=dict)


class ToolInvocation(BaseModel):
    """Record of a tool invocation during agent execution"""

    tool_name: str
    arguments: dict[str, object] = Field(default_factory=dict)
    result: str | None = None
    error: str | None = None
    duration_ms: float = 0.0


class AgentResult(BaseModel):
    """Result from agent execution"""

    task_id: str
    session_id: str
    response: str
    tool_invocations: list[ToolInvocation] = Field(default_factory=list)
    total_tokens: int = 0
    evidence_level: str = "knowledge-assisted"
    metadata: dict[str, object] = Field(default_factory=dict)
