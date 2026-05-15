/**
 * Factory function for TemporalSchedulerProvider
 */

import { TemporalSchedulerProvider } from './temporal-scheduler-provider-cb';
import type { TemporalSchedulerConfig } from './temporal-scheduler-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { TemporalSchedulerProvider } from './temporal-scheduler-provider-cb';
export type { TemporalSchedulerConfig } from './temporal-scheduler-provider-cb';

/**
 * Create a TemporalSchedulerProvider instance with the given configuration.
 */
export function createTemporalSchedulerProvider(config: Partial<ProviderConfig<TemporalSchedulerConfig>> = {}): TemporalSchedulerProvider {
  const providerConfig: ProviderConfig<TemporalSchedulerConfig> = {
    id: config.id || 'temporal-scheduler-provider-cb',
    name: config.name || 'TemporalSchedulerProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as TemporalSchedulerConfig,
    fallback: config.fallback,
  };

  return new TemporalSchedulerProvider(providerConfig);
}

export default createTemporalSchedulerProvider;
