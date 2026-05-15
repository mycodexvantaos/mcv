/**
 * Knowledge Search Service — Application Layer
 *
 * Full-text, semantic, and hybrid search over knowledge collections.
 * Implements the retrieval pipeline: parse → authorize → search → rank → trace → audit.
 */

import type { IDatabasePort, ISearchPort, IAuditPort, IIdentityPort } from '../ports/index';
import type { SearchResultItem, SearchOptions, EvidenceLevel, SourceTrace } from '../core/index';

export interface KnowledgeSearchServiceDeps {
  database: IDatabasePort;
  search: ISearchPort;
  audit: IAuditPort;
  identity: IIdentityPort;
}

export class KnowledgeSearchService {
  private deps: KnowledgeSearchServiceDeps;

  constructor(deps: KnowledgeSearchServiceDeps) {
    this.deps = deps;
  }

  async search(workspaceId: string, query: string, options: SearchOptions): Promise<{
    results: SearchResultItem[];
    totalResults: number;
    evidenceLevel: EvidenceLevel;
    latencyMs: number;
  }> {
    const startTime = Date.now();

    // 1. Parse — validate query
    if (query.length > 2000) {
      throw new Error('Query exceeds maximum length of 2000 characters');
    }

    // 2. Authorize — handled by the runtime layer before reaching here

    // 3. Search — execute against the search index
    const rawResults = options.searchType === 'semantic'
      ? await this.semanticSearch(query, options)
      : options.searchType === 'fulltext'
        ? await this.fulltextSearch(query, options)
        : await this.hybridSearch(query, options);

    // 4. Rank — results are already ranked by the search backend

    // 5. Trace — classify evidence level
    const evidenceLevel = this.classifyEvidenceLevel(rawResults);

    // 6. Audit — emit search event
    await this.deps.audit.emitEvent({
      eventType: rawResults.length > 0 ? 'knowledge.search.executed' : 'knowledge.search.zero-result',
      category: 'knowledge',
      severity: 'info',
      subjectId: 'system',
      workspaceId,
      resourceKind: 'knowledge-index',
      action: 'search',
      data: { query, searchType: options.searchType, topK: options.topK, resultCount: rawResults.length, evidenceLevel },
      correlationId: crypto.randomUUID(),
    });

    return {
      results: rawResults,
      totalResults: rawResults.length,
      evidenceLevel,
      latencyMs: Date.now() - startTime,
    };
  }

  async hybridSearch(workspaceId: string, query: string, options: SearchOptions): Promise<{
    results: SearchResultItem[];
    totalResults: number;
    evidenceLevel: EvidenceLevel;
    latencyMs: number;
  }> {
    const semanticWeight = 0.7;
    const fulltextWeight = 0.3;

    const [semanticResults, fulltextResults] = await Promise.all([
      this.semanticSearch(query, options),
      this.fulltextSearch(query, options),
    ]);

    // Reciprocal rank fusion
    const fusedMap = new Map<string, SearchResultItem & { fusedScore: number }>();
    const k = 60; // RRF constant

    for (let i = 0; i < semanticResults.length; i++) {
      const r = semanticResults[i];
      fusedMap.set(r.chunkId, { ...r, fusedScore: semanticWeight / (k + i + 1) });
    }

    for (let i = 0; i < fulltextResults.length; i++) {
      const r = fulltextResults[i];
      const existing = fusedMap.get(r.chunkId);
      if (existing) {
        existing.fusedScore += fulltextWeight / (k + i + 1);
      } else {
        fusedMap.set(r.chunkId, { ...r, fusedScore: fulltextWeight / (k + i + 1) });
      }
    }

    const results = Array.from(fusedMap.values())
      .sort((a, b) => b.fusedScore - a.fusedScore)
      .slice(0, options.topK)
      .map(({ fusedScore, ...rest }) => ({ ...rest, score: fusedScore }));

    return {
      results,
      totalResults: results.length,
      evidenceLevel: this.classifyEvidenceLevel(results),
      latencyMs: 0, // set by caller
    };
  }

  async traceSource(chunkId: string): Promise<SourceTrace> {
    const chunk = await this.deps.database.queryFirst<{
      id: string;
      document_id: string;
      chunk_index: number;
      content: string;
      metadata: string;
    }>('SELECT * FROM document_chunks WHERE id = ?', [chunkId]);

    if (!chunk) throw new Error(`Chunk ${chunkId} not found`);

    const document = await this.deps.database.queryFirst<{
      id: string;
      title: string;
      collection_id: string;
    }>('SELECT id, title, collection_id FROM documents WHERE id = ?', [chunk.document_id]);

    return {
      chunkId,
      documentId: chunk.document_id,
      documentTitle: document?.title ?? 'Unknown',
      collectionId: document?.collection_id ?? '',
      relevanceScore: 1.0,
    };
  }

  private async semanticSearch(query: string, options: SearchOptions): Promise<SearchResultItem[]> {
    // In production, we'd embed the query first, then search Vectorize
    // For constitution, we define the interface
    return [];
  }

  private async fulltextSearch(query: string, options: SearchOptions): Promise<SearchResultItem[]> {
    const results = await this.deps.search.fulltextSearch(query, {
      limit: options.topK,
      filter: options.filters,
    });
    return results.map((r) => ({
      chunkId: r.id,
      documentId: (r.metadata?.document_id as string) ?? '',
      content: (r.metadata?.content as string) ?? '',
      score: r.score,
      metadata: {},
      evidenceLevel: 'knowledge-assisted',
    }));
  }

  private classifyEvidenceLevel(results: SearchResultItem[]): EvidenceLevel {
    if (results.length === 0) return 'knowledge-assisted';
    const allVerified = results.every((r) => r.score >= 0.7);
    const allGrounded = results.every((r) => r.score >= 0.8);
    if (allGrounded) return 'knowledge-grounded';
    if (allVerified) return 'knowledge-verified';
    return 'knowledge-assisted';
  }
}
