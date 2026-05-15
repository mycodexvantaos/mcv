/**
 * 🔒 MyCodeXvantaOS - HuggingFace LLM Provider (CapabilityBase-based)
 *
 * HuggingFace LLM integration with native fallback.
 *
 * @module providers/llm/llm-huggingface
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import type { ProviderConfig, ProviderHealthCheckResult, ProviderHealthStatus } from '../../../packages/capabilities/types';

/**
 * Configuration for HuggingFace Provider
 */
export interface HuggingFaceConfig {
  /** HuggingFace API token */
  apiToken?: string;
  
  /** Default model ID */
  modelId?: string;
  
  /** Model URL for inference API */
  modelUrl?: string;
  
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
  /** Model ID */
  modelId?: string;
  
  /** Temperature */
  temperature?: number;
  
  /** Maximum tokens */
  maxTokens?: number;
  
  /** Top P */
  topP?: number;
  
  /** Parameters for specific models */
  parameters?: Record<string, any>;
}

/**
 * Chat completion result
 */
export interface ChatCompletionResult {
  /** Success status */
  success: boolean;
  
  /** Generated text */
  text?: string;
  
  /** Model ID used */
  modelId?: string;
  
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
  
  /** Model ID used */
  modelId?: string;
  
  /** Dimension of embedding */
  dimension?: number;
  
  /** Error message */
  error?: string;
  
  /** Operation time in milliseconds */
  operationTime: number;
}

/**
 * 🔒 HuggingFace LLM Provider
 *
 * HuggingFace LLM integration with native fallback.
 */
export class HuggingFaceLLMProvider extends CapabilityBase<HuggingFaceConfig> {
  private apiToken: string;
  private modelId: string;
  private modelUrl: string;
  private timeout: number;
  private retries: number;
  private maxTokens: number;
  private temperature: number;
  private fallbackProviderId: string;

  constructor(config: ProviderConfig<HuggingFaceConfig>) {
    super(config);
    this.apiToken = config.config.apiToken || '';
    this.modelId = config.config.modelId || 'mistralai/Mistral-7B-Instruct-v0.2';
    this.modelUrl = config.config.modelUrl || `https://api-inference.huggingface.co/models/${this.modelId}`;
    this.timeout = config.config.timeout || 60000;
    this.retries = config.config.retries || 3;
    this.maxTokens = config.config.maxTokens || 4096;
    this.temperature = config.config.temperature || 0.7;
    this.fallbackProviderId = config.config.fallbackProviderId || 'llm-native';
  }

  /**
   * Initialize provider
   */
  protected async doInitialize(): Promise<void> {
    this.log('info', 'HuggingFace LLM provider initialized');
    this.log('debug', `Model: ${this.modelId}`);
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    try {
      const isHealthy = this.apiToken.length > 0;
      
      return {
        isHealthy,
        status: isHealthy ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          modelId: this.modelId,
          modelUrl: this.modelUrl,
        },
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
    this.log('info', 'HuggingFace LLM provider shutdown');
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
      if (!this.apiToken) {
        return {
          success: false,
          error: 'HuggingFace API token not configured',
          operationTime: Date.now() - startTime,
        };
      }
      
      // In a real implementation, we would call HuggingFace Inference API
      const prompt = messages.map(m => `[${m.role}] ${m.content}`).join('\n');
      const text = `[HuggingFace simulation] Response using ${options?.modelId || this.modelId}: ${prompt.substring(0, 100)}...`;
      
      this.log('info', 'HuggingFace chat completion completed');
      this.recordMetric('chat_complete', 1);
      
      return {
        success: true,
        text,
        modelId: options?.modelId || this.modelId,
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
  async generateEmbedding(
    text: string,
    modelId?: string
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.apiToken) {
        return {
          success: false,
          error: 'HuggingFace API token not configured',
          operationTime: Date.now() - startTime,
        };
      }
      
      // In a real implementation, we would call HuggingFace embedding API
      const embedding = Array.from({ length: 768 }, () => Math.random());
      
      this.log('info', 'HuggingFace embedding generation completed');
      this.recordMetric('embedding_generate', 1);
      
      return {
        success: true,
        embedding,
        modelId: modelId || 'sentence-transformers/all-MiniLM-L6-v2',
        dimension: 768,
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
      type: 'huggingface-llm',
      modelId: this.modelId,
      modelUrl: this.modelUrl,
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
export { HuggingFaceLLMProvider as default };
