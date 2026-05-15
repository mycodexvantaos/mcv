/**
 * Factory function for OpenTelemetryProvider
 */

import { OpenTelemetryProvider } from './opentelemetry-provider-cb';
import type { OpenTelemetryConfig } from './opentelemetry-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { OpenTelemetryProvider } from './opentelemetry-provider-cb';
export type { OpenTelemetryConfig } from './opentelemetry-provider-cb';

/**
 * Create a OpenTelemetryProvider instance with the given configuration.
 */
export function createOpenTelemetryProvider(config: Partial<ProviderConfig<OpenTelemetryConfig>> = {}): OpenTelemetryProvider {
  const providerConfig: ProviderConfig<OpenTelemetryConfig> = {
    id: config.id || 'opentelemetry-provider-cb',
    name: config.name || 'OpenTelemetryProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as OpenTelemetryConfig,
    fallback: config.fallback,
  };

  return new OpenTelemetryProvider(providerConfig);
}

export default createOpenTelemetryProvider;
