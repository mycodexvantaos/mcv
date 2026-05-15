/**
 * Factory function for OllamaHybridEmbeddingProvider
 */

import { OllamaHybridEmbeddingProvider } from './ollama-hybrid-embedding-provider-cb';
import type { OllamaHybridEmbeddingConfig } from './ollama-hybrid-embedding-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../../packages/capabilities/types';

export { OllamaHybridEmbeddingProvider } from './ollama-hybrid-embedding-provider-cb';
export type { OllamaHybridEmbeddingConfig } from './ollama-hybrid-embedding-provider-cb';

/**
 * Create a OllamaHybridEmbeddingProvider instance with the given configuration.
 */
export function createOllamaHybridEmbeddingProvider(config: Partial<ProviderConfig<OllamaHybridEmbeddingConfig>> = {}): OllamaHybridEmbeddingProvider {
  const providerConfig: ProviderConfig<OllamaHybridEmbeddingConfig> = {
    id: config.id || 'ollama-hybrid-embedding-provider-cb',
    name: config.name || 'OllamaHybridEmbeddingProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as OllamaHybridEmbeddingConfig,
    fallback: config.fallback,
  };

  return new OllamaHybridEmbeddingProvider(providerConfig);
}

export default createOllamaHybridEmbeddingProvider;
