/**
 * Factory function for AzureBlobProvider
 */

import { AzureBlobProvider } from './azure-blob-provider-cb';
import type { AzureBlobConfig } from './azure-blob-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { AzureBlobProvider } from './azure-blob-provider-cb';
export type { AzureBlobConfig } from './azure-blob-provider-cb';

/**
 * Create a AzureBlobProvider instance with the given configuration.
 */
export function createAzureBlobProvider(
  config: Partial<ProviderConfig<AzureBlobConfig>> = {}
): AzureBlobProvider {
  const providerConfig: ProviderConfig<AzureBlobConfig> = {
    id: config.id || 'azure-blob-provider-cb',
    name: config.name || 'AzureBlobProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as AzureBlobConfig,
    fallback: config.fallback,
  };

  return new AzureBlobProvider(providerConfig);
}

export default createAzureBlobProvider;
