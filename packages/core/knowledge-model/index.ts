/**
 * MyCodeXvantaOS — Knowledge Model Package
 * Knowledge as operational substrate.
 *
 * Design principles:
 *   所有知識必須可追蹤 — every retrieval produces a receipt
 *   所有知識必須可使用  — every document is chunked, embedded, searchable
 *   所有知識必須可演化  — issues are detected, repairs close the loop
 */

// ── Document ───────────────────────────────────────────────────────────
export type { DocumentFormat, DocumentPhase } from './document';
export type { DocumentSpec, DocumentStatus } from './document';

// ── Document Chunk ─────────────────────────────────────────────────────
export type { ChunkMetadata, DocumentChunkSpec } from './document-chunk';

// ── Knowledge Collection ───────────────────────────────────────────────
export type {
  CollectionPhase,
  ChunkStrategy,
} from './knowledge-collection';
export type {
  KnowledgeCollectionSpec,
  KnowledgeCollectionStatus,
  FreshnessMetrics,
} from './knowledge-collection';

// ── Knowledge Index (Search + Retrieval + Evidence) ────────────────────
export type {
  SearchType,
  EvidenceLevel,
  RetrievalPhase,
  AnswerTracePhase,
} from './knowledge-index';
export type {
  SearchOptions,
  SearchResultItem,
  SourceTrace,
  RetrievalReceiptSpec,
  RetrievalReceiptStatus,
  AnswerTraceSpec,
  AnswerTraceStatus,
  KnowledgeIndexStats,
} from './knowledge-index';

// ── Retrieval Receipt ──────────────────────────────────────────────────
export type {
  RetrievalReceiptSpec as RetrievalReceipt,
  RetrievalReceiptStatus as RetrievalReceiptStatusType,
} from './retrieval-receipt';

// ── Answer Trace ───────────────────────────────────────────────────────
export type {
  AnswerTraceSpec as AnswerTrace,
  AnswerTraceStatus as AnswerTraceStatusType,
} from './answer-trace';

// ── Memory Item ────────────────────────────────────────────────────────
export type {
  MemoryType,
  MemoryPhase,
} from './memory-item';
export type {
  MemoryItemSpec,
  MemoryItemStatus,
} from './memory-item';

// ── Knowledge Issue ────────────────────────────────────────────────────
export type {
  KnowledgeIssueType,
  KnowledgeIssueSeverity,
  KnowledgeIssuePhase,
} from './knowledge-issue';
export type {
  KnowledgeIssueSpec,
  KnowledgeIssueStatus,
} from './knowledge-issue';

// ── Knowledge Repair ───────────────────────────────────────────────────
export type {
  KnowledgeRepairType,
  KnowledgeRepairPhase,
} from './knowledge-repair';
export type {
  KnowledgeRepairSpec,
  KnowledgeRepairStatus,
} from './knowledge-repair';

// ── Derived Artifact ───────────────────────────────────────────────────
export type {
  DerivedArtifactType,
  DerivedArtifactPhase,
} from './derived-artifact';
export type {
  DerivedArtifactSpec,
  DerivedArtifactStatus,
} from './derived-artifact';
