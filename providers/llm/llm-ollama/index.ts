/**
 * Factory function for OllamaLLMProvider
 */

import { OllamaLLMProvider } from './ollama-provider-cb';
import type { OllamaConfig } from './ollama-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { OllamaLLMProvider } from './ollama-provider-cb';
export type { OllamaConfig } from './ollama-provider-cb';

/**
 * Create a OllamaLLMProvider instance with the given configuration.
 */
export function createOllamaLLMProvider(
  config: Partial<ProviderConfig<OllamaConfig>> = {}
): OllamaLLMProvider {
  const id = config.id || 'ollama-provider-cb';
  const name = config.name || 'OllamaLLMProvider';
  const providerConfig: ProviderConfig<OllamaConfig> = {
    id,
    name,
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as OllamaConfig,
    fallback: config.fallback,
  };

  return new OllamaLLMProvider(id, name, providerConfig);
}

export default createOllamaLLMProvider;
