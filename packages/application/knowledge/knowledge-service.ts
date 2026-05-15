/**
 * MyCodeXvantaOS — Knowledge Application Service
 * Category: knowledge
 *
 * Document ingestion, chunking, embedding, indexing, search, and retrieval.
 * Manages the complete knowledge lifecycle:
 *   ingest → chunk → embed → index → search → retrieve → trace → repair
 *
 * Use cases:
 *   - ingest-document
 *   - chunk-document
 *   - index-document
 *   - search-knowledge
 *   - create-retrieval-receipt
 *   - create-answer-trace
 *   - detect-knowledge-issue
 */

import type { IDatabasePort } from '../../ports/database';
import type { IObjectStoragePort } from '../../ports/object-storage';
import type { IKnowledgeSearchPort } from '../../ports/search';
import type { IJobQueuePort } from '../../ports/queue';
import type { IAuthPort } from '../../ports/auth';
import type { ResourceCondition } from '../../core/shared';

// ── Service Dependencies ───────────────────────────────────────────────

export interface KnowledgeServiceDeps {
  database: IDatabasePort;
  storage: IObjectStoragePort;
  search: IKnowledgeSearchPort;
  queue: IJobQueuePort;
  auth: IAuthPort;
  audit: {
    emitEvent(event: KnowledgeAuditEvent): Promise<void>;
  };
}

// ── Document Types ─────────────────────────────────────────────────────

export type DocumentFormat = 'pdf' | 'txt' | 'md' | 'html' | 'json' | 'csv' | 'docx';
export type DocumentPhase = 'uploaded' | 'ingesting' | 'ready' | 'failed' | 'stale' | 'archived' | 'deleted';

export interface IngestDocumentInput {
  title: string;
  format: DocumentFormat;
  collectionId: string;
  content: Uint8Array;
  sourceUri?: string;
  language?: string;
}

export interface DocumentResource {
  id: string;
  urn: string;
  spec: {
    title: string;
    format: DocumentFormat;
    collectionId: string;
    sourceUri: string | null;
    language: string;
  };
  status: {
    phase: DocumentPhase;
    chunkCount: number;
    totalTokens: number;
    fileSizeBytes: number;
    conditions: ResourceCondition[];
  };
}

// ── Collection Types ───────────────────────────────────────────────────

export type CollectionPhase = 'creating' | 'empty' | 'indexing' | 'ready' | 'degraded' | 'deleted';
export type ChunkStrategy = 'fixed' | 'semantic' | 'sentence';

export interface CreateCollectionInput {
  name: string;
  description: string;
  embeddingModel: string;
  chunkStrategy: ChunkStrategy;
  language?: string;
}

export interface CollectionResource {
  id: string;
  urn: string;
  spec: {
    name: string;
    description: string;
    embeddingModel: string;
    chunkStrategy: ChunkStrategy;
    language: string;
  };
  status: {
    phase: CollectionPhase;
    documentCount: number;
    totalChunks: number;
    conditions: ResourceCondition[];
  };
}

// ── Search Types ───────────────────────────────────────────────────────

export type SearchType = 'semantic' | 'fulltext' | 'hybrid';
export type EvidenceLevel = 'knowledge-assisted' | 'knowledge-verified' | 'knowledge-grounded';

export interface SearchKnowledgeInput {
  query: string;
  collectionIds: string[];
  topK?: number;
  minScore?: number;
  searchType?: SearchType;
}

export interface SearchResultItem {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  evidenceLevel: EvidenceLevel;
}

// ── Issue & Repair Types ───────────────────────────────────────────────

export type KnowledgeIssueType = 'stale' | 'contradiction' | 'gap' | 'hallucination' | 'broken-reference';

export interface KnowledgeAuditEvent {
  eventType: string;
  category: 'knowledge';
  severity: string;
  subjectId: string;
  workspaceId: string;
  action: string;
  data?: Record<string, unknown>;
  correlationId: string;
}

// ── Service Class ──────────────────────────────────────────────────────

export class KnowledgeService {
  private deps: KnowledgeServiceDeps;

  constructor(deps: KnowledgeServiceDeps) {
    this.deps = deps;
  }

  // ── Document Ingestion ───────────────────────────────────────────────

  async ingestDocument(workspaceId: string, subjectId: string, input: IngestDocumentInput): Promise<DocumentResource> {
    const documentId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:knowledge:document:${documentId}`;
    const now = new Date().toISOString();

    // Store raw document in object storage
    await this.deps.storage.put('documents', `${workspaceId}/${documentId}`, input.content, {
      contentType: `application/${input.format}`,
      metadata: { documentId, collectionId: input.collectionId, workspaceId },
    });

    // Create document record
    await this.deps.database.execute(
      `INSERT INTO documents (id, urn, workspace_id, title, format, collection_id, source_uri, language, phase, file_size_bytes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'uploaded', ?, ?, ?)`,
      [documentId, urn, workspaceId, input.title, input.format, input.collectionId, input.sourceUri ?? null, input.language ?? 'en', input.content.byteLength, now, now]
    );

    // Enqueue async chunking job
    await this.deps.queue.enqueue({
      jobId: crypto.randomUUID(),
      jobType: 'document-chunk',
      workspaceId,
      data: { documentId, collectionId: input.collectionId },
    });

    await this.deps.audit.emitEvent({
      eventType: 'knowledge.document.ingested',
      category: 'knowledge',
      severity: 'info',
      subjectId,
      workspaceId,
      action: 'ingest-document',
      correlationId: crypto.randomUUID(),
      data: { documentId, format: input.format, sizeBytes: input.content.byteLength },
    });

    return {
      id: documentId,
      urn,
      spec: { title: input.title, format: input.format, collectionId: input.collectionId, sourceUri: input.sourceUri ?? null, language: input.language ?? 'en' },
      status: { phase: 'uploaded', chunkCount: 0, totalTokens: 0, fileSizeBytes: input.content.byteLength, conditions: [] },
    };
  }

  // ── Search ───────────────────────────────────────────────────────────

  async searchKnowledge(workspaceId: string, subjectId: string, input: SearchKnowledgeInput): Promise<{
    results: SearchResultItem[];
    totalDurationMs: number;
  }> {
    const startTime = Date.now();

    const response = await this.deps.search.search({
      query: input.query,
      collectionIds: input.collectionIds,
      topK: input.topK ?? 10,
      minScore: input.minScore ?? 0.5,
      searchType: input.searchType ?? 'hybrid',
    });

    const totalDurationMs = Date.now() - startTime;

    await this.deps.audit.emitEvent({
      eventType: 'knowledge.search.executed',
      category: 'knowledge',
      severity: 'info',
      subjectId,
      workspaceId,
      action: 'search-knowledge',
      correlationId: crypto.randomUUID(),
      data: { query: input.query, resultCount: response.results.length, durationMs: totalDurationMs },
    });

    return { results: response.results, totalDurationMs };
  }

  // ── Collection Management ────────────────────────────────────────────

  async createCollection(workspaceId: string, subjectId: string, input: CreateCollectionInput): Promise<CollectionResource> {
    const collectionId = crypto.randomUUID();
    const urn = `urn:mycodexvantaos:knowledge:collection:${collectionId}`;
    const now = new Date().toISOString();

    await this.deps.database.execute(
      `INSERT INTO knowledge_collections (id, urn, workspace_id, name, description, embedding_model, chunk_strategy, language, phase, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'empty', ?, ?)`,
      [collectionId, urn, workspaceId, input.name, input.description, input.embeddingModel, input.chunkStrategy, input.language ?? 'en', now, now]
    );

    return {
      id: collectionId,
      urn,
      spec: { name: input.name, description: input.description, embeddingModel: input.embeddingModel, chunkStrategy: input.chunkStrategy, language: input.language ?? 'en' },
      status: { phase: 'empty', documentCount: 0, totalChunks: 0, conditions: [] },
    };
  }
}
