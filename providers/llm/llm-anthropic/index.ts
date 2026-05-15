/**
 * 🧠 MyCodeXvantaOS - Anthropic LLM Provider
 *
 * Anthropic Claude API integration with native fallback.
 * 
 * @module providers/llm/llm-anthropic
 * @version 1.0.0
 */

export { AnthropicLLMProvider, default } from './anthropic-provider-cb';
export type { 
  AnthropicConfig, 
  Message, 
  LLMRequest as AnthropicLLMRequest, 
  LLMResponse as AnthropicLLMResponse 
} from './anthropic-provider-cb';

/**
 * Create an Anthropic LLM provider instance
 */
export function createAnthropicProvider(
  id: string = 'anthropic-default',
  config: AnthropicConfig = {}
): AnthropicLLMProvider {
  const ProviderConfig = {
    config,
    mode: 'external' as const,
    providerId: id,
  };

  return new AnthropicLLMProvider(
    id,
    'Anthropic LLM Provider',
    ProviderConfig,
    {
      enabled: true,
      retryCount: 3,
    }
  );
}

/**
 * Initialize Anthropic provider with health check
 */
export async function initializeAnthropicProvider(
  id: string = 'anthropic-default',
  config: AnthropicConfig = {}
): Promise<AnthropicLLMProvider> {
  const provider = createAnthropicProvider(id, config);
  await provider.initialize();
  return provider;
}

export default {
  AnthropicLLMProvider,
  createAnthropicProvider,
  initializeAnthropicProvider,
};