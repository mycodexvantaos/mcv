/**
 * Factory function for SendGridProvider
 */

import { SendGridProvider } from './sendgrid-provider-cb';
import type { SendGridConfig } from './sendgrid-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { SendGridProvider } from './sendgrid-provider-cb';
export type { SendGridConfig } from './sendgrid-provider-cb';

/**
 * Create a SendGridProvider instance with the given configuration.
 */
export function createSendGridProvider(config: Partial<ProviderConfig<SendGridConfig>> = {}): SendGridProvider {
  const providerConfig: ProviderConfig<SendGridConfig> = {
    id: config.id || 'sendgrid-provider-cb',
    name: config.name || 'SendGridProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as SendGridConfig,
    fallback: config.fallback,
  };

  return new SendGridProvider(providerConfig);
}

export default createSendGridProvider;
