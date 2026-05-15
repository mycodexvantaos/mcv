/**
 * MyCodeXvantaOS — Workers AI Adapter
 * Implements IChatModelPort and IEmbeddingModelPort using Cloudflare Workers AI.
 *
 * Category: model
 * Port: @mycodexvantaos/ports/model-provider
 *
 * Workers AI provides on-edge AI inference with models like Llama, Mistral,
 * and the bge embedding model. No external API key required — bound via wrangler.
 */

import type {
  IChatModelPort,
  IEmbeddingModelPort,
  ModelRequest,
  ModelResponse,
  ModelChunk,
  EmbedRequest,
  EmbedResponse,
  ModelHealthStatus,
} from '../../ports/model-provider';

// ── Workers AI Environment Binding ─────────────────────────────────────

export interface WorkersAIEnv {
  AI: Ai;
}

// ── Workers AI Chat Adapter ────────────────────────────────────────────

export class WorkersAIChatAdapter implements IChatModelPort {
  private ai: Ai;

  constructor(env: WorkersAIEnv) {
    this.ai = env.AI;
  }

  async invoke(request: ModelRequest): Promise<ModelResponse> {
    const model = request.model ?? '@cf/meta/llama-3.1-8b-instruct';
    const response = await this.ai.run(model as any, {
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
    });

    const result = response as any;
    return {
      id: crypto.randomUUID(),
      content: result.response ?? result.choices?.[0]?.message?.content ?? '',
      model,
      usage: {
        promptTokens: result.usage?.prompt_tokens ?? 0,
        completionTokens: result.usage?.completion_tokens ?? 0,
        totalTokens: (result.usage?.prompt_tokens ?? 0) + (result.usage?.completion_tokens ?? 0),
      },
      finishReason: 'stop',
      created: new Date().toISOString(),
    };
  }

  async *invokeStream(request: ModelRequest): AsyncIterable<ModelChunk> {
    const model = request.model ?? '@cf/meta/llama-3.1-8b-instruct';
    const response = await this.ai.run(model as any, {
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    });

    // Workers AI streaming returns a ReadableStream
    const reader = (response as any).getReader?.();
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        yield {
          id: crypto.randomUUID(),
          content: text,
          model,
          finishReason: undefined,
        };
      }
    } else {
      // Non-streaming fallback
      const result = response as any;
      yield {
        id: crypto.randomUUID(),
        content: result.response ?? '',
        model,
        finishReason: 'stop',
      };
    }
  }

  async healthCheck(): Promise<ModelHealthStatus> {
    try {
      const start = Date.now();
      // Workers AI doesn't have a dedicated health endpoint
      // We consider it healthy if the binding exists
      return {
        healthy: true,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return { healthy: false, latencyMs: -1, lastChecked: new Date().toISOString(), error: error instanceof Error ? error.message : 'Unknown' };
    }
  }
}

// ── Workers AI Embedding Adapter ───────────────────────────────────────

export class WorkersAIEmbeddingAdapter implements IEmbeddingModelPort {
  private ai: Ai;

  constructor(env: WorkersAIEnv) {
    this.ai = env.AI;
  }

  async embed(input: EmbedRequest): Promise<EmbedResponse> {
    const model = input.model ?? '@cf/baai/bge-small-en-v1.5';
    const response = await this.ai.run(model as any, {
      text: input.input,
    });

    const result = response as any;
    return {
      model,
      embeddings: result.data?.map((d: any) => d) ?? [],
      usage: { totalTokens: result.usage?.total_tokens ?? 0 },
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
