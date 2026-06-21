"""
Data models for Memory Dream Processing

All models map to TypeScript contracts:
- contracts/schemas/memory-item.schema.json
- contracts/schemas/dream-run.schema.json
- contracts/schemas/dream-action.schema.json
- contracts/schemas/dream-report.schema.json
"""

from datetime import datetime
from enum import Enum
from typing import Any, Self

from pydantic import BaseModel, Field, field_validator, model_validator


class MemoryItemType(str, Enum):
    """Memory item types"""

    OBSERVATION = "observation"
    REFLECTION = "reflection"
    DECISION = "decision"
    EVENT = "event"
    FACT = "fact"
    OPINION = "opinion"
    PLAN = "plan"
    SYSTEM = "system"


class DreamActionType(str, Enum):
    """Dream action types for resolving issues"""

    MERGE = "merge"
    RESOLVE = "resolve"
    MARK_ORPHAN = "mark_orphan"
    DELETE = "delete"
    TAG_ADD = "tag_add"
    TAG_REMOVE = "tag_remove"
    NO_ACTION = "no_action"


class MemoryItem(BaseModel):
    """
    Single memory item

    Matches: contracts/schemas/memory-item.schema.json
    """

    memory_id: str = Field(..., description="Unique memory identifier")
    content: str = Field(..., description="Memory content text")
    tags: list[str] = Field(default_factory=list, description="Associated tags")
    related_entities: list[str] = Field(default_factory=list, description="Referenced entity IDs")
    temporal_expressions: list[str] = Field(
        default_factory=list, description="Temporal references extracted from content"
    )
    memory_type: MemoryItemType = Field(
        default=MemoryItemType.OBSERVATION, description="Type of memory"
    )
    conflicts_with: list[str] = Field(
        default_factory=list, description="IDs of memories this explicitly conflicts with"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator("memory_id")
    @classmethod
    def validate_memory_id(cls, v: str) -> str:
        if not v.startswith("mem_") and not v.startswith("urn:mycodexvantaos:memory:"):
            raise ValueError(
                f"memory_id must start with 'mem_' or 'urn:mycodexvantaos:memory:', got: {v}"
            )
        return v

    def with_normalized_id(self) -> Self:
        """Ensure ID follows URN format"""
        if not self.memory_id.startswith("urn:"):
            return self.model_copy(
                update={"memory_id": f"urn:mycodexvantaos:memory:{self.memory_id}"}
            )
        return self


class DreamAction(BaseModel):
    """
    Suggested action to resolve a memory issue

    Matches: contracts/schemas/dream-action.schema.json
    """

    action_type: DreamActionType = Field(..., description="Type of action to take")
    target_memory_id: str = Field(..., description="Memory ID this action targets")
    related_memory_id: str | None = Field(
        default=None, description="Optional related memory (for merge/resolve)"
    )
    reason: str = Field(..., description="Why this action is suggested")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score (0-1)")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional data")


class DreamReport(BaseModel):
    """
    Dream processing report

    Matches: contracts/schemas/dream-report.schema.json
    """

    dream_run_id: str = Field(..., description="Dream run identifier")
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    total_memories: int = Field(..., description="Total memories processed")
    duplicates_found: int = Field(default=0, description="Number of duplicates detected")
    conflicts_found: int = Field(default=0, description="Number of conflicts detected")
    orphans_found: int = Field(default=0, description="Number of orphans detected")
    actions: list[DreamAction] = Field(default_factory=list, description="Suggested actions")
    statistics: dict[str, Any] = Field(default_factory=dict, description="Additional statistics")

    @model_validator(mode="after")
    def validate_counts(self) -> Self:
        """Ensure action counts match found issues"""

        # Allow flexibility (not every detected issue needs action)
        return self


class DreamRun(BaseModel):
    """
    Dream run configuration and execution

    Matches: contracts/schemas/dream-run.schema.json
    """

    dream_run_id: str = Field(..., description="Unique dream run identifier")
    memory_items: list[MemoryItem] = Field(..., description="Memory items to process")
    dry_run: bool = Field(
        default=True, description="If True, only report actions without executing"
    )
    proposal_mode: bool = Field(
        default=True, description="If True, suggest actions but don't auto-apply"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def from_memory_items(cls, memory_items: list[MemoryItem]) -> Self:
        """Create a dream run from memory items with auto-generated ID"""
        import uuid

        # Normalize all IDs to URN format
        normalized_items = [m.with_normalized_id() for m in memory_items]

        return cls(
            dream_run_id=f"urn:mycodexvantaos:dream:{uuid.uuid4()}",
            memory_items=normalized_items,
        )

    def run(self) -> DreamReport:
        """Execute the dream run and return report"""
        from mycodexvantaos_memory_dream.core.dream_engine import DreamEngine

        engine = DreamEngine()
        return engine.execute_dream(self)
