/**
 * MyCodexVantaOS — Model Provider Port
 * Abstracts LLM invocation and embedding generation.
 *
 * Implementations: OpenAI, OpenRouter, Workers AI, Anthropic, Google, Ollama
 *
 * Dependency: depends on @mycodexvantaos/core types only.
 */

// ── Chat Model Port ────────────────────────────────────────────────────

export interface IChatModelPort {
  /** Invoke a model with a prompt and return the full response */
  invoke(request: ModelRequest): Promise<ModelResponse>;

  /** Invoke a model with streaming response */
  invokeStream(request: ModelRequest): AsyncIterable<ModelChunk>;

  /** Health check the model endpoint */
  healthCheck(): Promise<ModelHealthStatus>;
}

// ── Embedding Model Port ───────────────────────────────────────────────

export interface IEmbeddingModelPort {
  /** Generate embeddings for input texts */
  embed(input: EmbedRequest): Promise<EmbedResponse>;

  /** Health check the embedding endpoint */
  healthCheck(): Promise<ModelHealthStatus>;
}

// ── Unified Model Port (convenience) ───────────────────────────────────

export interface IModelPort extends IChatModelPort, IEmbeddingModelPort {}

// ── Request / Response Types ───────────────────────────────────────────

export interface ModelRequest {
  model: string;
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface ModelResponse {
  id: string;
  content: string;
  model: string;
  usage: ModelUsage;
  finishReason: string;
  created: string;
}

export interface ModelChunk {
  id: string;
  content: string;
  model: string;
  usage?: Partial<ModelUsage>;
  finishReason?: string;
}

export interface ModelUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface EmbedRequest {
  model: string;
  input: string[];
  dimensions?: number;
}

export interface EmbedResponse {
  model: string;
  embeddings: number[][];
  usage: { totalTokens: number };
}

export interface ModelHealthStatus {
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
  error?: string;
}
