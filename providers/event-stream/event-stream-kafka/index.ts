/**
 * Factory function for EventStreamKafkaProvider
 */

import { EventStreamKafkaProvider } from './event-stream-kafka-provider-cb';
import type { EventStreamKafkaConfig } from './event-stream-kafka-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { EventStreamKafkaProvider } from './event-stream-kafka-provider-cb';
export type { EventStreamKafkaConfig } from './event-stream-kafka-provider-cb';

/**
 * Create a EventStreamKafkaProvider instance with the given configuration.
 */
export function createEventStreamKafkaProvider(config: Partial<ProviderConfig<EventStreamKafkaConfig>> = {}): EventStreamKafkaProvider {
  const providerConfig: ProviderConfig<EventStreamKafkaConfig> = {
    id: config.id || 'event-stream-kafka-provider-cb',
    name: config.name || 'EventStreamKafkaProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as EventStreamKafkaConfig,
    fallback: config.fallback,
  };

  return new EventStreamKafkaProvider(providerConfig);
}

export default createEventStreamKafkaProvider;
