/**
 * @module service-memory-dream
 * @description Memory Dream Service — Orchestrates Python dream-worker via child process.
 *
 * This service implements the TS side of Loop 5 (Memory Dream Runtime).
 * It spawns the Python dream-worker as a child process and returns the
 * dream report as structured data.
 *
 * Fallback: If Python is unavailable, uses a built-in JS dream engine
 * for basic duplicate/orphan detection.
 *
 * Contracts:
 *   - contracts/schemas/dream-run.schema.json
 *   - contracts/schemas/dream-report.schema.json
 *   - contracts/schemas/dream-action.schema.json
 *   - contracts/schemas/memory-item.schema.json
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

// ─── Types ────────────────────────────────────────────────────────

export interface MemoryItem {
  memory_id: string;
  content: string;
  tags?: string[];
  related_entities?: string[];
  temporal_expressions?: string[];
  memory_type?:
    'observation' | 'reflection' | 'decision' | 'event' | 'fact' | 'opinion' | 'plan' | 'system';
  conflicts_with?: string[];
  created_at?: string;
  metadata?: Record<string, unknown>;
}

export type DreamActionType =
  'merge' | 'resolve' | 'mark_orphan' | 'delete' | 'tag_add' | 'tag_remove' | 'no_action';

export interface DreamAction {
  action_type: DreamActionType;
  target_memory_id: string;
  related_memory_id?: string | null;
  reason: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface DreamReport {
  dream_run_id: string;
  processed_at: string;
  total_memories: number;
  duplicates_found: number;
  conflicts_found: number;
  orphans_found: number;
  actions: DreamAction[];
  statistics: Record<string, unknown>;
}

export interface DreamRunRecord {
  runId: string;
  mode: 'dry-run' | 'proposal' | 'execute';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  memoryItems: MemoryItem[];
  report?: DreamReport;
  hash: string;
}

export interface CreateDreamRunRequest {
  mode?: 'dry-run' | 'proposal' | 'execute';
  memory_items?: MemoryItem[];
}

export interface CreateDreamRunResponse {
  run: DreamRunRecord;
}

export interface GetDreamRunResponse {
  run: DreamRunRecord;
}

export interface ListDreamRunsResponse {
  runs: DreamRunRecord[];
  total: number;
}

// ─── In-memory storage (MVP) ──────────────────────────────────────

const dreamRuns = new Map<string, DreamRunRecord>();

// ─── Python worker path detection ─────────────────────────────────

let _pythonWorkerPath: string | null = null;

function getPythonWorkerPath(): string | null {
  if (_pythonWorkerPath !== null) return _pythonWorkerPath;

  // Try multiple possible locations relative to CWD
  const candidates = [
    resolve(process.cwd(), 'python/apps/dream-worker/main.py'),
    resolve(process.cwd(), '../python/apps/dream-worker/main.py'),
    resolve(process.cwd(), '../../python/apps/dream-worker/main.py'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      _pythonWorkerPath = candidate;
      return _pythonWorkerPath;
    }
  }

  _pythonWorkerPath = ''; // Cache the miss
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

function computeHash(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// ─── Python worker execution ──────────────────────────────────────

/**
 * Execute the Python dream-worker via child process.
 * Falls back to JS engine if Python is unavailable.
 */
export async function executePythonDreamWorker(
  memoryItems: MemoryItem[],
  mode: 'dry-run' | 'proposal' | 'execute'
): Promise<DreamReport> {
  const dryRun = mode === 'dry-run' || mode === 'proposal';
  const proposalMode = mode === 'dry-run' || mode === 'proposal';

  return new Promise<DreamReport>((resolvePromise, reject) => {
    const workerPath = getPythonWorkerPath();

    // If Python worker not found, fall back to JS engine immediately
    if (!workerPath) {
      const report = executeJsDreamEngine(memoryItems, dryRun, proposalMode);
      resolvePromise(report);
      return;
    }

    const args = [workerPath, 'run', '--stdin', '--json', '--mode', mode];

    const proc = spawn('python3', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30_000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      // Python not available — fall back to JS engine
      const report = executeJsDreamEngine(memoryItems, dryRun, proposalMode);
      resolvePromise(report);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        // Python failed — fall back to JS engine
        const report = executeJsDreamEngine(memoryItems, dryRun, proposalMode);
        resolvePromise(report);
        return;
      }

      try {
        const report = JSON.parse(stdout) as DreamReport;
        resolvePromise(report);
      } catch {
        // Parse error — fall back to JS engine
        const report = executeJsDreamEngine(memoryItems, dryRun, proposalMode);
        resolvePromise(report);
      }
    });

    // Send memory items via stdin
    try {
      proc.stdin.write(JSON.stringify(memoryItems));
      proc.stdin.end();
    } catch {
      // stdin write failed — fall back to JS engine
      const report = executeJsDreamEngine(memoryItems, dryRun, proposalMode);
      resolvePromise(report);
    }
  });
}

// ─── Built-in JS Dream Engine (fallback) ──────────────────────────

/**
 * Basic JS dream engine for when Python is unavailable.
 * Detects duplicates (content similarity) and orphan entities.
 */
export function executeJsDreamEngine(
  memoryItems: MemoryItem[],
  dryRun: boolean,
  proposalMode: boolean
): DreamReport {
  const actions: DreamAction[] = [];

  // ─── Duplicate detection (content-based) ──────────────────────
  const contentMap = new Map<string, MemoryItem[]>();
  for (const item of memoryItems) {
    const key = item.content.toLowerCase().trim();
    const group = contentMap.get(key) ?? [];
    group.push(item);
    contentMap.set(key, group);
  }

  let duplicatesFound = 0;
  for (const [, group] of contentMap) {
    if (group.length > 1) {
      duplicatesFound++;
      const primary = group[0];
      for (let i = 1; i < group.length; i++) {
        actions.push({
          action_type: 'merge',
          target_memory_id: group[i].memory_id,
          related_memory_id: primary.memory_id,
          reason: `Duplicate of ${primary.memory_id} (content similarity > 0.95)`,
          confidence: 0.95,
        });
      }
    }
  }

  // ─── Orphan detection ─────────────────────────────────────────
  const memoryIds = new Set(memoryItems.map((m) => m.memory_id));
  const entityRefCounts = new Map<string, string[]>();

  for (const item of memoryItems) {
    for (const entityId of item.related_entities ?? []) {
      const refs = entityRefCounts.get(entityId) ?? [];
      refs.push(item.memory_id);
      entityRefCounts.set(entityId, refs);
    }
  }

  let orphansFound = 0;
  for (const [entityId, referringMemoryIds] of entityRefCounts) {
    if (!memoryIds.has(entityId)) {
      orphansFound++;
      for (const memId of referringMemoryIds) {
        actions.push({
          action_type: 'mark_orphan',
          target_memory_id: memId,
          reason: `Contains orphan entity: ${entityId}`,
          confidence: 0.8,
          metadata: { orphan_entity_id: entityId },
        });
      }
    }
  }

  // ─── Conflict detection (explicit conflicts_with) ─────────────
  let conflictsFound = 0;
  const reportedConflicts = new Set<string>();

  for (const item of memoryItems) {
    for (const conflictId of item.conflicts_with ?? []) {
      const pairKey = [item.memory_id, conflictId].sort().join('::');
      if (!reportedConflicts.has(pairKey) && memoryIds.has(conflictId)) {
        reportedConflicts.add(pairKey);
        conflictsFound++;
        actions.push({
          action_type: 'resolve',
          target_memory_id: item.memory_id,
          related_memory_id: conflictId,
          reason: `Memory '${item.memory_id}' conflicts with '${conflictId}'`,
          confidence: 0.9,
        });
      }
    }
  }

  // ─── Statistics ────────────────────────────────────────────────
  const memoryTypes: Record<string, number> = {};
  for (const item of memoryItems) {
    const type = item.memory_type ?? 'observation';
    memoryTypes[type] = (memoryTypes[type] ?? 0) + 1;
  }

  const report: DreamReport = {
    dream_run_id: `dream_js_${Date.now()}`,
    processed_at: new Date().toISOString(),
    total_memories: memoryItems.length,
    duplicates_found: duplicatesFound,
    conflicts_found: conflictsFound,
    orphans_found: orphansFound,
    actions,
    statistics: {
      memory_types: memoryTypes,
      avg_tags_per_memory:
        memoryItems.length > 0
          ? memoryItems.reduce((sum, m) => sum + (m.tags?.length ?? 0), 0) / memoryItems.length
          : 0,
      avg_entities_per_memory:
        memoryItems.length > 0
          ? memoryItems.reduce((sum, m) => sum + (m.related_entities?.length ?? 0), 0) /
            memoryItems.length
          : 0,
      dry_run: dryRun,
      proposal_mode: proposalMode,
      engine: 'js-fallback',
    },
  };

  return report;
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Create and execute a dream run
 */
export async function createDreamRun(
  request: CreateDreamRunRequest
): Promise<CreateDreamRunResponse> {
  const mode = request.mode ?? 'dry-run';
  const memoryItems = request.memory_items ?? [];
  const runId = generateId('dream');

  const run: DreamRunRecord = {
    runId,
    mode,
    status: 'running',
    startedAt: new Date().toISOString(),
    memoryItems,
    hash: computeHash({ runId, mode, memoryItems }),
  };

  dreamRuns.set(runId, run);

  try {
    // Try Python first, fall back to JS engine
    const report = await executePythonDreamWorker(memoryItems, mode);

    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    run.report = report;
    run.hash = computeHash({ runId, mode, report });
  } catch {
    // Should not reach here (errors handled in executePythonDreamWorker)
    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    run.report = executeJsDreamEngine(
      memoryItems,
      mode === 'dry-run' || mode === 'proposal',
      mode === 'dry-run' || mode === 'proposal'
    );
  }

  return { run };
}

/**
 * Create a dream run using only the JS engine (no Python dependency)
 */
export function createDreamRunSync(request: CreateDreamRunRequest): CreateDreamRunResponse {
  const mode = request.mode ?? 'dry-run';
  const memoryItems = request.memory_items ?? [];
  const runId = generateId('dream');

  const dryRun = mode === 'dry-run' || mode === 'proposal';
  const proposalMode = mode === 'dry-run' || mode === 'proposal';

  const report = executeJsDreamEngine(memoryItems, dryRun, proposalMode);

  const run: DreamRunRecord = {
    runId,
    mode,
    status: 'completed',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    memoryItems,
    report,
    hash: computeHash({ runId, mode, report }),
  };

  dreamRuns.set(runId, run);
  return { run };
}

/**
 * Get a dream run by ID
 */
export function getDreamRun(runId: string): GetDreamRunResponse | null {
  const run = dreamRuns.get(runId);
  if (!run) return null;
  return { run };
}

/**
 * List all dream runs
 */
export function listDreamRuns(): ListDreamRunsResponse {
  const runs = Array.from(dreamRuns.values());
  return { runs, total: runs.length };
}

/**
 * Get dream run statistics
 */
export function getDreamStats(): {
  totalRuns: number;
  byStatus: Record<string, number>;
  byMode: Record<string, number>;
} {
  const runs = Array.from(dreamRuns.values());
  const byStatus: Record<string, number> = {};
  const byMode: Record<string, number> = {};

  for (const run of runs) {
    byStatus[run.status] = (byStatus[run.status] ?? 0) + 1;
    byMode[run.mode] = (byMode[run.mode] ?? 0) + 1;
  }

  return { totalRuns: runs.length, byStatus, byMode };
}

/**
 * Clear all dream runs (for testing)
 */
export function clearAll(): void {
  dreamRuns.clear();
}
