/**
 * 🔒 MyCodeXvantaOS - Cloudflare Workers AI Provider (CapabilityBase-based)
 *
 * Cloudflare Workers AI API integration with native fallback.
 *
 * @module providers/external/workers-ai
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

/**
 * Configuration for Workers AI Provider
 */
export interface WorkersAIConfig {
  /** Cloudflare account ID */
  accountId?: string;
  
  /** Cloudflare API key */
  apiKey?: string;
  
  /** Base URL for custom endpoints */
  baseURL?: string;
  
  /** Model to use */
  model?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Number of retries on failure */
  retries?: number;
  
  /** Native fallback provider ID */
  fallbackProviderId?: string;
}

/**
 * LLM request for Workers AI
 */
export interface WorkersAILLMRequest {
  /** Prompt text */
  prompt: string;
  
  /** Maximum tokens to generate */
  maxTokens?: number;
  
  /** Temperature for generation (0-1) */
  temperature?: number;
  
  /** Top-p sampling */
  topP?: number;
  
  /** Top-k sampling */
  topK?: number;
  
  /** Stop sequences */
  stop?: string[];
  
  /** Streaming mode */
  stream?: boolean;
}

/**
 * LLM response from Workers AI
 */
export interface WorkersAILLMResponse {
  /** Generated text */
  text: string;
  
  /** Model used */
  model: string;
  
  /** Provider name */
  provider: string;
  
  /** Generation time in milliseconds */
  generationTime: number;
  
  /** Total tokens used */
  tokens?: number;
  
  /** Prompt tokens */
  promptTokens?: number;
  
  /** Completion tokens */
  completionTokens?: number;
  
  /** Finish reason */
  finishReason?: string;
}

/**
 * Embedding request for Workers AI
 */
export interface WorkersAIEmbeddingRequest {
  /** Text to embed */
  text: string;
}

/**
 * Embedding response from Workers AI
 */
export interface WorkersAIEmbeddingResponse {
  /** Embedding vector */
  embedding: number[];
  
  /** Number of dimensions */
  dimensions: number;
  
  /** Model used */
  model: string;
  
  /** Provider name */
  provider: string;
  
  /** Generation time in milliseconds */
  generationTime: number;
}

/**
 * 🔒 Cloudflare Workers AI Provider
 *
 * Workers AI API integration with native fallback capability.
 */
export class WorkersAIProvider extends CapabilityBase<WorkersAIConfig> {
  private baseURL: string;
  private model: string;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  
  private isWorkersAIAvailable: boolean = false;
  private accountId: string | undefined;
  private apiKey: string | undefined;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<WorkersAIConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);
    
    const cfg = config.config;
    this.accountId = cfg.accountId;
    this.apiKey = cfg.apiKey;
    this.model = cfg.model || '@cf/meta/llama-3.3-70b-instruct';
    this.timeout = cfg.timeout || 30000;
    this.retries = cfg.retries || 3;
    this.baseURL = cfg.baseURL || `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run`;
  }

  /**
   * Initialize the Workers AI provider
   */
  protected async doInitialize(): Promise<void> {
    if (!this.apiKey || !this.accountId) {
      this.log('warn', 'Workers AI credentials not provided - will use native fallback');
      this.isWorkersAIAvailable = false;
      return;
    }

    try {
      await this.checkWorkersAIAvailability();
      
      if (this.isWorkersAIAvailable) {
        this.log('info', `Workers AI provider initialized with model ${this.model}`);
      } else {
        this.log('warn', 'Workers AI API validation failed - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Workers AI initialization failed:', error);
      this.isWorkersAIAvailable = false;
    }
  }

  /**
   * Check if Workers AI API is available
   */
  private async checkWorkersAIAvailability(): Promise<boolean> {
    if (!this.apiKey || !this.accountId) return false;

    try {
      const response = await fetch(`${this.baseURL}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'test' }),
        signal: AbortSignal.timeout(this.timeout),
      });

      this.isWorkersAIAvailable = response.ok || response.status === 400; // 400 might be valid API but bad prompt
      return this.isWorkersAIAvailable;
    } catch {
      this.isWorkersAIAvailable = false;
      return false;
    }
  }

  /**
   * Health check for Workers AI provider
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    if (!this.apiKey || !this.accountId) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.DEGRADED,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'Credentials not provided',
        },
      };
    }

    const available = await this.checkWorkersAIAvailability();

    if (!available) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'Workers AI API not available',
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
    this.log('info', 'Workers AI provider shutdown');
  }

  /**
   * Generate text completion
   */
  async generate(request: WorkersAILLMRequest): Promise<WorkersAILLMResponse> {
    const startTime = Date.now();
    
    if (!this.isWorkersAIAvailable || !this.apiKey || !this.accountId) {
      this.recordFailure(new Error('Workers AI not available'));
      throw new Error(`Workers AI service not available. Use fallback provider: ${this.fallbackProviderId}`);
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
  private async generateWithRetry(request: WorkersAILLMRequest): Promise<WorkersAILLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await this.doGenerate(request);
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Generate attempt ${attempt}/${this.retries} failed:`, error);

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
  private async doGenerate(request: WorkersAILLMRequest): Promise<WorkersAILLMResponse> {
    const requestBody: any = {
      prompt: request.prompt,
    };

    if (request.maxTokens !== undefined) {
      requestBody.max_tokens = request.maxTokens;
    }
    if (request.temperature !== undefined) {
      requestBody.temperature = request.temperature;
    }
    if (request.topP !== undefined) {
      requestBody.top_p = request.topP;
    }
    if (request.topK !== undefined) {
      requestBody.top_k = request.topK;
    }
    if (request.stop) {
      requestBody.stop = request.stop;
    }

    const response = await fetch(`${this.baseURL}/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Workers AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      text: data.response || '',
      model: this.model,
      provider: this.name,
      generationTime: 0,
      tokens: data.usage?.total_tokens,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      finishReason: data.finish_reason,
    };
  }

  /**
   * Stream text completion
   */
  async *stream(request: WorkersAILLMRequest): AsyncGenerator<string, void, unknown> {
    if (!this.isWorkersAIAvailable || !this.apiKey || !this.accountId) {
      this.recordFailure(new Error('Workers AI not available'));
      throw new Error(`Workers AI service not available. Use fallback provider: ${this.fallbackProviderId}`);
    }

    const startTime = Date.now();
    const requestBody: any = {
      prompt: request.prompt,
      stream: true,
    };

    if (request.maxTokens !== undefined) {
      requestBody.max_tokens = request.maxTokens;
    }
    if (request.temperature !== undefined) {
      requestBody.temperature = request.temperature;
    }

    try {
      const response = await fetch(`${this.baseURL}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Workers AI API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            const data = line.trim().slice(6);
            if (data === '[DONE]') {
              this.recordSuccess(Date.now() - startTime);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.response || '';
              if (chunk) {
                yield chunk;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      this.recordSuccess(Date.now() - startTime);
    } catch (error) {
      this.recordFailure(error);
      throw error;
    }
  }

  /**
   * Generate embedding
   */
  async embed(request: WorkersAIEmbeddingRequest): Promise<WorkersAIEmbeddingResponse> {
    const startTime = Date.now();
    
    if (!this.isWorkersAIAvailable || !this.apiKey || !this.accountId) {
      this.recordFailure(new Error('Workers AI not available'));
      throw new Error(`Workers AI service not available. Use fallback provider: ${this.fallbackProviderId}`);
    }

    try {
      const embeddingModel = '@cf/baai/bge-base-en-v1.5';
      const response = await fetch(`${this.baseURL}/${embeddingModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Workers AI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;
      
      this.recordSuccess(generationTime);

      return {
        embedding: data.result?.[0] || [],
        dimensions: data.result?.[0]?.length || 0,
        model: embeddingModel,
        provider: this.name,
        generationTime,
      };
    } catch (error) {
      this.recordFailure(error);
      throw error;
    }
  }

  /**
   * Get provider info
   */
  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'workers-ai',
      model: this.model,
      baseURL: this.baseURL,
      accountId: this.accountId,
      available: this.isWorkersAIAvailable,
      hasCredentials: !!(this.apiKey && this.accountId),
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
export { WorkersAIProvider as default };