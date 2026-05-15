/**
 * Factory function for NativeGovernanceProvider
 */

import { NativeGovernanceProvider } from './native-governance-provider-cb';
import type { NativeGovernanceConfig } from './native-governance-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { NativeGovernanceProvider } from './native-governance-provider-cb';
export type { NativeGovernanceConfig } from './native-governance-provider-cb';

/**
 * Create a NativeGovernanceProvider instance with the given configuration.
 */
export function createNativeGovernanceProvider(
  config: Partial<ProviderConfig<NativeGovernanceConfig>> = {}
): NativeGovernanceProvider {
  const providerConfig: ProviderConfig<NativeGovernanceConfig> = {
    id: config.id || 'native-governance-provider-cb',
    name: config.name || 'NativeGovernanceProvider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as NativeGovernanceConfig,
    fallback: config.fallback,
  };

  return new NativeGovernanceProvider(providerConfig);
}

export default createNativeGovernanceProvider;
