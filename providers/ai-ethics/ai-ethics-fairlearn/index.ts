/**
 * Factory function for FairlearnProvider
 */

import { FairlearnProvider } from './fairlearn-provider-cb';
import type { FairlearnConfig } from './fairlearn-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { FairlearnProvider } from './fairlearn-provider-cb';
export type { FairlearnConfig } from './fairlearn-provider-cb';

/**
 * Create a FairlearnProvider instance with the given configuration.
 */
export function createFairlearnProvider(
  config: Partial<ProviderConfig<FairlearnConfig>> = {}
): FairlearnProvider {
  const providerConfig: ProviderConfig<FairlearnConfig> = {
    id: config.id || 'fairlearn-provider-cb',
    name: config.name || 'FairlearnProvider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as FairlearnConfig,
    fallback: config.fallback,
  };

  return new FairlearnProvider(providerConfig);
}

export default createFairlearnProvider;
