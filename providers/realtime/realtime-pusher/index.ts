/**
 * Factory function for PusherRealtimeProvider
 */

import { PusherRealtimeProvider } from './pusher-realtime-provider-cb';
import type { PusherRealtimeConfig } from './pusher-realtime-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { PusherRealtimeProvider } from './pusher-realtime-provider-cb';
export type { PusherRealtimeConfig } from './pusher-realtime-provider-cb';

/**
 * Create a PusherRealtimeProvider instance with the given configuration.
 */
export function createPusherRealtimeProvider(
  config: Partial<ProviderConfig<PusherRealtimeConfig>> = {}
): PusherRealtimeProvider {
  const providerConfig: ProviderConfig<PusherRealtimeConfig> = {
    id: config.id || 'pusher-realtime-provider-cb',
    name: config.name || 'PusherRealtimeProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as PusherRealtimeConfig,
    fallback: config.fallback,
  };

  return new PusherRealtimeProvider(providerConfig);
}

export default createPusherRealtimeProvider;
