/**
 * MyCodeXvantaOS — Search Port
 * Abstracts vector search and full-text search operations.
 *
 * Cloudflare implementation: Vectorize + D1 FTS5
 * Portable alternatives: Qdrant, pgvector, Typesense, Meilisearch
 *
 * Dependency: depends on @mycodexvantaos/core types only.
 */

// ── Search Port Interface ──────────────────────────────────────────────

export interface ISearchPort {
  /** Insert vectors into the index */
  upsert(vectors: SearchVector[]): Promise<void>;

  /** Query vectors by similarity */
  query(vector: number[], options?: SearchQueryOptions): Promise<SearchResult[]>;

  /** Delete vectors by ID */
  deleteByIds(ids: string[]): Promise<void>;

  /** Get index metadata */
  getIndexMetadata(): Promise<SearchIndexMetadata>;

  /** Full-text search (if supported) */
  fulltextSearch(query: string, options?: FulltextSearchOptions): Promise<SearchResult[]>;
}

// ── Vector Types ───────────────────────────────────────────────────────

export interface SearchVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
  namespace?: string;
}

export interface SearchQueryOptions {
  topK?: number;
  filter?: Record<string, unknown>;
  namespace?: string;
  returnMetadata?: boolean;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
  values?: number[];
}

export interface SearchIndexMetadata {
  dimension: number;
  vectorCount: number;
  indexType: string;
  lastUpdated: string;
}

// ── Full-text Search Types ─────────────────────────────────────────────

export interface FulltextSearchOptions {
  limit?: number;
  offset?: number;
  filter?: Record<string, unknown>;
}

// ── Knowledge Search Port (higher-level) ───────────────────────────────
// Domain-specific search interface combining vector + fulltext + metadata.

export interface IKnowledgeSearchPort {
  /** Search knowledge collections */
  search(request: KnowledgeSearchRequest): Promise<KnowledgeSearchResponse>;

  /** Index a document chunk */
  indexChunk(chunk: IndexableChunk): Promise<void>;

  /** Remove chunks for a document */
  removeDocument(documentId: string, collectionId: string): Promise<void>;

  /** Rebuild the index for a collection */
  rebuildIndex(collectionId: string): Promise<void>;
}

export interface KnowledgeSearchRequest {
  query: string;
  collectionIds: string[];
  topK: number;
  minScore: number;
  searchType: "semantic" | "fulltext" | "hybrid";
  filters?: Record<string, unknown>;
}

export interface KnowledgeSearchResponse {
  results: KnowledgeSearchResult[];
  totalDurationMs: number;
}

export interface KnowledgeSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface IndexableChunk {
  id: string;
  documentId: string;
  collectionId: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}
