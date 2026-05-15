"""
Knowledge Pipeline data models
Matches contracts/schemas/knowledge-model.schema.json
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class DocumentInput(BaseModel):
    """Input document for processing"""

    document_id: str
    filename: str
    content_type: str
    content: str
    metadata: dict[str, object] = Field(default_factory=dict)


class ParsedDocument(BaseModel):
    """Parsed document with extracted chunks"""

    document_id: str
    chunks: list[str] = Field(default_factory=list)
    metadata: dict[str, object] = Field(default_factory=dict)


class EmbeddingResult(BaseModel):
    """Embedding generation result"""

    document_id: str
    chunk_ids: list[str]
    embeddings: list[list[float]] = Field(default_factory=list)
    model: str = "text-embedding-3-small"
    total_tokens: int = 0


class ClusterResult(BaseModel):
    """Semantic clustering result"""

    clusters: list[dict[str, object]] = Field(default_factory=list)
    total_documents: int = 0
    total_clusters: int = 0
