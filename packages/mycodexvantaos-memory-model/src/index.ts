/**
 * @mycodexvantaos/mycodexvantaos-memory-model
 * Memory model - memory item, candidate, relation, conflict, dream run, dream action, dream report
 */

export type MemoryStatus =
  | 'candidate'
  | 'active'
  | 'reinforced'
  | 'merged'
  | 'deprecated'
  | 'orphaned'
  | 'archived'
  | 'rejected';

export type ActiveMemoryStatus = 'active' | 'reinforced';

export type PassiveMemoryStatus =
  'candidate' | 'merged' | 'deprecated' | 'orphaned' | 'archived' | 'rejected';

export interface MemoryItem {
  memoryId: string;
  content: string;
  tags: string[];
  relatedEntities: string[];
  temporalExpressions: string[];
  memoryType:
    'observation' | 'reflection' | 'decision' | 'event' | 'fact' | 'opinion' | 'plan' | 'system';
  status: MemoryStatus;
  conflictsWith: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryCandidate {
  candidateId: string;
  content: string;
  source: string;
  tags: string[];
  status: 'candidate';
  promotedTo?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface MemoryRelation {
  relationId: string;
  fromMemoryId: string;
  toMemoryId: string;
  relationType: 'supports' | 'contradicts' | 'derived-from' | 'related-to' | 'temporal-successor';
  strength: number;
  createdAt: string;
}

export interface MemoryConflict {
  conflictId: string;
  memoryIds: string[];
  conflictType: 'factual' | 'temporal' | 'semantic';
  severity: 'low' | 'medium' | 'high';
  status: 'detected' | 'reviewing' | 'resolved';
  resolution?: string;
  detectedAt: string;
  resolvedAt?: string;
}

export interface MemoryDreamRun {
  dreamRunId: string;
  memoryItems: MemoryItem[];
  dryRun: boolean;
  proposalMode: boolean;
  autoApply: boolean;
  createdAt: string;
}

export interface MemoryDreamAction {
  actionType: 'merge' | 'resolve' | 'mark_orphan' | 'delete';
  targetMemoryId: string;
  relatedMemoryId?: string;
  reason: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryDreamReport {
  dreamRunId: string;
  processedAt: string;
  totalMemories: number;
  duplicatesFound: number;
  conflictsFound: number;
  orphansFound: number;
  actions: MemoryDreamAction[];
  statistics?: Record<string, unknown>;
}
