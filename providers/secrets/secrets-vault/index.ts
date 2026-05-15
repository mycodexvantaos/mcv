/**
 * Factory function for VaultSecretsProvider
 */

import { VaultSecretsProvider } from './vault-secrets-provider-cb';
import type { VaultSecretsConfig } from './vault-secrets-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { VaultSecretsProvider } from './vault-secrets-provider-cb';
export type { VaultSecretsConfig } from './vault-secrets-provider-cb';

/**
 * Create a VaultSecretsProvider instance with the given configuration.
 */
export function createVaultSecretsProvider(
  config: Partial<ProviderConfig<VaultSecretsConfig>> = {}
): VaultSecretsProvider {
  const providerConfig: ProviderConfig<VaultSecretsConfig> = {
    id: config.id || 'vault-secrets-provider-cb',
    name: config.name || 'VaultSecretsProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as VaultSecretsConfig,
    fallback: config.fallback,
  };

  return new VaultSecretsProvider(providerConfig);
}

export default createVaultSecretsProvider;
