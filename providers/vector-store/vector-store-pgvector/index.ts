/**
 * Factory function for PgVectorProvider
 */

import { PgVectorProvider } from './pgvector-provider-cb';
import type { PgVectorConfig } from './pgvector-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { PgVectorProvider } from './pgvector-provider-cb';
export type { PgVectorConfig } from './pgvector-provider-cb';

/**
 * Create a PgVectorProvider instance with the given configuration.
 */
export function createPgVectorProvider(config: Partial<ProviderConfig<PgVectorConfig>> = {}): PgVectorProvider {
  const providerConfig: ProviderConfig<PgVectorConfig> = {
    id: config.id || 'pgvector-provider-cb',
    name: config.name || 'PgVectorProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as PgVectorConfig,
    fallback: config.fallback,
  };

  return new PgVectorProvider(providerConfig);
}

export default createPgVectorProvider;
