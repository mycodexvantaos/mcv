/**
 * MyCodexVantaOS — Retrieval Receipt Model
 * Immutable proof of knowledge retrieval for audit and replay.
 *
 * Design principle: every knowledge-augmented answer MUST produce a receipt
 * that can be independently verified. Receipts are the "chain of custody"
 * for knowledge.
 */

import type { ResourceCondition } from '../shared';
import type {
  SearchOptions,
  SearchResultItem,
  SourceTrace,
  EvidenceLevel,
  RetrievalPhase,
} from './knowledge-index';

export interface RetrievalReceiptSpec {
  /** The chat session that triggered this retrieval */
  sessionId: string;
  /** The original query text */
  query: string;
  /** Search parameters used */
  searchOptions: SearchOptions;
  /** Ordered list of search results */
  results: SearchResultItem[];
  /** Full provenance traces for each result */
  sourceTraces: SourceTrace[];
  /** Total retrieval latency in milliseconds */
  totalDurationMs: number;
  /** Collections searched */
  collectionIds: string[];
}

export interface RetrievalReceiptStatus {
  phase: RetrievalPhase;
  resultCount: number;
  avgScore: number;
  topEvidenceLevel: EvidenceLevel | null;
  conditions: ResourceCondition[];
  createdAt: string;
}
