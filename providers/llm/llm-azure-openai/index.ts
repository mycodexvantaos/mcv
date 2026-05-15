/**
 * 🔒 MyCodeXvantaOS - Azure OpenAI LLM Provider
 *
 * Azure OpenAI LLM integration with OpenAI fallback.
 *
 * @module providers/llm/llm-azure-openai
 * @version 1.0.0
 */

export { AzureOpenAILLMProvider } from './azure-openai-provider-cb';
export type { AzureOpenAIConfig, ChatMessage, ChatCompletionOptions, ChatCompletionResult, EmbeddingResult } from './azure-openai-provider-cb';

/**
 * Factory function to create Azure OpenAI provider
 */
export function createAzureOpenAIProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): AzureOpenAILLMProvider {
  return new AzureOpenAILLMProvider({
    id: config.id || 'azure-openai-llm',
    name: config.name || 'Azure OpenAI LLM',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize Azure OpenAI provider
 */
export async function initializeAzureOpenAIProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<AzureOpenAILLMProvider> {
  const provider = createAzureOpenAIProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { AzureOpenAILLMProvider as default };
