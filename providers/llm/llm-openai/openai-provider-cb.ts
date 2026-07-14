/**
 * 🤖 MyCodexVantaOS - OpenAI LLM Provider (CapabilityBase-based)
 *
 * Official OpenAI API integration with native fallback.
 *
 * @module providers/llm/llm-openai
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

/**
 * Configuration for OpenAI LLM Provider
 */
export interface OpenAIConfig {
  /** OpenAI API key */
  apiKey?: string;

  /** OpenAI base URL (for custom endpoints) */
  baseURL?: string;

  /** Model to use (default: gpt-3.5-turbo) */
  model?: string;

  /** Organization ID */
  organization?: string;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Maximum tokens for response */
  maxTokens?: number;

  /** Temperature for randomness (0-2) */
  temperature?: number;

  /** Whether to use streaming */
  stream?: boolean;

  /** Number of retries on failure */
  retries?: number;

  /** Native fallback provider ID */
  fallbackProviderId?: string;
}

/**
 * OpenAI chat message
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM request interface
 */
export interface LLMRequest {
  /** The prompt to generate response for */
  prompt?: string;

  /** Chat messages for chat completion */
  messages?: ChatMessage[];

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature for randomness (0-2) */
  temperature?: number;

  /** Whether to stream response */
  stream?: boolean;

  /** Response format (e.g., { type: "json_object" }) */
  responseFormat?: any;
}

/**
 * LLM response interface
 */
export interface LLMResponse {
  /** Generated response text */
  text: string;

  /** Number of tokens generated */
  tokens: number;

  /** Total tokens (prompt + completion) */
  totalTokens: number;

  /** Model identifier */
  model: string;

  /** Provider name */
  provider: string;

  /** Generation time in milliseconds */
  generationTime: number;

  /** Whether response was streamed */
  streamed: boolean;

  /** Finish reason */
  finishReason?: string;
}

/**
 * 🤖 OpenAI LLM Provider
 *
 * Official OpenAI API integration with native fallback capability.
 */
export class OpenAILLMProvider extends CapabilityBase<OpenAIConfig> {
  private baseURL: string;
  private model: string;
  private organization: string;
  private timeout: number;
  private maxTokens: number;
  private temperature: number;
  private enableStreaming: boolean;
  private retries: number;
  private fallbackProviderId: string = 'native';

  private isOpenAIAvailable: boolean = false;
  private apiKey: string | undefined;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<OpenAIConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);

    const cfg = config.config;
    this.apiKey = cfg.apiKey;
    this.baseURL = cfg.baseURL || 'https://api.openai.com/v1';
    this.model = cfg.model || 'gpt-3.5-turbo';
    this.organization = cfg.organization || '';
    this.timeout = cfg.timeout || 30000;
    this.maxTokens = cfg.maxTokens || 2048;
    this.temperature = cfg.temperature ?? 0.7;
    this.enableStreaming = cfg.stream ?? true;
    this.retries = cfg.retries || 3;
  }

  /**
   * Initialize the OpenAI provider
   */
  protected async doInitialize(): Promise<void> {
    if (!this.apiKey) {
      this.log('warn', 'OpenAI API key not provided - will use native fallback');
      this.isOpenAIAvailable = false;
      return;
    }

    try {
      // Try a simple API call to validate credentials
      await this.checkOpenAIAvailability();

      if (this.isOpenAIAvailable) {
        this.log('info', `OpenAI provider initialized with model ${this.model}`);
        this.log('info', `Configuration - baseURL: ${this.baseURL}, timeout: ${this.timeout}ms`);
      } else {
        this.log('warn', 'OpenAI API validation failed - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'OpenAI initialization failed:', error);
      this.isOpenAIAvailable = false;
    }
  }

  /**
   * Check if OpenAI API is available
   */
  private async checkOpenAIAvailability(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (response.ok) {
        this.isOpenAIAvailable = true;
        return true;
      }

      this.isOpenAIAvailable = false;
      return false;
    } catch (error) {
      this.isOpenAIAvailable = false;
      return false;
    }
  }

  /**
   * Health check for OpenAI provider
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

    const available = await this.checkOpenAIAvailability();

    if (!available) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'OpenAI API not available',
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
    this.log('info', 'OpenAI LLM provider shutdown');
  }

  /**
   * Generate a response
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    if (!this.isOpenAIAvailable || !this.apiKey) {
      this.recordFailure(new Error('OpenAI not available'));
      throw new Error(
        `OpenAI service not available. Use fallback provider: ${this.fallbackProviderId}`
      );
    }

    try {
      const response = await this.generateWithRetry(request);
      const generationTime = Date.now() - startTime;

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
   * Actual generation logic
   */
  private async doGenerate(request: LLMRequest): Promise<LLMResponse> {
    if (request.messages && request.messages.length > 0) {
      return this.chatCompletion(request.messages, request);
    } else if (request.prompt) {
      return this.textCompletion(request.prompt, request);
    } else {
      throw new Error('Either prompt or messages must be provided');
    }
  }

  /**
   * Text completion
   */
  private async textCompletion(prompt: string, options: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.baseURL}/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(this.organization ? { 'OpenAI-Organization': this.organization } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        max_tokens: options.maxTokens ?? this.maxTokens,
        temperature: options.temperature ?? this.temperature,
        stream: options.stream ?? this.enableStreaming,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      text: data.choices[0]?.text || '',
      tokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
      model: data.model,
      provider: this.name,
      generationTime: 0,
      streamed: false,
      finishReason: data.choices[0]?.finish_reason,
    };
  }

  /**
   * Chat completion
   */
  private async chatCompletion(messages: ChatMessage[], options: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(this.organization ? { 'OpenAI-Organization': this.organization } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        max_tokens: options.maxTokens ?? this.maxTokens,
        temperature: options.temperature ?? this.temperature,
        stream: false,
        response_format: options.responseFormat,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      text: data.choices[0]?.message?.content || '',
      tokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
      model: data.model,
      provider: this.name,
      generationTime: 0,
      streamed: false,
      finishReason: data.choices[0]?.finish_reason,
    };
  }

  /**
   * Stream a response
   */
  async *stream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    if (!this.isOpenAIAvailable || !this.apiKey) {
      throw new Error('OpenAI service not available');
    }

    const messages =
      request.messages || (request.prompt ? [{ role: 'user', content: request.prompt }] : []);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(this.organization ? { 'OpenAI-Organization': this.organization } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        max_tokens: request.maxTokens ?? this.maxTokens,
        temperature: request.temperature ?? this.temperature,
        stream: true,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
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
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (error) {
            // Ignore JSON parse errors in stream
          }
        }
      }
    }
  }

  /**
   * List available models from OpenAI
   */
  async listModels(): Promise<string[]> {
    if (!this.isOpenAIAvailable || !this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data?.map((m: { id: string }) => m.id) || [];
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
      type: 'openai',
      model: this.model,
      baseURL: this.baseURL,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      available: this.isOpenAIAvailable,
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
export { OpenAILLMProvider as default };
