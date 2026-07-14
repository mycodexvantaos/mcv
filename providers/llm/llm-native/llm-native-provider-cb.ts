/**
 * 🧠 MyCodexVantaOS - Native LLM Provider (CapabilityBase-based)
 *
 * Zero external dependency implementation of a basic LLM provider.
 * Serves as fallback when no external LLM is available.
 *
 * @module providers/llm/llm-native
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

/**
 * Configuration for Native LLM Provider
 */
export interface NativeLLMConfig {
  /** Enable/disable the provider */
  enabled?: boolean;

  /** Response generation mode */
  responseMode?: 'template' | 'echo' | 'rule-based';

  /** Maximum tokens in response */
  maxTokens?: number;

  /** Path to custom templates (optional) */
  templatesPath?: string;

  /** Temperature for response variation (0-1) */
  temperature?: number;
}

/**
 * LLM request interface
 */
export interface LLMRequest {
  /** The prompt to generate response for */
  prompt: string;

  /** Optional context for the generation */
  context?: string;

  /** Maximum tokens to generate */
  maxTokens?: number;

  /** Temperature for randomness (0-1) */
  temperature?: number;
}

/**
 * LLM response interface
 */
export interface LLMResponse {
  /** Generated response text */
  text: string;

  /** Number of tokens generated (estimated) */
  tokens: number;

  /** Model identifier */
  model: string;

  /** Provider name */
  provider: string;

  /** Generation time in milliseconds */
  generationTime: number;

  /** Response mode used */
  mode: string;
}

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Chat request interface
 */
export interface ChatRequest {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

/**
 * Template responses for common patterns
 */
const TEMPLATE_RESPONSES: Record<string, string> = {
  code: `// Native LLM Provider - Template Response
// Note: For advanced code generation, configure an external LLM provider.

export function placeholder(): void {
  console.log('Native mode active. Configure an LLM provider for enhanced capabilities.');
}`,

  help: `I'm running in Native Mode with zero external dependencies.

For enhanced AI capabilities, you can configure one of these providers:
- llm-ollama (local, recommended for privacy)
- llm-openai (cloud-based)
- llm-anthropic (cloud-based)
- llm-gemini (cloud-based)

Native mode provides basic template responses and rule-based processing.`,

  default: `Native LLM Provider is active.

Current mode: Zero external dependencies
Status: Operational with limited capabilities
Recommendation: Configure an external LLM provider for advanced features.

Available providers in this ecosystem:
- llm-ollama (native, local)
- llm-openai (cloud)
- llm-anthropic (cloud)
- llm-gemini (cloud)`,

  greeting: `Hello! I'm running in Native Mode with zero external dependencies.

I can provide basic template responses and rule-based processing. For advanced AI capabilities, consider configuring one of the external LLM providers like Ollama, OpenAI, Anthropic, or Gemini.`,

  error: `I apologize, but I'm running in Native Mode and encountered an issue.

As a zero-dependency provider, my capabilities are limited to template responses and rule-based processing. If you need advanced features, please configure an external LLM provider.`,
};

/**
 * Rule-based response generator
 */
function generateRuleBasedResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (
    lowerPrompt.includes('code') ||
    lowerPrompt.includes('function') ||
    lowerPrompt.includes('implement') ||
    lowerPrompt.includes('write')
  ) {
    return TEMPLATE_RESPONSES.code;
  }

  if (
    lowerPrompt.includes('help') ||
    lowerPrompt.includes('what can you do') ||
    lowerPrompt.includes('capabilities')
  ) {
    return TEMPLATE_RESPONSES.help;
  }

  if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
    return TEMPLATE_RESPONSES.greeting;
  }

  return TEMPLATE_RESPONSES.default;
}

/**
 * Generate response based on configured mode
 */
function generateResponse(prompt: string, mode: 'template' | 'echo' | 'rule-based'): string {
  switch (mode) {
    case 'echo':
      return `[ECHO MODE]\n${prompt}`;

    case 'rule-based':
      return generateRuleBasedResponse(prompt);

    case 'template':
    default:
      return TEMPLATE_RESPONSES.default;
  }
}

/**
 * Estimate tokens in text (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * 🧠 Native LLM Provider
 *
 * Zero external dependency implementation that serves as the ultimate fallback
 * when no external LLM providers are available or configured.
 */
export class NativeLLMProvider extends CapabilityBase<NativeLLMConfig> {
  private modelId: string;
  private responseMode: 'template' | 'echo' | 'rule-based';
  private maxTokens: number;
  private temperature: number;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<NativeLLMConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);

    const cfg = config.config;
    this.modelId = 'native-llm-v1';
    this.responseMode = cfg.responseMode || 'template';
    this.maxTokens = cfg.maxTokens || 1000;
    this.temperature = cfg.temperature || 0.7;
  }

  /**
   * Initialize the native LLM provider
   */
  protected async doInitialize(): Promise<void> {
    this.log('info', `Native LLM provider initialized (${this.responseMode} mode)`);
    this.log(
      'info',
      `Configuration - maxTokens: ${this.maxTokens}, temperature: ${this.temperature}`
    );
  }

  /**
   * Health check for native LLM provider
   * Always returns healthy as it has zero dependencies
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    const cfg = this.config.config;

    if (cfg.enabled === false) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.DEGRADED,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: 'Provider is disabled in configuration',
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
    this.log('info', 'Native LLM provider shutdown');
  }

  /**
   * Generate a response for a single prompt
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      this.recordSuccess(0); // Will update later with actual latency

      const responseText = generateResponse(request.prompt, this.responseMode);
      const tokens = estimateTokens(responseText);
      const generationTime = Date.now() - startTime;

      // Update metrics with actual latency
      this.metrics.invocationCount++;
      this.metrics.successCount++;
      this.metrics.avgLatency = this.calculateNativeAvgLatency(generationTime);
      this.metrics.lastInvocation = new Date().toISOString();
      this.metrics.lastProviderId = this.id;

      return {
        text: responseText,
        tokens: Math.min(tokens, this.maxTokens),
        model: this.modelId,
        provider: this.name,
        generationTime,
        mode: this.responseMode,
      };
    } catch (error) {
      const generationTime = Date.now() - startTime;
      this.recordFailure(error);

      // Return error response
      const errorText = TEMPLATE_RESPONSES.error;
      return {
        text: errorText,
        tokens: estimateTokens(errorText),
        model: this.modelId,
        provider: this.name,
        generationTime,
        mode: this.responseMode,
      };
    }
  }

  /**
   * Generate a chat-style response
   */
  async chat(request: ChatRequest): Promise<LLMResponse> {
    // Extract the last user message as the prompt
    const lastUserMessage = request.messages.reverse().find((msg) => msg.role === 'user');

    const prompt = lastUserMessage ? lastUserMessage.content : '';

    return this.generate({
      prompt,
      maxTokens: request.maxTokens || this.maxTokens,
      temperature: request.temperature || this.temperature,
    });
  }

  /**
   * Stream a response (simulated for native provider)
   */
  async *stream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    const response = await this.generate(request);

    // Simple streaming: split into chunks
    const chunkSize = Math.ceil(response.text.length / 5);
    for (let i = 0; i < response.text.length; i += chunkSize) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate network delay
      yield response.text.slice(i, i + chunkSize);
    }
  }

  /**
   * Get provider info
   */
  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      model: this.modelId,
      mode: this.responseMode,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      status: this._status,
      isInitialized: this._isInitialized,
      metrics: this.metrics,
    };
  }

  /**
   * Calculate average latency for metrics
   */
  private calculateNativeAvgLatency(newLatency: number): number {
    const count = this.metrics.invocationCount;
    if (count === 0) return newLatency;

    const currentAvg = this.metrics.avgLatency || 0;
    return (currentAvg * (count - 1) + newLatency) / count;
  }
}

/**
 * Default export
 */
export { NativeLLMProvider as default };
