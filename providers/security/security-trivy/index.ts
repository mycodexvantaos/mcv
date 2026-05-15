/**
 * Factory function for TrivySecurityProvider
 */

import { TrivySecurityProvider } from './trivy-security-provider-cb';
import type { TrivySecurityConfig } from './trivy-security-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { TrivySecurityProvider } from './trivy-security-provider-cb';
export type { TrivySecurityConfig } from './trivy-security-provider-cb';

/**
 * Create a TrivySecurityProvider instance with the given configuration.
 */
export function createTrivySecurityProvider(
  config: Partial<ProviderConfig<TrivySecurityConfig>> = {}
): TrivySecurityProvider {
  const providerConfig: ProviderConfig<TrivySecurityConfig> = {
    id: config.id || 'trivy-security-provider-cb',
    name: config.name || 'TrivySecurityProvider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as TrivySecurityConfig,
    fallback: config.fallback,
  };

  return new TrivySecurityProvider(providerConfig);
}

export default createTrivySecurityProvider;
