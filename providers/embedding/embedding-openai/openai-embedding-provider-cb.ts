/**
 * 🔢 MyCodeXvantaOS - OpenAI Embedding Provider (CapabilityBase-based)
 *
 * OpenAI embedding API integration with native fallback.
 *
 * @module providers/embedding/embedding-openai
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import type { ProviderConfig, ProviderHealthCheckResult, ProviderHealthStatus } from '../../../packages/capabilities/types';

/**
 * Configuration for OpenAI Embedding Provider
 */
export interface OpenAIEmbeddingConfig {
  /** OpenAI API key */
  apiKey?: string;
  
  /** Base URL for custom endpoints */
  baseURL?: string;
  
  /** Model to use (default: text-embedding-3-small) */
  model?: string;
  
  /** Embedding dimensions */
  dimensions?: number;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Number of retries on failure */
  retries?: number;
  
  /** Native fallback provider ID */
  fallbackProviderId?: string;
}

/**
 * Embedding request
 */
export interface EmbeddingRequest {
  /** Text to embed */
  text: string;
  
  /** Number of dimensions for output */
  dimensions?: number;
}

/**
 * Embedding response
 */
export interface EmbeddingResponse {
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
  
  /** Total tokens */
  tokens?: number;
}

/**
 * 🔢 OpenAI Embedding Provider
 *
 * OpenAI embedding API integration with native fallback capability.
 */
export class OpenAIEmbeddingProvider extends CapabilityBase<OpenAIEmbeddingConfig> {
  private baseURL: string;
  private model: string;
  private dimensions: number;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string;
  
  private isOpenAIAvailable: boolean = false;
  private apiKey: string | undefined;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<OpenAIEmbeddingConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);
    
    const cfg = config.config;
    this.apiKey = cfg.apiKey;
    this.baseURL = cfg.baseURL || 'https://api.openai.com/v1';
    this.model = cfg.model || 'text-embedding-3-small';
    this.dimensions = cfg.dimensions || 1536;
    this.timeout = cfg.timeout || 30000;
    this.retries = cfg.retries || 3;
    this.fallbackProviderId = cfg.fallbackProviderId || 'hybrid/embedding';
  }

  /**
   * Initialize the OpenAI embedding provider
   */
  protected async doInitialize(): Promise<void> {
    if (!this.apiKey) {
      this.log('warn', 'OpenAI API key not provided - will use native fallback');
      this.isOpenAIAvailable = false;
      return;
    }

    try {
      await this.checkOpenAIAvailability();
      
      if (this.isOpenAIAvailable) {
        this.log('info', `OpenAI embedding provider initialized with model ${this.model}`);
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
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      this.isOpenAIAvailable = response.ok;
      return response.ok;
    } catch {
      this.isOpenAIAvailable = false;
      return false;
    }
  }

  /**
   * Health check for OpenAI embedding provider
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    if (!this.apiKey) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.DEGRADED,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'API key not provided',
          hasFallback: !!this.fallbackProviderId,
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
          hasFallback: !!this.fallbackProviderId,
        },
      };
    }

    return {
      isHealthy: true,
      status: ProviderHealthStatus.HEALTHY,
      checkTime: new Date().toISOString(),
      metrics: {
        model: this.model,
        dimensions: this.dimensions,
        hasFallback: !!this.fallbackProviderId,
      },
    };
  }

  /**
   * Shutdown the provider
   */
  protected async doShutdown(): Promise<void> {
    this.log('info', 'OpenAI Embedding provider shutdown');
  }

  /**
   * Generate embedding
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = Date.now();
    
    if (!this.isOpenAIAvailable || !this.apiKey) {
      this.recordFailure(new Error('OpenAI not available'));
      throw new Error(`OpenAI service not available. Use fallback provider: ${this.fallbackProviderId}`);
    }

    try {
      const response = await this.embedWithRetry(request);
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
  private async embedWithRetry(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await this.doEmbed(request);
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Embed attempt ${attempt}/${this.retries} failed:`, error);

        if (attempt < this.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Unknown error during embedding');
  }

  /**
   * Actual embedding logic
   */
  private async doEmbed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const requestBody: any = {
      model: this.model,
      input: request.text,
    };

    if (request.dimensions || this.dimensions) {
      requestBody.dimensions = request.dimensions || this.dimensions;
    }

    const response = await fetch(`${this.baseURL}/embeddings`, {
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
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      embedding: data.data?.[0]?.embedding || [],
      dimensions: data.data?.[0]?.embedding?.length || 0,
      model: data.model,
      provider: this.name,
      generationTime: 0,
      tokens: data.usage?.total_tokens,
    };
  }

  /**
   * Batch embed multiple texts
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    const startTime = Date.now();
    
    if (!this.isOpenAIAvailable || !this.apiKey) {
      this.recordFailure(new Error('OpenAI not available'));
      throw new Error(`OpenAI service not available. Use fallback provider: ${this.fallbackProviderId}`);
    }

    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
          dimensions: this.dimensions,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;
      
      this.recordSuccess(generationTime);

      return data.data.map((item: any) => ({
        embedding: item.embedding,
        dimensions: item.embedding.length,
        model: data.model,
        provider: this.name,
        generationTime: generationTime / texts.length,
      }));
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
      type: 'openai-embedding',
      model: this.model,
      baseURL: this.baseURL,
      dimensions: this.dimensions,
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
export { OpenAIEmbeddingProvider as default };