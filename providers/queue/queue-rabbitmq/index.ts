/**
 * Factory function for RabbitMQQueueProvider
 */

import { RabbitMQQueueProvider } from './rabbitmq-queue-provider-cb';
import type { RabbitMQQueueConfig } from './rabbitmq-queue-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { RabbitMQQueueProvider } from './rabbitmq-queue-provider-cb';
export type { RabbitMQQueueConfig } from './rabbitmq-queue-provider-cb';

/**
 * Create a RabbitMQQueueProvider instance with the given configuration.
 */
export function createRabbitMQQueueProvider(config: Partial<ProviderConfig<RabbitMQQueueConfig>> = {}): RabbitMQQueueProvider {
  const providerConfig: ProviderConfig<RabbitMQQueueConfig> = {
    id: config.id || 'rabbitmq-queue-provider-cb',
    name: config.name || 'RabbitMQQueueProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as RabbitMQQueueConfig,
    fallback: config.fallback,
  };

  return new RabbitMQQueueProvider(providerConfig);
}

export default createRabbitMQQueueProvider;
