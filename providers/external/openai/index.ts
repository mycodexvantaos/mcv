/**
 * MyCodeXvantaOS — OpenAI Adapter
 * Implements IChatModelPort and IEmbeddingModelPort using the OpenAI API.
 *
 * Category: model
 * Port: @mycodexvantaos/ports/model-provider
 */

// ── Model Port Interfaces (local definitions) ──────────────────────────

export interface ModelRequest {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface ModelUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
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
  id?: string;
  content: string;
  model?: string;
  finishReason?: string;
  usage?: ModelUsage;
}

export interface EmbedRequest {
  input: string | string[];
  model?: string;
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

export interface IChatModelPort {
  invoke(request: ModelRequest): Promise<ModelResponse>;
  invokeStream(request: ModelRequest): AsyncIterable<ModelChunk>;
  healthCheck(): Promise<ModelHealthStatus>;
}

export interface IEmbeddingModelPort {
  embed(input: EmbedRequest): Promise<EmbedResponse>;
  healthCheck(): Promise<ModelHealthStatus>;
}

// ── OpenAI Configuration ───────────────────────────────────────────────

export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;           // default: https://api.openai.com/v1
  organization?: string;
  defaultModel?: string;      // default: gpt-4o
  embeddingModel?: string;    // default: text-embedding-3-small
}

// ── OpenAI Chat Adapter ────────────────────────────────────────────────

export class OpenAIChatAdapter implements IChatModelPort {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  async invoke(request: ModelRequest): Promise<ModelResponse> {
    const baseUrl = this.config.baseUrl ?? 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organization ? { 'OpenAI-Organization': this.config.organization } : {}),
      },
      body: JSON.stringify({
        model: request.model ?? this.config.defaultModel ?? 'gpt-4o',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stop: request.stopSequences,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI invocation failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as any;
    return {
      id: data.id,
      content: data.choices[0]?.message?.content ?? '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: data.choices[0]?.finish_reason ?? 'stop',
      created: new Date(data.created * 1000).toISOString(),
    };
  }

  async *invokeStream(request: ModelRequest): AsyncIterable<ModelChunk> {
    const baseUrl = this.config.baseUrl ?? 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model ?? this.config.defaultModel ?? 'gpt-4o',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI stream failed: ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(trimmed.slice(6));
          yield {
            id: data.id,
            content: data.choices[0]?.delta?.content ?? '',
            model: data.model,
            finishReason: data.choices[0]?.finish_reason,
            usage: data.usage ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            } : undefined,
          };
        } catch { /* skip malformed chunks */ }
      }
    }
  }

  async healthCheck(): Promise<ModelHealthStatus> {
    try {
      const start = Date.now();
      const baseUrl = this.config.baseUrl ?? 'https://api.openai.com/v1';
      const response = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      });
      return {
        healthy: response.ok,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return { healthy: false, latencyMs: -1, lastChecked: new Date().toISOString(), error: error instanceof Error ? error.message : 'Unknown' };
    }
  }
}

// ── OpenAI Embedding Adapter ───────────────────────────────────────────

export class OpenAIEmbeddingAdapter implements IEmbeddingModelPort {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  async embed(input: EmbedRequest): Promise<EmbedResponse> {
    const baseUrl = this.config.baseUrl ?? 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model ?? this.config.embeddingModel ?? 'text-embedding-3-small',
        input: input.input,
        dimensions: input.dimensions,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embedding failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as any;
    return {
      model: data.model,
      embeddings: data.data.map((d: any) => d.embedding),
      usage: { totalTokens: data.usage?.total_tokens ?? 0 },
    };
  }

  async healthCheck(): Promise<ModelHealthStatus> {
    try {
      const start = Date.now();
      return { healthy: true, latencyMs: Date.now() - start, lastChecked: new Date().toISOString() };
    } catch (error) {
      return { healthy: false, latencyMs: -1, lastChecked: new Date().toISOString(), error: error instanceof Error ? error.message : 'Unknown' };
    }
  }
}
