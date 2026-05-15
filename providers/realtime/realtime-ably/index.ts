/**
 * Factory function for AblyRealtimeProvider
 */

import { AblyRealtimeProvider } from './ably-realtime-provider-cb';
import type { AblyRealtimeConfig } from './ably-realtime-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { AblyRealtimeProvider } from './ably-realtime-provider-cb';
export type { AblyRealtimeConfig } from './ably-realtime-provider-cb';

/**
 * Create a AblyRealtimeProvider instance with the given configuration.
 */
export function createAblyRealtimeProvider(config: Partial<ProviderConfig<AblyRealtimeConfig>> = {}): AblyRealtimeProvider {
  const providerConfig: ProviderConfig<AblyRealtimeConfig> = {
    id: config.id || 'ably-realtime-provider-cb',
    name: config.name || 'AblyRealtimeProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as AblyRealtimeConfig,
    fallback: config.fallback,
  };

  return new AblyRealtimeProvider(providerConfig);
}

export default createAblyRealtimeProvider;
