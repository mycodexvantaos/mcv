"""
Conflict Detector — Find explicit memory conflicts

Strategy: Detect explicit `conflicts_with` relationships
"""


from mycodexvantaos_memory_dream.models import MemoryItem


def detect_conflicts(
    memory_items: list[MemoryItem],
) -> list[tuple[str, str, str]]:
    """
    Detect explicit conflicts between memory items

    Args:
        memory_items: List of memory items to analyze

    Returns:
        List of tuples: (mem1_id, mem2_id, reason)
        where reason explains the conflict
    """
    conflicts: list[tuple[str, str, str]] = []

    # Build ID-to-memory map
    memory_map: dict[str, MemoryItem] = {m.memory_id: m for m in memory_items}

    # Check each memory's conflicts_with list
    for memory in memory_items:
        for conflict_id in memory.conflicts_with:

            # Normalize conflict ID
            if not conflict_id.startswith("urn:"):
                conflict_id = f"urn:mycodexvantaos:memory:{conflict_id}"

            # Check if conflict target exists
            if conflict_id in memory_map:
                mem1_id = memory.memory_id
                mem2_id = conflict_id

                # Avoid duplicates (only report once per pair)
                if _is_duplicate_pair(conflicts, mem1_id, mem2_id):
                    continue

                reason = _build_conflict_reason(memory, memory_map[mem2_id])
                conflicts.append((mem1_id, mem2_id, reason))

    return conflicts


def _is_duplicate_pair(
    conflicts: list[tuple[str, str, str]],
    id1: str,
    id2: str,
) -> bool:
    """
    Check if this pair is already reported
    """
    for existing_id1, existing_id2, _ in conflicts:
        if (existing_id1 == id1 and existing_id2 == id2) or (
            existing_id1 == id2 and existing_id2 == id1
        ):
            return True
    return False


def _build_conflict_reason(mem1: MemoryItem, mem2: MemoryItem) -> str:
    """
    Build human-readable conflict reason
    """
    reason_parts = [
        f"Memory '{mem1.memory_id}' conflicts with '{mem2.memory_id}'",
    ]

    # Add content comparison
    if mem1.content and mem2.content:
        if len(mem1.content) + len(mem2.content) < 200:
            reason_parts.append(f"  - {mem1.content}")
            reason_parts.append("  vs")
            reason_parts.append(f"  - {mem2.content}")

    # Add type info
    if mem1.memory_type != mem2.memory_type:
        reason_parts.append(
            f"  - Type conflict: {mem1.memory_type.value} vs {mem2.memory_type.value}"
        )

    # Tag conflict
    common_tags = set(mem1.tags) & set(mem2.tags)
    if common_tags:
        reason_parts.append(f"  - Shared tags: {', '.join(common_tags)}")

    return "\n".join(reason_parts)