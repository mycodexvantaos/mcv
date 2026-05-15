/**
 * Factory function for OllamaEmbeddingProvider
 */

import { OllamaEmbeddingProvider } from './ollama-embedding-provider-cb';
import type { OllamaEmbeddingConfig } from './ollama-embedding-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { OllamaEmbeddingProvider } from './ollama-embedding-provider-cb';
export type { OllamaEmbeddingConfig } from './ollama-embedding-provider-cb';

/**
 * Create a OllamaEmbeddingProvider instance with the given configuration.
 */
export function createOllamaEmbeddingProvider(config: Partial<ProviderConfig<OllamaEmbeddingConfig>> = {}): OllamaEmbeddingProvider {
  const providerConfig: ProviderConfig<OllamaEmbeddingConfig> = {
    id: config.id || 'ollama-embedding-provider-cb',
    name: config.name || 'OllamaEmbeddingProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as OllamaEmbeddingConfig,
    fallback: config.fallback,
  };

  return new OllamaEmbeddingProvider(providerConfig);
}

export default createOllamaEmbeddingProvider;
