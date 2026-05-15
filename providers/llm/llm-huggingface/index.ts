/**
 * Factory function for HuggingFaceLLMProvider
 */

import { HuggingFaceLLMProvider } from './huggingface-provider-cb';
import type { HuggingFaceConfig } from './huggingface-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { HuggingFaceLLMProvider } from './huggingface-provider-cb';
export type { HuggingFaceConfig } from './huggingface-provider-cb';

/**
 * Create a HuggingFaceLLMProvider instance with the given configuration.
 */
export function createHuggingFaceLLMProvider(
  config: Partial<ProviderConfig<HuggingFaceConfig>> = {}
): HuggingFaceLLMProvider {
  const providerConfig: ProviderConfig<HuggingFaceConfig> = {
    id: config.id || 'huggingface-provider-cb',
    name: config.name || 'HuggingFaceLLMProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as HuggingFaceConfig,
    fallback: config.fallback,
  };

  return new HuggingFaceLLMProvider(providerConfig);
}

export default createHuggingFaceLLMProvider;
