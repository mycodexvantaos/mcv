/**
 * 🔒 MyCodeXvantaOS - Replicate LLM Provider
 *
 * Replicate LLM integration with native fallback.
 *
 * @module providers/llm/llm-replicate
 * @version 1.0.0
 */

export { ReplicateLLMProvider } from './replicate-provider-cb';
export type { ReplicateConfig, ChatMessage, ChatCompletionOptions, ChatCompletionResult } from './replicate-provider-cb';

/**
 * Factory function to create Replicate provider
 */
export function createReplicateProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): ReplicateLLMProvider {
  return new ReplicateLLMProvider({
    id: config.id || 'replicate-llm',
    name: config.name || 'Replicate LLM',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize Replicate provider
 */
export async function initializeReplicateProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<ReplicateLLMProvider> {
  const provider = createReplicateProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { ReplicateLLMProvider as default };
