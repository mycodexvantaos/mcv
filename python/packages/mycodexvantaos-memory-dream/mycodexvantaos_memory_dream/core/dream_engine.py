"""
Core Dream Engine — Orchestrate memory processing
"""

from datetime import datetime

from mycodexvantaos_memory_dream.detectors import (
    detect_conflicts,
    detect_duplicates,
    detect_orphans,
)
from mycodexvantaos_memory_dream.models import (
    DreamAction,
    DreamActionType,
    DreamReport,
    DreamRun,
    MemoryItem,
)


class DreamEngine:
    """
    Main dream processing engine

    Orchestrates detectors and generates dream reports.
    """

    def __init__(self) -> None:
        self.dream_runs: list[DreamRun] = []

    def execute_dream(self, dream_run: DreamRun) -> DreamReport:
        """
        Execute a dream run

        Args:
            dream_run: The dream run configuration

        Returns:
            Dream report with detected issues and suggested actions
        """
        self.dream_runs.append(dream_run)

        # Run all detectors
        duplicate_groups = detect_duplicates(dream_run.memory_items)
        conflict_pairs = detect_conflicts(dream_run.memory_items)
        orphan_entities = detect_orphans(dream_run.memory_items)

        # Generate actions
        actions: list[DreamAction] = []

        # Merge actions for duplicates
        for group in duplicate_groups:
            if len(group) > 1:
                primary = group[0]
                for duplicate in group[1:]:
                    actions.append(
                        DreamAction(
                            action_type=DreamActionType.MERGE,
                            target_memory_id=duplicate.memory_id,
                            related_memory_id=primary.memory_id,
                            reason=f"Duplicate of {primary.memory_id} (similarity > 0.95)",
                            confidence=0.95,
                        )
                    )

        # Resolve actions for conflicts
        for mem1_id, mem2_id, reason in conflict_pairs:
            actions.append(
                DreamAction(
                    action_type=DreamActionType.RESOLVE,
                    target_memory_id=mem1_id,
                    related_memory_id=mem2_id,
                    reason=f"Conflict: {reason}",
                    confidence=0.9,
                )
            )

        # Mark orphan actions
        for entity_id, referring_memory_ids in orphan_entities:
            # Mark all memories with this entity as having orphan entity
            for mem_id in referring_memory_ids:
                actions.append(
                    DreamAction(
                        action_type=DreamActionType.MARK_ORPHAN,
                        target_memory_id=mem_id,
                        reason=f"Contains orphan entity: {entity_id}",
                        metadata={"orphan_entity_id": entity_id},
                        confidence=0.8,
                    )
                )

        # Build report
        report = DreamReport(
            dream_run_id=dream_run.dream_run_id,
            processed_at=datetime.utcnow(),
            total_memories=len(dream_run.memory_items),
            duplicates_found=len(duplicate_groups),
            conflicts_found=len(conflict_pairs),
            orphans_found=len(orphan_entities),
            actions=actions,
            statistics={
                "memory_types": _count_by_type(dream_run.memory_items),
                "avg_tags_per_memory": _avg_tags(dream_run.memory_items),
                "avg_entities_per_memory": _avg_entities(dream_run.memory_items),
                "dry_run": dream_run.dry_run,
                "proposal_mode": dream_run.proposal_mode,
            },
        )

        # Execute actions if not dry-run
        if not dream_run.dry_run and actions:
            self._execute_actions(actions)

        return report

    def _execute_actions(self, actions: list[DreamAction]) -> None:
        """
        Execute dream actions

        In production, this would update the database.
        For now, we just log.
        """
        executed: list[str] = []
        for action in actions:
            if action.action_type == DreamActionType.MERGE:
                executed.append(f"Merge {action.target_memory_id} into {action.related_memory_id}")
            elif action.action_type == DreamActionType.RESOLVE:
                executed.append(
                    f"Resolve conflict between {action.target_memory_id} and {action.related_memory_id}"
                )
            elif action.action_type == DreamActionType.MARK_ORPHAN:
                executed.append(
                    f"Mark orphan in {action.target_memory_id}: {action.metadata.get('orphan_entity_id')}"
                )
            elif action.action_type == DreamActionType.DELETE:
                executed.append(f"Delete {action.target_memory_id}")
            else:
                executed.append(f"{action.action_type} on {action.target_memory_id}")

        if executed:
            print(f"[Dream Action Execution] {len(executed)} actions executed:")
            for e in executed[:10]:  # Log first 10
                print(f"  - {e}")


def _count_by_type(memories: list[MemoryItem]) -> dict[str, int]:
    """Count memories by type"""
    counts: dict[str, int] = {}
    for m in memories:
        counts[m.memory_type.value] = counts.get(m.memory_type.value, 0) + 1
    return counts


def _avg_tags(memories: list[MemoryItem]) -> float:
    """Calculate average tags per memory"""
    if not memories:
        return 0.0
    return sum(len(m.tags) for m in memories) / len(memories)


def _avg_entities(memories: list[MemoryItem]) -> float:
    """Calculate average entities per memory"""
    if not memories:
        return 0.0
    return sum(len(m.related_entities) for m in memories) / len(memories)
