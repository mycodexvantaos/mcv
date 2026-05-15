/**
 * Factory function for HyperledgerProvider
 */

import { HyperledgerProvider } from './hyperledger-provider-cb';
import type { HyperledgerConfig } from './hyperledger-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { HyperledgerProvider } from './hyperledger-provider-cb';
export type { HyperledgerConfig } from './hyperledger-provider-cb';

/**
 * Create a HyperledgerProvider instance with the given configuration.
 */
export function createHyperledgerProvider(config: Partial<ProviderConfig<HyperledgerConfig>> = {}): HyperledgerProvider {
  const providerConfig: ProviderConfig<HyperledgerConfig> = {
    id: config.id || 'hyperledger-provider-cb',
    name: config.name || 'HyperledgerProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as HyperledgerConfig,
    fallback: config.fallback,
  };

  return new HyperledgerProvider(providerConfig);
}

export default createHyperledgerProvider;
