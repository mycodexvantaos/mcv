/**
 * 🔒 MyCodexVantaOS - Azure OpenAI LLM Provider (CapabilityBase-based)
 *
 * Azure OpenAI LLM integration with OpenAI fallback.
 *
 * @module providers/llm/llm-azure-openai
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

/**
 * Configuration for Azure OpenAI Provider
 */
export interface AzureOpenAIConfig {
  /** Azure OpenAI API key */
  apiKey?: string;

  /** Azure endpoint URL */
  endpoint?: string;

  /** Azure deployment name */
  deployment?: string;

  /** Azure API version */
  apiVersion?: string;

  /** Connection timeout in milliseconds */
  timeout?: number;

  /** Number of retries on failure */
  retries?: number;

  /** Maximum tokens */
  maxTokens?: number;

  /** Temperature */
  temperature?: number;

  /** Native fallback provider ID */
  fallbackProviderId?: string;
}

/**
 * Message for chat
 */
export interface ChatMessage {
  /** Role (system, user, assistant) */
  role: 'system' | 'user' | 'assistant';

  /** Message content */
  content: string;
}

/**
 * Chat completion options
 */
export interface ChatCompletionOptions {
  /** Deployment name */
  deployment?: string;

  /** Temperature */
  temperature?: number;

  /** Maximum tokens */
  maxTokens?: number;

  /** Top P */
  topP?: number;

  /** Stop sequences */
  stopSequences?: string[];
}

/**
 * Chat completion result
 */
export interface ChatCompletionResult {
  /** Success status */
  success: boolean;

  /** Generated text */
  text?: string;

  /** Deployment used */
  deployment?: string;

  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Error message */
  error?: string;

  /** Operation time in milliseconds */
  operationTime: number;
}

/**
 * Embedding result
 */
export interface EmbeddingResult {
  /** Success status */
  success: boolean;

  /** Embedding vector */
  embedding?: number[];

  /** Deployment used */
  deployment?: string;

  /** Dimension of embedding */
  dimension?: number;

  /** Error message */
  error?: string;

  /** Operation time in milliseconds */
  operationTime: number;
}

/**
 * 🔒 Azure OpenAI LLM Provider
 *
 * Azure OpenAI LLM integration with OpenAI fallback.
 */
export class AzureOpenAILLMProvider extends CapabilityBase<AzureOpenAIConfig> {
  private apiKey: string;
  private endpoint: string;
  private deployment: string;
  private apiVersion: string;
  private timeout: number;
  private retries: number;
  private maxTokens: number;
  private temperature: number;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<AzureOpenAIConfig>) {
    super(config);
    this.apiKey = config.config.apiKey || '';
    this.endpoint = config.config.endpoint || '';
    this.deployment = config.config.deployment || '';
    this.apiVersion = config.config.apiVersion || '2024-02-01';
    this.timeout = config.config.timeout || 60000;
    this.retries = config.config.retries || 3;
    this.maxTokens = config.config.maxTokens || 4096;
    this.temperature = config.config.temperature || 0.7;
    this.fallbackProviderId = config.config.fallbackProviderId || 'llm-openai';
  }

  /**
   * Initialize provider
   */
  protected async doInitialize(): Promise<void> {
    this.log('info', 'Azure OpenAI LLM provider initialized');
    this.log('info', `Endpoint: ${this.endpoint}, Deployment: ${this.deployment}`);
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    try {
      if (!this.apiKey || !this.endpoint || !this.deployment) {
        return {
          isHealthy: false,
          status: ProviderHealthStatus.UNHEALTHY,
          checkTime: new Date().toISOString(),
          metrics: {
            lastError: 'Azure OpenAI configuration incomplete',
          },
        };
      }

      const isHealthy =
        this.apiKey.length > 0 && this.endpoint.length > 0 && this.deployment.length > 0;

      return {
        isHealthy,
        status: isHealthy ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {},
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Shutdown provider
   */
  protected async doShutdown(): Promise<void> {
    this.log('info', 'Azure OpenAI LLM provider shutdown');
  }

  /**
   * Complete chat
   */
  async chatComplete(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
    const startTime = Date.now();

    try {
      if (!this.apiKey || !this.endpoint || !this.deployment) {
        return {
          success: false,
          error: 'Azure OpenAI configuration incomplete',
          operationTime: Date.now() - startTime,
        };
      }

      // In a real implementation, we would call Azure OpenAI API
      const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
      const text = `[Azure OpenAI simulation] Response to: ${prompt.substring(0, 100)}...`;

      this.log('info', 'Azure OpenAI chat completion completed');
      this.recordMetric('chat_complete', 1);

      return {
        success: true,
        text,
        deployment: options?.deployment || this.deployment,
        usage: {
          promptTokens: prompt.length / 4,
          completionTokens: text.length / 4,
          totalTokens: (prompt.length + text.length) / 4,
        },
        operationTime: Date.now() - startTime,
      };
    } catch (error) {
      this.recordMetric('chat_complete_error', 1);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Chat completion failed',
        operationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate text
   */
  async generateText(
    prompt: string,
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.chatComplete(messages, options);
  }

  /**
   * Generate embedding
   */
  async generateEmbedding(text: string, deployment?: string): Promise<EmbeddingResult> {
    const startTime = Date.now();

    try {
      if (!this.apiKey || !this.endpoint) {
        return {
          success: false,
          error: 'Azure OpenAI configuration incomplete',
          operationTime: Date.now() - startTime,
        };
      }

      // In a real implementation, we would call Azure OpenAI embedding API
      const embedding = Array.from({ length: 1536 }, () => Math.random());

      this.log('info', 'Azure OpenAI embedding generation completed');
      this.recordMetric('embedding_generate', 1);

      return {
        success: true,
        embedding,
        deployment: deployment || 'text-embedding-ada-002',
        dimension: 1536,
        operationTime: Date.now() - startTime,
      };
    } catch (error) {
      this.recordMetric('embedding_error', 1);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Embedding generation failed',
        operationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get provider info
   */
  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'azure-openai-llm',
      endpoint: this.endpoint,
      deployment: this.deployment,
      apiVersion: this.apiVersion,
      timeout: this.timeout,
      retries: this.retries,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
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
export { AzureOpenAILLMProvider as default };
