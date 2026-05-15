/**
 * Cloudflare Vectorize + D1 FTS Search Adapter
 * Implements ISearchPort using Cloudflare Vectorize (vector search)
 * and D1 full-text search (BM25).
 */

import type {
  ISearchPort,
  SearchVector,
  SearchQueryOptions,
  SearchResult,
  SearchIndexMetadata,
  FulltextSearchOptions,
} from '../../ports/index';
import type { CloudflareEnv } from './index';

export class CloudflareSearchAdapter implements ISearchPort {
  private vectorize: VectorizeIndex;
  private db: D1Database;

  constructor(env: CloudflareEnv) {
    this.vectorize = env.VECTORIZE;
    this.db = env.DB;
  }

  async upsert(vectors: SearchVector[]): Promise<void> {
    const vectorizeVectors: VectorizeVector[] = vectors.map((v) => ({
      id: v.id,
      values: v.values,
      metadata: v.metadata,
      namespace: v.namespace,
    }));

    await this.vectorize.upsert(vectorizeVectors);
  }

  async query(vector: number[], options?: SearchQueryOptions): Promise<SearchResult[]> {
    const results = await this.vectorize.query(vector, {
      topK: options?.topK ?? 5,
      filter: options?.filter as VectorizeFilterMetadata | undefined,
      namespace: options?.namespace,
      returnMetadata: options?.returnMetadata ?? true,
    });

    return results.map((r) => ({
      id: r.id,
      score: r.score,
      metadata: r.metadata as Record<string, unknown> | undefined,
    }));
  }

  async deleteByIds(ids: string[]): Promise<void> {
    await this.vectorize.deleteByIds(ids);
  }

  async getIndexMetadata(): Promise<SearchIndexMetadata> {
    const info = await this.vectorize.describe();
    return {
      dimension: info.dimension,
      vectorCount: info.vectorCount,
      indexType: info.indexType ?? 'vectorize',
      lastUpdated: new Date().toISOString(),  // Vectorize doesn't expose this directly
    };
  }

  async fulltextSearch(query: string, options?: FulltextSearchOptions): Promise<SearchResult[]> {
    // Use D1 FTS5 for full-text search
    // Assumes a virtual table `document_chunks_fts` exists
    const limit = options?.limit ?? 5;
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

    return (results.results as SearchResult[]) ?? [];
  }
}
