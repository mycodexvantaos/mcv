/**
 * Factory function for Neo4jGraphProvider
 */

import { Neo4jGraphProvider } from './neo4j-graph-provider-cb';
import type { Neo4jGraphConfig } from './neo4j-graph-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { Neo4jGraphProvider } from './neo4j-graph-provider-cb';
export type { Neo4jGraphConfig } from './neo4j-graph-provider-cb';

/**
 * Create a Neo4jGraphProvider instance with the given configuration.
 */
export function createNeo4jGraphProvider(
  config: Partial<ProviderConfig<Neo4jGraphConfig>> = {}
): Neo4jGraphProvider {
  const providerConfig: ProviderConfig<Neo4jGraphConfig> = {
    id: config.id || 'neo4j-graph-provider-cb',
    name: config.name || 'Neo4jGraphProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as Neo4jGraphConfig,
    fallback: config.fallback,
  };

  return new Neo4jGraphProvider(providerConfig);
}

export default createNeo4jGraphProvider;
