"""
Orphan Detector — Find orphan related_entity references

Strategy: Identify entities in related_entities that don't exist as memory items
"""


from mycodexvantaos_memory_dream.models import MemoryItem


def detect_orphans(
    memory_items: list[MemoryItem],
) -> list[tuple[str, list[str]]]:
    """
    Detect orphan related_entity references

    Args:
        memory_items: List of memory items to analyze

    Returns:
        List of tuples: (entity_id, [list of memory IDs that reference it])
    """
    if not memory_items:
        return []

    # Collect all memory IDs and entity references
    memory_ids = {m.memory_id for m in memory_items}
    entity_to_memories: dict[str, list[str]] = {}

    # Normalize entity IDs to URN format
    for memory in memory_items:
        for entity_id in memory.related_entities:
            # Normalize
            normalized_id = (
                entity_id
                if entity_id.startswith("urn:")
                else f"urn:mycodexvantaos:entity:{entity_id}"
            )

            if normalized_id not in entity_to_memories:
                entity_to_memories[normalized_id] = []

            entity_to_memories[normalized_id].append(memory.memory_id)

    # Find orphans (entities that don't exist as memory IDs)
    orphans = [
        (entity_id, mem_ids)
        for entity_id, mem_ids in entity_to_memories.items()
        if entity_id not in memory_ids
    ]

    return orphans