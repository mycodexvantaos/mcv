/**
 * MyCodexVantaOS Knowledge Search Service
 *
 * Service ID: mycodexvantaos-knowledge-search
 * Foundation: Data Foundation
 * Capability: Hybrid search (vector + full-text), RAG-ready knowledge retrieval
 *
 * Machine Identity: mycodexvantaos
 */

export const SERVICE_ID = 'mycodexvantaos-knowledge-search';
export const SERVICE_VERSION = '1.0.0';

export type SearchMode = 'vector' | 'full-text' | 'hybrid';
export type SearchProvider = 'native' | 'pgvector' | 'qdrant' | 'vectorize';

export interface SearchQuery {
  queryId: string;
  text: string;
  embedding?: number[];
  mode: SearchMode;
  topK: number;
  minScore?: number;
  filters?: Record<string, unknown>;
  workspaceId: string;
  collectionId: string;
}

export interface SearchResult {
  documentId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface SearchResponse {
  queryId: string;
  results: SearchResult[];
  totalFound: number;
  latencyMs: number;
  searchMode: SearchMode;
  provider: SearchProvider;
  createdAt: Date;
}

export interface KnowledgeDocument {
  documentId: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  workspaceId: string;
  collectionId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Knowledge Search Engine
 * Provides hybrid search capabilities over knowledge collections.
 */
export class KnowledgeSearchEngine {
  private documents: Map<string, KnowledgeDocument[]> = new Map(); // collectionId -> docs

  /**
   * Index a document for search.
   */
  indexDocument(document: KnowledgeDocument): void {
    const key = `${document.workspaceId}:${document.collectionId}`;
    const docs = this.documents.get(key) ?? [];
    const existingIndex = docs.findIndex((d) => d.documentId === document.documentId);

    if (existingIndex >= 0) {
      docs[existingIndex] = { ...document, updatedAt: new Date() };
    } else {
      docs.push(document);
    }

    this.documents.set(key, docs);
  }

  /**
   * Execute a search query.
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    const key = `${query.workspaceId}:${query.collectionId}`;
    const docs = this.documents.get(key) ?? [];

    let results: SearchResult[] = [];

    switch (query.mode) {
      case 'vector':
        results = this.vectorSearch(docs, query);
        break;
      case 'full-text':
        results = this.fullTextSearch(docs, query);
        break;
      case 'hybrid':
        results = this.hybridSearch(docs, query);
        break;
    }

    // Apply min score filter
    if (query.minScore !== undefined) {
      results = results.filter((r) => r.score >= query.minScore!);
    }

    // Limit to topK
    results = results.slice(0, query.topK);

    return {
      queryId: query.queryId,
      results,
      totalFound: results.length,
      latencyMs: Date.now() - startTime,
      searchMode: query.mode,
      provider: 'native',
      createdAt: new Date(),
    };
  }

  /**
   * Vector similarity search using cosine similarity.
   */
  private vectorSearch(docs: KnowledgeDocument[], query: SearchQuery): SearchResult[] {
    if (!query.embedding) return [];

    return docs
      .map((doc) => ({
        documentId: doc.documentId,
        content: doc.content,
        score: this.cosineSimilarity(query.embedding!, doc.embedding),
        metadata: doc.metadata,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Full-text search using simple keyword matching.
   */
  private fullTextSearch(docs: KnowledgeDocument[], query: SearchQuery): SearchResult[] {
    const terms = query.text.toLowerCase().split(/\s+/);

    return docs
      .map((doc) => {
        const content = doc.content.toLowerCase();
        const matchCount = terms.filter((term) => content.includes(term)).length;
        const score = matchCount / terms.length;

        return {
          documentId: doc.documentId,
          content: doc.content,
          score,
          metadata: doc.metadata,
        };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Hybrid search combining vector and full-text results (RRF fusion).
   */
  private hybridSearch(docs: KnowledgeDocument[], query: SearchQuery): SearchResult[] {
    const vectorResults = query.embedding ? this.vectorSearch(docs, query) : [];
    const textResults = this.fullTextSearch(docs, query);

    // Reciprocal Rank Fusion (RRF)
    const k = 60;
    const scores = new Map<string, number>();

    vectorResults.forEach((r, rank) => {
      scores.set(r.documentId, (scores.get(r.documentId) ?? 0) + 1 / (k + rank + 1));
    });

    textResults.forEach((r, rank) => {
      scores.set(r.documentId, (scores.get(r.documentId) ?? 0) + 1 / (k + rank + 1));
    });

    return docs
      .filter((d) => scores.has(d.documentId))
      .map((doc) => ({
        documentId: doc.documentId,
        content: doc.content,
        score: scores.get(doc.documentId) ?? 0,
        metadata: doc.metadata,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Compute cosine similarity between two vectors.
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const mag = Math.sqrt(normA) * Math.sqrt(normB);
    return mag === 0 ? 0 : dot / mag;
  }

  /**
   * Delete a document from the index.
   */
  deleteDocument(workspaceId: string, collectionId: string, documentId: string): boolean {
    const key = `${workspaceId}:${collectionId}`;
    const docs = this.documents.get(key) ?? [];
    const index = docs.findIndex((d) => d.documentId === documentId);
    if (index < 0) return false;
    docs.splice(index, 1);
    this.documents.set(key, docs);
    return true;
  }

  /**
   * Get collection statistics.
   */
  getCollectionStats(
    workspaceId: string,
    collectionId: string
  ): {
    documentCount: number;
    embeddingDimensions: number;
  } {
    const key = `${workspaceId}:${collectionId}`;
    const docs = this.documents.get(key) ?? [];
    return {
      documentCount: docs.length,
      embeddingDimensions: docs[0]?.embedding.length ?? 0,
    };
  }
}

export const knowledgeSearchEngine = new KnowledgeSearchEngine();
