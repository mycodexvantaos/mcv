import { VectorStoreProvider } from '@mycodexvantaos/core-kernel';

export class NativeVectorStoreProvider implements VectorStoreProvider {
  manifest = { capability: 'vector-store', provider: 'native-memory', mode: 'native' as const };
  private store: Array<{ id: string, text: string, vector: number[] }> = [];

  async initialize() {
    console.log('[Provider: vector-store-native] Initialized native local memory vector space.');
  }
  
  async healthCheck() { 
    return { status: 'healthy' as const }; 
  }
  
  async shutdown() {}
  
  async storeEmbedding(id: string, text: string, vec: number[]) { 
    const idx = this.store.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.store[idx] = { id, text, vector: vec };
    } else {
      this.store.push({ id, text, vector: vec });
    }
    return true; 
  }
  
  async searchSimilar(targetVec: number[], topK: number = 3) { 
    if (this.store.length === 0) return [];
    
    const results = this.store.map(item => {
      return {
        id: item.id,
        text: item.text,
        score: this.cosineSimilarity(targetVec, item.vector)
      };
    });

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

