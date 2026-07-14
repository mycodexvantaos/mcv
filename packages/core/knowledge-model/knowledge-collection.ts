/**
 * MyCodexVantaOS — Knowledge Collection Model
 */

import type { ResourceCondition } from '../shared';

export type CollectionPhase = 'creating' | 'empty' | 'indexing' | 'ready' | 'degraded' | 'deleted';
export type ChunkStrategy = 'fixed' | 'semantic' | 'sentence';

export interface KnowledgeCollectionSpec {
  name: string;
  description: string;
  embeddingModel: string;
  chunkStrategy: ChunkStrategy;
  language: string;
}

export interface FreshnessMetrics {
  avgDocumentAgeDays: number;
  staleDocumentCount: number;
  lastIngestedAt: string | null;
}

export interface KnowledgeCollectionStatus {
  phase: CollectionPhase;
  conditions: ResourceCondition[];
  documentCount: number;
  totalChunks: number;
  totalTokens: number;
  lastIndexBuiltAt: string | null;
  freshness: FreshnessMetrics;
}
