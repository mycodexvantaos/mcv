/**
 * MyCodexVantaOS — Knowledge Index Model
 * Defines search, retrieval, and evidence structures for knowledge access.
 */

import type { ChunkMetadata } from './document-chunk';

// ── Search Models ──────────────────────────────────────────────────────

export type SearchType = 'semantic' | 'fulltext' | 'hybrid';
export type EvidenceLevel = 'knowledge-assisted' | 'knowledge-verified' | 'knowledge-grounded';

export interface SearchOptions {
  topK: number;
  minScore: number;
  searchType: SearchType;
  filters?: Record<string, unknown>;
  collectionIds?: string[];
}

export interface SearchResultItem {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
  evidenceLevel: EvidenceLevel;
}

// ── Source Trace ───────────────────────────────────────────────────────
// Provenance chain: every knowledge-backed answer must trace its sources.

export interface SourceTrace {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageNumber?: number;
  sectionTitle?: string;
  collectionId: string;
  relevanceScore: number;
}

// ── Retrieval Receipt ──────────────────────────────────────────────────
// Immutable record of WHAT was retrieved, WHEN, and with WHAT confidence.
// Enables "replay" of any knowledge-augmented response.

export interface RetrievalReceiptSpec {
  sessionId: string;
  query: string;
  searchOptions: SearchOptions;
  results: SearchResultItem[];
  sourceTraces: SourceTrace[];
  totalDurationMs: number;
  collectionIds: string[];
}

export interface RetrievalReceiptStatus {
  phase: RetrievalPhase;
  resultCount: number;
  avgScore: number;
  topEvidenceLevel: EvidenceLevel | null;
  createdAt: string;
}

export type RetrievalPhase = 'searching' | 'completed' | 'failed' | 'expired';

// ── Answer Trace ───────────────────────────────────────────────────────
// Closed-loop chain from question → retrieval → model → answer.

export interface AnswerTraceSpec {
  sessionId: string;
  messageId: string;
  retrievalReceiptIds: string[];
  modelEndpointId: string;
  promptTokens: number;
  completionTokens: number;
  evidenceLevel: EvidenceLevel;
  sourceCount: number;
}

export interface AnswerTraceStatus {
  phase: AnswerTracePhase;
  verifiedAt: string | null;
  integrityHash: string;
}

export type AnswerTracePhase = 'generating' | 'completed' | 'failed' | 'verified';

// ── Knowledge Index Metadata ───────────────────────────────────────────

export interface KnowledgeIndexStats {
  totalVectors: number;
  totalDocuments: number;
  indexSizeBytes: number;
  lastReindexAt: string | null;
  dimension: number;
  modelUsed: string;
}
