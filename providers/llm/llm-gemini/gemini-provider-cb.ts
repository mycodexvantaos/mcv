/**
 * ✨ MyCodexVantaOS - Gemini LLM Provider (CapabilityBase-based)
 *
 * Google Gemini API integration with native fallback.
 *
 * @module providers/llm/llm-gemini
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

/**
 * Configuration for Gemini LLM Provider
 */
export interface GeminiConfig {
  /** Google API key */
  apiKey?: string;

  /** Model to use (default: gemini-pro) */
  model?: string;

  /** Base URL for custom endpoints */
  baseURL?: string;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Maximum tokens for response */
  maxTokens?: number;

  /** Temperature for randomness (0-2) */
  temperature?: number;

  /** Top-k sampling */
  topK?: number;

  /** Top-p nucleus sampling */
  topP?: number;

  /** Whether to use streaming */
  stream?: boolean;

  /** Number of retries on failure */
  retries?: number;

  /** Native fallback provider ID */
  fallbackProviderId?: string;
}

/**
 * Gemini content part
 */
export interface ContentPart {
  text?: string;
}

/**
 * Gemini content
 */
export interface Content {
  role: 'user' | 'model';
  parts: ContentPart[];
}

/**
 * LLM request interface
 */
export interface LLMRequest {
  /** The prompt to generate response for */
  prompt?: string;

  /** Chat history */
  history?: Content[];

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature for randomness (0-2) */
  temperature?: number;

  /** Top-k sampling */
  topK?: number;

  /** Top-p nucleus sampling */
  topP?: number;

  /** Whether to stream response */
  stream?: boolean;
}

/**
 * LLM response interface
 */
export interface LLMResponse {
  /** Generated response text */
  text: string;

  /** Number of tokens generated */
  tokens: number;

  /** Model identifier */
  model: string;

  /** Provider name */
  provider: string;

  /** Generation time in milliseconds */
  generationTime: number;

  /** Whether response was streamed */
  streamed: boolean;

  /** Safety ratings */
  safetyRatings?: any[];
}

/**
 * ✨ Gemini LLM Provider
 *
 * Google Gemini API integration with native fallback capability.
 */
export class GeminiLLMProvider extends CapabilityBase<GeminiConfig> {
  private baseURL: string;
  private model: string;
  private timeout: number;
  private maxTokens: number;
  private temperature: number;
  private topK: number;
  private topP: number;
  private enableStreaming: boolean;
  private retries: number;
  private fallbackProviderId: string = 'native';

  private isGeminiAvailable: boolean = false;
  private apiKey: string | undefined;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<GeminiConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);

    const cfg = config.config;
    this.apiKey = cfg.apiKey;
    this.baseURL = cfg.baseURL || 'https://generativelanguage.googleapis.com/v1beta';
    this.model = cfg.model || 'gemini-pro';
    this.timeout = cfg.timeout || 30000;
    this.maxTokens = cfg.maxTokens || 2048;
    this.temperature = cfg.temperature ?? 0.7;
    this.topK = cfg.topK || 40;
    this.topP = cfg.topP ?? 0.95;
    this.enableStreaming = cfg.stream ?? true;
    this.retries = cfg.retries || 3;
  }

  /**
   * Initialize the Gemini provider
   */
  protected async doInitialize(): Promise<void> {
    if (!this.apiKey) {
      this.log('warn', 'Gemini API key not provided - will use native fallback');
      this.isGeminiAvailable = false;
      return;
    }

    try {
      await this.checkGeminiAvailability();

      if (this.isGeminiAvailable) {
        this.log('info', `Gemini provider initialized with model ${this.model}`);
        this.log('info', `Configuration - baseURL: ${this.baseURL}, timeout: ${this.timeout}ms`);
      } else {
        this.log('warn', 'Gemini API validation failed - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Gemini initialization failed:', error);
      this.isGeminiAvailable = false;
    }
  }

  /**
   * Check if Gemini API is available
   */
  private async checkGeminiAvailability(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseURL}/models?key=${this.apiKey}`, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (response.ok) {
        this.isGeminiAvailable = true;
        return true;
      }

      this.isGeminiAvailable = false;
      return false;
    } catch {
      this.isGeminiAvailable = false;
      return false;
    }
  }

  /**
   * Health check for Gemini provider
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    if (!this.apiKey) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.DEGRADED,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'API key not provided',
        },
      };
    }

    const available = await this.checkGeminiAvailability();

    if (!available) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'Gemini API not available',
        },
      };
    }

    return {
      isHealthy: true,
      status: ProviderHealthStatus.HEALTHY,
      checkTime: new Date().toISOString(),
      metrics: {},
    };
  }

  /**
   * Shutdown the provider
   */
  protected async doShutdown(): Promise<void> {
    this.log('info', 'Gemini LLM provider shutdown');
  }

  /**
   * Generate a response
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    if (!this.isGeminiAvailable || !this.apiKey) {
      this.recordFailure(new Error('Gemini not available'));
      throw new Error(
        `Gemini service not available. Use fallback provider: ${this.fallbackProviderId}`
      );
    }

    try {
      const response = await this.generateWithRetry(request);
      const generationTime = Date.now() - startTime;
      response.generationTime = generationTime;

      this.recordSuccess(generationTime);
      return response;
    } catch (error) {
      const generationTime = Date.now() - startTime;
      this.recordFailure(error);
      throw error;
    }
  }

  /**
   * Generate with retry logic
   */
  private async generateWithRetry(request: LLMRequest): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await this.doGenerate(request);
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Generation attempt ${attempt}/${this.retries} failed:`, error);

        if (attempt < this.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Unknown error during generation');
  }

  /**
   * Build Gemini API URL
   */
  private getApiURL(): string {
    const encodedModel = encodeURIComponent(this.model);
    return `${this.baseURL}/models/${encodedModel}:generateContent?key=${this.apiKey}`;
  }

  /**
   * Actual generation logic
   */
  private async doGenerate(request: LLMRequest): Promise<LLMResponse> {
    const content: Content = {
      role: 'user',
      parts: [{ text: request.prompt || '' }],
    };

    const requestBody: any = {
      contents: [content],
      generationConfig: {
        temperature: request.temperature ?? this.temperature,
        maxOutputTokens: request.maxTokens ?? this.maxTokens,
        topK: request.topK ?? this.topK,
        topP: request.topP ?? this.topP,
      },
    };

    if (request.history && request.history.length > 0) {
      requestBody.contents.unshift(...request.history);
    }

    const response = await fetch(this.getApiURL(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      text,
      tokens: Math.ceil(text.length / 4),
      model: this.model,
      provider: this.name,
      generationTime: 0,
      streamed: false,
      safetyRatings: data.candidates?.[0]?.safetyRatings,
    };
  }

  /**
   * Stream a response
   */
  async *stream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    if (!this.isGeminiAvailable || !this.apiKey) {
      throw new Error('Gemini service not available');
    }

    const content: Content = {
      role: 'user',
      parts: [{ text: request.prompt || '' }],
    };

    const requestBody: any = {
      contents: [content],
      generationConfig: {
        temperature: request.temperature ?? this.temperature,
        maxOutputTokens: request.maxTokens ?? this.maxTokens,
        topK: request.topK ?? this.topK,
        topP: request.topP ?? this.topP,
      },
    };

    if (request.history && request.history.length > 0) {
      requestBody.contents.unshift(...request.history);
    }

    const streamUrl = this.getApiURL().replace('generateContent', 'streamGenerateContent');

    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            yield text;
          }
        } catch (error) {
          // Ignore JSON parse errors in stream
        }
      }
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    if (!this.isGeminiAvailable || !this.apiKey) return [];

    try {
      const response = await fetch(`${this.baseURL}/models?key=${this.apiKey}`, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get provider info
   */
  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'gemini',
      model: this.model,
      baseURL: this.baseURL,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      available: this.isGeminiAvailable,
      hasApiKey: !!this.apiKey,
      fallbackProvider: this.fallbackProviderId,
      status: this._status,
      isInitialized: this._isInitialized,
      metrics: this.metrics,
    };
  }
}

/**
 * Default export
 */
export { GeminiLLMProvider as default };
