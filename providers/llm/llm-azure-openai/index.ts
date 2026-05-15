/**
 * Factory function for AzureOpenAILLMProvider
 */

import { AzureOpenAILLMProvider } from './azure-openai-provider-cb';
import type { AzureOpenAIConfig } from './azure-openai-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { AzureOpenAILLMProvider } from './azure-openai-provider-cb';
export type { AzureOpenAIConfig } from './azure-openai-provider-cb';

/**
 * Create a AzureOpenAILLMProvider instance with the given configuration.
 */
export function createAzureOpenAILLMProvider(
  config: Partial<ProviderConfig<AzureOpenAIConfig>> = {}
): AzureOpenAILLMProvider {
  const providerConfig: ProviderConfig<AzureOpenAIConfig> = {
    id: config.id || 'azure-openai-provider-cb',
    name: config.name || 'AzureOpenAILLMProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as AzureOpenAIConfig,
    fallback: config.fallback,
  };

  return new AzureOpenAILLMProvider(providerConfig);
}

export default createAzureOpenAILLMProvider;
