/**
 * 🔒 MyCodeXvantaOS - HuggingFace LLM Provider
 *
 * HuggingFace LLM integration with native fallback.
 *
 * @module providers/llm/llm-huggingface
 * @version 1.0.0
 */

export { HuggingFaceLLMProvider } from './huggingface-provider-cb';
export type { HuggingFaceConfig, ChatMessage, ChatCompletionOptions, ChatCompletionResult, EmbeddingResult } from './huggingface-provider-cb';

/**
 * Factory function to create HuggingFace provider
 */
export function createHuggingFaceProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): HuggingFaceLLMProvider {
  return new HuggingFaceLLMProvider({
    id: config.id || 'huggingface-llm',
    name: config.name || 'HuggingFace LLM',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize HuggingFace provider
 */
export async function initializeHuggingFaceProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<HuggingFaceLLMProvider> {
  const provider = createHuggingFaceProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { HuggingFaceLLMProvider as default };
