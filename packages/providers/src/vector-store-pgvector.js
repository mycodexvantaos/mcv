'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConnectedPgVectorProvider = void 0;
class ConnectedPgVectorProvider {
  manifest = { capability: 'vector-store', provider: 'pgvector', mode: 'connected' };
  async initialize() {}
  async healthCheck() {
    return { status: 'down', reason: 'Postgres DB unreachable' };
  }
  async shutdown() {}
  async storeEmbedding(id, text, vector) {
    throw new Error('PG Down');
  }
  async searchSimilar(vector, topK) {
    throw new Error('PG Down');
  }
}
exports.ConnectedPgVectorProvider = ConnectedPgVectorProvider;
