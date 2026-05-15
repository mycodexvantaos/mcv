/**
 * Factory function for OpenAIHybridEmbeddingProvider
 */

import { OpenAIHybridEmbeddingProvider } from './openai-hybrid-embedding-provider-cb';
import type { OpenAIHybridEmbeddingConfig } from './openai-hybrid-embedding-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../../packages/capabilities/types';

export { OpenAIHybridEmbeddingProvider } from './openai-hybrid-embedding-provider-cb';
export type { OpenAIHybridEmbeddingConfig } from './openai-hybrid-embedding-provider-cb';

/**
 * Create a OpenAIHybridEmbeddingProvider instance with the given configuration.
 */
export function createOpenAIHybridEmbeddingProvider(
  config: Partial<ProviderConfig<OpenAIHybridEmbeddingConfig>> = {}
): OpenAIHybridEmbeddingProvider {
  const providerConfig: ProviderConfig<OpenAIHybridEmbeddingConfig> = {
    id: config.id || 'openai-hybrid-embedding-provider-cb',
    name: config.name || 'OpenAIHybridEmbeddingProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as OpenAIHybridEmbeddingConfig,
    fallback: config.fallback,
  };

  return new OpenAIHybridEmbeddingProvider(providerConfig);
}

export default createOpenAIHybridEmbeddingProvider;
