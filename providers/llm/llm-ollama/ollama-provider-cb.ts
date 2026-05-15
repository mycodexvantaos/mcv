/**
 * 🦙 MyCodeXvantaOS - Ollama LLM Provider (CapabilityBase-based)
 *
 * Local LLM provider using Ollama for offline inference.
 * Fallback to llm-native when Ollama is unavailable.
 *
 * @module providers/llm/llm-ollama
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

/**
 * Configuration for Ollama LLM Provider
 */
export interface OllamaConfig {
  /** Ollama server URL (default: localhost:11434) */
  baseURL?: string;
  
  /** Model to use (default: llama2) */
  model?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Maximum tokens for response */
  maxTokens?: number;
  
  /** Temperature for randomness (0-1) */
  temperature?: number;
  
  /** Whether to use streaming */
  stream?: boolean;
  
  /** Number of retries on failure */
  retries?: number;
}

/**
 * LLM request interface
 */
export interface LLMRequest {
  /** The prompt to generate response for */
  prompt?: string;
  
  /** Chat messages for chat completion */
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  
  /** Maximum tokens to generate */
  maxTokens?: number;
  
  /** Temperature for randomness (0-1) */
  temperature?: number;
  
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
}

/**
 * 🦙 Ollama LLM Provider
 *
 * Local LLM provider using Ollama for offline inference.
 * Offers privacy and offline capabilities with external API fallback.
 */
export class OllamaLLMProvider extends CapabilityBase<OllamaConfig> {
  private baseURL: string;
  private model: string;
  private timeout: number;
  private maxTokens: number;
  private temperature: number;
  private enableStreaming: boolean;
  private retries: number;
  
  private isOllamaAvailable: boolean = false;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<OllamaConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);
    
    const cfg = config.config;
    this.baseURL = cfg.baseURL || 'http://localhost:11434';
    this.model = cfg.model || 'llama2';
    this.timeout = cfg.timeout || 30000;
    this.maxTokens = cfg.maxTokens || 2048;
    this.temperature = cfg.temperature || 0.7;
    this.enableStreaming = cfg.stream ?? true;
    this.retries = cfg.retries || 3;
  }

  /**
   * Initialize the Ollama provider
   */
  protected async doInitialize(): Promise<void> {
    try {
      // Check if Ollama is available
      await this.checkOllamaAvailability();
      
      if (this.isOllamaAvailable) {
        this.log('info', `Ollama provider initialized at ${this.baseURL} with model ${this.model}`);
        this.log('info', `Configuration - timeout: ${this.timeout}s, maxTokens: ${this.maxTokens}, temperature: ${this.temperature}`);
      } else {
        this.log('warn', `Ollama not available at ${this.baseURL}, will operate in degraded mode with fallback`);
      }
    } catch (error) {
      this.log('warn', 'Ollama initialization failed, will operate with fallback:', error);
      this.isOllamaAvailable = false;
    }
  }

  /**
   * Check if Ollama is available
   */
  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      });

      if (response.ok) {
        this.isOllamaAvailable = true;
        return true;
      }
      
      this.isOllamaAvailable = false;
      return false;
    } catch (error) {
      this.isOllamaAvailable = false;
      return false;
    }
  }

  /**
   * Health check for Ollama provider
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    // Check if still available
    const available = await this.checkOllamaAvailability();

    if (!available) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'Ollama service not available',
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
    this.log('info', 'Ollama LLM provider shutdown');
  }

  /**
   * Generate a response
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    if (!this.isOllamaAvailable) {
      this.recordFailure(new Error('Ollama not available'));
      throw new Error('Ollama service not available. Use fallback provider.');
    }

    try {
      const responseText = await this.generateWithRetry(request);
      const generationTime = Date.now() - startTime;
      
      this.recordSuccess(generationTime);

      return {
        text: responseText,
        tokens: Math.ceil(responseText.length / 4),
        model: this.model,
        provider: this.name,
        generationTime,
        streamed: request.stream ?? this.enableStreaming,
      };
    } catch (error) {
      const generationTime = Date.now() - startTime;
      this.recordFailure(error);
      throw error;
    }
  }

  /**
   * Generate with retry logic
   */
  private async generateWithRetry(request: LLMRequest): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await this.doGenerate(request);
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `Generation attempt ${attempt}/${this.retries} failed:`, error);

        if (attempt < this.retries) {
          // Exponential backoff
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
  private async doGenerate(request: LLMRequest): Promise<string> {
    if (request.messages && request.messages.length > 0) {
      // Chat completion
      return this.chatCompletion(request.messages, request);
    } else if (request.prompt) {
      // Text completion
      return this.textCompletion(request.prompt, request);
    } else {
      throw new Error('Either prompt or messages must be provided');
    }
  }

  /**
   * Text completion
   */
  private async textCompletion(prompt: string, options: LLMRequest): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        options: {
          temperature: options.temperature ?? this.temperature,
          num_predict: options.maxTokens ?? this.maxTokens,
        },
        stream: options.stream ?? this.enableStreaming,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    // Handle streaming or non-streaming response
    if (options.stream ?? this.enableStreaming) {
      return await this.handleStreamedResponse(response);
    } else {
      const data = await response.json();
      return data.response || '';
    }
  }

  /**
   * Chat completion
   */
  private async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options: LLMRequest
  ): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        options: {
          temperature: options.temperature ?? this.temperature,
          num_predict: options.maxTokens ?? this.maxTokens,
        },
        stream: options.stream ?? this.enableStreaming,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    if (options.stream ?? this.enableStreaming) {
      return await this.handleStreamedResponse(response);
    } else {
      const data = await response.json();
      return data.message?.content || '';
    }
  }

  /**
   * Handle streamed response from Ollama
   */
  private async handleStreamedResponse(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          if (data.response) {
            fullResponse += data.response;
          }
          
          if (data.done) {
            return fullResponse;
          }
        } catch (error) {
          // Ignore JSON parse errors in stream
        }
      }
    }

    return fullResponse;
  }

  /**
   * Stream a response
   */
  async *stream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    if (!this.isOllamaAvailable) {
      throw new Error('Ollama service not available');
    }

    const messages = request.messages || (request.prompt ? [{ role: 'user', content: request.prompt }] : []);
    
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        options: {
          temperature: request.temperature ?? this.temperature,
          num_predict: request.maxTokens ?? this.maxTokens,
        },
        stream: true,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
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
        try {
          const data = JSON.parse(line);
          
          if (data.response) {
            yield data.response;
          }
        } catch (error) {
          // Ignore JSON parse errors in stream
        }
      }
    }
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    if (!this.isOllamaAvailable) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseURL}/api/tags`, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        return [];
      }

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
      type: 'ollama',
      model: this.model,
      baseURL: this.baseURL,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      stream: this.enableStreaming,
      available: this.isOllamaAvailable,
      status: this._status,
      isInitialized: this._isInitialized,
      metrics: this.metrics,
    };
  }
}

/**
 * Default export
 */
export { OllamaLLMProvider as default };