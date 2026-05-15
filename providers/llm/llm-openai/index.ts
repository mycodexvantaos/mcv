/**
 * Factory function for OpenAILLMProvider
 */

import { OpenAILLMProvider } from './openai-provider-cb';
import type { OpenAIConfig } from './openai-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { OpenAILLMProvider } from './openai-provider-cb';
export type { OpenAIConfig } from './openai-provider-cb';

/**
 * Create a OpenAILLMProvider instance with the given configuration.
 */
export function createOpenAILLMProvider(
  config: Partial<ProviderConfig<OpenAIConfig>> = {}
): OpenAILLMProvider {
  const id = config.id || 'openai-provider-cb';
  const name = config.name || 'OpenAILLMProvider';
  const providerConfig: ProviderConfig<OpenAIConfig> = {
    id,
    name,
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as OpenAIConfig,
    fallback: config.fallback,
  };

  return new OpenAILLMProvider(id, name, providerConfig);
}

export default createOpenAILLMProvider;
