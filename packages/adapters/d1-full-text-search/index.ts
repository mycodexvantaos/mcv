/**
 * MyCodeXvantaOS — D1 Full-Text Search Adapter
 * Implements ISearchPort.fulltextSearch() using D1 FTS5 (BM25).
 *
 * Category: knowledge
 * Port: @mycodexvantaos/ports/search
 *
 * Uses SQLite FTS5 virtual tables in Cloudflare D1 for full-text search.
 * Combined with Vectorize for hybrid search.
 */

import type {
  ISearchPort,
  SearchVector,
  SearchQueryOptions,
  SearchResult,
  SearchIndexMetadata,
  FulltextSearchOptions,
} from '../../ports/search';

// ── D1 FTS Environment Binding ─────────────────────────────────────────

export interface D1FtsEnv {
  DB: D1Database;
}

// ── D1 Full-Text Search Adapter ────────────────────────────────────────

export class D1FullTextSearchAdapter implements ISearchPort {
  private db: D1Database;

  constructor(env: D1FtsEnv) {
    this.db = env.DB;
  }

  async upsert(vectors: SearchVector[]): Promise<void> {
    // FTS5 doesn't use vector upsert — this is a no-op for fulltext-only adapter
    // In production, content is inserted into FTS5 during document ingestion
  }

  async query(vector: number[], options?: SearchQueryOptions): Promise<SearchResult[]> {
    // Vector search is not supported by FTS5 alone
    // Use Vectorize for vector search, or combine for hybrid
    throw new Error('Vector search not supported by D1 FTS5. Use Vectorize adapter instead.');
  }

  async deleteByIds(ids: string[]): Promise<void> {
    // Delete from FTS5 virtual table
    const placeholders = ids.map(() => '?').join(', ');
    await this.db
      .prepare(`DELETE FROM document_chunks_fts WHERE chunk_id IN (${placeholders})`)
      .bind(...ids)
      .run();
  }

  async getIndexMetadata(): Promise<SearchIndexMetadata> {
    const result = await this.db
      .prepare('SELECT count(*) as count FROM document_chunks_fts_content')
      .first<{ count: number }>();
    return {
      dimension: 0, // FTS5 doesn't have vector dimension
      vectorCount: result?.count ?? 0,
      indexType: 'd1-fts5',
      lastUpdated: new Date().toISOString(),
    };
  }

  async fulltextSearch(query: string, options?: FulltextSearchOptions): Promise<SearchResult[]> {
    const limit = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const results = await this.db
      .prepare(
        `SELECT
        chunk_id as id,
        bm25(document_chunks_fts) as score,
        document_id,
        content,
        chunk_index
       FROM document_chunks_fts
       WHERE document_chunks_fts MATCH ?
       ORDER BY score DESC
       LIMIT ? OFFSET ?`
      )
      .bind(query, limit, offset)
      .all();

    return (results.results as unknown as SearchResult[]) ?? [];
  }
}
