/**
 * Memory Dream Service Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDreamRunSync,
  getDreamRun,
  listDreamRuns,
  getDreamStats,
  clearAll,
  executeJsDreamEngine,
  type MemoryItem,
} from '../index.js';

describe('memory-dream service', () => {
  beforeEach(() => {
    clearAll();
  });

  // ─── JS Dream Engine ──────────────────────────────────────────

  describe('executeJsDreamEngine', () => {
    it('should detect duplicates by content', () => {
      const items: MemoryItem[] = [
        { memory_id: 'mem_001', content: 'System updated at 2024-01-15', tags: ['system'] },
        { memory_id: 'mem_002', content: 'System updated at 2024-01-15', tags: ['system'] },
        { memory_id: 'mem_003', content: 'User logged in', tags: ['user'] },
      ];

      const report = executeJsDreamEngine(items, true, true);

      assert.equal(report.total_memories, 3);
      assert.equal(report.duplicates_found, 1);
      assert.equal(report.actions.length, 1);
      assert.equal(report.actions[0].action_type, 'merge');
      assert.equal(report.actions[0].target_memory_id, 'mem_002');
      assert.equal(report.actions[0].related_memory_id, 'mem_001');
    });

    it('should detect orphan entities', () => {
      const items: MemoryItem[] = [
        {
          memory_id: 'mem_001',
          content: 'Entity system-001 is online',
          related_entities: ['urn:mycodexvantaos:entity:system-002'],
        },
        { memory_id: 'mem_002', content: 'User activity', related_entities: [] },
      ];

      const report = executeJsDreamEngine(items, true, true);

      assert.equal(report.orphans_found, 1);
      assert.ok(report.actions.some((a) => a.action_type === 'mark_orphan'));
    });

    it('should detect explicit conflicts', () => {
      const items: MemoryItem[] = [
        { memory_id: 'mem_001', content: 'System is healthy', conflicts_with: ['mem_002'] },
        { memory_id: 'mem_002', content: 'System is down' },
      ];

      const report = executeJsDreamEngine(items, true, true);

      assert.equal(report.conflicts_found, 1);
      assert.ok(report.actions.some((a) => a.action_type === 'resolve'));
    });

    it('should handle empty memory items', () => {
      const report = executeJsDreamEngine([], true, true);

      assert.equal(report.total_memories, 0);
      assert.equal(report.duplicates_found, 0);
      assert.equal(report.conflicts_found, 0);
      assert.equal(report.orphans_found, 0);
      assert.equal(report.actions.length, 0);
    });

    it('should include statistics', () => {
      const items: MemoryItem[] = [
        { memory_id: 'mem_001', content: 'Test', tags: ['a', 'b'], memory_type: 'observation' },
        { memory_id: 'mem_002', content: 'Test 2', tags: ['c'], memory_type: 'fact' },
      ];

      const report = executeJsDreamEngine(items, true, true);

      assert.ok(report.statistics.memory_types);
      assert.equal(report.statistics.avg_tags_per_memory, 1.5);
      assert.equal(report.statistics.engine, 'js-fallback');
    });

    it('should not report duplicate conflict pairs', () => {
      const items: MemoryItem[] = [
        { memory_id: 'mem_001', content: 'A', conflicts_with: ['mem_002'] },
        { memory_id: 'mem_002', content: 'B', conflicts_with: ['mem_001'] },
      ];

      const report = executeJsDreamEngine(items, true, true);

      // Should only report once despite both declaring conflicts
      assert.equal(report.conflicts_found, 1);
      assert.equal(report.actions.filter((a) => a.action_type === 'resolve').length, 1);
    });
  });

  // ─── createDreamRunSync ───────────────────────────────────────

  describe('createDreamRunSync', () => {
    it('should create a dream run with default mode', () => {
      const result = createDreamRunSync({});

      assert.ok(result.run.runId);
      assert.equal(result.run.mode, 'dry-run');
      assert.equal(result.run.status, 'completed');
      assert.ok(result.run.report);
    });

    it('should create a dream run with memory items', () => {
      const items: MemoryItem[] = [{ memory_id: 'mem_001', content: 'Test memory' }];

      const result = createDreamRunSync({ memory_items: items, mode: 'proposal' });

      assert.equal(result.run.mode, 'proposal');
      assert.equal(result.run.report!.total_memories, 1);
      assert.ok(result.run.completedAt);
      assert.ok(result.run.hash);
    });

    it('should create a dream run in execute mode', () => {
      const result = createDreamRunSync({ mode: 'execute' });

      assert.equal(result.run.mode, 'execute');
      assert.equal(result.run.report!.statistics.dry_run, false);
      assert.equal(result.run.report!.statistics.proposal_mode, false);
    });
  });

  // ─── getDreamRun ──────────────────────────────────────────────

  describe('getDreamRun', () => {
    it('should retrieve an existing dream run', () => {
      const created = createDreamRunSync({});
      const result = getDreamRun(created.run.runId);

      assert.ok(result);
      assert.equal(result.run.runId, created.run.runId);
    });

    it('should return null for non-existent run', () => {
      const result = getDreamRun('nonexistent');
      assert.equal(result, null);
    });
  });

  // ─── listDreamRuns ────────────────────────────────────────────

  describe('listDreamRuns', () => {
    it('should list all dream runs', () => {
      createDreamRunSync({ mode: 'dry-run' });
      createDreamRunSync({ mode: 'execute' });

      const result = listDreamRuns();

      assert.equal(result.total, 2);
      assert.equal(result.runs.length, 2);
    });
  });

  // ─── getDreamStats ────────────────────────────────────────────

  describe('getDreamStats', () => {
    it('should return stats', () => {
      createDreamRunSync({ mode: 'dry-run' });
      createDreamRunSync({ mode: 'execute' });

      const stats = getDreamStats();

      assert.equal(stats.totalRuns, 2);
      assert.equal(stats.byStatus.completed, 2);
      assert.equal(stats.byMode['dry-run'], 1);
      assert.equal(stats.byMode.execute, 1);
    });
  });

  // ──── Dream Safety Lifecycle ────────────────────────────────────────────

  describe('Dream Safety Lifecycle', () => {
    it('should default to dry-run mode (auto-apply disabled)', () => {
      const result = createDreamRunSync({});
      assert.equal(result.run.mode, 'dry-run');
      assert.equal(result.run.report!.statistics.dry_run, true);
      assert.equal(result.run.report!.statistics.proposal_mode, true);
    });

    it('should not auto-execute dream actions in dry-run mode', () => {
      const items: MemoryItem[] = [
        { memory_id: 'mem_001', content: 'A' },
        { memory_id: 'mem_002', content: 'A' },
      ];
      const result = createDreamRunSync({ memory_items: items });
      assert.equal(result.run.mode, 'dry-run');
      assert.equal(result.run.report!.duplicates_found, 1);
      assert.equal(result.run.report!.actions[0].action_type, 'merge');
      // Actions are proposed but not applied in dry-run mode
      assert.equal(result.run.report!.statistics.dry_run, true);
    });

    it('should require explicit mode for execution', () => {
      const result = createDreamRunSync({ mode: 'execute' });
      assert.equal(result.run.mode, 'execute');
      assert.equal(result.run.report!.statistics.dry_run, false);
    });

    it('should never produce delete actions from the JS engine', () => {
      const items: MemoryItem[] = [
        { memory_id: 'mem_001', content: 'Test content alpha' },
        { memory_id: 'mem_002', content: 'Test content beta', conflicts_with: ['mem_001'] },
      ];
      const report = executeJsDreamEngine(items, true, true);
      const deleteActions = report.actions.filter((a) => a.action_type === 'delete');
      assert.equal(
        deleteActions.length,
        0,
        'JS dream engine must never produce delete actions in MVP'
      );
    });

    it('should produce merge and resolve actions but not delete', () => {
      const items: MemoryItem[] = [
        { memory_id: 'mem_001', content: 'Duplicate entry' },
        { memory_id: 'mem_002', content: 'Duplicate entry' },
        { memory_id: 'mem_003', content: 'Conflicting', conflicts_with: ['mem_001'] },
      ];
      const report = executeJsDreamEngine(items, true, true);
      const actionTypes = new Set(report.actions.map((a) => a.action_type));
      assert.ok(actionTypes.has('merge'), 'Should detect duplicates as merge');
      assert.ok(actionTypes.has('resolve'), 'Should detect conflicts as resolve');
      assert.ok(!actionTypes.has('delete'), 'Must not produce delete actions');
    });

    it('should track dream run hash for integrity verification', () => {
      const result = createDreamRunSync({ mode: 'proposal' });
      assert.ok(result.run.hash, 'Dream run must have integrity hash');
      assert.equal(result.run.hash.length, 64, 'Hash should be SHA-256 (64 hex chars)');
    });

    it('should preserve dream run state for before/after tracking', () => {
      const items: MemoryItem[] = [{ memory_id: 'mem_001', content: 'State tracking test' }];
      const result = createDreamRunSync({ memory_items: items, mode: 'proposal' });
      // The run record is the "before" state for apply/rollback
      assert.ok(result.run.runId);
      assert.ok(result.run.startedAt);
      assert.ok(result.run.report);
      assert.equal(result.run.status, 'completed');
      // The report and run are available for before_json/after_json comparison
      assert.equal(result.run.memoryItems.length, 1);
      assert.equal(result.run.memoryItems[0].memory_id, 'mem_001');
    });

    it('should allow proposal mode as intermediate between dry-run and execute', () => {
      const result = createDreamRunSync({ mode: 'proposal' });
      assert.equal(result.run.mode, 'proposal');
      assert.equal(result.run.report!.statistics.proposal_mode, true);
      assert.equal(result.run.report!.statistics.dry_run, true);
    });
  });
});
