/**
 * 🧠 MyCodeXvantaOS - Anthropic LLM Provider (CapabilityBase-based)
 *
 * Anthropic Claude API integration with native fallback.
 *
 * @module providers/llm/llm-anthropic
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

/**
 * Configuration for Anthropic LLM Provider
 */
export interface AnthropicConfig {
  /** Anthropic API key */
  apiKey?: string;
  
  /** Model to use (default: claude-3-sonnet-20240229) */
  model?: string;
  
  /** API version */
  version?: string;
  
  /** Base URL for custom endpoints */
  baseURL?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Maximum tokens for response */
  maxTokens?: number;
  
  /** Temperature for randomness (0-1) */
  temperature?: number;
  
  /** Top-p nucleus sampling */
  topP?: number;
  
  /** Top-k sampling */
  topK?: number;
  
  /** Whether to use streaming */
  stream?: boolean;
  
  /** Number of retries on failure */
  retries?: number;
  
  /** Native fallback provider ID */
  fallbackProviderId?: string;
}

/**
 * Anthropic message
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * LLM request interface
 */
export interface LLMRequest {
  /** The prompt to generate response for */
  prompt?: string;
  
  /** Chat messages for conversation */
  messages?: Message[];
  
  /** Maximum tokens to generate */
  maxTokens?: number;
  
  /** Temperature for randomness (0-1) */
  temperature?: number;
  
  /** Top-p nucleus sampling */
  topP?: number;
  
  /** Top-k sampling */
  topK?: number;
  
  /** Whether to stream response */
  stream?: boolean;
  
  /** System prompt */
  system?: string;
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
  
  /** Stop reason */
  stopReason?: string;
}

/**
 * 🧠 Anthropic LLM Provider
 *
 * Anthropic Claude API integration with native fallback capability.
 */
export class AnthropicLLMProvider extends CapabilityBase<AnthropicConfig> {
  private baseURL: string;
  private version: string;
  private model: string;
  private timeout: number;
  private maxTokens: number;
  private temperature: number;
  private topP: number;
  private topK: number;
  private enableStreaming: boolean;
  private retries: number;
  private fallbackProviderId: string = 'native';
  
  private isAnthropicAvailable: boolean = false;
  private apiKey: string | undefined;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<AnthropicConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);
    
    const cfg = config.config;
    this.apiKey = cfg.apiKey;
    this.baseURL = cfg.baseURL || 'https://api.anthropic.com/v1/messages';
    this.version = cfg.version || '2023-06-01';
    this.model = cfg.model || 'claude-3-sonnet-20240229';
    this.timeout = cfg.timeout || 60000;
    this.maxTokens = cfg.maxTokens || 2048;
    this.temperature = cfg.temperature ?? 0.7;
    this.topP = cfg.topP ?? 1.0;
    this.topK = cfg.topK ?? 0;
    this.enableStreaming = cfg.stream ?? true;
    this.retries = cfg.retries || 3;
  }

  /**
   * Initialize the Anthropic provider
   */
  protected async doInitialize(): Promise<void> {
    if (!this.apiKey) {
      this.log('warn', 'Anthropic API key not provided - will use native fallback');
      this.isAnthropicAvailable = false;
      return;
    }

    try {
      await this.checkAnthropicAvailability();
      
      if (this.isAnthropicAvailable) {
        this.log('info', `Anthropic provider initialized with model ${this.model}`);
        this.log('info', `Configuration - baseURL: ${this.baseURL}, timeout: ${this.timeout}ms`);
      } else {
        this.log('warn', 'Anthropic API validation failed - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Anthropic initialization failed:', error);
      this.isAnthropicAvailable = false;
    }
  }

  /**
   * Check if Anthropic API is available
   */
  private async checkAnthropicAvailability(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey || '',
          'anthropic-version': this.version,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (response.ok || response.status === 400) {
        this.isAnthropicAvailable = true;
        return true;
      }
      
      this.isAnthropicAvailable = false;
      return false;
    } catch {
      this.isAnthropicAvailable = false;
      return false;
    }
  }

  /**
   * Health check for Anthropic provider
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

    const available = await this.checkAnthropicAvailability();

    if (!available) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'Anthropic API not available',
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
    this.log('info', 'Anthropic LLM provider shutdown');
  }

  /**
   * Generate a response
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    if (!this.isAnthropicAvailable || !this.apiKey) {
      this.recordFailure(new Error('Anthropic not available'));
      throw new Error(`Anthropic service not available. Use fallback provider: ${this.fallbackProviderId}`);
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
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Unknown error during generation');
  }

  /**
   * Actual generation logic
   */
  private async doGenerate(request: LLMRequest): Promise<LLMResponse> {
    const messages = request.messages || [];
    
    if (!messages.length && request.prompt) {
      messages.push({ role: 'user', content: request.prompt });
    }

    if (!messages.length) {
      throw new Error('No messages provided');
    }

    const requestBody: any = {
      model: this.model,
      max_tokens: request.maxTokens ?? this.maxTokens,
      messages: messages,
    };

    if (request.temperature !== undefined) {
      requestBody.temperature = request.temperature;
    }
    if (request.topP !== undefined) {
      requestBody.top_p = request.topP;
    }
    if (request.topK !== undefined) {
      requestBody.top_k = request.topK;
    }
    if (request.system) {
      requestBody.system = request.system;
    }

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey || '',
        'anthropic-version': this.version,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      text: data.content?.[0]?.text || '',
      tokens: data.usage?.output_tokens || 0,
      totalTokens: data.usage?.input_tokens + data.usage?.output_tokens || 0,
      model: data.model,
      provider: this.name,
      generationTime: 0,
      streamed: false,
      stopReason: data.stop_reason,
    };
  }

  /**
   * Stream a response
   */
  async *stream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    if (!this.isAnthropicAvailable || !this.apiKey) {
      throw new Error('Anthropic service not available');
    }

    const messages = request.messages || [];
    if (!messages.length && request.prompt) {
      messages.push({ role: 'user', content: request.prompt });
    }

    const requestBody: any = {
      model: this.model,
      max_tokens: request.maxTokens ?? this.maxTokens,
      messages: messages,
      stream: true,
    };

    if (request.temperature !== undefined) {
      requestBody.temperature = request.temperature;
    }
    if (request.topP !== undefined) {
      requestBody.top_p = request.topP;
    }
    if (request.topK !== undefined) {
      requestBody.top_k = request.topK;
    }
    if (request.system) {
      requestBody.system = request.system;
    }

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey || '',
        'anthropic-version': this.version,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
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
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'content_block_delta') {
              yield parsed.delta?.text || '';
            }
          } catch (error) {
            // Ignore JSON parse errors in stream
          }
        }
      }
    }
  }

  /**
   * Get provider info
   */
  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'anthropic',
      model: this.model,
      baseURL: this.baseURL,
      version: this.version,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      available: this.isAnthropicAvailable,
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
export { AnthropicLLMProvider as default };