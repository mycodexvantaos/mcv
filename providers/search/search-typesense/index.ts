/**
 * Factory function for TypesenseProvider
 */

import { TypesenseProvider } from './typesense-provider-cb';
import type { TypesenseConfig } from './typesense-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { TypesenseProvider } from './typesense-provider-cb';
export type { TypesenseConfig } from './typesense-provider-cb';

/**
 * Create a TypesenseProvider instance with the given configuration.
 */
export function createTypesenseProvider(config: Partial<ProviderConfig<TypesenseConfig>> = {}): TypesenseProvider {
  const providerConfig: ProviderConfig<TypesenseConfig> = {
    id: config.id || 'typesense-provider-cb',
    name: config.name || 'TypesenseProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as TypesenseConfig,
    fallback: config.fallback,
  };

  return new TypesenseProvider(providerConfig);
}

export default createTypesenseProvider;
