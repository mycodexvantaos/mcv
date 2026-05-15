/**
 * providers/llm/llm-native/index.ts
 * Native LLM Provider - Zero external dependency implementation
 *
 * This provider serves as the fallback when no external LLM is available.
 * It provides basic text processing capabilities without requiring any API keys.
 */

export interface NativeLLMConfig {
  enabled?: boolean;
  responseMode?: 'template' | 'echo' | 'rule-based';
  maxTokens?: number;
  templatesPath?: string;
}

export interface LLMRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  text: string;
  tokens: number;
  model: string;
  provider: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

// Template responses for common patterns
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
};

// Rule-based response generator
function generateRuleBasedResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (
    lowerPrompt.includes('code') ||
    lowerPrompt.includes('function') ||
    lowerPrompt.includes('implement')
  ) {
    return TEMPLATE_RESPONSES.code;
  }

  if (lowerPrompt.includes('help') || lowerPrompt.includes('what can')) {
    return TEMPLATE_RESPONSES.help;
  }

  return TEMPLATE_RESPONSES.default;
}

/**
 * Native LLM Provider Implementation
 */
export class NativeLLMProvider {
  private config: NativeLLMConfig;

  constructor(config: NativeLLMConfig = {}) {
    this.config = {
      enabled: true,
      responseMode: 'rule-based',
      maxTokens: 2048,
      ...config,
    };
  }

  /**
   * Health check for the provider
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return {
      healthy: true,
      message: 'Native LLM Provider is operational (zero dependencies)',
    };
  }

  /**
   * Get provider metadata
   */
  getMetadata() {
    return {
      name: 'llm-native',
      provider: 'native',
      capabilities: ['text-generation', 'text-completion', 'code-assistance', 'summarization'],
      limitations: ['No advanced reasoning', 'Template-based responses only'],
      isNative: true,
      requiresApiKey: false,
    };
  }

  /**
   * Generate text completion
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const maxTokens = request.maxTokens || this.config.maxTokens || 2048;
    let text: string;

    switch (this.config.responseMode) {
      case 'echo':
        text = request.prompt;
        break;
      case 'template':
        text = TEMPLATE_RESPONSES.default;
        break;
      case 'rule-based':
      default:
        text = generateRuleBasedResponse(request.prompt);
    }

    // Truncate if needed
    const truncatedText = text.slice(0, maxTokens * 4); // Rough char estimate

    return {
      text: truncatedText,
      tokens: Math.ceil(truncatedText.length / 4),
      model: 'native-template-v1',
      provider: 'llm-native',
    };
  }

  /**
   * Chat completion
   */
  async generateChatCompletion(request: ChatRequest): Promise<LLMResponse> {
    // Extract the last user message
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user');
    const prompt = lastUserMessage?.content || '';

    return this.generateCompletion({
      prompt,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
    });
  }

  /**
   * Count tokens (approximate)
   */
  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// Singleton instance
let instance: NativeLLMProvider | null = null;

/**
 * Get or create the native LLM provider instance
 */
export function getNativeLLMProvider(config?: NativeLLMConfig): NativeLLMProvider {
  if (!instance) {
    instance = new NativeLLMProvider(config);
  }
  return instance;
}

/**
 * Initialize the provider with configuration
 */
export async function initialize(config: NativeLLMConfig = {}): Promise<NativeLLMProvider> {
  const provider = getNativeLLMProvider(config);
  await provider.healthCheck();
  return provider;
}

export default {
  initialize,
  getNativeLLMProvider,
  NativeLLMProvider,
};
