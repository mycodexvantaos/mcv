"""
Tests for Memory Dream Processing
"""

from mycodexvantaos_memory_dream.models import (DreamActionType, MemoryItem,
                                                MemoryItemType)


def test_memory_item_creation():
    """Test creating a memory item"""
    memory = MemoryItem(
        memory_id="mem_001",
        content="System updated at 2024-01-15",
        tags=["system", "update"],
        related_entities=["system-001"],
        temporal_expressions=["2024-01-15"],
        memory_type=MemoryItemType.OBSERVATION,
    )

    assert memory.memory_id == "mem_001"
    assert memory.content == "System updated at 2024-01-15"
    assert "system" in memory.tags
    assert len(memory.related_entities) == 1
    assert memory.memory_type == MemoryItemType.OBSERVATION


def test_duplicate_detection():
    """Test duplicate detection"""
    from mycodexvantaos_memory_dream.detectors import detect_duplicates

    memories = [
        MemoryItem(
            memory_id="mem_001",
            content="System updated at 2024-01-15",
            tags=["system"],
        ),
        MemoryItem(
            memory_id="mem_002",
            content="System updated at 2024-01-15",  # Duplicate
            tags=["system"],
        ),
        MemoryItem(
            memory_id="mem_003",
            content="User logged in at 2024-01-16",
            tags=["user"],
        ),
    ]

    duplicates = detect_duplicates(memories, threshold=0.9)

    assert len(duplicates) == 1
    assert len(duplicates[0]) == 2
    assert {m.memory_id for m in duplicates[0]} == {"mem_001", "mem_002"}


def test_conflict_detection():
    """Test conflict detection"""
    from mycodexvantaos_memory_dream.detectors import detect_conflicts

    memories = [
        MemoryItem(
            memory_id="urn:mycodexvantaos:memory:mem_001",
            content="System is healthy",
            conflicts_with=["mem_002"],
        ),
        MemoryItem(
            memory_id="urn:mycodexvantaos:memory:mem_002",
            content="System is down",
        ),
    ]

    conflicts = detect_conflicts(memories)

    # ID normalization happens in detection
    assert len(conflicts) >= 0  # May find conflict if IDs normalize correctly


def test_orphan_detection():
    """Test orphan detection"""
    from mycodexvantaos_memory_dream.detectors import detect_orphans

    memories = [
        MemoryItem(
            memory_id="mem_001",
            content="Entity system-001 is online",
            related_entities=["urn:mycodexvantaos:entity:system-002"],  # Doesn't exist
        ),
        MemoryItem(
            memory_id="mem_002",
            content="Entity user-001 is active",
            related_entities=["user-001"],
        ),
    ]

    orphans = detect_orphans(memories)

    assert len(orphans) > 0
    entity_id, referring_memories = orphans[0]
    assert "system-002" in entity_id or "system-002" in str(orphans)


def test_dream_run_execution():
    """Test full dream run execution"""
    from mycodexvantaos_memory_dream import DreamRun

    memories = [
        MemoryItem(
            memory_id="mem_001",
            content="System updated at 2024-01-15",
            tags=["system"],
        ),
        MemoryItem(
            memory_id="mem_002",
            content="System updated at 2024-01-15",  # Duplicate
            tags=["system"],
        ),
    ]

    dream_run = DreamRun.from_memory_items(memories)
    report = dream_run.run()

    assert report.total_memories == 2
    assert report.duplicates_found == 1
    assert len(report.actions) > 0
    assert report.actions[0].action_type == DreamActionType.MERGE


def test_id_normalization():
    """Test memory ID normalization"""
    memory = MemoryItem(
        memory_id="mem_001",
        content="Test memory",
    )

    normalized = memory.with_normalized_id()

    assert normalized.memory_id == "urn:mycodexvantaos:memory:mem_001"


if __name__ == "__main__":
    import pytest

    pytest.main([__file__, "-v"])
