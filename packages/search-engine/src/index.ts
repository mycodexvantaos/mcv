/**
 * MyCodeXvantaOS Search Engine
 * Provides full-text search capabilities across documents
 */

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
}

export interface SearchResult {
  document: Document;
  score: number;
}

export class SearchEngine {
  private documents: Map<string, Document> = new Map();

  async index(document: Document): Promise<void> {
    this.documents.set(document.id, document);
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const searchTerms = query.query.toLowerCase().split(/\s+/);

    for (const doc of this.documents.values()) {
      let score = 0;
      const content = doc.content.toLowerCase();

      for (const term of searchTerms) {
        if (content.includes(term)) {
          score += content.split(term).length - 1;
        }
      }

      if (score > 0) {
        results.push({ document: doc, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, query.limit || 10);
  }

  async delete(documentId: string): Promise<boolean> {
    return this.documents.delete(documentId);
  }
}

export default SearchEngine;
