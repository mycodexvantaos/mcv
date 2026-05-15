/**
 * Factory function for NativeLedgerProvider
 */

import { NativeLedgerProvider } from './native-ledger-provider-cb';
import type { NativeLedgerConfig } from './native-ledger-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { NativeLedgerProvider } from './native-ledger-provider-cb';
export type { NativeLedgerConfig } from './native-ledger-provider-cb';

/**
 * Create a NativeLedgerProvider instance with the given configuration.
 */
export function createNativeLedgerProvider(config: Partial<ProviderConfig<NativeLedgerConfig>> = {}): NativeLedgerProvider {
  const providerConfig: ProviderConfig<NativeLedgerConfig> = {
    id: config.id || 'native-ledger-provider-cb',
    name: config.name || 'NativeLedgerProvider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as NativeLedgerConfig,
    fallback: config.fallback,
  };

  return new NativeLedgerProvider(providerConfig);
}

export default createNativeLedgerProvider;
