/**
 * Factory function for AnthropicLLMProvider
 */

import { AnthropicLLMProvider } from './anthropic-provider-cb';
import type { AnthropicConfig } from './anthropic-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { AnthropicLLMProvider } from './anthropic-provider-cb';
export type { AnthropicConfig } from './anthropic-provider-cb';

/**
 * Create a AnthropicLLMProvider instance with the given configuration.
 */
export function createAnthropicLLMProvider(config: Partial<ProviderConfig<AnthropicConfig>> = {}): AnthropicLLMProvider {
  const id = config.id || 'anthropic-provider-cb';
  const name = config.name || 'AnthropicLLMProvider';
  const providerConfig: ProviderConfig<AnthropicConfig> = {
    id,
    name,
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as AnthropicConfig,
    fallback: config.fallback,
  };

  return new AnthropicLLMProvider(id, name, providerConfig);
}

export default createAnthropicLLMProvider;
