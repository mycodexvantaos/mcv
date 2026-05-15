/**
 * Factory function for CloudEventsProvider
 */

import { CloudEventsProvider } from './cloudevents-provider-cb';
import type { CloudEventsConfig } from './cloudevents-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { CloudEventsProvider } from './cloudevents-provider-cb';
export type { CloudEventsConfig } from './cloudevents-provider-cb';

/**
 * Create a CloudEventsProvider instance with the given configuration.
 */
export function createCloudEventsProvider(
  config: Partial<ProviderConfig<CloudEventsConfig>> = {}
): CloudEventsProvider {
  const providerConfig: ProviderConfig<CloudEventsConfig> = {
    id: config.id || 'cloudevents-provider-cb',
    name: config.name || 'CloudEventsProvider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as CloudEventsConfig,
    fallback: config.fallback,
  };

  return new CloudEventsProvider(providerConfig);
}

export default createCloudEventsProvider;
