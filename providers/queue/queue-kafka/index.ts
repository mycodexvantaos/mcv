/**
 * Factory function for KafkaQueueProvider
 */

import { KafkaQueueProvider } from './kafka-queue-provider-cb';
import type { KafkaQueueConfig } from './kafka-queue-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { KafkaQueueProvider } from './kafka-queue-provider-cb';
export type { KafkaQueueConfig } from './kafka-queue-provider-cb';

/**
 * Create a KafkaQueueProvider instance with the given configuration.
 */
export function createKafkaQueueProvider(config: Partial<ProviderConfig<KafkaQueueConfig>> = {}): KafkaQueueProvider {
  const providerConfig: ProviderConfig<KafkaQueueConfig> = {
    id: config.id || 'kafka-queue-provider-cb',
    name: config.name || 'KafkaQueueProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as KafkaQueueConfig,
    fallback: config.fallback,
  };

  return new KafkaQueueProvider(providerConfig);
}

export default createKafkaQueueProvider;
