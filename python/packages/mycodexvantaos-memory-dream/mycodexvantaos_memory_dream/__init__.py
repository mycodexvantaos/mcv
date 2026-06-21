"""
MyCodeXvantaOS Memory Dream Processing Engine

Cross-language contract schemas:
- TypeScript: contracts/schemas/memory-item.schema.json
- Python: mycodexvantaos_memory_dream.models.MemoryItem
"""

from mycodexvantaos_memory_dream.core.dream_engine import DreamEngine
from mycodexvantaos_memory_dream.detectors.conflict_detector import \
    detect_conflicts
from mycodexvantaos_memory_dream.detectors.duplicate_detector import \
    detect_duplicates
from mycodexvantaos_memory_dream.detectors.orphan_detector import \
    detect_orphans
from mycodexvantaos_memory_dream.models import (DreamAction, DreamActionType,
                                                DreamReport, DreamRun,
                                                MemoryItem, MemoryItemType)

__version__ = "0.1.0"
__all__ = [
    # Models
    "MemoryItem",
    "MemoryItemType",
    "DreamRun",
    "DreamAction",
    "DreamActionType",
    "DreamReport",
    # Core
    "DreamEngine",
    # Detectors
    "detect_duplicates",
    "detect_conflicts",
    "detect_orphans",
]
