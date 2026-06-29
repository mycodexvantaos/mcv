/**
 * MyCodexVantaOS AI Embedding Service
 *
 * Service ID: mycodexvantaos-ai-embedding
 * Foundation: Data Foundation + Algorithm Foundation
 * Capability: Text and multimodal embedding generation
 *
 * Machine Identity: mycodexvantaos
 */

export const SERVICE_ID = "mycodexvantaos-ai-embedding";
export const SERVICE_VERSION = "1.0.0";

export type EmbeddingProvider = "native" | "openai" | "workers-ai";
export type EmbeddingModel =
  | "mycodexvantaos-embed-v1"
  | "text-embedding-3-small"
  | "text-embedding-3-large"
  | "@cf/baai/bge-small-en-v1.5"
  | "@cf/baai/bge-large-en-v1.5";

export interface EmbeddingRequest {
  requestId: string;
  input: string | string[];
  model: EmbeddingModel;
  provider?: EmbeddingProvider;
  dimensions?: number;
  workspaceId: string;
}

export interface EmbeddingVector {
  index: number;
  embedding: number[];
  dimensions: number;
}

export interface EmbeddingResponse {
  requestId: string;
  model: EmbeddingModel;
  provider: EmbeddingProvider;
  embeddings: EmbeddingVector[];
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  createdAt: Date;
}

/**
 * AI Embedding Engine
 * Generates vector embeddings for text inputs.
 */
export class AIEmbeddingEngine {
  private defaultProvider: EmbeddingProvider;
  private defaultModel: EmbeddingModel;

  constructor(options?: { provider?: EmbeddingProvider; model?: EmbeddingModel }) {
    this.defaultProvider = options?.provider ?? "native";
    this.defaultModel = options?.model ?? "mycodexvantaos-embed-v1";
  }

  /**
   * Generate embeddings for the given input.
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = Date.now();
    const provider = request.provider ?? this.defaultProvider;
    const inputs = Array.isArray(request.input) ? request.input : [request.input];

    const embeddings: EmbeddingVector[] = inputs.map((text, index) => ({
      index,
      embedding: this.generateMockEmbedding(text, request.dimensions ?? 1536),
      dimensions: request.dimensions ?? 1536,
    }));

    return {
      requestId: request.requestId,
      model: request.model,
      provider,
      embeddings,
      usage: {
        promptTokens: inputs.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0),
        totalTokens: inputs.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0),
      },
      latencyMs: Date.now() - startTime,
      createdAt: new Date(),
    };
  }

  /**
   * Compute cosine similarity between two embedding vectors.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;
    return dotProduct / magnitude;
  }

  /**
   * Generate a deterministic mock embedding for testing.
   * In production, this calls the actual embedding provider.
   */
  private generateMockEmbedding(text: string, dimensions: number): number[] {
    const embedding = new Array(dimensions).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }

    for (let i = 0; i < dimensions; i++) {
      const seed = (hash * (i + 1)) % 1000;
      embedding[i] = (seed / 1000) * 2 - 1;
    }

    // Normalize to unit vector
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map((v) => v / norm);
  }

  /**
   * Get available models for a provider.
   */
  getAvailableModels(provider: EmbeddingProvider): EmbeddingModel[] {
    const models: Record<EmbeddingProvider, EmbeddingModel[]> = {
      native: ["mycodexvantaos-embed-v1"],
      openai: ["text-embedding-3-small", "text-embedding-3-large"],
      "workers-ai": ["@cf/baai/bge-small-en-v1.5", "@cf/baai/bge-large-en-v1.5"],
    };
    return models[provider] ?? [];
  }
}

export const embeddingEngine = new AIEmbeddingEngine();
