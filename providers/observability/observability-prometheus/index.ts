/**
 * Factory function for PrometheusProvider
 */

import { PrometheusProvider } from './prometheus-provider-cb';
import type { PrometheusConfig } from './prometheus-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { PrometheusProvider } from './prometheus-provider-cb';
export type { PrometheusConfig } from './prometheus-provider-cb';

/**
 * Create a PrometheusProvider instance with the given configuration.
 */
export function createPrometheusProvider(config: Partial<ProviderConfig<PrometheusConfig>> = {}): PrometheusProvider {
  const providerConfig: ProviderConfig<PrometheusConfig> = {
    id: config.id || 'prometheus-provider-cb',
    name: config.name || 'PrometheusProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as PrometheusConfig,
    fallback: config.fallback,
  };

  return new PrometheusProvider(providerConfig);
}

export default createPrometheusProvider;
