/**
 * packages/ai-llm/src/index.ts
 * @mycodexvantaos/ai-llm
 *
 * Unified LLM abstraction layer following MyCodexVantaOS architecture principles.
 *
 * Key principles:
 * - Native-first: Always has a working native provider as fallback
 * - Provider-agnostic: Switch between providers without code changes
 * - Zero hard dependencies: External providers are optional
 */

// Core types
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

// Provider types
export type LLMProviderType = 'native' | 'ollama' | 'openai' | 'anthropic' | 'gemini';

export interface LLMProviderInterface {
  name: string;
  isNative: boolean;
  isAvailable(): boolean;
  healthCheck(): Promise<{ healthy: boolean; message: string }>;
  getMetadata(): Record<string, any>;
  generateCompletion(request: LLMRequest): Promise<LLMResponse>;
  generateChatCompletion(request: ChatRequest): Promise<LLMResponse>;
  countTokens(text: string): number;
}

/**
 * LLM Provider Registry
 * Manages available providers and selects the best one based on availability
 */
export class LLMProviderRegistry {
  private providers: Map<string, LLMProviderInterface> = new Map();
  private preferredProvider: string = 'native';

  /**
   * Register a provider
   */
  register(name: string, provider: LLMProviderInterface): void {
    this.providers.set(name, provider);

    // Update preferred provider if this one is available and external
    if (provider.isAvailable() && !provider.isNative) {
      this.preferredProvider = name;
    }
  }

  /**
   * Set the preferred provider
   */
  setPreferredProvider(name: string): void {
    if (this.providers.has(name)) {
      this.preferredProvider = name;
    }
  }

  /**
   * Get a specific provider
   */
  get(name: string): LLMProviderInterface | undefined {
    return this.providers.get(name);
  }

  /**
   * Get the best available provider
   */
  getActive(): LLMProviderInterface {
    // Prefer external providers if available
    for (const [name, provider] of this.providers) {
      if (provider.isAvailable() && !provider.isNative) {
        return provider;
      }
    }

    // Fall back to native
    const native = this.providers.get('native');
    if (native) {
      return native;
    }

    throw new Error('No LLM provider available. Native provider should always be registered.');
  }

  /**
   * Get all registered providers
   */
  getAll(): Map<string, LLMProviderInterface> {
    return this.providers;
  }

  /**
   * Health check all providers
   */
  async healthCheckAll(): Promise<Record<string, { healthy: boolean; message: string }>> {
    const results: Record<string, { healthy: boolean; message: string }> = {};

    for (const [name, provider] of this.providers) {
      results[name] = await provider.healthCheck();
    }

    return results;
  }
}

// Global registry singleton
let registry: LLMProviderRegistry | null = null;

/**
 * Get the global LLM provider registry
 */
export function getLLMRegistry(): LLMProviderRegistry {
  if (!registry) {
    registry = new LLMProviderRegistry();
  }
  return registry;
}

/**
 * Native LLM Provider (built-in, zero dependencies)
 */
export class NativeLLMProvider implements LLMProviderInterface {
  name = 'native';
  isNative = true;

  isAvailable(): boolean {
    return true; // Always available
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return { healthy: true, message: 'Native LLM Provider is operational' };
  }

  getMetadata() {
    return {
      name: 'llm-native',
      provider: 'native',
      capabilities: ['text-generation', 'text-completion'],
      isNative: true,
      requiresApiKey: false,
    };
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    // Template-based response for native mode
    const text = `Native LLM Provider Active

Your prompt: "${request.prompt?.slice(0, 100)}..."

Note: Configure an external LLM provider (gemini, openai, anthropic, ollama) for advanced capabilities.

Available providers:
- llm-native (current, zero dependencies)
- llm-ollama (local, privacy-focused)
- llm-openai (cloud-based)
- llm-anthropic (cloud-based)
- llm-gemini (cloud-based)`;

    return {
      text,
      tokens: Math.ceil(text.length / 4),
      model: 'native-template-v1',
      provider: 'llm-native',
    };
  }

  async generateChatCompletion(request: ChatRequest): Promise<LLMResponse> {
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user');
    return this.generateCompletion({
      prompt: lastUserMessage?.content || '',
      maxTokens: request.maxTokens,
    });
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

/**
 * Initialize LLM with available providers
 * Native provider is always registered as fallback
 */
export async function initializeLLM(
  config: {
    preferredProvider?: LLMProviderType;
    providers?: Partial<Record<LLMProviderType, Record<string, any>>>;
  } = {}
): Promise<LLMProviderRegistry> {
  const reg = getLLMRegistry();

  // Always register native provider first (guaranteed fallback)
  const nativeProvider = new NativeLLMProvider();
  reg.register('native', nativeProvider);

  // Set preferred provider if specified
  if (config.preferredProvider) {
    reg.setPreferredProvider(config.preferredProvider);
  }

  return reg;
}

/**
 * Generate completion using the best available provider
 */
export async function generateCompletion(
  prompt: string,
  options?: { maxTokens?: number; provider?: LLMProviderType }
): Promise<LLMResponse> {
  const reg = getLLMRegistry();
  const provider = options?.provider ? reg.get(options.provider) : reg.getActive();

  if (!provider) {
    throw new Error('No LLM provider available');
  }

  return provider.generateCompletion({
    prompt,
    maxTokens: options?.maxTokens,
  });
}

/**
 * Generate chat completion using the best available provider
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options?: { maxTokens?: number; provider?: LLMProviderType }
): Promise<LLMResponse> {
  const reg = getLLMRegistry();
  const provider = options?.provider ? reg.get(options.provider) : reg.getActive();

  if (!provider) {
    throw new Error('No LLM provider available');
  }

  return provider.generateChatCompletion({
    messages,
    maxTokens: options?.maxTokens,
  });
}

// Default export
export default {
  getLLMRegistry,
  initializeLLM,
  generateCompletion,
  generateChatCompletion,
  LLMProviderRegistry,
  NativeLLMProvider,
};
