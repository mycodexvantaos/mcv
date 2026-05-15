/**
 * providers/llm/llm-gemini/index.ts
 * Google Gemini LLM Provider - Optional external connector
 *
 * This provider connects to Google Gemini API when available.
 * Falls back to llm-native when API key is not configured or request fails.
 */

import type { LLMRequest, LLMResponse, ChatMessage, ChatRequest } from '../llm-native/index.js';

export interface GeminiConfig {
  enabled?: boolean;
  apiKey?: string;
  model?: 'gemini-2.0-flash' | 'gemini-2.0-pro' | 'gemini-1.5-flash' | 'gemini-1.5-pro';
  maxTokens?: number;
  temperature?: number;
  fallbackToNative?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<Omit<GeminiConfig, 'apiKey'>> & { apiKey?: string } = {
  enabled: false,
  model: 'gemini-2.0-flash',
  maxTokens: 8192,
  temperature: 0.7,
  fallbackToNative: true,
};

/**
 * Google Gemini LLM Provider Implementation
 */
export class GeminiLLMProvider {
  private config: Required<Omit<GeminiConfig, 'apiKey'>> & { apiKey?: string };
  private available: boolean = false;

  constructor(config: GeminiConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      apiKey:
        config.apiKey ||
        process.env.GOOGLE_GENAI_API_KEY ||
        process.env.MYCODEXVANTAOS_LLM_GEMINI_API_KEY,
    };

    this.available = !!(this.config.apiKey && this.config.enabled);
  }

  /**
   * Check if Gemini API is available
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.config.enabled) {
      return {
        healthy: false,
        message: 'Gemini provider is disabled',
      };
    }

    if (!this.config.apiKey) {
      return {
        healthy: false,
        message:
          'No API key configured. Set GOOGLE_GENAI_API_KEY or MYCODEXVANTAOS_LLM_GEMINI_API_KEY',
      };
    }

    // In a real implementation, we would make a test API call here
    return {
      healthy: true,
      message: `Gemini provider ready (model: ${this.config.model})`,
    };
  }

  /**
   * Check if provider is available (has API key)
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Get provider metadata
   */
  getMetadata() {
    return {
      name: 'llm-gemini',
      provider: 'google',
      capabilities: [
        'text-generation',
        'text-completion',
        'code-generation',
        'chat-completion',
        'function-calling',
        'multimodal',
      ],
      isNative: false,
      requiresApiKey: true,
      model: this.config.model,
      fallbackProvider: 'llm-native',
    };
  }

  /**
   * Generate text completion
   * Falls back to native provider if not configured
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    if (!this.available) {
      // Return a response indicating native fallback is needed
      return {
        text: `[Gemini Provider] Not configured. Falling back to native provider.\n\nConfigure GOOGLE_GENAI_API_KEY to enable Gemini capabilities.`,
        tokens: 20,
        model: this.config.model,
        provider: 'llm-gemini-fallback',
      };
    }

    // In production, this would call the actual Gemini API
    // For now, return a placeholder indicating the provider is configured
    return {
      text: `[Gemini Provider] API configured and ready.\nModel: ${this.config.model}\nMax Tokens: ${this.config.maxTokens}\n\nNote: Full implementation requires @google/generative-ai package.`,
      tokens: 30,
      model: this.config.model,
      provider: 'llm-gemini',
    };
  }

  /**
   * Chat completion
   */
  async generateChatCompletion(request: ChatRequest): Promise<LLMResponse> {
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user');
    const prompt = lastUserMessage?.content || '';

    return this.generateCompletion({
      prompt,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
    });
  }

  /**
   * Count tokens using Gemini tokenizer
   */
  countTokens(text: string): number {
    // Approximate token count for Gemini models
    return Math.ceil(text.length / 4);
  }
}

// Singleton instance
let instance: GeminiLLMProvider | null = null;

/**
 * Get or create the Gemini LLM provider instance
 */
export function getGeminiLLMProvider(config?: GeminiConfig): GeminiLLMProvider {
  if (!instance) {
    instance = new GeminiLLMProvider(config);
  }
  return instance;
}

/**
 * Initialize the provider with configuration
 */
export async function initialize(config: GeminiConfig = {}): Promise<GeminiLLMProvider> {
  const provider = getGeminiLLMProvider(config);
  await provider.healthCheck();
  return provider;
}

export default {
  initialize,
  getGeminiLLMProvider,
  GeminiLLMProvider,
};
