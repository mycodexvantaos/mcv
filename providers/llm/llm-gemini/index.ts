/**
 * Factory function for GeminiLLMProvider
 */

import { GeminiLLMProvider } from './gemini-provider-cb';
import type { GeminiConfig } from './gemini-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { GeminiLLMProvider } from './gemini-provider-cb';
export type { GeminiConfig } from './gemini-provider-cb';

/**
 * Create a GeminiLLMProvider instance with the given configuration.
 */
export function createGeminiLLMProvider(config: Partial<ProviderConfig<GeminiConfig>> = {}): GeminiLLMProvider {
  const id = config.id || 'gemini-provider-cb';
  const name = config.name || 'GeminiLLMProvider';
  const providerConfig: ProviderConfig<GeminiConfig> = {
    id,
    name,
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as GeminiConfig,
    fallback: config.fallback,
  };

  return new GeminiLLMProvider(id, name, providerConfig);
}

export default createGeminiLLMProvider;
