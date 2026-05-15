"""
Vector Tools data models
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class VectorSearchQuery(BaseModel):
    """Vector similarity search query"""

    query_vector: list[float]
    top_k: int = 10
    filter: dict[str, object] | None = None
    namespace: str | None = None


class VectorSearchResult(BaseModel):
    """Vector similarity search result"""

    id: str
    score: float
    metadata: dict[str, object] = Field(default_factory=dict)
    content: str | None = None


class RerankResult(BaseModel):
    """Reranked search results"""

    results: list[VectorSearchResult]
    original_count: int = 0
    reranked_count: int = 0
    model: str = "default"
