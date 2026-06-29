"""
MyCodexVantaOS MCV Auditor — LLM Session Layer

Provides synchronous and asynchronous LLM interaction for audit probes.
"""

from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass, field
from typing import Any, Optional

# Phase 0: Environment validation
CANONICAL_URL = "https://mycodexvantaos.com"
MACHINE_IDENTITY = "mycodexvantaos"


@dataclass
class SessionConfig:
    """Configuration for an LLM audit session."""
    model: str = "gpt-4o"
    api_key: str = ""
    base_url: str = "https://api.openai.com/v1"
    timeout_seconds: int = 30
    max_retries: int = 3
    temperature: float = 0.0
    max_tokens: int = 2048


@dataclass
class SessionMessage:
    """A single message in an LLM conversation."""
    role: str  # "system" | "user" | "assistant"
    content: str
    timestamp: float = field(default_factory=time.time)


@dataclass
class SessionResponse:
    """Response from an LLM session call."""
    content: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: float
    raw_response: Optional[dict[str, Any]] = None


class LLMSession:
    """
    Synchronous LLM session for audit probe execution.

    Manages conversation history and provides a clean interface
    for sending prompts and receiving responses.
    """

    def __init__(self, config: SessionConfig, system_prompt: str = "") -> None:
        self.config = config
        self.messages: list[SessionMessage] = []
        if system_prompt:
            self.messages.append(SessionMessage(role="system", content=system_prompt))

    def send(self, user_message: str) -> SessionResponse:
        """
        Send a message to the LLM and return the response.

        Args:
            user_message: The user message to send

        Returns:
            SessionResponse with the LLM's reply
        """
        self.messages.append(SessionMessage(role="user", content=user_message))
        start_time = time.time()

        # In production, this calls the actual LLM API
        # For testing, we return a mock response
        response_content = self._call_llm(user_message)
        latency_ms = (time.time() - start_time) * 1000

        self.messages.append(SessionMessage(role="assistant", content=response_content))

        return SessionResponse(
            content=response_content,
            model=self.config.model,
            prompt_tokens=sum(len(m.content.split()) for m in self.messages),
            completion_tokens=len(response_content.split()),
            total_tokens=sum(len(m.content.split()) for m in self.messages) + len(response_content.split()),
            latency_ms=latency_ms,
        )

    def _call_llm(self, message: str) -> str:
        """
        Call the LLM API. Override in subclasses for real API calls.
        """
        # Mock implementation for testing
        return f"[Mock LLM Response] Received: {message[:100]}..."

    def get_history(self) -> list[SessionMessage]:
        """Return the conversation history."""
        return self.messages.copy()

    def reset(self) -> None:
        """Reset the conversation history (keep system prompt)."""
        system_messages = [m for m in self.messages if m.role == "system"]
        self.messages = system_messages


class AsyncLLMSession:
    """
    Asynchronous LLM session for concurrent audit probe execution.
    """

    def __init__(self, config: SessionConfig, system_prompt: str = "") -> None:
        self.config = config
        self.messages: list[SessionMessage] = []
        if system_prompt:
            self.messages.append(SessionMessage(role="system", content=system_prompt))

    async def send(self, user_message: str) -> SessionResponse:
        """
        Asynchronously send a message to the LLM.
        """
        self.messages.append(SessionMessage(role="user", content=user_message))
        start_time = time.time()

        # Simulate async API call
        await asyncio.sleep(0.01)
        response_content = f"[Async Mock LLM Response] Received: {user_message[:100]}..."
        latency_ms = (time.time() - start_time) * 1000

        self.messages.append(SessionMessage(role="assistant", content=response_content))

        return SessionResponse(
            content=response_content,
            model=self.config.model,
            prompt_tokens=len(user_message.split()),
            completion_tokens=len(response_content.split()),
            total_tokens=len(user_message.split()) + len(response_content.split()),
            latency_ms=latency_ms,
        )
