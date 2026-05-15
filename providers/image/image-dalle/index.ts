/**
 * Factory function for DalleProvider
 */

import { DalleProvider } from './dalle-provider-cb';
import type { DalleConfig } from './dalle-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { DalleProvider } from './dalle-provider-cb';
export type { DalleConfig } from './dalle-provider-cb';

/**
 * Create a DalleProvider instance with the given configuration.
 */
export function createDalleProvider(config: Partial<ProviderConfig<DalleConfig>> = {}): DalleProvider {
  const providerConfig: ProviderConfig<DalleConfig> = {
    id: config.id || 'dalle-provider-cb',
    name: config.name || 'DalleProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as DalleConfig,
    fallback: config.fallback,
  };

  return new DalleProvider(providerConfig);
}

export default createDalleProvider;
