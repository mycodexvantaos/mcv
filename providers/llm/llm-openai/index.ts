/**
 * 🤖 MyCodeXvantaOS - OpenAI LLM Provider
 *
 * Official OpenAI API integration with native fallback.
 * 
 * @module providers/llm/llm-openai
 * @version 1.0.0
 */

export { OpenAILLMProvider, default } from './openai-provider-cb';
export type { 
  OpenAIConfig, 
  ChatMessage, 
  LLMRequest as OpenAILLMRequest, 
  LLMResponse as OpenAILLMResponse 
} from './openai-provider-cb';

/**
 * Create an OpenAI LLM provider instance
 */
export function createOpenAIProvider(
  id: string = 'openai-default',
  config: OpenAIConfig = {}
): OpenAILLMProvider {
  const ProviderConfig = {
    config,
    mode: 'external' as const,
    providerId: id,
  };

  return new OpenAILLMProvider(
    id,
    'OpenAI LLM Provider',
    ProviderConfig,
    {
      enabled: true,
      retryCount: 3,
    }
  );
}

/**
 * Initialize OpenAI provider with health check
 */
export async function initializeOpenAIProvider(
  id: string = 'openai-default',
  config: OpenAIConfig = {}
): Promise<OpenAILLMProvider> {
  const provider = createOpenAIProvider(id, config);
  await provider.initialize();
  return provider;
}

export default {
  OpenAILLMProvider,
  createOpenAIProvider,
  initializeOpenAIProvider,
};