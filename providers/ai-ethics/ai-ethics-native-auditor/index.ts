/**
 * Factory function for NativeAuditorProvider
 */

import { NativeAuditorProvider } from './native-auditor-provider-cb';
import type { NativeAuditorConfig } from './native-auditor-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { NativeAuditorProvider } from './native-auditor-provider-cb';
export type { NativeAuditorConfig } from './native-auditor-provider-cb';

/**
 * Create a NativeAuditorProvider instance with the given configuration.
 */
export function createNativeAuditorProvider(config: Partial<ProviderConfig<NativeAuditorConfig>> = {}): NativeAuditorProvider {
  const providerConfig: ProviderConfig<NativeAuditorConfig> = {
    id: config.id || 'native-auditor-provider-cb',
    name: config.name || 'NativeAuditorProvider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as NativeAuditorConfig,
    fallback: config.fallback,
  };

  return new NativeAuditorProvider(providerConfig);
}

export default createNativeAuditorProvider;
