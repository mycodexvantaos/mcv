"""
Duplicate Detector — Find duplicate memory items

Strategy: Content-based similarity detection

MVP: Simple text similarity (TF-IDF + Cosine)
Future: Embedding-based similarity via sentence-transformers
"""

from functools import lru_cache
from typing import Any

from mycodexvantaos_memory_dream.models import MemoryItem


@lru_cache(maxsize=1)
def _get_word_pattern(text: str) -> frozenset[str]:
    """
    Extract normalized word pattern for similarity comparison.

    MVP: Simple bag-of-words after lowercase + split
    Future: TF-IDF vectors
    """
    words = set(text.lower().split())
    # Remove very short words
    return frozenset(w for w in words if len(w) > 3)


def _jaccard_similarity(a: frozenset[Any], b: frozenset[Any]) -> float:
    """
    Calculate Jaccard similarity between two sets

    J(A, B) = |A ∩ B| / |A ∪ B|
    """
    union = a | b
    if not union:
        return 0.0
    intersection = a.intersection(b)
    return len(intersection) / len(union)


def detect_duplicates(
    memory_items: list[MemoryItem],
    threshold: float = 0.85,
) -> list[list[MemoryItem]]:
    """
    Detect duplicate memory items

    Args:
        memory_items: List of memory items to analyze
        threshold: Similarity threshold (0-1) for considering duplicates

    Returns:
        List of duplicate groups, where each group is a list of memory items
    """
    if not memory_items:
        return []

    # Extract word patterns for all memories
    patterns = {}
    for item in memory_items:
        patterns[item.memory_id] = _get_word_pattern(item.content)

    # Build similarity graph
    groups: list[list[MemoryItem]] = []
    visited = set()

    for item in memory_items:
        if item.memory_id in visited:
            continue

        # Find all similar items
        group = [item]
        visited.add(item.memory_id)

        for other in memory_items:
            if other.memory_id in visited:
                continue

            sim = _jaccard_similarity(patterns[item.memory_id], patterns[other.memory_id])

            if sim >= threshold:
                group.append(other)
                visited.add(other.memory_id)

        if len(group) > 1:
            # Sort by creation date (newest first)
            group.sort(key=lambda m: m.created_at, reverse=True)
            groups.append(group)

    return groups