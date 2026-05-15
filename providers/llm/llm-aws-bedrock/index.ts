/**
 * Factory function for BedrockLLMProvider
 */

import { BedrockLLMProvider } from './bedrock-provider-cb';
import type { BedrockConfig } from './bedrock-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { BedrockLLMProvider } from './bedrock-provider-cb';
export type { BedrockConfig } from './bedrock-provider-cb';

/**
 * Create a BedrockLLMProvider instance with the given configuration.
 */
export function createBedrockLLMProvider(
  config: Partial<ProviderConfig<BedrockConfig>> = {}
): BedrockLLMProvider {
  const providerConfig: ProviderConfig<BedrockConfig> = {
    id: config.id || 'bedrock-provider-cb',
    name: config.name || 'BedrockLLMProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as BedrockConfig,
    fallback: config.fallback,
  };

  return new BedrockLLMProvider(providerConfig);
}

export default createBedrockLLMProvider;
