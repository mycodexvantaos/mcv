/**
 * Factory function for EthereumProvider
 */

import { EthereumProvider } from './ethereum-provider-cb';
import type { EthereumConfig } from './ethereum-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { EthereumProvider } from './ethereum-provider-cb';
export type { EthereumConfig } from './ethereum-provider-cb';

/**
 * Create a EthereumProvider instance with the given configuration.
 */
export function createEthereumProvider(config: Partial<ProviderConfig<EthereumConfig>> = {}): EthereumProvider {
  const providerConfig: ProviderConfig<EthereumConfig> = {
    id: config.id || 'ethereum-provider-cb',
    name: config.name || 'EthereumProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as EthereumConfig,
    fallback: config.fallback,
  };

  return new EthereumProvider(providerConfig);
}

export default createEthereumProvider;
