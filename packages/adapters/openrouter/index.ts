/**
 * MyCodeXvantaOS — OpenRouter Adapter
 * Implements IChatModelPort using the OpenRouter API (multi-model gateway).
 *
 * Category: model
 * Port: @mycodexvantaos/ports/model-provider
 *
 * OpenRouter provides a unified API for multiple LLM providers (OpenAI, Anthropic,
 * Google, Meta, etc.) with a single API key. This adapter follows the OpenAI
 * chat completions format but routes through OpenRouter.
 */

import type {
  IChatModelPort,
  ModelRequest,
  ModelResponse,
  ModelChunk,
  ModelHealthStatus,
} from "../../ports/model-provider";

// ── OpenRouter Configuration ───────────────────────────────────────────

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string; // default: https://openrouter.ai/api/v1
  siteUrl?: string; // optional: your site URL for rankings
  siteName?: string; // optional: your site name
  defaultModel?: string; // default: openai/gpt-4o
}

// ── OpenRouter Chat Adapter ────────────────────────────────────────────

export class OpenRouterChatAdapter implements IChatModelPort {
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  async invoke(request: ModelRequest): Promise<ModelResponse> {
    const baseUrl = this.config.baseUrl ?? "https://openrouter.ai/api/v1";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
    if (this.config.siteUrl) headers["HTTP-Referer"] = this.config.siteUrl;
    if (this.config.siteName) headers["X-Title"] = this.config.siteName;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: request.model ?? this.config.defaultModel ?? "openai/gpt-4o",
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        stop: request.stopSequences,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter invocation failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as any;
    return {
      id: data.id,
      content: data.choices[0]?.message?.content ?? "",
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: data.choices[0]?.finish_reason ?? "stop",
      created: new Date(data.created * 1000).toISOString(),
    };
  }

  async *invokeStream(request: ModelRequest): AsyncIterable<ModelChunk> {
    const baseUrl = this.config.baseUrl ?? "https://openrouter.ai/api/v1";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
    if (this.config.siteUrl) headers["HTTP-Referer"] = this.config.siteUrl;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: request.model ?? this.config.defaultModel ?? "openai/gpt-4o",
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter stream failed: ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(trimmed.slice(6));
          yield {
            id: data.id,
            content: data.choices[0]?.delta?.content ?? "",
            model: data.model,
            finishReason: data.choices[0]?.finish_reason,
          };
        } catch {
          /* skip malformed chunks */
        }
      }
    }
  }

  async healthCheck(): Promise<ModelHealthStatus> {
    try {
      const start = Date.now();
      const baseUrl = this.config.baseUrl ?? "https://openrouter.ai/api/v1";
      const response = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      return {
        healthy: response.ok,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: -1,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown",
      };
    }
  }
}
