/**
 * 🔒 MyCodexVantaOS - Cohere Embedding Provider (CapabilityBase-based)
 *
 * Cohere embedding API integration with native fallback.
 *
 * @module providers/embedding/embedding-cohere
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

/**
 * Configuration for Cohere Embedding Provider
 */
export interface CohereEmbeddingConfig {
  /** Cohere API key */
  apiKey?: string;

  /** Base URL for custom endpoints */
  baseURL?: string;

  /** Model to use (default: embed-english-v3.0) */
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

  /** Input type */
  inputType?: 'search_document' | 'search_query' | 'classification' | 'clustering';
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
 * 🔒 Cohere Embedding Provider
 *
 * Cohere embedding API integration with native fallback capability.
 */
export class CohereEmbeddingProvider extends CapabilityBase<CohereEmbeddingConfig> {
  private baseURL: string;
  private model: string;
  private dimensions: number;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';

  private isCohereAvailable: boolean = false;
  private apiKey: string | undefined;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<CohereEmbeddingConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);

    const cfg = config.config;
    this.apiKey = cfg.apiKey;
    this.baseURL = cfg.baseURL || 'https://api.cohere.ai/v1';
    this.model = cfg.model || 'embed-english-v3.0';
    this.dimensions = cfg.dimensions || 1024;
    this.timeout = cfg.timeout || 30000;
    this.retries = cfg.retries || 3;
  }

  /**
   * Initialize the Cohere embedding provider
   */
  protected async doInitialize(): Promise<void> {
    if (!this.apiKey) {
      this.log('warn', 'Cohere API key not provided - will use native fallback');
      this.isCohereAvailable = false;
      return;
    }

    try {
      await this.checkCohereAvailability();

      if (this.isCohereAvailable) {
        this.log('info', `Cohere embedding provider initialized with model ${this.model}`);
      } else {
        this.log('warn', 'Cohere API validation failed - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Cohere initialization failed:', error);
      this.isCohereAvailable = false;
    }
  }

  /**
   * Check if Cohere API is available
   */
  private async checkCohereAvailability(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseURL}/embed`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: ['test'],
          model: this.model,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      this.isCohereAvailable = response.ok;
      return response.ok;
    } catch {
      this.isCohereAvailable = false;
      return false;
    }
  }

  /**
   * Health check for Cohere embedding provider
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

    const available = await this.checkCohereAvailability();

    if (!available) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'Cohere API not available',
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
    this.log('info', 'Cohere Embedding provider shutdown');
  }

  /**
   * Generate embedding
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = Date.now();

    if (!this.isCohereAvailable || !this.apiKey) {
      this.recordFailure(new Error('Cohere not available'));
      throw new Error(
        `Cohere service not available. Use fallback provider: ${this.fallbackProviderId}`
      );
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
          await new Promise((resolve) => setTimeout(resolve, delay));
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
      texts: [request.text],
      model: this.model,
      input_type: request.inputType || 'search_document',
    };

    if (request.dimensions || this.dimensions) {
      requestBody.embedding_types = ['float'];
    }

    const response = await fetch(`${this.baseURL}/embed`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      embedding: data.embeddings?.[0]?.float || data.embeddings?.[0] || [],
      dimensions: data.embeddings?.[0]?.float?.length || data.embeddings?.[0]?.length || 0,
      model: this.model,
      provider: this.name,
      generationTime: 0,
      tokens: data.meta?.billed_units?.input_tokens,
    };
  }

  /**
   * Batch embed multiple texts
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    const startTime = Date.now();

    if (!this.isCohereAvailable || !this.apiKey) {
      this.recordFailure(new Error('Cohere not available'));
      throw new Error(
        `Cohere service not available. Use fallback provider: ${this.fallbackProviderId}`
      );
    }

    try {
      const response = await fetch(`${this.baseURL}/embed`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: texts,
          model: this.model,
          input_type: 'search_document',
          embedding_types: ['float'],
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cohere API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      this.recordSuccess(generationTime);

      return data.embeddings.map((item: any) => ({
        embedding: item.float || item,
        dimensions: (item.float || item).length,
        model: this.model,
        provider: this.name,
        generationTime: generationTime / texts.length,
        tokens: data.meta?.billed_units?.input_tokens,
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
      type: 'cohere-embedding',
      model: this.model,
      baseURL: this.baseURL,
      dimensions: this.dimensions,
      available: this.isCohereAvailable,
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
export { CohereEmbeddingProvider as default };
